import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught a runtime error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--user-text, #F9FAFB)',
          background: 'var(--user-bg, #0B0F17)'
        }}>
          <div style={{
            maxWidth: 480,
            background: 'var(--user-card-bg, #111827)',
            border: '1px solid var(--user-border, #1F2937)',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8, color: 'var(--user-text, #F9FAFB)' }}>
              {this.props.title || 'Page Unavailable'}
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--user-text-secondary, #9CA3AF)', marginBottom: 24, lineHeight: 1.5 }}>
              {this.state.error?.message || 'An unexpected error occurred while loading this view. You can refresh or return to Discover.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: '10px 20px',
                  borderRadius: 999,
                  background: 'var(--user-primary, #EC4899)',
                  color: '#FFF',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                Reload Page
              </button>
              <a
                href="/discover"
                style={{
                  padding: '10px 20px',
                  borderRadius: 999,
                  background: 'var(--user-bg-secondary, #1F2937)',
                  color: 'var(--user-text, #F9FAFB)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  display: 'inline-block'
                }}
              >
                Go to Discover
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
