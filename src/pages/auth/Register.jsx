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

export default function Register() {
    const navigate = useNavigate();
    // Use selective subscription - only subscribe to needed fields
    const register = useAuthStore(s => s.register);
    const firebaseRegister = useAuthStore(s => s.firebaseRegister);
    const isLoading = useAuthStore(s => s.isLoading);
    const user = useAuthStore(s => s.user);
    const [role, setRole] = useState('freelancer');
    const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', phone: '', bio: '' });
    const [terms, setTerms] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm(
        f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
        if (!terms) { setError('Please accept the Terms of Service'); return; }
        try {
            await register({ ...form, role });
            toast.success('Account created! Welcome to OpenWork 🎉');
            // Navigation handled by useEffect watching user
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    const handleGoogleRegister = async () => {
        try {
            const { user: firebaseUser, idToken } = await signInWithGoogle();
            await firebaseRegister(idToken, 'google');
            toast.success('Account created! Welcome to OpenWork 🎉');
            // Navigation handled by useEffect watching user
        } catch (err) {
            toast.error(err.message || 'Google registration failed. Please try again.');
        }
    };

    const handleFacebookRegister = async () => {
        try {
            const { user: firebaseUser, idToken } = await signInWithFacebook();
            await firebaseRegister(idToken, 'facebook');
            toast.success('Account created! Welcome to OpenWork 🎉');
            // Navigation handled by useEffect watching user
        } catch (err) {
            toast.error(err.message || 'Facebook registration failed. Please try again.');
        }
    };

    useEffect(() => {
        // Use user object as source of truth - only navigate when user is actually set
        if (user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user]);

    return (
        <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', paddingTop: 80 }}>
            <div style={{ width: '100%', maxWidth: 520 }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>

                    <h1 style={{ fontSize: '1.9rem', fontWeight: 800 }}>Create Your Account</h1>
                    <p style={{ color: 'var(--txt2)', marginTop: '0.45rem' }}>Join thousands of professionals on OpenWork</p>
                </div>

                <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: '1.75rem' }}>
                    {error && <Alert type="err">{error}</Alert>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.5rem' }}>
                        <button onClick={handleGoogleRegister} disabled={isLoading} style={{ padding: '0.875rem', borderRadius: 11, background: 'var(--nav-bg)', border: '1px solid var(--b1)', cursor: 'pointer', color: 'var(--txt)', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, transition: 'all 0.2s' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                            Continue with Google
                        </button>
    
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem' }}>
                        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--b1)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>or with email</span>
                        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--b1)' }} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--txt2)', marginBottom: '0.4rem' }}>I want to</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {[['freelancer', '🧑‍💻', 'Work as Freelancer', 'Find projects & clients'], ['client', '🏢', 'Hire as Client', 'Post jobs & find talent']].map(([r, icon, label, sub]) => (
                                <div key={r} onClick={() => setRole(r)} style={{ padding: '1.1rem', borderRadius: 11, background: 'var(--s2)', border: `1px solid ${role === r ? 'var(--acc)' : 'var(--b1)'}`, cursor: 'pointer', textAlign: 'center', background: role === r ? 'rgba(108,78,246,.08)' : 'var(--s2)', transition: 'all 0.2s' }}>
                                    <div style={{ fontSize: '1.4rem', marginBottom: 3 }}>{icon}</div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{label}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginTop: 2 }}>{sub}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <Input label="Full Name *" name="fullName" value={form.fullName} onChange={handleChange} placeholder="John Doe" />
                            <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+92 300 0000000" />
                        </div>
                        <Input label="Email Address *" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <Input label="Password *" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 8 characters" />
                            <Input label="Confirm Password *" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat" />
                        </div>
                        <div style={{ marginBottom: '1.1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--txt2)', marginBottom: '0.4rem' }}>Bio (optional)</label>
                            <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Tell us about yourself..." rows={3} style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 10, padding: '10px 13px', color: 'var(--txt)', fontSize: '0.875rem', outline: 'none', resize: 'vertical' }} />
                        </div>
                        <div style={{ marginBottom: '1.1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer' }}>
                                <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} style={{ marginTop: 3 }} />
                                <span style={{ fontSize: '0.78rem', color: 'var(--txt2)', lineHeight: 1.5 }}>I agree to OpenWork's <Link to="#" style={{ color: 'var(--acc)' }}>Terms of Service</Link> and <Link to="#" style={{ color: 'var(--acc)' }}>Privacy Policy</Link>.</span>
                            </label>
                        </div>
                        <Button type="submit" variant="primary" full loading={isLoading} style={{ height: 46, fontSize: '0.95rem' }}>Create Account →</Button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.845rem', color: 'var(--txt2)' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--acc)' }}>Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}