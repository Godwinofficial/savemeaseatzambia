-- Add cover_image column to weddings table
ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS cover_image text;
