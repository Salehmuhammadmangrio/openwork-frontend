import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WalletTopupCancel() {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    navigate('/dashboard/payments');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    const styles = {
        container: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, var(--bg) 0%, rgba(255, 193, 7, 0.05) 100%)',
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
            background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05))',
            border: '2px solid #FFC107',
            animation: 'pulse 1s ease-in-out infinite',
        },
        title: {
            fontSize: '1.75rem',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '1rem',
            color: '#FFC107',
        },
        subtitle: {
            fontSize: '0.95rem',
            color: 'var(--txt2)',
            textAlign: 'center',
            marginBottom: '2rem',
            lineHeight: 1.6,
        },
        infoBox: {
            background: 'rgba(255, 193, 7, 0.08)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: '15px',
            padding: '1.5rem',
            marginBottom: '2rem',
        },
        infoText: {
            fontSize: '0.9rem',
            color: 'var(--txt2)',
            lineHeight: 1.8,
            marginBottom: '0.5rem',
        },
        countdownBox: {
            background: 'linear-gradient(135deg, var(--acc), rgba(108, 78, 246, 0.8))',
            borderRadius: '15px',
            padding: '2rem',
            textAlign: 'center',
            color: 'white',
            marginBottom: '2rem',
        },
        countdownLabel: {
            fontSize: '0.9rem',
            opacity: 0.9,
            marginBottom: '0.5rem',
        },
        countdownNumber: {
            fontSize: '3rem',
            fontWeight: 900,
        },
        buttonContainer: {
            display: 'flex',
            gap: '1rem',
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
        checklistBox: {
            background: 'var(--bg)',
            border: '1px solid var(--b1)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
        },
        checklistTitle: {
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--txt2)',
            textTransform: 'uppercase',
            marginBottom: '1rem',
            display: 'block',
        },
        checklistItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingBottom: '0.75rem',
            fontSize: '0.9rem',
            color: 'var(--txt2)',
        },
    };

    return (
        <>
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `}</style>

            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.iconContainer}>
                        ⏸️
                    </div>

                    <h2 style={styles.title}>Payment Cancelled</h2>
                    <p style={styles.subtitle}>
                        You've cancelled the PayFast payment. Your wallet was not charged.
                    </p>

                    <div style={styles.infoBox}>
                        <p style={styles.infoText}>
                            <strong>What happened?</strong>
                            <br/>
                            Your wallet top-up was not completed. No funds were deducted from your account.
                        </p>
                    </div>

                    <div style={styles.checklistBox}>
                        <span style={styles.checklistTitle}>✓ Next Steps</span>
                        <div style={styles.checklistItem}>
                            <span>✓</span>
                            <span>Your account is secure and unaffected</span>
                        </div>
                        <div style={styles.checklistItem}>
                            <span>✓</span>
                            <span>Try again with a different payment method</span>
                        </div>
                        <div style={styles.checklistItem}>
                            <span>✓</span>
                            <span>Contact support if you need help</span>
                        </div>
                    </div>

                    <div style={styles.countdownBox}>
                        <div style={styles.countdownLabel}>Redirecting in</div>
                        <div style={styles.countdownNumber}>{countdown}s</div>
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
                            Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
