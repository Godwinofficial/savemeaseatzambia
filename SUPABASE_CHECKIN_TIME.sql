-- Add checked_in_at column to rsvps table if it doesn't exist
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ DEFAULT NULL;
