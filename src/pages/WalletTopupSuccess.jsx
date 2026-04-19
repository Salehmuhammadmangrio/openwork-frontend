
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function WalletTopupSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshUser } = useAuthStore();
    const [status, setStatus] = useState('confirming');
    const [result, setResult] = useState(null);

    useEffect(() => {
        const paymentId = searchParams.get('payment_id') || localStorage.getItem('pf_pending_payment_id');

        if (!paymentId) {
            setStatus('failed');
            return;
        }

        const confirm = async () => {
            try {
                const res = await api.post('/payments/wallet/topup/confirm', { paymentId });
                if (res.data.success) {
                    setStatus('success');
                    setResult(res.data);
                    await refreshUser(); // update wallet balance in UI
                    localStorage.removeItem('pf_pending_payment_id');
                    toast.success(`R${res.data.amount || ''} added to your wallet! 🎉`);
                } else {
                    setStatus('failed');
                    toast.error(res.data.message || 'Could not confirm payment');
                }
            } catch (err) {
                console.error('Confirm error:', err);
                setStatus('failed');
                toast.error('Could not confirm payment status');
            }
        };

        confirm();
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', padding: '2rem' }}>
            {status === 'confirming' && (
                <>
                    <div style={{ fontSize: '3rem' }}>⏳</div>
                    <h2 style={{ fontWeight: 700 }}>Confirming your payment...</h2>
                    <p style={{ color: 'var(--txt2)' }}>Please wait while we verify with PayFast.</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <div style={{ fontSize: '4rem' }}>🎉</div>
                    <h2 style={{ fontWeight: 800, color: 'var(--ok)' }}>Payment Successful!</h2>
                    {result?.amount && (
                        <p style={{ fontSize: '1.1rem', color: 'var(--txt2)' }}>
                            <strong>R{result.amount}</strong> has been added to your wallet.
                        </p>
                    )}
                    {result?.newBalance !== undefined && (
                        <p style={{ color: 'var(--txt3)', fontSize: '0.9rem' }}>
                            New balance: <strong>R{result.newBalance.toFixed(2)}</strong>
                        </p>
                    )}
                    <button
                        onClick={() => navigate('/dashboard/payments')}
                        style={{ padding: '0.75rem 2rem', background: 'var(--acc)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
                    >
                        Go to Dashboard
                    </button>
                </>
            )}

            {status === 'failed' && (
                <>
                    <div style={{ fontSize: '3rem' }}>❌</div>
                    <h2 style={{ fontWeight: 700, color: 'var(--err)' }}>Payment could not be confirmed</h2>
                    <p style={{ color: 'var(--txt2)', textAlign: 'center', maxWidth: 400 }}>
                        Your payment may still be processing. Check your wallet balance in a few minutes, or contact support if the issue persists.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard/payments')}
                        style={{ padding: '0.75rem 2rem', background: 'var(--acc)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
                    >
                        Back to Dashboard
                    </button>
                </>
            )}
        </div>
    );
}