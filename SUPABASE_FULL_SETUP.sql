-- SAFE UPDATE SCRIPT
-- This script safely checks for the table and adds columns if they are missing.

-- 1. Ensure the weddings table exists (basic structure)
CREATE TABLE IF NOT EXISTS public.weddings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    groom_name text,
    bride_name text,
    slug text UNIQUE,
    date timestamptz
);

-- 2. Add Reminder Columns (Safe to run multiple times)
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS reminder_day_of_event_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS reminder_custom_date TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS reminder_custom_message TEXT DEFAULT NULL;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS reminder_sent_day_of BOOLEAN DEFAULT FALSE;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS reminder_sent_custom BOOLEAN DEFAULT FALSE;

-- 3. Add Views Column (if missing)
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- 4. Create RSVPs table if missing
CREATE TABLE IF NOT EXISTS public.rsvps (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    wedding_id uuid REFERENCES public.weddings(id) ON DELETE CASCADE,
    name text,
    email text,
    phone text,
    attending text,
    guests_count integer
);

-- 5. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weddings_reminders 
ON public.weddings (reminder_day_of_event_enabled, reminder_custom_date, reminder_sent_day_of, reminder_sent_custom);
