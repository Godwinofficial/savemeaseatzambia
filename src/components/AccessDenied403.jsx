import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/images/logo1.png';

const AccessDenied403 = ({ userEmail, requiredRole = 'super_admin' }) => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#090d16',
            color: '#f8fafc',
            fontFamily: "'Outfit', 'Segoe UI', system-ui, sans-serif",
            padding: '24px',
            position: 'relative'
        }}>
            <div style={{
                position: 'absolute',
                top: '24px',
                left: '24px'
            }}>
                <Link to="/">
                    <img src={logoImg} alt="SaveMeASeat" style={{ height: '36px' }} />
                </Link>
            </div>

            <div style={{
                maxWidth: '480px',
                width: '100%',
                background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '24px',
                padding: '40px 32px',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
            }}>
                <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '20px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    margin: '0 auto 24px',
                    boxShadow: '0 0 24px rgba(239, 68, 68, 0.2)'
                }}>
                    <i className="fas fa-shield-alt" />
                </div>

                <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '100px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#fca5a5',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    marginBottom: '16px'
                }}>
                    403 ACCESS DENIED
                </div>

                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    margin: '0 0 10px',
                    color: '#ffffff'
                }}>
                    Restricted Area
                </h1>

                <p style={{
                    fontSize: '0.92rem',
                    color: '#94a3b8',
                    lineHeight: 1.6,
                    margin: '0 0 20px'
                }}>
                    This administration console is strictly restricted to verified <strong>super administrators</strong>.
                </p>

                {userEmail && (
                    <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        fontSize: '0.82rem',
                        color: '#cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginBottom: '28px'
                    }}>
                        <i className="fas fa-user-circle" style={{ color: '#64748b' }} />
                        <span>Signed in as: <strong>{userEmail}</strong> (role: <code>user</code>)</span>
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <Link
                        to="/my-events"
                        style={{
                            padding: '12px 22px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #1fa09b 0%, #167a76 100%)',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(31, 160, 155, 0.3)'
                        }}
                    >
                        <i className="fas fa-th-large" /> Go to My Events
                    </Link>
                    <Link
                        to="/"
                        style={{
                            padding: '12px 22px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(255,255,255,0.05)',
                            color: '#e2e8f0',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <i className="fas fa-home" /> Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied403;
