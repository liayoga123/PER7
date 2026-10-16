'use strict';
const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/courses — list courses relevant to user
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const { role, id } = req.session.user;

  let courses;
  if (role === 'student') {
    courses = db.prepare(`
      SELECT c.*, e.final_grade, e.letter_grade
      FROM courses c
      JOIN enrollments e ON e.course_id = c.id AND e.student_id = ?
      WHERE c.is_active = 1
      ORDER BY c.code
    `).all(id);
  } else if (role === 'lecturer') {
    courses = db.prepare(`
      SELECT c.* FROM courses c
      JOIN course_lecturers cl ON cl.course_id = c.id AND cl.lecturer_id = ?
      WHERE c.is_active = 1
      ORDER BY c.code
    `).all(id);
  } else {
    // admin sees all
    courses = db.prepare('SELECT * FROM courses ORDER BY code').all();
  }
  res.json({ courses });
});

// GET /api/courses/:id
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const lecturers = db.prepare(`
    SELECT u.id, u.full_name, u.identifier, u.avatar_initials, u.email
    FROM users u JOIN course_lecturers cl ON cl.lecturer_id = u.id
    WHERE cl.course_id = ?
  `).all(course.id);

  const enrollmentCount = db.prepare(
    'SELECT COUNT(*) as cnt FROM enrollments WHERE course_id = ?'
  ).get(course.id).cnt;

  res.json({ course: { ...course, lecturers, enrollment_count: enrollmentCount } });
});

// GET /api/courses/:id/students — lecturer or admin only
router.get('/:id/students', requireAuth, requireRole('lecturer','admin'), (req, res) => {
  const db = getDb();
  const { role, id: userId } = req.session.user;

  // Lecturer can only access own course
  if (role === 'lecturer') {
    const cl = db.prepare(
      'SELECT id FROM course_lecturers WHERE course_id = ? AND lecturer_id = ?'
    ).get(req.params.id, userId);
    if (!cl) return res.status(403).json({ error: 'Not your course' });
  }

  const students = db.prepare(`
    SELECT u.id, u.full_name, u.identifier, u.avatar_initials, e.final_grade, e.letter_grade
    FROM users u JOIN enrollments e ON e.student_id = u.id
    WHERE e.course_id = ?
    ORDER BY u.full_name
  `).all(req.params.id);

  res.json({ students });
});

module.exports = router;
