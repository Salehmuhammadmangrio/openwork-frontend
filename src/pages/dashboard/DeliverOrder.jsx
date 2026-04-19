import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { Button, Card, Input, Textarea, PageLoader, Badge, Alert } from '../../components/common/UI';
import { formatCurrency, formatDate, statusColor } from '../../utils/helpers';
import { useFetch, useForm } from '../../hooks';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function DeliverOrder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { data, loading, refetch } = useFetch(`/orders/${id}`);
    const order = data?.order;
    const [submitting, setSubmitting] = useState(false);
    const [links, setLinks] = useState([]);
    const { values, handleChange, setField } = useForm({ note: '', fileName: '', url: '' });

    useEffect(() => {
        if (order?.deliverables) {
            setLinks(order.deliverables.map(d => ({ name: d.name || 'Deliverable', url: d.url })));
        }
    }, [order]);

    const addLink = () => {
        if (!values.fileName.trim() || !values.url.trim()) {
            toast.error('Add both a file name and a URL.');
            return;
        }
        setLinks(prev => [...prev, { name: values.fileName.trim(), url: values.url.trim() }]);
        setField('fileName', '');
        setField('url', '');
    };

    const removeLink = (index) => {
        setLinks(prev => prev.filter((_, i) => i !== index));
    };

    const submitDelivery = async () => {
        if (!order) return;
        if (order.status !== 'in_progress') {
            toast.error('This order cannot be submitted unless it is in progress.');
            return;
        }
        setSubmitting(true);
        try {
            await api.post(`/orders/${id}/deliverables`, {
                deliverables: links.map(link => ({ name: link.name, url: link.url })),
                note: values.note,
            });
            toast.success('Work delivered to the client successfully.');
            navigate(`/dashboard/orders/${id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not submit delivery.');
            setSubmitting(false);
        }
    };

    if (loading) return <PageLoader />;
    if (!order) return (
        <div style={{ paddingTop: 64, minHeight: '70vh' }}>
            <Card style={{ maxWidth: 640, margin: '2rem auto', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Order not found</h2>
                <p style={{ color: 'var(--txt2)', marginTop: '0.75rem' }}>Unable to load this order. Please return to your orders list.</p>
                <Button variant="ghost" onClick={() => navigate('/dashboard/orders')}>Back to Orders</Button>
            </Card>
        </div>
    );

    const isFreelancer = user?._id === order.freelancer?._id;

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Deliver Work</h1>
                    <p style={{ color: 'var(--txt2)', marginTop: 4 }}>Submit final work for this order and notify the client.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/orders/${id}`)}>← Back to Order</Button>
            </div>

            {!isFreelancer ? (
                <Alert type="err">Only the assigned freelancer can submit work for this order.</Alert>
            ) : order.status !== 'in_progress' ? (
                <Alert type="warn">Order status is <strong>{order.status.replace(/_/g, ' ')}</strong>. Work delivery is only available when the order is in progress.</Alert>
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
                <div>
                    <Card style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{order.title}</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--txt3)', marginTop: 5 }}>{order.client?.fullName || 'Client'} · Due {order.deliveryDate ? formatDate(order.deliveryDate) : 'N/A'}</div>
                            </div>
                            <Badge color={statusColor(order.status)}>{order.status.replace(/_/g, ' ')}</Badge>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '0.75rem' }}>
                            <div style={{ background: 'var(--s2)', borderRadius: 12, padding: '0.95rem' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--txt3)', marginBottom: 6 }}>Total</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatCurrency(order.grossAmount)}</div>
                            </div>
                            <div style={{ background: 'var(--s2)', borderRadius: 12, padding: '0.95rem' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--txt3)', marginBottom: 6 }}>Payout</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatCurrency(order.netAmount)}</div>
                            </div>
                        </div>
                    </Card>

                    <Card style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>Delivery Notes</h2>
                        <Textarea
                            label="What did you deliver?"
                            name="note"
                            value={values.note}
                            onChange={handleChange}
                            placeholder="Describe the work, files, and any important instructions for the client..."
                            rows={6}
                            resize="vertical"

                        />
                    </Card>

                    <Card>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>Add Deliverables</h2>
                        <div style={{ display: 'grid', gap: '0.85rem' }}>
                            <Input label="File / Resource Name" name="fileName" value={values.fileName} onChange={handleChange} placeholder="Design brief, source code, report..." />
                            <Input label="URL or Link" name="url" value={values.url} onChange={handleChange} placeholder="https://drive.google.com/..." />
                            <Button variant="primary" size="sm" onClick={addLink}>Add Deliverable</Button>
                        </div>

                        {links.length > 0 && (
                            <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                                {links.map((item, index) => (
                                    <div key={`${item.url}-${index}`} style={{ background: 'var(--s2)', borderRadius: 11, padding: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: '0.88rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                                            <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--acc2)', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%' }}>{item.url}</a>
                                        </div>
                                        <Button size="xs" variant="danger" onClick={() => removeLink(index)}>Remove</Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>


                    {
                        isFreelancer && (<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <Button
                                variant="primary"
                                size="lg"
                                loading={submitting}
                                disabled={!isFreelancer || order.status !== 'in_progress'}
                                onClick={submitDelivery}
                            >
                                Submit Delivery
                            </Button>
                        </div>)
                    }
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Card  boxShadow='var(--inv-shadow)'>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>Client Details</h2>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{order.client?.fullName}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--txt3)' }}>{order.client?.companyName || 'Client account'}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--txt3)' }}>Order ID: {order._id.slice(-8).toUpperCase()}</div>
                        </div>
                    </Card>

                    <Card boxShadow='var(--inv-shadow)'>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>Order Summary</h2>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--txt3)' }}><span>Status</span><span>{order.status.replace(/_/g, ' ')}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--txt3)' }}><span>Created</span><span>{formatDate(order.createdAt)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--txt3)' }}><span>Due</span><span>{order.deliveryDate ? formatDate(order.deliveryDate) : 'N/A'}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--txt3)' }}><span>Progress</span><span>{order.progress || 0}%</span></div>
                        </div>
                    </Card>

                    <Card boxShadow='var(--inv-shadow)'>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>Quick Notes</h2>
                        <ul style={{ fontSize: '0.85rem', color: 'var(--txt3)', lineHeight: 1.8, paddingLeft: '1.1rem', margin: 0 }}>
                            <li>Submit all deliverables clearly in the note section.</li>
                            <li>Use links for Google Drive, Figma, or shared folders.</li>
                            <li>Client will receive a notification immediately.</li>
                            <li>Once delivered, the client can approve or request revision.</li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
}
