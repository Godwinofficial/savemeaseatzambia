-- Adds custom intro video URL column to weddings table
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS hero_video_url TEXT DEFAULT NULL;
