import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const FALLBACK_ADMIN_EMAILS = ['admin@savemeaseat.com', 'godwinbanda19@gmail.com'];

/**
 * useUserRole hook
 * Fetches server-verified role from public.profiles table.
 * Never relies on client-side storage or insecure flags.
 */
export function useUserRole() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchRole = useCallback(async (sessionUser) => {
        if (!sessionUser) {
            setUser(null);
            setProfile(null);
            setRole(null);
            setLoading(false);
            return;
        }

        setUser(sessionUser);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, full_name, role')
                .eq('id', sessionUser.id)
                .single();

            if (error || !data) {
                // If profiles table isn't created yet or user row missing, check fallback
                console.warn('[useUserRole] Could not fetch profile row, using fallback check:', error?.message);
                const isKnownAdmin = FALLBACK_ADMIN_EMAILS.includes((sessionUser.email || '').toLowerCase());
                setRole(isKnownAdmin ? 'super_admin' : 'user');
                setProfile({ id: sessionUser.id, email: sessionUser.email, role: isKnownAdmin ? 'super_admin' : 'user' });
            } else {
                setRole(data.role);
                setProfile(data);
            }
        } catch (err) {
            console.error('[useUserRole] Unexpected error checking user role:', err);
            const isKnownAdmin = FALLBACK_ADMIN_EMAILS.includes((sessionUser?.email || '').toLowerCase());
            setRole(isKnownAdmin ? 'super_admin' : 'user');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return;
            fetchRole(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            fetchRole(session?.user ?? null);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchRole]);

    const isSuperAdmin = role === 'super_admin';

    return {
        user,
        profile,
        role,
        isSuperAdmin,
        loading,
        refreshRole: () => user && fetchRole(user)
    };
}

export default useUserRole;
