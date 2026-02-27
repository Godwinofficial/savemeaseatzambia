# How to Set Up Email Reminders (Using Your Gmail)

Supabase SMTP settings are for authentication (password resets, etc.). For sending these custom reminders to guests, we need to connect your Gmail account to the reminder system using **EmailJS**. It's free and designed for this.

## Step 1: Create an EmailJS Account
1.  Go to [EmailJS.com](https://www.emailjs.com/) and sign up for a **Free** account.

## Step 2: Connect Your Gmail (The Service ID)
1.  In your EmailJS Dashboard, go to **"Email Services"** on the left.
2.  Click **"Add New Service"**.
3.  Select **"Gmail"**.
4.  Click **"Connect Account"** and log in with `contact.savemeaseatzambia@gmail.com`.
    *   *Note: Using "Google App Passwords" (like the one you provided) with generic SMTP is possible, but connecting the account directly is much easier and more reliable.*
5.  Click **"Create Service"**.
6.  Look at the `Service ID` (e.g., `service_abc123`).
7.  Copy this ID and paste it into your `.env` file for `VITE_EMAILJS_SERVICE_ID`.

## Step 3: Create an Email Template (The Template ID)
1.  Go to **"Email Templates"** on the left.
2.  Click **"Create New Template"**.
3.  Design your email. You can use these variables:
    *   `{{to_name}}` - Guest Name
    *   `{{wedding_name}}` - Couple Name
    *   `{{event_date}}` - Wedding Date
    *   `{{venue}}` - Venue Name
    *   `{{location}}` - Venue Address
    *   `{{message}}` - The reminder message
    *   `{{link}}` - Link to the wedding website
4.  Click **"Save"**.
5.  Look at the `Template ID` (e.g., `template_xyz789`).
6.  Copy this ID and paste it into your `.env` file for `VITE_EMAILJS_TEMPLATE_ID`.

## Step 4: Get Your Public Key
1.  Click on your name in the top right corner -> **"Account"**.
2.  Go to the **"General"** (or "API Keys") tab.
3.  Look for **"Public Key"** (a long random string).
4.  Copy this key and paste it into your `.env` file for `VITE_EMAILJS_PUBLIC_KEY`.

## Step 5: Restart the App
1.  In your terminal, stop the app (press `Ctrl + C`).
2.  Run `npm run dev` again to load the new settings.
3.  Go to the Admin Dashboard and try sending a test email again!
