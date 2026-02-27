-- ============================================
-- FIX: Delete the incorrect cron job and create a new one
-- ============================================

-- Step 1: Delete the existing job with placeholder values
SELECT cron.unschedule('send-wedding-reminders');

-- Step 2: Create the correct cron job
-- IMPORTANT: Replace YOUR_PROJECT_REF and YOUR_ANON_KEY with actual values!
-- 
-- Find YOUR_PROJECT_REF:
--   Supabase Dashboard → Settings → General → Reference ID
--
-- Find YOUR_ANON_KEY:
--   Supabase Dashboard → Settings → API → anon public key
--
SELECT cron.schedule(
  'send-wedding-reminders',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) as request_id;
  $$
);

-- Step 3: Verify the new job
SELECT 
  jobid,
  schedule,
  command,
  active,
  jobname
FROM cron.job
WHERE jobname = 'send-wedding-reminders';

-- ============================================
-- EXAMPLE (DO NOT USE - Replace with your actual values):
-- ============================================
-- SELECT cron.schedule(
--   'send-wedding-reminders',
--   '*/15 * * * *',
--   $$
--   SELECT
--     net.http_post(
--       url:='https://abcdefghijklmnop.supabase.co/functions/v1/send-reminders',
--       headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMjM0NTY3OCwiZXhwIjoxOTI3OTIxNjc4fQ.example_signature_here"}'::jsonb
--     ) as request_id;
--   $$
-- );
-- ============================================
