-- Add manual_reminders_count column to weddings table
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS manual_reminders_count integer DEFAULT 0;
