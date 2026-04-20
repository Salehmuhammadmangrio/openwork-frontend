import { useFetch } from '../../hooks';
import { Button, Card, Badge, EmptyState, PageLoader, ProgressBar } from '../../components/common/UI';
import { formatCurrency, statusColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const getMilestoneIcon = (status) => {
    switch (status) {
        case 'approved': return '✓';
        case 'submitted': return '⏳';
        case 'pending': return '⭕';
        default: return '○';
    }
};

const getMilestoneColor = (status) => {
    switch (status) {
        case 'approved': return { bg: 'rgba(0, 229, 160, 0.1)', border: '#00E5A0', text: '#00E5A0', icon: '#00E5A0' };
        case 'submitted': return { bg: 'rgba(255, 159, 64, 0.1)', border: '#FF9F40', text: '#FF9F40', icon: '#FF9F40' };
        default: return { bg: 'rgba(108, 78, 246, 0.1)', border: '#6C4EF6', text: '#6C4EF6', icon: '#6C4EF6' };
    }
};

const calculateProgress = (milestones) => {
    if (!milestones || milestones.length === 0) return 0;
    const approved = milestones.filter(m => m.status === 'approved').length;
    return Math.round((approved / milestones.length) * 100);
};

export default function DashMilestones() {
    const { data, loading } = useFetch('/orders/my', { status: 'in_progress' });
    const orders = data?.orders || [];

    return (
        <div className="animate-up">
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>🚀 Milestone Tracker</h1>
                <p style={{ color: 'var(--txt2)', fontSize: '0.95rem' }}>Track deliverables and progress across all active orders</p>
            </div>

            {loading ? (
                <PageLoader />
            ) : orders.length === 0 ? (
                <EmptyState icon="🚀" title="No active orders" description="Accept a job to start tracking milestones" />
            ) : (
                <div style={{ display: 'grid', gap: '1.75rem' }}>
                    {orders.map(order => {
                        const progress = calculateProgress(order.milestones);
                        const completedMilestones = order.milestones?.filter(m => m.status === 'approved').length || 0;
                        const totalMilestones = order.milestones?.length || 0;

                        return (
                            <Card key={order._id} style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--b1)' }}>
                                {/* Order Header Section */}
                                <div style={{
                                    padding: '1.75rem',
                                    background: 'linear-gradient(135deg, rgba(108,78,246,0.05) 0%, rgba(79,53,212,0.03) 100%)',
                                    borderBottom: '1px solid var(--b1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.25rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                                                {order.title}
                                            </h3>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--txt2)' }}>
                                                <span>👤 {order.client?.fullName}</span>
                                                <span>🆔 #{order._id?.slice(-8).toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <Badge color={statusColor(order.status)} style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                                                {order.status?.replace(/_/g, ' ').toUpperCase()}
                                            </Badge>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--acc)' }}>
                                                {formatCurrency(order.grossAmount)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Overall Progress */}
                                    <div style={{ marginTop: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--acc)', fontFamily: "'IBM Plex Mono', monospace" }}>
                                                {order.progress}%
                                            </span>
                                        </div>
                                        <ProgressBar value={order.progress} />
                                    </div>
                                </div>

                                {/* Milestones Timeline */}
                                <div style={{ padding: '1.75rem' }}>
                                    {order.milestones && order.milestones.length > 0 ? (
                                        <div>
                                            {order.milestones.map((ms, i) => {
                                                const colors = getMilestoneColor(ms.status);
                                                const isLast = i === order.milestones.length - 1;

                                                return (
                                                    <div key={i} style={{ display: 'flex', gap: '1.25rem', marginBottom: isLast ? 0 : '1.5rem', position: 'relative' }}>
                                                        {/* Timeline Connector */}
                                                        {!isLast && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                left: '16px',
                                                                top: '56px',
                                                                width: '2px',
                                                                height: 'calc(100% + 24px)',
                                                                background: colors.border,
                                                                opacity: 0.2
                                                            }} />
                                                        )}

                                                        {/* Milestone Number/Status */}
                                                        <div style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '50%',
                                                            background: colors.bg,
                                                            border: `2.5px solid ${colors.border}`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '1rem',
                                                            fontWeight: 700,
                                                            color: colors.icon,
                                                            flexShrink: 0,
                                                            position: 'relative',
                                                            zIndex: 1
                                                        }}>
                                                            {getMilestoneIcon(ms.status)}
                                                        </div>

                                                        {/* Milestone Details */}
                                                        <div style={{ flex: 1, paddingTop: '0.25rem' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                                                <div>
                                                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                                                        Milestone {i + 1}: {ms.title}
                                                                    </h4>
                                                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--txt3)' }}>
                                                                        <span>💰 {formatCurrency(ms.amount)}</span>
                                                                        <span>📅 {ms.dueDate ? new Date(ms.dueDate).toLocaleDateString() : 'No due date'}</span>
                                                                    </div>
                                                                </div>
                                                                <Badge
                                                                    color={{
                                                                        'approved': '#00E5A0',
                                                                        'submitted': '#FF9F40',
                                                                        'pending': '#6C4EF6'
                                                                    }[ms.status] || '#6C4EF6'}
                                                                    style={{ whiteSpace: 'nowrap' }}
                                                                >
                                                                    {ms.status?.replace(/_/g, ' ').toUpperCase()}
                                                                </Badge>
                                                            </div>

                                                            {/* Milestone Description */}
                                                            {ms.description && (
                                                                <p style={{
                                                                    fontSize: '0.85rem',
                                                                    color: 'var(--txt2)',
                                                                    marginTop: '0.75rem',
                                                                    padding: '0.75rem',
                                                                    background: 'var(--s1)',
                                                                    borderRadius: '8px',
                                                                    borderLeft: `3px solid ${colors.border}`
                                                                }}>
                                                                    {ms.description}
                                                                </p>
                                                            )}

                                                            {/* Action Buttons */}
                                                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                                                {ms.status === 'pending' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="primary"
                                                                        onClick={() => toast.success('Milestone submitted for approval!')}
                                                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                                    >
                                                                        📤 Submit Milestone
                                                                    </Button>
                                                                )}
                                                                {ms.status === 'submitted' && (
                                                                    <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(255, 159, 64, 0.1)', borderRadius: '6px', fontSize: '0.8rem', color: '#FF9F40', fontWeight: 600 }}>
                                                                        ⏳ Awaiting client approval...
                                                                    </div>
                                                                )}
                                                                {ms.status === 'approved' && (
                                                                    <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(0, 229, 160, 0.1)', borderRadius: '6px', fontSize: '0.8rem', color: '#00E5A0', fontWeight: 600 }}>
                                                                        ✓ Approved & Paid
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(108,78,246,0.05) 0%, rgba(0,229,160,0.05) 100%)', borderRadius: '12px', border: '1px solid var(--b1)' }}>
                                            {/* Project Progress Info */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                                                {/* Progress Card */}
                                                <div style={{
                                                    padding: '0.75rem',
                                                    background: 'var(--s2)',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--b1)',
                                                    textAlign: 'center'
                                                }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt3)', marginBottom: '0.35rem' }}>Progress</div>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--acc)', fontFamily: "'IBM Plex Mono', monospace" }}>
                                                        {order.progress || 0}%
                                                    </div>
                                                    <ProgressBar value={order.progress || 0} style={{ marginTop: '0.5rem', height: '4px' }} />
                                                </div>

                                                {/* Order Status Card */}
                                                <div style={{
                                                    padding: '0.75rem',
                                                    background: 'var(--s2)',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--b1)',
                                                    textAlign: 'center'
                                                }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt3)', marginBottom: '0.35rem' }}>Status</div>
                                                    <Badge color={statusColor(order.status)} style={{ display: 'inline-block', fontSize: '0.75rem' }}>
                                                        {order.status?.replace(/_/g, ' ')}
                                                    </Badge>
                                                </div>

                                                {/* Budget Info Card */}
                                                <div style={{
                                                    padding: '0.75rem',
                                                    background: 'var(--s2)',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--b1)',
                                                    textAlign: 'center'
                                                }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt3)', marginBottom: '0.35rem' }}>Budget</div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--acc2)', fontFamily: "'IBM Plex Mono', monospace" }}>
                                                        {formatCurrency(order.grossAmount)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Suggestions */}
                                            <div style={{
                                                marginTop: '0.75rem',
                                                padding: '0.75rem',
                                                background: 'rgba(108,78,246,0.08)',
                                                borderRadius: '6px',
                                                borderLeft: '2px solid var(--acc)'
                                            }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--acc)' }}>💡 Create milestones to track deliverables</div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--txt2)', margin: 0, lineHeight: 1.4 }}>
                                                    Break down your project into manageable deliverables for better tracking.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
