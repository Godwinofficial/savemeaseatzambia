import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            navigate('/admin');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-brand" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img 
                        src="/imgs/logo1.png" 
                        alt="Save Me A Seat" 
                        style={{ height: '56px', width: 'auto', marginBottom: '1rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} 
                    />
                </div>
                <h1>Admin Portal</h1>
                <form onSubmit={handleLogin}>
                    <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                        <label>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <i className="fas fa-envelope" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}></i>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@example.com"
                                className="form-input"
                                style={{ paddingLeft: '3rem' }}
                            />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <i className="fas fa-lock" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}></i>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="form-input"
                                style={{ paddingLeft: '3rem' }}
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ padding: '1rem 2rem' }}>
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                                Authenticating...
                            </>
                        ) : (
                            <>
                                Sign In
                                <i className="fas fa-arrow-right" style={{ marginLeft: '0.5rem', transition: 'transform 0.2s' }}></i>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;

