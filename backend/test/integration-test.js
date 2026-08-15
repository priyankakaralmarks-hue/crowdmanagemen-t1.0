const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: data, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`❌ HTTP TEST FAIL: ${message}`);
    throw new Error(message);
  }
  passed++;
  console.log(`✅ HTTP TEST PASS: ${message}`);
}

async function runHttpTests() {
  console.log('\n=============================================');
  console.log('🌐 RUNNING END-TO-END HTTP INTEGRATION TESTS');
  console.log('=============================================\n');

  // 1. Health check
  const health = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  assert(health.status === 200 && health.data.status === 'online', 'Health endpoint returns 200 OK & online status');

  // 2. Admin Login
  const adminLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@allocator.com', password: 'admin123' });
  assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin logs in and receives JWT token');
  const adminToken = adminLogin.data.token;

  // 3. Alice (User) Login
  const aliceLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'alice@example.com', password: 'user123' });
  assert(aliceLogin.status === 200 && aliceLogin.data.token, 'Alice logs in and receives JWT token');
  const aliceToken = aliceLogin.data.token;

  // 4. Bob (User) Login
  const bobLogin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'bob@example.com', password: 'user123' });
  assert(bobLogin.status === 200 && bobLogin.data.token, 'Bob logs in and receives JWT token');
  const bobToken = bobLogin.data.token;

  // 5. Admin adds a new resource
  const addRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/resources',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    name: 'Satellite Communication Dish',
    category: 'IT Hardware',
    description: 'High-speed Starlink field satellite terminal',
    total_quantity: 6,
    available_quantity: 6
  });
  assert(addRes.status === 201 && addRes.data.resource.id, 'Admin adds Satellite Dish resource (6 units)');
  const dishId = addRes.data.resource.id;

  // 6. User blocks: non-admin trying to add resource -> 403 Forbidden
  const forbiddenAdd = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/resources',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceToken}`
    }
  }, { name: 'Unauthorized Device', total_quantity: 1 });
  assert(forbiddenAdd.status === 403, 'Normal user blocked from adding resources (403 Forbidden)');

  // 7. Alice submits Critical Request for 2 Satellite Dishes
  const aliceReq = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/requests',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceToken}`
    }
  }, {
    resource_id: dishId,
    requested_quantity: 2,
    urgency: 'critical',
    reason: 'Emergency search and rescue connectivity in remote mountains',
    description: 'Grid communication down; need satellite link for rescue teams.'
  });
  assert(aliceReq.status === 201 && aliceReq.data.request.id, 'Alice submits Critical Request for 2 Satellite Dishes');
  const aliceReqId = aliceReq.data.request.id;

  // 8. Self-voting test: Alice attempts to vote for her own request -> Must be rejected with 400
  const selfVote = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/votes/${aliceReqId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceToken}`
    }
  });
  assert(selfVote.status === 400 && selfVote.data.error.includes('cannot vote for your own request'), 'Self-voting blocked with exact error: "You cannot vote for your own request."');

  // 9. Peer voting: Bob votes for Alice's request -> 200 OK
  const bobVote = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/votes/${aliceReqId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bobToken}`
    }
  });
  assert(bobVote.status === 200 && bobVote.data.voted === true, 'Bob successfully votes for Alice\'s request');

  // 10. Duplicate voting: Bob attempts to vote again -> 409 Conflict
  const bobDuplicateVote = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/votes/${aliceReqId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bobToken}`
    }
  });
  assert(bobDuplicateVote.status === 409, 'Duplicate vote from Bob blocked with 409 Conflict');

  // 11. Explainable Ranking Check
  const rankings = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/ranking',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${aliceToken}` }
  });
  assert(rankings.status === 200 && rankings.data.ranking.length > 0, 'Rankings leaderboard retrieved');
  const topRank = rankings.data.ranking[0];
  assert(topRank.ranking_position === 1, 'Top ranked request has ranking position #1');
  assert(topRank.explanation && topRank.breakdown, 'Top rank includes full breakdown and explanation');

  // 12. Explanation Audit Endpoint
  const explanation = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/ranking/explain/${aliceReqId}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${aliceToken}` }
  });
  assert(explanation.status === 200 && explanation.data.explanation.breakdown.urgency.points === 50.0, 'Explainability audit endpoint returns +50.0 urgency points');

  // 13. Admin Allocates Alice's Request
  const allocRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/allocations/${aliceReqId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, { notes: 'Approved for emergency mountain search operation' });
  assert(allocRes.status === 200 && allocRes.data.allocation.remaining_available === 4, 'Admin allocates 2 dishes; available quantity automatically decreases from 6 to 4');

  // 14. Allocation History Verification
  const history = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/allocations/history',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(history.status === 200 && history.data.history.length > 0, 'Allocation history audit log contains permanent records');
  const recent = history.data.history[0];
  assert(recent.request_id === aliceReqId && recent.recipient_name === 'Alice Green', 'History record matches Alice Green and Satellite Dish allocation');

  // 15. Frontend SPA Serving Verification
  const spaHtml = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/',
    method: 'GET'
  });
  assert(spaHtml.status === 200 && spaHtml.raw.includes('ResourceSync'), 'Server serves frontend HTML bundle on root path');

  console.log('\n=============================================');
  console.log(`🎉 ALL ${passed}/${total} HTTP INTEGRATION TESTS PASSED!`);
  console.log('=============================================\n');
}

runHttpTests().catch(err => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
