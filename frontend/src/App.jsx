import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

import LoginPage      from './pages/LoginPage.jsx';
import DashboardPage  from './pages/DashboardPage.jsx';
import CoursesPage    from './pages/CoursesPage.jsx';
import AssignmentsPage from './pages/AssignmentsPage.jsx';
import SubmissionPage from './pages/SubmissionPage.jsx';
import ForumPage      from './pages/ForumPage.jsx';
import TopicPage      from './pages/TopicPage.jsx';
import ObservatoryPage from './pages/ObservatoryPage.jsx';
import LabPage        from './pages/LabPage.jsx';
import AdminPage      from './pages/AdminPage.jsx';
import LecturerPage   from './pages/LecturerPage.jsx';
import NotFoundPage   from './pages/NotFoundPage.jsx';

import Sidebar        from './components/Sidebar.jsx';
import Topbar         from './components/Topbar.jsx';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'16px' }}>
        <div className="loading-spinner" />
        <p className="text-muted text-sm">Loading ARKAVIA...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/submissions/:id" element={<SubmissionPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/topic/:id" element={<TopicPage />} />
          <Route path="/observatory" element={<ObservatoryPage />} />
          <Route path="/lab" element={<LabPage />} />
          {user.role === 'admin' && <Route path="/admin" element={<AdminPage />} />}
          {user.role === 'lecturer' && <Route path="/lecturer" element={<LecturerPage />} />}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:99 }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
