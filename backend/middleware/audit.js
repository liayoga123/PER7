'use strict';
const { getDb } = require('../db/database');

/**
 * Write a record to the audit_log table.
 * Passwords, session secrets, and tokens are never logged here.
 */
function writeAuditLog({ actor_id, actor_username, action, target_type = null, target_id = null, target_description = null, ip_address = null, user_agent = null, metadata = null }) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_log
        (actor_id, actor_username, action, target_type, target_id, target_description, ip_address, user_agent, metadata)
      VALUES
        (@actor_id, @actor_username, @action, @target_type, @target_id, @target_description, @ip_address, @user_agent, @metadata)
    `).run({
      actor_id: actor_id || null,
      actor_username: actor_username || 'anonymous',
      action,
      target_type,
      target_id,
      target_description,
      ip_address,
      user_agent,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (e) {
    console.error('[AUDIT] Failed to write audit log:', e.message);
  }
}

/**
 * Express middleware: attach writeAuditLog helper to req
 */
function auditMiddleware(req, res, next) {
  req.audit = (opts) => writeAuditLog({
    actor_id: req.session?.user?.id,
    actor_username: req.session?.user?.username,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    ...opts,
  });
  next();
}

module.exports = { writeAuditLog, auditMiddleware };
