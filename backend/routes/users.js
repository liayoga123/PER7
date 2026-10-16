'use strict';
const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me/activity — own activity log
router.get('/me/activity', requireAuth, (req, res) => {
  const db = getDb();
  const logs = db.prepare(`
    SELECT id, action, target_type, target_description, ip_address, occurred_at
    FROM audit_log
    WHERE actor_id = ?
    ORDER BY occurred_at DESC
    LIMIT 50
  `).all(req.session.user.id);
  res.json({ activity: logs });
});

// GET /api/users/me/notifications
router.get('/me/notifications', requireAuth, (req, res) => {
  const db = getDb();
  const notifs = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30
  `).all(req.session.user.id);
  res.json({ notifications: notifs });
});

// PATCH /api/users/me/notifications/:id/read
router.patch('/me/notifications/:id/read', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.session.user.id);
  res.json({ success: true });
});

module.exports = router;
