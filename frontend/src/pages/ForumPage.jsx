import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MessageSquare, Pin, CheckCircle, TrendingUp, ChevronRight, Plus } from 'lucide-react';

const categoryColors = {
  question:   { color: 'var(--teal)',   bg: 'var(--teal-glow)', label: 'Question' },
  discussion: { color: 'var(--violet)', bg: 'var(--violet-glow)', label: 'Discussion' },
  tips:       { color: 'var(--amber)',  bg: 'var(--amber-glow)', label: 'Tips & Resources' },
  general:    { color: 'var(--text-muted)', bg: 'var(--bg-elevated)', label: 'General' },
};

export default function ForumPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ title: '', body: '', category: 'general' });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');

  const load = () => {
    const params = filter !== 'all' ? `?category=${filter}` : '';
    axios.get(`/api/forum/topics${params}`).then(r => setTopics(r.data.topics)).finally(() => setLoading(false));
  };

  useEffect(() => { setLoading(true); load(); }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newForm.title.trim() || !newForm.body.trim()) { setCreateMsg('Title and body are required'); return; }
    setCreating(true); setCreateMsg('');
    try {
      await axios.post('/api/forum/topics', newForm);
      setCreateMsg('✅ Topic created!');
      setNewForm({ title: '', body: '', category: 'general' });
      setShowNew(false);
      load();
    } catch (e) {
      setCreateMsg('❌ ' + (e.response?.data?.error || 'Failed to create topic'));
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="loading-spinner" /></div>;

  const pinned = topics.filter(t => t.is_pinned);
  const regular = topics.filter(t => !t.is_pinned);

  return (
    <div className="page-container animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div className="section-eyebrow">Knowledge Chamber</div>
          <h1>Forum Diskusi</h1>
          <p className="text-secondary text-sm">Academic conversation archive — Gasal 2026/2027</p>
        </div>
        <button onClick={() => setShowNew(s => !s)} className="btn btn-primary">
          <Plus size={16} /> New Topic
        </button>
      </div>

      {/* New topic form */}
      {showNew && (
        <div className="card card-teal animate-in" style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 16 }}>Create New Discussion Topic</h4>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" placeholder="Your question or discussion title..."
                value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))} maxLength={200} />
            </div>
            <div className="form-group">
              <label className="form-label">Body</label>
              <textarea className="form-textarea" placeholder="Describe your topic in detail..."
                value={newForm.body} onChange={e => setNewForm(f => ({ ...f, body: e.target.value }))} rows={4} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={newForm.category} onChange={e => setNewForm(f => ({ ...f, category: e.target.value }))}>
                <option value="general">General</option>
                <option value="question">Question</option>
                <option value="discussion">Discussion</option>
                <option value="tips">Tips & Resources</option>
              </select>
            </div>
            {createMsg && <div style={{ fontSize: '0.875rem', color: createMsg.startsWith('✅') ? 'var(--emerald)' : 'var(--rose)' }}>{createMsg}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>{creating ? 'Creating...' : 'Create Topic'}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[['all', 'All Topics'], ['question', 'Questions'], ['discussion', 'Discussions'], ['tips', 'Tips']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-ghost'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 28, padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={16} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>{topics.length}</strong> topics</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Pin size={16} style={{ color: 'var(--amber)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--amber)' }}>{pinned.length}</strong> pinned</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} style={{ color: 'var(--teal)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active archive</span>
        </div>
      </div>

      {/* Pinned topics */}
      {pinned.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Pin size={12} /> Pinned
          </div>
          {pinned.map(t => <TopicCard key={t.id} topic={t} pinned />)}
        </div>
      )}

      {/* Regular topics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {regular.map((t, i) => <TopicCard key={t.id} topic={t} idx={i} />)}
      </div>

      {topics.length === 0 && (
        <div className="empty-state">
          <MessageSquare size={48} className="empty-icon" />
          <p className="empty-title">No topics yet</p>
          <p className="empty-sub">Be the first to start a discussion!</p>
        </div>
      )}
    </div>
  );
}

function TopicCard({ topic: t, pinned, idx = 0 }) {
  const cat = categoryColors[t.category] || categoryColors.general;
  return (
    <Link to={`/forum/topic/${t.id}`}
      style={{ textDecoration: 'none', display: 'block', animationDelay: `${idx * 0.04}s` }}
      className="animate-in"
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 20px',
        background: pinned ? 'rgba(245,158,11,0.04)' : 'var(--bg-card)',
        border: `1px solid ${pinned ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        transition: 'var(--transition)',
        cursor: 'pointer',
      }}
        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
        onMouseOut={e => e.currentTarget.style.borderColor = pinned ? 'rgba(245,158,11,0.2)' : 'var(--border)'}
      >
        {/* Category icon */}
        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MessageSquare size={16} style={{ color: cat.color }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cat.label}</span>
            {t.course_code && (
              <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)', background: 'var(--teal-glow)', padding: '1px 8px', borderRadius: 'var(--radius-full)' }}>
                {t.course_code}
              </span>
            )}
            {pinned && <Pin size={10} style={{ color: 'var(--amber)' }} />}
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t.title}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>by <strong style={{ color: 'var(--text-secondary)' }}>{t.author_name}</strong></span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{new Date(t.created_at).toLocaleDateString('id-ID')}</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, flexShrink: 0, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{t.reply_count || 0}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>replies</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{t.view_count || 0}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>views</div>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    </Link>
  );
}
