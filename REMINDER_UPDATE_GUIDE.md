# Reminder Feature Updates

I've enhanced the reminder system with "Quick Set" options and more detailed emails.

## 1. Quick Set Reminders
When setting a reminder in the Admin Dashboard, you now have buttons for:
- **1 Day Before**
- **2 Days Before**
- **1 Week Before**
- **Custom Date**

Clicking these will automatically:
1.  Calculate the correct date based on the wedding date.
2.  Pre-fill a friendly message (e.g., "Just 2 days to go!").

## 2. Enhanced Email Details
The emails sent to guests now include more details. **You must update your EmailJS Template** to use these new variables.

### Update EmailJS Template
Go to your **EmailJS Dashboard > Email Templates** and update your template to include these new fields:

- `{{venue}}` - The name of the venue (e.g., "Grand Hotel")
- `{{location}}` - The address/location string

**Example Template Body:**

```html
Hi {{to_name}},

This is a reminder for the wedding of {{wedding_name}}!

**Date:** {{event_date}}
**Venue:** {{venue}}
**Location:** {{location}}

{{message}}

View the full invitation and details here:
{{link}}

Best regards,
Save Me A Seat
```

## 3. Automation Note
Currently, the "Auto" reminders work by **checking for due reminders whenever you open the Admin Dashboard**.
- When you log in, if there are reminders set for "2 days before" (which is today), a **Red Banner** will appear.
- You simply click "Send Reminders Now" to blast the emails.

This ensures you have control and don't accidentally send emails if details have changed.
