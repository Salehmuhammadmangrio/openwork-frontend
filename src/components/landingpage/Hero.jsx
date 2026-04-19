import React from 'react'
import { Button } from '../common/UI'

const Hero = ({ navigate }) => {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', padding: '7rem 2rem 5rem', minHeight: '92vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[['#6C4EF6', '650px', '-200px', '-200px'], ['#00E5C3', '550px', 'auto', '-120px', '-180px'], ['#FF6B35', '380px', '40%', '40%']].map(([c, s, t, l, b, r], i) => (
          <div key={i} style={{ position: 'absolute', width: s, height: s, background: c, borderRadius: '50%', filter: 'blur(90px)', opacity: 0.11, top: t !== 'auto' ? t : undefined, left: l !== 'auto' ? l : undefined, bottom: b, right: r }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '56px 56px', maskImage: 'radial-gradient(ellipse at center,rgba(0,0,0,.55) 0,transparent 70%)' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 940, width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(108,78,246,.1)', border: '1px solid rgba(108,78,246,.22)', borderRadius: 100, padding: '5px 15px', marginBottom: '1.75rem', fontSize: '0.78rem', fontWeight: 500, color: '#A78BFA' }}>
          <span style={{ width: 5, height: 5, background: 'var(--acc2)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          AI-Verified · Fair Rankings · Transparent Payments
        </div>
        <h1 style={{ fontSize: 'clamp(2.8rem,7vw,5.2rem)', fontWeight: 800, lineHeight: 1.06, marginBottom: '1.4rem', letterSpacing: '-0.03em' }}>
          The Future of Freelancing<br />is <span className="grad-txt">Intelligent</span>
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--txt2)', maxWidth: 580, margin: '0 auto 2.25rem', lineHeight: 1.7 }}>
          OpenWork uses advanced AI to match world-class talent with innovative MSEs. Skill-tested. Fairly ranked. Securely paid.
        </p>
        <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="primary" size="xl" onClick={() => navigate('/register')}>Start for Free →</Button>
          <Button variant="ghost" size="xl" onClick={() => navigate('/jobs')}>Browse Opportunities</Button>
        </div>
        <div style={{ display: 'flex', gap: '2.5rem', justifyContent: 'center', marginTop: '4.5rem', paddingTop: '2.75rem', borderTop: '1px solid var(--b1)', flexWrap: 'wrap' }}>
          {[['34K+', 'Skilled Freelancers'], ['8,200+', 'Projects Completed'], ['97%', 'Satisfaction Rate'], ['$2.4M+', 'Paid to Freelancers']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: 'Syne,sans-serif', fontSize: '1.9rem', fontWeight: 800, display: 'block' }}>{v}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--txt3)', marginTop: 3, display: 'block' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Hero