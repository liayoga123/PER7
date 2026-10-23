'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { initDb } = require('./db/database');
const { writeAuditLog } = require('./middleware/audit');

// ── Route modules ──────────────────────────────────────────────────
const authRoutes       = require('./routes/auth');
const userRoutes       = require('./routes/users');
const courseRoutes     = require('./routes/courses');
const assignmentRoutes = require('./routes/assignments');
const submissionRoutes = require('./routes/submissions');
const forumRoutes      = require('./routes/forum');
const notifRoutes      = require('./routes/notifications');
const adminRoutes      = require('./routes/admin');
const observatoryRoutes = require('./routes/observatory');
const labRoutes        = require('./routes/lab');

// ── LAB_MODE guard ─────────────────────────────────────────────────
const LAB_MODE = process.env.LAB_MODE === 'true';
const HOST = process.env.HOST || 'localhost';
const ALLOWED_HOSTS = ['localhost', '127.0.0.1', '::1'];

if (LAB_MODE) {
  const isLocal = ALLOWED_HOSTS.includes(HOST);
  if (!isLocal) {
    console.warn('[SECURITY] LAB_MODE=true is not allowed on non-local host. Forcing LAB_MODE=false.');
    process.env.LAB_MODE = 'false';
  } else {
    console.warn('[LAB] ⚠️  LAB_MODE is ENABLED — vulnerable endpoints are active (localhost only)');
  }
}

// ── Init DB ────────────────────────────────────────────────────────
initDb();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security headers ───────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
}));

// ── CORS ───────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return cb(null, true);
    // Allow any origin that starts with an allowed origin
    const allowed = allowedOrigins.some(o => origin.startsWith(o));
    if (allowed) return cb(null, true);
    // In development, allow all localhost origins
    if (process.env.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','X-CSRF-Token','Authorization'],
}));


// ── Body parsers ───────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── Session ────────────────────────────────────────────────────────
const SESSION_SECRET = process.env.SESSION_SECRET || 'arkavia-dev-secret-change-in-prod';
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'db') }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'arkavia.sid',
  cookie: {
    httpOnly: true,
    // Production (cross-domain Netlify ↔ Railway): secure=true, sameSite=none
    // Development (localhost): secure=false, sameSite=lax
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  },
}));


// ── Rate limiting ──────────────────────────────────────────────────
// Development: higher limit so automated tests don't block manual logins
// Production: strict 10 attempts per 15 minutes
const isDev = process.env.NODE_ENV !== 'production';
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev && ['::1', '127.0.0.1', 'localhost'].includes(req.ip),
});

// ── Static uploads ─────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ─────────────────────────────────────────────────────
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/observatory', observatoryRoutes);
app.use('/api/lab', labRoutes);

// ── Health check ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', lab_mode: LAB_MODE, timestamp: new Date().toISOString() });
});

// ── 404 ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ── Error handler ──────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────────
// Render.com requires listening on 0.0.0.0, not localhost
const LISTEN_HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : (HOST || 'localhost');
app.listen(PORT, LISTEN_HOST, () => {
  console.log(`[ARKAVIA] Backend running on http://${LISTEN_HOST}:${PORT}`);
  console.log(`[ARKAVIA] LAB_MODE: ${process.env.LAB_MODE}`);
  console.log(`[ARKAVIA] NODE_ENV: ${process.env.NODE_ENV}`);
});

module.exports = app;
