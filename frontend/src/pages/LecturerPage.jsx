import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';
import { GraduationCap, FileText, CheckCircle, Clock, ChevronRight, Star } from 'lucide-react';

export default function LecturerPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '', status: 'graded' });
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    axios.get('/api/assignments').then(r => setAssignments(r.data.assignments)).finally(() => setLoading(false));
  }, []);

  const loadSubmissions = async (assignmentId) => {
    setSubLoading(true);
    setSelectedSubmission(null);
    setSelectedAssignment(assignmentId);
    try {
      const r = await axios.get(`/api/assignments/${assignmentId}/submissions`);
      setSubmissions(r.data.submissions);
    } finally { setSubLoading(false); }
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setGrading(true); setMsg('');
    try {
      await axios.patch(`/api/submissions/${selectedSubmission.id}/grade`, {
        score: parseFloat(gradeForm.score),
        feedback: gradeForm.feedback,
        status: gradeForm.status,
      });
      setMsg('✅ Grade submitted successfully!');
      loadSubmissions(selectedAssignment);
      setSelectedSubmission(null);
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.error || 'Grading failed'));
    } finally { setGrading(false); }
  };

  const selectSubmission = (sub) => {
    setSelectedSubmission(sub);
    setGradeForm({ score: sub.score ?? '', feedback: sub.feedback ?? '', status: sub.status === 'graded' ? 'graded' : 'graded' });
    setMsg('');
  };

  const pending = submissions.filter(s => s.status === 'submitted' || s.status === 'needs_revision');
  const graded  = submissions.filter(s => s.status === 'graded');
  const total   = submissions.length;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="loading-spinner" /></div>;

  return (
    <div className="page-container animate-in">
      <div style={{ marginBottom: 28 }}>
        <div className="section-eyebrow">Lecturer Studio</div>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <GraduationCap size={26} style={{ color: 'var(--teal)' }} />
          {user.full_name}
        </h1>
        <p className="text-secondary text-sm">{user.identifier} &middot; Assignment Review Workspace</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, minHeight: 600 }}>
        {/* Left — assignment list */}
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Assignment Queue
              </div>
            </div>
            {assignments.map(a => (
              <div key={a.id}
                onClick={() => loadSubmissions(a.id)}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: selectedAssignment === a.id ? 'var(--teal-glow)' : 'transparent',
                  borderLeft: selectedAssignment === a.id ? '3px solid var(--teal)' : '3px solid transparent',
                  transition: 'var(--transition)',
                }}
                onMouseOver={e => { if (selectedAssignment !== a.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseOut={e => { if (selectedAssignment !== a.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--teal)', marginBottom: 3 }}>{a.course_code}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{a.title}</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--amber)' }}>
                    {a.submission_count || 0} sub
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--teal)' }}>
                    {a.graded_count || 0} graded
                  </span>
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No assignments</div>
            )}
          </div>
        </div>

        {/* Right — submissions + grading */}
        <div>
          {!selectedAssignment && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, color: 'var(--text-muted)' }}>
              <FileText size={48} style={{ opacity: 0.3 }} />
              <p>Select an assignment to review submissions</p>
            </div>
          )}

          {selectedAssignment && (
            <div>
              {/* Stats */}
              <div className="grid-3" style={{ marginBottom: 20 }}>
                <div className="stat-card">
                  <div className="stat-label">Total Submissions</div>
                  <div className="stat-value" style={{ color: 'var(--teal)' }}>{total}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Pending Review</div>
                  <div className="stat-value" style={{ color: 'var(--amber)' }}>{pending.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Graded</div>
                  <div className="stat-value" style={{ color: 'var(--emerald)' }}>{graded.length}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Grading Progress</span>
                  <span>{total > 0 ? Math.round((graded.length / total) * 100) : 0}%</span>
                </div>
                <div className="progress-track" style={{ height: 8 }}>
                  <div className="progress-fill progress-teal" style={{ width: `${total > 0 ? (graded.length / total) * 100 : 0}%` }} />
                </div>
              </div>

              {subLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="loading-spinner" /></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: selectedSubmission ? '1fr 1fr' : '1fr', gap: 16 }}>
                  {/* Submissions list */}
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Submissions
                    </div>
                    {submissions.map(sub => (
                      <div key={sub.id} onClick={() => selectSubmission(sub)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 16px', borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                          background: selectedSubmission?.id === sub.id ? 'var(--violet-glow)' : 'transparent',
                          transition: 'var(--transition)',
                        }}
                        onMouseOver={e => { if (selectedSubmission?.id !== sub.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseOut={e => { if (selectedSubmission?.id !== sub.id) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div className={`avatar avatar-sm avatar-${sub.status === 'graded' ? 'teal' : 'amber'}`}>
                          {sub.avatar_initials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{sub.full_name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{sub.identifier}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {sub.score != null && (
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--teal)' }}>{sub.score}</div>
                          )}
                          <span className={`badge ${sub.status === 'graded' ? 'badge-teal' : sub.status === 'needs_revision' ? 'badge-amber' : 'badge-violet'}`} style={{ fontSize: '0.6rem' }}>
                            {sub.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                    {submissions.length === 0 && (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No submissions yet</div>
                    )}
                  </div>

                  {/* Grading panel */}
                  {selectedSubmission && (
                    <div>
                      <div className="card" style={{ marginBottom: 16 }}>
                        <div className="section-eyebrow" style={{ marginBottom: 8 }}>Submission Content</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxHeight: 200, overflowY: 'auto' }}>
                          {selectedSubmission.content || <em style={{ color: 'var(--text-muted)' }}>No content submitted</em>}
                        </div>
                        {selectedSubmission.submitted_at && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 12 }}>
                            Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString('id-ID')}
                          </div>
                        )}
                      </div>

                      <div className="card card-violet">
                        <h4 style={{ marginBottom: 16, color: 'var(--violet)' }}>Grade Submission</h4>
                        <form onSubmit={handleGrade} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div className="form-group">
                            <label className="form-label">Score (0–100)</label>
                            <input className="form-input" type="number" min="0" max="100" placeholder="85"
                              value={gradeForm.score} onChange={e => setGradeForm(f => ({ ...f, score: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-select" value={gradeForm.status} onChange={e => setGradeForm(f => ({ ...f, status: e.target.value }))}>
                              <option value="graded">Graded</option>
                              <option value="needs_revision">Needs Revision</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Feedback</label>
                            <textarea className="form-textarea" rows={4} placeholder="Write your feedback here..."
                              value={gradeForm.feedback} onChange={e => setGradeForm(f => ({ ...f, feedback: e.target.value }))} />
                          </div>
                          {msg && (
                            <div style={{ fontSize: '0.875rem', color: msg.startsWith('✅') ? 'var(--emerald)' : 'var(--rose)' }}>{msg}</div>
                          )}
                          <button type="submit" className="btn btn-violet" disabled={grading}>
                            <Star size={14} /> {grading ? 'Submitting...' : 'Submit Grade'}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
