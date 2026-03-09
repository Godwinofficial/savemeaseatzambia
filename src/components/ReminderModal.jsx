import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { sendEmail } from '../utils/emailService';

const ReminderModal = ({ wedding, onClose, onSave }) => {
    const [dayOfEventEnabled, setDayOfEventEnabled] = useState(wedding.reminder_day_of_event_enabled || false);
    const [customDate, setCustomDate] = useState(wedding.reminder_custom_date ? new Date(wedding.reminder_custom_date).toISOString().slice(0, 16) : '');
    const [sending, setSending] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [presetOption, setPresetOption] = useState('custom'); // '1day', '2days', '1week', 'custom'

    const handlePresetChange = (option) => {
        setPresetOption(option);
        if (option === 'custom') return;

        const eventDate = new Date(wedding.date);
        let remindDate = new Date(eventDate);
        let defaultMsg = "";

        if (option === '1day') {
            remindDate.setDate(eventDate.getDate() - 1);
            defaultMsg = `Tomorrow is the big day! We can't wait to celebrate with you at ${wedding.venue_name || 'our wedding'}. See you there!`;
        } else if (option === '2days') {
            remindDate.setDate(eventDate.getDate() - 2);
            defaultMsg = `Just 2 days to go! We are so excited to see you at ${wedding.venue_name || 'our wedding'}. Getting everything ready!`;
        } else if (option === '1week') {
            remindDate.setDate(eventDate.getDate() - 7);
            defaultMsg = `Only one week left until our special day! We're looking forward to celebrating with you.`;
        }

        // Set time to 9:00 AM by default
        remindDate.setHours(9, 0, 0, 0);

        // Adjust for timezone offset to keep local time consistent in ISO string input
        const timezoneOffset = remindDate.getTimezoneOffset() * 60000;
        const localISOTime = new Date(remindDate.getTime() - timezoneOffset).toISOString().slice(0, 16);

        setCustomDate(localISOTime);
    };

    const handleSave = async () => {
        try {
            // Check if custom date has changed
            const oldCustomDate = wedding.reminder_custom_date
                ? new Date(wedding.reminder_custom_date).toISOString().slice(0, 16)
                : null;
            const newCustomDate = customDate || null;
            const customDateChanged = oldCustomDate !== newCustomDate;

            const updates = {
                reminder_day_of_event_enabled: dayOfEventEnabled,
                reminder_custom_date: customDate ? new Date(customDate).toISOString() : null
            };

            // Reset "sent" flag if date changed
            if (customDateChanged && newCustomDate) {
                updates.reminder_sent_custom = false;
            }

            const { error } = await supabase
                .from('weddings')
                .update(updates)
                .eq('id', wedding.id);

            if (error) throw error;
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving reminders:', error);
            alert('Failed to save reminder settings.');
        }
    };

    const sendTestEmail = async () => {
        if (!testEmail) {
            alert('Please enter an email address for testing.');
            return;
        }

        setSending(true);
        try {
            const isBirthday = !!wedding.child_name;
            const weddingName = isBirthday
                ? `${wedding.child_name}'s Birthday`
                : `${wedding.groom_name} & ${wedding.bride_name}`;

            const templateParams = {
                to_name: 'Test Guest',
                wedding_name: weddingName,
                event_type: isBirthday ? 'birthday' : 'wedding',
                event_date: (() => {
                    if (!wedding.date) return 'TBA';
                    const date = new Date(wedding.date);
                    if (wedding.ceremony_time) {
                        const [hours, minutes] = wedding.ceremony_time.split(':');
                        date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                    }
                    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                })(),
                message: `This is a friendly reminder that the celebration of ${weddingName} is coming up! We're so excited to celebrate with you. Please be ready and we can't wait to see you there!`,
                venue: wedding.venue_name || 'TBA',
                location: wedding.location || wedding.venue_address || '',
                link: `${window.location.origin}/${isBirthday ? 'b' : 'w'}/${wedding.slug}`,
                title: `${weddingName} Celebration`,
                subtitle: "Event Reminder",
                action_text: "View Invitation & Details",
            };

            await sendEmail({
                to: testEmail.trim(),
                subject: `Reminder: ${weddingName}`,
                templateParams: templateParams
            });

            alert(`Test email sent successfully to ${testEmail}!`);
        } catch (error) {
            console.error('Error sending test email:', error);
            alert(`Failed to send test email: ${error.message || error.text}`);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Reminders for {wedding.groom_name} & {wedding.bride_name}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={dayOfEventEnabled}
                                onChange={(e) => setDayOfEventEnabled(e.target.checked)}
                            />
                            Enable Day-of-Event Reminder
                        </label>
                        <p className="help-text">Sends a reminder on the morning of {new Date(wedding.date).toLocaleDateString()}</p>
                        {wedding.reminder_sent_day_of && <span className="status-sent">Sent!</span>}
                    </div>

                    <div className="form-group">
                        <label>Custom Reminder Timing</label>
                        <div className="preset-buttons">
                            <button
                                className={`preset-btn ${presetOption === '1day' ? 'active' : ''}`}
                                onClick={() => handlePresetChange('1day')}
                            >
                                1 Day Before
                            </button>
                            <button
                                className={`preset-btn ${presetOption === '2days' ? 'active' : ''}`}
                                onClick={() => handlePresetChange('2days')}
                            >
                                2 Days Before
                            </button>
                            <button
                                className={`preset-btn ${presetOption === '1week' ? 'active' : ''}`}
                                onClick={() => handlePresetChange('1week')}
                            >
                                1 Week Before
                            </button>
                            <button
                                className={`preset-btn ${presetOption === 'custom' ? 'active' : ''}`}
                                onClick={() => setPresetOption('custom')}
                            >
                                Custom Date
                            </button>
                        </div>

                        <input
                            type="datetime-local"
                            value={customDate}
                            onChange={(e) => {
                                setCustomDate(e.target.value);
                                setPresetOption('custom');
                            }}
                            className="form-input"
                            style={{ marginTop: '0.5rem' }}
                        />
                        {wedding.reminder_sent_custom && <span className="status-sent">Sent!</span>}
                    </div>

                    <div className="test-email-section">
                        <h4>Test Reminder</h4>
                        <div className="test-email-inputs">
                            <input
                                type="email"
                                placeholder="Enter email for test"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                className="form-input"
                            />
                            <button
                                className="action-btn secondary"
                                onClick={sendTestEmail}
                                disabled={sending}
                            >
                                {sending ? 'Sending...' : 'Send Test'}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="action-btn cancel" onClick={onClose}>Cancel</button>
                    <button className="action-btn primary" onClick={handleSave}>Save Settings</button>
                </div>
            </div>
            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    backdrop-filter: blur(4px);
                }
                .modal-content {
                    background: white;
                    border-radius: 1rem;
                    width: 90%;
                    max-width: 500px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    overflow: hidden;
                    animation: slideUp 0.3s ease-out;
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f9fafb;
                }
                .modal-header h3 {
                    margin: 0;
                    font-size: 1.125rem;
                    color: #1f2937;
                }
                .close-btn {
                    background: #f3f4f6;
                    border: 1px solid #e5e7eb;
                    font-size: 1.25rem;
                    color: #374151;
                    cursor: pointer;
                    transition: all 0.2s;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 0.5rem;
                    line-height: 1;
                    flex-shrink: 0;
                }
                .close-btn:hover {
                    color: #ffffff;
                    background: #ef4444;
                    border-color: #ef4444;
                    transform: scale(1.05);
                }
                .modal-body {
                    padding: 1.5rem;
                }
                .form-group {
                    margin-bottom: 1.5rem;
                }
                .form-group label {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    color: #374151;
                }
                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }
                .help-text {
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin-top: 0.25rem;
                    margin-left: 1.7rem;
                }
                .form-input, .form-textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.5rem;
                    font-size: 0.95rem;
                    transition: border-color 0.2s;
                }
                .form-input:focus, .form-textarea:focus {
                    outline: none;
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }
                .test-email-section {
                    background: #f3f4f6;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    margin-top: 1rem;
                }
                .test-email-section h4 {
                    margin-top: 0;
                    margin-bottom: 0.75rem;
                    font-size: 0.9rem;
                    color: #4b5563;
                }
                .test-email-inputs {
                    display: flex;
                    gap: 0.75rem;
                }
                .status-sent {
                    display: inline-block;
                    margin-left: 0.5rem;
                    padding: 0.125rem 0.5rem;
                    border-radius: 9999px;
                    background-color: #d1fae5;
                    color: #065f46;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .modal-footer {
                    padding: 1rem 1.5rem;
                    background: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                }
                .action-btn {
                    padding: 0.625rem 1.25rem;
                    border-radius: 0.5rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }
                .action-btn.primary {
                    background: #6366f1;
                    color: white;
                }
                .action-btn.primary:hover {
                    background: #4f46e5;
                }
                .action-btn.secondary {
                    background: #e5e7eb;
                    color: #374151;
                }
                .action-btn.secondary:hover {
                    background: #d1d5db;
                }
                .action-btn.cancel {
                    background: white;
                    border: 1px solid #d1d5db;
                    color: #374151;
                }
                .action-btn.cancel:hover {
                    background: #f9fafb;
                }
                .action-btn.cancel:hover {
                    background: #f9fafb;
                }
                .action-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .preset-buttons {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    flex-wrap: wrap;
                }
                .preset-btn {
                    padding: 0.4rem 0.8rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    background: white;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .preset-btn:hover {
                    background: #f3f4f6;
                }
                .preset-btn.active {
                    background: #e0e7ff;
                    border-color: #6366f1;
                    color: #4338ca;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
};

export default ReminderModal;
