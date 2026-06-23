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

    const fetchAllRSVPs = async (columns = 'email, name') => {
        let allData = [];
        let start = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('rsvps')
                .select(columns)
                .not('email', 'is', null)
                .range(start, start + limit - 1);

            if (error) throw error;

            allData = [...allData, ...data];

            if (data.length < limit) {
                hasMore = false;
            } else {
                start += limit;
            }
        }
        return allData;
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Get all unique users from RSVPs recursively using pagination
            const rsvps = await fetchAllRSVPs('email');

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

            // Fetch all unique emails recursively using pagination
            const rsvps = await fetchAllRSVPs('email, name');

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

            <style>{`
                .email-marketing-container {
                    max-width: 100%;
                    margin: 0;
                    padding: 0;
                }

                .email-marketing-header {
                    text-align: center;
                    margin-bottom: 1.5rem;
                }

                .email-marketing-header h2 {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #12121c;
                    margin-bottom: 0.25rem;
                }

                .email-marketing-header p {
                    color: #6b7280;
                    font-size: 0.78rem;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 12px;
                    margin-bottom: 1.5rem;
                }

                .stat-card {
                    background: #12121c;
                    border-radius: 14px;
                    padding: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: white;
                    border: 1px solid rgba(197, 160, 89, 0.25);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }

                .stat-icon {
                    font-size: 1.75rem;
                    color: #c5a059;
                }

                .stat-content {
                    flex: 1;
                }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #fff;
                    line-height: 1.1;
                }

                .stat-label {
                    font-size: 0.7rem;
                    color: #9ca3af;
                    font-weight: 500;
                    margin-top: 2px;
                }

                .section {
                    background: white;
                    border-radius: 16px;
                    padding: 1.25rem;
                    margin-bottom: 1rem;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                }

                .section h3 {
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: #12121c;
                    margin-bottom: 0.85rem;
                }

                .template-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                    gap: 8px;
                }

                .template-btn {
                    padding: 10px 14px;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 10px;
                    background: white;
                    color: #374151;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.78rem;
                    font-weight: 700;
                }

                .template-btn:hover {
                    border-color: #c5a059;
                    background: #fcfbfa;
                    color: #c5a059;
                }

                .template-btn.active {
                    border-color: #c5a059;
                    background: #c5a059;
                    color: white;
                }

                .form-group {
                    margin-bottom: 1.25rem;
                }

                .form-group label {
                    display: block;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #374151;
                    margin-bottom: 0.35rem;
                }

                .input-field {
                    width: 100%;
                    padding: 0.65rem 0.85rem;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    background: #f9fafb;
                    color: #111827;
                    transition: all 0.2s;
                    outline: none;
                }

                .input-field:focus {
                    outline: none;
                    border-color: #c5a059;
                    background: #ffffff;
                }

                .textarea-field {
                    width: 100%;
                    padding: 0.65rem 0.85rem;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-family: inherit;
                    resize: vertical;
                    background: #f9fafb;
                    color: #111827;
                    transition: all 0.2s;
                    outline: none;
                }

                .textarea-field:focus {
                    outline: none;
                    border-color: #c5a059;
                    background: #ffffff;
                }

                .helper-text {
                    margin-top: 6px;
                    font-size: 0.72rem;
                    color: #6b7280;
                }

                .test-section {
                    background: rgba(197, 160, 89, 0.05);
                    border: 1.5px solid rgba(197, 160, 89, 0.3);
                }

                .test-section p {
                    color: #5c471c;
                    margin-bottom: 0.85rem;
                    font-size: 0.75rem;
                    line-height: 1.4;
                }

                .test-email-row {
                    display: flex;
                    gap: 8px;
                }

                .test-email-row .input-field {
                    flex: 1;
                }

                .btn-test {
                    padding: 10px 18px;
                    background: #12121c;
                    color: #fff;
                    border: none;
                    border-radius: 10px;
                    font-weight: 700;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .btn-test:hover:not(:disabled) {
                    background: #c5a059;
                }

                .btn-test:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .send-section {
                    text-align: center;
                    background: rgba(163, 230, 53, 0.05);
                    border: 1.5px solid rgba(163, 230, 53, 0.3);
                }

                .btn-send-bulk {
                    width: 100%;
                    padding: 12px 24px;
                    background: #c5a059;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.95rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 10px;
                }

                .btn-send-bulk:hover:not(:disabled) {
                    background: #b28e46;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(197, 160, 89, 0.2);
                }

                .btn-send-bulk:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .warning-text {
                    color: #6b7280;
                    font-size: 0.72rem;
                    margin: 0;
                }

                .file-upload-container {
                    margin-top: 8px;
                }

                .file-upload-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    background: #fff;
                    border: 1.5px dashed #d1d5db;
                    border-radius: 10px;
                    color: #4b5563;
                    font-weight: 600;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    width: 100%;
                    justify-content: center;
                }

                .file-upload-label:hover {
                    border-color: #c5a059;
                    color: #c5a059;
                    background: #fcfbfa;
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
                    gap: 10px;
                    margin-top: 12px;
                }

                .attachment-item {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    border: 1px solid #e5e7eb;
                }

                .attachment-thumb img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .remove-attachment {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: rgba(0,0,0,0.6);
                    border: none;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 10px;
                }

                .remove-attachment:hover {
                    background: #ef4444;
                    color: white;
                }
            `}</style>
        </div>
    );
}
