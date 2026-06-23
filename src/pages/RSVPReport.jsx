import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';
import { getEmailTemplate } from '../utils/emailTemplates';
import { sendEmail as sendEmailService } from '../utils/emailService';
import ReminderModal from '../components/ReminderModal';
import { useSearchParams } from 'react-router-dom';

const RSVPReport = () => {
    const { slug } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [wedding, setWedding] = useState(null);
    const [guests, setGuests] = useState([]);
    const [pendingGuests, setPendingGuests] = useState([]);
    const [activeTab, setActiveTab] = useState('approved'); // 'approved' or 'pending'
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [successMessage, setSuccessMessage] = useState(null);
    const [processingAction, setProcessingAction] = useState(null);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [sendingReminders, setSendingReminders] = useState(false);

    useEffect(() => {
        fetchReportData();
    }, [slug]);

    const fetchReportData = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);

            // Get Wedding Data
            const { data: weddingData, error: weddingError } = await supabase
                .from('weddings')
                .select('id, groom_name, bride_name, date, venue_name, location, ceremony_time, reception_time')
                .eq('slug', slug)
                .single();

            if (weddingError) throw new Error("Wedding not found");
            if (!weddingData) throw new Error("Wedding not found");

            setWedding(weddingData);

            // Get RSVPs
            const { data: rsvps, error: rsvpError } = await supabase
                .from('rsvps')
                .select('*')
                .eq('wedding_id', weddingData.id)
                .order('created_at', { ascending: false });

            if (rsvpError) throw new Error("Error fetching RSVPs");

            const allGuests = rsvps || [];
            // Separate into pending and approved/other
            setGuests(allGuests.filter(g => g.status === 'approved' || !g.status));
            setPendingGuests(allGuests.filter(g => g.status === 'pending'));
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            if (!isRefresh) setLoading(false);
        }
    };

    const handleDelete = async (id, name, isPending = false) => {
        if (!window.confirm(`Are you sure you want to remove "${name}" from the ${isPending ? 'pending' : 'guest'} list?`)) return;

        setProcessingAction(`${id}-delete`);
        try {
            // 1. Find the guest details before deleting (to get email)
            const guest = isPending ? pendingGuests.find(g => g.id === id) : guests.find(g => g.id === id);

            // 2. Delete from Database
            const { error } = await supabase
                .from('rsvps')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // 3. Send Notification Email (if email exists)
            if (guest && guest.email) {
                await sendEmail(guest, "removal"); // Abstracted email sender potentially
            }

            // 4. Refresh the guest list silently (no loading spinner)
            await fetchReportData(true);
            setSuccessMessage(`🗑️ ${name} removed successfully!`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error removing guest:', error);
            alert('Error removing guest: ' + error.message);
        } finally {
            setProcessingAction(null);
        }
    };

    // Helper to send email via backend API (Google SMTP)
    const sendEmail = async (guest, type) => {
        try {
            let title, subtitle, message, action_text;
            // valid theme colors: red (#b91c1c), green (#047857)
            let theme_color, light_theme_color, status_badge_text, alert_title, alert_icon, badge_bg_color, badge_text_color;

            if (type === 'removal') {
                title = "You have been removed from the guest list";
                subtitle = "Important Notice";
                message = "This change is final. It helps us maintain accurate numbers and comply with venue capacity.";
                action_text = "View Details";

                // Red Theme
                theme_color = "#b91c1c";
                light_theme_color = "#f9fcff";
                status_badge_text = "✔ action completed – removed";
                badge_bg_color = "#fcede8";
                badge_text_color = "#b53b30";
                alert_title = "your RSVP has been removed";
                alert_icon = "⛔";

            } else if (type === 'approval') {
                title = "You are on the list! RSVP Confirmed";
                subtitle = "You are on the list!";
                message = "Great news! Your RSVP has been confirmed. We have reserved your spot and look forward to celebrating with you.";
                action_text = "View Details";

                // Green Theme
                theme_color = "#047857"; // emerald-700
                light_theme_color = "#ecfdf5"; // emerald-50
                status_badge_text = "✔ action completed – confirmed";
                badge_bg_color = "#ecfdf5";
                badge_text_color = "#047857";
                alert_title = "your RSVP is confirmed";
                alert_icon = "✅";
            }

            const templateParams = {
                to_name: guest.name,
                to_email: guest.email, // Kept for reference
                email: guest.email,
                message: message,
                wedding_name: `${wedding.groom_name} & ${wedding.bride_name}`,
                event_type: 'wedding',
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
                venue: wedding.venue_name || 'Venue to be announced',
                location: wedding.location || '',
                link: `${window.location.origin}/w/${wedding.slug}`,
                title: title,
                subtitle: subtitle,
                action_text: action_text,
                // Dynamic Theme Params
                theme_color: theme_color,
                light_theme_color: light_theme_color,
                status_badge_text: status_badge_text,
                badge_bg_color: badge_bg_color,
                badge_text_color: badge_text_color,
                alert_title: alert_title,
                alert_icon: alert_icon,
                // Dynamic Content
                action_note: type === 'removal' ? 'no further action is needed from you' : 'see event details below',
                footer_text: type === 'removal' ? 'guest list control' : 'guest list update',
                footer_subtext: type === 'removal' ? 'this notice confirms removal. no response required.' : 'this notice is an automatic confirmation.'
            };

            // Generate HTML using the helper
            const htmlContent = getEmailTemplate(templateParams);

            // Send via our unified service
            await sendEmailService({
                to: guest.email,
                subject: title,
                html: htmlContent
            });

            console.log("Email sent successfully via SMTP API");

        } catch (emailErr) {
            console.error("Email logic error", emailErr);
            // Optionally: fallback to alert or UI feedback if email fails, 
            // but for now we just log it as per previous implementation logic swallowing some errors
        }
    };


    const handleMoveToPending = async (guest) => {
        if (!window.confirm(`Move "${guest.name}" back to pending list?`)) return;
        setProcessingAction(`${guest.id}-pending`);
        try {
            const { error } = await supabase
                .from('rsvps')
                .update({ status: 'pending' })
                .eq('id', guest.id);

            if (error) throw error;

            // Send Removal Email (moving back to pending effectively removes them from the confirmed list)
            if (guest.email) {
                await sendEmail(guest, 'removal');
            }

            await fetchReportData(true);
            setSuccessMessage(`↩️ Moved ${guest.name} back to pending.`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error moving guest to pending:', error);
            alert('Error moving guest: ' + error.message);
        } finally {
            setProcessingAction(null);
        }
    };

    const handleApprove = async (guest) => {
        setProcessingAction(`${guest.id}-approve`);
        try {
            const { error } = await supabase
                .from('rsvps')
                .update({ status: 'approved' })
                .eq('id', guest.id);

            if (error) throw error;

            // Send Confirmation Email
            if (guest.email) {
                await sendEmail(guest, 'approval');
            }

            await fetchReportData(true);
            setSuccessMessage(`✅ ${guest.name} approved successfully!`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error approving guest:', error);
            alert('Error approving guest: ' + error.message);
        } finally {
            setProcessingAction(null);
        }
    };

    const startEdit = (guest) => {
        setEditingId(guest.id);
        setEditForm({
            name: guest.name,
            email: guest.email,
            phone: guest.phone,
            attending: guest.attending,
            guests_count: guest.guests_count
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async (id) => {
        try {
            const { error } = await supabase
                .from('rsvps')
                .update(editForm)
                .eq('id', id);

            if (error) throw error;

            setGuests(guests.map(g => g.id === id ? { ...g, ...editForm } : g));
            setEditingId(null);
            setEditForm({});
            alert('Guest updated successfully!');
        } catch (error) {
            alert('Error updating guest: ' + error.message);
        }
    };

    const downloadExcel = () => {
        if (!guests || guests.length === 0) {
            alert("No RSVPs to download.");
            return;
        }

        const excelData = guests.map(row => ({
            "Name": row.name,
            "Email": row.email,
            "Phone": row.phone,
            "Attending": row.attending,
            "Number of Guests": row.guests_count,
            "RSVP Date": new Date(row.created_at).toLocaleDateString()
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);

        // Set column widths to accommodate guest names
        const columnWidths = [
            { wch: 30 }, // Name
            { wch: 30 }, // Email
            { wch: 15 }, // Phone
            { wch: 10 }, // Attending
            { wch: 15 }, // Number of Guests
            { wch: 15 }  // RSVP Date
        ];
        ws['!cols'] = columnWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "RSVPs");

        const weddingName = `${wedding.groom_name}_${wedding.bride_name}`;
        XLSX.writeFile(wb, `RSVPs_${weddingName.replace(/\s+/g, '_')}.xlsx`);
    };

    const handleSendRemindersNow = async () => {
        const approvedGuests = guests.filter(g => (g.status === 'approved' || !g.status) && g.email);
        if (approvedGuests.length === 0) {
            alert("No approved guests with email addresses found.");
            return;
        }

        if (!window.confirm(`Send an immediate reminder to all ${approvedGuests.length} approved guests?`)) return;

        setSendingReminders(true);
        let sentCount = 0;
        let failCount = 0;

        try {
            for (const guest of approvedGuests) {
                const templateParams = {
                    to_name: guest.name,
                    wedding_name: `${wedding.groom_name} & ${wedding.bride_name}`,
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
                    venue: wedding.venue_name || 'TBA',
                    location: wedding.location || '',
                    message: `This is a friendly reminder that the celebration of ${wedding.groom_name} & ${wedding.bride_name} is coming up! We're so excited to celebrate with you. Please be ready and we can't wait to see you there!`,
                    link: `${window.location.origin}/w/${wedding.slug}`,
                    title: `${wedding.groom_name} & ${wedding.bride_name} Celebration`,
                    subtitle: "Event Reminder",
                    action_text: "View Invitation & Details",
                    // Dynamic Theme Params (defaulting to blue/indigo for reminders)
                    theme_color: "#4f46e5",
                    light_theme_color: "#eef2ff",
                    status_badge_text: "✔ event reminder",
                    badge_bg_color: "#eef2ff",
                    badge_text_color: "#4f46e5",
                    alert_title: "important reminder",
                    alert_icon: "📅",
                    action_note: "see event details below",
                    footer_text: "guest reminder system",
                    footer_subtext: "this is an automated reminder for your upcoming event."
                };

                try {
                    const htmlContent = getEmailTemplate(templateParams);
                    await sendEmailService({
                        to: guest.email,
                        subject: `Reminder: ${wedding.groom_name} & ${wedding.bride_name} Celebration`,
                        html: htmlContent
                    });
                    sentCount++;
                    // Small delay to avoid rate limits
                    if (approvedGuests.length > 5) await new Promise(r => setTimeout(r, 400));
                } catch (e) {
                    console.error(`Failed to email ${guest.email}`, e);
                    failCount++;
                }
            }

            setSuccessMessage(`🔔 Sent reminders to ${sentCount} guests${failCount > 0 ? ` (${failCount} failed)` : ''}!`);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            console.error("Batch reminder failed:", error);
            alert("Error sending reminders: " + error.message);
        } finally {
            setSendingReminders(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    if (loading) {
        return (
            <div className="report-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
return (
        <div className="rsvp-report">
            {successMessage && (
                <div className="success-toast">
                    <i className="fas fa-check-circle"></i> {successMessage}
                </div>
            )}

            {showReminderModal && (
                <ReminderModal
                    wedding={wedding}
                    onClose={() => setShowReminderModal(false)}
                    onSave={() => {
                        setSuccessMessage("⏰ Reminders scheduled successfully!");
                        setTimeout(() => setSuccessMessage(null), 3000);
                        fetchReportData(true);
                    }}
                />
            )}

            {/* ── HEADER ── */}
            <header className="rr-header">
                <div className="rr-header-inner">
                    <div className="rr-brand">
                        <p className="rr-label">RSVP Report</p>
                        <h1>{wedding.groom_name} <span>&</span> {wedding.bride_name}</h1>
                        <div className="rr-meta-row">
                            <span><i className="far fa-calendar"></i>
                                {new Date(wedding.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            {wedding.venue_name && (
                                <span><i className="fas fa-map-marker-alt"></i>{wedding.venue_name}</span>
                            )}
                        </div>
                    </div>
                    <div className="rr-header-actions">
                        <button onClick={() => setShowReminderModal(true)} className="rr-btn rr-btn-ghost" title="Schedule Reminders">
                            <i className="fas fa-clock"></i> Schedule
                        </button>
                        <button onClick={handleSendRemindersNow} className="rr-btn rr-btn-ghost" disabled={sendingReminders} title="Send Reminders">
                            {sendingReminders ? <><i className="fas fa-spinner fa-spin"></i> Sending…</> : <><i className="fas fa-bell"></i> Reminders</>}
                        </button>
                        <button onClick={downloadExcel} className="rr-btn rr-btn-lime" title="Download Excel">
                            <i className="fas fa-file-excel"></i> Export
                        </button>
                    </div>
                </div>
            </header>

            {/* ── STATS ── */}
            <section className="rr-stats">
                <div className="rr-stat-card rr-stat-primary">
                    <div className="rr-stat-icon"><i className="fas fa-users"></i></div>
                    <div>
                        <div className="rr-stat-num">{guests.length}</div>
                        <div className="rr-stat-lbl">Total RSVPs</div>
                    </div>
                </div>
                <div className="rr-stat-card">
                    <div className="rr-stat-icon rr-icon-green"><i className="fas fa-check-circle"></i></div>
                    <div>
                        <div className="rr-stat-num">{guests.filter(g => g.attending?.toLowerCase() === 'yes' || g.attending?.toLowerCase() === 'attending').length}</div>
                        <div className="rr-stat-lbl">Attending</div>
                    </div>
                    <div className="rr-stat-trend green">
                        <i className="fas fa-arrow-up"></i>
                    </div>
                </div>
                <div className="rr-stat-card">
                    <div className="rr-stat-icon rr-icon-red"><i className="fas fa-times-circle"></i></div>
                    <div>
                        <div className="rr-stat-num">{guests.filter(g => g.attending?.toLowerCase() === 'no' || g.attending?.toLowerCase() === 'declined').length}</div>
                        <div className="rr-stat-lbl">Declined</div>
                    </div>
                </div>
                <div className="rr-stat-card">
                    <div className="rr-stat-icon rr-icon-amber"><i className="fas fa-user-friends"></i></div>
                    <div>
                        <div className="rr-stat-num">{guests.reduce((sum, g) => sum + (parseInt(g.guests_count) || 0), 0)}</div>
                        <div className="rr-stat-lbl">Total Seats</div>
                    </div>
                </div>
            </section>

            {/* ── GUEST LIST ── */}
            <section className="rr-list">
                <div className="rr-list-header">
                    <h2>Guest List</h2>
                    <div className="rr-tabs">
                        <button className={`rr-tab ${activeTab === 'approved' ? 'rr-tab-active' : ''}`} onClick={() => setActiveTab('approved')}>
                            Approved <span className="rr-count">{guests.length}</span>
                        </button>
                        <button className={`rr-tab ${activeTab === 'pending' ? 'rr-tab-active' : ''}`} onClick={() => setActiveTab('pending')}>
                            Pending
                            <span className={`rr-count ${pendingGuests.length > 0 ? 'rr-count-alert' : ''}`}>{pendingGuests.length}</span>
                        </button>
                    </div>
                </div>

                {activeTab === 'pending' ? (
                    pendingGuests.length === 0 ? (
                        <div className="rr-empty">
                            <i className="fas fa-check-circle"></i>
                            <h3>No Pending Requests</h3>
                            <p>All RSVPs have been processed.</p>
                        </div>
                    ) : (
                        <div className="rr-table-wrap">
                            <table className="rr-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Attending</th>
                                        <th>Guests</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingGuests.map((guest) => (
                                        <tr key={guest.id}>
                                            <td className="rr-name">{guest.name}</td>
                                            <td className="rr-email">{guest.email}</td>
                                            <td>
                                                <span className={`rr-badge ${guest.attending?.toLowerCase() === 'yes' ? 'rr-badge-yes' : 'rr-badge-no'}`}>
                                                    {guest.attending}
                                                </span>
                                            </td>
                                            <td className="rr-center">{guest.guests_count}</td>
                                            <td>
                                                <div className="rr-actions">
                                                    <button onClick={() => handleApprove(guest)} className="rr-act-approve" title="Approve" disabled={!!processingAction}>
                                                        {processingAction === `${guest.id}-approve` ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-check"></i> Approve</>}
                                                    </button>
                                                    <button onClick={() => handleDelete(guest.id, guest.name, true)} className="rr-act-del" title="Reject" disabled={!!processingAction}>
                                                        {processingAction === `${guest.id}-delete` ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-times"></i>}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    guests.length === 0 ? (
                        <div className="rr-empty">
                            <i className="fas fa-inbox"></i>
                            <h3>No Approved Guests Yet</h3>
                            <p>Approve pending RSVPs to add them here.</p>
                        </div>
                    ) : (
                        <div className="rr-table-wrap">
                            <table className="rr-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th>Guests</th>
                                        <th>RSVP Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {guests.map((guest) => (
                                        <tr key={guest.id} className={editingId === guest.id ? 'rr-editing' : ''}>
                                            {editingId === guest.id ? (
                                                <>
                                                    <td><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rr-input" /></td>
                                                    <td><input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="rr-input" /></td>
                                                    <td><input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="rr-input" /></td>
                                                    <td>
                                                        <select value={editForm.attending} onChange={(e) => setEditForm({ ...editForm, attending: e.target.value })} className="rr-select">
                                                            <option value="Yes">Yes</option>
                                                            <option value="No">No</option>
                                                        </select>
                                                    </td>
                                                    <td><input type="number" value={editForm.guests_count} onChange={(e) => setEditForm({ ...editForm, guests_count: e.target.value })} className="rr-input" min="1" /></td>
                                                    <td className="rr-date">{formatDate(guest.created_at)}</td>
                                                    <td>
                                                        <div className="rr-actions">
                                                            <button onClick={() => saveEdit(guest.id)} className="rr-act-save" title="Save"><i className="fas fa-check"></i></button>
                                                            <button onClick={cancelEdit} className="rr-act-cancel" title="Cancel"><i className="fas fa-times"></i></button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="rr-name">{guest.name}</td>
                                                    <td className="rr-email">{guest.email}</td>
                                                    <td className="rr-phone">{guest.phone}</td>
                                                    <td>
                                                        <span className={`rr-badge ${guest.attending?.toLowerCase() === 'yes' || guest.attending?.toLowerCase() === 'attending' ? 'rr-badge-yes' : 'rr-badge-no'}`}>
                                                            {guest.attending?.toLowerCase() === 'yes' || guest.attending?.toLowerCase() === 'attending' ? <><i className="fas fa-check"></i> Attending</> : <><i className="fas fa-times"></i> Declined</>}
                                                        </span>
                                                    </td>
                                                    <td className="rr-center">{guest.guests_count}</td>
                                                    <td className="rr-date">{formatDate(guest.created_at)}</td>
                                                    <td>
                                                        <div className="rr-actions">
                                                            <button onClick={() => startEdit(guest)} className="rr-act-edit" title="Edit"><i className="fas fa-edit"></i></button>
                                                            <button onClick={() => handleMoveToPending(guest)} className="rr-act-pending" title="Move to Pending" disabled={!!processingAction}>
                                                                {processingAction === `${guest.id}-pending` ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-undo"></i>}
                                                            </button>
                                                            <button onClick={() => handleDelete(guest.id, guest.name, false)} className="rr-act-del" title="Delete" disabled={!!processingAction}>
                                                                {processingAction === `${guest.id}-delete` ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash"></i>}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </section>

            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

                *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

                /* ── PAGE ── */
                .rsvp-report {
                    min-height: 100vh;
                    background: #f0f2f5;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    padding-bottom: 4rem;
                    color: #0d0d14;
                }

                /* ── TOAST ── */
                .success-toast {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #0d0d14;
                    color: #a3e635;
                    padding: 0.85rem 2rem;
                    border-radius: 999px;
                    box-shadow: 0 12px 32px rgba(0,0,0,0.25);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    animation: slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1);
                }
                @keyframes slideDown {
                    from { transform: translate(-50%, -120%); opacity: 0; }
                    to   { transform: translate(-50%, 0);    opacity: 1; }
                }

                /* ── HEADER ── */
                .rr-header {
                    background: #0d0d14;
                    padding: 2rem 0 2.2rem;
                    position: relative;
                    overflow: hidden;
                }
                .rr-header::before {
                    content: '';
                    position: absolute;
                    top: -80px; right: -80px;
                    width: 280px; height: 280px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(163,230,53,0.14) 0%, transparent 70%);
                    pointer-events: none;
                }
                .rr-header::after {
                    content: '';
                    position: absolute;
                    bottom: -100px; left: 5%;
                    width: 350px; height: 350px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(163,230,53,0.07) 0%, transparent 70%);
                    pointer-events: none;
                }
                .rr-header-inner {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                    position: relative;
                    z-index: 1;
                }
                .rr-label {
                    font-size: 0.72rem;
                    font-weight: 700;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: #a3e635;
                    margin-bottom: 0.4rem;
                }
                .rr-brand h1 {
                    font-size: 2.1rem;
                    font-weight: 900;
                    color: #fff;
                    letter-spacing: -0.03em;
                    line-height: 1.1;
                    margin-bottom: 0.55rem;
                }
                .rr-brand h1 span { color: #a3e635; }
                .rr-meta-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    align-items: center;
                }
                .rr-meta-row span {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.5);
                    font-weight: 400;
                }
                .rr-meta-row span i { color: #a3e635; font-size: 0.75rem; }

                /* Header buttons */
                .rr-header-actions { display: flex; gap: 0.7rem; align-items: center; flex-wrap: wrap; }
                .rr-btn {
                    padding: 0.65rem 1.2rem;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.875rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.45rem;
                    transition: all 0.2s ease;
                    font-family: inherit;
                    letter-spacing: 0.01em;
                }
                .rr-btn-ghost {
                    background: rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.8);
                    border: 1px solid rgba(255,255,255,0.12);
                    backdrop-filter: blur(6px);
                }
                .rr-btn-ghost:hover {
                    background: rgba(255,255,255,0.15);
                    color: #fff;
                    transform: translateY(-2px);
                }
                .rr-btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
                .rr-btn-lime {
                    background: #a3e635;
                    color: #0d0d14;
                }
                .rr-btn-lime:hover {
                    background: #bef264;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(163,230,53,0.4);
                }

                /* ── STATS ── */
                .rr-stats {
                    max-width: 1400px;
                    margin: 2rem auto;
                    padding: 0 2rem;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
                    gap: 1.2rem;
                }
                .rr-stat-card {
                    background: #fff;
                    border-radius: 18px;
                    padding: 1.6rem 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1.1rem;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
                    border: 1px solid rgba(0,0,0,0.04);
                    transition: transform 0.22s ease, box-shadow 0.22s ease;
                    position: relative;
                    overflow: hidden;
                }
                .rr-stat-card::after {
                    content: '';
                    position: absolute;
                    top: 0; right: 0;
                    width: 90px; height: 90px;
                    border-radius: 50%;
                    background: radial-gradient(circle at top right, rgba(163,230,53,0.09), transparent 70%);
                    pointer-events: none;
                }
                .rr-stat-primary { background: #0d0d14; }
                .rr-stat-primary .rr-stat-num { color: #a3e635; }
                .rr-stat-primary .rr-stat-lbl { color: rgba(255,255,255,0.45); }
                .rr-stat-primary .rr-stat-icon { background: rgba(163,230,53,0.12); color: #a3e635; }
                .rr-stat-card:hover { transform: translateY(-5px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
                .rr-stat-icon {
                    width: 52px; height: 52px;
                    background: #f0f2f5;
                    border-radius: 13px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    color: #0d0d14;
                    flex-shrink: 0;
                }
                .rr-icon-green { background: #dcfce7; color: #166534; }
                .rr-icon-red   { background: #fee2e2; color: #991b1b; }
                .rr-icon-amber { background: #fef3c7; color: #92400e; }
                .rr-stat-num {
                    font-size: 2rem;
                    font-weight: 900;
                    color: #0d0d14;
                    letter-spacing: -0.04em;
                    line-height: 1;
                    margin-bottom: 0.2rem;
                }
                .rr-stat-lbl {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #9ca3af;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                }
                .rr-stat-trend {
                    margin-left: auto;
                    font-size: 0.8rem;
                    font-weight: 700;
                }
                .rr-stat-trend.green { color: #22c55e; }

                /* ── GUEST LIST ── */
                .rr-list {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 2rem;
                }
                .rr-list-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1.2rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .rr-list-header h2 {
                    font-size: 1.45rem;
                    font-weight: 800;
                    color: #0d0d14;
                    letter-spacing: -0.025em;
                }
                .rr-tabs {
                    display: flex;
                    gap: 0.35rem;
                    background: #e4e6ed;
                    padding: 0.28rem;
                    border-radius: 12px;
                }
                .rr-tab {
                    padding: 0.48rem 1rem;
                    border: none;
                    background: transparent;
                    border-radius: 9px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    color: #6b7280;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.45rem;
                    transition: all 0.2s ease;
                    font-family: inherit;
                }
                .rr-tab-active {
                    background: #0d0d14;
                    color: #a3e635;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
                }
                .rr-tab:hover:not(.rr-tab-active) { background: rgba(255,255,255,0.6); color: #374151; }
                .rr-count {
                    background: rgba(0,0,0,0.08);
                    color: inherit;
                    border-radius: 999px;
                    padding: 0.1rem 0.5rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                }
                .rr-count-alert { background: #ef4444; color: #fff !important; }

                /* ── EMPTY ── */
                .rr-empty {
                    background: #fff;
                    border-radius: 18px;
                    padding: 4rem 2rem;
                    text-align: center;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
                    border: 1px solid rgba(0,0,0,0.04);
                }
                .rr-empty i { font-size: 3.5rem; color: #d1d5db; display: block; margin-bottom: 1rem; }
                .rr-empty h3 { color: #0d0d14; font-weight: 700; margin-bottom: 0.4rem; }
                .rr-empty p { color: #9ca3af; font-size: 0.9rem; }

                /* ── TABLE ── */
                .rr-table-wrap {
                    background: #fff;
                    border-radius: 18px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
                    border: 1px solid rgba(0,0,0,0.04);
                    overflow: hidden;
                    overflow-x: auto;
                }
                .rr-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 700px;
                }
                .rr-table thead { background: #0d0d14; }
                .rr-table th {
                    padding: 1rem 1.1rem;
                    text-align: left;
                    font-weight: 700;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: rgba(255,255,255,0.45);
                }
                .rr-table th:first-child { padding-left: 1.5rem; }
                .rr-table th:last-child  { padding-right: 1.5rem; }
                .rr-table tbody tr {
                    border-bottom: 1px solid #f3f4f6;
                    transition: background 0.15s;
                }
                .rr-table tbody tr:last-child { border-bottom: none; }
                .rr-table tbody tr:hover { background: #f9fafb; }
                .rr-table tbody tr.rr-editing { background: #f0fdf4; }
                .rr-table td {
                    padding: 1rem 1.1rem;
                    font-size: 0.9rem;
                    color: #4b5563;
                }
                .rr-table td:first-child { padding-left: 1.5rem; }
                .rr-table td:last-child  { padding-right: 1.5rem; }
                .rr-name  { font-weight: 700; color: #0d0d14; min-width: 160px; }
                .rr-email { color: #6b7280; min-width: 180px; }
                .rr-phone { color: #6b7280; min-width: 120px; }
                .rr-center { text-align: center; font-weight: 700; color: #0d0d14; }
                .rr-date  { font-size: 0.8rem; color: #9ca3af; min-width: 140px; }

                /* Status badges */
                .rr-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.3rem 0.8rem;
                    border-radius: 999px;
                    font-size: 0.76rem;
                    font-weight: 700;
                    white-space: nowrap;
                    letter-spacing: 0.02em;
                }
                .rr-badge-yes { background: #dcfce7; color: #166534; }
                .rr-badge-no  { background: #fee2e2; color: #991b1b; }

                /* Edit inputs */
                .rr-input, .rr-select {
                    width: 100%;
                    padding: 0.45rem 0.6rem;
                    border: 2px solid #a3e635;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-family: inherit;
                    background: #f9fef0;
                    color: #0d0d14;
                    outline: none;
                }
                .rr-input:focus, .rr-select:focus {
                    border-color: #65a30d;
                    box-shadow: 0 0 0 3px rgba(163,230,53,0.2);
                }

                /* Action buttons */
                .rr-actions { display: flex; gap: 0.4rem; }
                .rr-actions button {
                    width: 34px; height: 34px;
                    border: none;
                    border-radius: 9px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    transition: all 0.18s ease;
                    font-family: inherit;
                }
                .rr-act-approve {
                    width: auto !important;
                    padding: 0 0.85rem;
                    gap: 0.4rem;
                    font-weight: 600;
                    background: #0d0d14;
                    color: #a3e635;
                    font-size: 0.8rem !important;
                }
                .rr-act-approve:hover { background: #1a1a2e; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
                .rr-act-edit    { background: #eff6ff; color: #1e40af; }
                .rr-act-edit:hover    { background: #3b82f6; color: #fff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
                .rr-act-pending { background: #fffbeb; color: #b45309; }
                .rr-act-pending:hover { background: #f59e0b; color: #fff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(245,158,11,0.3); }
                .rr-act-del     { background: #fef2f2; color: #b91c1c; }
                .rr-act-del:hover     { background: #ef4444; color: #fff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
                .rr-act-save    { background: #f0fdf4; color: #166534; }
                .rr-act-save:hover    { background: #22c55e; color: #fff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(34,197,94,0.3); }
                .rr-act-cancel  { background: #f3f4f6; color: #6b7280; }
                .rr-act-cancel:hover  { background: #9ca3af; color: #fff; transform: translateY(-2px); }
                .rr-actions button:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

                /* Loading / Error */
                .report-loading {
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    min-height: 100vh; background: #f0f2f5;
                }
                .spinner {
                    width: 50px; height: 50px;
                    border: 4px solid rgba(163,230,53,0.2);
                    border-top: 4px solid #a3e635;
                    border-radius: 50%;
                    animation: spin 0.9s linear infinite;
                    margin-bottom: 1rem;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .report-error {
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    min-height: 100vh; background: #f0f2f5;
                    text-align: center; padding: 2rem;
                }
                .report-error i { font-size: 4rem; color: #ef4444; margin-bottom: 1rem; }
                .report-error h2 { color: #0d0d14; margin-bottom: 0.5rem; }
                .report-error p { color: #6b7280; }

                /* ── RESPONSIVE ── */
                @media (max-width: 900px) {
                    .rr-header-inner { flex-direction: column; text-align: center; }
                    .rr-brand h1 { font-size: 1.6rem; }
                    .rr-meta-row { justify-content: center; }
                    .rr-header-actions { justify-content: center; }
                    .rr-stats { grid-template-columns: 1fr 1fr; }
                    .rr-list-header { flex-direction: column; align-items: flex-start; }
                }
                @media (max-width: 560px) {
                    .rr-header-inner, .rr-stats, .rr-list { padding: 0 1rem; }
                    .rr-stats { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};
