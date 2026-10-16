'use strict';
const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/assignments — assignments for user's courses
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const { role, id } = req.session.user;

  let assignments;
  if (role === 'student') {
    assignments = db.prepare(`
      SELECT a.*, c.name as course_name, c.code as course_code,
        s.status as submission_status, s.score, s.submitted_at, s.id as submission_id
      FROM assignments a
      JOIN courses c ON c.id = a.course_id
      JOIN enrollments e ON e.course_id = a.course_id AND e.student_id = ?
      LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = ?
      WHERE a.is_published = 1
      ORDER BY a.deadline ASC
    `).all(id, id);
  } else if (role === 'lecturer') {
    assignments = db.prepare(`
      SELECT a.*, c.name as course_name, c.code as course_code,
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as submission_count,
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id AND s.status = 'graded') as graded_count
      FROM assignments a
      JOIN courses c ON c.id = a.course_id
      JOIN course_lecturers cl ON cl.course_id = a.course_id AND cl.lecturer_id = ?
      ORDER BY a.deadline ASC
    `).all(id);
  } else {
    assignments = db.prepare(`
      SELECT a.*, c.name as course_name, c.code as course_code
      FROM assignments a JOIN courses c ON c.id = a.course_id
      ORDER BY a.deadline ASC
    `).all();
  }

  res.json({ assignments });
});

// GET /api/assignments/:id
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const assignment = db.prepare(`
    SELECT a.*, c.name as course_name, c.code as course_code
    FROM assignments a JOIN courses c ON c.id = a.course_id
    WHERE a.id = ?
  `).get(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  // Parse rubric JSON
  if (assignment.rubric) {
    try { assignment.rubric = JSON.parse(assignment.rubric); } catch {}
  }
  res.json({ assignment });
});

// GET /api/assignments/:id/submissions — lecturer only, own course
router.get('/:id/submissions', requireAuth, requireRole('lecturer','admin'), (req, res) => {
  const db = getDb();
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Not found' });

  if (req.session.user.role === 'lecturer') {
    const cl = db.prepare(
      'SELECT id FROM course_lecturers WHERE course_id = ? AND lecturer_id = ?'
    ).get(assignment.course_id, req.session.user.id);
    if (!cl) return res.status(403).json({ error: 'Not your course' });
  }

  const submissions = db.prepare(`
    SELECT s.*, u.full_name, u.identifier, u.avatar_initials
    FROM submissions s JOIN users u ON u.id = s.student_id
    WHERE s.assignment_id = ?
    ORDER BY s.submitted_at DESC
  `).all(req.params.id);

  res.json({ submissions });
});

module.exports = router;
