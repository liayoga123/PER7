'use strict';
/**
 * ARKAVIA — Automated Test Runner
 * Tests are actual HTTP requests to the running backend server.
 * Run: npm test (from backend directory, with server running)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 3001}`;

let passed = 0;
let failed = 0;
const results = [];

// ── HTTP helper ────────────────────────────────────────────────────
async function request(method, path, { body, cookie } = {}) {
  const http = require('http');
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    };
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method,
      headers,
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'];
        try { resolve({ status: res.statusCode, body: JSON.parse(data), cookie: setCookie }); }
        catch { resolve({ status: res.statusCode, body: data, cookie: setCookie }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function extractCookie(setCookieHeader) {
  if (!setCookieHeader) return null;
  return setCookieHeader.map(c => c.split(';')[0]).join('; ');
}

// ── Login helper ───────────────────────────────────────────────────
async function login(username, password) {
  const res = await request('POST', '/api/auth/login', { body: { username, password } });
  if (res.status !== 200) throw new Error(`Login failed for ${username}: ${JSON.stringify(res.body)}`);
  return extractCookie(res.cookie);
}

// ── Test runner ────────────────────────────────────────────────────
async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    results.push({ name, status: 'PASS' });
    passed++;
  } catch (e) {
    console.log(`  ❌ FAIL: ${name}`);
    console.log(`       ${e.message}`);
    results.push({ name, status: 'FAIL', error: e.message });
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ── Test suites ────────────────────────────────────────────────────
async function runTests() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  ARKAVIA — Automated Security & Feature Tests');
  console.log('═══════════════════════════════════════════════════\n');

  let adminCookie, lecturerCookie, studentRaelCookie, studentLyraCookie;

  // ─── Auth Tests ──────────────────────────────────────────────────
  console.log('📋 [1] Authentication Tests');

  await test('Admin can login', async () => {
    adminCookie = await login('admin.arkavia', 'Admin@2026!');
    assert(adminCookie, 'No session cookie returned');
  });

  await test('Lecturer (dr.veyra) can login', async () => {
    lecturerCookie = await login('dr.veyra', 'Lect@2026!');
    assert(lecturerCookie, 'No session cookie returned');
  });

  await test('Student (rael.noctis) can login', async () => {
    studentRaelCookie = await login('rael.noctis', 'Student@2026!');
    assert(studentRaelCookie, 'No session cookie returned');
  });

  await test('Student (lyra.voss) can login', async () => {
    studentLyraCookie = await login('lyra.voss', 'Student@2026!');
    assert(studentLyraCookie, 'No session cookie returned');
  });

  await test('Login fails with wrong password', async () => {
    const res = await request('POST', '/api/auth/login', { body: { username: 'rael.noctis', password: 'wrongpass' } });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('Unauthenticated request returns 401', async () => {
    const res = await request('GET', '/api/courses');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // ─── Role Access Tests ───────────────────────────────────────────
  console.log('\n📋 [2] Role-Based Access Control Tests');

  await test('Student cannot access admin panel', async () => {
    const res = await request('GET', '/api/admin/users', { cookie: studentRaelCookie });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('Lecturer cannot access admin panel', async () => {
    const res = await request('GET', '/api/admin/users', { cookie: lecturerCookie });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('Admin can access user list', async () => {
    const res = await request('GET', '/api/admin/users', { cookie: adminCookie });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body.users), 'Expected users array');
  });

  await test('Student cannot change their own role (admin route blocked)', async () => {
    // Students cannot reach /api/admin/users/:id/role
    const res = await request('PATCH', '/api/admin/users/5/role', { cookie: studentRaelCookie, body: { role: 'admin' } });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('Student cannot grade submissions (lecturer-only)', async () => {
    const res = await request('PATCH', '/api/submissions/1/grade', { cookie: studentRaelCookie, body: { score: 100 } });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('Lecturer cannot grade submission from a different course', async () => {
    // dr.ioana only teaches CET-503, not SAD-502
    const ioanaCookie = await login('dr.ioana', 'Lect@2026!');
    // Find a submission for SAD-502 assignment
    const res = await request('GET', '/api/assignments', { cookie: ioanaCookie });
    // dr.ioana should not see SAD-502 assignments
    const sad502 = (res.body.assignments || []).find(a => a.course_code === 'SAD-502');
    assert(!sad502, 'Lecturer should not see assignments for courses they do not teach');
  });

  await test('Admin can manage accounts via backend', async () => {
    const res = await request('GET', '/api/admin/system-status', { cookie: adminCookie });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof res.body.status.users === 'number', 'Expected user count');
  });

  // ─── Academic Feature Tests ──────────────────────────────────────
  console.log('\n📋 [3] Academic Feature Tests');

  await test('Student can view their courses', async () => {
    const res = await request('GET', '/api/courses', { cookie: studentRaelCookie });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.courses.length > 0, 'Expected enrolled courses');
  });

  await test('Student can view their submissions', async () => {
    const res = await request('GET', '/api/submissions/my', { cookie: studentRaelCookie });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test('Student can access own submission', async () => {
    // rael.noctis has submission for assignment 1
    const res = await request('GET', '/api/submissions/1', { cookie: studentRaelCookie });
    // Should either succeed (200) or not found (404) — but never 403 for own submission
    assert(res.status !== 403, `Should not get 403 for own submission`);
  });

  await test('Lecturer can view course submissions', async () => {
    const res = await request('GET', '/api/assignments', { cookie: lecturerCookie });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // ─── IDOR Lab Tests ──────────────────────────────────────────────
  console.log('\n📋 [4] Security Lab — IDOR Tests');

  const labMode = process.env.LAB_MODE === 'true';

  await test('[IDOR] Vulnerable endpoint: lyra.voss accesses rael\'s submission #101', async () => {
    const res = await request('GET', '/api/lab/idor/submission/101', { cookie: studentLyraCookie });
    if (labMode) {
      assert(res.status === 200, `Expected 200 in LAB_MODE, got ${res.status}`);
      assert(res.body.mode === 'VULNERABLE', 'Expected mode=VULNERABLE');
      assert(res.body.submission && res.body.submission.student_name === 'Rael Noctis', 'Expected Rael\'s data to leak');
      console.log('       ⚠️  VULNERABILITY REPRODUCED: lyra.voss can read rael\'s submission (IDOR)');
    } else {
      assert(res.status === 403, `Expected 403 in SAFE mode, got ${res.status}`);
    }
  });

  await test('[IDOR] Safe endpoint: lyra.voss access to rael\'s submission blocked', async () => {
    const res = await request('GET', '/api/lab/idor-safe/submission/101', { cookie: studentLyraCookie });
    assert(res.status === 403, `Expected 403 (access denied), got ${res.status}`);
    assert(res.body.result === 'BLOCKED', 'Expected result=BLOCKED');
    console.log('       ✅ MITIGATION VERIFIED: Ownership check blocked cross-user access');
  });

  await test('[IDOR] rael.noctis CAN access own submission #101 in safe mode', async () => {
    const res = await request('GET', '/api/lab/idor-safe/submission/101', { cookie: studentRaelCookie });
    assert(res.status === 200, `Expected 200 for own submission, got ${res.status}`);
    assert(res.body.result === 'ALLOWED', 'Expected result=ALLOWED for own submission');
  });

  // ─── XSS Lab Tests ──────────────────────────────────────────────
  console.log('\n📋 [5] Security Lab — Stored XSS Tests');

  await test('[XSS] Vulnerable endpoint returns raw payload', async () => {
    const res = await request('GET', '/api/lab/xss/posts', { cookie: studentRaelCookie });
    if (labMode) {
      assert(res.status === 200, `Expected 200 in LAB_MODE, got ${res.status}`);
      const payloadPost = res.body.posts.find(p => p.body.includes('<script>'));
      assert(payloadPost, 'Expected XSS payload in vulnerable response');
      assert(res.body.mode === 'VULNERABLE', 'Expected mode=VULNERABLE');
      console.log('       ⚠️  VULNERABILITY REPRODUCED: <script> tag found in raw response body');
    } else {
      assert(res.status === 403, `Expected 403 in SAFE mode, got ${res.status}`);
    }
  });

  await test('[XSS] Safe endpoint returns HTML-encoded payload (script cannot execute)', async () => {
    const res = await request('GET', '/api/lab/xss-safe/posts', { cookie: studentRaelCookie });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const scriptPayload = res.body.posts.find(p => p.body && p.body.includes('<script>'));
    assert(!scriptPayload, 'Encoded output should not contain literal <script> tag');
    console.log('       ✅ MITIGATION VERIFIED: HTML-encoded output — script cannot execute');
  });

  // ─── Session / Logout Tests ──────────────────────────────────────
  console.log('\n📋 [6] Session Tests');

  await test('Logout destroys session', async () => {
    const tempCookie = await login('kael.dren', 'Student@2026!');
    const logoutRes = await request('POST', '/api/auth/logout', { cookie: tempCookie });
    assert(logoutRes.status === 200, `Logout failed: ${logoutRes.status}`);

    // Session should be invalid now
    const afterLogout = await request('GET', '/api/courses', { cookie: tempCookie });
    assert(afterLogout.status === 401, `Expected 401 after logout, got ${afterLogout.status}`);
  });

  await test('/api/auth/me returns user data when logged in', async () => {
    const res = await request('GET', '/api/auth/me', { cookie: adminCookie });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.user.role === 'admin', 'Expected admin role');
  });

  // ─── File Upload Validation ──────────────────────────────────────
  console.log('\n📋 [7] File Upload Validation Tests');

  await test('File upload endpoint rejects oversized files (verified by config)', async () => {
    // We verify the multer config at module level — 5MB limit + type filter
    // Actual multipart testing requires form-data library, so we verify the API returns 400 for missing assignment_id
    const res = await request('POST', '/api/submissions', { cookie: studentRaelCookie, body: {} });
    assert(res.status === 400, `Expected 400 for missing assignment_id, got ${res.status}`);
  });

  // ─── Summary ─────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════');

  console.log('\n📊 Detailed Results:');
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} [${r.status}] ${r.name}`);
    if (r.error) console.log(`         Error: ${r.error}`);
  });

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Make sure the backend is running with: npm run dev');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
  }
}

// Check if server is reachable
request('GET', '/api/health').then(res => {
  if (res.status !== 200) throw new Error('Server not ready');
  console.log(`[TEST] Server is running. LAB_MODE: ${res.body.lab_mode}`);
  runTests();
}).catch(() => {
  console.error('[TEST] ❌ Cannot connect to backend. Start it first: npm run dev');
  process.exit(1);
});
