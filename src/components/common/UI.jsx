import React from 'react';
import { getInitials, getAvatarGradient } from '../../utils/helpers';

// ─── Button ───────────────────────────────────────────────────
export const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, full = false,
  onClick, type = 'button', style, className = ''
}) => {
  const variants = {
    primary: { background: 'var(--g1)', color: '#fff', border: 'none', boxShadow: '0 4px 20px rgba(108,78,246,.35)' },
    ghost: { background: 'transparent', color: 'var(--txt2)', border: '1px solid var(--b2)' },
    secondary: { background: 'var(--s2)', color: 'var(--txt)', border: '1px solid var(--b2)' },
    danger: { background: 'rgba(255,77,106,.1)', color: 'var(--err)', border: '1px solid rgba(255,77,106,.3)' },
    success: { background: 'rgba(0,229,160,.1)', color: 'var(--ok)', border: '1px solid rgba(0,229,160,.25)' },
    warning: { background: 'rgba(255,181,46,.1)', color: 'var(--warn)', border: '1px solid rgba(255,181,46,.3)' },
  };
  const sizes = {
    xs: { padding: '4px 10px', fontSize: '0.72rem', borderRadius: '7px' },
    sm: { padding: '6px 13px', fontSize: '0.78rem', borderRadius: '8px' },
    md: { padding: '9px 20px', fontSize: '0.875rem', borderRadius: '10px' },
    lg: { padding: '13px 28px', fontSize: '1rem', borderRadius: '12px' },
    xl: { padding: '15px 36px', fontSize: '1.05rem', borderRadius: '13px' },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...variants[variant],
        ...sizes[size],
        width: full ? '100%' : undefined,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        ...style,
      }}
      className={className}
    >
      {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : children}
    </button>
  );
};

// ─── Card ─────────────────────────────────────────────────────
export const Card = ({ children, className = '', boxShadow = '', padding = '1.5rem', onClick, ...props }) => (
  <div
    className={`card ${className}`}
    style={{ padding, cursor: onClick ? 'pointer' : undefined, boxShadow }}
    onClick={onClick}
    {...props}
  >
    {children}
  </div>
);

// ─── Badge ────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'info', className = '' }) => (
  <span className={`badge badge-${variant} ${className}`}>{children}</span>
);

// ─── Input ────────────────────────────────────────────────────
export const Input = ({ label, error, hint, ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <input
      {...props}
      className={`input ${error ? 'input-error' : ''}`}
    />
    {error && <div className="form-hint" style={{ color: 'var(--err)' }}>{error}</div>}
    {hint && !error && <div className="form-hint">{hint}</div>}
  </div>
);

// ─── Textarea ─────────────────────────────────────────────────
export const Textarea = ({ label, error, hint, rows = 4, resize, ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <textarea
      {...props}
      rows={rows}
      style={{ resize: resize || 'none', ...props.style }}
      className={`textarea ${error ? 'input-error' : ''}`}
    />
    {error && <div className="form-hint" style={{ color: 'var(--err)' }}>{error}</div>}
    {hint && !error && <div className="form-hint">{hint}</div>}
  </div>
);

// ─── Select ───────────────────────────────────────────────────
export const Select = ({ label, error, children, ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <select {...props} className={`select ${error ? 'input-error' : ''}`}>
      {children}
    </select>
    {error && <div className="form-hint" style={{ color: 'var(--err)' }}>{error}</div>}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, maxWidth = 560 }) => {
  if (!isOpen) return null;
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div style={{
        background: 'var(--s1)', border: '1px solid var(--b2)',
        borderRadius: '20px', width: '100%', maxWidth,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,.55)',
        animation: 'slideUp 0.25s ease',
      }}>
        <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.4rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 7, cursor: 'pointer', color: 'var(--txt2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: '0 1.5rem 1.5rem' }}>{children}</div>
      </div>
    </div>
  );
};

