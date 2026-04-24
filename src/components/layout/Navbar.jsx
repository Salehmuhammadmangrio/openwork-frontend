import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useNotifStore, useUIStore } from '../../store';
import { useOutsideClick } from '../../hooks';
import { Avatar } from '../common/UI';
import { formatRelative } from '../../utils/helpers';
import toast from 'react-hot-toast';
import RoleSwitcher from '../auth/RoleSwitcher';

// Add animation styles
const animationStyle = document.createElement('style');
animationStyle.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
if (typeof document !== 'undefined' && !document.getElementById('navbar-animations')) {
  animationStyle.id = 'navbar-animations';
  document.head.appendChild(animationStyle);
}

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Use selective subscriptions - only subscribe to needed fields
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const logout = useAuthStore(s => s.logout);

  const notifications = useNotifStore(s => s.notifications);
  const unreadCount = useNotifStore(s => s.unreadCount);
  const markRead = useNotifStore(s => s.markRead);
  const markAllRead = useNotifStore(s => s.markAllRead);

  const theme = useUIStore(s => s.theme);
  const toggleTheme = useUIStore(s => s.toggleTheme);

  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const notifRef = useOutsideClick(() => setNotifOpen(false));
  const userRef = useOutsideClick(() => setUserMenuOpen(false));

  // Apply theme to document
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  // useEffect(() => {}, [switchRole])

  const navLinks = user?.role === 'admin'
    ? [{ to: '/admin', label: 'Admin' }]
    : [
      ...(user?.role !== 'freelancer' ? [{ to: '/freelancers', label: 'Find Talent' }] : []),
      { to: '/jobs', label: 'Browse Jobs' },
      ...(user?.role === 'freelancer' ? [{ to: '/dashboard/proposals', label: 'My Proposals' }] : []),
      ...(user?.role === 'freelancer' ? [{ to: '/dashboard/my-offers', label: 'My Offers' }] : []),
      { to: '/offers', label: 'Open Offers' },
      ...(user ? [{ to: '/dashboard/ai', label: '🤖 AI Assistant' }] : []),
      ...(user?.role === 'client' ? [{ to: '/dashboard/my-jobs', label: 'My Jobs' }] : []),
    ].filter(Boolean);


  const handleLogout = () => {
    setShowSignOutConfirm(true);
  };

  const confirmSignOut = () => {
    logout();
    setShowSignOutConfirm(false);
    setUserMenuOpen(false);
    toast.success('Logged out successfully');
    navigate('/');
  };

  const cancelSignOut = () => {
    setShowSignOutConfirm(false);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900, height: 64,
      background: 'var(--nav-bg)',
      color: theme === 'light' ? '#1E2030' : '#F0EFF8',
      borderBottom: '1px solid var(--inv-clr)', padding: '0 1.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'Roboto,sans-serif', fontWeight: 800, fontSize: '1.35rem', color: 'var(--txt)', textDecoration: 'none' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Mono,monospace', fontSize: 13, fontWeight: 700,
          color: theme === 'light' ? '#FFFFFF' : '#1E1E2D',
          background: theme === 'light' ? '#1E2030' : '#F0EFF8',
          border: theme === 'light' ? '1px solid rgba(17,24,39,0.12)' : '1px solid rgba(255,255,255,0.12)',
          // Show as Raised 3D Object using shadows
          boxShadow: theme === 'dark' ? '2px 2px 5px rgba(0,0,0,0.1), -2px -2px 5px rgba(255,255,255,0.7)' : '2px 2px 5px rgba(0,0,0,0.7), -2px -2px 5px rgba(255,255,255,0.1)',
        }}>OW</div>
        OpenWork
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="nav-links">
        {navLinks.map(l => (
          (!l.userRole || l.userRole === user?.role) && (
            <Link key={l.to} to={l.to}
              style={{
                padding: '6px 13px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500,
                color: isActive(l.to) ? 'var(--txt)' : 'var(--txt2)',
                background: isActive(l.to) ? 'var(--s1)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.2s',
              }}
            >
              {l.label}</Link>
          )
        ))}

        {user?.role === 'admin' && (
          <Link to="/admin" style={{ padding: '6px 13px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, color: 'var(--err)', background: 'rgba(255,77,106,.1)', textDecoration: 'none' }}>👑 Admin</Link>
        )}
      </div>

      {/* Right Side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: 36, height: 36, borderRadius: 9, background: 'var(--s1)', border: '1px solid var(--b1)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, transition: 'all 0.2s', color: 'var(--txt)'
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>


        {isAuthenticated ? (
          <>
            <RoleSwitcher />
            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--s1)', border: '1px solid var(--b1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, position: 'relative', transition: 'all 0.2s' }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 7, right: 7, width: 8, height: 8, background: 'var(--err)', borderRadius: '50%', border: '2px solid var(--bg)' }} />
                )}
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 14, boxShadow: '0 16px 48px rgba(0,0,0,.5)', zIndex: 1000 }}>
                  <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--b1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Notifications {unreadCount > 0 && <span style={{ background: 'var(--acc)', color: '#fff', fontSize: '0.62rem', padding: '1px 6px', borderRadius: 100, marginLeft: 5 }}>{unreadCount}</span>}</span>
                    <button onClick={markAllRead} style={{ fontSize: '0.75rem', color: 'var(--acc)', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
                  </div>
                  <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--txt3)', fontSize: '0.845rem' }}>No notifications yet</div>
                    ) : notifications.slice(0, 10).map(n => (
                      <div
                        key={n._id}
                        onClick={() => { markRead(n._id); if (n.link) navigate(n.link); setNotifOpen(false); }}
                        style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--b1)', cursor: 'pointer', background: n.isRead ? 'transparent' : 'rgba(108,78,246,.04)', display: 'flex', gap: 10, transition: 'background 0.2s' }}
                      >
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(108,78,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', flexShrink: 0 }}>🔔</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', gap: 5, alignItems: 'center' }}>
                            {n.title}
                            {!n.isRead && <span style={{ width: 5, height: 5, background: 'var(--acc)', borderRadius: '50%', display: 'inline-block' }} />}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--txt2)', marginTop: 2, lineHeight: 1.4 }}>{n.message}</div>
                          <div style={{ fontSize: '0.67rem', color: 'var(--txt3)', marginTop: 3 }}>{formatRelative(n.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '0.65rem', borderTop: '1px solid var(--b1)', textAlign: 'center' }}>
                    <Link to="/dashboard/notifications" onClick={() => setNotifOpen(false)} style={{ fontSize: '0.78rem', color: 'var(--acc)' }}>View all notifications</Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div ref={userRef} style={{ position: 'relative' }}>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '5px 10px 5px 5px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <Avatar user={user} size={28} radius="8px" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--txt)' }}>{user?.fullName?.split(' ')[0]}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--txt3)' }}>▼</span>
              </button>
              {userMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 200, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 13, boxShadow: '0 12px 40px rgba(0,0,0,.4)', zIndex: 1000, overflow: 'hidden' }}>
                  {[
                    { label: '📊 Dashboard', to: '/dashboard' },
                    ...(user?.role === 'freelancer' ? [{ label: '📝 Proposals', to: '/dashboard/proposals' }] : []),
                    ...(user?.role === 'client' ? [{ label: '💼 My Jobs', to: '/dashboard/my-jobs' }] : []),
                    { label: '👤 Profile', to: '/dashboard/profile' },
                    { label: '📦 Orders', to: '/dashboard/orders' },
                    { label: '💬 Messages', to: '/dashboard/messages' },
                    { label: '💳 Payments', to: '/dashboard/payments' },
                    { label: '⚙️ Settings', to: '/dashboard/settings' },
                  ].filter(Boolean).map(item => (

                    <Link key={item.to} to={item.to} onClick={() => setUserMenuOpen(false)} style={{ display: 'block', padding: '9px 14px', fontSize: '0.845rem', color: 'var(--txt2)', textDecoration: 'none', transition: 'all 0.15s', borderBottom: '1px solid var(--b1)' }}>{item.label}</Link>
                  ))}
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '9px 14px', fontSize: '0.845rem', color: 'var(--err)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>🚪 Sign Out</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" style={{ padding: '7px 16px', borderRadius: 9, fontSize: '0.845rem', fontWeight: 600, color: 'var(--txt2)', border: '1px solid var(--b2)', textDecoration: 'none', transition: 'all 0.2s' }}>Sign In</Link>
            <Link to="/register" style={{ padding: '7px 16px', borderRadius: 9, fontSize: '0.845rem', fontWeight: 600, color: '#fff', background: 'var(--g1)', textDecoration: 'none', boxShadow: '0 4px 16px rgba(108,78,246,.35)' }}>Get Started →</Link>
          </>
        )}
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'var(--s2)',
            border: '1px solid var(--b2)',
            borderRadius: 16,
            padding: '2rem',
            maxWidth: 380,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            animation: 'slideUp 0.2s ease-out'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--txt)' }}>
                Sign Out?
              </h3>
              <p style={{ color: 'var(--txt2)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to sign out? You'll need to sign in again to access your account.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={cancelSignOut}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: 10,
                  border: '1px solid var(--b2)',
                  background: 'transparent',
                  color: 'var(--txt2)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--s1)';
                  e.target.style.color = 'var(--txt)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--txt2)';
                }}
              >
                ✕ Cancel
              </button>
              <button
                onClick={confirmSignOut}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--acc) 0%, var(--acc2) 100%)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 16px rgba(108,78,246,0.35)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(108,78,246,0.45)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(108,78,246,0.35)';
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
