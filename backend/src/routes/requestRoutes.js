const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { recalculateRankings, getRequestExplanation } = require('../services/rankingService');

// Submit a new resource request (User or Admin)
router.post('/', authenticateToken, (req, res, next) => {
  try {
    const { resource_id, requested_quantity, urgency, reason, description } = req.body;
    const userId = req.user.id;

    if (!resource_id || !requested_quantity || !urgency || !reason) {
      return res.status(400).json({ error: 'Resource, quantity, urgency, and reason are required.' });
    }

    const qty = parseInt(requested_quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Requested quantity must be a positive integer greater than 0.' });
    }

    const validUrgencies = ['low', 'medium', 'high', 'critical'];
    const cleanUrgency = urgency.toLowerCase();
    if (!validUrgencies.includes(cleanUrgency)) {
      return res.status(400).json({ error: `Urgency must be one of: ${validUrgencies.join(', ')}.` });
    }

    // Verify resource exists
    const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(resource_id);
    if (!resource) {
      return res.status(404).json({ error: 'Selected resource does not exist.' });
    }

    // Insert request
    const result = db.prepare(`
      INSERT INTO requests (
        user_id,
        resource_id,
        requested_quantity,
        urgency,
        reason,
        description,
        votes_count,
        priority_score,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'pending')
    `).run(
      userId,
      resource_id,
      qty,
      cleanUrgency,
      reason.trim(),
      description ? description.trim() : ''
    );

    const requestId = result.lastInsertRowid;

    // Recalculate rankings immediately across all pending requests
    recalculateRankings();

    const created = getRequestExplanation(requestId);

    res.status(201).json({
      message: 'Resource request submitted successfully and queued in explainable ranking engine.',
      request: created
    });
  } catch (err) {
    next(err);
  }
});

// Get user's own requests
router.get('/my-requests', authenticateToken, (req, res, next) => {
  try {
    const userId = req.user.id;
    const requests = db.prepare(`
      SELECT r.*, res.name AS resource_name, res.category AS resource_category, res.available_quantity, res.total_quantity
      FROM requests r
      JOIN resources res ON r.resource_id = res.id
      WHERE r.user_id = ?
      ORDER BY 
        CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
        r.ranking_position ASC,
        r.created_at DESC
    `).all(userId);

    const enriched = requests.map(reqRow => getRequestExplanation(reqRow.id));

    res.json({ requests: enriched });
  } catch (err) {
    next(err);
  }
});

// Get all requests (Admin or filtered)
router.get('/', authenticateToken, (req, res, next) => {
  try {
    const { resource_id, urgency, status, search } = req.query;

    let query = `
      SELECT r.*, res.name AS resource_name, res.category AS resource_category, res.available_quantity, res.total_quantity,
             u.name AS user_name, u.email AS user_email
      FROM requests r
      JOIN resources res ON r.resource_id = res.id
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (resource_id) {
      query += ' AND r.resource_id = ?';
      params.push(resource_id);
    }
    if (urgency) {
      query += ' AND r.urgency = ?';
      params.push(urgency.toLowerCase());
    }
    if (status) {
      query += ' AND r.status = ?';
      params.push(status.toLowerCase());
    }
    if (search) {
      query += ' AND (res.name LIKE ? OR r.reason LIKE ? OR u.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += `
      ORDER BY 
        CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
        r.ranking_position ASC,
        r.priority_score DESC,
        r.created_at DESC
    `;

    const requests = db.prepare(query).all(...params);
    const enriched = requests.map(r => getRequestExplanation(r.id));

    res.json({ requests: enriched });
  } catch (err) {
    next(err);
  }
});

// Get single request details & explanation breakdown
router.get('/:id', authenticateToken, (req, res, next) => {
  try {
    const explanation = getRequestExplanation(req.params.id);
    if (!explanation) {
      return res.status(404).json({ error: 'Request not found.' });
    }
    res.json({ request: explanation });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
