import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/common/UI';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AuthWrap = ({ children }) => (
  <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', paddingTop: 80 }}>
    <div style={{ width: '100%', maxWidth: 440 }}>{children}</div>
  </div>
);

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attempts, setAttempts] = useState(0);

  const inputRefs = useRef([]);

  // Redirect if already verified
  useEffect(() => {
    if (user?.emailVerified) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Safe resend timer
  useEffect(() => {
    if (resendTimer <= 0) return;

    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) clearInterval(interval);
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  // Mask email
  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    return name[0] + '***@' + domain;
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when full
    if (newOtp.join('').length === 6) {
      setTimeout(() => handleVerifyOtp(), 100);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Paste support
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();

    if (!user?.email) {
      setError('Session expired. Please sign up again.');
      return;
    }

    if (attempts >= 5) {
      setError('Too many attempts. Please resend OTP.');
      return;
    }

    const otpCode = otp.join('').trim();

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/verify-email-otp', {
        email: user.email,
        otp: otpCode
      });

      const verifiedUser = response.data?.user;

      if (!verifiedUser?.emailVerified) {
        throw new Error('Verification failed');
      }

      updateUser(verifiedUser);

      setSuccess('Email verified successfully! 🎉');
      toast.success('Email verified!');

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to verify OTP';

      setError(message);
      toast.error(message);

      setAttempts(a => a + 1);

      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    if (!user?.email) {
      setError('Session expired. Please sign up again.');
      return;
    }

    setResending(true);
    setError('');

    try {
      await api.post('/auth/resend-email-otp', { email: user.email });

      toast.success('OTP sent to your email!');
      setOtp(['', '', '', '', '', '']);
      setResendTimer(60);
      inputRefs.current[0]?.focus();

    } catch (err) {
      const message = err.response?.data?.message || 'Failed to resend OTP';
      setError(message);
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthWrap>
      <div onPaste={handlePaste} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
          <h2 style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '1.5rem' }}>Verify Your Email</h2>
          <p style={{ color: 'var(--txt2)', fontSize: '0.9rem' }}>
            We've sent a code to <strong>{maskEmail(user?.email)}</strong>
          </p>
        </div>

        {/* Error */}
        {error && <p style={{ color: '#FF4D6A', marginBottom: '1rem' }}>⚠️ {error}</p>}

        {/* Success */}
        {success && <p style={{ color: '#00B894', marginBottom: '1rem' }}>✓ {success}</p>}

        {/* Form */}
        <form onSubmit={handleVerifyOtp}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: '1.5rem' }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => inputRefs.current[index] = el}
                value={digit}
                maxLength="1"
                inputMode="numeric"
                pattern="\d*"
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading || resending}
                style={{
                  width: 50,
                  height: 50,
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  borderRadius: 8,
                  border: '2px solid var(--b1)'
                }}
              />
            ))}
          </div>

          <Button type="submit" full disabled={loading || otp.some(d => !d)}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>

        {/* Resend */}
        <div style={{ marginTop: '1.5rem' }}>
          <button
            onClick={handleResendOtp}
            disabled={resending || resendTimer > 0}
          >
            {resending
              ? 'Sending...'
              : resendTimer > 0
                ? `Resend in ${resendTimer}s`
                : 'Resend Code'}
          </button>
        </div>

        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#888' }}>
          Code expires in 10 minutes
        </p>

      </div>
    </AuthWrap>
  );
}