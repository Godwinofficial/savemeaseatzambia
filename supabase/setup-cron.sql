-- ============================================
-- Wedding Reminder Cron Job Setup
-- ============================================
-- This SQL script sets up automatic wedding reminders
-- that run every 15 minutes via Supabase Edge Functions
-- ============================================

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Schedule the reminder function
-- IMPORTANT: Replace YOUR_PROJECT_REF and YOUR_ANON_KEY before running!
SELECT cron.schedule(
  'send-wedding-reminders',           -- Job name
  '*/15 * * * *',                     -- Cron expression: every 15 minutes
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) as request_id;
  $$
);

-- Step 3: Verify the cron job was created
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname = 'send-wedding-reminders';

-- ============================================
-- INSTRUCTIONS:
-- ============================================
-- 1. Find YOUR_PROJECT_REF:
--    - Go to Supabase Dashboard → Settings → General
--    - Copy the "Reference ID"
--
-- 2. Find YOUR_ANON_KEY:
--    - Go to Supabase Dashboard → Settings → API
--    - Copy the "anon public" key
--
-- 3. Replace both placeholders in the SELECT cron.schedule() above
--
-- 4. Run this entire script in Supabase SQL Editor
--
-- 5. Check the verification query at the bottom to confirm
-- ============================================

-- ============================================
-- OPTIONAL: View all cron jobs
-- ============================================
-- SELECT * FROM cron.job;

-- ============================================
-- OPTIONAL: View cron job run history
-- ============================================
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-wedding-reminders')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- ============================================
-- OPTIONAL: Unschedule (delete) the cron job
-- ============================================
-- SELECT cron.unschedule('send-wedding-reminders');

-- ============================================
-- OPTIONAL: Different schedules
-- ============================================
-- Every 5 minutes:  */5 * * * *
-- Every 30 minutes: */30 * * * *
-- Every hour:       0 * * * *
-- Every day at 8AM: 0 8 * * *
-- ============================================
