'use strict';
const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { writeAuditLog } = require('../middleware/audit');

const router = express.Router();

// ── File upload config ─────────────────────────────────────────────
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT are allowed.'));
    }
  },
});

// GET /api/submissions/my — student's own submissions
router.get('/my', requireAuth, requireRole('student'), (req, res) => {
  const db = getDb();
  const submissions = db.prepare(`
    SELECT s.*, a.title as assignment_title, a.deadline, a.max_score,
      c.name as course_name, c.code as course_code
    FROM submissions s
    JOIN assignments a ON a.id = s.assignment_id
    JOIN courses c ON c.id = a.course_id
    WHERE s.student_id = ?
    ORDER BY s.updated_at DESC
  `).all(req.session.user.id);
  res.json({ submissions });
});

// GET /api/submissions/:id — SAFE: ownership check
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const submission = db.prepare(`
    SELECT s.*, a.title as assignment_title, a.rubric, a.max_score, a.deadline,
      c.name as course_name, c.code as course_code,
      u.full_name as student_name, u.identifier as student_identifier
    FROM submissions s
    JOIN assignments a ON a.id = s.assignment_id
    JOIN courses c ON c.id = a.course_id
    JOIN users u ON u.id = s.student_id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!submission) return res.status(404).json({ error: 'Submission not found' });

  const { role, id: userId } = req.session.user;

  // Ownership check
  if (role === 'student' && submission.student_id !== userId) {
    return res.status(403).json({ error: 'Access denied: not your submission' });
  }
  if (role === 'lecturer') {
    const cl = db.prepare(
      'SELECT id FROM course_lecturers WHERE course_id = ? AND lecturer_id = ?'
    ).get(submission.course_id, userId);
    if (!cl) return res.status(403).json({ error: 'Access denied: not your course' });
  }

  // Parse rubric
  if (submission.rubric) {
    try { submission.rubric = JSON.parse(submission.rubric); } catch {}
  }

  // Academic journey events
  const events = db.prepare(`
    SELECT se.*, u.full_name as actor_name
    FROM submission_events se
    LEFT JOIN users u ON u.id = se.actor_id
    WHERE se.submission_id = ?
    ORDER BY se.occurred_at ASC
  `).all(submission.id);

  res.json({ submission, journey: events });
});

// POST /api/submissions — student submits
router.post('/', requireAuth, requireRole('student'), upload.single('file'), (req, res) => {
  const db = getDb();
  const { assignment_id, content } = req.body;
  const studentId = req.session.user.id;

  if (!assignment_id) return res.status(400).json({ error: 'assignment_id is required' });

  // Check enrollment
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignment_id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const enrolled = db.prepare(
    'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?'
  ).get(studentId, assignment.course_id);
  if (!enrolled) return res.status(403).json({ error: 'Not enrolled in this course' });

  const existing = db.prepare(
    'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?'
  ).get(assignment_id, studentId);

  const now = new Date().toISOString();
  let submissionId;

  if (existing) {
    db.prepare(`
      UPDATE submissions SET content = @content, status = 'submitted',
        file_path = @file_path, file_name = @file_name, file_size = @file_size,
        submitted_at = @now, updated_at = @now
      WHERE id = @id
    `).run({
      content: content || null,
      file_path: req.file ? req.file.filename : null,
      file_name: req.file ? req.file.originalname : null,
      file_size: req.file ? req.file.size : null,
      now,
      id: existing.id,
    });
    submissionId = existing.id;
  } else {
    const result = db.prepare(`
      INSERT INTO submissions (assignment_id, student_id, content, file_path, file_name, file_size, status, submitted_at)
      VALUES (@assignment_id, @student_id, @content, @file_path, @file_name, @file_size, 'submitted', @now)
    `).run({
      assignment_id,
      student_id: studentId,
      content: content || null,
      file_path: req.file ? req.file.filename : null,
      file_name: req.file ? req.file.originalname : null,
      file_size: req.file ? req.file.size : null,
      now,
    });
    submissionId = result.lastInsertRowid;
  }

  // Add journey event
  db.prepare(
    'INSERT INTO submission_events (submission_id, event_type, actor_id, note) VALUES (?, ?, ?, ?)'
  ).run(submissionId, 'submitted', studentId, 'Student submitted assignment');

  writeAuditLog({
    actor_id: studentId, actor_username: req.session.user.username,
    action: 'SUBMISSION_CREATED', target_type: 'submission', target_id: submissionId,
    target_description: `Submitted assignment #${assignment_id}`, ip_address: req.ip,
  });

  res.json({ success: true, submission_id: submissionId });
});

// PATCH /api/submissions/:id/grade — lecturer only
router.patch('/:id/grade', requireAuth, requireRole('lecturer'), (req, res) => {
  const db = getDb();
  const { score, feedback, status } = req.body;
  const lecturerId = req.session.user.id;

  const submission = db.prepare(`
    SELECT s.*, a.course_id, a.max_score
    FROM submissions s JOIN assignments a ON a.id = s.assignment_id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!submission) return res.status(404).json({ error: 'Submission not found' });

  // Ownership of course
  const cl = db.prepare(
    'SELECT id FROM course_lecturers WHERE course_id = ? AND lecturer_id = ?'
  ).get(submission.course_id, lecturerId);
  if (!cl) return res.status(403).json({ error: 'Not your course' });

  // Validation
  const validStatuses = ['graded', 'needs_revision'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (score !== undefined && (isNaN(score) || score < 0 || score > submission.max_score)) {
    return res.status(400).json({ error: `Score must be 0–${submission.max_score}` });
  }

  // Log grade change
  db.prepare(`
    INSERT INTO grade_change_log (submission_id, changed_by, old_score, new_score, old_feedback, new_feedback)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, lecturerId, submission.score, score ?? submission.score, submission.feedback, feedback ?? submission.feedback);

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE submissions SET
      score = @score, feedback = @feedback, status = @status,
      graded_by = @graded_by, graded_at = @now, updated_at = @now
    WHERE id = @id
  `).run({
    score: score ?? submission.score,
    feedback: feedback ?? submission.feedback,
    status: status || 'graded',
    graded_by: lecturerId,
    now,
    id: req.params.id,
  });

  // Journey event
  db.prepare(
    'INSERT INTO submission_events (submission_id, event_type, actor_id, note) VALUES (?, ?, ?, ?)'
  ).run(req.params.id, status === 'needs_revision' ? 'revision_requested' : 'graded',
    lecturerId, feedback || 'Graded by lecturer');

  // Notify student
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, related_id, related_type)
    VALUES (?, 'grade_change', 'Nilai Diterima', ?, ?, 'submission')
  `).run(submission.student_id, `Nilai untuk pengiriman tugas telah diperbarui: ${score}/100`, req.params.id);

  writeAuditLog({
    actor_id: lecturerId, actor_username: req.session.user.username,
    action: 'GRADE_UPDATED', target_type: 'submission', target_id: parseInt(req.params.id),
    target_description: `Score: ${score}`, ip_address: req.ip,
    metadata: { old_score: submission.score, new_score: score },
  });

  res.json({ success: true });
});

// Error handler for multer
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max 5MB.' });
  }
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
