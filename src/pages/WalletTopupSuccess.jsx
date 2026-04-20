
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/helpers';

const ConfettiPiece = ({ delay }) => (
    <div
        style={{
            position: 'fixed',
            width: '10px',
            height: '10px',
            background: ['#6C4EF6', '#FF4D6A', '#00B894', '#FFC107', '#2196F3'][Math.floor(Math.random() * 5)],
            borderRadius: '50%',
            left: Math.random() * 100 + '%',
            top: '-10px',
            animation: `fall ${2 + Math.random() * 1}s linear forwards`,
            animationDelay: delay + 'ms',
            pointerEvents: 'none',
            zIndex: 9999,
        }}
    />
);

export default function WalletTopupSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, refreshUser } = useAuthStore();
    const [status, setStatus] = useState('confirming');
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [confetti, setConfetti] = useState([]);

    useEffect(() => {
        // Add confetti animation on success
        if (status === 'success') {
            const pieces = Array.from({ length: 30 }, (_, i) => i);
            setConfetti(pieces);
            const timer = setTimeout(() => setConfetti([]), 3000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    useEffect(() => {
        const paymentId = searchParams.get('payment_id') || localStorage.getItem('pf_pending_payment_id');

        if (!paymentId) {
            setStatus('failed');
            setError('No payment ID found. Please try again.');
            return;
        }

        const confirm = async () => {
            try {
                const res = await api.post('/payments/wallet/topup/confirm', { paymentId });
                
                if (res.data.success) {
                    setStatus('success');
                    setResult(res.data);
                    await refreshUser();
                    localStorage.removeItem('pf_pending_payment_id');
                    toast.success(`R${res.data.amount || ''} added to your wallet! 🎉`);
                } else {
                    setStatus('failed');
                    setError(res.data.message || 'Could not confirm payment');
                    toast.error(res.data.message || 'Could not confirm payment');
                }
            } catch (err) {
                setStatus('failed');
                const errorMsg = err.response?.data?.message || err.message || 'Could not confirm payment status';
                setError(errorMsg);
                toast.error(errorMsg);
            }
        };

        confirm();
    }, []);

    const styles = {
        container: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, var(--bg) 0%, rgba(108,78,246,0.05) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            paddingTop: '5rem',
        },
        card: {
            background: 'var(--bg)',
            border: '1px solid var(--b1)',
            borderRadius: '20px',
            padding: '3rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
        },
        iconContainer: {
            width: '120px',
            height: '120px',
            margin: '0 auto 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            fontSize: '4rem',
            animation: 'pulse 1s ease-in-out infinite',
        },
        successIcon: {
            background: 'linear-gradient(135deg, rgba(0, 184, 148, 0.1), rgba(0, 184, 148, 0.05))',
            border: '2px solid var(--ok)',
        },
        failureIcon: {
            background: 'linear-gradient(135deg, rgba(255, 77, 106, 0.1), rgba(255, 77, 106, 0.05))',
            border: '2px solid var(--err)',
        },
        title: {
            fontSize: '1.75rem',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, var(--txt), var(--acc))',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
        subtitle: {
            fontSize: '0.95rem',
            color: 'var(--txt2)',
            textAlign: 'center',
            marginBottom: '2rem',
            lineHeight: 1.6,
        },
        detailsBox: {
            background: 'rgba(108, 78, 246, 0.05)',
            border: '1px solid rgba(108, 78, 246, 0.2)',
            borderRadius: '15px',
            padding: '1.5rem',
            marginBottom: '2rem',
        },
        detailRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(108, 78, 246, 0.1)',
        },
        detailLabel: {
            fontSize: '0.85rem',
            color: 'var(--txt2)',
            fontWeight: 600,
        },
        detailValue: {
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--txt)',
        },
        amountDisplay: {
            fontSize: '2.5rem',
            fontWeight: 900,
            color: 'var(--ok)',
            textAlign: 'center',
            marginBottom: '1rem',
        },
        balanceCard: {
            background: 'linear-gradient(135deg, var(--acc), rgba(108, 78, 246, 0.8))',
            borderRadius: '15px',
            padding: '1.5rem',
            marginBottom: '2rem',
            color: 'white',
            textAlign: 'center',
        },
        balanceLabel: {
            fontSize: '0.9rem',
            opacity: 0.9,
            marginBottom: '0.5rem',
        },
        balanceValue: {
            fontSize: '2rem',
            fontWeight: 900,
        },
        buttonContainer: {
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem',
        },
        button: {
            flex: 1,
            padding: '1rem',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
        },
        primaryButton: {
            background: 'linear-gradient(135deg, var(--acc), rgba(108, 78, 246, 0.8))',
            color: 'white',
        },
        secondaryButton: {
            background: 'var(--b1)',
            color: 'var(--txt)',
            border: '1px solid var(--b1)',
        },
        errorBox: {
            background: 'rgba(255, 77, 106, 0.1)',
            border: '1px solid rgba(255, 77, 106, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            color: 'var(--txt2)',
        },
        loadingContainer: {
            textAlign: 'center',
        },
        spinner: {
            width: '60px',
            height: '60px',
            border: '4px solid var(--b1)',
            borderTop: '4px solid var(--acc)',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            animation: 'spin 1s linear infinite',
        },
        infoGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem',
        },
        infoCard: {
            background: 'var(--bg)',
            border: '1px solid var(--b1)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center',
        },
        infoLabel: {
            fontSize: '0.75rem',
            color: 'var(--txt3)',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
        },
        infoValue: {
            fontSize: '1.1rem',
            fontWeight: 800,
            color: 'var(--txt)',
        },
    };

    return (
        <>
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes fall {
                    to { transform: translateY(100vh); }
                }
            `}</style>

            {confetti.map((_, i) => (
                <ConfettiPiece key={i} delay={i * 30} />
            ))}

            <div style={styles.container}>
                <div style={styles.card}>
                    {status === 'confirming' && (
                        <div style={styles.loadingContainer}>
                            <div style={styles.spinner}></div>
                            <h2 style={styles.title}>Processing Payment</h2>
                            <p style={styles.subtitle}>
                                Please wait while we verify your transaction with PayFast. This usually takes a few seconds.
                            </p>
                        </div>
                    )}

                    {status === 'success' && (
                        <>
                            <div style={{ ...styles.iconContainer, ...styles.successIcon }}>
                                ✓
                            </div>

                            <h2 style={styles.title}>Payment Successful!</h2>
                            <p style={styles.subtitle}>
                                Your wallet has been credited. Funds are ready to use.
                            </p>

                            <div style={styles.amountDisplay}>
                                +R{(result?.amount || 0).toFixed(2)}
                            </div>

                            <div style={styles.balanceCard}>
                                <div style={styles.balanceLabel}>New Wallet Balance</div>
                                <div style={styles.balanceValue}>
                                    R{(result?.newBalance || 0).toFixed(2)}
                                </div>
                            </div>

                            {result && (
                                <div style={styles.detailsBox}>
                                    <div style={styles.detailRow}>
                                        <span style={styles.detailLabel}>Transaction ID</span>
                                        <span style={styles.detailValue} title={result.paymentId}>
                                            {String(result.paymentId).substring(0, 8)}...
                                        </span>
                                    </div>
                                    <div style={styles.detailRow}>
                                        <span style={styles.detailLabel}>Payment Method</span>
                                        <span style={styles.detailValue}>PayFast</span>
                                    </div>
                                    <div style={styles.detailRow}>
                                        <span style={styles.detailLabel}>Status</span>
                                        <span style={{ ...styles.detailValue, color: 'var(--ok)' }}>Completed</span>
                                    </div>
                                    <div style={{ ...styles.detailRow, borderBottom: 'none' }}>
                                        <span style={styles.detailLabel}>Currency</span>
                                        <span style={styles.detailValue}>ZAR</span>
                                    </div>
                                </div>
                            )}

                            <div style={styles.buttonContainer}>
                                <button
                                    onClick={() => navigate('/dashboard/payments')}
                                    style={{ ...styles.button, ...styles.primaryButton }}
                                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                    View Wallet
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    style={{ ...styles.button, ...styles.secondaryButton }}
                                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                    Dashboard
                                </button>
                            </div>
                        </>
                    )}

                    {status === 'failed' && (
                        <>
                            <div style={{ ...styles.iconContainer, ...styles.failureIcon }}>
                                !
                            </div>

                            <h2 style={{ ...styles.title, background: 'var(--err)', backgroundClip: 'unset', WebkitTextFillColor: 'unset' }}>
                                Payment Failed
                            </h2>
                            <p style={styles.subtitle}>
                                We couldn't complete your wallet top-up. Please try again or contact support.
                            </p>

                            {error && (
                                <div style={styles.errorBox}>
                                    <strong style={{ color: 'var(--err)', display: 'block', marginBottom: '0.5rem' }}>
                                        Error Details
                                    </strong>
                                    {error}
                                </div>
                            )}

                            <div style={{
                                background: 'rgba(255, 193, 7, 0.1)',
                                border: '1px solid rgba(255, 193, 7, 0.3)',
                                borderRadius: '12px',
                                padding: '1rem',
                                marginBottom: '1.5rem',
                                fontSize: '0.9rem',
                                color: 'var(--txt2)',
                            }}>
                                <strong style={{ color: '#FFC107', display: 'block', marginBottom: '0.5rem' }}>
                                    💡 What You Can Do
                                </strong>
                                <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: 1.6 }}>
                                    <li>Check your internet connection</li>
                                    <li>Try a different payment method</li>
                                    <li>Contact our support team for assistance</li>
                                </ul>
                            </div>

                            <div style={styles.buttonContainer}>
                                <button
                                    onClick={() => navigate('/dashboard/payments')}
                                    style={{ ...styles.button, ...styles.primaryButton }}
                                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    style={{ ...styles.button, ...styles.secondaryButton }}
                                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                    Go Back
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}