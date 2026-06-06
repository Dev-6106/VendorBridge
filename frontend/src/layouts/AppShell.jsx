import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { section: 'Overview', items: [
    { icon: '📊', label: 'Dashboard', path: '/' },
  ]},
  { section: 'Procurement', items: [
    { icon: '🏢', label: 'Vendor Management', path: '/vendors' },
    { icon: '📋', label: 'RFQ Management', path: '/rfqs' },
    { icon: '💬', label: 'Quotations', path: '/quotations' },
    { icon: '✅', label: 'Approvals', path: '/approvals' },
  ]},
  { section: 'Finance', items: [
    { icon: '🛒', label: 'PO & Invoices', path: '/pos' },
  ]},
  { section: 'Insights', items: [
    { icon: '🔔', label: 'Activity & Logs', path: '/activity' },
    { icon: '📈', label: 'Reports', path: '/reports' },
  ]},
];

function isActive(pathname, path) {
  if (path === '/') return pathname === '/';
  return pathname.startsWith(path);
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const currentLabel = navItems.flatMap(s => s.items).find(n => isActive(location.pathname, n.path))?.label || 'Dashboard';

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">⚡</div>
            <div>
              <div className="sidebar-logo-text">VendorBridge</div>
              <div className="sidebar-logo-sub">ERP Pro Suite</div>
            </div>
          </div>
        </div>

        <nav>
          {navItems.map(section => (
            <div className="nav-section" key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              {section.items.map(item => (
                <div
                  key={item.path}
                  className={`nav-item ${isActive(location.pathname, item.path) ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <img
            className="user-avatar"
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}&backgroundColor=6366f1`}
            alt="avatar"
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-mini-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</div>
            <div className="user-mini-role">{user?.role || 'Role'}</div>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <h2 id="pageTitle">{currentLabel}</h2>
            <p id="liveClock">{time}</p>
          </div>
          <div className="topbar-right">
            <div className="topbar-search">
              <span>🔍</span>
              <input type="text" placeholder="Search vendors, RFQs, POs…" />
            </div>
            <div className="notif-btn" title="Notifications">
              🔔<span className="notif-dot"></span>
            </div>
            <div className="topbar-profile">
              <img
                className="topbar-avatar"
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}&backgroundColor=6366f1`}
                alt="profile"
              />
              <div>
                <div className="topbar-name">{user?.name || 'User'}</div>
                <div className="topbar-role">{user?.role || 'Role'}</div>
              </div>
            </div>
            <button className="btn-logout" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </header>

        {/* Page Content */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
