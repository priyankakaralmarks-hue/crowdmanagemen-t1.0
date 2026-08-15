const db = require('../config/database');

const WEIGHTS = {
  URGENCY_MAX: 50,      // 50%
  VOTES_MAX: 30,        // 30%
  AVAILABILITY_MAX: 20  // 20%
};

const URGENCY_POINTS = {
  critical: 50.0,
  high: 37.5,
  medium: 25.0,
  low: 12.5
};

/**
 * Calculate the factor breakdown and explainability details for a single request
 */
function calculateRequestScore(request, maxVotesBenchmark) {
  // 1. Urgency Component (Max 50)
  const urgencyKey = (request.urgency || 'low').toLowerCase();
  const urgencyPoints = URGENCY_POINTS[urgencyKey] || 12.5;

  let urgencyDesc = '';
  if (urgencyKey === 'critical') {
    urgencyDesc = 'Critical urgency level (+50.0 pts): high-impact emergency requirement.';
  } else if (urgencyKey === 'high') {
    urgencyDesc = 'High urgency level (+37.5 pts): time-sensitive organizational need.';
  } else if (urgencyKey === 'medium') {
    urgencyDesc = 'Medium urgency level (+25.0 pts): standard priority allocation.';
  } else {
    urgencyDesc = 'Low urgency level (+12.5 pts): flexible timeline allocation.';
  }

  // 2. Community Votes Component (Max 30)
  const votes = request.votes_count || 0;
  const benchmark = Math.max(5, maxVotesBenchmark || 5);
  let votePoints = 0;
  if (votes > 0) {
    votePoints = Math.min(WEIGHTS.VOTES_MAX, (votes / benchmark) * WEIGHTS.VOTES_MAX);
    votePoints = Math.round(votePoints * 10) / 10;
  }

  let voteDesc = '';
  if (votes >= benchmark) {
    voteDesc = `Strong community backing with ${votes} votes (+${votePoints.toFixed(1)} pts).`;
  } else if (votes > 0) {
    voteDesc = `Moderate community support with ${votes} votes (+${votePoints.toFixed(1)} pts).`;
  } else {
    voteDesc = `No community votes recorded yet (+0.0 pts).`;
  }

  // 3. Resource Availability Component (Max 20)
  const available = request.available_quantity !== undefined ? request.available_quantity : 0;
  const requested = request.requested_quantity || 1;
  let availPoints = 0;
  let availStatus = 'Unavailable';
  let availDesc = '';

  if (available <= 0) {
    availPoints = 0;
    availStatus = 'Out of Stock';
    availDesc = `Resource is completely out of stock (0 available for ${requested} requested). Priority score reduced.`;
  } else if (available < requested) {
    availPoints = 0;
    availStatus = 'Insufficient Stock';
    availDesc = `Insufficient inventory (${available} available vs ${requested} requested). Cannot be fulfilled immediately.`;
  } else {
    // available >= requested
    if (requested <= available * 0.5) {
      availPoints = WEIGHTS.AVAILABILITY_MAX; // 20 pts
      availStatus = 'Sufficient';
      availDesc = `Sufficient stock available (${available} units in inventory for ${requested} requested) (+20.0 pts).`;
    } else {
      // requested takes more than 50% of available stock
      const ratio = (available - requested) / available;
      availPoints = 10 + 10 * ratio;
      availPoints = Math.round(availPoints * 10) / 10;
      availStatus = 'Limited';
      availDesc = `Limited stock margin (${available} units available for ${requested} requested, leaving tight inventory) (+${availPoints.toFixed(1)} pts).`;
    }
  }

  const totalScore = Math.round((urgencyPoints + votePoints + availPoints) * 10) / 10;

  // Synthesized natural language explanation
  let explanation = '';
  if (totalScore >= 80) {
    explanation = `This request is ranked top-tier because it combines ${urgencyKey} urgency (+${urgencyPoints.toFixed(1)}), strong community validation (${votes} votes, +${votePoints.toFixed(1)}), and ${availStatus.toLowerCase()} resource inventory (+${availPoints.toFixed(1)}).`;
  } else if (totalScore >= 60) {
    explanation = `This request holds solid priority with ${urgencyKey} urgency (+${urgencyPoints.toFixed(1)}) and ${votes} community votes (+${votePoints.toFixed(1)}), though ${availStatus.toLowerCase()} inventory availability (+${availPoints.toFixed(1)}) limits peak scoring.`;
  } else if (totalScore >= 40) {
    explanation = `This request has moderate priority with ${urgencyKey} urgency (+${urgencyPoints.toFixed(1)}) and ${votes} votes (+${votePoints.toFixed(1)}).`;
  } else {
    explanation = `This request has low composite score due to ${urgencyKey} urgency, lower community votes (${votes}), and ${availStatus.toLowerCase()} resource constraints.`;
  }

  return {
    priority_score: totalScore,
    explanation,
    breakdown: {
      urgency: {
        level: request.urgency,
        points: urgencyPoints,
        maxPoints: WEIGHTS.URGENCY_MAX,
        description: urgencyDesc
      },
      community: {
        votes: votes,
        points: votePoints,
        maxPoints: WEIGHTS.VOTES_MAX,
        benchmark: benchmark,
        description: voteDesc
      },
      availability: {
        requested: requested,
        available: available,
        status: availStatus,
        points: availPoints,
        maxPoints: WEIGHTS.AVAILABILITY_MAX,
        description: availDesc
      }
    }
  };
}

