import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const navItems = [
  { path: '/', label: 'Home', icon: '⌂', exact: true },
  { path: '/search', label: 'Search', icon: '⊕' },
  { path: '/requests', label: 'My Requests', icon: '♫' },
  { path: '/library', label: 'Plex Library', icon: '▶' },
  { path: '/queue', label: 'Download Queue', icon: '↓' },
];

const adminItems = [
  { path: '/admin/requests', label: 'All Requests', icon: '✓' },
  { path: '/admin/users', label: 'Users', icon: '◉' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-mark">♪</span>
          <span className="sidebar-logo-text">SOUNDRR</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <div className="nav-divider"><span>Admin</span></div>
              {adminItems.map(item => (
                <NavLink key={item.path} to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="btn-ghost logout-btn" onClick={handleLogout} title="Logout">⏻</button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
