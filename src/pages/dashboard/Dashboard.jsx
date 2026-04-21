import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useNotifStore } from '../../store';
import toast from 'react-hot-toast';
import { Avatar, Badge } from '../../components/common/UI';
import api from '../../utils/api';
import { getSocket } from '../../utils/socket';

const SidebarItem = ({ to, icon, label, badge, end = false }) => (
  <NavLink
    to={to}
    end={end}
    style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px',
      borderRadius: 9, cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s',
      color: isActive ? '#A78BFA' : 'var(--txt2)',
      background: isActive ? 'rgba(108,78,246,.12)' : 'transparent',
      fontSize: '0.875rem', fontWeight: 500,
    })}
  >
    <span style={{ fontSize: '0.95rem', width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    {badge !== undefined && badge > 0 && (
      <span style={{ background: 'var(--acc)', color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: 100, fontFamily: 'Space Mono,monospace' }}>{badge}</span>
    )}
  </NavLink>
);

const Dashboard = () => {
  // Use selective subscriptions to avoid unnecessary re-renders
  // Only subscribe to fields actually used in this component
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const activeRole = useAuthStore(s => s.activeRole);

  const { unreadCount } = useNotifStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Redirect if not authenticated - only depends on user, not navigate
  // Using user as source of truth prevents premature redirects
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user]); // Only user, NOT navigate function

  // Real-time unread message count using socket events
  useEffect(() => {
    if (!user) return;

    // Initial fetch on mount
    const fetchUnreadCount = async () => {
      try {
        const { data } = await api.get('/messages/unread-count');
        setUnreadMessages(data.unreadCount || 0);
      } catch (err) {
      }
    };

    fetchUnreadCount();

    // Get socket and listen for real-time updates
    try {
      const socket = getSocket();

      // Listen for new messages received in any conversation
      const handleMessageReceived = (data) => {
        // Increment unread count when new message arrives from someone else
        setUnreadMessages(prev => prev + 1);
      };

      // Listen for messages marked as read
      const handleMessagesSeen = (data) => {
        // Decrement unread count when messages are marked as read
        if (data.messageCount > 0) {
          setUnreadMessages(prev => Math.max(0, prev - data.messageCount));
        }
      };

      // Listen for unread count updates from server
      const handleUnreadCountUpdate = (data) => {
        // Direct update from server (most accurate)
        setUnreadMessages(data.unreadCount || 0);
      };

      socket.on('chat:message.received', handleMessageReceived);
      socket.on('messages_seen', handleMessagesSeen);
      socket.on('unread:count.updated', handleUnreadCountUpdate);

      return () => {
        socket.off('chat:message.received', handleMessageReceived);
        socket.off('messages_seen', handleMessagesSeen);
        socket.off('unread:count.updated', handleUnreadCountUpdate);
      };
    } catch (err) {
      // Fallback: poll every 30 seconds if socket fails
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout(); // Clears user, token, and auth state
    navigate('/login', { replace: true }); // Navigate after logout
  };

  // Will be redirected before this renders if user is null
  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--txt2)' }}>
        Loading...
      </div>
    );
  }

  const canClient = user?.role === 'client' || user?.canActAsClient;
  const roleMode = activeRole || (canClient ? 'client' : 'freelancer');
  const isClient = roleMode === 'client';
  const isFreelancer = roleMode === 'freelancer';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: collapsed ? '60px 1fr' : '240px 1fr', minHeight: '100vh', paddingTop: 64 }}>
      {/* Sidebar */}
      <aside style={{ background: 'var(--s1)', borderRight: '1px solid var(--b1)', padding: collapsed ? '1.25rem 0.5rem' : '1.25rem 0.875rem', position: 'sticky', top: 64, height: 'calc(100vh - 64px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', transition: 'all 0.25s' }}>
        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0.4rem 0.65rem', marginBottom: '1.25rem' }}>
          <Avatar user={user} size={36} radius="9px" />
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--acc2)' }}>● Online</div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '0 0.75rem', marginBottom: '0.4rem', fontFamily: 'Space Mono,monospace' }}>Main</div>
          <SidebarItem to="/dashboard" end icon="📊" label="Overview" />
          <SidebarItem to="/dashboard/orders" icon="📦" label="Orders" />
          <SidebarItem to="/dashboard/reviews" icon="⭐" label="Reviews" />
          {!isClient && <SidebarItem to="/dashboard/proposals" icon="📝" label="Proposals" />}
          <SidebarItem to="/dashboard/messages" icon="💬" label="Messages" badge={unreadMessages} />
        </div>

        <div style={{ height: 1, background: 'var(--b1)', margin: '0.5rem' }} />

        <div style={{ marginBottom: '1.25rem', marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '0 0.75rem', marginBottom: '0.4rem', fontFamily: 'Space Mono,monospace' }}>Work</div>
          {isFreelancer && <SidebarItem to="/dashboard/create-order" icon="✨" label="Create Order" />}
          {isFreelancer && <SidebarItem to="/dashboard/my-offers" icon="⚡" label="My Offers" />}
          {isClient && <SidebarItem to="/dashboard/my-jobs" icon="💼" label="My Jobs" />}
          {!isClient && <SidebarItem to="/dashboard/skill-tests" icon="🧠" label="Skill Tests" />}

          <SidebarItem to="/dashboard/milestones" icon="🚀" label="Milestones" />
          <SidebarItem to="/dashboard/ai" icon="🤖" label="AI Assistant" />
        </div>

        <div style={{ height: 1, background: 'var(--b1)', margin: '0.5rem' }} />

        <div style={{ marginBottom: '1.25rem', marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '0 0.75rem', marginBottom: '0.4rem', fontFamily: 'Space Mono,monospace' }}>Account</div>
          <SidebarItem to="/dashboard/profile" icon="👤" label="Profile" />
          <SidebarItem to="/dashboard/analytics" icon="📈" label="Analytics" />
          <SidebarItem to="/dashboard/payments" icon="💳" label="Payments" />
          <SidebarItem to="/dashboard/notifications" icon="🔔" label="Notifications" badge={unreadCount} />
          <SidebarItem to="/dashboard/disputes" icon="⚠️" label="Disputes" />
          <SidebarItem to="/dashboard/settings" icon="⚙️" label="Settings" />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        <div style={{ height: 1, background: 'var(--b1)', margin: '0.5rem 0' }} />
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', borderRadius: 9, cursor: 'pointer', background: 'none', border: 'none', color: 'var(--err)', fontSize: '0.875rem', fontWeight: 500, width: '100%' }}>
          <span style={{ fontSize: '0.95rem', width: 18 }}>🚪</span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ padding: '1.75rem ', overflowY: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
