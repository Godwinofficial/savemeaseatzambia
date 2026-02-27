# Test Your Edge Function

## Test Command (PowerShell)

Copy and paste this into PowerShell to test if your Edge Function works:

```powershell
curl -X POST https://jfhszusuahxlydjtzzut.supabase.co/functions/v1/send-reminders -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmaHN6dXN1YWh4bHlkanR6enV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTYzMDAsImV4cCI6MjA4MzE5MjMwMH0.gpEMjSa2cLpMzGC4NL79KDHnqI1SbZCmh1991KA4_iI" -H "Content-Type: application/json"
```

## Expected Response

You should see JSON like this:

```json
{
  "success": true,
  "timestamp": "2026-02-12T20:16:51.000Z",
  "totalWeddings": 2,
  "dueWeddings": 1,
  "processedWeddings": 1,
  "totalEmailsSent": 3
}
```

## What the Numbers Mean

- **totalWeddings**: Total number of weddings in your database
- **dueWeddings**: Number of weddings with reminders due now
- **processedWeddings**: Number of weddings that were processed
- **totalEmailsSent**: Total emails sent to guests

## If You Get an Error

### Error: "Function not found"
- The Edge Function hasn't been deployed yet
- Run: `supabase functions deploy send-reminders`

### Error: "Unauthorized"
- Check your anon key is correct
- Make sure you copied the entire key

### Error: "Internal Server Error"
- Check Edge Function logs in Supabase Dashboard
- Go to Edge Functions → send-reminders → Logs

## Next Step

Once the test works, run the SQL in `supabase/fix-cron-READY.sql` to set up automatic scheduling!
