-- ARKAVIA Database Schema
-- Academic Records, Knowledge, Assessment & Virtual Intelligence Archive

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student','lecturer','admin')),
  identifier TEXT NOT NULL UNIQUE, -- NIM / NIDN / EMP-ID
  avatar_initials TEXT,
  bio TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- COURSE ENROLLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES users(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  final_grade REAL,
  letter_grade TEXT,
  enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, course_id)
);

-- ============================================================
-- COURSE ASSIGNMENTS (lecturer → course)
-- ============================================================
CREATE TABLE IF NOT EXISTS course_lecturers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lecturer_id INTEGER NOT NULL REFERENCES users(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(lecturer_id, course_id)
);

-- ============================================================
-- ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES courses(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  rubric TEXT, -- JSON string
  max_score REAL NOT NULL DEFAULT 100,
  deadline TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','graded','needs_revision')),
  score REAL,
  feedback TEXT,
  revision_notes TEXT,
  submitted_at TEXT,
  graded_at TEXT,
  graded_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(assignment_id, student_id)
);

-- ============================================================
-- SUBMISSION TIMELINE (Academic Journey)
-- ============================================================
CREATE TABLE IF NOT EXISTS submission_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL REFERENCES submissions(id),
  event_type TEXT NOT NULL, -- created, submitted, reviewed, graded, revision_requested
  actor_id INTEGER REFERENCES users(id),
  note TEXT,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- FORUM TOPICS
-- ============================================================
CREATE TABLE IF NOT EXISTS forum_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER REFERENCES courses(id),
  author_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_pinned INTEGER NOT NULL DEFAULT 0,
  is_closed INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- FORUM POSTS (replies, nested)
-- ============================================================
CREATE TABLE IF NOT EXISTS forum_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL REFERENCES forum_topics(id),
  author_id INTEGER NOT NULL REFERENCES users(id),
  parent_post_id INTEGER REFERENCES forum_posts(id),
  body TEXT NOT NULL,
  is_accepted_answer INTEGER NOT NULL DEFAULT 0,
  is_moderated INTEGER NOT NULL DEFAULT 0,
  moderated_by INTEGER REFERENCES users(id),
  moderation_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL, -- grade_change, comment, deadline, system
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  related_id INTEGER,
  related_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER REFERENCES users(id),
  actor_username TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id INTEGER,
  target_description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT, -- JSON
  occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- GRADE CHANGE LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS grade_change_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL REFERENCES submissions(id),
  changed_by INTEGER NOT NULL REFERENCES users(id),
  old_score REAL,
  new_score REAL,
  old_feedback TEXT,
  new_feedback TEXT,
  changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- LAB: IDOR Sandbox submissions (isolated)
-- ============================================================
CREATE TABLE IF NOT EXISTS lab_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  student_name TEXT NOT NULL,
  assignment_title TEXT NOT NULL,
  content TEXT NOT NULL,
  score REAL,
  secret_note TEXT  -- sensitive data to demonstrate data leakage
);

-- ============================================================
-- LAB: XSS Sandbox forum posts (isolated)
-- ============================================================
CREATE TABLE IF NOT EXISTS lab_xss_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL, -- raw, unescaped in vulnerable mode
  body_safe TEXT,     -- sanitized for safe mode
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
