# 🔧 How to Get Your Supabase Credentials

## ❌ Problem
Your cron job was created with placeholder values instead of real credentials:
- `YOUR_PROJECT_REF` 
- `YOUR_ANON_KEY`

## ✅ Solution
Follow these steps to get your actual values and fix the cron job.

---

## Step 1: Get Your Project Reference ID

1. Go to https://supabase.com/dashboard
2. Click on your project (savemeaseatzambia or similar)
3. Click **Settings** (gear icon in left sidebar)
4. Click **General**
5. Scroll down to **Reference ID**
6. **Copy this value** - it looks like: `abcdefghijklmnop`

📝 **Write it down here:**
```
Project Ref: _______________________
```

---

## Step 2: Get Your Anon Key

1. Still in Supabase Dashboard
2. Click **Settings** → **API**
3. Find **Project API keys** section
4. Look for **anon** **public** key
5. Click the **Copy** button next to it
6. It's a long string starting with `eyJ...`

📝 **Write it down here:**
```
Anon Key: _______________________
```

---

## Step 3: Fix the Cron Job

1. Open `supabase/fix-cron.sql` in your editor
2. Find this section:
   ```sql
   url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
   headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
   ```

3. Replace `YOUR_PROJECT_REF` with your actual Project Ref
4. Replace `YOUR_ANON_KEY` with your actual Anon Key

**Example (with fake values):**
```sql
url:='https://abcdefghijklmnop.supabase.co/functions/v1/send-reminders',
headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example"}'::jsonb
```

4. Copy the **entire** `fix-cron.sql` file
5. Go to Supabase Dashboard → **SQL Editor**
6. Paste and click **Run**

---

## Step 4: Verify It Worked

Run this SQL to check:
```sql
SELECT 
  jobid,
  schedule,
  command,
  active,
  jobname
FROM cron.job
WHERE jobname = 'send-wedding-reminders';
```

✅ **Success:** The `command` field should now show your actual project URL and key (not placeholders)

---

## Step 5: Test the Function Manually

Test if the function works:

### Option A: Using PowerShell
```powershell
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -H "Content-Type: application/json"
```

### Option B: Using Supabase Dashboard
1. Go to **Edge Functions**
2. Click **send-reminders**
3. Click **Invoke function** button
4. Check the response

✅ **Success:** You should see JSON response with:
```json
{
  "success": true,
  "totalWeddings": X,
  "dueWeddings": X,
  "processedWeddings": X,
  "totalEmailsSent": X
}
```

---

## 🎉 All Done!

Once the cron job is fixed:
- ⏰ It will run every 15 minutes automatically
- 📧 Sends reminders to approved guests
- 🔄 Works 24/7 without browser
- 📊 View logs in Edge Functions → send-reminders → Logs

---

## 🆘 Still Having Issues?

### Can't find Project Ref?
- Make sure you're logged into the correct Supabase account
- Check you're looking at the right project

### Can't find Anon Key?
- Settings → API → Project API keys
- Look for the **anon** **public** key (not service_role)

### Cron job not running?
- Wait 15 minutes for first execution
- Check Edge Function logs for errors
- Verify URL and key are correct (no typos!)

### Need to start over?
Run this to delete and try again:
```sql
SELECT cron.unschedule('send-wedding-reminders');
```
Then follow the steps again.
