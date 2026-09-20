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
        console.error('[ErrorBoundary] Caught an unhandled error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/my-events';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#090d16',
                    color: '#f8fafc',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    padding: '24px'
                }}>
                    <div style={{
                        maxWidth: '520px',
                        width: '100%',
                        background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px',
                        padding: '36px 28px',
                        textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '28px',
                            margin: '0 auto 20px'
                        }}>
                            <i className="fas fa-exclamation-triangle" />
                        </div>

                        <h2 style={{
                            fontSize: '1.4rem',
                            fontWeight: 700,
                            margin: '0 0 10px',
                            color: '#ffffff'
                        }}>
                            Something went wrong
                        </h2>

                        <p style={{
                            fontSize: '0.92rem',
                            color: '#94a3b8',
                            lineHeight: 1.6,
                            margin: '0 0 24px'
                        }}>
                            An unexpected issue occurred while rendering this page. You can reload the page or return to your dashboard.
                        </p>

                        {this.state.error?.message && (
                            <div style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '10px',
                                padding: '12px 14px',
                                fontSize: '0.8rem',
                                color: '#fca5a5',
                                textAlign: 'left',
                                fontFamily: 'monospace',
                                wordBreak: 'break-word',
                                marginBottom: '24px'
                            }}>
                                {this.state.error.message}
                            </div>
                        )}

                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    padding: '12px 22px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #1fa09b 0%, #167a76 100%)',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <i className="fas fa-redo" /> Reload Page
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                style={{
                                    padding: '12px 22px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#e2e8f0',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <i className="fas fa-th-large" /> Go to My Events
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
