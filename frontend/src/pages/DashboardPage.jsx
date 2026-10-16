import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';
import { BookOpen, FileText, CheckCircle, Clock, TrendingUp, Activity, ChevronRight, AlertCircle } from 'lucide-react';

function StatCard({ label, value, sub, color = 'var(--teal)', icon: Icon }) {
  return (
    <div className="stat-card animate-in">
      {Icon && <div className="stat-icon"><Icon size={48} color={color} /></div>}
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function GradeBar({ course_name, course_code, final_grade, letter_grade }) {
  const pct = Math.min(100, final_grade || 0);
  const colorClass = letter_grade === 'A' ? 'progress-teal' : letter_grade === 'B' ? 'progress-emerald' : letter_grade === 'C' ? 'progress-amber' : 'progress-rose';
  const gradeClass = `grade-${letter_grade || 'E'}`;

  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{course_name}</div>
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{course_code}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            {final_grade ?? '—'}
          </span>
          <div className={`grade-ring ${gradeClass}`} style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
            {letter_grade || '?'}
          </div>
        </div>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SubmissionStatusBadge({ status }) {
  const map = {
    draft:          { class: 'badge-muted',   label: 'Draft' },
    submitted:      { class: 'badge-violet',  label: 'Submitted' },
    graded:         { class: 'badge-teal',    label: 'Graded' },
    needs_revision: { class: 'badge-amber',   label: 'Needs Revision' },
  };
  const s = map[status] || map.draft;
  return <span className={`badge ${s.class}`}>{s.label}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/courses').then(r => r.data.courses),
      user.role === 'student' ? axios.get('/api/submissions/my').then(r => r.data.submissions) : Promise.resolve([]),
      axios.get('/api/users/me/activity').then(r => r.data.activity),
    ]).then(([c, s, a]) => {
      setCourses(c);
      setSubmissions(s);
      setActivity(a);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user.role]);

  if (loading) {
    return <div style={{ display:'flex',justifyContent:'center',padding:80 }}><div className="loading-spinner" /></div>;
  }

  const gradedCount = submissions.filter(s => s.submission_status === 'graded').length;
  const pendingCount = submissions.filter(s => !s.submission_status || s.submission_status === 'draft').length;
  const avgGrade = courses.length
    ? (courses.reduce((sum, c) => sum + (c.final_grade || 0), 0) / courses.length).toFixed(1)
    : '—';

  return (
    <div className="page-container animate-in">
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-eyebrow">Personal Academic Archive</div>
        <h1 style={{ marginBottom: 8 }}>Welcome back, <span style={{ color: 'var(--teal)' }}>{user.full_name.split(' ')[0]}</span></h1>
        <p className="text-secondary text-sm">
          {user.identifier} &middot; {new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {user.role === 'student' && (
        <>
          {/* Stats row */}
          <div className="grid-4" style={{ marginBottom: 32 }}>
            <StatCard label="Enrolled Courses" value={courses.length} sub="active semester" icon={BookOpen} />
            <StatCard label="Average Grade" value={avgGrade} sub="across all courses" color="var(--emerald)" icon={TrendingUp} />
            <StatCard label="Graded Tasks" value={gradedCount} sub={`of ${submissions.length} total`} color="var(--violet)" icon={CheckCircle} />
            <StatCard label="Pending Tasks" value={pendingCount} sub="need attention" color="var(--amber)" icon={Clock} />
          </div>

          {/* Main grid */}
          <div className="grid-asymm">
            {/* Left: Academic Progress Map */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
                <div>
                  <div className="section-eyebrow" style={{ marginBottom: 4 }}>Academic Progress Map</div>
                  <h3 style={{ margin: 0 }}>Course Performance</h3>
                </div>
                <Link to="/courses" className="btn btn-ghost btn-sm">
                  View All <ChevronRight size={14} />
                </Link>
              </div>
              {courses.map(c => (
                <GradeBar key={c.id} {...c} />
              ))}
            </div>

            {/* Right: Recent Submissions + Activity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Recent Submissions */}
              <div className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16 }}>
                  <h4>Recent Assignments</h4>
                  <Link to="/assignments" className="btn btn-ghost btn-sm">All <ChevronRight size={12} /></Link>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {submissions.slice(0,4).map(s => (
                    <div key={s.id} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'10px 12px', background:'var(--bg-elevated)', borderRadius:'var(--radius-md)',
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {s.assignment_title}
                        </div>
                        <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{s.course_code}</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                        {s.score != null && (
                          <span style={{ fontSize:'0.8rem', fontFamily:'var(--font-mono)', color:'var(--teal)', fontWeight:600 }}>{s.score}</span>
                        )}
                        <SubmissionStatusBadge status={s.submission_status} />
                      </div>
                    </div>
                  ))}
                  {submissions.length === 0 && (
                    <div className="empty-state" style={{ padding: 24 }}>
                      <p className="text-muted text-sm">No submissions yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity log */}
              <div className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16 }}>
                  <h4>Account Activity</h4>
                  <Activity size={16} style={{ color:'var(--text-muted)' }} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {activity.slice(0,5).map(a => (
                    <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--teal)', flexShrink:0 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', fontWeight:500 }}>
                          {a.action.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
                          {new Date(a.occurred_at).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {activity.length === 0 && <p className="text-muted text-sm">No recent activity</p>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Lecturer/Admin dashboard */}
      {(user.role === 'lecturer' || user.role === 'admin') && (
        <div>
          <div className="grid-3" style={{ marginBottom: 28 }}>
            <StatCard label="Courses" value={courses.length} sub={`assigned to ${user.full_name.split(' ')[0]}`} icon={BookOpen} />
            <StatCard label="Active Semester" value="Gasal 2026" sub="Academic Year 2026/2027" color="var(--violet)" icon={Activity} />
            <StatCard label="Role" value={user.role.toUpperCase()} sub={user.identifier} color="var(--amber)" />
          </div>

          <div className="card">
            <div className="section-eyebrow" style={{ marginBottom: 8 }}>Your Courses</div>
            <h3 style={{ marginBottom: 20 }}>Assigned Courses</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {courses.map(c => (
                <div key={c.id} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'14px 16px', background:'var(--bg-elevated)', borderRadius:'var(--radius-md)',
                  border:'1px solid var(--border)',
                }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.7rem', color:'var(--teal)', marginBottom:2 }}>{c.code}</div>
                    <div style={{ fontSize:'0.9rem', fontWeight:600, color:'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{c.credits} SKS &middot; {c.semester} {c.academic_year}</div>
                  </div>
                  {user.role === 'lecturer' && (
                    <Link to={`/assignments`} className="btn btn-ghost btn-sm">
                      Manage <ChevronRight size={12} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
