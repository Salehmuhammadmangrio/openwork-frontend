import React from 'react';

const sectionStyle = {
  maxWidth: 1000,
  margin: '0 auto',
  padding: '7rem 1.5rem 4rem',
};

const roleCard = {
  background: 'var(--s1)',
  border: '1px solid var(--b1)',
  borderRadius: 16,
  padding: '1rem 1.1rem',
};

const roles = [
  { title: 'Frontend Engineer (React)', type: 'Full-time', location: 'Remote' },
  { title: 'Backend Engineer (Node.js)', type: 'Full-time', location: 'Hybrid' },
  { title: 'Product Designer', type: 'Contract', location: 'Remote' },
];

export default function Careers() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <section style={sectionStyle}>
        <p style={{ color: 'var(--acc2)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
          Company
        </p>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', marginBottom: '1rem' }}>Careers at OpenWork</h1>
        <p style={{ color: 'var(--txt2)', maxWidth: 760, lineHeight: 1.7 }}>
          We are building tools that reshape digital work. Join us if you care about products that directly improve people's livelihoods.
        </p>

        <div style={{ marginTop: '2rem', display: 'grid', gap: '0.8rem' }}>
          {roles.map((role) => (
            <div key={role.title} style={roleCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                <strong>{role.title}</strong>
                <span style={{ color: 'var(--txt3)', fontSize: '0.85rem' }}>{role.type} · {role.location}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
