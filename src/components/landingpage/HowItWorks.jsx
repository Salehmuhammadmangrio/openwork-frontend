import React from 'react'
import { Card, SectionHeader } from '../common/UI'

const HowItWorks = () => {
  return (
    <div style={{ padding: '5rem 2rem', maxWidth: 1240, margin: '0 auto' }}>
      <SectionHeader tag="How It Works" title="Four Steps to Success" subtitle="From sign-up to secure payment — AI powers every step." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '1.25rem' }}>
        {[['01', '🧑‍💻', 'Create Profile', 'Sign up as Freelancer, Client, or both. Verify your identity.', 'var(--acc)'],
        ['02', '🤖', 'AI Skill Tests', 'Pass AI assessments to earn verified badges in 50+ domains.', 'var(--acc2)'],
        ['03', '🎯', 'AI Matching', 'Our ML engine analyzes 40+ signals for perfect job matches.', 'var(--acc3)'],
        ['04', '💰', 'Secure Payment', 'Escrow-protected milestones via Stripe. Zero chasing invoices.', 'var(--ok)']]
          .map(([num, icon, title, desc, col]) => (
            <Card key={num} style={{ borderTop: `3px solid ${col}`, padding: '0.5rem 1rem' }}>
              <div style={{ fontFamily: 'Space Mono,monospace', fontSize: '0.68rem', color: col, background: `${col}1a`, border: `1px solid ${col}33`, borderRadius: 5, padding: '2px 7px', display: 'inline-block', marginBottom: '1rem' }}>{num}</div>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{icon}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.45rem' }}>{title}</h3>
              <p style={{ fontSize: '0.845rem', color: 'var(--txt2)', lineHeight: 1.6 }}>{desc}</p>
            </Card>
          ))}
      </div>
    </div>
  )
}

export default HowItWorks