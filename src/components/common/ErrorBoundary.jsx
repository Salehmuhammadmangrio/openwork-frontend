import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Keep a console trace for debugging runtime crashes in production builds.
    // eslint-disable-next-line no-console
    console.error('UI crashed:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--bg)',
          color: 'var(--txt)',
          padding: '1.5rem',
        }}>
          <div style={{
            width: '100%',
            maxWidth: 540,
            background: 'var(--s1)',
            border: '1px solid var(--b1)',
            borderRadius: 16,
            padding: '1.5rem',
            boxShadow: 'var(--shadow)',
          }}>
            <p style={{ fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--txt3)', marginBottom: 10 }}>APPLICATION ERROR</p>
            <h1 style={{ marginBottom: 10 }}>Something went wrong.</h1>
            <p style={{ color: 'var(--txt2)', marginBottom: 16 }}>
              The page crashed unexpectedly. Reload to recover.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                border: '1px solid var(--b2)',
                background: 'var(--g1)',
                color: '#fff',
                borderRadius: 10,
                padding: '10px 14px',
                fontWeight: 600,
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
