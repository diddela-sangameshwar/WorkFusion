import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { alertAPI } from '../api';
import {
  FiHome, FiCheckSquare, FiBarChart2, FiUsers, FiFileText,
  FiBell, FiSettings, FiLogOut, FiMenu, FiX, FiCpu, FiActivity, FiZap,
} from 'react-icons/fi';

const DashboardLayout = () => {
  const { user, logout, isAdmin, isManagement } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await alertAPI.getAll({ limit: 1 });
        setUnreadAlerts(res.data.data.unreadCount || 0);
      } catch (e) { /* ignore */ }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
    { to: '/tasks', icon: <FiCheckSquare />, label: 'Tasks' },
    { to: '/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
    { to: '/progress', icon: <FiActivity />, label: 'Progress' },
  ];

  if (isManagement) {
    navItems.push(
      { to: '/users', icon: <FiUsers />, label: 'Users' },
      { to: '/reports', icon: <FiFileText />, label: 'Reports' }
    );
  }

  if (isAdmin) {
    navItems.push(
      { to: '/automation', icon: <FiCpu />, label: 'Automation' }
    );
  }

  const roleColors = {
    admin: '#ef4444',
    hr: '#8b5cf6',
    employee: '#3b82f6',
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <FiZap className="logo-icon" />
            {sidebarOpen && <span className="logo-text">WorkFusion</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar" style={{ background: roleColors[user?.role] || '#3b82f6' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="user-details">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role?.toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <h2 className="page-greeting">
              Welcome back, <span className="greeting-name">{user?.name?.split(' ')[0]}</span>
            </h2>
          </div>
          <div className="topbar-right">
            <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
              <span className="status-dot" />
              {connected ? 'Live' : 'Offline'}
            </div>
            <button className="topbar-btn alert-btn" onClick={() => navigate('/alerts')}>
              <FiBell />
              {unreadAlerts > 0 && <span className="badge">{unreadAlerts}</span>}
            </button>
            <button className="topbar-btn" onClick={handleLogout} title="Logout">
              <FiLogOut />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
