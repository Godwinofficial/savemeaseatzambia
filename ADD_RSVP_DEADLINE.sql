-- Add rsvp_deadline column to weddings table
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS rsvp_deadline date;