/**
 * Recalculate rankings for all pending requests across the system.
 * Updates priority_score and ranking_position in the database.
 */
function recalculateRankings() {
  const pendingRequests = db.prepare(`
    SELECT r.*, res.name AS resource_name, res.available_quantity, res.total_quantity, res.category AS resource_category,
           u.name AS user_name, u.email AS user_email
    FROM requests r
    JOIN resources res ON r.resource_id = res.id
    JOIN users u ON r.user_id = u.id
    WHERE r.status = 'pending'
    ORDER BY r.created_at ASC
  `).all();

  if (pendingRequests.length === 0) {
    return [];
  }

  // Find max votes in the pending pool for relative normalization
  const maxVotes = pendingRequests.reduce((max, r) => Math.max(max, r.votes_count || 0), 0);

  // Compute scores for each
  const scored = pendingRequests.map(req => {
    const calculation = calculateRequestScore(req, maxVotes);
    return {
      ...req,
      priority_score: calculation.priority_score,
      explanation: calculation.explanation,
      breakdown: calculation.breakdown
    };
  });

  // Sort descending by priority_score, tiebreak by created_at (earliest first)
  scored.sort((a, b) => {
    if (b.priority_score !== a.priority_score) {
      return b.priority_score - a.priority_score;
    }
    return new Date(a.created_at) - new Date(b.created_at);
  });

  // Update rankings in database using a transaction
  const updateStmt = db.prepare(`
    UPDATE requests
    SET priority_score = ?, ranking_position = ?
    WHERE id = ?
  `);

  const updateAll = db.transaction((list) => {
    list.forEach((item, index) => {
      const rank = index + 1;
      item.ranking_position = rank;
      updateStmt.run(item.priority_score, rank, item.id);
    });
  });

  updateAll(scored);

  return scored;
}

/**
 * Get full explainability details for a specific request ID (pending or allocated)
 */
function getRequestExplanation(requestId) {
  const req = db.prepare(`
    SELECT r.*, res.name AS resource_name, res.available_quantity, res.total_quantity, res.category AS resource_category,
           u.name AS user_name, u.email AS user_email
    FROM requests r
    JOIN resources res ON r.resource_id = res.id
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `).get(requestId);

  if (!req) return null;

  const maxVotesRow = db.prepare(`
    SELECT MAX(votes_count) AS max_votes FROM requests WHERE status = 'pending'
  `).get();
  const maxVotes = maxVotesRow ? (maxVotesRow.max_votes || 0) : 0;

  const calculation = calculateRequestScore(req, maxVotes);

  return {
    ...req,
    priority_score: req.status === 'pending' ? calculation.priority_score : req.priority_score,
    ranking_position: req.ranking_position,
    explanation: calculation.explanation,
    breakdown: calculation.breakdown,
    weights_formula: {
      urgency_weight: '50% (Max 50.0 pts)',
      community_weight: '30% (Max 30.0 pts)',
      availability_weight: '20% (Max 20.0 pts)',
      formula: 'Priority Score = Urgency Points + Community Vote Points + Resource Availability Points'
    }
  };
}

module.exports = {
  WEIGHTS,
  URGENCY_POINTS,
  calculateRequestScore,
  recalculateRankings,
  getRequestExplanation
};
