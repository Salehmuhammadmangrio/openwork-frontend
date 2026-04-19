import React, { useState } from 'react';
import { Button } from '../common/UI';
import toast from 'react-hot-toast';

/**
 * RoleSelectionModal - Shown when new user signs up via Google
 * Allows user to choose between Freelancer or Client role
 */
const RoleSelectionModal = ({ googleData, onSubmit, isLoading, onCancel }) => {
  const [selectedRole, setSelectedRole] = useState(null);

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }
    await onSubmit(selectedRole);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--bg)',
          borderRadius: 16,
          padding: '2.5rem',
          maxWidth: 500,
          width: '90%',
          border: '1px solid var(--b1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Welcome to OpenWork!
          </h2>
          <p style={{ color: 'var(--txt2)', fontSize: '0.875rem' }}>
            Let's get started. What describes you best?
          </p>
        </div>

        {/* Role Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '2rem' }}>
          {/* Freelancer Option */}
          <div
            onClick={() => setSelectedRole('freelancer')}
            style={{
              padding: '1.25rem',
              borderRadius: 12,
              border: `2px solid ${selectedRole === 'freelancer' ? 'var(--acc)' : 'var(--b1)'}`,
              background: selectedRole === 'freelancer' ? 'var(--acc1)' : 'var(--s2)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
            onMouseOver={(e) => {
              if (selectedRole !== 'freelancer') {
                e.currentTarget.style.borderColor = 'var(--acc2)';
              }
            }}
            onMouseOut={(e) => {
              if (selectedRole !== 'freelancer') {
                e.currentTarget.style.borderColor = 'var(--b1)';
              }
            }}
          >
            <div style={{ fontSize: '2rem' }}>💼</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
                Freelancer
              </div>
              <div style={{ color: 'var(--txt2)', fontSize: '0.8rem' }}>
                I want to offer my skills and services
              </div>
            </div>
            {selectedRole === 'freelancer' && (
              <div style={{ marginLeft: 'auto', fontSize: '1.5rem' }}>✓</div>
            )}
          </div>

          {/* Client Option */}
          <div
            onClick={() => setSelectedRole('client')}
            style={{
              padding: '1.25rem',
              borderRadius: 12,
              border: `2px solid ${selectedRole === 'client' ? 'var(--acc)' : 'var(--b1)'}`,
              background: selectedRole === 'client' ? 'var(--acc1)' : 'var(--s2)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
            onMouseOver={(e) => {
              if (selectedRole !== 'client') {
                e.currentTarget.style.borderColor = 'var(--acc2)';
              }
            }}
            onMouseOut={(e) => {
              if (selectedRole !== 'client') {
                e.currentTarget.style.borderColor = 'var(--b1)';
              }
            }}
          >
            <div style={{ fontSize: '2rem' }}>🎯</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
                Client
              </div>
              <div style={{ color: 'var(--txt2)', fontSize: '0.8rem' }}>
                I want to hire talented people for projects
              </div>
            </div>
            {selectedRole === 'client' && (
              <div style={{ marginLeft: 'auto', fontSize: '1.5rem' }}>✓</div>
            )}
          </div>
        </div>

        {/* Info text */}
        <div style={{ background: 'var(--s1)', borderRadius: 8, padding: '0.875rem', marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--txt2)', margin: 0 }}>
            💡 You can change your role anytime in your profile settings after signup.
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            variant="secondary"
            full
            onClick={onCancel}
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            full
            onClick={handleSubmit}
            loading={isLoading}
            disabled={!selectedRole || isLoading}
            style={{ flex: 1 }}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
