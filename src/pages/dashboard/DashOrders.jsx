import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useFetch } from '../../hooks';
import { Button, Badge, Tabs, EmptyState, PageLoader, ProgressBar } from '../../components/common/UI';
import { formatCurrency, formatDate, statusColor, getAvatarGradient } from '../../utils/helpers';

export default function DashOrders() {
  const [activeTab, setActiveTab] = useState('all');
  const { data, loading, refetch } = useFetch('/orders/my', activeTab !== 'all' ? { status: activeTab } : {}, [activeTab]);
  const orders = data?.orders || [];
  const navigate = useNavigate();

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending_acceptance', label: 'Pending Acceptance' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="animate-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div><h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>My Orders</h1><p style={{ color: 'var(--txt2)', fontSize: '0.875rem', marginTop: 3 }}>Manage all your active and completed contracts</p></div>
        <Button onClick={() => navigate('/jobs')} variant="primary" size="sm">Find Work</Button>
      </div>
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      {loading ? <PageLoader /> : orders.length === 0 ? (
        <EmptyState icon="📦" title="No orders found" description="Start applying to jobs to get your first order" action={<Button onClick={() => navigate('/jobs')} variant="primary" size="sm">Browse Jobs</Button>} />
      ) : orders.map(order => (
        <div key={order._id} onClick={() => navigate(`/dashboard/orders/${order._id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 13, marginBottom: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--b2)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--b1)'}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: getAvatarGradient(order._id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {(order.client?.fullName || order.freelancer?.fullName || '?')[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{order.title}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--txt2)', marginTop: 2 }}>{order.client?.companyName || order.client?.fullName} · Due: {order.deliveryDate ? formatDate(order.deliveryDate) : 'N/A'} · {order._id.slice(-6).toUpperCase()}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
            <div style={{ width: 80 }}>
              <ProgressBar value={order.progress || 0} />
              <div style={{ fontSize: '0.65rem', color: 'var(--txt3)', textAlign: 'right', marginTop: 2 }}>{order.progress || 0}%</div>
            </div>
            <Badge color={statusColor(order.status)}>{order.status?.replace(/_/g, ' ')}</Badge>
            <span style={{ fontFamily: 'Space Mono,monospace', fontSize: '0.875rem', fontWeight: 700 }}>{formatCurrency(order.grossAmount)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
