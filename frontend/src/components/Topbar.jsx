import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Bell, Menu } from 'lucide-react';
import axios from 'axios';

const routeTitles = {
  '/':             'Personal Archive',
  '/courses':      'Courses',
  '/assignments':  'Assignments',
  '/forum':        'Knowledge Chamber',
  '/observatory':  'Security Observatory',
  '/lab':          'Security Lab',
  '/admin':        'Registry Control',
  '/lecturer':     'Lecturer Studio',
};

export default function Topbar({ onMenuToggle }) {
  const { user } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState([]);

  const title = Object.entries(routeTitles).find(([path]) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  })?.[1] || 'ARKAVIA';

  useEffect(() => {
    axios.get('/api/notifications')
      .then(r => {
        setNotifs(r.data.notifications || []);
        setUnread(r.data.unread_count || 0);
      })
      .catch(() => {});
  }, [location]);

  const markAllRead = async () => {
    await axios.patch('/api/notifications/read-all');
    setUnread(0);
    setNotifs(n => n.map(x => ({ ...x, is_read: 1 })));
  };

  const typeColor = { grade_change: 'var(--teal)', comment: 'var(--violet)', deadline: 'var(--amber)', system: 'var(--text-muted)' };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onMenuToggle} className="btn btn-ghost btn-sm" style={{ padding: 8 }}>
          <Menu size={18} />
        </button>
        <div>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            ARKAVIA / {user?.role?.toUpperCase()}
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {title}
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifs(s => !s)}
            className="btn btn-ghost btn-sm"
            style={{ padding: 8, position: 'relative' }}
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', top: '110%', right: 0,
              width: 320, zIndex: 200,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: '0.7rem', color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No notifications
                  </div>
                ) : notifs.map(n => (
                  <div key={n.id} style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: n.is_read ? 'transparent' : 'rgba(0,212,200,0.03)',
                    opacity: n.is_read ? 0.6 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: typeColor[n.type] || 'var(--text-muted)', marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{n.body}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                          {new Date(n.created_at).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {user?.identifier}
          </div>
        </div>
      </div>
    </header>
  );
}
