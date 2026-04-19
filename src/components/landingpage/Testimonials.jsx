import React from 'react'
import { Card, SectionHeader } from '../common/UI'

const Testimonials = ({ testimonials }) => {
  return (
    <div style={{ padding: '0 2rem 5rem', maxWidth: 1240, margin: '0 auto' }}>
      <SectionHeader tag="Testimonials" title="Loved by Professionals" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '1.25rem' }}>
        {testimonials.map(t => (
          <Card key={t.name} style={{ boxShadow: 'var(--inv-shadow)', padding: '1.25rem' }}>
            <div style={{ color: 'var(--warn)', fontSize: '0.82rem', marginBottom: '0.875rem', letterSpacing: 2 }}>{'★'.repeat(t.rating)}</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--txt2)', lineHeight: 1.7, marginBottom: '1.1rem', fontStyle: 'italic' }}>{t.text}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>{t.ini}</div>
              <div><div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{t.name}</div><div style={{ fontSize: '0.72rem', color: 'var(--txt3)' }}>{t.role}</div></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Testimonials