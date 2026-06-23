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
        <div className="rm-overlay" onClick={onClose}>
            <div className="rm-sheet" onClick={e => e.stopPropagation()}>
                <div className="rm-header">
                    <div className="rm-drag-pill"></div>
                    <h3>Schedule Reminders</h3>
                    <p>For {wedding.groom_name} & {wedding.bride_name}</p>
                    <button className="rm-close" onClick={onClose}><i className="fas fa-times"></i></button>
                </div>

                <div className="rm-body">
                    {/* Day Of Event */}
                    <div className="rm-card">
                        <div className="rm-card-row">
                            <div className="rm-icon-box"><i className="fas fa-calendar-day"></i></div>
                            <div className="rm-card-info">
                                <h4>Day-of-Event Reminder</h4>
                                <p>Morning of {new Date(wedding.date).toLocaleDateString()}</p>
                            </div>
                            <label className="rm-toggle">
                                <input type="checkbox" checked={dayOfEventEnabled} onChange={(e) => setDayOfEventEnabled(e.target.checked)} />
                                <span className="rm-slider"></span>
                            </label>
                        </div>
                        {wedding.reminder_sent_day_of && <div className="rm-sent-badge"><i className="fas fa-check-circle"></i> Sent!</div>}
                    </div>

                    {/* Custom Timing */}
                    <div className="rm-card">
                        <h4><i className="fas fa-clock"></i> Custom Timing</h4>
                        <div className="rm-presets">
                            {['1day', '2days', '1week', 'custom'].map(opt => (
                                <button
                                    key={opt}
                                    className={`rm-preset ${presetOption === opt ? 'rm-preset-on' : ''}`}
                                    onClick={() => handlePresetChange(opt)}
                                >
                                    {opt === '1day' ? '1 Day' : opt === '2days' ? '2 Days' : opt === '1week' ? '1 Week' : 'Custom'}
                                </button>
                            ))}
                        </div>
                        <input
                            type="datetime-local"
                            value={customDate}
                            onChange={(e) => { setCustomDate(e.target.value); setPresetOption('custom'); }}
                            className="rm-input"
                        />
                        {wedding.reminder_sent_custom && <div className="rm-sent-badge" style={{ marginTop: '10px' }}><i className="fas fa-check-circle"></i> Sent!</div>}
                    </div>

                    {/* Test Email */}
                    <div className="rm-card">
                        <h4><i className="fas fa-vial"></i> Send Test</h4>
                        <div className="rm-test-row">
                            <input
                                type="email"
                                placeholder="Test email address"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                className="rm-input"
                            />
                            <button className="rm-btn-test" onClick={sendTestEmail} disabled={sending}>
                                {sending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="rm-footer">
                    <button className="rm-btn-save" onClick={handleSave}>
                        <i className="fas fa-check"></i> Save Schedule
                    </button>
                </div>
            </div>

            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                
                .rm-overlay {
                    position: fixed; inset: 0;
                    background: rgba(18, 18, 28, 0.6);
                    backdrop-filter: blur(8px);
                    z-index: 3000;
                    display: flex; align-items: flex-end; justify-content: center;
                    font-family: 'Inter', sans-serif;
                }
                .rm-sheet {
                    background: #f4f5f7;
                    width: 100%; max-width: 420px;
                    border-radius: 32px 32px 0 0;
                    overflow: hidden;
                    box-shadow: 0 -10px 40px rgba(0,0,0,.2);
                    animation: sheetUp .3s cubic-bezier(.34,1.56,.64,1);
                    display: flex; flex-direction: column;
                    max-height: 90vh;
                }
                @keyframes sheetUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                /* HEADER */
                .rm-header {
                    background: #12121c; color: #fff;
                    padding: 1rem 1.5rem 1.5rem;
                    position: relative; text-align: center;
                }
                .rm-drag-pill {
                    width: 40px; height: 5px; border-radius: 10px;
                    background: rgba(255,255,255,.2);
                    margin: 0 auto 1rem;
                }
                .rm-header h3 { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.2rem; }
                .rm-header p { font-size: 0.8rem; color: rgba(255,255,255,.6); }
                .rm-close {
                    position: absolute; top: 1.2rem; right: 1.2rem;
                    width: 32px; height: 32px; border-radius: 50%; border: none;
                    background: rgba(255,255,255,.1); color: #fff;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    transition: all .2s;
                }
                .rm-close:hover { background: rgba(255,255,255,.2); }

                /* BODY */
                .rm-body {
                    padding: 1.5rem; overflow-y: auto;
                    display: flex; flex-direction: column; gap: 1rem;
                }
                .rm-card {
                    background: #fff; border-radius: 20px; padding: 1.2rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,.04);
                }
                .rm-card h4 { font-size: .9rem; font-weight: 700; color: #111; margin-bottom: .8rem; display: flex; align-items: center; gap: .4rem; }
                .rm-card h4 i { color: #9ca3af; }

                /* ROW LAYOUT */
                .rm-card-row {
                    display: flex; align-items: center; gap: 1rem;
                }
                .rm-icon-box {
                    width: 44px; height: 44px; border-radius: 14px;
                    background: #f0fdf4; color: #16a34a;
                    display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
                    flex-shrink: 0;
                }
                .rm-card-info { flex: 1; min-width: 0; }
                .rm-card-info h4 { margin-bottom: 0.1rem; }
                .rm-card-info p { font-size: .75rem; color: #6b7280; }

                /* TOGGLE */
                .rm-toggle { position: relative; display: inline-block; width: 46px; height: 26px; flex-shrink:0; }
                .rm-toggle input { opacity: 0; width: 0; height: 0; }
                .rm-slider {
                    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                    background-color: #e5e7eb; transition: .3s; border-radius: 34px;
                }
                .rm-slider:before {
                    position: absolute; content: ""; height: 20px; width: 20px;
                    left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0,0,0,.1);
                }
                input:checked + .rm-slider { background-color: #a3e635; }
                input:checked + .rm-slider:before { transform: translateX(20px); }

                /* PRESETS */
                .rm-presets {
                    display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: 1rem;
                }
                .rm-preset {
                    padding: .4rem .8rem; border: none; border-radius: 10px;
                    background: #f3f4f6; color: #4b5563; font-size: .75rem; font-weight: 600;
                    cursor: pointer; transition: all .15s; font-family: inherit;
                }
                .rm-preset-on {
                    background: #12121c; color: #a3e635; box-shadow: 0 4px 10px rgba(0,0,0,.15);
                }

                /* INPUTS */
                .rm-input {
                    width: 100%; padding: .75rem 1rem;
                    background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 12px;
                    font-size: .85rem; font-family: inherit; outline: none; color: #111;
                    transition: all .2s;
                }
                .rm-input:focus { border-color: #a3e635; background: #fff; box-shadow: 0 0 0 3px rgba(163,230,53,.15); }

                .rm-test-row { display: flex; gap: .5rem; }
                .rm-btn-test {
                    width: 46px; height: 46px; border-radius: 12px; border: none;
                    background: #12121c; color: #a3e635; font-size: 1rem;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; transition: all .2s;
                }
                .rm-btn-test:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.15); }
                .rm-btn-test:disabled { opacity: .5; cursor: not-allowed; }

                /* BADGE */
                .rm-sent-badge {
                    display: inline-flex; align-items: center; gap: 4px;
                    background: #dcfce7; color: #15803d; font-size: .7rem; font-weight: 700;
                    padding: .2rem .6rem; border-radius: 999px; margin-top: .6rem;
                }

                /* FOOTER */
                .rm-footer { padding: 1rem 1.5rem 2rem; background: #fff; border-top: 1px solid #f1f5f9; }
                .rm-btn-save {
                    width: 100%; padding: 1rem; border-radius: 16px; border: none;
                    background: #a3e635; color: #12121c; font-size: .95rem; font-weight: 800;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: .5rem;
                    transition: all .2s; font-family: inherit;
                    box-shadow: 0 6px 20px rgba(163,230,53,.3);
                }
                .rm-btn-save:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(163,230,53,.4); }
                
                @media (min-width: 480px) {
                    .rm-overlay { align-items: center; }
                    .rm-sheet { border-radius: 32px; max-height: 85vh; }
                    .rm-drag-pill { display: none; }
                    .rm-footer { padding-bottom: 1.5rem; }
                }
            `}</style>
        </div>
    );
};

export default ReminderModal;
