import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/common/UI';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// Wrapper
const AuthWrap = ({ children }) => (
  <div style={{
    minHeight: 'calc(100vh - 64px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    paddingTop: 90
  }}>
    <div style={{ width: '100%', maxWidth: 460 }}>
      {children}
    </div>
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
  const isVerifyingRef = useRef(false);

  useEffect(() => {
    if (user?.emailVerified) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (resendTimer <= 0) return;

    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    return name[0] + '***@' + domain;
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const full = newOtp.join('');
    if (full.length === 6) {
      setTimeout(() => handleVerifyOtp(newOtp), 100);
    }
  };

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

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').trim();

    if (/^\d{6}$/.test(pasted)) {
      const split = pasted.split('');
      setOtp(split);
      inputRefs.current[5]?.focus();
      setTimeout(() => handleVerifyOtp(split), 100);
    }
  };

  // VERIFY OTP
  const handleVerifyOtp = async (otpArray = otp) => {
    if (!user?.email) {
      setError('Session expired. Please sign up again.');
      return;
    }

    if (attempts >= 5) {
      setError('Too many attempts. Please resend OTP.');
      return;
    }

    const otpCode = otpArray.join('').trim();

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/auth/verify-email-otp', {
        email: user.email,
        otp: otpCode
      });

      const verifiedUser = res.data?.user;

      if (!verifiedUser?.emailVerified) {
        throw new Error('Verification failed');
      }

      updateUser(verifiedUser);

      setSuccess('Email verified successfully! 🎉');
      toast.success('Email verified!');

      try {
        const refresh = await api.get('/auth/me');
        if (refresh.data?.user) {
          updateUser(refresh.data.user);
        }
      } catch (err) {
        console.error(err);
      }

      setTimeout(() => navigate('/dashboard'), 1000);
      setAttempts(0);

    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to verify OTP';

      setError(msg);
      toast.error(msg);

      setAttempts((a) => a + 1);

      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

    } finally {
      setLoading(false);
      isVerifyingRef.current = false;
    }
  };

  // RESEND OTP (FIXED)
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    if (!user?.email) {
      setError('Session expired.');
      return;
    }

    setResending(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/auth/resend-email-otp', {
        email: user.email
      });

      toast.success('OTP sent!');
      setOtp(['', '', '', '', '', '']);
      setResendTimer(60);
      inputRefs.current[0]?.focus();

    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Failed to resend OTP';

      setError(msg);
      toast.error(msg);

    } finally {
      setResending(false);
    }
  };

  return (
    <AuthWrap>
      <div
        onPaste={handlePaste}
        style={{
          background: 'var(--s1)',
          border: '1px solid var(--b1)',
          borderRadius: 18,
          padding: '2.5rem 2.25rem',
          textAlign: 'center',
          boxShadow: '0 12px 30px rgba(0,0,0,0.08)'
        }}
      >

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
          <h2 style={{ fontWeight: 800, fontSize: '1.6rem' }}>
            Verify Your Email
          </h2>
          <p style={{ color: 'var(--txt2)' }}>
            Enter code sent to <strong>{maskEmail(user?.email)}</strong>
          </p>
        </div>

        {error && <p style={{ color: '#FF4D6A' }}>⚠ {error}</p>}
        {success && <p style={{ color: '#00B894' }}>✓ {success}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerifyOtp(otp);
          }}
        >
          <div style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            marginBottom: '2rem'
          }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => inputRefs.current[index] = el}
                value={digit}
                maxLength={1}
                inputMode="numeric"
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading || resending}
                style={{
                  width: 56,
                  height: 56,
                  textAlign: 'center',
                  fontSize: '1.3rem',
                  borderRadius: 10,
                  border: '2px solid var(--b1)',
                  outline: 'none'
                }}
              />
            ))}
          </div>

          <Button full disabled={loading || otp.some(d => !d)}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>

        <div style={{ marginTop: '2rem' }}>
          <button
            onClick={handleResendOtp}
            disabled={resending || resendTimer > 0}
            style={{
              background: 'var(--inv-clr)',
              border: 'none',
              padding: '0.7rem 1.3rem',
              borderRadius: 10,
              color: 'var(--bg)',
              cursor: resendTimer > 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {resending
              ? 'Sending...'
              : resendTimer > 0
                ? `Resend in ${resendTimer}s`
                : 'Resend Code'}
          </button>
        </div>

      </div>
    </AuthWrap>
  );
}