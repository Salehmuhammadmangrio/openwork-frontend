import React from 'react'

const Footer = ({ Link }) => {
  return (
    <footer style={{ background: 'var(--s1)', borderTop: '1px solid var(--b1)', padding: '3.5rem 2rem 1.75rem' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        <div>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.35rem', color: 'var(--txt)', textDecoration: 'none', marginBottom: '0.875rem' }}>
            <div style={{ width: 32, height: 32, background: 'var(--g1)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'Space Mono,monospace' }}>OW</div>
            OpenWork
          </Link>
          <p style={{ fontSize: '0.845rem', color: 'var(--txt2)', lineHeight: 1.7, maxWidth: 260 }}>AI-powered freelancing platform connecting skilled professionals with innovative businesses.</p>
        </div>
        {[['Platform', [['Find Talent', '/freelancers'], ['Browse Jobs', '/jobs'], ['Open Offers', '/offers'], ['AI Assistant', '/ai']]], ['Company', [['About Us', '/about'], ['Careers', '/careers'], ['Blog', '/blog']]], ['Legal', [['Privacy Policy', '/privacy'], ['Terms', '/terms'], ['Security', '/security']]]].map(([title, links]) => (
          <div key={title}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.875rem', fontFamily: 'Space Mono,monospace' }}>{title}</div>
            {links.map(([label, to]) => <Link key={label} to={to} style={{ display: 'block', fontSize: '0.845rem', color: 'var(--txt2)', marginBottom: '0.5rem', textDecoration: 'none' }}>{label}</Link>)}
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1240, margin: '0 auto', paddingTop: '1.25rem', borderTop: '1px solid var(--b1)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--txt3)', flexWrap: 'wrap', gap: '0.75rem' }}>
        <span>© 2025 OpenWork · Sukkur IBA University FYP F22-54</span>
        <span>Built by Chander Kumar, Chander Parkash & Saleh Mangrio</span>
      </div>
    </footer>
  )
}

export default Footer