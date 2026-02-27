import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { sendEmail } from '../utils/emailService';

export default function EmailMarketing() {
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [stats, setStats] = useState({ totalUsers: 0, usersWithEmail: 0 });

    // Email content
    const [subject, setSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [testEmail, setTestEmail] = useState('');
    const [attachedImages, setAttachedImages] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Progress tracking
    const [progress, setProgress] = useState({ sent: 0, total: 0, failed: 0 });
    const [sentEmails, setSentEmails] = useState(new Set()); // Track successfully sent emails
    const [isPaused, setIsPaused] = useState(false);

    // Template selection
    const [selectedTemplate, setSelectedTemplate] = useState('');

    // Email templates
    const templates = {
        welcome: {
            name: 'Welcome New Users',
            subject: 'Welcome to Save Me A Seat Zambia! 🎉',
            body: `Hello there!

We're thrilled to have you join Save Me A Seat Zambia - your premier wedding RSVP and guest management platform.

With Save Me A Seat, you can:
✅ Create beautiful digital wedding invitations
✅ Manage RSVPs effortlessly
✅ Send automatic reminders to guests
✅ Track attendance in real-time

Ready to get started? Create your first wedding event today!

Best regards,
The Save Me A Seat Team

P.S. Need help? Reply to this email and we'll be happy to assist!`
        },
        promotion: {
            name: 'Special Promotion',
            subject: '🎊 Special Offer: Premium Features Now Available!',
            body: `Dear Valued User,

We're excited to announce new premium features on Save Me A Seat Zambia!

🌟 What's New:
• Custom email templates for your invitations
• Advanced analytics and reporting
• Priority customer support
• Unlimited guest capacity

🎁 Limited Time Offer:
Get 20% off premium features when you upgrade this month!

Click here to learn more: [Your Link]

Thank you for being part of our community!

Warm regards,
Save Me A Seat Team`
        },
        update: {
            name: 'Platform Update',
            subject: '📢 New Features & Improvements',
            body: `Hello!

We've been working hard to improve Save Me A Seat Zambia, and we're excited to share what's new:

✨ Recent Updates:
• Improved mobile experience
• Faster RSVP processing
• Enhanced email notifications
• Better guest management tools

We're constantly improving based on your feedback. Have suggestions? We'd love to hear from you!

Keep planning amazing events!

The Save Me A Seat Team`
        },
        reminder: {
            name: 'Platform Reminder',
            subject: '⏰ Don\'t Forget: Complete Your Wedding Setup',
            body: `Hi there!

We noticed you started creating a wedding event but haven't finished setting it up yet.

Complete your setup to:
📧 Send invitations to your guests
📊 Track RSVPs in real-time
🔔 Set up automatic reminders
🎨 Customize your wedding page

It only takes a few minutes!

Need help? We're here for you.

Best wishes,
Save Me A Seat Team`
        },
        custom: {
            name: 'Custom Email',
            subject: '',
            body: ''
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `email-attachments/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('wedding-uploads')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('wedding-uploads')
                    .getPublicUrl(filePath);

                return data.publicUrl;
            });

            const newImageUrls = await Promise.all(uploadPromises);
            setAttachedImages(prev => [...prev, ...newImageUrls]);
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Failed to upload images: ' + error.message);
        } finally {
            setUploading(false);
            // Clear input value to allow selecting same file again if needed
            e.target.value = '';
        }
    };

    const removeImage = (index) => {
        setAttachedImages(prev => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Get all unique users from RSVPs
            const { data: rsvps, error } = await supabase
                .from('rsvps')
                .select('email')
                .not('email', 'is', null);

            if (error) throw error;

            // Get unique emails
            const uniqueEmails = [...new Set(rsvps.map(r => r.email))];

            setStats({
                totalUsers: rsvps.length,
                usersWithEmail: uniqueEmails.length
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateSelect = (templateKey) => {
        setSelectedTemplate(templateKey);
        const template = templates[templateKey];
        setSubject(template.subject);
        setEmailBody(template.body);
    };

    const sendTestEmail = async () => {
        if (!testEmail) {
            alert('Please enter a test email address');
            return;
        }

        if (!subject || !emailBody) {
            alert('Please enter both subject and email content');
            return;
        }

        setSending(true);
        try {
            const emails = testEmail.split(',').map(e => e.trim()).filter(e => e);
            let successCount = 0;
            let failCount = 0;

            for (const email of emails) {
                try {
                    const templateParams = {
                        to_name: 'Test User',
                        wedding_name: 'Save Me A Seat Zambia',
                        event_date: new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }),
                        venue: 'Marketing Email',
                        location: '',
                        message: emailBody, // Will be converted to <br> in utility
                        link: 'https://www.savemeaseatzambia.com',
                        title: subject,
                        subtitle: 'Marketing Email',
                        action_text: 'Visit Website',
                        image_urls: attachedImages,
                    };

                    await sendEmail({
                        to: email,
                        subject: subject,
                        templateParams: templateParams
                    });
                    successCount++;
                    console.log(`✅ Test email sent to ${email}`);
                } catch (err) {
                    failCount++;
                    console.error(`❌ Failed to send test to ${email}:`, err);
                }
            }

            if (successCount > 0) {
                alert(`✅ Sent ${successCount} test email(s)${failCount > 0 ? `, but ${failCount} failed.` : ' successfully!'}`);
            } else {
                alert(`❌ Failed to send test emails. Check console for details.`);
            }

        } catch (error) {
            console.error('Error sending test email:', error);
            alert('❌ Failed to send test email: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    const sendBulkEmail = async () => {
        if (!subject || !emailBody) {
            alert('Please enter both subject and email content');
            return;
        }

        // Fetch users first to determine count (or use cached stats if robust enough, but safer to fetch)
        // We'll fetch inside the try block to be safe, but we need a confirmation dialog first.
        // Let's rely on stats.usersWithEmail for the initial confirm if we haven't started.

        // If we are "resuming" or "retrying", the logic is slightly different.
        const isRetrying = sentEmails.size > 0;
        const totalEstimated = stats.usersWithEmail;
        const remainingEstimated = totalEstimated - sentEmails.size;

        const confirmMessage = isRetrying
            ? `Resume sending? \n\nAlready sent: ${sentEmails.size}\nRemaining approx: ${remainingEstimated}\n\nContinue?`
            : `Are you sure you want to send this email to ${stats.usersWithEmail} users?\n\nSubject: ${subject}\n\nThis might take a moment. Please do not close this window.`;

        if (!window.confirm(confirmMessage)) return;

        setSending(true);
        setIsPaused(false);

        try {
            console.log("Starting bulk email process...");

            // Fetch all unique emails
            const { data: rsvps, error } = await supabase
                .from('rsvps')
                .select('email, name')
                .not('email', 'is', null);

            if (error) {
                console.error("Supabase fetch error:", error);
                throw error;
            }

            if (!rsvps || rsvps.length === 0) {
                alert("No users found to email.");
                setSending(false);
                return;
            }

            // Get unique emails with names
            const uniqueUsers = rsvps.reduce((acc, rsvp) => {
                if (!acc.find(u => u.email === rsvp.email)) {
                    acc.push({ email: rsvp.email, name: rsvp.name });
                }
                return acc;
            }, []);

            // Filter out already sent emails
            const usersToProcess = uniqueUsers.filter(u => !sentEmails.has(u.email));

            if (usersToProcess.length === 0) {
                alert("All users have already received this email.");
                setSending(false);
                return;
            }

            console.log(`Found ${uniqueUsers.length} total, processing ${usersToProcess.length} remaining.`);

            // Initialize progress
            setProgress({
                sent: sentEmails.size,
                total: uniqueUsers.length,
                failed: 0
            });

            // BATCH PROCESSING CONFIGURATION
            const BATCH_SIZE = 2; // Reduced to 2 emails per batch
            const DELAY_BETWEEN_BATCHES = 2000; // Increased to 2 seconds delay

            let currentBatchSuccess = 0;
            let currentBatchFail = 0;

            // Process users in batches
            for (let i = 0; i < usersToProcess.length; i += BATCH_SIZE) {
                // Check if user paused/stopped (optional implementation, but good for safety)
                // For now, we assume once started it runs until done or error.

                const batch = usersToProcess.slice(i, i + BATCH_SIZE);
                console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(usersToProcess.length / BATCH_SIZE)}...`);

                // Create array of promises for this batch
                const emailPromises = batch.map(async (user) => {
                    try {
                        const templateParams = {
                            to_name: user.name || 'Valued User',
                            wedding_name: 'Save Me A Seat Zambia',
                            event_date: new Date().toLocaleDateString('en-US', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            }),
                            venue: 'Marketing Email',
                            location: '',
                            message: emailBody,
                            link: 'https://www.savemeaseatzambia.com',
                            title: subject,
                            subtitle: 'Marketing Email',
                            action_text: 'Visit Website',
                            image_urls: attachedImages,
                        };

                        await sendEmail({
                            to: user.email,
                            subject: subject,
                            templateParams: templateParams
                        });

                        // Mark as sent
                        return { success: true, email: user.email };
                    } catch (error) {
                        console.error(`❌ Failed to send to ${user.email}:`, error);
                        return { success: false, email: user.email };
                    }
                });

                // Wait for all emails in this batch to complete
                const results = await Promise.all(emailPromises);

                // Update state based on results
                results.forEach(res => {
                    if (res.success) {
                        setSentEmails(prev => new Set(prev).add(res.email));
                        currentBatchSuccess++;
                    } else {
                        currentBatchFail++;
                    }
                });

                // Update Progress Display
                setProgress(prev => ({
                    ...prev,
                    sent: prev.sent + results.filter(r => r.success).length,
                    failed: prev.failed + results.filter(r => !r.success).length
                }));

                // Small delay between batches to avoid overwhelming the server/provider
                if (i + BATCH_SIZE < usersToProcess.length) {
                    await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
                }
            }

            alert(
                `📧 Email Campaign Complete!\n\n` +
                `✅ Successfully sent this run: ${currentBatchSuccess}\n` +
                `❌ Failed this run: ${currentBatchFail}\n` +
                `🏆 Total Sent (Cumulative): ${sentEmails.size + currentBatchSuccess} / ${uniqueUsers.length}`
            );
        } catch (error) {
            console.error('Error sending bulk emails:', error);
            alert('❌ Failed to send emails: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="email-marketing-container">
            <div className="email-marketing-header">
                <h2>📧 Email Marketing</h2>
                <p>Send promotional emails to all your users</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <div className="stat-value">{loading ? '...' : stats.totalUsers}</div>
                        <div className="stat-label">Total Users</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📧</div>
                    <div className="stat-content">
                        <div className="stat-value">{loading ? '...' : stats.usersWithEmail}</div>
                        <div className="stat-label">Users with Email</div>
                    </div>
                </div>
            </div>

            {/* Template Selection */}
            <div className="section">
                <h3>📋 Email Templates</h3>
                <div className="template-grid">
                    {Object.entries(templates).map(([key, template]) => (
                        <button
                            key={key}
                            className={`template-btn ${selectedTemplate === key ? 'active' : ''}`}
                            onClick={() => handleTemplateSelect(key)}
                        >
                            {template.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Email Composer */}
            <div className="section">
                <h3>✍️ Compose Email</h3>

                <div className="form-group">
                    <label>Subject Line</label>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Enter email subject..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>Email Content</label>
                    <textarea
                        className="textarea-field"
                        rows="15"
                        placeholder="Enter your email message..."
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                    />
                    <div className="helper-text">
                        Tip: Keep it personal, clear, and include a call-to-action!
                    </div>
                </div>

                <div className="form-group">
                    <label>Attachments (Images)</label>
                    <div className="file-upload-container">
                        <label htmlFor="file-upload" className={`file-upload-label ${uploading ? 'disabled' : ''}`}>
                            <i className="fas fa-cloud-upload-alt"></i>
                            {uploading ? 'Uploading...' : 'Click to Upload Images'}
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            className="file-input-hidden"
                        />
                    </div>

                    {attachedImages.length > 0 && (
                        <div className="attachments-preview">
                            {attachedImages.map((url, index) => (
                                <div key={index} className="attachment-item">
                                    <div className="attachment-thumb">
                                        <img src={url} alt={`Attachment ${index + 1}`} />
                                    </div>
                                    <button
                                        className="remove-attachment"
                                        onClick={() => removeImage(index)}
                                        title="Remove image"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Test Email */}
            <div className="section test-section">
                <h3>🧪 Test Email</h3>
                <p>Send a test email to yourself before sending to all users</p>

                <div className="test-email-row">
                    <input
                        type="email"
                        className="input-field"
                        placeholder="your.email@example.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                    />
                    <button
                        className="btn-test"
                        onClick={sendTestEmail}
                        disabled={sending || !subject || !emailBody}
                    >
                        {sending ? 'Sending...' : '📤 Send Test'}
                    </button>
                </div>
            </div>

            {/* Send Bulk */}
            <div className="section send-section">
                <button
                    className="btn-send-bulk"
                    onClick={sendBulkEmail}
                    disabled={sending || !subject || !emailBody}
                >
                    {sending
                        ? `📤 Sending... ${progress.sent} / ${progress.total}`
                        : (sentEmails.size > 0 && sentEmails.size < progress.total)
                            ? `🔄 Retry / Resume (${progress.total - sentEmails.size} remaining)`
                            : `📧 Send to ${stats.usersWithEmail} Users`
                    }
                </button>
                <p className="warning-text">
                    ⚠️ This will send the email to all users with email addresses. Make sure to test first!
                </p>
            </div>

            <style jsx>{`
                .email-marketing-container {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .email-marketing-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .email-marketing-header h2 {
                    font-size: 32px;
                    color: #1f2937;
                    margin-bottom: 10px;
                }

                .email-marketing-header p {
                    color: #6b7280;
                    font-size: 16px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .stat-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    color: white;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .stat-icon {
                    font-size: 40px;
                }

                .stat-content {
                    flex: 1;
                }

                .stat-value {
                    font-size: 32px;
                    font-weight: bold;
                }

                .stat-label {
                    font-size: 14px;
                    opacity: 0.9;
                }

                .section {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }

                .section h3 {
                    font-size: 20px;
                    color: #1f2937;
                    margin-bottom: 15px;
                }

                .template-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 10px;
                }

                .template-btn {
                    padding: 12px 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    background: white;
                    color: #374151;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                    font-weight: 500;
                }

                .template-btn:hover {
                    border-color: #10b981;
                    background: #f0fdf4;
                }

                .template-btn.active {
                    border-color: #10b981;
                    background: #10b981;
                    color: white;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 8px;
                }

                .input-field {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.2s;
                }

                .input-field:focus {
                    outline: none;
                    border-color: #10b981;
                }

                .textarea-field {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 16px;
                    font-family: inherit;
                    resize: vertical;
                    transition: border-color 0.2s;
                }

                .textarea-field:focus {
                    outline: none;
                    border-color: #10b981;
                }

                .helper-text {
                    margin-top: 8px;
                    font-size: 14px;
                    color: #6b7280;
                }

                .test-section {
                    background: #fffbeb;
                    border: 2px solid #fbbf24;
                }

                .test-section p {
                    color: #92400e;
                    margin-bottom: 15px;
                }

                .test-email-row {
                    display: flex;
                    gap: 10px;
                }

                .test-email-row .input-field {
                    flex: 1;
                }

                .btn-test {
                    padding: 12px 24px;
                    background: #fbbf24;
                    color: #78350f;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .btn-test:hover:not(:disabled) {
                    background: #f59e0b;
                    transform: translateY(-1px);
                }

                .btn-test:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .send-section {
                    text-align: center;
                    background: #f0fdf4;
                    border: 2px solid #10b981;
                }

                .btn-send-bulk {
                    width: 100%;
                    padding: 16px 32px;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 18px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 15px;
                }

                .btn-send-bulk:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
                }

                .btn-send-bulk:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .warning-text {
                    color: #065f46;
                    font-size: 14px;
                    margin: 0;
                }

                .file-upload-container {
                    margin-top: 10px;
                }

                .file-upload-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 20px;
                    background: #f3f4f6;
                    border: 2px dashed #d1d5db;
                    border-radius: 8px;
                    color: #4b5563;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    width: 100%;
                    justify-content: center;
                }

                .file-upload-label:hover {
                    background: #e5e7eb;
                    border-color: #9ca3af;
                    color: #1f2937;
                }

                .file-upload-label.disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .file-input-hidden {
                    display: none;
                }

                .attachments-preview {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    margin-top: 15px;
                }

                .attachment-item {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    border: 1px solid #e5e7eb;
                }

                .attachment-thumb img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .remove-attachment {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: rgba(255, 255, 255, 0.9);
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ef4444;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 12px;
                }

                .remove-attachment:hover {
                    background: #ef4444;
                    color: white;
                }
            `}</style>
        </div>
    );
}
