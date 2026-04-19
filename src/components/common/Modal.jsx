import React from 'react';

/**
 * Modal Component
 * Reusable modal dialog for forms, confirmations, etc.
 */
const Modal = ({ isOpen, title, children, onClose, footer, size = 'md', closeOnBackdrop = true }) => {
  if (!isOpen) return null;

  const sizeMap = {
    sm: '400px',
    md: '600px',
    lg: '900px',
    xl: '1100px',
    full: '90vw',
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          background: 'var(--s1)',
          borderRadius: '16px',
          border: '1px solid var(--b1)',
          boxShadow: 'var(--shadow)',
          width: '100%',
          maxWidth: sizeMap[size],
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--b1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--txt)',
            margin: 0,
            fontFamily: 'Syne, sans-serif',
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--b1)',
              background: 'transparent',
              color: 'var(--txt2)',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--s2)';
              e.target.style.color = 'var(--txt)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = 'var(--txt2)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--b1)',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
