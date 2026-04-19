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

export default function Security() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <section style={sectionStyle}>
        <p style={{ color: 'var(--acc2)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
          Legal
        </p>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', marginBottom: '1rem' }}>Security</h1>
        <p style={{ color: 'var(--txt2)', maxWidth: 760, lineHeight: 1.7 }}>
          OpenWork applies layered controls to protect accounts, communication, and payment flows across the platform.
        </p>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: '0.45rem' }}>Account protection</h3>
          <p style={{ color: 'var(--txt2)', lineHeight: 1.6, fontSize: '0.92rem' }}>
            Password hashing, login throttling, and JWT authentication are used to reduce unauthorized access risks.
          </p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: '0.45rem' }}>Payments</h3>
          <p style={{ color: 'var(--txt2)', lineHeight: 1.6, fontSize: '0.92rem' }}>
            Payments are processed using Stripe with escrow-style release after delivery approval workflows.
          </p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: '0.45rem' }}>Reporting vulnerabilities</h3>
          <p style={{ color: 'var(--txt2)', lineHeight: 1.6, fontSize: '0.92rem' }}>
            If you discover a security issue, report it privately to the project maintainers with steps to reproduce and impact details.
          </p>
        </div>
      </section>
    </div>
  );
}
