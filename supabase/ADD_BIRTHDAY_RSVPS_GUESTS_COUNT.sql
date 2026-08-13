-- Add guests_count column to birthday_rsvps (safe to run multiple times)
ALTER TABLE IF EXISTS birthday_rsvps
  ADD COLUMN IF NOT EXISTS guests_count integer DEFAULT 0;

-- Run against your Supabase/Postgres database to apply the change.
-- Example using psql:
-- psql "postgresql://<user>:<password>@<host>:5432/<db>" -f ADD_BIRTHDAY_RSVPS_GUESTS_COUNT.sql
