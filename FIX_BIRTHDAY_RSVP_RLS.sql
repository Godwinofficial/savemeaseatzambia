-- Run this script in the Supabase SQL Editor to allow RSVP updates/deletes from the public report page.

-- Drop any existing restrict policies that might conflict (optional, but good practice)
DROP POLICY IF EXISTS "Public update birthday_rsvps" ON birthday_rsvps;
DROP POLICY IF EXISTS "Public delete birthday_rsvps" ON birthday_rsvps;

-- 1. Allow anyone to DELETE their RSVPs (or an admin using the public link)
CREATE POLICY "Public delete birthday_rsvps"
    ON birthday_rsvps FOR DELETE
    USING (true);

-- 2. Allow anyone to UPDATE RSVPs (e.g., approving or moving to pending from the public link)
CREATE POLICY "Public update birthday_rsvps"
    ON birthday_rsvps FOR UPDATE
    USING (true);
