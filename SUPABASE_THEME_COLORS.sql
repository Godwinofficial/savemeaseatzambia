-- SUPABASE MIGRATION FOR DYNAMIC WEDDING THEME COLORS
-- Run this script in your Supabase SQL Editor to add theme colors support.

-- Add theme_colors column to public.weddings if it does not already exist
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS theme_colors JSONB DEFAULT '[]'::jsonb;
