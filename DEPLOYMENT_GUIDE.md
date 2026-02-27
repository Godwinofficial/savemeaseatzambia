# Supabase Edge Function Deployment Guide

## Step 1: Install Supabase CLI

Open PowerShell and run:

```powershell
npm install -g supabase
```

Verify installation:
```powershell
supabase --version
```

## Step 2: Login to Supabase

```powershell
supabase login
```

This will open your browser to authenticate with Supabase.

## Step 3: Link Your Project

Navigate to your project directory:
```powershell
cd C:\Users\JAE\Desktop\savemeaseat
```

Link to your Supabase project:
```powershell
supabase link --project-ref YOUR_PROJECT_REF
```

**To find your PROJECT_REF:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → General
4. Copy the "Reference ID"

## Step 4: Set Environment Secrets

Set the EmailJS credentials as secrets:

```powershell
supabase secrets set EMAILJS_SERVICE_ID=your_service_id_here
supabase secrets set EMAILJS_TEMPLATE_ID=your_template_id_here
supabase secrets set EMAILJS_PUBLIC_KEY=your_public_key_here
```

**Get these values from your `.env` file:**
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

## Step 5: Deploy the Function

```powershell
supabase functions deploy send-reminders
```

You should see output like:
```
Deploying function send-reminders...
Function deployed successfully!
Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders
```

## Step 6: Test the Function

Test it manually first:

```powershell
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -H "Content-Type: application/json"
```

**To find your ANON_KEY:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the "anon public" key

You should see a JSON response with the results.

## Step 7: Set Up Cron Job (Automatic Scheduling)

Go to Supabase Dashboard → SQL Editor and run this SQL:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the function to run every 15 minutes
SELECT cron.schedule(
  'send-wedding-reminders',           -- Job name
  '*/15 * * * *',                     -- Every 15 minutes
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) as request_id;
  $$
);
```

**IMPORTANT:** Replace:
- `YOUR_PROJECT_REF` with your actual project reference ID
- `YOUR_ANON_KEY` with your actual anon key

## Step 8: Verify Cron Job

Check if the cron job is scheduled:

```sql
SELECT * FROM cron.job;
```

You should see your `send-wedding-reminders` job listed.

## Step 9: Monitor Logs

To see if the function is running:

1. Go to Supabase Dashboard → Edge Functions
2. Click on `send-reminders`
3. Go to "Logs" tab
4. You'll see logs every 15 minutes when the cron runs

## Troubleshooting

### Function not deploying?
- Make sure you're in the correct directory
- Check that `supabase/functions/send-reminders/index.ts` exists
- Try `supabase functions deploy send-reminders --no-verify-jwt`

### Cron job not running?
- Check that pg_cron and pg_net extensions are enabled
- Verify the URL and anon key are correct
- Check Supabase logs for errors

### Emails not sending?
- Check Edge Function logs for errors
- Verify EmailJS secrets are set correctly
- Test EmailJS credentials manually

## Cron Schedule Options

If you want different timing:

- **Every 5 minutes:** `*/5 * * * *`
- **Every 30 minutes:** `*/30 * * * *`
- **Every hour:** `0 * * * *`
- **Every day at 8 AM:** `0 8 * * *`

## Updating the Function

If you make changes to `index.ts`:

```powershell
supabase functions deploy send-reminders
```

The cron job will automatically use the updated version.

## Deleting the Cron Job

If you need to stop automatic reminders:

```sql
SELECT cron.unschedule('send-wedding-reminders');
```

## Success!

Once set up:
- ✅ Reminders check every 15 minutes automatically
- ✅ No browser needed
- ✅ Works 24/7
- ✅ Completely free on Supabase
- ✅ Logs available in Supabase Dashboard

Your wedding reminders are now fully automated! 🎉
