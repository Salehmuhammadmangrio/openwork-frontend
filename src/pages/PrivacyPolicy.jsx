import React from 'react';

const sectionStyle = {
  maxWidth: 1000,
  margin: '0 auto',
  padding: '7rem 1.5rem 4rem',
};

const cardStyle = {
  background: 'var(--s1)',
  border: '1px solid var(--b1)',
  borderRadius: 16,
  padding: '1.1rem',
  marginTop: '0.9rem',
};

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <section style={sectionStyle}>
        <p style={{ color: 'var(--acc2)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
          Legal
        </p>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', marginBottom: '1rem' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--txt2)', maxWidth: 760, lineHeight: 1.7 }}>
          OpenWork collects only the data required to provide marketplace services, including account information, profile details, and transaction records.
        </p>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: '0.45rem' }}>What we collect</h3>
          <p style={{ color: 'var(--txt2)', lineHeight: 1.6, fontSize: '0.92rem' }}>
            Basic account info, public profile content, communication metadata, and payment-related references needed for escrow and withdrawals.
          </p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: '0.45rem' }}>How we use data</h3>
          <p style={{ color: 'var(--txt2)', lineHeight: 1.6, fontSize: '0.92rem' }}>
            To authenticate users, match talent to opportunities, process payments, prevent fraud, and improve platform quality.
          </p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: '0.45rem' }}>Your controls</h3>
          <p style={{ color: 'var(--txt2)', lineHeight: 1.6, fontSize: '0.92rem' }}>
            You can update profile data and notification preferences in your dashboard. For account and data requests, contact platform support.
          </p>
        </div>
      </section>
    </div>
  );
}
