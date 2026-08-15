const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { recalculateRankings } = require('../services/rankingService');

async function seedDatabase() {
  await db.init();

  console.log('🌱 Seeding database...');

  // Clear existing records in correct order
  db.exec(`
    DELETE FROM allocations;
    DELETE FROM votes;
    DELETE FROM requests;
    DELETE FROM resources;
    DELETE FROM users;
  `);

  const pwHashAdmin = bcrypt.hashSync('admin123', 10);
  const pwHashUser = bcrypt.hashSync('user123', 10);

  // 1. Seed Users
  const userAdmin = db.prepare(`
    INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)
  `).run('Admin Officer', 'admin@allocator.com', pwHashAdmin, 'admin');

  const userAlice = db.prepare(`
    INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)
  `).run('Alice Green', 'alice@example.com', pwHashUser, 'user');

  const userBob = db.prepare(`
    INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)
  `).run('Bob Vance', 'bob@example.com', pwHashUser, 'user');

  const userCharlie = db.prepare(`
    INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)
  `).run('Dr. Charlie Kelly', 'charlie@example.com', pwHashUser, 'user');

  const userDiana = db.prepare(`
    INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)
  `).run('Diana Prince', 'diana@example.com', pwHashUser, 'user');

  // 2. Seed Resources
  const resLaptop = db.prepare(`
    INSERT INTO resources (name, category, description, total_quantity, available_quantity, allocated_quantity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Laptop',
    'IT Equipment',
    'Standard high-spec laptop for field coordination and data processing',
    20,
    12,
    8,
    'available'
  );

  const resMedKit = db.prepare(`
    INSERT INTO resources (name, category, description, total_quantity, available_quantity, allocated_quantity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Emergency Medical Kit',
    'Healthcare',
    'Comprehensive trauma and first-aid supplies for mobile response teams',
    15,
    9,
    6,
    'available'
  );

  const resGenerator = db.prepare(`
    INSERT INTO resources (name, category, description, total_quantity, available_quantity, allocated_quantity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Portable Generator (5kVA)',
    'Power & Energy',
    'Fuel-efficient generator for emergency lighting and essential clinic power',
    8,
    3,
    5,
    'available'
  );

  const resWaterFilter = db.prepare(`
    INSERT INTO resources (name, category, description, total_quantity, available_quantity, allocated_quantity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Water Filtration Unit',
    'Sanitation',
    'Rapid purification filter capable of 500 liters/day for community hubs',
    25,
    18,
    7,
    'available'
  );

  // 3. Seed Requests
  // Request 1: Critical Urgency (Alice for 2 Laptops)
  const req1 = db.prepare(`
    INSERT INTO requests (user_id, resource_id, requested_quantity, urgency, reason, description, votes_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    userAlice.lastInsertRowid,
    resLaptop.lastInsertRowid,
    2,
    'critical',
    'Emergency intake center setup after severe flooding in Sector 4',
    'We need 2 laptops immediately to register displaced families and coordinate food dispatch.',
    4
  );

  // Request 2: High Urgency (Charlie for 2 Medical Kits)
  const req2 = db.prepare(`
    INSERT INTO requests (user_id, resource_id, requested_quantity, urgency, reason, description, votes_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    userCharlie.lastInsertRowid,
    resMedKit.lastInsertRowid,
    2,
    'high',
    'Mobile outreach clinic serving 120 vulnerable patients this weekend',
    'Current supply depleted during triage yesterday; need sterile surgical kits.',
    3
  );

  // Request 3: Medium Urgency (Bob for 3 Laptops)
  const req3 = db.prepare(`
    INSERT INTO requests (user_id, resource_id, requested_quantity, urgency, reason, description, votes_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    userBob.lastInsertRowid,
    resLaptop.lastInsertRowid,
    3,
    'medium',
    'Volunteer training workshop on disaster mapping tools',
    'Training 15 new volunteers next Tuesday for geospatial survey work.',
    2
  );

  // Request 4: Critical Urgency (Diana for 1 Generator)
  const req4 = db.prepare(`
    INSERT INTO requests (user_id, resource_id, requested_quantity, urgency, reason, description, votes_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    userDiana.lastInsertRowid,
    resGenerator.lastInsertRowid,
    1,
    'critical',
    'Refrigerated medicine storage power failure in North Clinic',
    'Insulin and vaccines are at risk of spoiling within 6 hours due to grid cut.',
    5
  );

  // Request 5: Low Urgency (Bob for 1 Water Filter)
  const req5 = db.prepare(`
    INSERT INTO requests (user_id, resource_id, requested_quantity, urgency, reason, description, votes_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    userBob.lastInsertRowid,
    resWaterFilter.lastInsertRowid,
    1,
    'low',
    'Routine maintenance station filter upgrade',
    'Proactive replacement for outpost station B before rainy season.',
    0
  );

  // 4. Seed Votes (Respecting no-self-voting and unique vote per user)
  // Votes for Req 1 (Alice's request voted by Bob, Charlie, Diana, Admin)
  db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(userBob.lastInsertRowid, req1.lastInsertRowid);
  db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(userCharlie.lastInsertRowid, req1.lastInsertRowid);
  db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(userDiana.lastInsertRowid, req1.lastInsertRowid);
  db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(userAdmin.lastInsertRowid, req1.lastInsertRowid);

  // Votes for Req 2 (Charlie's request voted by Alice, Bob, Diana)
  db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(userAlice.lastInsertRowid, req2.lastInsertRowid);
  db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(userBob.lastInsertRowid, req2.lastInsertRowid);
  db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(userDiana.lastInsertRowid, req2.lastInsertRowid);

  // Votes for Req 3 (Bob's request voted by Alice, Charlie)
  db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(userAlice.lastInsertRowid, req3.lastInsertRowid);
  db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(userCharlie.lastInsertRowid, req3.lastInsertRowid);

  // Votes for Req 4 (Diana's request voted by Alice, Bob, Charlie, Admin, etc.)
  db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(userAlice.lastInsertRowid, req4.lastInsertRowid);
  db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(userBob.lastInsertRowid, req4.lastInsertRowid);
  db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(userCharlie.lastInsertRowid, req4.lastInsertRowid);
  db.prepare('INSERT INTO votes (user_id, request_id) VALUES (?, ?)').run(userAdmin.lastInsertRowid, req4.lastInsertRowid);

  // 5. Seed an already allocated past request & history log
  const pastReq = db.prepare(`
    INSERT INTO requests (user_id, resource_id, requested_quantity, urgency, reason, description, votes_count, priority_score, status, allocated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'allocated', datetime('now', '-2 days'))
  `).run(
    userAlice.lastInsertRowid,
    resLaptop.lastInsertRowid,
    4,
    'critical',
    'Rapid Response command trailer setup',
    'Dispatched initial 4 laptops for regional coordination center.',
    6,
    94.5
  );

  db.prepare(`
    INSERT INTO allocations (request_id, resource_id, user_id, allocated_quantity, allocated_by_user_id, notes, allocated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-2 days'))
  `).run(
    pastReq.lastInsertRowid,
    resLaptop.lastInsertRowid,
    userAlice.lastInsertRowid,
    4,
    userAdmin.lastInsertRowid,
    'Approved and issued from Central Depot by Admin Officer'
  );

  // 6. Recalculate rankings across all pending requests
  const ranked = recalculateRankings();
  console.log(`✅ Database seeded successfully with ${ranked.length} ranked pending requests!`);
}

if (require.main === module) {
  seedDatabase().catch(err => {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  });
}

module.exports = seedDatabase;
