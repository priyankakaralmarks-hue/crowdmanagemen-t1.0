const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { recalculateRankings } = require('../services/rankingService');

// Get all resources
router.get('/', authenticateToken, (req, res, next) => {
  try {
    const resources = db.prepare(`
      SELECT r.*,
             (SELECT COUNT(*) FROM requests req WHERE req.resource_id = r.id AND req.status = 'pending') AS pending_requests_count,
             (SELECT COUNT(*) FROM requests req WHERE req.resource_id = r.id AND req.status = 'allocated') AS fulfilled_requests_count
      FROM resources r
      ORDER BY r.name ASC
    `).all();

    res.json({ resources });
  } catch (err) {
    next(err);
  }
});

// Get single resource
router.get('/:id', authenticateToken, (req, res, next) => {
  try {
    const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }
    res.json({ resource });
  } catch (err) {
    next(err);
  }
});

// Admin: Create resource
router.post('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { name, category, description, total_quantity, available_quantity } = req.body;

    if (!name || total_quantity === undefined || total_quantity < 0) {
      return res.status(400).json({ error: 'Resource name and valid total quantity (>= 0) are required.' });
    }

    const total = parseInt(total_quantity, 10);
    const available = available_quantity !== undefined ? parseInt(available_quantity, 10) : total;

    if (available > total || available < 0) {
      return res.status(400).json({ error: 'Available quantity cannot be negative or exceed total quantity.' });
    }

    const status = available === 0 ? 'out_of_stock' : 'available';

    const result = db.prepare(`
      INSERT INTO resources (name, category, description, total_quantity, available_quantity, allocated_quantity, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      category ? category.trim() : 'General',
      description ? description.trim() : '',
      total,
      available,
      total - available,
      status
    );

    const newResource = db.prepare('SELECT * FROM resources WHERE id = ?').get(result.lastInsertRowid);

    // Recalculate rankings in case pending requests can now score on availability
    recalculateRankings();

    res.status(201).json({
      message: 'Resource created successfully.',
      resource: newResource
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Edit resource
router.put('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const resourceId = req.params.id;
    const { name, category, description, total_quantity, available_quantity, status } = req.body;

    const existing = db.prepare('SELECT * FROM resources WHERE id = ?').get(resourceId);
    if (!existing) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    const newTotal = total_quantity !== undefined ? parseInt(total_quantity, 10) : existing.total_quantity;
    const newAvailable = available_quantity !== undefined ? parseInt(available_quantity, 10) : existing.available_quantity;

    if (newTotal < 0 || newAvailable < 0) {
      return res.status(400).json({ error: 'Quantities cannot be negative.' });
    }

    if (newAvailable > newTotal) {
      return res.status(400).json({ error: 'Available quantity cannot exceed total quantity.' });
    }

    const calculatedAllocated = Math.max(0, newTotal - newAvailable);
    const newStatus = status || (newAvailable === 0 ? 'out_of_stock' : 'available');

    db.prepare(`
      UPDATE resources
      SET name = ?,
          category = ?,
          description = ?,
          total_quantity = ?,
          available_quantity = ?,
          allocated_quantity = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name !== undefined ? name.trim() : existing.name,
      category !== undefined ? category.trim() : existing.category,
      description !== undefined ? description.trim() : existing.description,
      newTotal,
      newAvailable,
      calculatedAllocated,
      newStatus,
      resourceId
    );

    const updated = db.prepare('SELECT * FROM resources WHERE id = ?').get(resourceId);

    // Dynamic ranking recalculation
    recalculateRankings();

    res.json({
      message: 'Resource updated successfully.',
      resource: updated
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Delete resource
router.delete('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const resourceId = req.params.id;
    const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(resourceId);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    // Check if there are active requests or allocations
    const activeRequests = db.prepare('SELECT COUNT(*) AS count FROM requests WHERE resource_id = ?').get(resourceId);
    const activeAllocations = db.prepare('SELECT COUNT(*) AS count FROM allocations WHERE resource_id = ?').get(resourceId);

    if (activeRequests.count > 0 || activeAllocations.count > 0) {
      return res.status(400).json({
        error: `Cannot delete resource '${resource.name}' because it has ${activeRequests.count} request(s) and ${activeAllocations.count} allocation history record(s).`
      });
    }

    db.prepare('DELETE FROM resources WHERE id = ?').run(resourceId);
    recalculateRankings();

    res.json({ message: `Resource '${resource.name}' deleted successfully.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
