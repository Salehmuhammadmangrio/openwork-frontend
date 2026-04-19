import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifStore } from '../../store';
import { Button, Card, EmptyState } from '../../components/common/UI';
import { formatRelative } from '../../utils/helpers';

export default function DashNotifications() {
  const navigate = useNavigate();
  const { notifications, fetch: fetchNotifications, markRead, markAllRead } = useNotifStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="animate-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div><h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Notifications</h1><p style={{ color: 'var(--txt2)', fontSize: '0.875rem', marginTop: 3 }}>All your activity updates</p></div>
        <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button>
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {notifications.length === 0 ? <EmptyState icon="🔔" title="No notifications" description="All caught up! New activity will appear here." /> : notifications.map(n => (
          <div key={n._id} onClick={() => { markRead(n._id); if (n.link) navigate(n.link); }} style={{ display: 'flex', gap: 11, padding: '0.875rem 1rem', borderBottom: '1px solid var(--b1)', cursor: 'pointer', background: n.isRead ? 'transparent' : 'rgba(108,78,246,.04)', transition: 'background 0.2s' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(108,78,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', flexShrink: 0 }}>🔔</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.845rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>{n.title}{!n.isRead && <span style={{ width: 5, height: 5, background: 'var(--acc)', borderRadius: '50%', display: 'inline-block' }} />}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--txt2)', marginTop: 2, lineHeight: 1.5 }}>{n.message}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginTop: 4 }}>{formatRelative(n.createdAt)}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}