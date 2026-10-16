'use strict';
const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/observatory/summary — security events overview
router.get('/summary', requireAuth, requireRole('admin','lecturer'), (req, res) => {
  const db = getDb();

  const loginEvents = db.prepare(`
    SELECT actor_username, action, ip_address, occurred_at
    FROM audit_log
    WHERE action IN ('LOGIN','LOGIN_FAILED','LOGOUT')
    ORDER BY occurred_at DESC LIMIT 30
  `).all();

  const roleChanges = db.prepare(`
    SELECT al.*, u.full_name as actor_name
    FROM audit_log al LEFT JOIN users u ON u.id = al.actor_id
    WHERE al.action = 'ROLE_CHANGED'
    ORDER BY al.occurred_at DESC LIMIT 20
  `).all();

  const gradeChanges = db.prepare(`
    SELECT gcl.*, u.full_name as changer_name, u.role as changer_role
    FROM grade_change_log gcl JOIN users u ON u.id = gcl.changed_by
    ORDER BY gcl.changed_at DESC LIMIT 20
  `).all();

  const objectAccess = db.prepare(`
    SELECT * FROM audit_log
    WHERE target_type IS NOT NULL
    ORDER BY occurred_at DESC LIMIT 30
  `).all();

  const failedLogins = db.prepare(`
    SELECT COUNT(*) as cnt FROM audit_log WHERE action = 'LOGIN_FAILED'
  `).get().cnt;

  const labMode = process.env.LAB_MODE === 'true';

  res.json({
    login_events: loginEvents,
    role_changes: roleChanges,
    grade_changes: gradeChanges,
    object_access: objectAccess,
    stats: {
      failed_logins: failedLogins,
      lab_mode: labMode,
      total_audit_entries: db.prepare('SELECT COUNT(*) as cnt FROM audit_log').get().cnt,
    },
    lab_scenarios: {
      idor: {
        name: 'IDOR on Student Archive',
        description: 'Insecure Direct Object Reference — lab_submissions endpoint',
        lab_mode_active: labMode,
        endpoint_vulnerable: `/api/lab/idor/submission/101`,
        endpoint_safe: `/api/lab/idor-safe/submission/101`,
      },
      xss: {
        name: 'Stored XSS on Knowledge Chamber',
        description: 'Stored XSS — lab_xss_posts endpoint',
        lab_mode_active: labMode,
        endpoint_vulnerable: `/api/lab/xss/posts`,
        endpoint_safe: `/api/lab/xss-safe/posts`,
      },
    },
  });
});

module.exports = router;
