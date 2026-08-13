-- Add color columns for birthday events (safe to run multiple times)
ALTER TABLE IF EXISTS birthday_events
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#f4d05c',
  ADD COLUMN IF NOT EXISTS katy_gold text DEFAULT '#f4d05c';

-- You can run this against your Supabase/Postgres database to add the columns.
-- Example psql:
-- psql "postgresql://<user>:<password>@<host>:5432/<db>" -f ADD_BIRTHDAY_COLOR_COLUMNS.sql
