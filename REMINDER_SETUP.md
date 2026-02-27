# Reminder Feature Setup Guide

I've implemented the functionality to send email reminders to guests. This includes:
1.  **Database Updates**: New columns to store reminder settings.
2.  **Admin UI**: A modal to configure "Day of Event" and "Custom Date" reminders.
3.  **Sending Logic**: A batch processor in the Admin Dashboard to check and send due emails.

## Step 1: Update Database Schema

You need to add the new columns to your Supabase `weddings` table.

1.  Go to your Supabase Dashboard.
2.  Open the **SQL Editor**.
3.  Open the file `SUPABASE_REMINDERS.sql` from your project folder (I created this for you).
4.  Copy the content and paste it into the Supabase SQL Editor.
5.  Click **Run**.

## Step 2: Configure EmailJS

The feature uses **EmailJS** to send emails from the browser. You need to set this up:

1.  Create an account at [EmailJS.com](https://www.emailjs.com/).
2.  **Add a Service**: Connect your email provider (e.g., Gmail) and get your `Service ID` (e.g., `service_xyz`).
3.  **Create a Template**:
    *   Go to "Email Templates" and create a new one.
    *   Use these variables in your template:
        *   `{{to_name}}` - Guest Name
        *   `{{wedding_name}}` - Couple Name
        *   `{{event_date}}` - Wedding Date
        *   `{{message}}` - The custom message or default reminder text
        *   `{{link}}` - Link to the wedding website
    *   Get your `Template ID` (e.g., `template_xyz`).
4.  **Get Public Key**: Go to "Account" > "General" (or "API Keys") and copy your **Public Key**.

## Step 3: Set Environment Variables

Add your EmailJS credentials to your `.env` file so the app can use them.

Open `.env` and add:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

Restart your development server (`Ctrl+C`, then `npm run dev`) to load the new variables.

## How to Use

1.  Go to the **Admin Dashboard**.
2.  Click the **Bell Icon** on a wedding card to configure reminders.
3.  Enable "Day of Event" reminder or set a "Custom Date".
4.  If a reminder is due (e.g., it's the day of the event, or the custom time has passed), a **Red Banner** will appear at the top of the dashboard.
5.  Click **"Send Reminders Now"** to email all guests for that wedding.

> **Note**: This system requires you to visit the Admin Dashboard to trigger the emails. For fully automated background sending, you would need to set up a scheduled job (cron) using a backend service.
