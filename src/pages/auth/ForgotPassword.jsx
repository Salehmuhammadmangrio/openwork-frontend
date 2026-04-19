import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, Alert } from '../../components/common/UI';
import { signInWithGoogle, signInWithFacebook } from '../../firebase';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AuthWrap = ({ children }) => (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', paddingTop: 80 }}>
        <div style={{ width: '100%', maxWidth: 440 }}>{children}</div>
    </div>
);

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error');
        }
        finally { setLoading(false); }
    };

    return (
        <AuthWrap>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '2.25rem', marginBottom: '0.875rem' }}>🔐</div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Reset Password</h1>
                <p style={{ color: 'var(--txt2)', marginTop: '0.45rem' }}>Enter your email to receive a reset link</p>
            </div>
            <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: '1.75rem' }}>
                {sent ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.875rem' }}>📩</div>
                        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Email Sent!</h3>
                        <p style={{ color: 'var(--txt2)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Check your inbox for the reset link. Expires in 1 hour.</p>
                        <Link to="/login"><Button variant="primary" full>Back to Login</Button></Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                        <Button type="submit" variant="primary" full loading={loading} style={{ height: 46 }}>Send Reset Link →</Button>
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}><Link to="/login" style={{ color: 'var(--acc)', fontSize: '0.845rem' }}>← Back to login</Link></div>
                    </form>
                )}
            </div>
        </AuthWrap>
    );
}