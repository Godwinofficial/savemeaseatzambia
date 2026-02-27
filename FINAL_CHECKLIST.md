# ✅ Final Setup Checklist

## Your Credentials
- ✅ Project ID: `jfhszusuahxlydjtzzut`
- ✅ Anon Key: Retrieved

## Step-by-Step (Do in Order)

### ☐ Step 1: Deploy the Edge Function (5 min)

Open PowerShell in your project directory and run:

```powershell
cd C:\Users\JAE\Desktop\savemeaseat
supabase functions deploy send-reminders
```

**Expected output:**
```
Deploying function send-reminders...
Function deployed successfully!
```

---

### ☐ Step 2: Test the Function (2 min)

Open `TEST_FUNCTION.md` and copy the test command, then run it in PowerShell.

**Expected:** JSON response with `"success": true`

---

### ☐ Step 3: Set Up Automatic Cron (2 min)

1. Open `supabase/fix-cron-READY.sql` (already has your credentials!)
2. Copy the **entire file**
3. Go to Supabase Dashboard → SQL Editor
4. Paste and click **Run**

**Expected output:**
```json
[
  {
    "jobid": 2,
    "schedule": "*/15 * * * *",
    "command": "... (with your actual URL and key)",
    "active": true,
    "jobname": "send-wedding-reminders"
  }
]
```

---

### ☐ Step 4: Verify It's Working (1 min)

In Supabase SQL Editor, run:

```sql
SELECT * FROM cron.job WHERE jobname = 'send-wedding-reminders';
```

**Check:**
- ✅ `active` = true
- ✅ `schedule` = */15 * * * *
- ✅ `command` contains your actual project URL (not placeholders)

---

### ☐ Step 5: Monitor Logs (Ongoing)

1. Go to Supabase Dashboard → **Edge Functions**
2. Click **send-reminders**
3. Go to **Logs** tab
4. Wait up to 15 minutes
5. You should see logs from the cron job execution

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Edge Function deploys without errors
2. ✅ Test command returns `"success": true`
3. ✅ Cron job shows in database with `active: true`
4. ✅ Logs appear every 15 minutes in Edge Functions
5. ✅ Emails are sent to guests when reminders are due

---

## 📊 What Happens Next

### Every 15 Minutes:
1. Cron triggers the Edge Function
2. Function checks all weddings for due reminders
3. Sends emails to approved guests
4. Marks reminders as sent in database
5. Logs everything for monitoring

### You Can:
- View logs in Supabase Dashboard
- See cron history in SQL
- Manually trigger with the test command
- Adjust schedule if needed (change `*/15 * * * *`)

---

## 🆘 Troubleshooting

### Edge Function won't deploy?
```powershell
# Make sure you're logged in
supabase login

# Link to your project
supabase link --project-ref jfhszusuahxlydjtzzut

# Try deploying again
supabase functions deploy send-reminders
```

### Cron job not running?
- Wait 15 minutes for first execution
- Check Edge Function logs
- Verify pg_cron and pg_net extensions are enabled

### Emails not sending?
- Check EmailJS secrets are set:
  ```powershell
  supabase secrets set EMAILJS_SERVICE_ID=your_value
  supabase secrets set EMAILJS_TEMPLATE_ID=your_value
  supabase secrets set EMAILJS_PUBLIC_KEY=your_value
  ```

---

## 📁 Files Reference

- `supabase/fix-cron-READY.sql` - Run this in SQL Editor
- `TEST_FUNCTION.md` - Test command
- `supabase/functions/send-reminders/index.ts` - Edge Function code
- `DEPLOYMENT_GUIDE.md` - Detailed instructions

---

## ⏱️ Total Time: ~10 minutes

Once complete, you're done! Reminders will send automatically forever! 🚀
