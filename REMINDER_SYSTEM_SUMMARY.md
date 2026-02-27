# Wedding Reminder System - Summary

## ✅ What's Working Now

### Browser-Based Auto-Reminders
When someone visits the Admin Dashboard:
1. System checks all weddings for due reminders
2. Automatically sends emails to approved guests
3. Marks reminders as sent in database
4. Shows detailed console logs of the entire process

### Features Implemented
- ✅ Custom reminder dates (1 day before, 2 days before, 1 week before, or custom)
- ✅ Day-of-event reminders
- ✅ Reset "sent" status when reminder date changes
- ✅ Only sends to approved guests
- ✅ Beautiful email templates with couple names, venue, date
- ✅ Comprehensive logging for debugging
- ✅ Manual "Send Reminders Now" button in alert banner

## ⚠️ Current Limitation

**Reminders only send when someone has the Admin Dashboard open in their browser.**

This is because the system runs in the browser (client-side JavaScript). When the browser is closed, the code doesn't run.

## 🔧 How to See It Working

1. **Open Admin Dashboard** in your browser
2. **Open Browser Console** (Press F12 → Console tab)
3. **Look for these logs:**
   - 🔔 Checking for due reminders...
   - Wedding details with `isPast: true/false`
   - 📊 Found X wedding(s) with due reminders
   - 🚀 Triggering auto-send (if reminders are due)
   - ✅ Sent to [email] (for each email sent)

4. **Set a test reminder:**
   - Click the bell icon on a wedding
   - Set custom date to 2 minutes from now
   - Click "Save Reminders"
   - Wait 2 minutes
   - Refresh the page
   - Check console - you should see auto-send logs!

## 🚀 Server-Side Solution (For True Automation)

For reminders to send even when browser is closed, you need a server-side solution.

### Option 1: Supabase Edge Functions + Cron (Recommended)
See `SUPABASE_CRON_SETUP.md` for detailed instructions.

**Pros:**
- Fully automatic
- Runs every 15 minutes
- No browser needed
- Free on Supabase

**Setup Time:** ~30 minutes

### Option 2: Keep Dashboard Open
Simple workaround: Keep the Admin Dashboard open in a browser tab 24/7.

**Pros:**
- No setup needed
- Works immediately

**Cons:**
- Requires computer to stay on
- Browser must stay open

### Option 3: External Cron Service
Use cron-job.org or similar to ping your Supabase function every 15 minutes.

**Pros:**
- Simple setup
- Reliable

**Cons:**
- Requires creating the Supabase function first

## 📝 Debugging Checklist

If reminders aren't sending:

1. **Check Console Logs**
   - Do you see "🔔 Checking for due reminders"?
   - Does it show `isPast: true` for your wedding?
   - Does it show `📊 Found X wedding(s)` with X > 0?

2. **Check Reminder Settings**
   - Is the reminder date in the past?
   - Is `reminder_sent_custom` = false in database?
   - Are there approved guests with email addresses?

3. **Check EmailJS**
   - Are credentials in `.env` file correct?
   - Is EmailJS template configured?

4. **Check Timezone**
   - Look at `customReminderLocal` vs `currentTimeLocal` in logs
   - They should both show your local timezone

## 🎯 Next Steps

**For Immediate Use:**
1. Refresh Admin Dashboard page
2. Check console logs
3. Reminders will send automatically if due

**For True Automation:**
1. Follow `SUPABASE_CRON_SETUP.md`
2. Deploy Edge Function
3. Set up cron job
4. Reminders will send every 15 minutes automatically
