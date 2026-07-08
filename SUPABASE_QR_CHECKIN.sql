-- Add checked_in column to rsvps table if it doesn't exist
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE;
