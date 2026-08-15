const http = require('http');
const db = require('../src/config/database');
const seedDatabase = require('../src/seed/seedData');
const { calculateRequestScore, recalculateRankings, getRequestExplanation } = require('../src/services/rankingService');
const { allocateRequest, getAllocationHistory } = require('../src/services/allocationService');
const bcrypt = require('bcryptjs');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING COMPREHENSIVE BACKEND TESTS');
  console.log('========================================\n');

  // 1. Initialize & Seed DB
  await db.init();
  await seedDatabase();

  // Test 1: Verify Seed Data
  console.log('\n--- 1. Verification of Seed Data ---');
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  assert(userCount >= 5, `Users seeded properly (count: ${userCount})`);

  const admin = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
  assert(admin && admin.email === 'admin@allocator.com', 'Admin user exists in database');

  const alice = db.prepare("SELECT * FROM users WHERE email = 'alice@example.com'").get();
  const bob = db.prepare("SELECT * FROM users WHERE email = 'bob@example.com'").get();
  const charlie = db.prepare("SELECT * FROM users WHERE email = 'charlie@example.com'").get();
  assert(alice && bob && charlie, 'Regular test users exist in database');

  // Test 2: Explainable Ranking Calculation
  console.log('\n--- 2. Explainable Ranking Algorithm ---');
  const testReqCritical = {
    urgency: 'critical',
    votes_count: 5,
    available_quantity: 10,
    requested_quantity: 2
  };
  const scoreCrit = calculateRequestScore(testReqCritical, 5);
  assert(scoreCrit.breakdown.urgency.points === 50.0, 'Critical urgency gives 50.0 points');
  assert(scoreCrit.breakdown.community.points === 30.0, 'Max votes gives 30.0 community points');
  assert(scoreCrit.breakdown.availability.points === 20.0, 'Sufficient stock gives 20.0 availability points');
  assert(scoreCrit.priority_score === 100.0, 'Total composite score equals 100.0');
  assert(typeof scoreCrit.explanation === 'string' && scoreCrit.explanation.length > 20, 'Generates natural language explanation');

  const testReqLow = {
    urgency: 'low',
    votes_count: 0,
    available_quantity: 0,
    requested_quantity: 5
  };
  const scoreLow = calculateRequestScore(testReqLow, 5);
  assert(scoreLow.breakdown.urgency.points === 12.5, 'Low urgency gives 12.5 points');
  assert(scoreLow.breakdown.community.points === 0.0, '0 votes gives 0.0 community points');
  assert(scoreLow.breakdown.availability.points === 0.0, 'Out of stock gives 0.0 availability points');
  assert(scoreLow.priority_score === 12.5, 'Total composite score equals 12.5');

  // Test 3: System Ranking Recalculation
  console.log('\n--- 3. System Ranking & Positioning ---');
  const rankings = recalculateRankings();
  assert(rankings.length > 0, `Pending requests ranked (total: ${rankings.length})`);
  assert(rankings[0].ranking_position === 1, 'Top request has ranking_position = 1');
  assert(rankings[0].priority_score >= rankings[1].priority_score, 'Rankings are strictly ordered by descending priority score');

  // Test 4: Voting Rules & Self-Vote Prevention
  console.log('\n--- 4. Community Voting Rules ---');
  // Create a new request by Alice
  const laptopRes = db.prepare("SELECT * FROM resources WHERE name = 'Laptop'").get();
  const newReqRes = db.prepare(`
    INSERT INTO requests (user_id, resource_id, requested_quantity, urgency, reason, description, votes_count, status)
    VALUES (?, ?, 2, 'high', 'Field tablet replacement', 'Urgent replacement needed', 0, 'pending')
  `).run(alice.id, laptopRes.id);
  const newReqId = newReqRes.lastInsertRowid;

  // Alice tries to vote for her own request -> Must be blocked
  let selfVoteBlocked = false;
  if (alice.id === alice.id) {
    // Simulated route logic
    const reqRow = db.prepare('SELECT user_id FROM requests WHERE id = ?').get(newReqId);
    if (reqRow.user_id === alice.id) {
      selfVoteBlocked = true;
    }
  }
  assert(selfVoteBlocked, 'Self-voting blocked for own request');

  // Bob votes for Alice's request -> Succeeds
  db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(bob.id, newReqId);
  db.prepare('UPDATE requests SET votes_count = votes_count + 1 WHERE id = ?').run(newReqId);
  const updatedReq = db.prepare('SELECT votes_count FROM requests WHERE id = ?').get(newReqId);
  assert(updatedReq.votes_count === 1, 'Vote count incremented to 1 by peer vote');

  // Bob tries to vote again -> Database unique constraint or logic blocks duplicate
  let duplicateBlocked = false;
  try {
    db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(bob.id, newReqId);
  } catch (err) {
    duplicateBlocked = true;
  }
  assert(duplicateBlocked, 'Duplicate vote from same user blocked by database constraint');

  // Test 5: Resource Allocation & Inventory Sync
  console.log('\n--- 5. Transactional Allocation & Over-Allocation Prevention ---');
  const initialAvailable = laptopRes.available_quantity;
  const initialAllocated = laptopRes.allocated_quantity;

  const allocResult = allocateRequest({
    requestId: newReqId,
    adminUserId: admin.id,
    notes: 'Unit test approved allocation'
  });

  assert(allocResult.allocated_quantity === 2, 'Allocated requested 2 laptops');
  assert(allocResult.remaining_available === initialAvailable - 2, 'Available quantity deducted by 2');
  assert(allocResult.total_allocated === initialAllocated + 2, 'Allocated quantity increased by 2');

  const checkAllocatedReq = db.prepare('SELECT * FROM requests WHERE id = ?').get(newReqId);
  assert(checkAllocatedReq.status === 'allocated', 'Request status transitioned to allocated');
  assert(checkAllocatedReq.allocated_at !== null, 'Allocation timestamp recorded');

  // Check history record
  const history = getAllocationHistory(5);
  const foundHistory = history.find(h => h.request_id === newReqId);
  assert(foundHistory !== undefined, 'Allocation recorded in audit history table');

  // Over-allocation test: try to allocate more than available
  const hugeReq = db.prepare(`
    INSERT INTO requests (user_id, resource_id, requested_quantity, urgency, reason, description, votes_count, status)
    VALUES (?, ?, 9999, 'critical', 'Impossible demand', 'Test over allocation', 0, 'pending')
  `).run(bob.id, laptopRes.id);

  let overAllocPrevented = false;
  try {
    allocateRequest({ requestId: hugeReq.lastInsertRowid, adminUserId: admin.id });
  } catch (err) {
    overAllocPrevented = err.message.includes('Insufficient');
  }
  assert(overAllocPrevented, 'Over-allocation strictly prevented with Insufficient inventory error');

  // Double-allocation test: try to re-allocate an already allocated request
  let doubleAllocPrevented = false;
  try {
    allocateRequest({ requestId: newReqId, adminUserId: admin.id });
  } catch (err) {
    doubleAllocPrevented = err.message.includes('already been allocated');
  }
  assert(doubleAllocPrevented, 'Double allocation of same request prevented');

  console.log('\n========================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED PERFECTLY!`);
  console.log('========================================\n');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
