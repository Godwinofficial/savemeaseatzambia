-- ============================================================
-- GUEST-FIRST FLOW SETUP — Supabase SQL Script
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- Safe to re-run (uses IF NOT EXISTS and IF EXISTS guards)
-- ============================================================

-- ── 1. Ensure columns exist on weddings ──────────────────────
ALTER TABLE public.weddings
    ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.weddings
    ADD COLUMN IF NOT EXISTS ceremony_address text;

-- ── 2. Enable Row Level Security on weddings ─────────────────
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;

-- ── 3. DROP old permissive policies if they exist ────────────
-- (prevents conflicts when re-running)
DROP POLICY IF EXISTS "weddings_public_read"     ON public.weddings;
DROP POLICY IF EXISTS "weddings_owner_read"      ON public.weddings;
DROP POLICY IF EXISTS "weddings_owner_insert"    ON public.weddings;
DROP POLICY IF EXISTS "weddings_owner_update"    ON public.weddings;
DROP POLICY IF EXISTS "weddings_owner_delete"    ON public.weddings;
DROP POLICY IF EXISTS "Allow all"                ON public.weddings;
DROP POLICY IF EXISTS "Enable all for all users" ON public.weddings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.weddings;

-- ── 4. PUBLIC READ — guests can view published invitations ───
CREATE POLICY "weddings_public_read"
ON public.weddings
FOR SELECT
USING (
    status IN ('active', 'approved', 'pending')
    OR user_id IS NULL
);

-- ── 5. OWNER READ — users can see ALL their own events ───────
CREATE POLICY "weddings_owner_read"
ON public.weddings
FOR SELECT
USING (
    auth.uid() = user_id
);

-- ── 6. OWNER INSERT — authenticated users can create their own event
CREATE POLICY "weddings_owner_insert"
ON public.weddings
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
);

-- ── 7. OWNER UPDATE — users can update their own event ───────
CREATE POLICY "weddings_owner_update"
ON public.weddings
FOR UPDATE
USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id
);

-- ── 8. OWNER DELETE — users can delete their own event ───────
CREATE POLICY "weddings_owner_delete"
ON public.weddings
FOR DELETE
USING (
    auth.uid() = user_id
);

-- ── 9. ADMIN BYPASS — service_role bypasses RLS by default ───
-- No extra policy needed. Supabase service_role always bypasses RLS.
-- The admin dashboard uses the anon key through browser auth, so
-- admin users need their own policy if they're logged in as Supabase
-- auth users.  If your admin is a specific email, use:

-- CREATE POLICY "weddings_admin_all"
-- ON public.weddings
-- FOR ALL
-- USING (
--     auth.jwt() ->> 'email' = 'admin@yourdomain.com'
-- );

-- ── 10. RSVPs table — allow event owners to manage RSVPs ─────
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rsvps_public_insert" ON public.rsvps;
DROP POLICY IF EXISTS "rsvps_owner_read"    ON public.rsvps;
DROP POLICY IF EXISTS "rsvps_owner_delete"  ON public.rsvps;
DROP POLICY IF EXISTS "Allow all"           ON public.rsvps;

-- Guests can submit RSVPs (anon insert)
CREATE POLICY "rsvps_public_insert"
ON public.rsvps
FOR INSERT
WITH CHECK (true);

-- Event owners can read RSVPs for their events
CREATE POLICY "rsvps_owner_read"
ON public.rsvps
FOR SELECT
USING (
    wedding_id IN (
        SELECT id FROM public.weddings WHERE user_id = auth.uid()
    )
);

-- Event owners can delete RSVPs for their events
CREATE POLICY "rsvps_owner_delete"
ON public.rsvps
FOR DELETE
USING (
    wedding_id IN (
        SELECT id FROM public.weddings WHERE user_id = auth.uid()
    )
);

-- ── 11. Storage bucket policy (wedding-uploads) ───────────────
-- Allow authenticated users to upload to the couples/ prefix
-- Run this if uploads are failing for logged-in users:

-- INSERT INTO storage.policies (name, bucket_id, operation, check)
-- VALUES (
--   'Authenticated users can upload couple photos',
--   'wedding-uploads',
--   'INSERT',
--   'auth.role() = ''authenticated'''
-- ) ON CONFLICT DO NOTHING;

-- ── 12. Index for user event lookups ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_weddings_user_id
ON public.weddings(user_id);

-- ── 13. Index for slug lookups (already likely exists) ────────
CREATE INDEX IF NOT EXISTS idx_weddings_slug
ON public.weddings(slug);

-- ── VERIFICATION ─────────────────────────────────────────────
-- After running, verify with:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies WHERE tablename = 'weddings';

-- ── NOTES ─────────────────────────────────────────────────────
-- 1. Existing admin-created events with user_id = NULL will remain
--    publicly readable (via the public_read policy) but cannot be
--    edited or deleted by regular users.
-- 2. To give admin users edit rights, either:
--    a) Run the admin-bypass policy above with their email, OR
--    b) Update those rows to set user_id = <admin-user-uuid>
-- 3. Email confirmation can be disabled in Supabase:
--    Dashboard > Authentication > Settings > "Enable email confirmations"
--    (Recommended OFF for this guest-first flow)
