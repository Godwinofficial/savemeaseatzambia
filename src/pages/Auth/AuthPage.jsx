import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { isDraftMeaningful, pushDraftToUserAccount } from '../../utils/draftManager';
import logoImg from '../../assets/images/logo1.png';
import './AuthPage.css';

const FALLBACK_ADMIN_EMAILS = ['admin@savemeaseat.com', 'godwinbanda19@gmail.com'];

export default function AuthPage({ defaultMode = 'signin' }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Determine initial mode: check path, query param 'mode', or defaultMode
    const isSignupPath = location.pathname === '/signup' || location.pathname === '/register';
    const queryMode = searchParams.get('mode');
    const [tab, setTab] = useState(isSignupPath || queryMode === 'signup' ? 'signup' : defaultMode);

    const redirectTarget = searchParams.get('redirect') || '';
    const isConfirmedParam = searchParams.get('confirmed') === 'true';

    // Form inputs
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState(() => localStorage.getItem('savemeaseat_last_auth_email') || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [forgotMode, setForgotMode] = useState(false);

    // Ticker for resend email cooldown
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // Handle email verification token or confirmed redirect
    useEffect(() => {
        const hash = window.location.hash || '';
        const search = window.location.search || '';

        const hasVerifyToken = hash.includes('access_token') || hash.includes('type=signup') || search.includes('code=');

        if (isConfirmedParam || hasVerifyToken) {
            setTab('signin');
            setEmailSent(false);

            // Clean up the URL query params without reloading
            if (window.history.replaceState) {
                const cleanUrl = window.location.pathname + (redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : '');
                window.history.replaceState(null, '', cleanUrl);
            }

            // Check if Supabase already authenticated the user upon token verification
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) {
                    setSuccessMsg('Email confirmed! Redirecting to your account...');
                    setTimeout(() => {
                        handleSuccessfulAuth(session.user);
                    }, 600);
                } else {
                    setSuccessMsg('Email confirmed successfully! Please sign in with your password to continue.');
                }
            }).catch(() => {
                setSuccessMsg('Email confirmed successfully! Please sign in with your password to continue.');
            });
        }
    }, [isConfirmedParam, redirectTarget]);

    // Synchronize tab with route change if user navigates between /login and /signup
    useEffect(() => {
        if (location.pathname === '/signup' || location.pathname === '/register') {
            setTab('signup');
        } else if (location.pathname === '/login') {
            if (queryMode !== 'signup') {
                setTab('signin');
            }
        }
    }, [location.pathname, queryMode]);

    // Role check and destination routing
    const handleSuccessfulAuth = async (user) => {
        try {
            // If user has a pending draft in localStorage, push it to their account
            if (isDraftMeaningful()) {
                console.log('[AuthPage] Draft detected, syncing to user account...');
                await pushDraftToUserAccount(user);
            }

            // Check role in profiles table
            let isSuperAdmin = false;
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                isSuperAdmin = profile?.role === 'super_admin' ||
                    FALLBACK_ADMIN_EMAILS.includes((user.email || '').toLowerCase());
            } catch {
                isSuperAdmin = FALLBACK_ADMIN_EMAILS.includes((user.email || '').toLowerCase());
            }

            // Priority: explicit redirect param > admin dashboard > user dashboard
            if (redirectTarget) {
                navigate(redirectTarget);
            } else if (isSuperAdmin) {
                navigate('/admin');
            } else {
                navigate('/my-events');
            }
        } catch (err) {
            console.error('[AuthPage] Error during post-auth processing:', err);
            navigate(redirectTarget || '/my-events');
        }
    };

    // Sign In handler
    const handleSignIn = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!email.trim() || !password.trim()) {
            setError('Please enter your email and password.');
            return;
        }

        setLoading(true);
        try {
            const { data, error: signInErr } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (signInErr) throw signInErr;

            localStorage.setItem('savemeaseat_last_auth_email', email.trim());
            await handleSuccessfulAuth(data.user);
        } catch (err) {
            console.error('Sign In Error:', err);
            let msg = err.message || 'Login failed. Please check your credentials.';
            if (msg.toLowerCase().includes('email not confirmed')) {
                msg = 'Your email address is not yet confirmed. Please check your inbox or request a new confirmation email.';
            } else if (msg.toLowerCase().includes('invalid login credentials')) {
                msg = 'Incorrect email or password. Please try again.';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Sign Up handler
    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!email.trim() || !password.trim()) {
            setError('Please enter your email and password.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match. Please re-enter your password.');
            return;
        }

        setLoading(true);
        try {
            localStorage.setItem('savemeaseat_last_auth_email', email.trim());

            // Build redirect URL pointing straight to /login?confirmed=true
            const redirectUrl = `${window.location.origin}/login?confirmed=true${redirectTarget ? `&redirect=${encodeURIComponent(redirectTarget)}` : ''
                }`;

            const { data, error: signUpErr } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        full_name: fullName.trim() || email.trim().split('@')[0],
                    },
                    emailRedirectTo: redirectUrl,
                },
            });

            if (signUpErr) throw signUpErr;

            // If session was returned immediately (email confirmation disabled in Supabase)
            if (data?.session) {
                await handleSuccessfulAuth(data.user);
                return;
            }

            // Check if user already exists
            if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
                setError('An account with this email already exists. Please sign in with your password.');
                setTab('signin');
                return;
            }

            // Email confirmation required -> show simple, clean verification state
            setEmailSent(true);
            setResendCooldown(60);
        } catch (err) {
            console.error('Sign Up Error:', err);
            let msg = err.message || 'Failed to create account. Please try again.';
            if (err.status === 500 || msg.toLowerCase().includes('confirmation mail')) {
                msg = 'There was an issue sending the confirmation email. Please check your email address or try again.';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Resend confirmation email
    const handleResend = async () => {
        if (resendCooldown > 0 || !email.trim()) return;
        setError('');
        try {
            const redirectUrl = `${window.location.origin}/login?confirmed=true${redirectTarget ? `&redirect=${encodeURIComponent(redirectTarget)}` : ''
                }`;

            const { error: resendErr } = await supabase.auth.resend({
                type: 'signup',
                email: email.trim(),
                options: {
                    emailRedirectTo: redirectUrl,
                },
            });

            if (resendErr) throw resendErr;
            setResendCooldown(60);
            setSuccessMsg('A new confirmation email has been sent!');
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            setError(err.message || 'Unable to resend email. Please wait a minute and try again.');
        }
    };

    // Forgot password request
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Please enter your email address to receive password reset instructions.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${window.location.origin}/login?mode=signin`,
            });
            if (resetErr) throw resetErr;
            setSuccessMsg('Password reset instructions have been sent to your email.');
            setForgotMode(false);
        } catch (err) {
            setError(err.message || 'Failed to send reset link.');
        } finally {
            setLoading(false);
        }
    };

    // Switch tab helper
    const handleSwitchTab = (newTab) => {
        setTab(newTab);
        setError('');
        setSuccessMsg('');
        setEmailSent(false);
        setForgotMode(false);
        if (newTab === 'signup') {
            navigate(`/signup${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`, { replace: true });
        } else {
            navigate(`/login${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`, { replace: true });
        }
    };

    return (
        <div className="auth-page-wrapper">
            {/* Top Navigation Bar with Back Link */}
            <header className="auth-top-bar">
                <Link to="/" className="auth-back-link">
                    <i className="fas fa-arrow-left" />
                    Back to Home
                </Link>
            </header>

            {/* Main Auth Container */}
            <main className="auth-page-container">
                {/* Brand Logo */}
                <div className="auth-brand-header">
                    <Link to="/" className="auth-brand-logo-link" aria-label="Save Me A Seat Home">
                        <img src={logoImg} alt="Save Me A Seat" className="auth-brand-logo-img" />
                    </Link>
                </div>

                <div className="auth-card">
                    {/* Header (hidden when emailSent to prevent duplicate headers) */}
                    {!emailSent && (
                        <div className="auth-card-header">
                            <h1 className="auth-card-title">
                                {forgotMode
                                    ? 'Reset Password'
                                    : tab === 'signup'
                                        ? 'Create Account'
                                        : 'Sign In'}
                            </h1>
                            <p className="auth-card-sub">
                                {forgotMode
                                    ? 'Enter your email to receive password reset instructions'
                                    : tab === 'signup'
                                        ? 'Sign up to build, save, and manage your invitations'
                                        : 'Welcome back! Enter your details to continue'}
                            </p>
                        </div>
                    )}

                    {/* Feedback Messages */}
                    {error && (
                        <div className="auth-alert auth-alert-error">
                            <i className="fas fa-exclamation-circle" />
                            <span>{error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="auth-alert auth-alert-success">
                            <i className="fas fa-check-circle" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* Modern, Clean Email Sent State */}
                    {emailSent ? (
                        <div className="auth-simple-verify-card">
                            <div className="auth-verify-icon-wrap">
                                <i className="fas fa-paper-plane" />
                            </div>
                            <h1 className="auth-verify-title">Confirmation Link Sent!</h1>
                            <p className="auth-verify-sub">
                                We've sent an activation link to your email address:
                            </p>
                            <div className="auth-verify-email-pill">
                                <i className="fas fa-envelope" />
                                <span>{email}</span>
                            </div>

                            <div className="auth-verify-instructions">
                                <div className="auth-verify-step">
                                    <span className="step-num">1</span>
                                    <span>Check your inbox (and spam/promotions folder).</span>
                                </div>
                                <div className="auth-verify-step">
                                    <span className="step-num">2</span>
                                    <span>Click the <strong>Confirm Email</strong> link inside.</span>
                                </div>
                                <div className="auth-verify-step">
                                    <span className="step-num">3</span>
                                    <span>You'll be redirected straight to <strong>Sign In</strong> to access your event.</span>
                                </div>
                            </div>

                            <div className="auth-verify-actions">
                                <button
                                    type="button"
                                    className="auth-submit-button"
                                    onClick={() => handleSwitchTab('signin')}
                                >
                                    <i className="fas fa-sign-in-alt" /> Proceed to Sign In
                                </button>
                                <button
                                    type="button"
                                    className="auth-btn-secondary"
                                    onClick={handleResend}
                                    disabled={resendCooldown > 0}
                                >
                                    {resendCooldown > 0 ? (
                                        <>
                                            <i className="fas fa-clock" />
                                            Resend email in {resendCooldown}s
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-redo" />
                                            Resend Confirmation Email
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="auth-btn-ghost"
                                    onClick={() => { setEmailSent(false); setTab('signup'); }}
                                >
                                    <i className="fas fa-edit" /> Entered the wrong email? Edit
                                </button>
                            </div>
                        </div>
                    ) : forgotMode ? (
                        /* Forgot Password Form */
                        <form className="auth-form" onSubmit={handleForgotPassword}>
                            <div className="auth-group">
                                <label className="auth-label">Email Address</label>
                                <div className="auth-input-container">
                                    <i className="fas fa-envelope auth-input-icon" />
                                    <input
                                        type="email"
                                        className="auth-input-field"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="auth-submit-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin" />
                                        Sending Instructions...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                            <button
                                type="button"
                                className="auth-btn-ghost"
                                onClick={() => setForgotMode(false)}
                                style={{ marginTop: '0.75rem' }}
                            >
                                <i className="fas fa-arrow-left" /> Back to Sign In
                            </button>
                        </form>
                    ) : (
                        /* Standard Sign In / Sign Up Forms */
                        <>
                            {/* Tab Switcher */}
                            <div className="auth-nav-tabs">
                                <button
                                    type="button"
                                    className={`auth-nav-tab ${tab === 'signin' ? 'active' : ''}`}
                                    onClick={() => handleSwitchTab('signin')}
                                >
                                    <i className="fas fa-sign-in-alt" />
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    className={`auth-nav-tab ${tab === 'signup' ? 'active' : ''}`}
                                    onClick={() => handleSwitchTab('signup')}
                                >
                                    <i className="fas fa-user-plus" />
                                    Create Account
                                </button>
                            </div>

                            <form className="auth-form" onSubmit={tab === 'signup' ? handleSignUp : handleSignIn}>
                                {/* Full name only on signup */}
                                {tab === 'signup' && (
                                    <div className="auth-group">
                                        <label className="auth-label">Full Name</label>
                                        <div className="auth-input-container">
                                            <i className="fas fa-user auth-input-icon" />
                                            <input
                                                type="text"
                                                className="auth-input-field"
                                                placeholder="e.g. Godwin Banda"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                required
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Email Address */}
                                <div className="auth-group">
                                    <label className="auth-label">Email Address</label>
                                    <div className="auth-input-container">
                                        <i className="fas fa-envelope auth-input-icon" />
                                        <input
                                            type="email"
                                            className="auth-input-field"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoFocus={tab === 'signin'}
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="auth-group">
                                    <div className="auth-label">
                                        <span>Password</span>
                                        {tab === 'signin' && (
                                            <button
                                                type="button"
                                                className="auth-forgot-link"
                                                onClick={() => { setForgotMode(true); setError(''); }}
                                            >
                                                Forgot password?
                                            </button>
                                        )}
                                    </div>
                                    <div className="auth-input-container">
                                        <i className="fas fa-lock auth-input-icon" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="auth-input-field"
                                            placeholder={tab === 'signup' ? 'Min. 6 characters' : '••••••••'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="auth-password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password only on signup */}
                                {tab === 'signup' && (
                                    <div className="auth-group">
                                        <label className="auth-label">Confirm Password</label>
                                        <div className="auth-input-container">
                                            <i className="fas fa-shield-alt auth-input-icon" />
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                className="auth-input-field"
                                                placeholder="Re-enter your password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="auth-password-toggle"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                            >
                                                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Main Submit Button */}
                                <button
                                    type="submit"
                                    className="auth-submit-button"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin" />
                                            {tab === 'signup' ? 'Creating Account...' : 'Signing In...'}
                                        </>
                                    ) : tab === 'signup' ? (
                                        <>
                                            <i className="fas fa-user-check" />
                                            Create Account
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-sign-in-alt" />
                                            Sign In
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Footer Switch Link */}
                            <div className="auth-card-footer">
                                {tab === 'signin' ? (
                                    <>
                                        Don't have an account yet?{' '}
                                        <button
                                            type="button"
                                            className="auth-switch-button"
                                            onClick={() => handleSwitchTab('signup')}
                                        >
                                            Create Account
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{' '}
                                        <button
                                            type="button"
                                            className="auth-switch-button"
                                            onClick={() => handleSwitchTab('signin')}
                                        >
                                            Sign In
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
