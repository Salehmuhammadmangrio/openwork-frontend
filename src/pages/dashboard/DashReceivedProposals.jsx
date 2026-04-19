import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Badge, Avatar, Tabs, EmptyState, PageLoader } from '../../components/common/UI';
import { formatRelative, statusColor } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function DashReceivedProposals() {
  const [jobFilter, setJobFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [receivedProposals, setReceivedProposals] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const specificJobId = searchParams.get('job');

  // Modal state for confirmations
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'accept' or 'reject'
    proposalId: null,
    proposalName: '',
  });

  // Modal state for insufficient balance
  const [insufficientBalanceModal, setInsufficientBalanceModal] = useState({
    isOpen: false,
    required: 0,
    available: 0,
    shortfall: 0,
    freelancerName: '',
    proposalId: null,
  });

  // Modal state for budget mismatch
  const [budgetMismatchModal, setBudgetMismatchModal] = useState({
    isOpen: false,
    bidAmount: 0,
    jobBudget: 0,
    freelancerName: '',
    jobTitle: '',
    proposalId: null,
  });

  useEffect(() => {
    fetchMyJobsAndProposals();
  }, [specificJobId]);

  const fetchMyJobsAndProposals = async () => {
    setLoading(true);
    try {
      const jobsRes = await api.get('/jobs/my');
      setMyJobs(jobsRes.data.jobs || []);

      const proposalsData = [];

      // If specific job ID is provided, only fetch proposals for that job
      if (specificJobId) {
        try {
          // Set high limit to fetch all proposals for this job
          const propsRes = await api.get(`/proposals/job/${specificJobId}?limit=1000`);
          proposalsData.push(...(propsRes.data.proposals || []));
          // Set job filter to the specific job
          setJobFilter(specificJobId);
        } catch (err) {
          console.error(`Error fetching proposals for job ${specificJobId}:`, err);
          toast.error('Failed to load proposals for this job');
        }
      } else {
        // Otherwise, fetch proposals for all jobs
        for (const job of jobsRes.data.jobs) {
          try {
            // Set high limit to fetch all proposals for each job
            const propsRes = await api.get(`/proposals/job/${job._id}?limit=1000`);
            proposalsData.push(...(propsRes.data.proposals || []));
          } catch (err) {
            console.error(`Error fetching proposals for job ${job._id}:`, err);
          }
        }
      }
      setReceivedProposals(proposalsData);
    } catch (error) {
      console.error('Error fetching jobs and proposals:', error);
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    const proposal = receivedProposals.find(p => p._id === proposalId);
    setConfirmModal({
      isOpen: true,
      type: 'accept',
      proposalId,
      proposalName: proposal?.freelancer?.fullName || 'Freelancer',
    });
  };

  const handleRejectProposal = async (proposalId) => {
    const proposal = receivedProposals.find(p => p._id === proposalId);
    setConfirmModal({
      isOpen: true,
      type: 'reject',
      proposalId,
      proposalName: proposal?.freelancer?.fullName || 'Freelancer',
    });
  };

  const confirmAction = async () => {
    const { proposalId, type } = confirmModal;
    const proposal = receivedProposals.find(p => p._id === proposalId);
    setConfirmModal({ isOpen: false, type: null, proposalId: null, proposalName: '' });

    setActionLoading(prev => ({ ...prev, [proposalId]: true }));
    try {
      if (type === 'accept') {
        await api.put(`/proposals/${proposalId}/accept`);
        toast.success('Proposal accepted! ✅ Order created');
        setTimeout(() => fetchMyJobsAndProposals(), 500);
      } else if (type === 'reject') {
        await api.put(`/proposals/${proposalId}/reject`);
        toast.success('Proposal rejected');
        setReceivedProposals(prev => prev.map(p =>
          p._id === proposalId ? { ...p, status: 'rejected' } : p
        ));
      }
    } catch (err) {
      // Check if error is insufficient balance
      const errMsg = err.response?.data?.message || '';
      
      // Check for budget mismatch error
      if (errMsg.includes('exceeds job budget')) {
        const bidMatch = errMsg.match(/\$([0-9.]+)\)/);
        const budgetMatch = errMsg.match(/budget \(\$([0-9.]+)\)/);
        
        const bidAmount = bidMatch ? parseFloat(bidMatch[1]) : proposal?.bidAmount || 0;
        const jobBudget = budgetMatch ? parseFloat(budgetMatch[1]) : 0;
        
        setBudgetMismatchModal({
          isOpen: true,
          bidAmount,
          jobBudget,
          freelancerName: proposal?.freelancer?.fullName || 'Freelancer',
          jobTitle: proposal?.job?.title || 'Job',
          proposalId,
        });
      } else if (errMsg.includes('Insufficient wallet balance') && errMsg.includes('Shortfall:')) {
        // Parse shortfall from error message
        const shortfallMatch = errMsg.match(/Shortfall:\s*\$([0-9.]+)/);
        const requiredMatch = errMsg.match(/Need\s*\$([0-9.]+)/);
        const availableMatch = errMsg.match(/Have\s*\$([0-9.]+)/);
        
        const required = requiredMatch ? parseFloat(requiredMatch[1]) : proposal?.bidAmount || 0;
        const available = availableMatch ? parseFloat(availableMatch[1]) : 0;
        const shortfall = shortfallMatch ? parseFloat(shortfallMatch[1]) : (required - available);
        
        setInsufficientBalanceModal({
          isOpen: true,
          required,
          available,
          shortfall,
          freelancerName: proposal?.freelancer?.fullName || 'Freelancer',
          proposalId,
        });
      } else {
        toast.error(errMsg || `Failed to ${type === 'accept' ? 'accept' : 'reject'} proposal`);
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [proposalId]: false }));
    }
  };

  const filtered = receivedProposals.filter(p => {
    const jobMatch = jobFilter === 'all' || p.job === jobFilter;
    const statusMatch = statusFilter === 'all' || p.status === statusFilter;
    return jobMatch && statusMatch;
  });

  const jobTabs = [
    { key: 'all', label: 'All Jobs', badge: myJobs.length },
    ...myJobs.map(j => ({
      key: j._id,
      label: j.title.length > 30 ? j.title.substring(0, 27) + '...' : j.title,
      badge: receivedProposals.filter(p => p.job === j._id).length
    }))
  ];

  const statusTabs = [
    { key: 'all', label: 'All', badge: receivedProposals.length },
    { key: 'pending', label: 'Pending', badge: receivedProposals.filter(p => p.status === 'pending').length },
    { key: 'viewed', label: 'Viewed', badge: receivedProposals.filter(p => p.status === 'viewed').length },
    { key: 'shortlisted', label: 'Shortlisted', badge: receivedProposals.filter(p => p.status === 'shortlisted').length },
    { key: 'accepted', label: 'Accepted', badge: receivedProposals.filter(p => p.status === 'accepted').length },
    { key: 'rejected', label: 'Rejected', badge: receivedProposals.filter(p => p.status === 'rejected').length },
  ];

  return (
    <div className="animate-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {specificJobId ? 'Proposals for Job' : 'Received Proposals'}
          </h1>
          <p style={{ color: 'var(--txt2)', fontSize: '0.875rem', marginTop: 3 }}>
            {specificJobId
              ? `Viewing proposals for: ${myJobs.find(j => j._id === specificJobId)?.title || 'Job'}`
              : 'Manage proposals from freelancers on your jobs'
            }
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/my-jobs')} variant="ghost" size="sm">← My Jobs</Button>
      </div>

      {loading ? <PageLoader /> : receivedProposals.length === 0 ? (
        <EmptyState icon="📬" title="No proposals yet" description="Your proposals will appear here when freelancers apply to your jobs" />
      ) : (
        <>
          {!specificJobId && myJobs.length > 1 && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt3)', marginBottom: '0.5rem' }}>FILTER BY JOB</p>
                <Tabs tabs={jobTabs.slice(0, 5)} active={jobFilter} onChange={setJobFilter} />
              </div>
            </>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt3)', marginBottom: '0.5rem' }}>FILTER BY STATUS</p>
            <Tabs tabs={statusTabs} active={statusFilter} onChange={setStatusFilter} />
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon="🔍" title="No proposals match filters" description="Try adjusting your filters" />
          ) : (
            filtered.map(prop => (
              <div
                key={prop._id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--s1)',
                  border: `1px solid var(--b1)`,
                  borderRadius: 13,
                  marginBottom: '0.75rem',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <Avatar
                    src={prop.freelancer?.profileImage}
                    fallback={prop.freelancer?.fullName?.[0] || '?'}
                    size="lg"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      {prop.freelancer?.fullName}
                      {prop.freelancer?.averageRating > 0 && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--txt2)' }}>
                          ⭐ {prop.freelancer.averageRating.toFixed(1)} ({prop.freelancer.totalReviews})
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--txt3)', marginBottom: '0.5rem' }}>
                      {prop.freelancer?.title || 'Freelancer'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--txt2)', marginBottom: '0.5rem' }}>
                      <strong>Job:</strong> {prop.job?.title || 'Job'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--txt3)', marginBottom: '0.5rem' }}>
                      💬 {prop.coverLetter.substring(0, 100)}...
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>
                      Submitted {formatRelative(prop.createdAt)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'Space Mono,monospace', fontSize: '0.95rem', fontWeight: 700, color: 'var(--acc2)' }}>
                      ${prop.bidAmount}
                    </span>
                    <Badge color={statusColor(prop.status)} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                      {prop.status}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => navigate(`/proposals/${prop._id}`)}
                    >
                      View Details →
                    </Button>
                    {prop.status === 'pending' || prop.status === 'viewed' ? (
                      <>
                        <Button
                          size="xs"
                          variant="primary"
                          loading={actionLoading[prop._id]}
                          onClick={() => handleAcceptProposal(prop._id)}
                        >
                          Accept ✓
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          loading={actionLoading[prop._id]}
                          onClick={() => handleRejectProposal(prop._id)}
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmModal({ isOpen: false, type: null, proposalId: null, proposalName: '' })}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <span className="modal-title">
                {confirmModal.type === 'accept' ? '✓ Accept Proposal' : '✗ Reject Proposal'}
              </span>
              <button className="modal-close" onClick={() => setConfirmModal({ isOpen: false, type: null, proposalId: null, proposalName: '' })}>✕</button>
            </div>
            <div className="modal-body">
              {confirmModal.type === 'accept' ? (
                <div>
                  <p style={{ marginBottom: '1rem', color: 'var(--txt2)', lineHeight: 1.6 }}>
                    <strong>Accept proposal from {confirmModal.proposalName}?</strong>
                  </p>
                  <div style={{ background: 'rgba(240,167,85,.1)', border: '1px solid rgba(240,167,85,.3)', borderRadius: 8, padding: '0.875rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--txt2)', lineHeight: 1.5 }}>
                    ⚠️ <strong>Note:</strong> Accepting this proposal will automatically reject all other proposals for this job. An order will be created and the freelancer will be notified.
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ marginBottom: '1.5rem', color: 'var(--txt2)', lineHeight: 1.6 }}>
                    Are you sure you want to <strong>reject</strong> this proposal from <strong>{confirmModal.proposalName}</strong>?
                  </p>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button
                  variant={confirmModal.type === 'accept' ? 'primary' : 'err'}
                  full
                  loading={actionLoading[confirmModal.proposalId]}
                  onClick={confirmAction}
                >
                  {confirmModal.type === 'accept' ? '✓ Accept' : '✗ Reject'}
                </Button>
                <Button
                  variant="ghost"
                  full
                  onClick={() => setConfirmModal({ isOpen: false, type: null, proposalId: null, proposalName: '' })}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Balance Modal */}
      {insufficientBalanceModal.isOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setInsufficientBalanceModal({ isOpen: false, required: 0, available: 0, shortfall: 0, freelancerName: '', proposalId: null })}>
          <div className="modal" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <span className="modal-title">💳 Insufficient Wallet Balance</span>
              <button className="modal-close" onClick={() => setInsufficientBalanceModal({ isOpen: false, required: 0, available: 0, shortfall: 0, freelancerName: '', proposalId: null })}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'rgba(255,75,75,.1)', border: '1px solid rgba(255,75,75,.3)', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem' }}>
                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--err)', fontWeight: 700, fontSize: '0.95rem' }}>
                  ❌ Cannot Accept Proposal
                </p>
                <p style={{ margin: 0, color: 'var(--txt2)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  You don't have enough funds to accept the proposal from <strong>{insufficientBalanceModal.freelancerName}</strong>.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--txt3)', marginBottom: '0.35rem', fontWeight: 600 }}>REQUIRED</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Mono, monospace', color: 'var(--acc2)' }}>
                    ${insufficientBalanceModal.required.toFixed(2)}
                  </div>
                </div>
                <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--txt3)', marginBottom: '0.35rem', fontWeight: 600 }}>AVAILABLE</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Mono, monospace', color: 'var(--ok)' }}>
                    ${insufficientBalanceModal.available.toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(240,167,85,.1)', border: '1px solid rgba(240,167,85,.3)', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                  <div style={{ fontWeight: 700, color: 'var(--txt)', fontSize: '0.95rem' }}>Shortfall</div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Space Mono, monospace', color: 'var(--warn)', marginBottom: '0.5rem' }}>
                  ${insufficientBalanceModal.shortfall.toFixed(2)}
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--txt3)', lineHeight: 1.5 }}>
                  Add this amount to your wallet to accept this proposal.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button
                  variant="primary"
                  full
                  onClick={() => {
                    setInsufficientBalanceModal({ isOpen: false, required: 0, available: 0, shortfall: 0, freelancerName: '', proposalId: null });
                    navigate('/dashboard/wallet');
                  }}
                >
                  💰 Add Funds
                </Button>
                <Button
                  variant="ghost"
                  full
                  onClick={() => setInsufficientBalanceModal({ isOpen: false, required: 0, available: 0, shortfall: 0, freelancerName: '', proposalId: null })}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Mismatch Modal */}
      {budgetMismatchModal.isOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setBudgetMismatchModal({ isOpen: false, bidAmount: 0, jobBudget: 0, freelancerName: '', jobTitle: '', proposalId: null })}>
          <div className="modal" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <span className="modal-title">⚠️ Budget Mismatch</span>
              <button className="modal-close" onClick={() => setBudgetMismatchModal({ isOpen: false, bidAmount: 0, jobBudget: 0, freelancerName: '', jobTitle: '', proposalId: null })}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'rgba(255,190,0,.1)', border: '1px solid rgba(255,190,0,.3)', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem' }}>
                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--warn)', fontWeight: 700, fontSize: '0.95rem' }}>
                  ⚠️ Proposal Exceeds Job Budget
                </p>
                <p style={{ margin: 0, color: 'var(--txt2)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  The proposal from <strong>{budgetMismatchModal.freelancerName}</strong> exceeds the current job budget. This likely happened because the job budget was reduced after the proposal was submitted.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--txt3)', marginBottom: '0.35rem', fontWeight: 600 }}>PROPOSAL BID</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Mono, monospace', color: 'var(--acc2)' }}>
                    ${budgetMismatchModal.bidAmount.toFixed(2)}
                  </div>
                </div>
                <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--txt3)', marginBottom: '0.35rem', fontWeight: 600 }}>JOB BUDGET</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Mono, monospace', color: 'var(--err)' }}>
                    ${budgetMismatchModal.jobBudget.toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(108,78,246,.05)', borderLeft: '3px solid var(--acc)', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--txt2)', lineHeight: 1.6 }}>
                💡 <strong>To resolve:</strong> You can either increase the job budget to match the bid (${budgetMismatchModal.bidAmount.toFixed(2)}) or reject this proposal and look for other proposals within your budget.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button
                  variant="primary"
                  full
                  onClick={() => {
                    setBudgetMismatchModal({ isOpen: false, bidAmount: 0, jobBudget: 0, freelancerName: '', jobTitle: '', proposalId: null });
                    const proposal = receivedProposals.find(p => p._id === budgetMismatchModal.proposalId);
                    if (proposal?.job?._id) {
                      navigate(`/dashboard/my-jobs`);
                    }
                  }}
                >
                  📝 Edit Job Budget
                </Button>
                <Button
                  variant="ghost"
                  full
                  onClick={() => setBudgetMismatchModal({ isOpen: false, bidAmount: 0, jobBudget: 0, freelancerName: '', jobTitle: '', proposalId: null })}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}