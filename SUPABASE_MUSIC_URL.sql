-- Adds background music URL column to the weddings table
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS music_url TEXT DEFAULT NULL;
