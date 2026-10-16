'use strict';
const express = require('express');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const { getDb } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// DOMPurify setup (server-side)
const { window } = new JSDOM('');
const DOMPurify = createDOMPurify(window);

function sanitize(html) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b','i','em','strong','p','br','ul','ol','li','blockquote'], ALLOWED_ATTR: [] });
}

// GET /api/forum/topics
router.get('/topics', requireAuth, (req, res) => {
  const db = getDb();
  const { course_id, category } = req.query;
  let query = `
    SELECT ft.*, u.full_name as author_name, u.avatar_initials, u.role as author_role,
      c.name as course_name, c.code as course_code,
      (SELECT COUNT(*) FROM forum_posts fp WHERE fp.topic_id = ft.id) as reply_count
    FROM forum_topics ft
    JOIN users u ON u.id = ft.author_id
    LEFT JOIN courses c ON c.id = ft.course_id
    WHERE 1=1
  `;
  const params = [];
  if (course_id) { query += ' AND ft.course_id = ?'; params.push(course_id); }
  if (category)  { query += ' AND ft.category = ?'; params.push(category); }
  query += ' ORDER BY ft.is_pinned DESC, ft.updated_at DESC LIMIT 50';
  const topics = db.prepare(query).all(...params);
  res.json({ topics });
});

// GET /api/forum/topics/:id
router.get('/topics/:id', requireAuth, (req, res) => {
  const db = getDb();
  const topic = db.prepare(`
    SELECT ft.*, u.full_name as author_name, u.avatar_initials, u.role as author_role,
      c.name as course_name
    FROM forum_topics ft
    JOIN users u ON u.id = ft.author_id
    LEFT JOIN courses c ON c.id = ft.course_id
    WHERE ft.id = ?
  `).get(req.params.id);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });

  // Increment view count
  db.prepare('UPDATE forum_topics SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

  const posts = db.prepare(`
    SELECT fp.*, u.full_name as author_name, u.avatar_initials, u.role as author_role
    FROM forum_posts fp
    JOIN users u ON u.id = fp.author_id
    WHERE fp.topic_id = ? AND fp.is_moderated = 0
    ORDER BY fp.created_at ASC
  `).all(req.params.id);

  res.json({ topic, posts });
});

// POST /api/forum/topics
router.post('/topics', requireAuth, (req, res) => {
  const db = getDb();
  const { title, body, category, course_id } = req.body;

  if (!title || !body) return res.status(400).json({ error: 'Title and body are required' });
  if (title.length > 200) return res.status(400).json({ error: 'Title too long' });

  const safeBody = sanitize(body);
  const result = db.prepare(`
    INSERT INTO forum_topics (author_id, course_id, title, body, category)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.session.user.id, course_id || null, title.trim(), safeBody, category || 'general');

  res.json({ success: true, topic_id: result.lastInsertRowid });
});

// POST /api/forum/topics/:id/posts — SAFE: sanitized
router.post('/topics/:id/posts', requireAuth, (req, res) => {
  const db = getDb();
  const { body, parent_post_id } = req.body;

  if (!body || !body.trim()) return res.status(400).json({ error: 'Body is required' });

  const topic = db.prepare('SELECT id, is_closed FROM forum_topics WHERE id = ?').get(req.params.id);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  if (topic.is_closed) return res.status(403).json({ error: 'Topic is closed' });

  const safeBody = sanitize(body);
  const result = db.prepare(`
    INSERT INTO forum_posts (topic_id, author_id, body, parent_post_id)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, req.session.user.id, safeBody, parent_post_id || null);

  db.prepare('UPDATE forum_topics SET updated_at = datetime("now") WHERE id = ?').run(req.params.id);

  res.json({ success: true, post_id: result.lastInsertRowid });
});

// PATCH /api/forum/posts/:id/accept — lecturer or admin marks answer
router.patch('/posts/:id/accept', requireAuth, requireRole('lecturer','admin'), (req, res) => {
  const db = getDb();
  const post = db.prepare('SELECT * FROM forum_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  db.prepare('UPDATE forum_posts SET is_accepted_answer = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// DELETE /api/forum/posts/:id — moderator (admin/lecturer)
router.delete('/posts/:id', requireAuth, requireRole('admin','lecturer'), (req, res) => {
  const db = getDb();
  db.prepare('UPDATE forum_posts SET is_moderated = 1, moderated_by = ? WHERE id = ?')
    .run(req.session.user.id, req.params.id);
  res.json({ success: true });
});

module.exports = router;
