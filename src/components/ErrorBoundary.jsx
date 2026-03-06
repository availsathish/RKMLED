import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '2rem',
                    fontFamily: 'Inter, sans-serif',
                    background: '#f1f5f9',
                    color: '#0f172a'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '100%',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ Something went wrong</h2>
                        <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                            The application encountered an error. Please try refreshing the page.
                        </p>
                        <details style={{
                            background: '#f8fafc',
                            padding: '1rem',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Error Details</summary>
                            <p style={{ marginTop: '0.5rem', color: '#ef4444' }}>
                                {this.state.error && this.state.error.toString()}
                            </p>
                            <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.75rem' }}>
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </p>
                        </details>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                marginTop: '1rem',
                                padding: '0.75rem 1.5rem',
                                background: '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '9999px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.95rem'
                            }}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
