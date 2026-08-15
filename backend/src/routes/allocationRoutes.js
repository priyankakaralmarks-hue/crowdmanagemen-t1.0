const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { allocateRequest, getAllocationHistory } = require('../services/allocationService');

// Admin: Allocate resources to a request
router.post('/:requestId', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const requestId = parseInt(req.params.requestId, 10);
    const adminUserId = req.user.id;
    const { notes } = req.body;

    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID.' });
    }

    const allocation = allocateRequest({
      requestId,
      adminUserId,
      notes: notes || `Approved and allocated by Admin (${req.user.name})`
    });

    res.status(200).json({
      message: `Resource '${allocation.resource_name}' successfully allocated! (${allocation.allocated_quantity} units).`,
      allocation
    });
  } catch (err) {
    if (err.message.includes('Insufficient') || err.message.includes('already been allocated') || err.message.includes('not found')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// Get allocation audit history
router.get('/history', authenticateToken, (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const history = getAllocationHistory(limit);

    res.json({
      total: history.length,
      history
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
