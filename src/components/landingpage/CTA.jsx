import React from 'react'
import { Button } from '../common/UI'

const CTA = ({ navigate }) => {
  return (

    <div style={{ padding: '0 2rem 5rem', maxWidth: 1240, margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(135deg,rgba(108,78,246,.2),rgba(0,229,195,.12))', border: '1px solid rgba(108,78,246,.22)', borderRadius: 22, padding: '3.5rem 2.5rem', textAlign: 'center', boxShadow: 'var(--inv-shadow)' }}>
        <h2 style={{ fontSize: 'clamp(1.7rem,4vw,2.6rem)', fontWeight: 800, marginBottom: '0.875rem' }}>Ready to Work Smarter?</h2>
        <p style={{ color: 'var(--txt2)', fontSize: '1rem', marginBottom: '1.75rem', maxWidth: 480, margin: '0 auto 1.75rem' }}>Join 34,000+ professionals transforming careers with AI-powered freelancing.</p>
        <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="primary" size="xl" onClick={() => navigate('/register')}>Create Free Account</Button>
          <Button variant="ghost" size="xl" onClick={() => navigate('/ai')}>Try AI Assistant</Button>
        </div>
      </div>
    </div>
  )
}

export default CTA