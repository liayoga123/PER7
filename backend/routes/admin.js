'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { writeAuditLog } = require('../middleware/audit');

const router = express.Router();

// All admin routes require admin role
router.use(requireAuth, requireRole('admin'));

// GET /api/admin/users
router.get('/users', (req, res) => {
  const db = getDb();
  const users = db.prepare(
    'SELECT id, username, email, full_name, role, identifier, avatar_initials, is_active, created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json({ users });
});

// POST /api/admin/users — create account
router.post('/users', async (req, res) => {
  const { username, email, full_name, role, identifier, password } = req.body;
  if (!username || !email || !full_name || !role || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const validRoles = ['student','lecturer','admin'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const db = getDb();
  const hash = await bcrypt.hash(password, 10);
  const initials = full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  try {
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, role, identifier, avatar_initials)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(username, email, hash, full_name, role, identifier || `ID-${Date.now()}`, initials);

    writeAuditLog({
      actor_id: req.session.user.id, actor_username: req.session.user.username,
      action: 'USER_CREATED', target_type: 'user', target_id: result.lastInsertRowid,
      target_description: `Created ${role} account: ${username}`, ip_address: req.ip,
    });
    res.json({ success: true, user_id: result.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username or email already exists' });
    throw e;
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', (req, res) => {
  const db = getDb();
  const { role } = req.body;
  const validRoles = ['student','lecturer','admin'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?').run(role, req.params.id);

  writeAuditLog({
    actor_id: req.session.user.id, actor_username: req.session.user.username,
    action: 'ROLE_CHANGED', target_type: 'user', target_id: parseInt(req.params.id),
    target_description: `Changed ${user.username} role from ${user.role} to ${role}`, ip_address: req.ip,
    metadata: { old_role: user.role, new_role: role },
  });

  res.json({ success: true });
});

// PATCH /api/admin/users/:id/deactivate
router.patch('/users/:id/deactivate', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET is_active = 0, updated_at = datetime("now") WHERE id = ?').run(req.params.id);

  writeAuditLog({
    actor_id: req.session.user.id, actor_username: req.session.user.username,
    action: 'USER_DEACTIVATED', target_type: 'user', target_id: parseInt(req.params.id),
    target_description: `Deactivated account: ${user.username}`, ip_address: req.ip,
  });

  res.json({ success: true });
});

// PATCH /api/admin/users/:id/activate
router.patch('/users/:id/activate', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE users SET is_active = 1, updated_at = datetime("now") WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /api/admin/audit-log
router.get('/audit-log', (req, res) => {
  const db = getDb();
  const logs = db.prepare(`
    SELECT al.*, u.full_name as actor_name
    FROM audit_log al LEFT JOIN users u ON u.id = al.actor_id
    ORDER BY al.occurred_at DESC LIMIT 200
  `).all();
  res.json({ logs });
});

// GET /api/admin/courses
router.get('/courses', (req, res) => {
  const db = getDb();
  const courses = db.prepare('SELECT * FROM courses ORDER BY code').all();
  res.json({ courses });
});

// POST /api/admin/courses
router.post('/courses', (req, res) => {
  const db = getDb();
  const { code, name, description, credits, semester, academic_year } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'Code and name required' });
  try {
    const result = db.prepare(`
      INSERT INTO courses (code, name, description, credits, semester, academic_year)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(code, name, description || '', credits || 3, semester || 'Gasal', academic_year || '2026/2027');
    res.json({ success: true, course_id: result.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Course code already exists' });
    throw e;
  }
});

// GET /api/admin/system-status
router.get('/system-status', (req, res) => {
  const db = getDb();
  const stats = {
    users: db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt,
    active_users: db.prepare('SELECT COUNT(*) as cnt FROM users WHERE is_active = 1').get().cnt,
    courses: db.prepare('SELECT COUNT(*) as cnt FROM courses').get().cnt,
    submissions: db.prepare('SELECT COUNT(*) as cnt FROM submissions').get().cnt,
    forum_topics: db.prepare('SELECT COUNT(*) as cnt FROM forum_topics').get().cnt,
    audit_entries: db.prepare('SELECT COUNT(*) as cnt FROM audit_log').get().cnt,
    lab_mode: process.env.LAB_MODE === 'true',
  };
  res.json({ status: stats });
});

module.exports = router;
