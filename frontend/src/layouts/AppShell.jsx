import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

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
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token) return;
    const fetchNotifs = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/activities', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const list = res.data.activities || [];
        setNotifications(list.slice(0, 5));
        
        // Mock unread if count changes
        setUnreadCount(prev => list.length > 0 ? (list.length !== notifications.length ? 3 : prev) : 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 8000);
    return () => clearInterval(timer);
  }, [token, notifications.length]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleNavItems = () => {
    if (!user) return [];
    const role = user.role;
    
    return navItems.map(section => {
      const filteredItems = section.items.filter(item => {
        if (role === 'Vendor') {
          return ['/', '/rfqs', '/quotations', '/pos'].includes(item.path);
        }
        if (role === 'Finance Manager') {
          return ['/', '/approvals', '/pos', '/activity', '/reports'].includes(item.path);
        }
        if (role === 'Procurement Officer') {
          return ['/', '/vendors', '/rfqs', '/quotations', '/pos', '/activity', '/reports'].includes(item.path);
        }
        return true; // Admin has all
      }).map(item => {
        if (role === 'Vendor') {
          if (item.path === '/rfqs') return { ...item, label: 'RFQ Invitations' };
          if (item.path === '/quotations') return { ...item, label: 'My Bids' };
          if (item.path === '/pos') return { ...item, label: 'My Purchase Orders' };
        }
        if (role === 'Finance Manager') {
          if (item.path === '/approvals') return { ...item, label: 'Pending Approvals' };
        }
        return item;
      });
      return { ...section, items: filteredItems };
    }).filter(section => section.items.length > 0);
  };

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
          {roleNavItems().map(section => (
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
            
            <div style={{ position: 'relative' }}>
              <div className="notif-btn" title="Notifications" onClick={() => { setShowNotif(!showNotif); setUnreadCount(0); }}>
                🔔{unreadCount > 0 && <span className="notif-dot"></span>}
              </div>
              {showNotif && (
                <div className="dropdown-panel" style={{
                  position: 'absolute',
                  top: '46px',
                  right: '0',
                  width: '280px',
                  background: 'var(--gray-900)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-xl)',
                  zIndex: 1000,
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gray-200)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.4rem', marginBottom: '0.25rem' }}>
                    Notifications
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', textAlign: 'center', padding: '1rem 0' }}>No new notifications</div>
                  ) : notifications.map(n => (
                    <div key={n.id} style={{ display: 'flex', gap: '8px', fontSize: '0.78rem', padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize: '1rem' }}>{n.icon || '🔔'}</span>
                      <div>
                        <div style={{ color: 'var(--gray-300)', lineHeight: '1.3' }}>{n.text}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--gray-600)', marginTop: '2px' }}>{new Date(n.timestamp).toLocaleTimeString('en-IN', { timeStyle: 'short' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
