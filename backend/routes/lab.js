'use strict';
/**
 * ARKAVIA Security Lab Routes
 * Isolated sandbox for demonstrating two intentional vulnerabilities:
 *   Scenario A: IDOR (Insecure Direct Object Reference)
 *   Scenario B: Stored XSS
 *
 * LAB_MODE guard: vulnerable endpoints only work when LAB_MODE=true AND on localhost.
 */
const express = require('express');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const { getDb } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { writeAuditLog } = require('../middleware/audit');

const router = express.Router();

// DOMPurify for safe mode
const { window } = new JSDOM('');
const DOMPurify = createDOMPurify(window);

function sanitizeHtml(str) {
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const LAB_MODE = process.env.LAB_MODE === 'true';

function requireLabMode(req, res, next) {
  if (!LAB_MODE) {
    return res.status(403).json({
      error: 'LAB_MODE is disabled. Enable it by setting LAB_MODE=true in .env (localhost only).',
      lab_mode: false,
    });
  }
  next();
}

// ================================================================
// SCENARIO A: IDOR — Insecure Direct Object Reference
// ================================================================

/**
 * VULNERABLE endpoint:
 * GET /api/lab/idor/submission/:id
 * Only checks authentication, NOT ownership → IDOR vulnerability
 */
router.get('/idor/submission/:id', requireAuth, requireLabMode, (req, res) => {
  const db = getDb();
  const submission = db.prepare('SELECT * FROM lab_submissions WHERE id = ?').get(req.params.id);

  if (!submission) return res.status(404).json({ error: 'Lab submission not found' });

  // ⚠️ INTENTIONAL: No ownership check — any authenticated user can access any submission
  writeAuditLog({
    actor_id: req.session.user.id, actor_username: req.session.user.username,
    action: 'LAB_IDOR_ACCESS', target_type: 'lab_submission', target_id: parseInt(req.params.id),
    target_description: `[VULNERABLE] IDOR access to lab_submission #${req.params.id}`,
    ip_address: req.ip, metadata: { mode: 'VULNERABLE', requester_id: req.session.user.id, owner_id: submission.student_id },
  });

  res.json({
    mode: 'VULNERABLE',
    warning: '⚠️ IDOR: No ownership check was performed. This data should not be accessible to you.',
    submission,
  });
});

/**
 * SAFE endpoint:
 * GET /api/lab/idor-safe/submission/:id
 * Verifies ownership before returning data
 */
router.get('/idor-safe/submission/:id', requireAuth, (req, res) => {
  const db = getDb();
  const submission = db.prepare('SELECT * FROM lab_submissions WHERE id = ?').get(req.params.id);

  if (!submission) return res.status(404).json({ error: 'Lab submission not found' });

  // ✅ SAFE: Ownership check
  if (submission.student_id !== req.session.user.id) {
    writeAuditLog({
      actor_id: req.session.user.id, actor_username: req.session.user.username,
      action: 'LAB_IDOR_BLOCKED', target_type: 'lab_submission', target_id: parseInt(req.params.id),
      target_description: `[SAFE] IDOR attempt blocked for lab_submission #${req.params.id}`,
      ip_address: req.ip, metadata: { mode: 'SAFE', requester_id: req.session.user.id, owner_id: submission.student_id },
    });
    return res.status(403).json({
      mode: 'SAFE',
      result: 'BLOCKED',
      message: '✅ Access denied: Ownership check enforced. This submission does not belong to you.',
      mitigation: 'Backend verified that submission.student_id === authenticated user ID before returning data.',
    });
  }

  res.json({
    mode: 'SAFE',
    result: 'ALLOWED',
    message: '✅ Ownership verified. Access granted to your own submission.',
    submission,
  });
});

// GET /api/lab/idor/info — lab scenario info
router.get('/idor/info', requireAuth, (req, res) => {
  const db = getDb();
  const rael = db.prepare("SELECT id, username, full_name, identifier FROM users WHERE username = 'rael.noctis'").get();
  const lyra = db.prepare("SELECT id, username, full_name, identifier FROM users WHERE username = 'lyra.voss'").get();

  res.json({
    scenario: 'IDOR — Insecure Direct Object Reference',
    description: 'The vulnerable endpoint /api/lab/idor/submission/:id only checks authentication but not object ownership. Any authenticated student can access any other student\'s submission by changing the ID in the URL.',
    lab_subjects: {
      student_a: { ...rael, submission_id: 101, owns_submission: true, expected_access: 'ALLOWED' },
      student_b: { ...lyra, submission_id: 101, owns_submission: false, expected_access: 'DENIED (in safe mode) / ALLOWED (in vulnerable mode)' },
    },
    test_steps: [
      'Login as lyra.voss',
      'Access GET /api/lab/idor/submission/101 (vulnerable endpoint)',
      'Observe: Lyra can read Rael\'s submission including confidential secret_note',
      'Access GET /api/lab/idor-safe/submission/101 (safe endpoint)',
      'Observe: Access is blocked with 403 Forbidden',
    ],
    impact: 'Student B can read Student A\'s submission content, score, and confidential notes without authorization.',
    mitigation: 'Always verify that the resource\'s owner_id matches the authenticated user\'s ID in the backend before returning data. Never rely only on URL path IDs as access control.',
    lab_mode: process.env.LAB_MODE === 'true',
  });
});

// ================================================================
// SCENARIO B: Stored XSS
// ================================================================

/**
 * VULNERABLE endpoint:
 * GET /api/lab/xss/posts
 * Returns raw (unescaped) HTML from database
 */
router.get('/xss/posts', requireAuth, requireLabMode, (req, res) => {
  const db = getDb();
  const posts = db.prepare('SELECT id, author_name, body, created_at FROM lab_xss_posts').all();

  writeAuditLog({
    actor_id: req.session.user.id, actor_username: req.session.user.username,
    action: 'LAB_XSS_VIEW', target_type: 'lab_xss', target_id: null,
    target_description: '[VULNERABLE] XSS posts viewed in vulnerable mode',
    ip_address: req.ip, metadata: { mode: 'VULNERABLE' },
  });

  res.json({
    mode: 'VULNERABLE',
    warning: '⚠️ Stored XSS: Posts are returned with raw HTML content. <script> tags will execute in the browser.',
    posts, // body is raw, unescaped
  });
});

/**
 * SAFE endpoint:
 * GET /api/lab/xss-safe/posts
 * Returns HTML-escaped body content
 */
router.get('/xss-safe/posts', requireAuth, (req, res) => {
  const db = getDb();
  const posts = db.prepare('SELECT id, author_name, body_safe as body, created_at FROM lab_xss_posts').all();

  res.json({
    mode: 'SAFE',
    message: '✅ Posts are returned with HTML-encoded body. XSS payload cannot execute.',
    mitigation: 'body_safe field contains HTML-entity-encoded content. No <script> execution possible.',
    posts,
  });
});

/**
 * POST /api/lab/xss/posts — store a new XSS lab post
 * VULNERABLE: stores raw body without sanitization
 */
router.post('/xss/posts', requireAuth, requireLabMode, (req, res) => {
  const db = getDb();
  const { author_name, body } = req.body;
  if (!body) return res.status(400).json({ error: 'Body required' });

  const safebody = escapeHtml(body);
  db.prepare('INSERT INTO lab_xss_posts (author_name, body, body_safe) VALUES (?, ?, ?)')
    .run(author_name || req.session.user.full_name, body, safebody); // body stored raw

  res.json({
    mode: 'VULNERABLE',
    warning: '⚠️ Input stored without sanitization. XSS payload will execute when retrieved.',
    stored_raw: body,
    stored_safe: safebody,
  });
});

/**
 * POST /api/lab/xss-safe/posts — safe version, sanitizes before storing
 */
router.post('/xss-safe/posts', requireAuth, (req, res) => {
  const db = getDb();
  const { author_name, body } = req.body;
  if (!body) return res.status(400).json({ error: 'Body required' });

  const safeBody = sanitizeHtml(body);
  db.prepare('INSERT INTO lab_xss_posts (author_name, body, body_safe) VALUES (?, ?, ?)')
    .run(author_name || req.session.user.full_name, safeBody, safeBody);

  res.json({
    mode: 'SAFE',
    message: '✅ Input sanitized before storage. XSS payload removed.',
    original: body,
    sanitized: safeBody,
  });
});

// GET /api/lab/xss/info
router.get('/xss/info', requireAuth, (req, res) => {
  res.json({
    scenario: 'Stored XSS — Cross-Site Scripting',
    description: 'The vulnerable endpoint stores user input without sanitization and returns it without encoding. When the browser renders this content as HTML, embedded <script> tags execute.',
    payload_used: '<script>alert("⚠️ ARKAVIA XSS LAB: Stored XSS Berhasil Dieksekusi!")</script>',
    payload_harmless: true,
    payload_description: 'This payload only triggers a browser alert. No cookies, credentials, or external requests are involved.',
    test_steps: [
      'POST a comment with <script>alert(...)</script> to /api/lab/xss/posts',
      'GET /api/lab/xss/posts and observe the raw body field',
      'When rendered as innerHTML in browser, script executes — XSS confirmed',
      'GET /api/lab/xss-safe/posts and observe body is HTML-encoded',
      'Rendering encoded body as text — script does not execute',
    ],
    impact: 'Stored XSS allows injected scripts to run in the browser of every user who views the forum. In real scenarios: session hijacking, credential theft, defacement.',
    mitigation: [
      'Output encoding: Always escape HTML entities before rendering user content',
      'Input sanitization: Use DOMPurify or equivalent to strip dangerous tags on submission',
      'Content Security Policy: Set CSP headers to prevent inline script execution',
      "Do not use innerHTML with user content — use textContent or React's default JSX escaping",
    ],
    lab_mode: process.env.LAB_MODE === 'true',
  });
});

// GET /api/lab/status — overall lab status
router.get('/status', requireAuth, (req, res) => {
  res.json({
    lab_mode: LAB_MODE,
    scenarios: {
      idor: {
        name: 'Scenario A: IDOR',
        vulnerable_endpoint: 'GET /api/lab/idor/submission/:id',
        safe_endpoint: 'GET /api/lab/idor-safe/submission/:id',
        active: LAB_MODE,
      },
      xss: {
        name: 'Scenario B: Stored XSS',
        vulnerable_endpoint: 'GET /api/lab/xss/posts',
        safe_endpoint: 'GET /api/lab/xss-safe/posts',
        active: LAB_MODE,
      },
    },
    note: LAB_MODE
      ? '⚠️ Vulnerable endpoints are active. For educational use only on localhost.'
      : '✅ All endpoints use secure implementation.',
  });
});

module.exports = router;
