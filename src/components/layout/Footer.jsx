import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer Component
 * Appears on public pages
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: 'Browse Freelancers', to: '/freelancers' },
    { label: 'Browse Jobs', to: '/jobs' },
    { label: 'Browse Offers', to: '/offers' },
    { label: 'AI Assistant', to: '/ai' },
  ];

  const company = [
    { label: 'About Us', to: '/about' },
    { label: 'Careers', to: '/careers' },
    { label: 'Blog', to: '/blog' },
  ];

  const legal = [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Security', to: '/security' },
  ];

  const contact = [
    { icon: '📧', label: 'support@openwork.io', href: 'mailto:support@openwork.io' },
    { icon: '🌐', label: 'www.openwork.io', href: 'https://openwork.io' },
  ];

  return (
    <footer style={{
      background: 'var(--s1)',
      borderTop: '1px solid var(--b1)',
      padding: '60px 24px 24px',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Top Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          marginBottom: '60px',
        }}>
          {/* Brand */}
          <div>
            <Link to="/" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
              textDecoration: 'none',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.1rem',
              color: 'var(--txt)',
            }}>
              <div style={{
                width: 28,
                height: 28,
                background: 'var(--g1)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Space Mono, monospace',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
              }}>
                OW
              </div>
              OpenWork
            </Link>
            <p style={{ color: 'var(--txt2)', fontSize: '0.875rem', lineHeight: '1.6', margin: 0 }}>
              AI-powered freelancing platform connecting talent with opportunities across South Asia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: 'var(--txt)', fontSize: '0.875rem', fontWeight: 600, marginBottom: 16, margin: 0, marginBottom: 16 }}>
              QUICK LINKS
            </h4>
            {quickLinks.map((link) => (
              <Link key={link.to} to={link.to} style={{
                display: 'block',
                color: 'var(--txt2)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                marginBottom: '8px',
                transition: 'color 0.2s',
              }} onMouseEnter={(e) => e.target.style.color = 'var(--acc)'} onMouseLeave={(e) => e.target.style.color = 'var(--txt2)'}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4 style={{ color: 'var(--txt)', fontSize: '0.875rem', fontWeight: 600, margin: 0, marginBottom: 16 }}>
              COMPANY
            </h4>
            {company.map((link) => (
              <Link key={link.to} to={link.to} style={{
                display: 'block',
                color: 'var(--txt2)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                marginBottom: '8px',
                transition: 'color 0.2s',
              }} onMouseEnter={(e) => e.target.style.color = 'var(--acc)'} onMouseLeave={(e) => e.target.style.color = 'var(--txt2)'}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ color: 'var(--txt)', fontSize: '0.875rem', fontWeight: 600, margin: 0, marginBottom: 16 }}>
              LEGAL
            </h4>
            {legal.map((link) => (
              <Link key={link.to} to={link.to} style={{
                display: 'block',
                color: 'var(--txt2)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                marginBottom: '8px',
                transition: 'color 0.2s',
              }} onMouseEnter={(e) => e.target.style.color = 'var(--acc)'} onMouseLeave={(e) => e.target.style.color = 'var(--txt2)'}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div style={{
          borderTop: '1px solid var(--b1)',
          paddingTop: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          alignItems: 'center',
        }}>
          {/* Copyright */}
          <div>
            <p style={{
              color: 'var(--txt3)',
              fontSize: '0.8125rem',
              margin: 0,
            }}>
              © {currentYear} OpenWork. All rights reserved.
            </p>
          </div>

          {/* Team Credits */}
          <div>
            <p style={{
              color: 'var(--txt3)',
              fontSize: '0.8125rem',
              margin: 0,
            }}>
              Built by Chander Kumar, Chander Parkash, Saleh Muhammad Mangrio
            </p>
          </div>

          {/* Contact */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {contact.map((item, i) => (
              <a key={i} href={item.href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--txt2)',
                textDecoration: 'none',
                fontSize: '0.8125rem',
                transition: 'color 0.2s',
              }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--acc)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--txt2)'}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
