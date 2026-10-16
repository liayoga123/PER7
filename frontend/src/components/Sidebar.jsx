import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import ArkaviaMark from './ArkaviaMark.jsx';
import {
  LayoutDashboard, BookOpen, FileText, MessageSquare,
  Eye, FlaskConical, Settings, Users, LogOut, GraduationCap,
  ChevronRight, BookMarked
} from 'lucide-react';

const studentNav = [
  { to: '/',            icon: LayoutDashboard, label: 'Personal Archive' },
  { to: '/courses',     icon: BookOpen,         label: 'Courses' },
  { to: '/assignments', icon: FileText,          label: 'Assignments' },
  { to: '/forum',       icon: MessageSquare,     label: 'Knowledge Chamber' },
];

const lecturerNav = [
  { to: '/',            icon: LayoutDashboard,  label: 'Studio Overview' },
  { to: '/courses',     icon: BookOpen,          label: 'My Courses' },
  { to: '/assignments', icon: FileText,           label: 'Assignment Queue' },
  { to: '/lecturer',    icon: GraduationCap,     label: 'Lecturer Studio' },
  { to: '/forum',       icon: MessageSquare,     label: 'Knowledge Chamber' },
];

const adminNav = [
  { to: '/',          icon: LayoutDashboard,    label: 'Overview' },
  { to: '/admin',     icon: Settings,            label: 'Registry Control' },
  { to: '/courses',   icon: BookOpen,            label: 'Courses' },
  { to: '/forum',     icon: MessageSquare,       label: 'Knowledge Chamber' },
];

const roleColors = {
  admin:    'var(--violet)',
  lecturer: 'var(--teal)',
  student:  'var(--amber)',
};

const roleLabels = {
  admin:    'Registry Admin',
  lecturer: 'Lecturer',
  student:  'Student',
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = user?.role === 'admin' ? adminNav
    : user?.role === 'lecturer' ? lecturerNav
    : studentNav;

  const roleColor = roleColors[user?.role] || 'var(--teal)';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <ArkaviaMark size={36} />
          <div>
            <div className="sidebar-wordmark">ARKAVIA</div>
            <div className="sidebar-tagline">Secure Academic Archive</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map(item => (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: 8 }}>Security</div>
        <NavLink to="/observatory" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
          <Eye size={16} />
          Security Observatory
        </NavLink>
        <NavLink to="/lab" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
          <FlaskConical size={16} />
          Security Lab
        </NavLink>
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-chip" onClick={() => {}}>
          <div className="avatar avatar-sm" style={{
            background: `${roleColor}15`,
            color: roleColor,
            border: `1px solid ${roleColor}30`,
            fontSize: '0.7rem',
            fontWeight: 700,
          }}>
            {user?.avatar_initials || '??'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name}
            </div>
            <div style={{ fontSize: '0.65rem', color: roleColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {roleLabels[user?.role]}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', marginTop: 8, justifyContent: 'center', gap: 8 }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
