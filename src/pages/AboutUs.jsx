import React from 'react';
import { Link } from 'react-router-dom';

const sectionStyle = {
  maxWidth: 1000,
  margin: '0 auto',
  padding: '7rem 1.5rem 4rem',
};

const cardStyle = {
  background: 'var(--s1)',
  border: '1px solid var(--b1)',
  borderRadius: 16,
  padding: '1.25rem',
};

export default function AboutUs() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <section style={sectionStyle}>
        <p style={{ color: 'var(--acc2)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
          Company
        </p>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', marginBottom: '1rem' }}>About OpenWork</h1>
        <p style={{ color: 'var(--txt2)', maxWidth: 760, lineHeight: 1.7 }}>
          OpenWork is an AI-powered freelancing platform built to make hiring faster, fairer, and more transparent for both clients and freelancers.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem', marginTop: '2rem' }}>
          <div style={cardStyle}>
            <h3 style={{ marginBottom: '0.5rem' }}>Our mission</h3>
            <p style={{ color: 'var(--txt2)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Help skilled professionals get discovered based on verified capability, not just profile polish.
            </p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ marginBottom: '0.5rem' }}>Our approach</h3>
            <p style={{ color: 'var(--txt2)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              AI-based skill insights, secure escrow payments, and a workflow built for long-term collaboration.
            </p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ marginBottom: '0.5rem' }}>Our values</h3>
            <p style={{ color: 'var(--txt2)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Fairness, trust, accountability, and continuous learning for everyone in the marketplace.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <Link to="/jobs" style={{ color: 'var(--acc2)', textDecoration: 'none', fontWeight: 600 }}>
            Explore opportunities -{`>`}
          </Link>
        </div>
      </section>
    </div>
  );
}
