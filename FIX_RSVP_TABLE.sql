-- RUN THIS IN SUPABASE SQL EDITOR TO FIX THE ERROR
-- The 400 Error suggests the 'phone' column might be missing because the previous script 
-- used "IF NOT EXISTS" and didn't update the already created table.

-- 1. Explicitly add the missing phone column
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS phone text;

-- 2. Ensure wedding_id allows NULLs just in case (optional, but good for debugging) or verify FK
-- (No action needed here usually, but good to know)

-- 3. Verify policies are correct (Running this is safe even if they exist)
DROP POLICY IF EXISTS "Allow Public Insert RSVPs" ON public.rsvps;
CREATE POLICY "Allow Public Insert RSVPs" ON public.rsvps FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Auth Select RSVPs" ON public.rsvps;
CREATE POLICY "Allow Auth Select RSVPs" ON public.rsvps FOR SELECT USING (auth.role() = 'authenticated');
