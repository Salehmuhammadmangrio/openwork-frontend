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

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');

  React.useEffect(() => {
    api.get(`/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <AuthWrap>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
        {status === 'loading' && <><div className="spinner" style={{ margin: '0 auto 1rem' }} /><p>Verifying your email...</p></>}
        {status === 'success' && (<>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Email Verified!</h2>
          <p style={{ color: 'var(--txt2)', marginBottom: '1.5rem' }}>Your account is now fully active.</p>
          <Button variant="primary" full onClick={() => navigate('/dashboard')}>Go to Dashboard →</Button>
        </>)}
        {status === 'error' && (<>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Verification Failed</h2>
          <p style={{ color: 'var(--txt2)', marginBottom: '1.5rem' }}>Link is invalid or expired.</p>
          <Button variant="primary" full onClick={() => navigate('/register')}>Register Again</Button>
        </>)}
      </div>
    </AuthWrap>
  );
}