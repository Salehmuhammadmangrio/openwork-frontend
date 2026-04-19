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
            {loading ? <PageLoader /> : jobs.length === 0 ? <EmptyState icon="💼" title="No jobs posted" description="Post your first job to find talented freelancers" action={<Button variant="primary" size="sm" onClick={() => navigate('/jobs')}>Post a Job</Button>} /> : jobs.map(job => (
                <div key={job._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 13, marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{job.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--txt2)', marginTop: 2 }}>{job.category} · {job.proposalCount} proposals · Posted {formatRelative(job.createdAt)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Badge color={statusColor(job.status)}>{job.status}</Badge>
                        <span style={{ fontFamily: 'Space Mono,monospace', fontSize: '0.78rem', fontWeight: 700, color: 'var(--acc2)' }}>${job.budgetMax?.toLocaleString()}</span>
                        {job.proposalCount > 0 && (
                            <Button size="xs" variant="primary" onClick={() => navigate(`/dashboard/received-proposals?job=${job._id}`)}>
                                View {job.proposalCount} Proposals
                            </Button>
                        )}
                        {job.status === 'open' && (
                            <Button size="xs" variant="secondary" onClick={() => handleEditBudget(job)}>
                                Edit Budget
                            </Button>
                        )}
                        <Button size="xs" variant="ghost" onClick={() => navigate(`/jobs/${job._id}`)}>View</Button>
                    </div>
                </div>
            ))}

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