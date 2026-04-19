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

export default function Terms() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <section style={sectionStyle}>
        <p style={{ color: 'var(--acc2)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
          Legal
        </p>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', marginBottom: '1rem' }}>Terms of Service</h1>
        <p style={{ color: 'var(--txt2)', maxWidth: 760, lineHeight: 1.7 }}>
          By using OpenWork, users agree to platform rules for conduct, payment, dispute handling, and account security responsibilities.
        </p>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: '0.45rem' }}>Accounts</h3>
          <p style={{ color: 'var(--txt2)', lineHeight: 1.6, fontSize: '0.92rem' }}>
            Users are responsible for maintaining accurate information, protecting credentials, and complying with marketplace standards.
          </p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: '0.45rem' }}>Payments and fees</h3>
          <p style={{ color: 'var(--txt2)', lineHeight: 1.6, fontSize: '0.92rem' }}>
            OpenWork uses escrow-backed payment flows. Platform fees and withdrawal conditions apply as displayed in active workflows.
          </p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: '0.45rem' }}>Disputes and enforcement</h3>
          <p style={{ color: 'var(--txt2)', lineHeight: 1.6, fontSize: '0.92rem' }}>
            OpenWork may review disputes and enforce decisions under published policy, including account restrictions for severe violations.
          </p>
        </div>
      </section>
    </div>
  );
}
