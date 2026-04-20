import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { useFetch } from '../../hooks';
import { Button, Badge, EmptyState, PageLoader, Input } from '../../components/common/UI';
import { formatRelative, statusColor } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function DashMyJobs() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { data, loading, refetch } = useFetch('/jobs/my');
    const jobs = data?.jobs || [];

    // Edit Budget Modal State
    const [editModal, setEditModal] = useState({
        isOpen: false,
        jobId: null,
        jobTitle: '',
        currentBudget: 0,
        newBudget: '',
    });

    const [insufficientBalanceModal, setInsufficientBalanceModal] = useState({
        isOpen: false,
        required: 0,
        available: 0,
        shortfall: 0,
        jobTitle: '',
    });

    const [editLoading, setEditLoading] = useState(false);

    const handleEditBudget = (job) => {
        setEditModal({
            isOpen: true,
            jobId: job._id,
            jobTitle: job.title,
            currentBudget: job.budgetMax,
            newBudget: job.budgetMax.toString(),
        });
    };

    const handleBudgetSubmit = async () => {
        const newBudget = parseFloat(editModal.newBudget);

        if (!newBudget || newBudget <= 0) {
            toast.error('Please enter a valid budget amount');
            return;
        }

        if (newBudget === editModal.currentBudget) {
            toast.error('New budget is the same as current budget');
            return;
        }

        setEditLoading(true);
        try {
            await api.put(`/jobs/${editModal.jobId}`, {
                budgetMax: newBudget,
            });
            toast.success('Job budget updated successfully! ✅');
            setEditModal({
                isOpen: false,
                jobId: null,
                jobTitle: '',
                currentBudget: 0,
                newBudget: '',
            });
            refetch();
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Failed to update budget';

            // Check for insufficient balance error
            if (errMsg.includes('Insufficient wallet balance')) {
                const shortfallMatch = errMsg.match(/Shortfall:\s*\$([0-9.]+)/);
                const requiredMatch = errMsg.match(/Need\s*\$([0-9.]+)/);
                const availableMatch = errMsg.match(/Have\s*\$([0-9.]+)/);

                const required = requiredMatch ? parseFloat(requiredMatch[1]) : newBudget;
                const available = availableMatch ? parseFloat(availableMatch[1]) : 0;
                const shortfall = shortfallMatch ? parseFloat(shortfallMatch[1]) : (required - available);

                setInsufficientBalanceModal({
                    isOpen: true,
                    required,
                    available,
                    shortfall,
                    jobTitle: editModal.jobTitle,
                });
            } else {
                toast.error(errMsg);
            }
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <div className="animate-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
                <div><h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>My Posted Jobs</h1><p style={{ color: 'var(--txt2)', fontSize: '0.875rem', marginTop: 3 }}>Manage all your job postings</p></div>
                <Button variant="primary" size="sm" onClick={() => navigate('/jobs')}>+ Post New Job</Button>
            </div>
            {loading ? <PageLoader /> : jobs.length === 0 ? <EmptyState icon="💼" title="No jobs posted" description="Post your first job to find talented freelancers" action={<Button variant="primary" size="sm" onClick={() => navigate('/jobs')}>Post a Job</Button>} /> : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {jobs.map(job => (
                        <div key={job._id} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            padding: '1.75rem',
                            // background: 'linear-gradient(135deg, rgba(108, 78, 246, 0.01) 0%, rgba(79, 53, 212, 0.01) 50%, rgba(0, 229, 160, 0.01) 100%)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '16px',
                            transition: 'all 0.4s cubic-bezier(0.23, 1, 0.320, 1)',
                            cursor: 'pointer',
                            // boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
                            position: 'relative',
                            boxShadow:'var(--inv-shadow)',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={e => {
                            // e.currentTarget.style.background = 'linear-gradient(135deg, rgba(108, 78, 246, 0.12) 0%, rgba(79, 53, 212, 0.08) 50%, rgba(0, 229, 160, 0.08) 100%)';
                            e.currentTarget.style.borderColor = 'rgba(108, 78, 246, 0.4)';
                            // e.currentTarget.style.boxShadow = '0 16px 48px rgba(108, 78, 246, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                            // e.currentTarget.style.background = 'linear-gradient(135deg, rgba(108, 78, 246, 0.08) 0%, rgba(79, 53, 212, 0.04) 50%, rgba(0, 229, 160, 0.04) 100%)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                            // e.currentTarget.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                            {/* Header Section */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start', position: 'relative', zIndex: 1 }}>
                                {/* Job Icon */}
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(108, 78, 246, 0.3) 0%, rgba(79, 53, 212, 0.2) 100%)',
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    border: '1.5px solid rgba(108, 78, 246, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.8rem',
                                    boxShadow: 'inset 0 2px 8px rgba(108, 78, 246, 0.15), 0 4px 16px rgba(108, 78, 246, 0.2)'
                                }}>
                                    💼
                                </div>

                                {/* Title & Meta */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <h3 style={{
                                        fontSize: '1.2rem',
                                        fontWeight: 700,
                                        margin: 0,
                                        color: 'var(--txt)',
                                        letterSpacing: '-0.5px'
                                    }}>
                                        {job.title}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--txt2)', flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>📁 {job.category}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>📅 {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>⏱️ {job.experienceLevel || 'Intermediate'}</span>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                    <Badge color={statusColor(job.status)} style={{ fontSize: '0.8rem', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(108, 78, 246, 0.15)' }}>
                                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                    </Badge>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--txt3)' }}>Posted on {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>

                            {/* Description Section */}
                            {job.description && (
                                <div style={{
                                    padding: '1rem',
                                    background: 'rgba(108, 78, 246, 0.05)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(108, 78, 246, 0.1)',
                                    borderRadius: '10px',
                                    marginBottom: '1.5rem',
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--txt2)', margin: 0, lineHeight: 1.6, maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {job.description.substring(0, 150)}...
                                    </p>
                                </div>
                            )}

                            {/* Stats Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1.5rem',
                                position: 'relative',
                                zIndex: 1
                            }}>
                                {/* Proposals */}
                                <div style={{
                                    padding: '0.875rem',
                                    background: 'linear-gradient(135deg, rgba(0, 229, 160, 0.15) 0%, rgba(0, 200, 140, 0.1) 100%)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(0, 229, 160, 0.2)',
                                    borderRadius: '10px',
                                    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.1)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--txt3)', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>Proposals</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ok)' }}>{job.proposalCount || 0}</div>
                                </div>

                                {/* Budget */}
                                <div style={{
                                    padding: '0.875rem',
                                    background: 'linear-gradient(135deg, rgba(108, 78, 246, 0.15) 0%, rgba(79, 53, 212, 0.1) 100%)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(108, 78, 246, 0.25)',
                                    borderRadius: '10px',
                                    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.1)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--txt3)', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>Budget</div>
                                    <div style={{ fontFamily: 'Space Mono,monospace', fontSize: '1.4rem', fontWeight: 800, color: 'var(--acc2)' }}>
                                        ${job.budgetMax?.toLocaleString() || '0'}
                                    </div>
                                </div>

                                {/* Skills Count */}
                                <div style={{
                                    padding: '0.875rem',
                                    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(230, 170, 0, 0.1) 100%)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255, 193, 7, 0.2)',
                                    borderRadius: '10px',
                                    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.1)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--txt3)', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>Skills</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warn)' }}>
                                        {job.skills?.length || 0}
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div style={{
                                    padding: '0.875rem',
                                    background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(123, 31, 162, 0.1) 100%)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(156, 39, 176, 0.2)',
                                    borderRadius: '10px',
                                    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.1)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--txt3)', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase' }}>Timeline</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--txt)' }}>
                                        {job.timeline || 'Not specified'}
                                    </div>
                                </div>
                            </div>

                            {/* Skills Tags */}
                            {job.skills && job.skills.length > 0 && (
                                <div style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--txt3)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Required Skills</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {job.skills.slice(0, 5).map((skill, idx) => (
                                            <span key={idx} style={{
                                                padding: '0.4rem 0.8rem',
                                                background: 'rgba(108, 78, 246, 0.12)',
                                                border: '1px solid rgba(108, 78, 246, 0.2)',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                color: 'var(--acc)',
                                                fontWeight: 600
                                            }}>
                                                {skill}
                                            </span>
                                        ))}
                                        {job.skills.length > 5 && (
                                            <span style={{
                                                padding: '0.4rem 0.8rem',
                                                background: 'rgba(108, 78, 246, 0.12)',
                                                border: '1px solid rgba(108, 78, 246, 0.2)',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                color: 'var(--acc)',
                                                fontWeight: 600
                                            }}>
                                                +{job.skills.length - 5} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                                {job.proposalCount > 0 && (
                                    <Button size="xs" variant="primary" onClick={() => navigate(`/dashboard/received-proposals?job=${job._id}`)}>
                                        💬 {job.proposalCount} Proposals
                                    </Button>
                                )}
                                {job.status === 'open' && (
                                    <Button size="xs" variant="secondary" onClick={() => handleEditBudget(job)}>
                                        ✏️ Edit Budget
                                    </Button>
                                )}
                                <Button size="xs" variant="ghost" onClick={() => navigate(`/jobs/${job._id}`)}>
                                    👁️ View Full
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Budget Modal */}
            {editModal.isOpen && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditModal({ ...editModal, isOpen: false })}>
                    <div className="modal" style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <span className="modal-title">💰 Edit Job Budget</span>
                            <button className="modal-close" onClick={() => setEditModal({ ...editModal, isOpen: false })}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: '1rem' }}>
                                <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--txt)' }}>
                                    {editModal.jobTitle}
                                </p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--txt2)', marginBottom: '1.5rem' }}>
                                    Current Budget: <strong style={{ color: 'var(--acc2)', fontFamily: 'Space Mono, monospace' }}>${editModal.currentBudget.toFixed(2)}</strong>
                                </p>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">New Budget Max ($) *</label>
                                <Input
                                    type="number"
                                    value={editModal.newBudget}
                                    onChange={(e) => setEditModal({ ...editModal, newBudget: e.target.value })}
                                    placeholder="Enter new budget"
                                    min="1"
                                    step="0.01"
                                />
                            </div>

                            <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '0.875rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--txt2)' }}>
                                <p style={{ margin: '0 0 0.5rem 0' }}>
                                    💳 Your Wallet Balance: <strong style={{ color: 'var(--acc2)', fontFamily: 'Space Mono, monospace' }}>${user?.walletBalance?.toFixed(2) || '0.00'}</strong>
                                </p>
                                {editModal.newBudget && parseFloat(editModal.newBudget) > editModal.currentBudget && (
                                    <p style={{ margin: 0, color: parseFloat(editModal.newBudget) - editModal.currentBudget > (user?.walletBalance || 0) ? 'var(--err)' : 'var(--ok)' }}>
                                        Additional Required: <strong style={{ fontFamily: 'Space Mono, monospace' }}>${(parseFloat(editModal.newBudget) - editModal.currentBudget).toFixed(2)}</strong>
                                    </p>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <Button
                                    variant="primary"
                                    full
                                    loading={editLoading}
                                    onClick={handleBudgetSubmit}
                                >
                                    Update Budget
                                </Button>
                                <Button
                                    variant="ghost"
                                    full
                                    onClick={() => setEditModal({ ...editModal, isOpen: false })}
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
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setInsufficientBalanceModal({ ...insufficientBalanceModal, isOpen: false })}>
                    <div className="modal" style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <span className="modal-title">💳 Insufficient Wallet Balance</span>
                            <button className="modal-close" onClick={() => setInsufficientBalanceModal({ ...insufficientBalanceModal, isOpen: false })}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ background: 'rgba(255,75,75,.1)', border: '1px solid rgba(255,75,75,.3)', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem' }}>
                                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--err)', fontWeight: 700, fontSize: '0.95rem' }}>
                                    ❌ Cannot Update Budget
                                </p>
                                <p style={{ margin: 0, color: 'var(--txt2)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                    You don't have enough funds in your wallet to increase the budget for <strong>{insufficientBalanceModal.jobTitle}</strong>.
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
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Mono, monospace', color: 'var(--err)' }}>
                                        ${insufficientBalanceModal.available.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(248, 113, 113, .1)', border: '1px solid rgba(248, 113, 113, .3)', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--txt2)' }}>
                                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Shortfall: <strong style={{ fontFamily: 'Space Mono, monospace', color: 'var(--err)' }}>${insufficientBalanceModal.shortfall.toFixed(2)}</strong></p>
                                <p style={{ margin: 0 }}>Please add funds to your wallet or reduce the budget amount.</p>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <Button
                                    variant="primary"
                                    full
                                    onClick={() => navigate('/dashboard/payments')}
                                >
                                    Add Funds to Wallet
                                </Button>
                                <Button
                                    variant="ghost"
                                    full
                                    onClick={() => setInsufficientBalanceModal({ ...insufficientBalanceModal, isOpen: false })}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}