import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../../store';
import toast from 'react-hot-toast';

/**
 * Dashboard Layout Component
 * Provides sidebar navigation and main content area for dashboard pages
 */
const DashboardLayout = ({ children, sections = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use selective subscriptions
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const activeRole = useAuthStore(s => s.activeRole);
  
  const sidebarOpen = useUIStore(s => s.sidebarOpen);
  const toggleSidebar = useUIStore(s => s.toggleSidebar);
  
  const [expandedSection, setExpandedSection] = useState(null);

  const isFreelancer = activeRole === 'freelancer';

  // Define dashboard sections
  const freelancerSections = [
    {
      label: 'Main',
      items: [
        { icon: '📊', label: 'Overview', path: '/dashboard' },
        { icon: '📦', label: 'Orders', path: '/dashboard/orders' },
        { icon: '💼', label: 'Proposals', path: '/dashboard/proposals' },
        { icon: '💬', label: 'Messages', path: '/dashboard/messages' },
      ],
    },
    {
      label: 'Work',
      items: [
        { icon: '🔍', label: 'Browse Jobs', path: '/jobs' },
        { icon: '🎁', label: 'Browse Offers', path: '/offers' },
        { icon: '📝', label: 'Skill Tests', path: '/dashboard/skill-tests' },
        { icon: '🏆', label: 'Milestones', path: '/dashboard/milestones' },
        { icon: '🤖', label: 'AI Assistant', path: '/ai' },
      ],
    },
    {
      label: 'Account',
      items: [
        { icon: '👤', label: 'Profile', path: '/dashboard/profile' },
        { icon: '📈', label: 'Analytics', path: '/dashboard/analytics' },
        { icon: '💰', label: 'Payments', path: '/dashboard/payments' },
        { icon: '🔔', label: 'Notifications', path: '/dashboard/notifications' },
        { icon: '⚖️', label: 'Disputes', path: '/dashboard/disputes' },
        { icon: '⚙️', label: 'Settings', path: '/dashboard/settings' },
      ],
    },
  ];

  const clientSections = [
    {
      label: 'Main',
      items: [
        { icon: '📊', label: 'Overview', path: '/dashboard' },
        { icon: '📝', label: 'My Jobs', path: '/dashboard/my-jobs' },
        { icon: '👥', label: 'Proposals', path: '/dashboard/proposals' },
        { icon: '💬', label: 'Messages', path: '/dashboard/messages' },
        { icon: '📦', label: 'Orders', path: '/dashboard/orders' },
      ],
    },
    {
      label: 'Work',
      items: [
        { icon: '➕', label: 'Post Job', path: '/dashboard/post-job' },
        { icon: '🔍', label: 'Browse Talent', path: '/freelancers' },
        { icon: '🤖', label: 'AI Assistant', path: '/ai' },
      ],
    },
    {
      label: 'Account',
      items: [
        { icon: '👤', label: 'Profile', path: '/dashboard/profile' },
        { icon: '💰', label: 'Payments', path: '/dashboard/payments' },
        { icon: '🔔', label: 'Notifications', path: '/dashboard/notifications' },
        { icon: '⚖️', label: 'Disputes', path: '/dashboard/disputes' },
        { icon: '⚙️', label: 'Settings', path: '/dashboard/settings' },
      ],
    },
  ];

  const sections_ = isFreelancer ? freelancerSections : clientSections;
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', paddingTop: 64 }}>
      {/* Sidebar */}
      <aside style={{
        position: 'fixed',
        left: 0,
        top: 64,
        width: sidebarOpen ? 260 : 80,
        height: 'calc(100vh - 64px)',
        background: 'var(--s1)',
        borderRight: '1px solid var(--b1)',
        overflowY: 'auto',
        transition: 'width 0.3s ease',
        zIndex: 800,
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {sidebarOpen && (
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--txt)', margin: 0 }}>
              {isFreelancer ? 'Freelancer' : 'Client'}
            </h3>
          )}
          <button
            onClick={toggleSidebar}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid var(--b1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--txt)',
              fontSize: 16,
            }}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Sidebar Sections */}
        <nav style={{ padding: '12px' }}>
          {sections_.map((section) => (
            <div key={section.label} style={{ marginBottom: '16px' }}>
              {sidebarOpen && (
                <p style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--txt3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '8px 12px',
                  margin: '0 0 8px 0',
                }}>
                  {section.label}
                </p>
              )}
              {section.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    width: '100%',
                    padding: sidebarOpen ? '10px 12px' : '10px',
                    borderRadius: 8,
                    border: 'none',
                    background: isActive(item.path) ? 'var(--acc)' : 'transparent',
                    color: isActive(item.path) ? '#fff' : 'var(--txt2)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: isActive(item.path) ? 600 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: sidebarOpen ? 12 : 0,
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    marginBottom: '4px',
                    transition: 'all 0.2s',
                  }}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  {sidebarOpen && item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px',
            borderTop: '1px solid var(--b1)',
            background: 'var(--bg)',
          }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--err)',
                background: 'rgba(255,77,106,0.1)',
                color: 'var(--err)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              🚪 Logout
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: sidebarOpen ? 260 : 80,
        flex: 1,
        padding: '24px',
        background: 'var(--bg)',
        transition: 'margin-left 0.3s ease',
        minHeight: 'calc(100vh - 64px)',
      }}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
