import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { Button, Badge, Avatar, PageLoader, EmptyState } from '../components/common/UI';
import { formatDate, formatRelative } from '../utils/helpers';
import { useAuthStore } from '../store';

export default function ViewProposal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [proposal, setProposal] = useState(null);
  const [job, setJob] = useState(null);
  const [freelancer, setFreelancer] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    loadProposal();
  }, [id, isAuthenticated]);

  const loadProposal = async () => {
    try {
      const responseData = await api.get(`/proposals/${id}`);
      const data = responseData.data;
      setProposal(data.proposal);
      setJob(data.proposal.job);
      setFreelancer(data.proposal.freelancer);
      setClient(data.proposal.job?.client);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Proposal not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async () => {
    if (!window.confirm('Are you sure you want to accept this proposal? This will create an order and you\'ll be charged.')) return;

    setActionLoading(true);
    try {
      const responseData = await api.put(`/proposals/${id}/accept`);
      toast.success('Proposal accepted! Order created.');
      if (responseData.data?.order?._id) {
        navigate(`/dashboard/orders/${responseData.data.order._id}`);
      } else {
        navigate('/dashboard/orders');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept proposal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectProposal = async () => {
    if (!window.confirm('Are you sure you want to reject this proposal?')) return;

    setActionLoading(true);
    try {
      await api.put(`/proposals/${id}/withdraw`);
      toast.success('Proposal rejected');
      navigate('/dashboard/proposals');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject proposal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawProposal = async () => {
    if (!window.confirm('Are you sure you want to withdraw this proposal?')) return;

    setActionLoading(true);
    try {
      await api.put(`/proposals/${id}/withdraw`);
      toast.success('Proposal withdrawn');
      setProposal(prev => ({ ...prev, status: 'withdrawn' }));
      navigate('/dashboard/proposals');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to withdraw proposal');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  if (!proposal || !job || !freelancer || !client) {
    return <EmptyState icon="❌" title="Proposal Not Found" description="The proposal you're looking for doesn't exist or has been removed." />;
  }

  const isFreelancer = user?._id === freelancer._id;
  const isClient = user?._id === client._id;
  const canManageProposal = isFreelancer || isClient;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--bg) 0%, rgba(108,78,246,0.05) 100%)', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '1rem',
              color: 'var(--acc)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateX(-4px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateX(0)'}
          >
            ← Back to Proposals
          </button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 900, margin: 0, color: 'var(--txt)' }}>
                💼 Proposal Details
              </h1>
              <p style={{ color: 'var(--txt2)', margin: '0.75rem 0 0 0', fontSize: '0.95rem' }}>
                Submitted {formatRelative(proposal.createdAt)}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Badge variant={
                proposal.status === 'pending' ? 'warn' :
                  proposal.status === 'accepted' ? 'ok' :
                    proposal.status === 'rejected' ? 'error' :
                      proposal.status === 'withdrawn' ? 'neutral' : 'neutral'
              }>
                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{
              background: 'rgba(108,78,246,0.08)',
              border: '1px solid rgba(108,78,246,0.15)',
              borderRadius: 12,
              padding: '1.25rem',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt2)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                💰 Bid Amount
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--acc)' }}>
                ${proposal.bidAmount.toFixed(2)}
              </div>
            </div>
            <div style={{
              background: 'rgba(108,78,246,0.08)',
              border: '1px solid rgba(108,78,246,0.15)',
              borderRadius: 12,
              padding: '1.25rem',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt2)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                ⏱️ Delivery Time
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--warn)' }}>
                {proposal.deliveryTime}
              </div>
            </div>
            <div style={{
              background: 'rgba(108,78,246,0.08)',
              border: '1px solid rgba(108,78,246,0.15)',
              borderRadius: 12,
              padding: '1.25rem',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt2)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                📅 Submitted
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                {formatDate(proposal.createdAt).split(',')[0]}
              </div>
            </div>
          </div>
        </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem' }}>
        {/* Main Content */}
        <div>
          {/* Job Information */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 16,
            padding: '2rem',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📋</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {job.title}
              </h3>
            </div>
            
            <p style={{ color: 'var(--txt2)', lineHeight: 1.8, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              {job.description}
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ background: 'rgba(108,78,246,0.05)', padding: '1rem', borderRadius: 12 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt2)', marginBottom: '0.4rem' }}>BUDGET</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--acc)' }}>
                  ${job.budgetMin} - ${job.budgetMax}
                </div>
              </div>
              <div style={{ background: 'rgba(108,78,246,0.05)', padding: '1rem', borderRadius: 12 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt2)', marginBottom: '0.4rem' }}>CATEGORY</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{job.category}</div>
              </div>
              <div style={{ background: 'rgba(108,78,246,0.05)', padding: '1rem', borderRadius: 12 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt2)', marginBottom: '0.4rem' }}>POSTED</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{formatRelative(job.createdAt)}</div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => navigate(`/jobs/${job._id}`)}
              style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}
            >
              View Full Job →
            </Button>
          </div>

          {/* Proposal Content */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 16,
            padding: '2rem',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📝</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Proposal Details
              </h3>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--txt)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Cover Letter
              </h4>
              <div style={{
                background: 'rgba(108,78,246,0.04)',
                border: '1px solid rgba(108,78,246,0.1)',
                borderRadius: 12,
                padding: '1.25rem',
                color: 'var(--txt2)',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                fontSize: '0.95rem',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {proposal.coverLetter}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{ background: 'rgba(108,78,246,0.05)', padding: '1.25rem', borderRadius: 12 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt2)', textTransform: 'uppercase' }}>
                  Bid Amount
                </label>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--acc)', marginTop: '0.4rem' }}>
                  ${proposal.bidAmount.toFixed(2)}
                </div>
              </div>
              <div style={{ background: 'rgba(108,78,246,0.05)', padding: '1.25rem', borderRadius: 12 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt2)', textTransform: 'uppercase' }}>
                  Delivery Time
                </label>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.4rem' }}>
                  {proposal.deliveryTime}
                </div>
              </div>
              <div style={{ background: 'rgba(108,78,246,0.05)', padding: '1.25rem', borderRadius: 12 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt2)', textTransform: 'uppercase' }}>
                  Submitted Date
                </label>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.4rem' }}>
                  {formatDate(proposal.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Freelancer Profile */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 16,
            padding: '2rem',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>👨‍💻</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                About the Freelancer
              </h3>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              marginBottom: '1.5rem',
              paddingBottom: '1.5rem',
              borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}>
              {freelancer?._id && <Avatar name={freelancer.fullName} id={freelancer._id} size={56} />}
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                  {freelancer.fullName}
                </h4>
                <p style={{ color: 'var(--txt2)', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                  {freelancer.title || 'Freelancer'}
                </p>
              </div>
              {freelancer?._id && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/freelancers/${freelancer._id}`)}
                >
                  View Profile
                </Button>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem'
            }}>
              <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(108,78,246,0.05)', borderRadius: 12 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--acc)' }}>
                  {freelancer.averageRating?.toFixed(1) || 'N/A'}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt2)', marginTop: '0.4rem' }}>
                  ⭐ Rating
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(108,78,246,0.05)', borderRadius: 12 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>
                  {freelancer.completedJobs || 0}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt2)', marginTop: '0.4rem' }}>
                  💼 Jobs
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(108,78,246,0.05)', borderRadius: 12 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--acc)' }}>
                  ${freelancer.hourlyRate}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt2)', marginTop: '0.4rem' }}>
                  /hr
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Client Information */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 16,
            padding: '1.5rem',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🏢 Client
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              {client?._id && <Avatar name={client.fullName} id={client._id} size={44} />}
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  {client.fullName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--txt2)', marginTop: '0.25rem' }}>
                  {client.companyName || 'Individual Client'}
                </div>
              </div>
            </div>
            {client?._id && (
              <Button
                variant="ghost"
                full
                size="sm"
                onClick={() => navigate(`/users/${client._id}`)}
              >
                View Profile
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          {canManageProposal && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 16,
              padding: '1.5rem',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem' }}>
                ⚡ Actions
              </h3>

              {isClient && proposal.status === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Button
                    variant="primary"
                    full
                    onClick={handleAcceptProposal}
                    loading={actionLoading}
                    style={{ padding: '0.9rem', fontWeight: 700 }}
                  >
                    ✅ Accept Proposal
                  </Button>
                  <Button
                    variant="error"
                    full
                    onClick={handleRejectProposal}
                    loading={actionLoading}
                    style={{ padding: '0.9rem', fontWeight: 700 }}
                  >
                    ❌ Reject Proposal
                  </Button>
                </div>
              )}

              {isFreelancer && proposal.status === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Button
                    variant="warn"
                    full
                    onClick={handleWithdrawProposal}
                    loading={actionLoading}
                    style={{ padding: '0.9rem', fontWeight: 700 }}
                  >
                    ↩️ Withdraw Proposal
                  </Button>
                </div>
              )}

              {proposal.status !== 'pending' && (
                <div style={{
                  textAlign: 'center',
                  padding: '1rem',
                  background: 'rgba(255,190,0,0.08)',
                  borderRadius: 12,
                  color: 'var(--txt2)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5
                }}>
                  ℹ️ This proposal is <strong>{proposal.status}</strong> and cannot be modified.
                </div>
              )}
            </div>
          )}

          {/* Status Information */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 16,
            padding: '1.5rem',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              📊 Timeline
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: 'rgba(108,78,246,0.05)',
                borderRadius: 10
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--txt2)', fontWeight: 600 }}>Status</span>
                <Badge variant={
                  proposal.status === 'pending' ? 'warn' :
                    proposal.status === 'accepted' ? 'ok' :
                      proposal.status === 'rejected' ? 'error' :
                        proposal.status === 'withdrawn' ? 'neutral' : 'neutral'
                }>
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </Badge>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: 'rgba(108,78,246,0.05)',
                borderRadius: 10
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--txt2)', fontWeight: 600 }}>Submitted</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  {formatDate(proposal.createdAt)}
                </span>
              </div>

              {proposal.updatedAt && proposal.updatedAt !== proposal.createdAt && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'rgba(108,78,246,0.05)',
                  borderRadius: 10
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--txt2)', fontWeight: 600 }}>Updated</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    {formatDate(proposal.updatedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );}