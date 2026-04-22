import { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { useFetch, useForm } from '../../hooks';
import { Button, Card, Badge, Textarea, Select, Modal, Avatar, EmptyState, PageLoader, ProgressBar, Alert } from '../../components/common/UI';
import { formatCurrency, formatDate, statusColor } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';



export default function DashOrderDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data, loading, refetch } = useFetch(`/orders/${id}`);
  const order = data?.order;
  const [reviewModal, setReviewModal] = useState(false);
  const [disputeModal, setDisputeModal] = useState(false);
  const [progressModal, setProgressModal] = useState(false);
  const [deliveredConfirmModal, setDeliveredConfirmModal] = useState(false);
  const { values: rvVals, handleChange: rvChange, setField } = useForm({ rating: 5, comment: '' });
  const { values: dpVals, handleChange: dpChange } = useForm({ reason: 'deliverable_mismatch', description: '' });
  const { values: prVals, handleChange: prChange, setField: setPrField } = useForm({ progress: order?.progress || 0 });

  const isClient = user?._id === order?.client?._id;
  const isFreelancer = user?._id === order?.freelancer?._id;

  // Sync progress value when order loads
  useEffect(() => {
    if (order?.progress !== undefined) {
      setPrField('progress', order.progress.toString());
    }
  }, [order?._id]);

  const handleAcceptOrder = async () => {
    if (!isClient) {
      toast.error('Only client can accept orders');
      return;
    }
    try {
      await api.post(`/orders/${id}/accept`);
      toast.success('Order accepted! Payment held in escrow.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept order');
    }
  };

  const handleDeclineOrder = async () => {
    if (!isClient) {
      toast.error('Only client can decline orders');
      return;
    }
    try {
      await api.post(`/orders/${id}/cancel`);
      toast.success('Order declined.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline order');
    }
  };

  const updateStatus = async (status) => {
    try {
      if (status === 'completed') {
        await api.post(`/orders/${id}/complete`);
        await api.put(`/orders/${id}/progress`, { progress: 100 });
      } else if (status === 'cancelled') {
        await api.post(`/orders/${id}/cancel`);
      } else {
        await api.put(`/orders/${id}/progress`, { progress: 50 });
      }
      toast.success(`Order marked as ${status.replace(/_/g, ' ')}`);
      refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const submitReview = async () => {
    try {
      await api.post(`/reviews/order/${id}`, rvVals);
      toast.success('Review submitted! ⭐');
      setReviewModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const submitDispute = async () => {
    try {
      await api.post(`/disputes/order/${id}`, dpVals);
      toast.success('Dispute submitted. Admin will review within 24h.');
      setDisputeModal(false);
      refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const updateProgress = async () => {
    try {
      const progressValue = parseInt(prVals.progress) || 0;
      if (progressValue < 0 || progressValue > 100) {
        toast.error('Progress must be between 0 and 100');
        return;
      }
      if (progressValue < (order?.progress || 0)) {
        toast.error('Progress cannot be decreased. You can only increase it.');
        return;
      }
      await api.put(`/orders/${id}/progress`, { progress: progressValue });
      toast.success('Progress updated successfully! 📊');
      setProgressModal(false);
      refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update progress'); }
  };

  const confirmDelivery = async () => {
    try {
      await api.post(`/orders/${id}/deliver`);
      toast.success('Order marked as delivered! Client will now review.');
      setDeliveredConfirmModal(false);
      refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to mark as delivered'); }
  };

  if (loading) return <PageLoader />;
  if (!order) return <EmptyState icon="❌" title="Order not found" />;

  return (
    <div className="animate-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <Button onClick={() => navigate('/dashboard/orders')} variant="ghost" size="sm">← Back</Button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{order.title}</h1>
          <p style={{ color: 'var(--txt2)', fontSize: '0.845rem' }}> Created {formatDate(order.createdAt)}</p>
        </div>
        <Badge color={statusColor(order.status)} style={{ fontSize: '0.78rem', padding: '5px 12px' }}>{order.status?.replace(/_/g, ' ')}</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        <div>
          {/* Order Info */}
          <Card style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
              <div style={{ background: 'var(--s2)', borderRadius: 10, padding: '0.875rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginBottom: 4 }}>Total Amount</div>
                <div style={{ fontFamily: 'Space Mono,monospace', fontSize: '1.1rem', fontWeight: 700, color: 'var(--acc2)' }}>{formatCurrency(order.grossAmount)}</div>
              </div>
              <div style={{ background: 'var(--s2)', borderRadius: 10, padding: '0.875rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginBottom: 4 }}>Delivery Due</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{order.deliveryDate ? formatDate(order.deliveryDate) : 'N/A'}</div>
              </div>
              <div style={{ background: 'var(--s2)', borderRadius: 10, padding: '0.875rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginBottom: 4 }}>Progress</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{order.progress || 0}%</div>
              </div>
            </div>
            <ProgressBar value={order.progress || 0} />
          </Card>

          {/* Order Description */}
          {order.description && (
            <Card style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>📝 Description</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--txt)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {order.description}
              </p>
            </Card>
          )}

          {/* Milestones */}
          <Card style={{ marginBottom: '1.25rem', padding: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>🚀 Milestones</h3>
            {order.milestones?.length > 0 ? order.milestones.map((ms, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '0.875rem 0', borderBottom: i < order.milestones.length - 1 ? '1px solid var(--b1)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: ms.status === 'approved' ? 'rgba(0,229,160,.1)' : ms.status === 'submitted' ? 'rgba(108,78,246,.1)' : 'var(--s2)', color: ms.status === 'approved' ? 'var(--ok)' : ms.status === 'submitted' ? 'var(--acc)' : 'var(--txt3)', border: `2px solid ${ms.status === 'approved' ? 'var(--ok)' : ms.status === 'submitted' ? 'var(--acc)' : 'var(--s3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                  {ms.status === 'approved' ? '✓' : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{ms.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--txt3)', marginTop: 2 }}>{formatCurrency(ms.amount)} · {ms.status?.replace('_', ' ')}</div>
                </div>
                {!isClient && ms.status === 'in_progress' && (
                  <Button size="xs" variant="primary" onClick={async () => {
                    try {
                      // Milestone endpoints not yet implemented on server
                      toast.info('Milestone updates coming soon');
                    } catch (err) {
                      toast.error('Failed to submit milestone');
                    }
                  }}>Submit</Button>
                )}
                {isClient && ms.status === 'submitted' && (
                  <Button size="xs" variant="success" onClick={async () => {
                    try {
                      // Milestone endpoints not yet implemented on server
                      toast.info('Milestone updates coming soon');
                    } catch (err) {
                      toast.error('Failed to approve milestone');
                    }
                  }}>Approve ✓</Button>
                )}
              </div>
            )) : <p style={{ color: 'var(--txt2)', fontSize: '0.845rem' }}>No milestones set for this order.</p>}



          </Card>


          {/* Deliverables */}
          {order.deliverables?.length > 0 && (
            <Card style={{ margin: '1.25rem 0', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>📎 Deliverables</h3>
              {order.deliverables.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--b1)' }}>
                  <span style={{ fontSize: '1.1rem' }}>📄</span>
                  <span style={{ fontSize: '0.845rem', flex: 1 }}>{d.name}</span>
                  <a
                    href={d.url.startsWith("http") ? d.url : `https://${d.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="xs" variant="ghost">Download</Button>
                  </a>
                </div>
              ))}
            </Card>
          )}



          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
            {
              isFreelancer && order.status !== 'completed' && (<NavLink
                to={`/dashboard/orders/${id}/deliver`}
                style={{
                  marginTop: '1rem',
                  display: 'inline-block', background: 'var(--acc)', padding: '0.75rem 1.25rem', borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 600, color: 'var(--txt)',
                  transition: 'color 0.15s',

                }}
              >
                Submit Work
              </NavLink>)
            }

            {
              isClient && order.status === 'delivered' && (
                <NavLink
                  to={`/dashboard/orders/${id}/review`}
                  style={{
                    marginTop: '1rem',
                    display: 'inline-block', background: 'var(--acc)', padding: '0.75rem 1.25rem', borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 600, color: 'var(--txt)',
                    transition: 'color 0.15s',

                  }}
                >
                  Review Delivered Work
                </NavLink>
              )
            }
          </div>
        </div>


        {/* Right: Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>Participants</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: '0.75rem' }}>
              <Avatar user={order.client} size={36} radius="9px" style={{ padding: '0.5rem' }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{order.client?.fullName}</div>
                <Badge color="teal" style={{ fontSize: '0.62rem' }}>Client</Badge>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Avatar user={order.freelancer} size={36} radius="9px" style={{ padding: '0.5rem' }} />
              <div><div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{order.freelancer?.fullName}</div><Badge color="info" style={{ fontSize: '0.62rem' }}>Freelancer</Badge></div>
            </div>
          </Card>

          <Card>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {/* Pending Acceptance Actions */}
              {isClient && order.status === 'pending_acceptance' && (
                <>
                  <Alert type="info">
                    This freelancer has sent you a proposal. Review the details and decide whether to accept this order.
                  </Alert>
                  <Button variant="success" size="sm" full onClick={handleAcceptOrder}>
                    ✓ Accept & Pay {formatCurrency(order.grossAmount)}
                  </Button>
                  <Button variant="danger" size="sm" full onClick={handleDeclineOrder}>
                    ✗ Decline Proposal
                  </Button>
                </>
              )}
              {!isClient && order.status === 'pending_acceptance' && (
                <Alert type="info">
                  Waiting for client to accept your proposal...
                </Alert>
              )}

              {!isClient && ['in_progress'].includes(order.status) && (
                <>
                  {order.status === 'in_progress' && (
                    <>
                      <Button variant="info" size="sm" full onClick={() => {
                        setProgressModal(true);
                      }}>📊 Update Progress</Button>
                      <Button variant="primary" size="sm" full onClick={() => setDeliveredConfirmModal(true)}>Mark as Delivered 📦</Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" full onClick={() => navigate(`/dashboard/orders/${id}/deliver`)}>Submit Work</Button>
                </>
              )}

              {isClient && order.status === 'delivered' && (
                <Button variant="secondary" size="sm" full onClick={
                  () => navigate(`/dashboard/orders/${id}/review`)
                }>Review Delivered Work</Button>
              )}
              {isClient && order.status === 'delivered' && <Button variant="success" size="sm" full onClick={() => updateStatus('completed')}>Approve & Release Payment ✓</Button>}
              {isClient && order.status === 'delivered' && <Button variant="warning" size="sm" full onClick={() => updateStatus('revision_requested')}>Request Revision</Button>}
              {order.status === 'completed' && !order.clientReview && <Button variant="ghost" size="sm" full onClick={() => setReviewModal(true)}>⭐ Leave Review</Button>}
              {order.status === 'completed' && order.clientReview && <Button variant="ghost" size="sm" full disabled>✓ Review Already Submitted</Button>}

              <Button variant="ghost" size="sm" full onClick={async () => {
                try {
                  const recipientId = isClient ? order.freelancer?._id : order.client?._id;
                  const { data } = await api.post('/messages/conversations', { recipientId });
                  navigate(`/dashboard/messages/${data.conversation._id}`);
                  toast.success('Conversation opened');
                } catch {
                  toast.error('Failed to start conversation');
                }
              }} style={{ display: order.status === 'completed' ? 'none' : 'block' }}>💬 Message</Button>


              {['in_progress', 'delivered'].includes(order.status) && (
                <Button variant="danger" size="sm" full onClick={() => setDisputeModal(true)}>⚠️ Raise Dispute</Button>
              )}
            </div>
          </Card>

          <Card>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.875rem' }}>Payment Summary</h3>

            {isClient ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '5px 0', borderBottom: '1px solid var(--b1)' }}><span style={{ color: 'var(--txt2)' }}>You Pay</span><span style={{ fontFamily: 'Space Mono,monospace', fontWeight: 700, fontSize: '0.95rem' }}>{formatCurrency(order.grossAmount)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '8px 0 0', fontWeight: 600 }}><span style={{ color: 'var(--txt)' }}>Freelancer Receives</span><span style={{ color: 'var(--ok)', fontFamily: 'Space Mono,monospace', fontSize: '0.95rem' }}>{formatCurrency(order.netAmount)}</span></div>
                <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginTop: '0.35rem' }}>(-5% platform fee)</div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '5px 0', borderBottom: '1px solid var(--b1)' }}><span style={{ color: 'var(--txt2)' }}>Total</span><span style={{ fontFamily: 'Space Mono,monospace', fontWeight: 700 }}>{formatCurrency(order.grossAmount)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '5px 0', borderBottom: '1px solid var(--b1)' }}><span style={{ color: 'var(--txt2)' }}>Platform Fee</span><span style={{ color: 'var(--err)' }}>-{formatCurrency(order.platformFee)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '10px 0 0', fontWeight: 700 }}>
                  <span>{order.status === 'completed' ? 'You Earning' : 'Total Receive'}</span>
                  <span style={{ color: 'var(--ok)', fontFamily: 'Space Mono,monospace' }}>{formatCurrency(order.netAmount)}</span></div>
              </>
            )}

            <div style={{ marginTop: '0.75rem' }}>
              <Badge color={order.escrowReleased ? 'ok' : 'warn'} style={{ fontSize: '0.72rem' }}>{order.escrowReleased ? '✓ Escrow Released' : '🔒 Held in Escrow'}</Badge>
            </div>
          </Card>
        </div>
      </div>

      {/* Review Modal */}
      <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title="Leave a Review">
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--txt2)', marginBottom: '0.4rem' }}>Rating</label>
          <div style={{ display: 'flex', gap: 5 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} onClick={() => setField('rating', n)} style={{ fontSize: '1.75rem', cursor: 'pointer', color: n <= rvVals.rating ? 'var(--warn)' : 'var(--s3)', transition: 'color 0.15s' }}>★</span>
            ))}
          </div>
        </div>
        <Textarea label="Review Comment" name="comment" value={rvVals.comment} onChange={rvChange} placeholder="Share your experience..." rows={4} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="primary" full onClick={submitReview}>Submit Review →</Button>
          <Button variant="ghost" onClick={() => setReviewModal(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* Dispute Modal */}
      <Modal isOpen={disputeModal} onClose={() => setDisputeModal(false)} title="Raise a Dispute">
        <Alert type="warn">Disputes should only be raised if direct communication has failed. Our admin team will review within 24–48 hours.</Alert>
        <Select label="Reason" name="reason" value={dpVals.reason} onChange={dpChange}>
          <option value="deliverable_mismatch">Deliverable does not match specs</option>
          <option value="no_delivery">No delivery made</option>
          <option value="poor_quality">Unacceptable quality</option>
          <option value="no_communication">Freelancer unresponsive</option>
          <option value="payment_issue">Payment dispute</option>
          <option value="other">Other</option>
        </Select>
        <Textarea label="Description *" name="description" value={dpVals.description} onChange={dpChange} placeholder="Describe the issue in detail..." rows={5} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="danger" full onClick={submitDispute}>Submit Dispute</Button>
          <Button variant="ghost" onClick={() => setDisputeModal(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* Progress Update Modal */}
      <Modal isOpen={progressModal} onClose={() => setProgressModal(false)} title="Update Order Progress">
        <Alert type="info">Update how much of the order you've completed. Clients can see this progress.</Alert>
        <Alert type="warn" style={{ marginBottom: '1rem' }}>
          💡 <strong>Note:</strong> Progress can only be increased from {order?.progress || 0}%. It cannot be decreased.
        </Alert>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--txt2)', marginBottom: '0.4rem' }}>Progress (%) — Current: {order?.progress || 0}%</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="range"
              min={order?.progress || 0}
              max="100"
              value={prVals.progress}
              onChange={(e) => setPrField('progress', e.target.value)}
              style={{ flex: 1, cursor: 'pointer' }}
            />
            <input
              type="number"
              min={order?.progress || 0}
              max="100"
              value={prVals.progress}
              onChange={(e) => setPrField('progress', e.target.value)}
              name="progress"
              style={{ width: '60px', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--b1)', fontSize: '0.875rem' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--txt2)', minWidth: '30px' }}>%</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="primary" full onClick={updateProgress}>Update Progress</Button>
          <Button variant="ghost" onClick={() => setProgressModal(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* Delivery Confirmation Modal */}
      <Modal isOpen={deliveredConfirmModal} onClose={() => setDeliveredConfirmModal(false)} title="Confirm Order Delivery">
        <Alert type="danger">
          ⚠️ <strong>Important:</strong> Once you mark this order as delivered, you will not be able to resubmit or make further changes. The client will review your work.
        </Alert>
        <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
          <p style={{ color: 'var(--txt2)', lineHeight: 1.6 }}>
            Are you sure your work is complete and ready for client review? Please make sure all deliverables are attached in the previous step.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="danger" full onClick={confirmDelivery}>Yes, Deliver Order</Button>
          <Button variant="ghost" full onClick={() => setDeliveredConfirmModal(false)}>No, Go Back</Button>
        </div>
      </Modal>
    </div>
  );
}
