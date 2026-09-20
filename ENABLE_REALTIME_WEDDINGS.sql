-- Enable Realtime for the 'weddings' table
-- This allows clients to listen to INSERT and UPDATE events.

BEGIN;

-- Check if publication 'supabase_realtime' exists, create if not (Supabase usually has this by default)
-- DO NOT create if it already exists, so we just alter it.
-- We add the 'weddings' table to the publication.

ALTER PUBLICATION supabase_realtime ADD TABLE weddings;

COMMIT;

-- Note: If you get an error that the table is already in the publication, it means Realtime is already enabled for this table.
