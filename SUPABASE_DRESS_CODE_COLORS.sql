-- SUPABASE MIGRATION FOR DRESS CODE COLORS
-- Run this script in your Supabase SQL Editor to add dress code colors support.
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS dress_code_colors JSONB DEFAULT '[]'::jsonb;
