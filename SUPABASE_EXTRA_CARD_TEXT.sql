-- SUPABASE MIGRATION FOR EXTRA CARD TEXT
-- Run this script in your Supabase SQL Editor to add extra card text support.
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS extra_card_text TEXT;
