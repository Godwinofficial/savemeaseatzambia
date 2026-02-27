# 🚀 Quick Start: Automatic Wedding Reminders

## ✅ Checklist

### Prerequisites
- [ ] Supabase project created
- [ ] EmailJS account set up
- [ ] Email template configured in EmailJS

### Step 1: Install Supabase CLI (5 minutes)
```powershell
npm install -g supabase
supabase login
```

### Step 2: Link Your Project (2 minutes)
```powershell
cd C:\Users\JAE\Desktop\savemeaseat
supabase link --project-ref YOUR_PROJECT_REF
```
📝 Get YOUR_PROJECT_REF from: Supabase Dashboard → Settings → General → Reference ID

### Step 3: Set Secrets (3 minutes)
```powershell
supabase secrets set EMAILJS_SERVICE_ID=your_service_id
supabase secrets set EMAILJS_TEMPLATE_ID=your_template_id
supabase secrets set EMAILJS_PUBLIC_KEY=your_public_key
```
📝 Get these from your `.env` file (remove the `VITE_` prefix)

### Step 4: Deploy Function (2 minutes)
```powershell
supabase functions deploy send-reminders
```
✅ You should see: "Function deployed successfully!"

### Step 5: Test Function (2 minutes)
```powershell
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -H "Content-Type: application/json"
```
📝 Get YOUR_ANON_KEY from: Supabase Dashboard → Settings → API → anon public

✅ You should see JSON response with results

### Step 6: Set Up Cron (5 minutes)
1. Open Supabase Dashboard → SQL Editor
2. Open `supabase/setup-cron.sql` file
3. Replace `YOUR_PROJECT_REF` and `YOUR_ANON_KEY`
4. Copy and paste into SQL Editor
5. Click "Run"

✅ You should see the cron job in the results

### Step 7: Verify (2 minutes)
Run this SQL to check:
```sql
SELECT * FROM cron.job WHERE jobname = 'send-wedding-reminders';
```

✅ You should see 1 row with your cron job

## 🎉 Done!

Your wedding reminders are now fully automatic!

- ⏰ Checks every 15 minutes
- 📧 Sends to approved guests automatically
- 🔄 Works 24/7 without browser
- 📊 View logs in Supabase Dashboard → Edge Functions → send-reminders → Logs

## 📝 What to Expect

### First Run
- Wait up to 15 minutes for first cron execution
- Check logs to see if it ran
- If reminders are due, emails will send automatically

### Ongoing
- Every 15 minutes, the system checks for due reminders
- Sends emails to approved guests
- Marks reminders as sent in database
- Logs everything for monitoring

## 🔍 Monitoring

### View Function Logs
1. Supabase Dashboard → Edge Functions
2. Click `send-reminders`
3. Go to "Logs" tab
4. See real-time execution logs

### View Cron History
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-wedding-reminders')
ORDER BY start_time DESC
LIMIT 10;
```

## ⚠️ Troubleshooting

### Function not deploying?
- Check you're in the correct directory
- Verify `supabase/functions/send-reminders/index.ts` exists
- Try: `supabase functions deploy send-reminders --no-verify-jwt`

### Cron not running?
- Verify extensions are enabled (pg_cron, pg_net)
- Check URL and anon key are correct
- Look for errors in SQL Editor

### Emails not sending?
- Check Edge Function logs
- Verify EmailJS secrets are correct
- Test EmailJS manually

## 📞 Need Help?

Check these files:
- `DEPLOYMENT_GUIDE.md` - Detailed step-by-step instructions
- `supabase/setup-cron.sql` - SQL script with comments
- `supabase/functions/send-reminders/index.ts` - Edge Function code

## 🎯 Total Time: ~20 minutes

Once set up, you never have to think about it again! 🚀
