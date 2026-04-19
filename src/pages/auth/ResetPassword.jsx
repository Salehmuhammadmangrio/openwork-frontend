import React, { useState, } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input } from '../../components/common/UI';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AuthWrap = ({ children }) => (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', paddingTop: 80 }}>
        <div style={{ width: '100%', maxWidth: 440 }}>{children}</div>
    </div>
);

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) { toast.error('Passwords do not match'); return; }
        setLoading(true);
        try {
            await api.put(`/auth/reset-password/${token}`, { password });
            toast.success('Password reset successfully!');
            navigate('/login');
        } catch (err) { toast.error(err.response?.data?.message || 'Invalid or expired link'); }
        finally { setLoading(false); }
    };

    return (
        <AuthWrap>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '2.25rem', marginBottom: '0.875rem' }}>🔑</div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Set New Password</h1>
            </div>
            <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: '1.75rem' }}>
                <form onSubmit={handleSubmit}>
                    <Input label="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" />
                    <Input label="Confirm Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat" />
                    <Button type="submit" variant="primary" full loading={loading} style={{ height: 46 }}>Reset Password →</Button>
                </form>
            </div>
        </AuthWrap>
    );
}
