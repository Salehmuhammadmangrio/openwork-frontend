import { useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks';
import { Button, Badge, EmptyState, PageLoader } from '../../components/common/UI';
import { formatDate, statusColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function DashDisputes() {
    const { data, loading } = useFetch('/disputes/my');
    const disputes = data?.disputes || [];
    const navigate = useNavigate();
    return (
        <div className="animate-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
                <div><h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Disputes</h1><p style={{ color: 'var(--txt2)', fontSize: '0.875rem', marginTop: 3 }}>Raise and resolve project conflicts</p></div>
            </div>
            {loading ? <PageLoader /> : disputes.length === 0 ? (
                <EmptyState icon="✅" title="No active disputes" description="Great! You have no ongoing disputes." />
            ) : disputes.map(d => (
                <div key={d._id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 13, padding: '1.25rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div><div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{d.order?.title}</div><div style={{ fontSize: '0.78rem', color: 'var(--txt2)', marginTop: 3 }}>{d.reason?.replace(/_/g, ' ')}</div></div>
                        <Badge color={statusColor(d.status)}>{d.status?.replace(/_/g, ' ')}</Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--txt3)' }}>
                        <span>ID: {d._id?.slice(-8)} · Raised: {formatDate(d.createdAt)}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <Button size="xs" variant="ghost" onClick={() => navigate(`/dashboard/orders/${d.order?._id}`)}>View Order</Button>
                            <Button size="xs" variant="warning" onClick={() => toast.success('Admin notified')}>Contact Admin</Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
