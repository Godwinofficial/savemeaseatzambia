-- SUPABASE MIGRATION: Add Dynamic Reception Header & Gallery Toggle to Weddings
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Add Reception Section Title (defaults to 'RECEPTION')
ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS reception_title TEXT DEFAULT 'RECEPTION';

-- 2. Add Reception Section Subheading (defaults to 'Party')
ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS reception_subtitle TEXT DEFAULT 'Party';

-- 3. Add Show Gallery Titles Toggle (defaults to true)
ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS show_gallery_titles BOOLEAN DEFAULT true;

-- Optional: Refresh schema cache notification
NOTIFY pgrst, 'reload schema';
