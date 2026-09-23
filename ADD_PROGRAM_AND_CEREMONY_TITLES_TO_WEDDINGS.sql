-- SUPABASE MIGRATION: Add Flexible Wedding Program & Ceremony Section Titles
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Add Ceremony Section Title (defaults to 'Church Service')
ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS ceremony_title TEXT DEFAULT 'Church Service';

-- 2. Add Ceremony Section Subheading (defaults to 'Marriage Blessings')
ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS ceremony_subtitle TEXT DEFAULT 'Marriage Blessings';

-- 3. Add Wedding Program / Order of Events JSONB column
ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS program JSONB DEFAULT '[]'::jsonb;

-- Optional: Refresh schema cache notification
NOTIFY pgrst, 'reload schema';
