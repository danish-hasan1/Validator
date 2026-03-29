import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('[Validator ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ maxWidth: 520, width: '100%', background: '#fff', borderRadius: 20, boxShadow: '6px 6px 18px #c8d0e0,-4px -4px 12px #fff', border: '1px solid rgba(255,255,255,.8)', padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⚡</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1a1f36', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 13.5, color: '#8892b0', marginBottom: 28, lineHeight: 1.7 }}>
              An unexpected error occurred. Your data is safe in localStorage.
              Try refreshing the page.
            </p>

            {this.state.error && (
              <details style={{ textAlign: 'left', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 12, color: '#be123c', fontFamily: 'monospace' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700, marginBottom: 6 }}>Error details</summary>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {this.state.error.toString()}
                  {this.state.info?.componentStack}
                </div>
              </details>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#5b6af5,#7c5cbf)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(91,106,245,.35)' }}>
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ error: null, info: null })}
                style={{ padding: '11px 24px', borderRadius: 10, border: '1.5px solid #dde3f0', background: '#fff', color: '#4a5278', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Try Again
              </button>
            </div>

            <p style={{ fontSize: 12, color: '#c5c9fb', marginTop: 20 }}>
              Your saved JDs and evaluations are stored in your browser and will still be there after refresh.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
