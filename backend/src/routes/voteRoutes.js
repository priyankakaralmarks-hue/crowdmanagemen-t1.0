const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { recalculateRankings, getRequestExplanation } = require('../services/rankingService');

// Cast a vote for a request
router.post('/:requestId', authenticateToken, (req, res, next) => {
  try {
    const requestId = parseInt(req.params.requestId, 10);
    const userId = req.user.id;

    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID.' });
    }

    // 1. Fetch the request
    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Cannot vote on a request with status '${request.status}'.` });
    }

    // 2. Rule: User cannot vote for their own request
    if (request.user_id === userId) {
      return res.status(400).json({
        error: 'You cannot vote for your own request.'
      });
    }

    // 3. Rule: User can vote only once per request (backend check)
    const existingVote = db.prepare('SELECT id FROM votes WHERE user_id = ? AND request_id = ?').get(userId, requestId);
    if (existingVote) {
      return res.status(409).json({
        error: 'You have already voted for this request.'
      });
    }

    // 4. Record vote & update votes_count atomically
    db.transaction(() => {
      db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(userId, requestId);
      db.prepare('UPDATE requests SET votes_count = votes_count + 1 WHERE id = ?').run(requestId);
    })();

    // 5. Recalculate ranking positions across the system
    recalculateRankings();

    const updatedRequest = getRequestExplanation(requestId);

    res.status(200).json({
      message: 'Vote cast successfully!',
      request: updatedRequest,
      voted: true
    });
  } catch (err) {
    next(err);
  }
});

// Remove / withdraw a vote
router.delete('/:requestId', authenticateToken, (req, res, next) => {
  try {
    const requestId = parseInt(req.params.requestId, 10);
    const userId = req.user.id;

    const existingVote = db.prepare('SELECT id FROM votes WHERE user_id = ? AND request_id = ?').get(userId, requestId);
    if (!existingVote) {
      return res.status(404).json({ error: 'You have not voted for this request.' });
    }

    db.transaction(() => {
      db.prepare('DELETE FROM votes WHERE id = ?').run(existingVote.id);
      db.prepare('UPDATE requests SET votes_count = MAX(0, votes_count - 1) WHERE id = ?').run(requestId);
    })();

    recalculateRankings();

    const updatedRequest = getRequestExplanation(requestId);

    res.json({
      message: 'Vote removed.',
      request: updatedRequest,
      voted: false
    });
  } catch (err) {
    next(err);
  }
});

// Get all request IDs the current user has voted on
router.get('/my-votes', authenticateToken, (req, res, next) => {
  try {
    const userId = req.user.id;
    const votes = db.prepare('SELECT request_id FROM votes WHERE user_id = ?').all(userId);
    const votedRequestIds = votes.map(v => v.request_id);

    res.json({ votedRequestIds });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
