-- ====================================================================
-- SUPER ADMIN APPROVAL WORKFLOW & ACCESS CONTROL SETUP
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE / DROP guards)
-- ====================================================================

-- ── 1. Create Profiles Table with Role Enforcement ────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'super_admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist even if public.profiles already existed previously!
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
        -- Add constraint safely if not already present
        BEGIN
            ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'super_admin'));
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-sync new auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        'user' -- Always defaults to 'user'. Never allow self-assignment of super_admin!
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing auth users into public.profiles
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
    'user'
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    role = COALESCE(public.profiles.role, 'user');

-- ── 2. Helper Function to Check Super Admin Status (Security Definer) ─
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── 3. Policies on Profiles ───────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read"
ON public.profiles
FOR SELECT
USING (
    auth.uid() = id OR public.is_super_admin()
);

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Prevent self-privilege escalation!
);

-- ── 4. Add Approval & Tracking Columns to weddings Table ──────────────
ALTER TABLE public.weddings
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();

-- ── 5. Create Audit Log Table for Event Approvals ─────────────────────
CREATE TABLE IF NOT EXISTS public.approval_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wedding_id TEXT,
    event_id TEXT,
    event_name TEXT,
    action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'reset')),
    reason TEXT,
    admin_id UUID REFERENCES auth.users(id),
    admin_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure wedding_id column is TEXT even if table already existed previously
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'approval_audit_logs' AND column_name = 'wedding_id' AND data_type != 'text'
    ) THEN
        ALTER TABLE public.approval_audit_logs ALTER COLUMN wedding_id TYPE TEXT USING wedding_id::text;
    END IF;
END $$;

ALTER TABLE public.approval_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approval_audit_super_admin_read" ON public.approval_audit_logs;
CREATE POLICY "approval_audit_super_admin_read"
ON public.approval_audit_logs
FOR SELECT
USING (public.is_super_admin());

DROP POLICY IF EXISTS "approval_audit_super_admin_insert" ON public.approval_audit_logs;
CREATE POLICY "approval_audit_super_admin_insert"
ON public.approval_audit_logs
FOR INSERT
WITH CHECK (public.is_super_admin());

-- ── 6. Row Level Security on public.weddings ──────────────────────────
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;

-- Super admins have full access to view, update, and manage all weddings
DROP POLICY IF EXISTS "weddings_super_admin_all" ON public.weddings;
CREATE POLICY "weddings_super_admin_all"
ON public.weddings
FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Public guests can only read approved/active invitations
DROP POLICY IF EXISTS "weddings_public_read" ON public.weddings;
CREATE POLICY "weddings_public_read"
ON public.weddings
FOR SELECT
USING (
    status IN ('active', 'approved')
    OR (user_id IS NULL AND status != 'rejected')
);

-- Owners can read their own events in any status (draft, pending, approved, rejected)
DROP POLICY IF EXISTS "weddings_owner_read" ON public.weddings;
CREATE POLICY "weddings_owner_read"
ON public.weddings
FOR SELECT
USING (auth.uid() = user_id);

-- Owners can insert their own events
DROP POLICY IF EXISTS "weddings_owner_insert" ON public.weddings;
CREATE POLICY "weddings_owner_insert"
ON public.weddings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Owners can update their own events
DROP POLICY IF EXISTS "weddings_owner_update" ON public.weddings;
CREATE POLICY "weddings_owner_update"
ON public.weddings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Owners can delete their own events
DROP POLICY IF EXISTS "weddings_owner_delete" ON public.weddings;
CREATE POLICY "weddings_owner_delete"
ON public.weddings
FOR DELETE
USING (auth.uid() = user_id);

