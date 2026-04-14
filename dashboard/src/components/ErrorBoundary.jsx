import React from 'react';
import { useNavigate } from 'react-router-dom';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', padding: '24px', textAlign: 'center', animation: 'fadeIn 300ms ease' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚠️</div>
          <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Application Error</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '500px', lineHeight: 1.6, marginBottom: '32px' }}>
            A critical error occurred while rendering this interface. Our technical team has been notified. Please try refreshing the page or navigating back to safety.
          </p>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '4px', maxWidth: '600px', width: '100%', overflowX: 'auto', marginBottom: '32px', textAlign: 'left' }}>
            <code style={{ fontSize: '12px', color: 'var(--danger)', fontFamily: 'monospace' }}>
              {this.state.error?.toString()}
            </code>
          </div>
          <button 
            className="primary-btn" 
            onClick={() => window.location.href = '/'}
            style={{ padding: '14px 28px', fontSize: '15px' }}
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
