const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/overview', authenticateToken, (req, res, next) => {
  try {
    const totalResources = db.prepare('SELECT COUNT(*) AS count FROM resources').get().count;
    const inventoryStats = db.prepare(`
      SELECT SUM(total_quantity) AS total_items,
             SUM(available_quantity) AS total_available,
             SUM(allocated_quantity) AS total_allocated
      FROM resources
    `).get();

    const totalRequests = db.prepare('SELECT COUNT(*) AS count FROM requests').get().count;
    const pendingRequests = db.prepare("SELECT COUNT(*) AS count FROM requests WHERE status = 'pending'").get().count;
    const allocatedRequests = db.prepare("SELECT COUNT(*) AS count FROM requests WHERE status = 'allocated'").get().count;
    const totalVotes = db.prepare('SELECT COUNT(*) AS count FROM votes').get().count;
    const totalUsers = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;

    const urgencyBreakdown = db.prepare(`
      SELECT urgency, COUNT(*) AS count
      FROM requests
      WHERE status = 'pending'
      GROUP BY urgency
    `).all();

    res.json({
      total_resources: totalResources,
      total_items: inventoryStats.total_items || 0,
      total_available: inventoryStats.total_available || 0,
      total_allocated: inventoryStats.total_allocated || 0,
      total_requests: totalRequests,
      pending_requests: pendingRequests,
      allocated_requests: allocatedRequests,
      total_votes: totalVotes,
      total_users: totalUsers,
      urgency_breakdown: urgencyBreakdown
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
