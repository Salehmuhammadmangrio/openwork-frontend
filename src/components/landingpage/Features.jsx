import React from 'react'
import { Card, SectionHeader } from '../common/UI'

const Features = ({ features }) => {
  return (
    <div style={{ padding: '0 2rem 5rem', maxWidth: 1240, margin: '0 auto' }}>
      <SectionHeader tag="Platform Features" title="Everything Built for Results" />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
        gap: '1.1rem',
        justifyContent: 'center',
        placeItems: 'center'
      }}
      >
        {features.map(f => (
          <Card key={f.title} style={{ boxShadow: 'var(--inv-shadow)', padding: '1.25rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem', background: 'rgba(108,78,246,.1)', width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.icon}</div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>{f.title}</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--txt2)', lineHeight: 1.6 }}>{f.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Features