import React, { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../../store/authStore';
import RoleSelectionModal from './RoleSelectionModal';
import toast from 'react-hot-toast';

let googleInitialized = false;

const GoogleAuthButton = () => {
  const { googleLogin, googleCompleteSignup, isLoading } = useAuthStore();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingGoogleData, setPendingGoogleData] = useState(null);
  const initRef = useRef(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const result = await googleLogin(credentialResponse.credential);
      
      if (result.requiresRoleSelection && result.googleData) {
        // New user - show role selection modal
        setPendingGoogleData(result.googleData);
        setShowRoleModal(true);
      } else {
        // Existing user - redirect to dashboard
        toast.success('Welcome back! 🎉');
        window.location.href = '/dashboard';
      }
    } catch (error) {
      toast.error(error.message || 'Google authentication failed');
      console.error('Google auth error:', error);
    }
  };

  const handleRoleSelected = async (role) => {
    try {
      await googleCompleteSignup(pendingGoogleData.idToken, role);
      toast.success(`Welcome to OpenWork! 🎉`);
      setShowRoleModal(false);
      setPendingGoogleData(null);
      window.location.href = '/dashboard';
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Signup failed');
      console.error('Google signup error:', error);
      setShowRoleModal(false);
      setPendingGoogleData(null);
    }
  };

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
    }
  }, []);

  return (
    <>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => toast.error('Google authentication failed')}
        useOneTap={false}
        type="standard"
        theme="outline"
        size="large"
        text="signin_with"
        shape="rectangular"
        logo_alignment="left"
        containerProps={{ style: { width: '100%' } }}
        buttonProps={{
          style: {
            width: '100%',
            padding: '0.875rem',
            borderRadius: 11,
            background: 'var(--s2)',
            border: '1px solid var(--b1)',
            color: 'var(--txt)',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'all 0.2s',
          },
          onMouseOver: (e) => {
            e.target.style.background = 'var(--s1)';
            e.target.style.borderColor = 'var(--acc)';
          },
          onMouseOut: (e) => {
            e.target.style.background = 'var(--s2)';
            e.target.style.borderColor = 'var(--b1)';
          },
        }}
      />
      {showRoleModal && (
        <RoleSelectionModal
          googleData={pendingGoogleData}
          onSubmit={handleRoleSelected}
          isLoading={isLoading}
          onCancel={() => {
            setShowRoleModal(false);
            setPendingGoogleData(null);
          }}
        />
      )}
    </>
  );
};

export default GoogleAuthButton;
