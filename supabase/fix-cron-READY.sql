-- ============================================
-- FIX: Wedding Reminders Cron Job
-- With YOUR actual credentials
-- ============================================

-- Step 1: Delete the existing job with placeholder values
SELECT cron.unschedule('send-wedding-reminders');

-- Step 2: Create the correct cron job with your actual credentials
SELECT cron.schedule(
  'send-wedding-reminders',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://jfhszusuahxlydjtzzut.supabase.co/functions/v1/send-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmaHN6dXN1YWh4bHlkanR6enV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTYzMDAsImV4cCI6MjA4MzE5MjMwMH0.gpEMjSa2cLpMzGC4NL79KDHnqI1SbZCmh1991KA4_iI"}'::jsonb
    ) as request_id;
  $$
);

-- Step 3: Verify the new job was created correctly
SELECT 
  jobid,
  schedule,
  command,
  active,
  jobname
FROM cron.job
WHERE jobname = 'send-wedding-reminders';

-- ============================================
-- Expected Result:
-- You should see 1 row with:
-- - schedule: */15 * * * *
-- - active: true
-- - command: Should contain your actual URL and key
-- ============================================
