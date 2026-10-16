import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';
import { FileText, Clock, CheckCircle, AlertCircle, ChevronRight, Upload } from 'lucide-react';

const statusMap = {
  draft:          { label: 'Draft',          class: 'badge-muted',   icon: FileText },
  submitted:      { label: 'Submitted',      class: 'badge-violet',  icon: Upload },
  graded:         { label: 'Graded',         class: 'badge-teal',    icon: CheckCircle },
  needs_revision: { label: 'Needs Revision', class: 'badge-amber',   icon: AlertCircle },
};

function DeadlineCountdown({ deadline }) {
  const diff = new Date(deadline) - new Date();
  if (diff < 0) return <span style={{ color: 'var(--rose)', fontSize: '0.75rem' }}>⏰ Overdue</span>;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const color = days < 2 ? 'var(--rose)' : days < 5 ? 'var(--amber)' : 'var(--text-muted)';
  return (
    <span style={{ color, fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
      {days}d {hours}h left
    </span>
  );
}

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    axios.get('/api/assignments').then(r => setAssignments(r.data.assignments)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? assignments
    : assignments.filter(a => a.submission_status === filter || (!a.submission_status && filter === 'draft'));

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="loading-spinner" /></div>;

  return (
    <div className="page-container animate-in">
      <div style={{ marginBottom: 32 }}>
        <div className="section-eyebrow">Academic Archive</div>
        <h1>Assignments</h1>
        <p className="text-secondary text-sm">
          {user.role === 'student' ? 'Your assignment journey — from creation to completion'
            : 'Manage and review class assignments'}
        </p>
      </div>

      {/* Filter pills */}
      {user.role === 'student' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[['all', 'All'], ['draft', 'Not Submitted'], ['submitted', 'Submitted'], ['graded', 'Graded'], ['needs_revision', 'Needs Revision']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-ghost'}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Assignment cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.map((a, idx) => {
          const status = a.submission_status || 'draft';
          const s = statusMap[status] || statusMap.draft;
          const rubric = a.rubric ? (typeof a.rubric === 'string' ? JSON.parse(a.rubric) : a.rubric) : [];

          return (
            <div key={a.id} className="card animate-in" style={{ animationDelay: `${idx * 0.05}s`, padding: 0, overflow: 'hidden' }}>
              {/* Color accent bar based on status */}
              <div style={{ height: 3, background: status === 'graded' ? 'var(--teal)' : status === 'needs_revision' ? 'var(--amber)' : status === 'submitted' ? 'var(--violet)' : 'var(--border)' }} />

              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--teal)', letterSpacing: '0.1em' }}>
                        {a.course_code}
                      </span>
                      <span className={`badge ${s.class}`}>{s.label}</span>
                      {a.score != null && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--teal)', fontWeight: 700 }}>
                          {a.score}/{a.max_score}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 4px' }}>{a.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{a.course_name}</p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {user.role === 'student' ? (
                      <DeadlineCountdown deadline={a.deadline} />
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {a.submission_count || 0} submitted &middot; {a.graded_count || 0} graded
                      </div>
                    )}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                      Due: {new Date(a.deadline).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </div>

                {a.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                    {a.description}
                  </p>
                )}

                {/* Rubric preview */}
                {rubric.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {rubric.map((r, i) => (
                      <div key={i} style={{
                        fontSize: '0.7rem', padding: '3px 10px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-full)', color: 'var(--text-muted)',
                      }}>
                        {r.criterion} ({r.weight}%)
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Max score: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{a.max_score}</span>
                  </div>
                  {user.role === 'student' && a.submission_id && (
                    <Link to={`/submissions/${a.submission_id}`} className="btn btn-ghost btn-sm">
                      View Journey <ChevronRight size={12} />
                    </Link>
                  )}
                  {user.role === 'lecturer' && (
                    <Link to={`/lecturer`} className="btn btn-ghost btn-sm">
                      Review Queue <ChevronRight size={12} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <FileText size={48} className="empty-icon" />
          <p className="empty-title">No assignments found</p>
          <p className="empty-sub">
            {filter !== 'all' ? `No assignments with status "${filter}"` : 'No assignments available yet'}
          </p>
        </div>
      )}
    </div>
  );
}
