import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Users, BookOpen, Settings, CheckCircle, XCircle, Plus, Edit2, Trash2, Shield } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [sysStatus, setSysStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // New user form
  const [newUser, setNewUser] = useState({ username: '', email: '', full_name: '', role: 'student', identifier: '', password: '' });
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFormLoading, setUserFormLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [u, c, a, s] = await Promise.all([
        axios.get('/api/admin/users').then(r => r.data.users),
        axios.get('/api/admin/courses').then(r => r.data.courses),
        axios.get('/api/admin/audit-log').then(r => r.data.logs),
        axios.get('/api/admin/system-status').then(r => r.data.status),
      ]);
      setUsers(u); setCourses(c); setAuditLog(a); setSysStatus(s);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.email || !newUser.full_name || !newUser.password) {
      showMsg('All fields are required', 'error'); return;
    }
    setUserFormLoading(true);
    try {
      await axios.post('/api/admin/users', newUser);
      showMsg(`Account "${newUser.username}" created successfully`);
      setNewUser({ username: '', email: '', full_name: '', role: 'student', identifier: '', password: '' });
      setShowUserForm(false);
      load();
    } catch (e) {
      showMsg(e.response?.data?.error || 'Failed to create user', 'error');
    } finally { setUserFormLoading(false); }
  };

  const handleRoleChange = async (userId, newRole, username) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      showMsg(`Role updated for ${username}`);
      load();
    } catch (e) {
      showMsg(e.response?.data?.error || 'Failed to update role', 'error');
    }
  };

  const handleDeactivate = async (userId, username) => {
    if (!confirm(`Deactivate account "${username}"?`)) return;
    try {
      await axios.patch(`/api/admin/users/${userId}/deactivate`);
      showMsg(`Account "${username}" deactivated`);
      load();
    } catch (e) {
      showMsg('Failed to deactivate', 'error');
    }
  };

  const handleActivate = async (userId, username) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/activate`);
      showMsg(`Account "${username}" activated`);
      load();
    } catch (e) {
      showMsg('Failed to activate', 'error');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="loading-spinner" /></div>;

  const roleColors = { admin: 'badge-violet', lecturer: 'badge-teal', student: 'badge-amber' };
  const actionColors = {
    LOGIN: 'var(--teal)', LOGOUT: 'var(--text-muted)', LOGIN_FAILED: 'var(--rose)',
    GRADE_UPDATED: 'var(--violet)', ROLE_CHANGED: 'var(--amber)', USER_CREATED: 'var(--emerald)',
    USER_DEACTIVATED: 'var(--rose)',
  };

  return (
    <div className="page-container animate-in">
      <div style={{ marginBottom: 28 }}>
        <div className="section-eyebrow">System Control</div>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={26} style={{ color: 'var(--violet)' }} />
          Registry Control
        </h1>
        <p className="text-secondary text-sm">Account management, role assignment, and system monitoring</p>
      </div>

      {/* System status */}
      {sysStatus && (
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {[
            { label: 'Total Users', value: sysStatus.users, sub: `${sysStatus.active_users} active`, color: 'var(--teal)' },
            { label: 'Courses', value: sysStatus.courses, sub: 'registered', color: 'var(--violet)' },
            { label: 'Submissions', value: sysStatus.submissions, sub: 'total', color: 'var(--amber)' },
            { label: 'Audit Entries', value: sysStatus.audit_entries, sub: 'logged', color: 'var(--emerald)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Flash message */}
      {msg.text && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: '0.875rem',
          background: msg.type === 'error' ? 'var(--rose-glow)' : 'var(--emerald-glow)',
          border: `1px solid ${msg.type === 'error' ? 'rgba(244,63,94,.3)' : 'rgba(16,185,129,.3)'}`,
          color: msg.type === 'error' ? 'var(--rose)' : 'var(--emerald)',
        }}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['users', 'Users', Users], ['courses', 'Courses', BookOpen], ['audit', 'Audit Log', Settings]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`btn btn-sm ${activeTab === key ? 'btn-primary' : 'btn-ghost'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>User Accounts ({users.length})</h4>
            <button onClick={() => setShowUserForm(s => !s)} className="btn btn-primary btn-sm">
              <Plus size={14} /> Create Account
            </button>
          </div>

          {/* Create user form */}
          {showUserForm && (
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              <h4 style={{ marginBottom: 16, color: 'var(--teal)' }}>New Account</h4>
              <form onSubmit={handleCreateUser}>
                <div className="grid-3" style={{ gap: 14, marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input className="form-input" placeholder="username" value={newUser.username}
                      onChange={e => setNewUser(f => ({ ...f, username: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" placeholder="Full Name" value={newUser.full_name}
                      onChange={e => setNewUser(f => ({ ...f, full_name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="email@example.com" value={newUser.email}
                      onChange={e => setNewUser(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={newUser.role} onChange={e => setNewUser(f => ({ ...f, role: e.target.value }))}>
                      <option value="student">Student</option>
                      <option value="lecturer">Lecturer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Identifier (NIM/NIDN)</label>
                    <input className="form-input" placeholder="NIM-xxx / NIDN-xxx" value={newUser.identifier}
                      onChange={e => setNewUser(f => ({ ...f, identifier: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" placeholder="••••••••" value={newUser.password}
                      onChange={e => setNewUser(f => ({ ...f, password: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={userFormLoading}>
                    {userFormLoading ? 'Creating...' : 'Create Account'}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowUserForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Identifier</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className={`avatar avatar-sm avatar-${u.role === 'admin' ? 'violet' : u.role === 'lecturer' ? 'teal' : 'amber'}`}>
                          {u.avatar_initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.identifier}</span></td>
                    <td>
                      {u.id !== user.id ? (
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value, u.username)}
                          style={{
                            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                            padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                          }}
                        >
                          <option value="student">Student</option>
                          <option value="lecturer">Lecturer</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`badge ${roleColors[u.role]}`}>{u.role}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-emerald' : 'badge-rose'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(u.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      {u.id !== user.id && (
                        u.is_active ? (
                          <button onClick={() => handleDeactivate(u.id, u.username)} className="btn btn-danger btn-sm">
                            Deactivate
                          </button>
                        ) : (
                          <button onClick={() => handleActivate(u.id, u.username)} className="btn btn-ghost btn-sm">
                            Activate
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Courses tab */}
      {activeTab === 'courses' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ margin: 0 }}>Registered Courses ({courses.length})</h4>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Code</th><th>Name</th><th>Credits</th><th>Semester</th><th>Status</th></tr>
            </thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id}>
                  <td><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal)', fontSize: '0.85rem' }}>{c.code}</span></td>
                  <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{c.credits} SKS</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.semester} {c.academic_year}</td>
                  <td><span className={`badge ${c.is_active ? 'badge-emerald' : 'badge-muted'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit log tab */}
      {activeTab === 'audit' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ margin: 0 }}>Audit Log (last 200 events)</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Immutable log — cannot be modified via UI. Passwords and session secrets are never stored here.
            </p>
          </div>
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>IP</th></tr>
              </thead>
              <tbody>
                {auditLog.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(l.occurred_at).toLocaleString('id-ID')}
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>{l.actor_username}</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: actionColors[l.action] || 'var(--text-muted)', fontWeight: 600 }}>
                        {l.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.target_description || '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