// ─── Avatar ───────────────────────────────────────────────────
// Supports: <Avatar user={obj} /> or <Avatar name="..." image="..." id="..." />
export const Avatar = ({ user, name, image, id, size = 40, radius = '12px', style }) => {
  const displayName = name || user?.fullName || user?.name || '?';
  const displayImage = image || user?.profileImage;
  const displayId = id || user?._id || '';
  if (displayImage) {
    return <img src={displayImage} alt={displayName} style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0, ...style }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: getAvatarGradient(displayId),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Syne, sans-serif', fontSize: size * 0.35,
      fontWeight: 800, color: 'var(--txt)', flexShrink: 0, ...style,
    }}>
      {getInitials(displayName)}
    </div>
  );
};

// ─── Spinner / Loader ─────────────────────────────────────────
export const Spinner = ({ size = 24, color = 'var(--acc)' }) => (
  <div style={{ width: size, height: size, border: `2px solid var(--b2)`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
);

export const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
    <Spinner size={40} />
  </div>
);

// ─── EmptyState ───────────────────────────────────────────────
export const EmptyState = ({ icon = '📭', title, description, message, action }) => (
  <div style={{ textAlign: 'center', padding: '4rem 4rem' }}>
    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h3>
    {(description || message) && <p style={{ color: 'var(--txt2)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{description || message}</p>}
    {action}
  </div>
);

// ─── ProgressBar ─────────────────────────────────────────────
export const ProgressBar = ({ value = 0, color = 'var(--g1)', height = 5, }) => (
  <div style={{ height, background: 'var(--s2)', borderRadius: 3, overflow: 'hidden', margin: ' 1rem 0' }}>
    <div style={{ width: `${Math.min(100, value)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
  </div>
);

// ─── StatCard ─────────────────────────────────────────────────
export const StatCard = ({ label, value, change, changeType = 'up', icon, valueColor }) => (
  <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 13, padding: '1.1rem', boxShadow: 'var(--inv-shadow' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{label}</div>
      {icon && <span style={{ fontSize: '1rem' }}>{icon}</span>}
    </div>
    <div style={{ fontFamily: "'IBM Plex Mono', 'JetBrains Mono', 'Courier New', 'SF Mono', monospace", fontSize: '1.75rem', fontWeight: 700, color: valueColor || 'var(--txt)', lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    {change && <div style={{ fontSize: '0.72rem', marginTop: '0.45rem', color: changeType === 'up' ? 'var(--ok)' : changeType === 'dn' ? 'var(--err)' : 'var(--txt3)' }}>{change}</div>}
  </div>
);

// ─── Tabs ─────────────────────────────────────────────────────
export const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 3, background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 11, padding: 3, width: 'fit-content', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
    {tabs.map(tab => (
      <button
        key={tab.key}
        onClick={() => onChange(tab.key)}
        style={{
          padding: '7px 18px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
          cursor: 'pointer', border: 'none', fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s',
          background: active === tab.key ? 'var(--acc)' : 'transparent',
          color: active === tab.key ? '#fff' : 'var(--txt2)',
          boxShadow: active === tab.key ? '0 4px 14px rgba(108,78,246,.35)' : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {tab.label}{tab.badge !== undefined && <span style={{ marginLeft: 5, background: active === tab.key ? 'rgba(255,255,255,.25)' : 'var(--acc)', color: '#fff', fontSize: '0.62rem', padding: '1px 5px', borderRadius: '100px' }}>{tab.badge}</span>}
      </button>
    ))}
  </div>
);

// ─── SkillTag ─────────────────────────────────────────────────
export const SkillTag = ({ skill, children }) => (
  <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 9px', borderRadius: '100px', background: 'rgba(108,78,246,.1)', color: '#A78BFA', border: '1px solid rgba(108,78,246,.2)', whiteSpace: 'nowrap' }}>{children || skill}</span>
);

// ─── FilterBar ────────────────────────────────────────────────
export const FilterBar = ({ children }) => (
  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
    {children}
  </div>
);

// ─── SearchInput ─────────────────────────────────────────────
export const SearchInput = ({ placeholder, value, onChange }) => (
  <input
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    style={{
      flex: 1, minWidth: 220, background: 'var(--s1)', border: '1px solid var(--b2)',
      borderRadius: 10, padding: '10px 13px', color: 'var(--txt)',
      fontSize: '0.875rem', outline: 'none',
    }}
  />
);

// ─── FilterChip ─────────────────────────────────────────────
export const FilterChip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 13px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 500,
      cursor: 'pointer', border: `1px solid ${active ? 'rgba(108,78,246,.3)' : 'var(--b2)'}`,
      background: active ? 'rgba(108,78,246,.1)' : 'var(--s1)',
      color: active ? '#A78BFA' : 'var(--txt2)',
      transition: 'all 0.2s', whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
);

// ─── Divider ─────────────────────────────────────────────────
export const Divider = ({ style }) => (
  <hr style={{ border: 'none', borderTop: '1px solid var(--b1)', margin: '1.5rem 0', ...style }} />
);

// ─── Toggle Switch ────────────────────────────────────────────
export const Toggle = ({ value, onChange, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--s2)', borderRadius: 9, marginBottom: '0.5rem' }}>
    {label && <span style={{ fontSize: '0.845rem' }}>{label}</span>}
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, background: value ? 'var(--acc)' : 'var(--s3)',
        borderRadius: 12, cursor: 'pointer', position: 'relative', transition: 'all 0.3s',
      }}
    >
      <div style={{
        width: 18, height: 18, background: value ? '#fff' : 'var(--txt3)',
        borderRadius: '50%', position: 'absolute', top: 3,
        left: value ? 23 : 3, transition: 'all 0.3s',
      }} />
    </div>
  </div>
);

// ─── Section Header ───────────────────────────────────────────
export const SectionHeader = ({ tag, title, subtitle }) => (
  <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
    {tag && <div className="sec-tag">{tag}</div>}
    <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.02em', marginBottom: '0.9rem' }}>{title}</h2>
    {subtitle && <p style={{ color: 'var(--txt2)', fontSize: '1.05rem', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>{subtitle}</p>}
  </div>
);

// ─── Alert ────────────────────────────────────────────────────
export const Alert = ({ type = 'info', children }) => {
  const styles = {
    info: { bg: 'rgba(108,78,246,.08)', border: 'rgba(108,78,246,.2)', color: '#A78BFA', icon: 'ℹ️' },
    ok: { bg: 'rgba(0,229,160,.06)', border: 'rgba(0,229,160,.2)', color: 'var(--ok)', icon: '✅' },
    warn: { bg: 'rgba(255,181,46,.08)', border: 'rgba(255,181,46,.2)', color: 'var(--warn)', icon: '⚠️' },
    err: { bg: 'rgba(255,77,106,.08)', border: 'rgba(255,77,106,.2)', color: 'var(--err)', icon: '❌' },
    success: { bg: 'rgba(0,229,160,.06)', border: 'rgba(0,229,160,.2)', color: 'var(--ok)', icon: '✅' },
    error: { bg: 'rgba(255,77,106,.08)', border: 'rgba(255,77,106,.2)', color: 'var(--err)', icon: '❌' },
  };
  const s = styles[type] || styles.info; // Fallback to 'info' if type not found
  if (!s) {
    console.warn(`Alert: Unknown type "${type}", falling back to "info"`);
    return null;
  }
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '0.875rem 1rem', display: 'flex', gap: 9, fontSize: '0.82rem', color: 'var(--txt2)', marginBottom: '1rem' }}>
      <span>{s.icon}</span><div>{children}</div>
    </div>
  );
};

// ─── Pagination ───────────────────────────────────────────────
export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) pages.push('...');
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
      <Button
        size="sm"
        variant={currentPage === 1 ? 'ghost' : 'secondary'}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        style={{ minWidth: 36 }}
      >
        ← Prev
      </Button>

      {pages.map((page, idx) => (
        <button
          key={idx}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: currentPage === page ? '2px solid var(--acc)' : '1px solid var(--b1)',
            background: currentPage === page ? 'var(--acc)' : 'var(--s1)',
            color: currentPage === page ? '#fff' : 'var(--txt2)',
            cursor: page === '...' ? 'default' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: currentPage === page ? 600 : 400,
            transition: 'all 0.2s',
            opacity: page === '...' ? 0.5 : 1,
          }}
        >
          {page}
        </button>
      ))}

      <Button
        size="sm"
        variant={currentPage === totalPages ? 'ghost' : 'secondary'}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        style={{ minWidth: 36 }}
      >
        Next →
      </Button>
    </div>
  );
};
