import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Use hardcoded credentials as requested
    const gmailUser = 'contact.savemeaseatzambia@gmail.com';
    const gmailPass = 'gzcg rpjb xqnn ffec';

    /*
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;
    */

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: gmailUser,
                pass: gmailPass,
            },
        });

        const info = await transporter.sendMail({
            from: `"Save Me A Seat Zambia" <${gmailUser}>`,
            to: to,
            replyTo: gmailUser,
            subject: subject,
            html: html,
        });

        console.log("Message sent: %s", info.messageId);
        return res.status(200).json({ success: true, messageId: info.messageId });

    } catch (error) {
        console.error("Nodemailer Error Details:", error);
        // Return a detailed error message, checking for common properties like 'response'
        const errorMessage = error.response || error.message || 'Unknown error occurred';
        return res.status(500).json({ success: false, message: 'Failed to send email', error: errorMessage });
    }
}
