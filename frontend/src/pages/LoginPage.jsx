import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import ArkaviaMark from '../components/ArkaviaMark.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Username and password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(form.username.trim(), form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const demos = {
      admin:    { username: 'admin.arkavia', password: 'Admin@2026!' },
      lecturer: { username: 'dr.veyra',      password: 'Lect@2026!' },
      student:  { username: 'rael.noctis',   password: 'Student@2026!' },
    };
    setForm(demos[role]);
    setError('');
  };

  return (
    <div className="login-page">
      {/* Left — Branding */}
      <div className="login-left">
        {/* Background grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.4,
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <ArkaviaMark size={100} />
          </div>

          <div style={{ marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--teal)', textTransform: 'uppercase' }}>
            ARKAVIA
          </div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '0.04em' }}>
            Academic Records, Knowledge,<br/>Assessment &amp; Virtual Intelligence Archive
          </h1>
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem', marginTop: 12 }}>
            "Every Record Has a Story. Every Access Leaves a Trace."
          </p>

          <div className="divider" style={{ margin: '32px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '🎓', label: 'Academic Archive', desc: 'Track every course, assignment, and milestone' },
              { icon: '🔍', label: 'Security Observatory', desc: 'Monitor every login and access event' },
              { icon: '⚗️', label: 'Security Lab', desc: 'IDOR & XSS practicum sandbox' },
            ].map(f => (
              <div key={f.label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                backdropFilter: 'blur(8px)',
                textAlign: 'left',
              }}>
                <span style={{ fontSize: '1.25rem' }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="login-right">
        <div className="login-form-card animate-in">
          <div style={{ marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--teal)', letterSpacing: '0.15em' }}>
            AUTHENTICATION PORTAL
          </div>
          <h2 className="login-title">Sign In to ARKAVIA</h2>
          <p className="login-subtitle">Enter your credentials to access the archive</p>

          {/* Quick fill demo */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Quick Demo Access
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { role: 'admin', label: 'Admin', color: 'var(--violet)' },
                { role: 'lecturer', label: 'Lecturer', color: 'var(--teal)' },
                { role: 'student', label: 'Student', color: 'var(--amber)' },
              ].map(d => (
                <button key={d.role} onClick={() => fillDemo(d.role)}
                  style={{
                    flex: 1, padding: '6px', border: `1px solid ${d.color}20`,
                    borderRadius: 'var(--radius-sm)', background: `${d.color}10`,
                    color: d.color, fontSize: '0.75rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'var(--transition)', fontFamily: 'var(--font-sans)',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = `${d.color}20`}
                  onMouseOut={e => e.currentTarget.style.background = `${d.color}10`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username or Email</label>
              <input
                id="username"
                className="form-input"
                type="text"
                placeholder="e.g. rael.noctis"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                autoComplete="username"
                maxLength={64}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="form-input"
                type="password"
                placeholder="••••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--rose-glow)',
                border: '1px solid rgba(244,63,94,0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--rose)',
                fontSize: '0.875rem',
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Authenticating...
                </>
              ) : '🔐 Access Archive'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>Demo Credentials:</div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div>admin.arkavia / Admin@2026!</div>
              <div>dr.veyra / Lect@2026!</div>
              <div>rael.noctis / Student@2026!</div>
            </div>
          </div>

          <p style={{ marginTop: 16, textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            ARKAVIA v1.0 — KSI Practicum © 2026 | All activity is logged
          </p>
        </div>
      </div>
    </div>
  );
}
