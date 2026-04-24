import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, Alert } from '../../components/common/UI';
import { signInWithGoogle, signInWithFacebook } from '../../firebase';
import toast from 'react-hot-toast';

const AuthWrap = ({ children }) => (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', paddingTop: 80 }}>
        <div style={{ width: '100%', maxWidth: 440 }}>{children}</div>
    </div>
);

export default function Login() {
    const navigate = useNavigate();
    const login = useAuthStore(s => s.login);
    const firebaseLogin = useAuthStore(s => s.firebaseLogin);
    const isLoading = useAuthStore(s => s.isLoading);
    const user = useAuthStore(s => s.user);
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [googleError, setGoogleError] = useState('');
    const [facebookError, setFacebookError] = useState('');

    useEffect(() => {
        if (user) {
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [user, navigate, location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setEmailError('');
        setPasswordError('');

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            setEmailError('Email is required');
            return;
        }
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        // Validate password
        if (!password) {
            setPasswordError('Password is required');
            return;
        }
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        try {
            await login(email, password);
            toast.success('Welcome back! 👋');

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';

            // Check for specific error types
            if (errorMessage.toLowerCase().includes('user') || errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('not found')) {
                setEmailError('No user with this email exists.');
            } else if (errorMessage.toLowerCase().includes('password')) {
                setPasswordError('Invalid Password');
            } else {
                setError(errorMessage);
            }
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { user, idToken } = await signInWithGoogle();
            await firebaseLogin(idToken, 'google');
        } catch (err) {
            setGoogleError(err || 'Google login failed. Please try again.');

        }
    };

    const handleFacebookLogin = async () => {
        try {
            const { user, idToken } = await signInWithFacebook();
            await firebaseLogin(idToken, 'facebook');
            toast.success('Welcome back! 👋');
            // Navigation handled by useEffect watching user
        } catch (err) {
            setFacebookError(err.message || 'Facebook login failed. Please try again.');
        }
    };

    return (
        <AuthWrap>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Welcome Back!</h1>
                <p style={{ color: 'var(--txt2)', marginTop: '0.45rem' }}>Sign in to continue your journey</p>
            </div>

            <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: '1.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.25rem' }}>
                    <button onClick={handleGoogleLogin} disabled={isLoading} style={{ padding: '0.875rem', borderRadius: 11, background: '--var(--nav-bg)', border: '1px solid var(--b1)', cursor: 'pointer', color: 'var(--txt)', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, transition: 'all 0.2s' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                        Continue with Google
                    </button>
                    {googleError && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem' }}>{googleError}</p>}

                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.25rem' }}>
                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--b1)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>or with email</span>
                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--b1)' }} />
                </div>

                {error && <Alert type="err">{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                        {emailError && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem' }}>{emailError}</p>}
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                        {passwordError && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem' }}>{passwordError}</p>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.78rem' }}><input type="checkbox" defaultChecked /> Remember me</label>
                        <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--acc)' }}>Forgot password?</Link>
                    </div>
                    <Button type="submit" variant="primary" full loading={isLoading} style={{ height: 46, fontSize: '0.95rem' }}>Sign In →</Button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.845rem', color: 'var(--txt2)' }}>
                    New here? <Link to="/register" style={{ color: 'var(--acc)' }}>Create free account</Link>
                </div>

                <div style={{ textAlign: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--b1)', fontSize: '0.72rem', color: 'var(--txt3)' }}>
                    <span style={{ color: 'var(--acc)', cursor: 'pointer' }} onClick={() => { setEmail('emily@client.io'); setPassword('password123'); }}>Client</span>
                    {' · '}
                    <span style={{ color: 'var(--acc)', cursor: 'pointer' }} onClick={() => { setEmail('chander@freelancer.io'); setPassword('password123'); }}>Freelancer</span>
                </div>
            </div>
        </AuthWrap>
    );
}
