import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import logoImg from '../assets/images/logo1.png';
import './AuthModal.css';

/**
 * AuthModal
 * A deferred-auth modal that appears when an unauthenticated user tries to save/publish.
 * The parent draft remains untouched while this modal is open.
 *
 * Props:
 *   onAuthSuccess(user) — called after successful login or signup session
 *   onClose()           — called when user dismisses the modal
 *   draftLabel          — optional short label like "Chanda & Mutale's wedding"
 */
const AuthModal = ({ onAuthSuccess, onClose, draftLabel }) => {
    const [tab, setTab] = useState('signup'); // 'signup' | 'signin'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verifyPending, setVerifyPending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Close on Escape key
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Cooldown ticker for resend button
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    // Listen for auth state changes (handles email verification callback)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
                onAuthSuccess(session.user);
            }
        });
        return () => subscription.unsubscribe();
    }, [onAuthSuccess]);

    const handleSignUp = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Please enter your email and a password (min 6 characters).');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { data, error: err } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: { full_name: name.trim() || email.trim().split('@')[0] },
                    // Redirect back to create-event after email verification
                    emailRedirectTo: `${window.location.origin}/create-event?draft=restore`,
                },
            });
            if (err) throw err;

            // If session exists immediately → email confirmation disabled → success
            if (data.session) {
                onAuthSuccess(data.user);
            } else if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
                // User already exists in Supabase! Supabase does NOT send a confirmation email in this case.
                setError('An account with this email already exists. Please sign in with your password.');
                setTab('signin');
            } else {
                // Email confirmation required
                setVerifyPending(true);
                setResendCooldown(60);
            }
        } catch (err) {
            console.error('Supabase signUp error details:', err);
            let msg = err.message || 'Sign up failed. Please try again.';
            if (err.status === 500 || msg.toLowerCase().includes('internal server') || msg.toLowerCase().includes('confirmation mail')) {
                msg = 'There was a problem sending the confirmation email. Please check your email address or try again later.';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Please enter your email and password.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { data, error: err } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (err) throw err;
            onAuthSuccess(data.user);
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            const { error: err } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/create-event?draft=restore`,
                },
            });
            if (err) throw err;
            // User is redirected — draft key survives in localStorage
        } catch (err) {
            setError(err.message || 'Google sign-in failed.');
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        try {
            const { error: resendErr } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
            if (resendErr) throw resendErr;
            setResendCooldown(60);
            setError('');
        } catch (err) {
            setError(err.message || 'Could not resend confirmation email. Rate limit may apply.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (tab === 'signup') handleSignUp();
        else handleSignIn();
    };

    // Email verification pending state
    if (verifyPending) {
        return (
            <div className="auth-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
                <div className="auth-modal-card">
                    <button className="auth-modal-close" onClick={onClose} aria-label="Close">
                        <i className="fas fa-times" />
                    </button>
                    <div className="auth-verify-state">
                        <div className="auth-verify-icon">
                            <i className="fas fa-envelope-open-text" />
                        </div>
                        <h3>Check Your Email</h3>
                        <p>
                            We sent a confirmation link to <strong>{email}</strong>.<br />
                            Click it to verify your account — your invitation draft will be saved automatically when you return.
                        </p>
                        
                        <div className="auth-draft-preserved" style={{ justifyContent: 'center', marginBottom: '1.25rem' }}>
                            <i className="fas fa-shield-alt" />
                            <span>Your draft is safely stored and will not be lost</span>
                        </div>

                        {error && (
                            <div className="auth-error-box" style={{ marginBottom: '1rem', textAlign: 'left' }}>
                                <i className="fas fa-exclamation-triangle" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Action 1: Attempt direct login if account is already confirmed or password is set */}
                        <button
                            type="button"
                            className="auth-submit-btn"
                            style={{ marginBottom: '0.75rem' }}
                            onClick={handleSignIn}
                            disabled={loading}
                        >
                            {loading ? <><i className="fas fa-spinner fa-spin" /> Signing In...</> : <><i className="fas fa-sign-in-alt" style={{ marginRight: 6 }} /> Already Confirmed? Sign In With Password</>}
                        </button>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            <button
                                type="button"
                                className="auth-resend-btn"
                                onClick={handleResend}
                                disabled={resendCooldown > 0}
                            >
                                {resendCooldown > 0
                                    ? `Resend in ${resendCooldown}s`
                                    : <><i className="fas fa-paper-plane" style={{ marginRight: 6 }} />Resend Email</>
                                }
                            </button>

                            <button
                                type="button"
                                className="auth-resend-btn"
                                style={{ color: '#64748b' }}
                                onClick={() => { setVerifyPending(false); setTab('signin'); setError(''); }}
                            >
                                <i className="fas fa-arrow-left" style={{ marginRight: 6 }} />
                                Back to Sign In
                            </button>
                        </div>

                        {/* Informational tips on why emails might be delayed or dropped */}
                        <div style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '0.75rem',
                            textAlign: 'left',
                            lineHeight: 1.45
                        }}>
                            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                                <i className="fas fa-info-circle" style={{ color: '#1fa09b', marginRight: '4px' }} />
                                Why did I not receive the email?
                            </strong>
                            <ul style={{ margin: '0', paddingLeft: '1.2rem' }}>
                                <li>Check your <strong>Junk / Spam / Quarantine</strong> folder (iCloud & Outlook often filter test emails).</li>
                                <li>Supabase built-in SMTP has strict hourly rate limits on free projects.</li>
                                <li><strong>Recommended:</strong> In Supabase Dashboard &rarr; Authentication &rarr; Providers &rarr; Email, disable <em>"Confirm email"</em> to allow instant logins without waiting for an email.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="auth-modal-card">
                <button className="auth-modal-close" onClick={onClose} aria-label="Close">
                    <i className="fas fa-times" />
                </button>

                {/* Brand */}
                <div className="auth-modal-brand">
                    <img src={logoImg} alt="SaveMeASeat" />
                    <span className="auth-modal-brand-text">Wedding Studio</span>
                </div>

                <h2 className="auth-modal-headline">
                    {tab === 'signup' ? 'Create your free account' : 'Welcome back!'}
                </h2>
                <p className="auth-modal-sub">
                    Create an account or log in to save your invitation.
                    {draftLabel && <> Your <strong>{draftLabel}</strong> draft will be attached instantly.</>}
                </p>

                {/* Draft preserved notice */}
                <div className="auth-draft-preserved">
                    <i className="fas fa-file-alt" />
                    <span>Your invitation draft is safely preserved and ready to publish</span>
                </div>

                {/* Tab Switcher */}
                <div className="auth-modal-tabs">
                    <button
                        type="button"
                        className={`auth-tab-btn ${tab === 'signup' ? 'active' : ''}`}
                        onClick={() => { setTab('signup'); setError(''); }}
                    >
                        <i className="fas fa-user-plus" style={{ marginRight: 5 }} />
                        Create Account
                    </button>
                    <button
                        type="button"
                        className={`auth-tab-btn ${tab === 'signin' ? 'active' : ''}`}
                        onClick={() => { setTab('signin'); setError(''); }}
                    >
                        <i className="fas fa-sign-in-alt" style={{ marginRight: 5 }} />
                        Sign In
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="auth-error-box" style={{ marginBottom: '1rem' }}>
                        <i className="fas fa-exclamation-triangle" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form className="auth-modal-form" onSubmit={handleSubmit}>
                    {tab === 'signup' && (
                        <div>
                            <label className="auth-field-label">Your Full Name</label>
                            <div className="auth-input-wrap">
                                <i className="fas fa-user" />
                                <input
                                    id="auth-name"
                                    type="text"
                                    className="auth-input"
                                    placeholder="e.g. Chanda Banda"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    autoComplete="name"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="auth-field-label">Email Address *</label>
                        <div className="auth-input-wrap">
                            <i className="fas fa-envelope" />
                            <input
                                id="auth-email"
                                type="email"
                                className="auth-input"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="auth-field-label">
                            {tab === 'signup' ? 'Create Password *' : 'Password *'}
                        </label>
                        <div className="auth-input-wrap">
                            <i className="fas fa-lock" />
                            <input
                                id="auth-password"
                                type="password"
                                className="auth-input"
                                placeholder={tab === 'signup' ? 'At least 6 characters' : '••••••••'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                            />
                        </div>
                    </div>

                    <button
                        id="auth-submit-btn"
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading
                            ? <><i className="fas fa-spinner fa-spin" /> {tab === 'signup' ? 'Creating Account...' : 'Signing In...'}</>
                            : tab === 'signup'
                                ? <><i className="fas fa-check-circle" /> Create Account & Save Invitation</>
                                : <><i className="fas fa-sign-in-alt" /> Sign In & Save Invitation</>
                        }
                    </button>
                </form>

                {/* OAuth Divider */}
                <div className="auth-divider" style={{ margin: '1.25rem 0 1rem' }}>or continue with</div>

                <button
                    id="auth-google-btn"
                    type="button"
                    className="auth-google-btn"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                >
                    <svg className="auth-google-icon" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                </button>

                <p className="auth-modal-footer-note">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
};

export default AuthModal;
