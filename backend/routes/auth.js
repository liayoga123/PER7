'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { writeAuditLog } = require('../middleware/audit');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (typeof username !== 'string' || username.length > 64) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const db = getDb();
  const user = db.prepare(
    'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1'
  ).get(username, username);

  if (!user) {
    writeAuditLog({ action: 'LOGIN_FAILED', actor_username: username, ip_address: req.ip, target_description: 'User not found' });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    writeAuditLog({ actor_id: user.id, actor_username: user.username, action: 'LOGIN_FAILED', ip_address: req.ip, target_description: 'Wrong password' });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Regenerate session to prevent session fixation
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Session error' });

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      identifier: user.identifier,
      avatar_initials: user.avatar_initials,
    };

    writeAuditLog({ actor_id: user.id, actor_username: user.username, action: 'LOGIN', ip_address: req.ip, target_description: 'Successful login', user_agent: req.headers['user-agent'] });

    res.json({ user: req.session.user });
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const user = req.session?.user;
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    if (user) writeAuditLog({ actor_id: user.id, actor_username: user.username, action: 'LOGOUT', ip_address: req.ip });
    res.clearCookie('arkavia.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.session.user });
});

module.exports = router;
