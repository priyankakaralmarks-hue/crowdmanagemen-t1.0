const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { recalculateRankings, getRequestExplanation, WEIGHTS } = require('../services/rankingService');

// Get full ranked leaderboard of pending requests
router.get('/', authenticateToken, (req, res, next) => {
  try {
    const { resource_id } = req.query;

    // Recalculate to ensure absolute fresh state
    const rankedAll = recalculateRankings();

    let filtered = rankedAll;
    if (resource_id) {
      filtered = rankedAll.filter(r => r.resource_id === parseInt(resource_id, 10));
    }

    res.json({
      total: filtered.length,
      weights: WEIGHTS,
      ranking: filtered
    });
  } catch (err) {
    next(err);
  }
});

// Get detailed explanation breakdown for a specific request
router.get('/explain/:requestId', authenticateToken, (req, res, next) => {
  try {
    const requestId = parseInt(req.params.requestId, 10);
    const explanation = getRequestExplanation(requestId);

    if (!explanation) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    res.json({ explanation });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
