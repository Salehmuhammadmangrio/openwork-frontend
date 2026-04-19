import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FakePaymentForm from '../components/common/FakePaymentForm';
import { useAuthStore } from '../store';
import { Button } from '../components/common/UI';
import { formatCurrency } from '../utils/helpers';
import api from '../utils/api';
import toast from 'react-hot-toast';


export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const { offer, pkg, job, freelancer, amount: directAmount } = location.state || {};
  const [payMethod, setPayMethod] = useState('stripe');
  const [orderId, setOrderId] = useState(null);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [hasCreatedOrder, setHasCreatedOrder] = useState(false);

  // Validate: Only clients can order offers
  useEffect(() => {
    if (offer && user?.role === 'freelancer') {
      toast.error('Only clients can purchase offers');
      navigate(-1);
      return;
    }
  }, [offer, user?.role, navigate]);

  // FIXED: No fee charged to client at checkout. Fee is 5% deducted from freelancer when order completes.
  const totalAmount = pkg?.price || directAmount || 0;
  const subtotal = totalAmount;
  const platformFeeNote = '5% platform fee deducted from freelancer earnings only';

  // Create order first to get orderId - only run once
  useEffect(() => {
    if (hasCreatedOrder || orderLoading) return; // Prevent multiple executions
    if (!offer && !job) {
      toast.error('Missing order details');
      navigate(-1);
      return;
    }

    const createOrder = async () => {
      setOrderLoading(true);
      try {
        const payload = {
          title: offer ? offer.title : job?.title || 'Order',
          totalAmount,
          ...(offer && { offerId: offer._id, freelancerId: offer.seller?._id, packageName: pkg?.name }),
          ...(job && { jobId: job._id, freelancerId: freelancer?._id }),
          deliveryDays: pkg?.deliveryDays || 30,
        };
        const { data } = await api.post('/orders', payload);
        setOrderId(data.order._id);
        setHasCreatedOrder(true);
      } catch (err) {
        console.error('Order creation error:', err);
        console.error('Response data:', err.response?.data);
        console.error('Error message:', err.response?.data?.message || err.message);
        const errorMsg = err.response?.data?.message || err.message || 'Failed to create order';
        toast.error(errorMsg);
        navigate(-1);
      } finally {
        setOrderLoading(false);
      }
    };

    createOrder();
  }, []); // Empty deps - run once on mount

  if (orderCreated) {
    return (
      <div style={{ paddingTop: 64, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '.75rem' }}>Payment Successful!</h2>
          <p style={{ color: 'var(--txt2)', marginBottom: '2rem', lineHeight: 1.6 }}>Your payment is secured in escrow. The freelancer has been notified and will start working on your project.</p>
          <div style={{ display: 'flex', gap: '.875rem', justifyContent: 'center' }}>
            <Button variant="primary" onClick={() => navigate('/dashboard/orders')}>View My Orders</Button>
            <Button variant="ghost" onClick={() => navigate('/dashboard/messages')}>Message Freelancer</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }} disabled={orderLoading}>← Back</Button>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '2rem' }}>Secure Checkout</h1>

        {orderLoading && (
          <div style={{ background: 'rgba(108,78,246,.1)', border: '1px solid rgba(108,78,246,.2)', borderRadius: 10, padding: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto', marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--txt2)', fontSize: '0.9rem' }}>Preparing your order...</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
          {/* Payment form */}
          <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10 }}>
            <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '1rem' }}>Payment Method</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
                {[['stripe', '💳 Credit / Debit Card'], ['paypal', '🔵 PayPal']].map(([k, l]) => (
                  <button
                    type="button"
                    key={k}
                    className={`pay-method${payMethod === k ? ' active' : ''}`}
                    style={{ flex: 1, justifyContent: 'center', padding: "6px", borderRadius: "8px", opacity: orderLoading ? 0.5 : 1, cursor: orderLoading ? 'not-allowed' : 'pointer' }}
                    onClick={() => setPayMethod(k)}
                    disabled={orderLoading}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {payMethod === 'stripe' && orderLoading ? (
                <div className="loading-wrap" style={{ padding: '2rem', textAlign: 'center' }}>
                  <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
                </div>
              ) : payMethod === 'stripe' && orderId ? (
                <FakePaymentForm amount={totalAmount} orderId={orderId} onSuccess={() => setOrderCreated(true)} />
              ) : payMethod === 'stripe' && !orderLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--txt2)' }}>
                  <p>Order preparation failed. Please go back and try again.</p>
                </div>
              ) : null}


              {payMethod === 'paypal' && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ color: 'var(--txt2)', marginBottom: '1rem', fontSize: '.875rem' }}>PayPal is not configured yet for this environment. Please use card payment.</p>
                  <Button variant="primary" full size="lg" onClick={() => toast.error('PayPal is not available yet')} disabled={orderLoading}>
                    Continue with PayPal →
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Order summary */}
          <div style={{ position: 'sticky', top: 80, alignSelf: 'start', padding: '.25rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '.875rem', fontWeight: 700, marginBottom: '1rem' }}>Order Summary</h3>
              {offer && (
                <div style={{ background: 'var(--s2)', borderRadius: 10, padding: '.875rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '.82rem', fontWeight: 700 }}>{offer?.title || 'Offer'}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--txt2)', marginTop: 3 }}>by {offer?.seller?.fullName || 'Freelancer'}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--acc2)', marginTop: 4 }}>{pkg?.title || 'Package'} · {pkg?.deliveryDays || 30} days delivery</div>
                </div>
              )}
              {job && (
                <div style={{ background: 'var(--s2)', borderRadius: 10, padding: '.875rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '.82rem', fontWeight: 700 }}>{job?.title || 'Job'}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--txt2)', marginTop: 3 }}>Freelancer: {freelancer?.fullName || 'Freelancer'}</div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem' }}><span style={{ color: 'var(--txt2)' }}>Service Price</span><span>{formatCurrency(subtotal)}</span></div>
                <div style={{ height: 1, background: 'var(--b1)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.95rem', fontWeight: 700 }}>
                  <span>Total to Pay</span>
                  <span style={{ color: 'var(--acc2)', fontFamily: 'Space Mono, monospace' }}>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(108,78,246,0.1)', borderRadius: 8, fontSize: '.75rem', color: 'var(--txt2)', lineHeight: 1.5 }}>
                💡 <strong>{platformFeeNote}</strong>
              </div>
              <div style={{ marginTop: '1rem', padding: '.875rem', background: 'var(--s2)', borderRadius: 10 }}>
                <div style={{ fontSize: '.75rem', color: 'var(--txt2)', lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>🛡️ Buyer Protection</div>
                  <div>• Payment held in escrow until work approved</div>
                  <div>• Full refund if freelancer doesn't deliver</div>
                  <div>• Free dispute resolution by OpenWork team</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
