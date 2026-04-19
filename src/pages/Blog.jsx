import React from 'react';

const sectionStyle = {
  maxWidth: 1000,
  margin: '0 auto',
  padding: '7rem 1.5rem 4rem',
};

const postStyle = {
  background: 'var(--s1)',
  border: '1px solid var(--b1)',
  borderRadius: 16,
  padding: '1rem 1.1rem',
};

const posts = [
  { title: 'How AI Matching Improves Hiring Outcomes', date: 'Mar 2026' },
  { title: 'Building Trust in Freelance Marketplaces', date: 'Feb 2026' },
  { title: 'Escrow and Milestones: A Better Payment Model', date: 'Jan 2026' },
];

export default function Blog() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <section style={sectionStyle}>
        <p style={{ color: 'var(--acc2)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
          Company
        </p>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', marginBottom: '1rem' }}>OpenWork Blog</h1>
        <p style={{ color: 'var(--txt2)', maxWidth: 760, lineHeight: 1.7 }}>
          Product updates, hiring insights, and practical guides for freelancers and teams.
        </p>

        <div style={{ marginTop: '2rem', display: 'grid', gap: '0.8rem' }}>
          {posts.map((post) => (
            <article key={post.title} style={postStyle}>
              <h3 style={{ marginBottom: '0.35rem' }}>{post.title}</h3>
              <div style={{ color: 'var(--txt3)', fontSize: '0.83rem' }}>{post.date}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
