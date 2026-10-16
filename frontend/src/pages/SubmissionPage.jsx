import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';
import { CheckCircle, Clock, Upload, FileText, AlertCircle, ArrowLeft, Send } from 'lucide-react';

const journeySteps = {
  created:            { label: 'Assignment Created', dot: 'timeline-dot-muted',   icon: FileText },
  submitted:          { label: 'Submitted',           dot: 'timeline-dot-violet', icon: Upload },
  reviewed:           { label: 'Under Review',        dot: 'timeline-dot-amber',  icon: Clock },
  graded:             { label: 'Graded',              dot: 'timeline-dot-teal',   icon: CheckCircle },
  revision_requested: { label: 'Revision Requested',  dot: 'timeline-dot-amber',  icon: AlertCircle },
};

export default function SubmissionPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitForm, setSubmitForm] = useState({ content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const load = () => {
    setLoading(true);
    axios.get(`/api/submissions/${id}`)
      .then(r => {
        setData(r.data);
        setSubmitForm({ content: r.data.submission?.content || '' });
      })
      .catch(e => setError(e.response?.data?.error || 'Failed to load submission'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleResubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg('');
    try {
      await axios.post('/api/submissions', {
        assignment_id: data.submission.assignment_id,
        content: submitForm.content,
      });
      setSubmitMsg('✅ Submission updated successfully!');
      load();
    } catch (err) {
      setSubmitMsg('❌ ' + (err.response?.data?.error || 'Submission failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="loading-spinner" /></div>;

  if (error) {
    return (
      <div className="page-container">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ padding: 24, background: 'var(--rose-glow)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-lg)', color: 'var(--rose)' }}>
          <AlertCircle size={20} style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 600 }}>Access Denied</div>
          <div style={{ fontSize: '0.875rem', marginTop: 4 }}>{error}</div>
        </div>
      </div>
    );
  }

  const { submission, journey } = data;
  const statusColors = { draft: 'var(--text-muted)', submitted: 'var(--violet)', graded: 'var(--teal)', needs_revision: 'var(--amber)' };
  const rubric = submission.rubric
    ? (typeof submission.rubric === 'string' ? JSON.parse(submission.rubric) : submission.rubric)
    : [];

  return (
    <div className="page-container animate-in">
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }}>
        <ArrowLeft size={14} /> Back to Assignments
      </button>

      <div className="grid-asymm">
        {/* Left — submission detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header */}
          <div className="card" style={{ borderTop: `3px solid ${statusColors[submission.status]}` }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--teal)', marginBottom: 6 }}>
              {submission.course_code} — {submission.assignment_title}
            </div>
            <h2 style={{ marginBottom: 8 }}>{submission.assignment_title}</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`badge badge-${submission.status === 'graded' ? 'teal' : submission.status === 'needs_revision' ? 'amber' : submission.status === 'submitted' ? 'violet' : 'muted'}`}>
                {submission.status.replace('_', ' ')}
              </span>
              {submission.score != null && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--teal)' }}>
                  {submission.score} / {submission.max_score}
                </span>
              )}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                By: {submission.student_name} ({submission.student_identifier})
              </span>
            </div>

            {submission.submitted_at && (
              <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Submitted: {new Date(submission.submitted_at).toLocaleString('id-ID')}
              </div>
            )}
          </div>

          {/* Content */}
          {submission.content && (
            <div className="card">
              <div className="section-eyebrow" style={{ marginBottom: 12 }}>Submission Content</div>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {submission.content}
              </div>
            </div>
          )}

          {/* Feedback */}
          {submission.feedback && (
            <div style={{ background: 'rgba(0,212,200,0.05)', border: '1px solid var(--teal-border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
              <div className="section-eyebrow" style={{ marginBottom: 8 }}>Lecturer Feedback</div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{submission.feedback}</p>
              {submission.graded_at && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
                  Graded: {new Date(submission.graded_at).toLocaleString('id-ID')}
                </div>
              )}
            </div>
          )}

          {/* Rubric */}
          {rubric.length > 0 && (
            <div className="card">
              <div className="section-eyebrow" style={{ marginBottom: 12 }}>Assessment Rubric</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rubric.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{r.criterion}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--teal)', fontWeight: 600 }}>{r.weight}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Re-submit form for student */}
          {user.role === 'student' && (submission.status === 'draft' || submission.status === 'needs_revision') && (
            <div className="card card-teal">
              <div className="section-eyebrow" style={{ marginBottom: 12 }}>
                {submission.status === 'needs_revision' ? '🔄 Submit Revision' : '📤 Submit Assignment'}
              </div>
              <form onSubmit={handleResubmit}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Your Work</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Paste or type your submission content here..."
                    value={submitForm.content}
                    onChange={e => setSubmitForm({ content: e.target.value })}
                    rows={6}
                  />
                </div>
                {submitMsg && (
                  <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 12, fontSize: '0.875rem',
                    background: submitMsg.startsWith('✅') ? 'var(--emerald-glow)' : 'var(--rose-glow)',
                    color: submitMsg.startsWith('✅') ? 'var(--emerald)' : 'var(--rose)',
                    border: `1px solid ${submitMsg.startsWith('✅') ? 'rgba(16,185,129,.3)' : 'rgba(244,63,94,.3)'}`,
                  }}>
                    {submitMsg}
                  </div>
                )}
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <Send size={14} />
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right — Academic Journey */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <div className="section-eyebrow" style={{ marginBottom: 16 }}>Academic Journey</div>
            <h3 style={{ marginBottom: 24, fontSize: '1rem' }}>Submission Timeline</h3>

            <div className="timeline">
              {/* Created event (always first) */}
              <div className="timeline-item">
                <div className="timeline-dot timeline-dot-muted">
                  <FileText size={12} />
                </div>
                <div className="timeline-content">
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Assignment Published</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                    Deadline: {new Date(submission.deadline).toLocaleDateString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Dynamic events */}
              {journey.map((ev, i) => {
                const step = journeySteps[ev.event_type] || journeySteps.submitted;
                const Icon = step.icon;
                return (
                  <div key={ev.id || i} className="timeline-item">
                    <div className={`timeline-dot ${step.dot}`}>
                      <Icon size={12} />
                    </div>
                    <div className="timeline-content">
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{step.label}</div>
                      {ev.note && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>{ev.note}</div>}
                      {ev.actor_name && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>by {ev.actor_name}</div>
                      )}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                        {new Date(ev.occurred_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                );
              })}

              {journey.length === 0 && (
                <div style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No journey events yet. Submit the assignment to start.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
