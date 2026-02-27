This error means EmailJS doesn't know *which field* in your template contains the recipient's email address.

**Even if you send `to_email: "bob@example.com"`, EmailJS ignores it unless you tell it to use `{{to_email}}` for the "To" field.**

### 1-Minute Fix:
1.  Go to your [EmailJS Dashboard > Email Templates](https://dashboard.emailjs.com/admin/templates).
2.  Click on the template you created.
3.  Look for the **"To Email"** field at the top (under "Settings" tab or directly at the top of the editor).
    *   It might be blank or set to something invalid.
4.  **Change it to exactly:** `{{to_email}}`
    *   Also check the **"Reply To"** field. Change it to: `{{reply_to}}` or your own email.
5.  Click **"Save"**.

**Once you save this small change in the dashboard, the test email will work instantly.**

(I also updated the code to send `email` and `reply_to` as backups, just in case you used those names instead!)
