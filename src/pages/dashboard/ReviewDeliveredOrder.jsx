import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { Button, Card, Select, Textarea, PageLoader, Badge, Alert, EmptyState } from '../../components/common/UI';
import { formatCurrency, formatDate, statusColor } from '../../utils/helpers';
import { useFetch, useForm } from '../../hooks';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ReviewDeliveredOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data, loading, refetch } = useFetch(`/orders/${id}`);
  const order = data?.order;
  const [submitting, setSubmitting] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const { values, handleChange, setField } = useForm({ revisionNote: '', disputeReason: 'deliverable_mismatch', disputeDescription: '' });

  const isClient = user?._id === order?.client?._id;
  const hasReview = order?.reviews?.some(r => r.reviewer?._id === user?._id) || order?.clientReview;

  const handleApprove = async () => {
    if (!order) return;
    setSubmitting(true);
    try {
      await api.post(`/orders/${id}/complete`);
      toast.success('Delivery accepted and payment released.');
      navigate(`/dashboard/reviews`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept delivery.');
      setSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!order) return;
    if (!values.revisionNote.trim()) {
      toast.error('Please describe the revision request.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/orders/${id}/request-revision`, { reason: values.revisionNote.trim() });
      toast.success('Revision request sent to the freelancer.');
      navigate(`/dashboard/reviews`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not request revision.');
      setSubmitting(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!order) return;
    if (!values.disputeDescription.trim()) {
      toast.error('Please describe the dispute issue.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/disputes/order/${id}`, {
        reason: values.disputeReason,
        description: values.disputeDescription.trim(),
      });
      toast.success('Dispute submitted. Our team will review it soon.');
      navigate(`/dashboard/reviews`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit dispute.');
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!order) return <EmptyState icon="❌" title="Order not found" description="Return to your orders list." action={<Button variant="ghost" onClick={() => navigate('/dashboard/orders')}>Back to Orders</Button>} />;

  if (!isClient) {
    return (
      <div style={{ paddingTop: 64, minHeight: '70vh' }}>
        <Card style={{ maxWidth: 720, margin: '2rem auto' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Client Review Only</h2>
          <p style={{ color: 'var(--txt2)', marginTop: 10 }}>Only the client who placed this order can review the delivered work and choose the next step.</p>
          <Button variant="ghost" style={{ marginTop: '1rem' }} onClick={() => navigate(`/dashboard/orders/${id}`)}>Back to Order</Button>
        </Card>
      </div>
    );
  }

  if (hasReview) {
    return (
      <div style={{ paddingTop: 64, minHeight: '70vh' }}>
        <Card style={{ maxWidth: 720, margin: '2rem auto' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>✓ Review Already Submitted</h2>
          <p style={{ color: 'var(--txt2)', marginTop: 10 }}>You have already reviewed this order. Each order can only be reviewed once.</p>
          <Button variant="ghost" style={{ marginTop: '1rem' }} onClick={() => navigate(`/dashboard/reviews`)}>Back to Reviews</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Review Delivered Work</h1>
          <p style={{ color: 'var(--txt2)', marginTop: 4 }}>Accept the delivery, request revisions, or raise a dispute.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/reviews`)}>← Back to Reviews</Button>
      </div>

      {order.status !== 'delivered' && (
        <Alert type="warn">This review workflow is only available after the freelancer has delivered their work. Current status: <strong>{order.status.replace(/_/g, ' ')}</strong>.</Alert>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
        <div>
          <Card style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{order.title}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--txt3)', marginTop: 5 }}>Delivered by {order.freelancer?.fullName || 'Freelancer'} · {order.deliveryDate ? formatDate(order.deliveryDate) : 'No due date'}</div>
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
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>Deliverables</h2>
            {order.deliverables?.length ? order.deliverables.map((item, index) => (
              <div key={index} style={{ background: 'var(--s2)', borderRadius: 11, padding: '0.95rem', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 700 }}>{item.name}</div>
                <a href={item.url} target="_blank" rel="noreferrer" style={{ color: 'var(--acc2)', fontSize: '0.88rem' }}>{item.url}</a>
              </div>
            )) : <p style={{ color: 'var(--txt2)' }}>No deliverables were attached.</p>}
          </Card>

          <Card style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>Delivery Summary</h2>
            <p style={{ color: 'var(--txt2)', lineHeight: 1.8 }}>{order.freelancerNote || 'The freelancer did not include a message with this delivery.'}</p>
          </Card>

          <Card style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>Client Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button variant="success" size="lg" full loading={submitting} disabled={order.status !== 'delivered'} onClick={handleApprove}>Accept & Release Payment</Button>
              <div>
                <Textarea
                  label="Ask for Revision"
                  name="revisionNote"
                  value={values.revisionNote}
                  onChange={handleChange}
                  placeholder="Tell the freelancer what needs to change."
                  rows={4}
                />
                <Button variant="warning" size="sm" full loading={submitting} disabled={!values.revisionNote.trim() || order.status !== 'delivered'} onClick={handleRequestRevision}>Request Revision</Button>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>Need more help?</div>
                    <div style={{ color: 'var(--txt3)', fontSize: '0.82rem' }}>Raise a dispute if the delivery is unacceptable.</div>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => setDisputeOpen(prev => !prev)}>{disputeOpen ? 'Hide Dispute' : 'Raise Dispute'}</Button>
                </div>
                {disputeOpen && (
                  <div style={{ display: 'grid', gap: '0.85rem' }}>
                    <Select label="Reason" name="disputeReason" value={values.disputeReason} onChange={handleChange}>
                      <option value="deliverable_mismatch">Deliverable does not match specs</option>
                      <option value="poor_quality">Unacceptable quality</option>
                      <option value="no_delivery">No delivery made</option>
                      <option value="no_communication">Freelancer unresponsive</option>
                      <option value="payment_issue">Payment dispute</option>
                      <option value="other">Other</option>
                    </Select>
                    <Textarea label="Dispute Details" name="disputeDescription" value={values.disputeDescription} onChange={handleChange} placeholder="Describe the issue clearly so the admin team can review it." rows={4} />
                    <Button variant="danger" size="sm" full loading={submitting} disabled={!values.disputeDescription.trim()} onClick={handleRaiseDispute}>Submit Dispute</Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>Order Details</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--txt3)' }}><span>Status</span><span>{order.status.replace(/_/g, ' ')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--txt3)' }}><span>Created</span><span>{formatDate(order.createdAt)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--txt3)' }}><span>Due</span><span>{order.deliveryDate ? formatDate(order.deliveryDate) : 'N/A'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--txt3)' }}><span>Progress</span><span>{order.progress || 0}%</span></div>
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>Client</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{order.client?.fullName}</div>
              <div style={{ color: 'var(--txt3)' }}>{order.client?.companyName || 'Client'}</div>
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>Payment Summary</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--b1)', fontSize: '0.78rem' }}><span>Total</span><span style={{ fontFamily: 'Space Mono,monospace', fontWeight: 700 }}>{formatCurrency(order.grossAmount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--b1)', fontSize: '0.78rem' }}><span>Platform Fee</span><span style={{ color: 'var(--txt3)' }}>-{formatCurrency(order.platformFee)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 700 }}><span>Payout</span><span style={{ color: 'var(--ok)', fontFamily: 'Space Mono,monospace' }}>{formatCurrency(order.netAmount)}</span></div>
          </Card>
        </div>
      </div>
    </div>
  );
}
