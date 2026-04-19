import { useState } from 'react';
import { Button, Card, Input, Modal, Alert } from '../../components/common/UI';
import { formatCurrency } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function WalletTopup({ onSuccess, user }) {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const presetAmounts = [50, 100, 250, 500, 1000];

  const validateAmount = (value) => {
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue)) return { valid: false, message: 'Please enter a valid amount' };
    if (numValue < 10)      return { valid: false, message: 'Minimum top-up amount is R10' };
    if (numValue > 100000)  return { valid: false, message: 'Maximum top-up amount is R100,000' };
    return { valid: true, amount: numValue };
  };

  const initiatePayment = async () => {
    const validation = validateAmount(amount);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/payments/wallet/topup', {
        amount: validation.amount,
        returnUrl: `${window.location.origin}/wallet/topup/success`,
      });

      if (!response.data.success) {
        toast.error(response.data.message || 'Failed to initiate payment');
        setLoading(false);
        return;
      }

      const { payfastData, redirectUrl, paymentId } = response.data;

      // ─── KEY FIX ─────────────────────────────────────────────────────────
      // Store the paymentId BEFORE we navigate away.
      // The WalletTopupSuccess page reads this and calls /topup/confirm,
      // which credits the wallet even if PayFast's ITN never fires
      // (ITN uses notify_url which can't reach localhost in development).
      localStorage.setItem('pf_pending_payment_id', String(paymentId));
      // ─────────────────────────────────────────────────────────────────────

      toast.success('Redirecting to PayFast...', { icon: '💳' });

      // Build a hidden form and submit it — PayFast REQUIRES a real browser
      // form POST. axios/fetch always return 400 because PayFast's endpoint
      // is a hosted page, not a REST API.
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = redirectUrl;
      form.style.display = 'none';

      Object.entries(payfastData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && String(value).trim() !== '') {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      setTimeout(() => form.submit(), 100);
    } catch (err) {
      console.error('Payment initiation error:', err);
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setAmount('');
  };

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        💳 Top Up Wallet
      </Button>

      <Modal isOpen={showModal} onClose={handleModalClose} title="Add Funds to Wallet" size="md">
        <div className="space-y-6">
          {/* Current Balance */}
          <div style={{ background: 'rgba(108,78,246,.08)', padding: '1rem', borderRadius: 10 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--txt2)', marginBottom: 4 }}>Current Balance</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{formatCurrency(user?.walletBalance || 0)}</p>
          </div>

          {/* Preset amounts */}
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--txt2)', marginBottom: '0.5rem' }}>Quick Select</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  style={{
                    padding: '0.5rem',
                    border: `1px solid ${amount === String(preset) ? 'var(--acc)' : 'var(--b1)'}`,
                    borderRadius: 8,
                    background: amount === String(preset) ? 'var(--acc)' : 'transparent',
                    color: amount === String(preset) ? 'white' : 'var(--txt2)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    transition: 'all 0.15s',
                  }}
                >
                  R{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--txt2)', marginBottom: '0.5rem' }}>
              Custom Amount (ZAR)
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (R10 – R100,000)"
              disabled={loading}
              min="10"
              max="100000"
            />
          </div>

          {/* Info */}
          <div style={{ background: 'rgba(255,193,7,.08)', border: '1px solid rgba(255,193,7,.3)', borderRadius: 10, padding: '0.875rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>🧪 Sandbox Test Cards</p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--txt2)', lineHeight: 1.8 }}>
              4111111111111111 (Visa)<br />
              5555555555554444 (Mastercard)<br />
              Any future expiry · Any 3-digit CVV
            </p>
          </div>

          <Alert type="info">
            🔒 You'll be redirected to PayFast to complete payment securely.
          </Alert>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="primary" full onClick={initiatePayment} disabled={!amount || loading}>
              {loading ? '⏳ Redirecting...' : `Pay R${amount || '0'} via PayFast`}
            </Button>
            <Button variant="ghost" full onClick={handleModalClose} disabled={loading}>
              Cancel
            </Button>
          </div>

          <p style={{ fontSize: '0.72rem', color: 'var(--txt3)', textAlign: 'center' }}>
            💡 No additional fees for wallet top-ups
          </p>
        </div>
      </Modal>
    </>
  );
}