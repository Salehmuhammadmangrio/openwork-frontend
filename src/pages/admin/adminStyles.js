// Admin page styling utilities and components

export const adminStyles = {
    // Page header styles
    header: {
        marginBottom: '2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap'
    },

    headerTitle: {
        fontSize: '2rem',
        fontWeight: 800,
        margin: 0,
        letterSpacing: '-0.02em',
        background: 'linear-gradient(135deg, var(--txt) 0%, var(--txt2) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: '0.6rem'
    },

    headerSubtitle: {
        color: 'var(--txt2)',
        fontSize: '0.96rem',
        margin: 0
    },

    // Card styles
    card: {
        background: 'linear-gradient(135deg, var(--s1) 0%, var(--s2) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '1.85rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(4px)'
    },

    cardHover: {
        background: 'linear-gradient(135deg, var(--s1) 0%, var(--s2) 100%)',
        borderColor: 'rgba(108,78,246,0.3)',
        boxShadow: '0 12px 40px rgba(108,78,246,0.15)'
    },

    // Stat card
    statCard: {
        background: 'linear-gradient(135deg, rgba(108,78,246,0.1) 0%, rgba(108,78,246,0.05) 100%)',
        border: '1px solid rgba(108,78,246,0.2)',
        borderRadius: 14,
        padding: '1.75rem',
        boxShadow: '0 4px 16px rgba(108,78,246,0.1)'
    },

    // Search/Input
    searchInput: {
        width: '100%',
        padding: '13px 18px',
        fontSize: '0.92rem',
        background: 'linear-gradient(135deg, var(--s1) 0%, var(--s2) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        color: 'var(--txt)',
        transition: 'all 0.3s',
        marginBottom: '1.5rem'
    },

    // Badge colors
    severityColors: {
        low: 'var(--txt3)',
        medium: 'var(--warn)',
        high: 'var(--err)',
        critical: 'var(--err)',
        pending: '#f59e0b',
        active: '#10b981',
        inactive: 'var(--txt3)'
    },

    // Table styles
    tableHeader: {
        display: 'grid',
        gap: '1rem',
        padding: '1.5rem 1.85rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        fontWeight: 600,
        fontSize: '0.82rem',
        color: 'var(--txt2)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },

    tableRow: {
        display: 'grid',
        gap: '1rem',
        alignItems: 'center',
        padding: '1.5rem 1.85rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
    },

    tableRowHover: {
        background: 'rgba(108,78,246,0.08)'
    },

    // Gradient button
    gradientButton: {
        background: 'linear-gradient(135deg, var(--acc) 0%, var(--acc2) 100%)',
        boxShadow: '0 4px 16px rgba(108,78,246,0.3)',
        transition: 'all 0.3s'
    },

    // Status badge
    statusActive: {
        background: 'rgba(16,185,129,0.1)',
        color: '#10b981',
        border: '1px solid rgba(16,185,129,0.3)'
    },

    statusInactive: {
        background: 'rgba(156,163,175,0.1)',
        color: 'var(--txt3)',
        border: '1px solid rgba(156,163,175,0.3)'
    },

    statusPending: {
        background: 'rgba(245,158,11,0.1)',
        color: '#f59e0b',
        border: '1px solid rgba(245,158,11,0.3)'
    },

    // Get status badge style
    getStatusStyle: (status) => {
        const styles = {
            active: {
                background: 'rgba(16,185,129,0.1)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.3)',
                padding: '0.5rem 1rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'inline-block'
            },
            inactive: {
                background: 'rgba(156,163,175,0.1)',
                color: 'var(--txt3)',
                border: '1px solid rgba(156,163,175,0.3)',
                padding: '0.5rem 1rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'inline-block'
            },
            pending: {
                background: 'rgba(245,158,11,0.1)',
                color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.3)',
                padding: '0.5rem 1rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'inline-block'
            },
        };
        return styles[status] || styles.inactive;
    }
};

// Export getStatusStyle separately for backward compatibility
export const getStatusStyle = (status) => {
    return adminStyles.getStatusStyle(status);
};
