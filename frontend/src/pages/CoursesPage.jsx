import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Users, Award } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/courses').then(r => setCourses(r.data.courses)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div className="loading-spinner" /></div>;

  const gradeColor = (g) => {
    if (!g) return 'var(--text-muted)';
    if (g >= 90) return 'var(--teal)';
    if (g >= 80) return 'var(--emerald)';
    if (g >= 70) return 'var(--amber)';
    return 'var(--rose)';
  };

  const courseColors = ['var(--teal)', 'var(--violet)', 'var(--amber)', 'var(--rose)', 'var(--emerald)'];

  return (
    <div className="page-container animate-in">
      <div style={{ marginBottom: 32 }}>
        <div className="section-eyebrow">Academic Archive</div>
        <h1>Courses</h1>
        <p className="text-secondary text-sm">{courses.length} course{courses.length !== 1 ? 's' : ''} found</p>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {courses.map((c, idx) => {
          const color = courseColors[idx % courseColors.length];
          const gradeC = gradeColor(c.final_grade);
          return (
            <div key={c.id} className="card" style={{ borderTop: `3px solid ${color}`, overflow: 'hidden' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.7rem', color, marginBottom: 4, letterSpacing:'0.1em' }}>
                    {c.code}
                  </div>
                  <h3 style={{ fontSize:'1.05rem', margin:0, lineHeight:1.3 }}>{c.name}</h3>
                </div>
                {c.letter_grade && (
                  <div className={`grade-ring grade-${c.letter_grade}`} style={{ width:44, height:44, fontSize:'1rem', flexShrink:0 }}>
                    {c.letter_grade}
                  </div>
                )}
              </div>

              <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:16, lineHeight:1.6 }}>
                {c.description || 'No description available.'}
              </p>

              <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <Award size={14} style={{ color:'var(--text-muted)' }} />
                  <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{c.credits} SKS</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <BookOpen size={14} style={{ color:'var(--text-muted)' }} />
                  <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{c.semester} {c.academic_year}</span>
                </div>
                {c.final_grade != null && (
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ fontSize:'0.75rem', color:gradeC, fontFamily:'var(--font-mono)', fontWeight:600 }}>
                      Score: {c.final_grade}
                    </span>
                  </div>
                )}
              </div>

              {c.final_grade != null && (
                <div style={{ marginTop: 16 }}>
                  <div className="progress-track">
                    <div className="progress-fill progress-teal" style={{ width: `${Math.min(100, c.final_grade)}%` }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {courses.length === 0 && (
        <div className="empty-state">
          <BookOpen size={48} className="empty-icon" />
          <p className="empty-title">No courses found</p>
          <p className="empty-sub">You are not enrolled in any courses yet.</p>
        </div>
      )}
    </div>
  );
}
