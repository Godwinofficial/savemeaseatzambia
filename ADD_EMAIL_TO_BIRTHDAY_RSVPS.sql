-- Add email column to birthday_rsvps (run in Supabase SQL Editor)
ALTER TABLE birthday_rsvps
  ADD COLUMN IF NOT EXISTS email TEXT;
