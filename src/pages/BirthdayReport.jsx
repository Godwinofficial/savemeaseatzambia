import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';
import { getEmailTemplate } from '../utils/emailTemplates';
import { sendEmail as sendEmailService } from '../utils/emailService';

const BirthdayReport = () => {
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

    useEffect(() => {
        fetchReportData();
    }, [slug]);

    const fetchReportData = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);

            // Get Event Data
            const { data: eventData, error: eventError } = await supabase
                .from('birthday_events')
                .select('id, child_name, date, venue_name, venue_address')
                .eq('slug', slug)
                .single();

            if (eventError) throw new Error("Event not found");
            if (!eventData) throw new Error("Event not found");

            setWedding(eventData);

            // Get RSVPs
            const { data: rsvps, error: rsvpError } = await supabase
                .from('birthday_rsvps')
                .select('*')
                .eq('event_id', eventData.id)
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
                .from('birthday_rsvps')
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
                action_text = "View Wedding Website";

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
                action_text = "View Wedding Details";

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
                wedding_name: `${wedding.child_name}'s Birthday`,
                event_date: new Date(wedding.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
                venue: wedding.venue_name || 'Venue to be announced',
                location: wedding.venue_address || '',
                link: `${window.location.origin}/b/${slug}`,
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
                .from('birthday_rsvps')
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
                .from('birthday_rsvps')
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
                .from('birthday_rsvps')
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

        const eventName = `${wedding.child_name}_Birthday`;
        XLSX.writeFile(wb, `RSVPs_${eventName.replace(/\s+/g, '_')}.xlsx`);
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
            <div className="report-error">
                <i className="fas fa-exclamation-circle"></i>
                <h2>Error Loading Report</h2>
                <p>{error}</p>

            </div>
        );
    }

    return (
        <div className="rsvp-report">
            {successMessage && (
                <div className="success-message-header">
                    <i className="fas fa-check-circle"></i> {successMessage}
                </div>
            )}
            {/* Header */}
            <header className="report-header">
                <div className="header-content">
                    <div className="wedding-info">
                        <h1>{wedding.child_name}'s Birthday</h1>
                        <p className="wedding-date">
                            <i className="far fa-calendar"></i>
                            {new Date(wedding.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                        {wedding.venue_name && (
                            <p className="wedding-venue">
                                <i className="fas fa-map-marker-alt"></i>
                                {wedding.venue_name}
                            </p>
                        )}
                    </div>
                    <button onClick={downloadExcel} className="download-excel-btn">
                        <i className="fas fa-file-excel"></i>
                        Download Excel
                    </button>
                </div>
            </header>

            {/* Stats */}
            <section className="report-stats">
                <div className="stat-card">
                    <div className="stat-icon">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{guests.length}</h3>
                        <p>Total RSVPs</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon attending">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{guests.filter(g => g.attending?.toLowerCase() === 'yes' || g.attending?.toLowerCase() === 'attending').length}</h3>
                        <p>Attending</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon declined">
                        <i className="fas fa-times-circle"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{guests.filter(g => g.attending?.toLowerCase() === 'no' || g.attending?.toLowerCase() === 'declined').length}</h3>
                        <p>Declined</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon guests">
                        <i className="fas fa-user-friends"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{guests.reduce((sum, g) => sum + (parseInt(g.guests_count) || 0), 0)}</h3>
                        <p>Total Guests</p>
                    </div>
                </div>
            </section>

            {/* Guest List */}
            <section className="guest-list-section">
                <div className="section-header">
                    <h2>Guest List</h2>
                    <div className="header-actions">
                        <div className="tabs">
                            <button
                                className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
                                onClick={() => setActiveTab('approved')}
                            >
                                Approved ({guests.length})
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                                onClick={() => setActiveTab('pending')}
                            >
                                Pending Requests ({pendingGuests.length})
                                {pendingGuests.length > 0 && <span className="badge-dot"></span>}
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'pending' ? (
                    /* Pending List View */
                    pendingGuests.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-check-circle"></i>
                            <h3>No Pending Requests</h3>
                            <p>All RSVPs have been processed.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="guest-table">
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
                                            <td className="name-cell">{guest.name}</td>
                                            <td className="email-cell">{guest.email}</td>
                                            <td>
                                                <span className={`status-badge ${guest.attending?.toLowerCase() === 'yes' ? 'yes' : 'no'}`}>
                                                    {guest.attending}
                                                </span>
                                            </td>
                                            <td className="guests-cell">{guest.guests_count}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => handleApprove(guest)}
                                                        className="save-btn"
                                                        title="Approve & Add"
                                                        style={{ width: 'auto', padding: '0 1rem', gap: '0.5rem' }}
                                                        disabled={!!processingAction}
                                                    >
                                                        {processingAction === `${guest.id}-approve` ? (
                                                            <i className="fas fa-spinner fa-spin"></i>
                                                        ) : (
                                                            <><i className="fas fa-check"></i> Approve</>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(guest.id, guest.name, true)}
                                                        className="delete-btn"
                                                        title="Reject & Remove"
                                                        disabled={!!processingAction}
                                                    >
                                                        {processingAction === `${guest.id}-delete` ? (
                                                            <i className="fas fa-spinner fa-spin"></i>
                                                        ) : (
                                                            <i className="fas fa-times"></i>
                                                        )}
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
                    /* Approved List View (Existing Logic) */
                    guests.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-inbox"></i>
                            <h3>No Approved Guests Yet</h3>
                            <p>Approve pending RSVPs to add them here.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            {/* Existing Table Logic... but ensuring handleDelete is updated */}
                            <table className="guest-table">
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
                                        <tr key={guest.id} className={editingId === guest.id ? 'editing' : ''}>
                                            {/* ... (Existing Row Logic) ... */}
                                            {editingId === guest.id ? (
                                                <>
                                                    {/* Edit Mode cells same as before */}
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={editForm.name}
                                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                            className="edit-input"
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="email"
                                                            value={editForm.email}
                                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                            className="edit-input"
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={editForm.phone}
                                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                            className="edit-input"
                                                        />
                                                    </td>
                                                    <td>
                                                        <select
                                                            value={editForm.attending}
                                                            onChange={(e) => setEditForm({ ...editForm, attending: e.target.value })}
                                                            className="edit-select"
                                                        >
                                                            <option value="Yes">Yes</option>
                                                            <option value="No">No</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={editForm.guests_count}
                                                            onChange={(e) => setEditForm({ ...editForm, guests_count: e.target.value })}
                                                            className="edit-input"
                                                            min="1"
                                                        />
                                                    </td>
                                                    <td className="date-cell">{formatDate(guest.created_at)}</td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                onClick={() => saveEdit(guest.id)}
                                                                className="save-btn"
                                                                title="Save"
                                                            >
                                                                <i className="fas fa-check"></i>
                                                            </button>
                                                            <button
                                                                onClick={cancelEdit}
                                                                className="cancel-btn"
                                                                title="Cancel"
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="name-cell">{guest.name}</td>
                                                    <td className="email-cell">{guest.email}</td>
                                                    <td className="phone-cell">{guest.phone}</td>
                                                    <td>
                                                        <span className={`status-badge ${guest.attending?.toLowerCase() === 'yes' || guest.attending?.toLowerCase() === 'attending' ? 'yes' : 'no'}`}>
                                                            {guest.attending?.toLowerCase() === 'yes' || guest.attending?.toLowerCase() === 'attending' ? (
                                                                <><i className="fas fa-check"></i> Attending</>
                                                            ) : (
                                                                <><i className="fas fa-times"></i> Declined</>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="guests-cell">{guest.guests_count}</td>
                                                    <td className="date-cell">{formatDate(guest.created_at)}</td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                onClick={() => startEdit(guest)}
                                                                className="edit-btn"
                                                                title="Edit"
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => handleMoveToPending(guest)}
                                                                className="pending-btn"
                                                                title="Move back to Pending"
                                                                disabled={!!processingAction}
                                                            >
                                                                {processingAction === `${guest.id}-pending` ? (
                                                                    <i className="fas fa-spinner fa-spin"></i>
                                                                ) : (
                                                                    <i className="fas fa-undo"></i>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(guest.id, guest.name, false)}
                                                                className="delete-btn"
                                                                title="Delete Guest"
                                                                disabled={!!processingAction}
                                                            >
                                                                {processingAction === `${guest.id}-delete` ? (
                                                                    <i className="fas fa-spinner fa-spin"></i>
                                                                ) : (
                                                                    <i className="fas fa-trash"></i>
                                                                )}
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
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .rsvp-report {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    padding-bottom: 3rem;
                }

                /* Success Message */
                .success-message-header {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #10b981;
                    color: white;
                    padding: 1rem 2rem;
                    border-radius: 50px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 600;
                    animation: slideDown 0.3s ease-out;
                }

                @keyframes slideDown {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }

                /* Loading State */
                .report-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                }

                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(99, 102, 241, 0.1);
                    border-top: 4px solid #6366f1;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 1rem;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .report-loading p {
                    color: #6b7280;
                    font-size: 1rem;
                }

                /* Error State */
                .report-error {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    text-align: center;
                    padding: 2rem;
                }

                .report-error i {
                    font-size: 4rem;
                    color: #ef4444;
                    margin-bottom: 1rem;
                }

                .report-error h2 {
                    color: #1f2937;
                    margin-bottom: 0.5rem;
                }

                .report-error p {
                    color: #6b7280;
                }


                /* Header */
                .report-header {
                    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
                    color: white;
                    padding: 2rem 0;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                }

                .header-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                }



                .wedding-info {
                    text-align: center;
                    flex: 1;
                }

                .wedding-info h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(135deg, #1a1a1a 0%, #e0e7ff 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .wedding-date, .wedding-venue {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.95rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    margin-top: 0.25rem;
                }

                .download-excel-btn {
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    border: none;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
                }

                .download-excel-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
                }

                /* Stats */
                .report-stats {
                    max-width: 1400px;
                    margin: 2rem auto;
                    padding: 0 2rem;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                }

                .stat-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    transition: all 0.3s ease;
                }

                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                }

                .stat-icon {
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    border-radius: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    color: white;
                }

                .stat-icon.attending {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                }

                .stat-icon.declined {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                }

                .stat-icon.guests {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                }

                .stat-info h3 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 0.25rem;
                }

                .stat-info p {
                    color: #6b7280;
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                /* Guest List Section */
                .guest-list-section {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 2rem;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1.5rem;
                }

                .section-header h2 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #1f2937;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .tabs {
                    display: flex;
                    gap: 0.5rem;
                    background: #f3f4f6;
                    padding: 0.25rem;
                    border-radius: 0.5rem;
                }
                .tab-btn {
                    padding: 0.5rem 1rem;
                    border: none;
                    background: transparent;
                    border-radius: 0.375rem;
                    font-weight: 600;
                    color: #6b7280;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                }
                .tab-btn.active {
                    background: white;
                    color: #4f46e5;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .tab-btn:hover:not(.active) {
                    color: #374151;
                    background: rgba(255,255,255,0.5);
                }
                .badge-dot {
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border-radius: 50%;
                }
                .guest-count {
                    color: #6b7280;
                    font-weight: 500;
                    background: white;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }

                /* Empty State */
                .empty-state {
                    background: white;
                    padding: 4rem 2rem;
                    border-radius: 1rem;
                    text-align: center;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                }

                .empty-state i {
                    font-size: 4rem;
                    color: #d1d5db;
                    margin-bottom: 1rem;
                }

                .empty-state h3 {
                    color: #1f2937;
                    margin-bottom: 0.5rem;
                }

                .empty-state p {
                    color: #6b7280;
                }

                /* Table */
                .table-container {
                    background: white;
                    border-radius: 1rem;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    overflow: hidden;
                }

                .guest-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .guest-table thead {
                    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                }

                .guest-table th {
                    padding: 1rem;
                    text-align: left;
                    font-weight: 600;
                    color: #374151;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 2px solid #e5e7eb;
                }

                .guest-table tbody tr {
                    border-bottom: 1px solid #f3f4f6;
                    transition: all 0.2s ease;
                }

                .guest-table tbody tr:hover {
                    background: #f9fafb;
                }

                .guest-table tbody tr.editing {
                    background: #eff6ff;
                }

                .guest-table td {
                    padding: 1rem;
                    color: #4b5563;
                }

                .name-cell {
                    font-weight: 600;
                    color: #1f2937;
                    min-width: 200px;
                }

                .email-cell {
                    min-width: 200px;
                }

                .phone-cell {
                    min-width: 130px;
                }

                .guests-cell {
                    text-align: center;
                    font-weight: 600;
                }

                .date-cell {
                    font-size: 0.875rem;
                    color: #6b7280;
                    min-width: 150px;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.375rem 0.75rem;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    white-space: nowrap;
                }

                .status-badge.yes {
                    background: #d1fae5;
                    color: #065f46;
                }

                .status-badge.no {
                    background: #fee2e2;
                    color: #991b1b;
                }

                /* Edit Inputs */
                .edit-input, .edit-select {
                    width: 100%;
                    padding: 0.5rem;
                    border: 2px solid #6366f1;
                    border-radius: 0.375rem;
                    font-size: 0.875rem;
                    font-family: inherit;
                }

                .edit-input:focus, .edit-select:focus {
                    outline: none;
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }

                /* Action Buttons */
                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                .action-buttons button {
                    width: 36px;
                    height: 36px;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    font-size: 0.875rem;
                }

                .edit-btn {
                    background: #dbeafe;
                    color: #1e40af;
                }

                .edit-btn:hover {
                    background: #3b82f6;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                .pending-btn {
                    background: #fef3c7;
                    color: #d97706;
                }

                .pending-btn:hover {
                    background: #f59e0b;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
                }

                .delete-btn {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .delete-btn:hover {
                    background: #ef4444;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                }

                .save-btn {
                    background: #d1fae5;
                    color: #065f46;
                }

                .save-btn:hover {
                    background: #10b981;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                }

                .cancel-btn {
                    background: #f3f4f6;
                    color: #6b7280;
                }

                .cancel-btn:hover {
                    background: #9ca3af;
                    color: white;
                    transform: translateY(-2px);
                }

                /* Responsive Design */
                @media (max-width: 1024px) {
                    .header-content {
                        flex-direction: column;
                        text-align: center;
                    }



                    .wedding-info h1 {
                        font-size: 1.5rem;
                    }

                    .table-container {
                        overflow-x: auto;
                    }

                    .guest-table {
                        min-width: 900px;
                    }
                }

                @media (max-width: 768px) {
                    .report-stats {
                        grid-template-columns: 1fr;
                    }

                    .section-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }

                    .guest-table th,
                    .guest-table td {
                        padding: 0.75rem 0.5rem;
                        font-size: 0.875rem;
                    }

                    .name-cell,
                    .email-cell {
                        min-width: 150px;
                    }
                }
            `}</style>
        </div>
    );
};

export default BirthdayReport;
