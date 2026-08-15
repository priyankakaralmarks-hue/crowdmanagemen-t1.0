const db = require('../config/database');
const { recalculateRankings } = require('./rankingService');

/**
 * Perform atomic allocation of a request by an Admin.
 * Handles validation, stock deduction, request status update, audit logging,
 * and ranking recalculation in a single SQLite transaction.
 */
function allocateRequest({ requestId, adminUserId, notes = '' }) {
  // Use a transaction for ACID safety
  const performAllocation = db.transaction(() => {
    // 1. Fetch request with row lock / current state
    const request = db.prepare(`
      SELECT r.*, res.name AS resource_name, res.available_quantity, res.allocated_quantity, res.total_quantity
      FROM requests r
      JOIN resources res ON r.resource_id = res.id
      WHERE r.id = ?
    `).get(requestId);

    if (!request) {
      throw new Error(`Request with ID #${requestId} not found.`);
    }

    if (request.status === 'allocated') {
      throw new Error(`Request #${requestId} has already been allocated on ${request.allocated_at}.`);
    }

    if (request.status === 'rejected') {
      throw new Error(`Request #${requestId} has been rejected and cannot be allocated.`);
    }

    // 2. Validate availability
    if (request.available_quantity < request.requested_quantity) {
      throw new Error(
        `Insufficient resource inventory. Available: ${request.available_quantity}, Requested: ${request.requested_quantity}. Cannot complete allocation.`
      );
    }

    const newAvailable = request.available_quantity - request.requested_quantity;
    const newAllocated = request.allocated_quantity + request.requested_quantity;
    const newResourceStatus = newAvailable === 0 ? 'out_of_stock' : 'available';

    // 3. Update Resource Inventory
    db.prepare(`
      UPDATE resources
      SET available_quantity = ?,
          allocated_quantity = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newAvailable, newAllocated, newResourceStatus, request.resource_id);

    // 4. Update Request Status
    db.prepare(`
      UPDATE requests
      SET status = 'allocated',
          allocated_at = CURRENT_TIMESTAMP,
          ranking_position = NULL
      WHERE id = ?
    `).run(requestId);

    // 5. Insert into Allocation Audit Log
    const logResult = db.prepare(`
      INSERT INTO allocations (
        request_id,
        resource_id,
        user_id,
        allocated_quantity,
        allocated_by_user_id,
        notes,
        allocated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      requestId,
      request.resource_id,
      request.user_id,
      request.requested_quantity,
      adminUserId,
      notes || `Allocated by Admin #${adminUserId}`
    );

    return {
      allocation_id: logResult.lastInsertRowid,
      request_id: requestId,
      resource_id: request.resource_id,
      resource_name: request.resource_name,
      user_id: request.user_id,
      allocated_quantity: request.requested_quantity,
      remaining_available: newAvailable,
      total_allocated: newAllocated,
      allocated_at: new Date().toISOString()
    };
  });

  const result = performAllocation();

  // 6. Recalculate rankings for remaining pending requests after inventory change
  recalculateRankings();

  return result;
}

/**
 * Get full allocation history with user, admin, and resource details
 */
function getAllocationHistory(limit = 100) {
  return db.prepare(`
    SELECT a.id AS allocation_id,
           a.allocated_quantity,
           a.allocated_at,
           a.notes,
           r.id AS request_id,
           r.urgency,
           r.reason,
           res.id AS resource_id,
           res.name AS resource_name,
           res.category AS resource_category,
           u.id AS recipient_user_id,
           u.name AS recipient_name,
           u.email AS recipient_email,
           admin.id AS admin_id,
           admin.name AS admin_name,
           admin.email AS admin_email
    FROM allocations a
    JOIN requests r ON a.request_id = r.id
    JOIN resources res ON a.resource_id = res.id
    JOIN users u ON a.user_id = u.id
    JOIN users admin ON a.allocated_by_user_id = admin.id
    ORDER BY a.allocated_at DESC
    LIMIT ?
  `).all(limit);
}

module.exports = {
  allocateRequest,
  getAllocationHistory
};
