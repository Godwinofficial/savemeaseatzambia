# Server-Side Automatic Reminder Setup

## Problem
Currently, reminders only send when someone has the Admin Dashboard open in their browser. For truly automatic reminders, we need a server-side solution.

## Solution: Supabase Edge Functions + pg_cron

### Option 1: Supabase Edge Functions (Recommended)

1. **Create a Supabase Edge Function** that checks for due reminders and sends emails
2. **Schedule it with Supabase's built-in cron** to run every hour (or every 15 minutes)

#### Steps:

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Initialize Supabase in your project:
```bash
supabase init
```

3. Create an Edge Function:
```bash
supabase functions new send-reminders
```

4. Edit `supabase/functions/send-reminders/index.ts`:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)

    // Fetch weddings with due reminders
    const { data: weddings, error } = await supabaseClient
      .from('weddings')
      .select('*')
      .or(`and(reminder_day_of_event_enabled.eq.true,reminder_sent_day_of.eq.false,date.eq.${todayStr}),and(reminder_custom_date.lte.${now.toISOString()},reminder_sent_custom.eq.false)`)

    if (error) throw error

    console.log(`Found ${weddings?.length || 0} weddings with due reminders`)

    for (const wedding of weddings || []) {
      // Fetch approved guests
      const { data: guests } = await supabaseClient
        .from('rsvps')
        .select('email, name')
        .eq('wedding_id', wedding.id)
        .eq('status', 'approved')
        .not('email', 'is', null)

      // Send emails via EmailJS
      for (const guest of guests || []) {
        const emailData = {
          service_id: Deno.env.get('EMAILJS_SERVICE_ID'),
          template_id: Deno.env.get('EMAILJS_TEMPLATE_ID'),
          user_id: Deno.env.get('EMAILJS_PUBLIC_KEY'),
          template_params: {
            to_email: guest.email,
            email: guest.email,
            to_name: guest.name,
            wedding_name: `${wedding.groom_name} & ${wedding.bride_name}`,
            // ... all other template params
          }
        }

        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData)
        })

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 500))
      }

      // Update sent flags
      const updates: any = {}
      if (wedding.reminder_day_of_event_enabled && !wedding.reminder_sent_day_of) {
        updates.reminder_sent_day_of = true
      }
      if (wedding.reminder_custom_date && !wedding.reminder_sent_custom) {
        updates.reminder_sent_custom = true
      }

      if (Object.keys(updates).length > 0) {
        await supabaseClient
          .from('weddings')
          .update(updates)
          .eq('id', wedding.id)
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: weddings?.length || 0 }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

5. Deploy the function:
```bash
supabase functions deploy send-reminders
```

6. Set environment variables in Supabase Dashboard:
   - Go to Project Settings → Edge Functions
   - Add secrets:
     - `EMAILJS_SERVICE_ID`
     - `EMAILJS_TEMPLATE_ID`
     - `EMAILJS_PUBLIC_KEY`

7. **Schedule with pg_cron** (in Supabase SQL Editor):
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every 15 minutes
SELECT cron.schedule(
  'send-wedding-reminders',
  '*/15 * * * *',  -- Every 15 minutes
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) as request_id;
  $$
);
```

### Option 2: External Cron Service (Easier, No Coding)

Use a service like **Cron-job.org** or **EasyCron** to call a webhook every 15 minutes:

1. Create a simple API endpoint (or use the Edge Function above)
2. Set up a cron job to call it: `https://your-project.supabase.co/functions/v1/send-reminders`
3. The service will trigger it automatically

### Option 3: Vercel Cron Jobs (If using Vercel)

If you deploy to Vercel, you can use their cron jobs feature for free.

## Current Workaround

For now, the reminders will send when:
1. Someone visits the Admin Dashboard
2. The page detects due reminders
3. Auto-sends them immediately

This works but requires someone to have the dashboard open.
