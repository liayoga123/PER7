import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';
import { ArrowLeft, MessageSquare, CheckCircle, Send, Star } from 'lucide-react';

function PostCard({ post, onAccept, canAccept }) {
  return (
    <div style={{
      display: 'flex', gap: 16,
      padding: '20px',
      background: post.is_accepted_answer ? 'rgba(0,212,200,0.04)' : 'var(--bg-card)',
      border: `1px solid ${post.is_accepted_answer ? 'var(--teal-border)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      marginBottom: 12,
      marginLeft: post.parent_post_id ? 32 : 0,
    }}>
      {/* Avatar */}
      <div>
        <div className={`avatar avatar-md ${post.author_role === 'lecturer' ? 'avatar-teal' : 'avatar-violet'}`}>
          {post.avatar_initials || post.author_name?.[0] || '?'}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{post.author_name}</span>
          {post.author_role === 'lecturer' && (
            <span className="badge badge-teal">Lecturer</span>
          )}
          {post.is_accepted_answer === 1 && (
            <span className="badge badge-emerald">✓ Accepted Answer</span>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {new Date(post.created_at).toLocaleString('id-ID')}
          </span>
        </div>

        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{ __html: post.body }}>
        </div>

        {canAccept && post.is_accepted_answer !== 1 && (
          <button onClick={() => onAccept(post.id)} className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}>
            <CheckCircle size={12} /> Mark as Answer
          </button>
        )}
      </div>
    </div>
  );
}

export default function TopicPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    axios.get(`/api/forum/topics/${id}`)
      .then(r => { setTopic(r.data.topic); setPosts(r.data.posts); })
      .catch(() => navigate('/forum'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) { setMsg('Reply cannot be empty'); return; }
    setSubmitting(true); setMsg('');
    try {
      await axios.post(`/api/forum/topics/${id}/posts`, { body: replyBody });
      setReplyBody('');
      setMsg('✅ Reply posted!');
      load();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Failed to post reply'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (postId) => {
    await axios.patch(`/api/forum/posts/${postId}/accept`);
    load();
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="loading-spinner" /></div>;
  if (!topic) return null;

  const canAccept = user.role === 'lecturer' || user.role === 'admin';
  const topLevelPosts = posts.filter(p => !p.parent_post_id);
  const childPosts = posts.filter(p => p.parent_post_id);

  return (
    <div className="page-container animate-in">
      <button onClick={() => navigate('/forum')} className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }}>
        <ArrowLeft size={14} /> Back to Forum
      </button>

      {/* Topic header */}
      <div className="card" style={{ marginBottom: 24, borderTop: '3px solid var(--violet)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          <span className="badge badge-violet" style={{ textTransform: 'capitalize' }}>{topic.category}</span>
          {topic.course_code && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--teal)' }}>{topic.course_code} — {topic.course_name}</span>
          )}
        </div>
        <h2 style={{ marginBottom: 12 }}>{topic.title}</h2>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={`avatar avatar-sm ${topic.author_role === 'lecturer' ? 'avatar-teal' : 'avatar-violet'}`}>
              {topic.avatar_initials || topic.author_name?.[0]}
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{topic.author_name}</span>
              {topic.author_role === 'lecturer' && <span className="badge badge-teal" style={{ marginLeft: 6, fontSize: '0.6rem' }}>Lecturer</span>}
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {new Date(topic.created_at).toLocaleString('id-ID')}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{topic.view_count} views</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{posts.length} replies</span>
        </div>

        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}
          dangerouslySetInnerHTML={{ __html: topic.body }}>
        </div>
      </div>

      {/* Posts */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={14} /> {posts.length} Replies
        </div>
        {topLevelPosts.map(p => (
          <div key={p.id}>
            <PostCard post={p} onAccept={handleAccept} canAccept={canAccept} />
            {/* Nested replies */}
            {childPosts.filter(c => c.parent_post_id === p.id).map(c => (
              <PostCard key={c.id} post={c} onAccept={handleAccept} canAccept={canAccept} />
            ))}
          </div>
        ))}
        {posts.length === 0 && (
          <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No replies yet. Be the first to respond!
          </div>
        )}
      </div>

      {/* Reply form */}
      {!topic.is_closed ? (
        <div className="card card-glass">
          <h4 style={{ marginBottom: 16 }}>Post a Reply</h4>
          <form onSubmit={handleReply}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <textarea className="form-textarea" placeholder="Write your reply here..."
                value={replyBody} onChange={e => setReplyBody(e.target.value)} rows={4} />
            </div>
            {msg && (
              <div style={{ fontSize: '0.875rem', color: msg.startsWith('✅') ? 'var(--emerald)' : 'var(--rose)', marginBottom: 10 }}>{msg}</div>
            )}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Send size={14} /> {submitting ? 'Posting...' : 'Post Reply'}
            </button>
          </form>
        </div>
      ) : (
        <div style={{ padding: '16px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          🔒 This topic is closed. No new replies can be posted.
        </div>
      )}
    </div>
  );
}
