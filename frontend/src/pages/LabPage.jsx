import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FlaskConical, AlertTriangle, CheckCircle, Shield, ChevronDown, ChevronUp, Play, Eye } from 'lucide-react';

export default function LabPage() {
  const [labStatus, setLabStatus] = useState(null);
  const [idorInfo, setIdorInfo] = useState(null);
  const [xssInfo, setXssInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // IDOR demo state
  const [idorResult, setIdorResult] = useState(null);
  const [idorSafeResult, setIdorSafeResult] = useState(null);
  const [idorLoading, setIdorLoading] = useState(false);

  // XSS demo state
  const [xssPosts, setXssPosts] = useState([]);
  const [xssSafePosts, setXssSafePosts] = useState([]);
  const [xssVulnLoading, setXssVulnLoading] = useState(false);
  const [xssSafeLoading, setXssSafeLoading] = useState(false);
  const vulnDisplayRef = useRef(null);

  useEffect(() => {
    Promise.all([
      axios.get('/api/lab/status'),
      axios.get('/api/lab/idor/info'),
      axios.get('/api/lab/xss/info'),
    ]).then(([s, i, x]) => {
      setLabStatus(s.data);
      setIdorInfo(i.data);
      setXssInfo(x.data);
    }).finally(() => setLoading(false));
  }, []);

  const testIdorVuln = async () => {
    setIdorLoading(true); setIdorResult(null);
    try {
      const r = await axios.get('/api/lab/idor/submission/101');
      setIdorResult({ type: 'VULNERABLE', data: r.data, status: r.status });
    } catch (e) {
      setIdorResult({ type: 'ERROR', data: e.response?.data, status: e.response?.status });
    } finally { setIdorLoading(false); }
  };

  const testIdorSafe = async () => {
    setIdorLoading(true); setIdorSafeResult(null);
    try {
      const r = await axios.get('/api/lab/idor-safe/submission/101');
      setIdorSafeResult({ type: 'SAFE_OWN', data: r.data });
    } catch (e) {
      setIdorSafeResult({ type: 'BLOCKED', data: e.response?.data });
    } finally { setIdorLoading(false); }
  };

  const testXssVuln = async () => {
    setXssVulnLoading(true);
    try {
      const r = await axios.get('/api/lab/xss/posts');
      setXssPosts(r.data.posts || []);
      // Render raw HTML into div to demo XSS execution
      if (vulnDisplayRef.current) {
        vulnDisplayRef.current.innerHTML = (r.data.posts || []).map(p =>
          `<div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.1)">
            <strong style="color:#8fa5c5">${p.author_name}</strong>: ${p.body}
          </div>`
        ).join('');
      }
    } finally { setXssVulnLoading(false); }
  };

  const testXssSafe = async () => {
    setXssSafeLoading(true);
    try {
      const r = await axios.get('/api/lab/xss-safe/posts');
      setXssSafePosts(r.data.posts || []);
    } finally { setXssSafeLoading(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="loading-spinner" /></div>;

  const labActive = labStatus?.lab_mode === true;

  return (
    <div className="page-container animate-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-eyebrow">KSI Practicum — Security Lab</div>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FlaskConical size={28} style={{ color: 'var(--violet)' }} />
          Security Sandbox
        </h1>
        <p className="text-secondary text-sm">Isolated vulnerability demonstration environment for educational purposes</p>
      </div>

      {/* Lab mode banner */}
      <div className={labActive ? 'lab-mode-banner' : 'safe-mode-banner'} style={{ marginBottom: 28 }}>
        {labActive ? <AlertTriangle size={16} /> : <Shield size={16} />}
        <div>
          {labActive ? (
            <>⚠️ <strong>LAB_MODE=true</strong> — Vulnerable endpoints are active. Educational use only on localhost.</>
          ) : (
            <>✅ <strong>LAB_MODE=false</strong> — Only secure endpoints are active. Set LAB_MODE=true in backend .env to enable lab scenarios.</>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          SCENARIO A — IDOR
      ════════════════════════════════════════ */}
      <div className="scenario-card" style={{ marginBottom: 24 }}>
        <div className="scenario-header">
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--rose)', letterSpacing: '0.12em', marginBottom: 4 }}>
              SCENARIO A — INSECURE DIRECT OBJECT REFERENCE
            </div>
            <h3 style={{ margin: 0 }}>IDOR on Student Archive</h3>
          </div>
          <span className={`badge ${labActive ? 'badge-rose' : 'badge-muted'}`}>{labActive ? '⚠️ ACTIVE' : 'DISABLED'}</span>
        </div>

        <div className="scenario-body">
          {/* Explanation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>What is IDOR?</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                IDOR occurs when an application uses user-supplied input to access objects directly without
                verifying the user has permission. Changing <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--rose)' }}>/submission/101</code> to <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--rose)' }}>/submission/102</code> exposes another user's data.
              </p>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Lab Setup</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <div>🔵 <strong>Student A:</strong> Rael Noctis (owns submission #101)</div>
                <div>🟡 <strong>Student B:</strong> Lyra Voss (logged in, testing access)</div>
                <div style={{ marginTop: 8, color: 'var(--rose)', fontSize: '0.8rem' }}>Lyra should NOT be able to read Rael's submission.</div>
              </div>
            </div>
          </div>

          {/* Endpoint info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div className="vuln-highlight">
              <div style={{ fontSize: '0.7rem', color: 'var(--rose)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>⚠️ Vulnerable Endpoint</div>
              <code>GET /api/lab/idor/submission/101</code>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 6 }}>Only checks: is user logged in?<br/>Does NOT check: does submission belong to user?</div>
            </div>
            <div className="safe-highlight">
              <div style={{ fontSize: '0.7rem', color: 'var(--emerald)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✅ Safe Endpoint</div>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>GET /api/lab/idor-safe/submission/101</code>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 6 }}>Checks: submission.student_id === session.user.id<br/>Returns 403 if ownership fails</div>
            </div>
          </div>

          {/* Test buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <button onClick={testIdorVuln} className="btn btn-danger" disabled={idorLoading || !labActive}>
              <Play size={14} /> {idorLoading ? 'Testing...' : 'Test IDOR Vulnerability'}
            </button>
            <button onClick={testIdorSafe} className="btn btn-ghost" disabled={idorLoading}>
              <Shield size={14} /> {idorLoading ? 'Testing...' : 'Test Safe Endpoint'}
            </button>
          </div>

          {/* Results */}
          {idorResult && (
            <div style={{ marginBottom: 16 }}>
              <div className="test-result test-result-vuln" style={{ marginBottom: 8 }}>
                <AlertTriangle size={16} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ VULNERABILITY REPRODUCED — IDOR ACCESS SUCCEEDED</div>
                  <div style={{ fontSize: '0.8rem' }}>Lyra Voss read Rael Noctis's submission data (HTTP {idorResult.status})</div>
                </div>
              </div>
              {idorResult.data?.submission && (
                <div style={{ background: '#010a12', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-md)', padding: 16, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', lineHeight: 1.8 }}>
                  <div style={{ color: 'var(--rose)', marginBottom: 8, fontWeight: 600 }}>⚠️ DATA LEAKED TO UNAUTHORIZED USER:</div>
                  <div style={{ color: 'var(--text-secondary)' }}>student_name: <span style={{ color: 'var(--amber)' }}>{idorResult.data.submission.student_name}</span></div>
                  <div style={{ color: 'var(--text-secondary)' }}>assignment: <span style={{ color: 'var(--amber)' }}>{idorResult.data.submission.assignment_title}</span></div>
                  <div style={{ color: 'var(--text-secondary)' }}>score: <span style={{ color: 'var(--amber)' }}>{idorResult.data.submission.score}</span></div>
                  <div style={{ color: 'var(--text-secondary)' }}>secret_note: <span style={{ color: 'var(--rose)', fontWeight: 600 }}>{idorResult.data.submission.secret_note}</span></div>
                </div>
              )}
            </div>
          )}

          {idorSafeResult && (
            <div className={`test-result ${idorSafeResult.type === 'BLOCKED' ? 'test-result-pass' : 'test-result-vuln'}`}>
              <CheckCircle size={16} />
              <div>
                <div style={{ fontWeight: 700 }}>
                  {idorSafeResult.type === 'BLOCKED' ? '✅ MITIGATION VERIFIED — Access Blocked (HTTP 403)' : '⚠️ Own Access Allowed (Expected)'}
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                  {idorSafeResult.data?.message || 'Ownership check enforced by backend'}
                </div>
              </div>
            </div>
          )}

          {/* Impact & Mitigation */}
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: '14px 16px', background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--rose)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>⚠️ Impact</div>
              <ul style={{ paddingLeft: 16, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                <li>Unauthorized access to other students' assignments</li>
                <li>Confidential notes and scores exposed</li>
                <li>Privacy violation across all submissions</li>
                <li>OWASP A01:2021 — Broken Access Control</li>
              </ul>
            </div>
            <div style={{ padding: '14px 16px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>✅ Mitigation</div>
              <ul style={{ paddingLeft: 16, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                <li>Always verify: resource.owner_id === session.user.id</li>
                <li>Never trust client-supplied IDs as sole access control</li>
                <li>Return 403 when ownership check fails</li>
                <li>Log all access attempts in audit trail</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SCENARIO B — Stored XSS
      ════════════════════════════════════════ */}
      <div className="scenario-card">
        <div className="scenario-header">
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--amber)', letterSpacing: '0.12em', marginBottom: 4 }}>
              SCENARIO B — STORED CROSS-SITE SCRIPTING
            </div>
            <h3 style={{ margin: 0 }}>Stored XSS on Knowledge Chamber</h3>
          </div>
          <span className={`badge ${labActive ? 'badge-amber' : 'badge-muted'}`}>{labActive ? '⚠️ ACTIVE' : 'DISABLED'}</span>
        </div>

        <div className="scenario-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>What is Stored XSS?</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Stored XSS occurs when user-supplied data is saved to a database without sanitization
                and rendered back to users as raw HTML. Injected scripts execute in every visitor's browser.
              </p>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Payload Used (Harmless)</div>
              <div className="terminal" style={{ fontSize: '0.75rem' }}>
                <div style={{ color: 'var(--amber)' }}>&lt;script&gt;</div>
                <div style={{ color: 'var(--text-secondary)', paddingLeft: 12 }}>alert("⚠️ XSS Executed!")</div>
                <div style={{ color: 'var(--amber)' }}>&lt;/script&gt;</div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                ℹ️ No cookies stolen. No data exfiltrated. Demo only.
              </div>
            </div>
          </div>

          {/* Endpoint comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div className="vuln-highlight">
              <div style={{ fontSize: '0.7rem', color: 'var(--rose)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>⚠️ Vulnerable</div>
              <code>GET /api/lab/xss/posts</code>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 6 }}>Returns raw body — &lt;script&gt; tags intact</div>
            </div>
            <div className="safe-highlight">
              <div style={{ fontSize: '0.7rem', color: 'var(--emerald)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>✅ Safe</div>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>GET /api/lab/xss-safe/posts</code>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 6 }}>Returns body_safe — HTML entities encoded</div>
            </div>
          </div>

          {/* Test buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <button onClick={testXssVuln} className="btn btn-danger" disabled={xssVulnLoading || !labActive}>
              <Play size={14} /> {xssVulnLoading ? 'Loading...' : 'Test XSS Vulnerability'}
            </button>
            <button onClick={testXssSafe} className="btn btn-ghost" disabled={xssSafeLoading}>
              <Shield size={14} /> {xssSafeLoading ? 'Loading...' : 'Test Safe Rendering'}
            </button>
          </div>

          {/* Vulnerable render zone */}
          {xssPosts.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="test-result test-result-vuln" style={{ marginBottom: 10 }}>
                <AlertTriangle size={16} />
                <div style={{ fontWeight: 700 }}>⚠️ VULNERABLE MODE — Raw HTML rendered (check for alert dialog!)</div>
              </div>
              <div style={{ background: '#010a12', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--rose)', marginBottom: 8, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  ⚠️ CONTENT RENDERED AS innerHTML (DANGEROUS):
                </div>
                <div ref={vulnDisplayRef} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} />
                <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Raw body stored in DB: {JSON.stringify(xssPosts.find(p => p.body.includes('script'))?.body?.slice(0, 60))}...
                </div>
              </div>
            </div>
          )}

          {/* Safe render zone */}
          {xssSafePosts.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="test-result test-result-pass" style={{ marginBottom: 10 }}>
                <CheckCircle size={16} />
                <div style={{ fontWeight: 700 }}>✅ SAFE MODE — HTML entities encoded. Script cannot execute.</div>
              </div>
              <div style={{ background: '#010a12', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                {xssSafePosts.map((p, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>{p.author_name}:</strong>
                    {/* Safe: React renders as text, not HTML */}
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{p.body}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Impact & Mitigation */}
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: '14px 16px', background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--rose)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>⚠️ Potential Impact</div>
              <ul style={{ paddingLeft: 16, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                <li>Session hijacking via document.cookie</li>
                <li>Credential theft via fake login forms</li>
                <li>Page defacement for all users</li>
                <li>OWASP A03:2021 — Injection</li>
              </ul>
            </div>
            <div style={{ padding: '14px 16px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>✅ Mitigation</div>
              <ul style={{ paddingLeft: 16, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                <li>Output encoding: HTML-escape all user content</li>
                <li>Input sanitization: DOMPurify server-side</li>
                <li>Content Security Policy (CSP) header</li>
                <li>React JSX auto-escaping (use JSX, not innerHTML)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
