import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Search from './pages/Search';
import Requests from './pages/Requests';
import Library from './pages/Library';
import Queue from './pages/Queue';
import Settings from './pages/Settings';
import './index.css';

function RequireAuth({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner" /></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
      <Route path="/search" element={<RequireAuth><Search /></RequireAuth>} />
      <Route path="/requests" element={<RequireAuth><Requests /></RequireAuth>} />
      <Route path="/library" element={<RequireAuth><Library /></RequireAuth>} />
      <Route path="/queue" element={<RequireAuth><Queue /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth adminOnly><Settings /></RequireAuth>} />
      <Route path="/admin/requests" element={<RequireAuth adminOnly><Requests /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
