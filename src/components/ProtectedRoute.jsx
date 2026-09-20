import React from 'react';
import { Navigate } from 'react-router-dom';
import useUserRole from '../utils/useUserRole';
import AccessDenied403 from './AccessDenied403';

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const { user, isSuperAdmin, loading } = useUserRole();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#090d16',
                color: '#64748b',
                fontFamily: 'system-ui, sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        border: '3px solid rgba(31, 160, 155, 0.2)',
                        borderTopColor: '#1fa09b',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 12px'
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <span style={{ fontSize: '0.85rem' }}>Verifying permissions...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole === 'super_admin' && !isSuperAdmin) {
        return <AccessDenied403 userEmail={user.email} requiredRole={requiredRole} />;
    }

    return children;
};

export default ProtectedRoute;