-- ── 7. Integrity Trigger: Non-Admins Cannot Approve Events ─────────────
CREATE OR REPLACE FUNCTION public.check_wedding_status_integrity()
RETURNS TRIGGER AS $$
BEGIN
    -- If user is NOT a super admin:
    IF NOT public.is_super_admin() THEN
        -- Prevent changing status to 'approved' or tampering with approval stamps
        IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
            RAISE EXCEPTION 'Access Denied: Only super admins can approve events.';
        END IF;

        IF NEW.approved_by IS DISTINCT FROM OLD.approved_by OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
            RAISE EXCEPTION 'Access Denied: Cannot modify approval records.';
        END IF;

        -- If a rejected event is edited by the owner, reset status to 'pending' for re-review
        IF OLD.status = 'rejected' AND NEW.status != 'pending' THEN
            NEW.status := 'pending';
            NEW.submitted_at := NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_wedding_status_integrity ON public.weddings;
CREATE TRIGGER trg_wedding_status_integrity
    BEFORE UPDATE ON public.weddings
    FOR EACH ROW EXECUTE FUNCTION public.check_wedding_status_integrity();

-- ── 8. Secure Server-Side RPC Functions for Approval & Rejection ──────
DROP FUNCTION IF EXISTS public.approve_event(UUID);
DROP FUNCTION IF EXISTS public.approve_event(TEXT);
CREATE OR REPLACE FUNCTION public.approve_event(p_wedding_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_event public.weddings;
    v_admin_email TEXT;
BEGIN
    -- Strict security check
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION '403: Forbidden - Only super admins can approve events.';
    END IF;

    -- Fetch current admin's email
    SELECT email INTO v_admin_email FROM public.profiles WHERE id = auth.uid();

    -- Update the wedding
    UPDATE public.weddings
    SET 
        status = 'approved',
        approved_by = auth.uid(),
        approved_at = NOW(),
        rejection_reason = NULL,
        rejected_by = NULL,
        rejected_at = NULL
    WHERE id::text = p_wedding_id
    RETURNING * INTO v_event;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found.';
    END IF;

    -- Insert into Audit Log
    INSERT INTO public.approval_audit_logs (
        wedding_id,
        event_id,
        event_name,
        action,
        admin_id,
        admin_email
    ) VALUES (
        v_event.id::text,
        v_event.event_id,
        CONCAT(v_event.groom_name, ' & ', v_event.bride_name),
        'approved',
        auth.uid(),
        v_admin_email
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Event successfully approved and public link activated.',
        'status', 'approved',
        'slug', v_event.slug
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.reject_event(UUID, TEXT);
DROP FUNCTION IF EXISTS public.reject_event(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.reject_event(p_wedding_id TEXT, p_reason TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_event public.weddings;
    v_admin_email TEXT;
BEGIN
    -- Strict security check
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION '403: Forbidden - Only super admins can reject events.';
    END IF;

    SELECT email INTO v_admin_email FROM public.profiles WHERE id = auth.uid();

    -- Update the wedding
    UPDATE public.weddings
    SET 
        status = 'rejected',
        rejected_by = auth.uid(),
        rejected_at = NOW(),
        rejection_reason = p_reason
    WHERE id::text = p_wedding_id
    RETURNING * INTO v_event;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found.';
    END IF;

    -- Insert into Audit Log
    INSERT INTO public.approval_audit_logs (
        wedding_id,
        event_id,
        event_name,
        action,
        reason,
        admin_id,
        admin_email
    ) VALUES (
        v_event.id::text,
        v_event.event_id,
        CONCAT(v_event.groom_name, ' & ', v_event.bride_name),
        'rejected',
        p_reason,
        auth.uid(),
        v_admin_email
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Event marked as rejected with reason recorded.',
        'status', 'rejected',
        'reason', p_reason
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 9. Set Initial Super Admin Accounts ───────────────────────────────
-- Promotes specified emails to super_admin. Adjust or add your email here.
UPDATE public.profiles
SET role = 'super_admin'
WHERE email IN (
    'admin@savemeaseat.com',
    'godwinbanda19@gmail.com'
);

-- ====================================================================
-- INSTRUCTIONS TO PROMOTE ANY NEW ACCOUNT TO SUPER ADMIN:
-- Run this in the SQL Editor:
--   UPDATE public.profiles SET role = 'super_admin' WHERE email = 'your-email@example.com';
-- ====================================================================
