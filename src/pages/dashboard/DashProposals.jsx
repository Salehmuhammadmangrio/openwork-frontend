import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge, Tabs, EmptyState, PageLoader, Alert } from '../../components/common/UI';
import { formatCurrency, formatRelative, statusColor } from '../../utils/helpers';
import api from '../../utils/api';


export default function DashProposals() {
  const [activeTab, setActiveTab] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const proposals = data?.proposals || [];
  const navigate = useNavigate();

  const filtered = activeTab === 'all' ? proposals : proposals.filter(p => p.status === activeTab);

  const tabs = [
    { key: 'all', label: 'All', badge: proposals.length },
    { key: 'pending', label: 'Pending', badge: proposals.filter(p => p.status === 'pending').length },
    { key: 'accepted', label: 'Accepted', badge: proposals.filter(p => p.status === 'accepted').length },
    { key: 'rejected', label: 'Rejected', badge: proposals.filter(p => p.status === 'rejected').length },
  ];

  const fetchProposals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/proposals/my?t=${Date.now()}`);
      console.log('✓ Proposals loaded successfully:', response.data);
      setData(response.data);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load proposals. Please try again.';
      console.error('✗ Error fetching proposals:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  return (
    <div className="animate-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div><h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>My Proposals</h1><p style={{ color: 'var(--txt2)', fontSize: '0.875rem', marginTop: 3 }}>Track job applications and bids</p></div>
        <Button onClick={() => navigate('/jobs')} variant="primary" size="sm">Find Jobs</Button>
      </div>
      
      {error && (
        <Alert type="error" style={{ marginBottom: '1rem' }}>
          {error}
          <Button variant="ghost" size="sm" onClick={fetchProposals} style={{ marginLeft: '0.5rem' }}>
            Retry
          </Button>
        </Alert>
      )}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState 
          icon="📝" 
          title="No proposals" 
          description="Apply to jobs to see your proposals here"
          action={<Button onClick={() => navigate('/jobs')} variant="primary" size="sm">Browse Jobs</Button>}
        />
      ) : (
        filtered.map(prop => (
          <div key={prop._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 13, marginBottom: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--s2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>📝</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{prop.job?.title || 'Job'}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--txt2)', marginTop: 2 }}>{prop.job?.client?.companyName || 'Client'} · Submitted {formatRelative(prop.createdAt)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
              <Badge color={statusColor(prop.status)}>{prop.status}</Badge>
              <span style={{ fontFamily: 'Space Mono,monospace', fontSize: '0.875rem', fontWeight: 700 }}>{formatCurrency(prop.bidAmount)}</span>
              <Button size="xs" variant="ghost" onClick={() => navigate(`/jobs/${prop.job?._id}`)}>View Job</Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}