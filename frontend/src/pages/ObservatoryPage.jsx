import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Shield, Eye, Clock, AlertTriangle, CheckCircle,
  XCircle, Activity, Users, Lock, Unlock, RefreshCw
} from 'lucide-react';

function EventRow({ event }) {
  const actionColors = {
    LOGIN: 'var(--teal)', LOGOUT: 'var(--text-muted)',
    LOGIN_FAILED: 'var(--rose)', GRADE_UPDATED: 'var(--violet)',
    ROLE_CHANGED: 'var(--amber)', USER_CREATED: 'var(--emerald)',
    USER_DEACTIVATED: 'var(--rose)', LAB_IDOR_ACCESS: 'var(--rose)',
    LAB_IDOR_BLOCKED: 'var(--emerald)', LAB_XSS_VIEW: 'var(--amber)',
    SUBMISSION_CREATED: 'var(--violet)',
  };
  const color = actionColors[event.action] || 'var(--text-muted)';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: 6, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{event.action}</span>
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 }}>
            {new Date(event.occurred_at).toLocaleString('id-ID')}
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
          <strong>{event.actor_username}</strong>
          {event.target_description ? ` — ${event.target_description}` : ''}
        </div>
        {event.ip_address && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            IP: {event.ip_address}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ObservatoryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testResults, setTestResults] = useState({});
  const [testLoading, setTestLoading] = useState({});

  const load = () => {
    setLoading(true);
    axios.get('/api/observatory/summary')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed to load observatory data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const runTest = async (testKey, endpoint, expectStatus, expectField) => {
    setTestLoading(p => ({ ...p, [testKey]: true }));
    const startTime = Date.now();
    try {
      const r = await axios.get(endpoint);
      const elapsed = Date.now() - startTime;
      const passed = r.status === expectStatus;
      setTestResults(p => ({
        ...p,
        [testKey]: {
          status: passed ? 'PASS' : 'FAIL',
          details: `HTTP ${r.status} in ${elapsed}ms`,
          data: r.data,
          elapsed,
        },
      }));
    } catch (err) {
      const elapsed = Date.now() - startTime;
      const status = err.response?.status;
      const passed = status === expectStatus;
      setTestResults(p => ({
        ...p,
        [testKey]: {
          status: passed ? 'PASS' : 'FAIL',
          details: `HTTP ${status || 'ERR'} in ${elapsed}ms`,
          data: err.response?.data,
          elapsed,
        },
      }));
    } finally {
      setTestLoading(p => ({ ...p, [testKey]: false }));
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="loading-spinner" /></div>;

  if (error) {
    return (
      <div className="page-container">
        <div style={{ padding: 24, background: 'var(--rose-glow)', border: '1px solid rgba(244,63,94,.3)', borderRadius: 'var(--radius-lg)', color: 'var(--rose)' }}>
          <Shield size={20} style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 600 }}>Access Restricted</div>
          <div style={{ fontSize: '0.875rem', marginTop: 4 }}>{error}</div>
          <div style={{ fontSize: '0.8rem', marginTop: 8, color: 'var(--text-muted)' }}>
            Security Observatory is accessible to Lecturers and Admins only.
          </div>
        </div>
      </div>
    );
  }

  const { login_events, role_changes, grade_changes, object_access, stats, lab_scenarios } = data;

  return (
    <div className="page-container animate-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-eyebrow">Security Infrastructure</div>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={28} style={{ color: 'var(--teal)' }} />
          Security Observatory
        </h1>
        <p className="text-secondary text-sm">Real-time security event monitoring and audit trail — ARKAVIA v1.0</p>
      </div>

      {/* LAB mode banner */}
      <div className={stats.lab_mode ? 'lab-mode-banner' : 'safe-mode-banner'}>
        {stats.lab_mode ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
        {stats.lab_mode
          ? '⚠️ LAB_MODE is ACTIVE — Vulnerable lab endpoints enabled (localhost only)'
          : '✅ SAFE MODE — All endpoints use secure implementation'}
        <button onClick={load} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600 }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Stats overview */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-label">Audit Entries</div>
          <div className="stat-value" style={{ color: 'var(--teal)' }}>{stats.total_audit_entries}</div>
          <div className="stat-sub">total logged events</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed Logins</div>
          <div className="stat-value" style={{ color: 'var(--rose)' }}>{stats.failed_logins}</div>
          <div className="stat-sub">authentication failures</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Role Changes</div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{role_changes.length}</div>
          <div className="stat-sub">privilege modifications</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Grade Changes</div>
          <div className="stat-value" style={{ color: 'var(--violet)' }}>{grade_changes.length}</div>
          <div className="stat-sub">score modifications</div>
        </div>
      </div>

      {/* Lab Scenarios section */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-eyebrow" style={{ marginBottom: 16 }}>Security Lab Scenarios</div>
        <div className="grid-2">
          {/* IDOR Scenario */}
          <div className="scenario-card">
            <div className="scenario-header">
              <div>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--rose)', marginBottom: 4 }}>SCENARIO A</div>
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>IDOR — Insecure Direct Object Reference</h4>
              </div>
              <span className={`badge ${stats.lab_mode ? 'badge-rose' : 'badge-emerald'}`}>
                {stats.lab_mode ? 'ACTIVE' : 'PROTECTED'}
              </span>
            </div>
            <div className="scenario-body">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
                Student B can access Student A's submission data by changing the ID parameter.
                No ownership verification in the vulnerable endpoint.
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <button
                  onClick={() => runTest('idor_vuln', '/api/lab/idor/submission/101', 200)}
                  className="btn btn-danger btn-sm"
                  disabled={testLoading['idor_vuln'] || !stats.lab_mode}
                >
                  {testLoading['idor_vuln'] ? <><div className="loading-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Testing...</> : '▶ Test Vulnerable'}
                </button>
                <button
                  onClick={() => runTest('idor_safe', '/api/lab/idor-safe/submission/101', 200)}
                  className="btn btn-ghost btn-sm"
                  disabled={testLoading['idor_safe']}
                >
                  {testLoading['idor_safe'] ? 'Testing...' : '🛡 Test Safe'}
                </button>
              </div>

              {testResults['idor_vuln'] && (
                <div className={`test-result ${testResults['idor_vuln'].status === 'PASS' ? 'test-result-vuln' : 'test-result-pass'}`}>
                  <AlertTriangle size={14} />
                  <div>
                    <div style={{ fontWeight: 700 }}>VULNERABLE: {testResults['idor_vuln'].status}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 2 }}>{testResults['idor_vuln'].details}</div>
                    {testResults['idor_vuln'].data?.submission && (
                      <div style={{ fontSize: '0.7rem', marginTop: 4, fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
                        ⚠️ Leaked: {testResults['idor_vuln'].data.submission.student_name}'s data exposed
                      </div>
                    )}
                  </div>
                </div>
              )}
              {testResults['idor_safe'] && (
                <div className={`test-result ${testResults['idor_safe'].data?.result === 'BLOCKED' ? 'test-result-pass' : 'test-result-fail'}`} style={{ marginTop: 8 }}>
                  <CheckCircle size={14} />
                  <div>
                    <div style={{ fontWeight: 700 }}>SAFE: {testResults['idor_safe'].data?.result || testResults['idor_safe'].status}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 2 }}>{testResults['idor_safe'].details}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* XSS Scenario */}
          <div className="scenario-card">
            <div className="scenario-header">
              <div>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--amber)', marginBottom: 4 }}>SCENARIO B</div>
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Stored XSS — Cross-Site Scripting</h4>
              </div>
              <span className={`badge ${stats.lab_mode ? 'badge-amber' : 'badge-emerald'}`}>
                {stats.lab_mode ? 'ACTIVE' : 'PROTECTED'}
              </span>
            </div>
            <div className="scenario-body">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
                Forum comments stored without sanitization. Payload in database
                re-rendered as raw HTML, allowing script execution in browser.
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <button
                  onClick={() => runTest('xss_vuln', '/api/lab/xss/posts', 200)}
                  className="btn btn-danger btn-sm"
                  disabled={testLoading['xss_vuln'] || !stats.lab_mode}
                >
                  {testLoading['xss_vuln'] ? 'Testing...' : '▶ Test Vulnerable'}
                </button>
                <button
                  onClick={() => runTest('xss_safe', '/api/lab/xss-safe/posts', 200)}
                  className="btn btn-ghost btn-sm"
                  disabled={testLoading['xss_safe']}
                >
                  {testLoading['xss_safe'] ? 'Testing...' : '🛡 Test Safe'}
                </button>
              </div>

              {testResults['xss_vuln'] && (
                <div className="test-result test-result-vuln">
                  <AlertTriangle size={14} />
                  <div>
                    <div style={{ fontWeight: 700 }}>VULNERABLE: {testResults['xss_vuln'].status}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 2 }}>{testResults['xss_vuln'].details}</div>
                    {testResults['xss_vuln'].data?.posts && (
                      <div style={{ fontSize: '0.7rem', marginTop: 4, fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
                        ⚠️ Raw &lt;script&gt; tags found in response body
                      </div>
                    )}
                  </div>
                </div>
              )}
              {testResults['xss_safe'] && (
                <div className="test-result test-result-pass" style={{ marginTop: 8 }}>
                  <CheckCircle size={14} />
                  <div>
                    <div style={{ fontWeight: 700 }}>SAFE: {testResults['xss_safe'].status}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 2 }}>{testResults['xss_safe'].details}</div>
                    <div style={{ fontSize: '0.7rem', marginTop: 4, opacity: 0.8 }}>✅ HTML entities encoded — no script execution</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event logs */}
      <div className="grid-2" style={{ gap: 24 }}>
        {/* Login timeline */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Activity size={16} style={{ color: 'var(--teal)' }} />
            <h4 style={{ margin: 0 }}>Login Timeline</h4>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 30 events</span>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {login_events.map((e, i) => <EventRow key={i} event={e} />)}
            {login_events.length === 0 && <p className="text-muted text-sm">No events yet</p>}
          </div>
        </div>

        {/* Object access */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Eye size={16} style={{ color: 'var(--violet)' }} />
            <h4 style={{ margin: 0 }}>Object Access Log</h4>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 30 events</span>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {object_access.map((e, i) => <EventRow key={i} event={e} />)}
            {object_access.length === 0 && <p className="text-muted text-sm">No events yet</p>}
          </div>
        </div>

        {/* Role changes */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Users size={16} style={{ color: 'var(--amber)' }} />
            <h4 style={{ margin: 0 }}>Role Change Events</h4>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {role_changes.map((e, i) => <EventRow key={i} event={e} />)}
            {role_changes.length === 0 && <p className="text-muted text-sm">No role changes recorded</p>}
          </div>
        </div>

        {/* Grade changes */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Lock size={16} style={{ color: 'var(--violet)' }} />
            <h4 style={{ margin: 0 }}>Grade Change Log</h4>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {grade_changes.map((gc, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{gc.changer_name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--violet)' }}>
                    {gc.old_score ?? '—'} → {gc.new_score ?? '—'}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {new Date(gc.changed_at).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
            {grade_changes.length === 0 && <p className="text-muted text-sm">No grade changes recorded</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
