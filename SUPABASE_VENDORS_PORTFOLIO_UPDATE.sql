-- SUPABASE MIGRATION FOR VENDOR DEVICE UPLOADS & PORTFOLIO GALLERY
-- Run this in your Supabase SQL Editor to add the portfolio column and setup security policies.

-- 1. Add portfolio column to public.vendors if it does not already exist
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS portfolio JSONB DEFAULT '[]'::jsonb;

-- 2. Enable Row Level Security (RLS) on public.vendors
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- 3. Safely setup policies so they can be executed multiple times without errors
DO $$
BEGIN
    -- Allow public SELECT reads so website guests can see vendors
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'vendors' 
          AND policyname = 'Public read vendors'
    ) THEN
        CREATE POLICY "Public read vendors" ON public.vendors FOR SELECT USING (true);
    END IF;

    -- Allow authenticated administrators to perform all CRUD operations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'vendors' 
          AND policyname = 'Admins manage vendors'
    ) THEN
        CREATE POLICY "Admins manage vendors" ON public.vendors FOR ALL 
        USING (auth.role() = 'authenticated') 
        WITH CHECK (auth.role() = 'authenticated');
    END IF;
END
$$;
