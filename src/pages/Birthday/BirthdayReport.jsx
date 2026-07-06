import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import * as XLSX from 'xlsx';
import { getEmailTemplate } from '../../utils/emailTemplates';
import { sendEmail as sendEmailService } from '../../utils/emailService';
import ReminderModal from '../../components/ReminderModal';

const setThemeColor = (color) => {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.content = color;
};

const AVATAR_COLORS = ['#4f46e5', '#0891b2', '#7c3aed', '#be185d', '#065f46', '#b45309', '#9f1239', '#1d4ed8'];
const getAvatarColor = (name = '') => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const getInitials = (name = '') => (name || '').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase() || '?';

const isAttending = (guest) => {
    const a = String(guest?.attending ?? '').toLowerCase();
    return guest?.attending === true || a === 'yes' || a === 'attending';
};

const attendingLabel = (guest) => {
    if (isAttending(guest)) return 'Yes';
    const a = String(guest?.attending ?? '').toLowerCase();
    if (guest?.attending === false || a === 'no' || a === 'declined') return 'No';
    return String(guest?.attending ?? '—');
};

const BirthdayReport = () => {
    const { slug } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [wedding, setWedding] = useState(null);
    const [guests, setGuests] = useState([]);
    const [pendingGuests, setPendingGuests] = useState([]);
    const [activeTab, setActiveTab] = useState('approved');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [successMessage, setSuccessMessage] = useState(null);
    const [processingAction, setProcessingAction] = useState(null);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [sendingReminders, setSendingReminders] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const prev = document.querySelector('meta[name="theme-color"]')?.content;
        setThemeColor('#12121c');
        return () => { if (prev) setThemeColor(prev); else setThemeColor('#ffffff'); };
    }, []);

    useEffect(() => {
        fetchReportData();
    }, [slug]);

    const fetchReportData = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);

            const { data: eventData, error: eventError } = await supabase
                .from('birthday_events')
                .select('id, child_name, date, time, venue_name, venue_address')
                .eq('slug', slug)
                .single();

            if (eventError) throw new Error("Event not found");
            if (!eventData) throw new Error("Event not found");

            setWedding(eventData);

            const { data: rsvps, error: rsvpError } = await supabase
                .from('birthday_rsvps')
                .select('*')
                .eq('event_id', eventData.id)
                .order('created_at', { ascending: false });

            if (rsvpError) throw new Error("Error fetching RSVPs");

            const allGuests = rsvps || [];
            setGuests(allGuests.filter(g => g.status === 'approved' || !g.status));
            setPendingGuests(allGuests.filter(g => g.status === 'pending'));
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            if (!isRefresh) setLoading(false);
        }
    };

    const sendEmail = async (guest, type) => {
        try {
            let title, subtitle, message, action_text;
            let theme_color, light_theme_color, status_badge_text, alert_title, alert_icon, badge_bg_color, badge_text_color;

            if (type === 'removal') {
                title = "You have been removed from the guest list";
                subtitle = "Important Notice";
                message = "This change is final. It helps us maintain accurate numbers and comply with venue capacity.";
                action_text = "View Details";
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
                theme_color = "#047857";
                light_theme_color = "#ecfdf5";
                status_badge_text = "✔ action completed – confirmed";
                badge_bg_color = "#ecfdf5";
                badge_text_color = "#047857";
                alert_title = "your RSVP is confirmed";
                alert_icon = "✅";
            }

            const templateParams = {
                to_name: guest.name,
                to_email: guest.email,
                email: guest.email,
                message: message,
                wedding_name: wedding.child_name.replace(/['']s\s+Birthday$/i, ''),
                event_type: 'birthday',
                event_date: `${new Date(wedding.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${(() => {
                    if (!wedding.time) return 'TBA';
                    const [h, m] = wedding.time.split(':');
                    const hrs = parseInt(h, 10);
                    const ampm = hrs >= 12 ? 'PM' : 'AM';
                    const h12 = hrs % 12 || 12;
                    return `${h12}:${m} ${ampm}`;
                })()}`,
                venue: wedding.venue_name || 'Venue to be announced',
                location: wedding.venue_address || '',
                link: `${window.location.origin}/b/${slug}`,
                title: title,
                subtitle: subtitle,
                action_text: action_text,
                theme_color: theme_color,
                light_theme_color: light_theme_color,
                status_badge_text: status_badge_text,
                badge_bg_color: badge_bg_color,
                badge_text_color: badge_text_color,
                alert_title: alert_title,
                alert_icon: alert_icon,
                action_note: type === 'removal' ? 'No further action is needed from you' : 'See event details below',
                footer_text: type === 'removal' ? 'Guest List Control' : 'Guest List Update',
                footer_subtext: type === 'removal' ? 'This notice confirms removal. No response required.' : 'This notice is an automatic confirmation.'
            };

            const htmlContent = getEmailTemplate(templateParams);
            await sendEmailService({ to: guest.email, subject: title, html: htmlContent });
        } catch (emailErr) {
            console.error("Email logic error", emailErr);
        }
    };

    const handleDelete = async (id, name, isPending = false) => {
        if (!window.confirm(`Mark "${name}" as declined?`)) return;

        setProcessingAction(`${id}-delete`);
        try {
            const guest = isPending ? pendingGuests.find(g => g.id === id) : guests.find(g => g.id === id);
            const { error } = await supabase.from('birthday_rsvps')
                .update({ attending: false, status: 'approved' })
                .eq('id', id);
            if (error) throw error;
            if (guest?.email) await sendEmail(guest, "removal");
            await fetchReportData(true);
            setSuccessMessage(`🗑️ ${name} marked as declined!`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            alert('Error updating guest: ' + error.message);
        } finally {
            setProcessingAction(null);
        }
    };

    const handleMoveToPending = async (guest) => {
        if (!window.confirm(`Move "${guest.name}" back to pending list?`)) return;
        setProcessingAction(`${guest.id}-pending`);
        try {
            const { error } = await supabase.from('birthday_rsvps').update({ status: 'pending' }).eq('id', guest.id);
            if (error) throw error;
            if (guest.email) await sendEmail(guest, 'removal');
            await fetchReportData(true);
            setSuccessMessage(`↩️ Moved ${guest.name} back to pending.`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            alert('Error moving guest: ' + error.message);
        } finally {
            setProcessingAction(null);
        }
    };

    const handleApprove = async (guest) => {
        setProcessingAction(`${guest.id}-approve`);
        try {
            const { error } = await supabase.from('birthday_rsvps').update({ status: 'approved' }).eq('id', guest.id);
            if (error) throw error;
            if (guest.email) await sendEmail(guest, 'approval');
            await fetchReportData(true);
            setSuccessMessage(`✅ ${guest.name} approved successfully!`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
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
            attending: isAttending(guest) ? 'Yes' : 'No',
            guests_count: guest.guests_count
        });
    };

    const cancelEdit = () => { setEditingId(null); setEditForm({}); };

    const saveEdit = async (id) => {
        try {
            const { error } = await supabase.from('birthday_rsvps').update(editForm).eq('id', id);
            if (error) throw error;
            setGuests(guests.map(g => g.id === id ? { ...g, ...editForm } : g));
            setEditingId(null);
            setEditForm({});
            setSuccessMessage('✏️ Guest updated successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            alert('Error updating guest: ' + error.message);
        }
    };

    const downloadExcel = () => {
        if (!guests?.length) { alert("No RSVPs to download."); return; }

        const excelData = guests.map(row => ({
            "Name": row.name,
            "Email": row.email,
            "Phone": row.phone,
            "Attending": row.attending,
            "Number of Guests": row.guests_count,
            "RSVP Date": new Date(row.created_at).toLocaleDateString()
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        ws['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
        const eventName = `${wedding.child_name}_Birthday`;
        XLSX.writeFile(wb, `RSVPs_${eventName.replace(/\s+/g, '_')}.xlsx`);
    };

    const handleSendRemindersNow = async () => {
        const approvedGuests = guests.filter(g => (g.status === 'approved' || !g.status) && g.email);
        if (!approvedGuests.length) { alert("No approved guests with email addresses found."); return; }
        if (!window.confirm(`Send an immediate reminder to all ${approvedGuests.length} approved guests?`)) return;

        setSendingReminders(true);
        let sentCount = 0, failCount = 0;

        try {
            for (const guest of approvedGuests) {
                const birthdayName = wedding.child_name.replace(/['']s\s+Birthday$/i, '');
                const templateParams = {
                    to_name: guest.name,
                    wedding_name: birthdayName,
                    event_type: 'birthday',
                    event_date: `${new Date(wedding.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${(() => {
                        if (!wedding.time) return 'TBA';
                        const [h, m] = wedding.time.split(':');
                        const hrs = parseInt(h, 10);
                        const ampm = hrs >= 12 ? 'PM' : 'AM';
                        const h12 = hrs % 12 || 12;
                        return `${h12}:${m} ${ampm}`;
                    })()}`,
                    venue: wedding.venue_name || 'TBA',
                    location: wedding.venue_address || '',
                    message: `This is a friendly reminder that the birthday celebration of ${birthdayName} is coming up! We're so excited to celebrate with you. Please be ready and we can't wait to see you there!`,
                    link: `${window.location.origin}/b/${slug}`,
                    title: `${birthdayName}'s Birthday Celebration`,
                    subtitle: "Event Reminder",
                    action_text: "View Invitation & Details",
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
                        subject: `Reminder: ${birthdayName}'s Birthday Celebration`,
                        html: htmlContent
                    });
                    sentCount++;
                    if (approvedGuests.length > 5) await new Promise(r => setTimeout(r, 400));
                } catch (e) {
                    console.error(`Failed to email ${guest.email}`, e);
                    failCount++;
                }
            }

            setSuccessMessage(`🔔 Sent reminders to ${sentCount} guests${failCount > 0 ? ` (${failCount} failed)` : ''}!`);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            alert("Error sending reminders: " + error.message);
        } finally {
            setSendingReminders(false);
        }
    };

    const q = searchQuery.toLowerCase();
    const isDeclined = (g) => {
        const a = String(g.attending ?? '').toLowerCase();
        return g.attending === false || a === 'no' || a === 'declined';
    };

    const filteredGuests = guests.filter(g => {
        if (isDeclined(g)) return false;
        return !q || g.name?.toLowerCase().includes(q) || g.email?.toLowerCase().includes(q) || g.phone?.toLowerCase().includes(q);
    });
    
    const filteredPending = pendingGuests.filter(g =>
        !q || g.name?.toLowerCase().includes(q) || g.email?.toLowerCase().includes(q)
    );
    const attendingCount = guests.filter(isAttending).length;
    const declinedCount = guests.filter(isDeclined).length;
    const totalSeats = guests.reduce((s, g) => isDeclined(g) ? s : s + 1 + (parseInt(g.guests_count) || 0), 0);

    const eventTitle = wedding?.child_name?.includes('Birthday')
        ? wedding.child_name
        : `${wedding?.child_name}'s Birthday`;

    if (loading) return (
        <div className="rr-page">
            <div className="rr-loading">
                <div className="rr-spinner"></div>
                <p>Loading report…</p>
            </div>
            <style>{`
                .rr-page { min-height:100vh; background:#dde1e7; display:flex; align-items:center; justify-content:center; font-family:'Inter',sans-serif; }
                .rr-loading { display:flex; flex-direction:column; align-items:center; gap:1rem; }
                .rr-spinner { width:44px; height:44px; border:4px solid rgba(163,230,53,0.2); border-top:4px solid #a3e635; border-radius:50%; animation:spin .9s linear infinite; }
                @keyframes spin { to { transform:rotate(360deg); } }
                .rr-loading p { color:#6b7280; font-size:.9rem; }
            `}</style>
        </div>
    );

    if (error) return (
        <div className="rr-page">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <i className="fas fa-exclamation-circle" style={{ fontSize: '3rem', color: '#ef4444', display: 'block', marginBottom: '1rem' }}></i>
                <h2 style={{ color: '#111', marginBottom: '.5rem' }}>Error Loading Report</h2>
                <p style={{ color: '#6b7280' }}>{error}</p>
            </div>
            <style>{`.rr-page{min-height:100vh;background:#dde1e7;display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;}`}</style>
        </div>
    );

    return (
        <div className="rr-page">

            {successMessage && (
                <div className="rr-toast">
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

            <div className="phone-shell">
                <div className="scroll-area">

                    <div className="hero">
                        <div className="hero-ring r1"></div>
                        <div className="hero-ring r2"></div>

                        <p className="hero-eyebrow">Your RSVPs</p>
                        <div className="hero-big-num">{guests.length + pendingGuests.length}</div>
                        <p className="hero-couple">{eventTitle}</p>
                        <p className="hero-meta">
                            <i className="far fa-calendar-alt"></i>&nbsp;
                            {new Date(wedding.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {wedding.venue_name && <>&nbsp;·&nbsp;<i className="fas fa-map-marker-alt"></i>&nbsp;{wedding.venue_name}</>}
                        </p>

                        <div className="hero-btns">
                            <button className="hbtn" onClick={() => setShowReminderModal(true)}>
                                <span className="hbtn-icon"><i className="fas fa-clock"></i></span>
                                <span className="hbtn-lbl">Schedule</span>
                            </button>
                            <button className="hbtn" onClick={handleSendRemindersNow} disabled={sendingReminders}>
                                <span className="hbtn-icon">
                                    <i className={`fas fa-${sendingReminders ? 'spinner fa-spin' : 'bell'}`}></i>
                                </span>
                                <span className="hbtn-lbl">Reminders</span>
                            </button>
                            <button className="hbtn hbtn-lime" onClick={downloadExcel}>
                                <span className="hbtn-icon"><i className="fas fa-file-excel"></i></span>
                                <span className="hbtn-lbl">Export</span>
                            </button>
                        </div>
                    </div>

                    <div className="content-pad">

                        <div className="stat-row">
                            <div className="stat-pill">
                                <span className="sp-num sp-green">{attendingCount}</span>
                                <span className="sp-lbl">Attending</span>
                            </div>
                            <div className="sp-sep"></div>
                            <div className="stat-pill">
                                <span className="sp-num sp-red">{declinedCount}</span>
                                <span className="sp-lbl">Declined</span>
                            </div>
                            <div className="sp-sep"></div>
                            <div className="stat-pill">
                                <span className="sp-num">{totalSeats}</span>
                                <span className="sp-lbl">Seats</span>
                            </div>
                            <div className="sp-sep"></div>
                            <div className="stat-pill">
                                <span className={`sp-num ${pendingGuests.length > 0 ? 'sp-amber' : ''}`}>{pendingGuests.length}</span>
                                <span className="sp-lbl">Pending</span>
                            </div>
                        </div>

                        <div className="search-wrap">
                            <i className="fas fa-search si"></i>
                            <input
                                className="search-inp"
                                type="text"
                                placeholder='Try "John Doe"'
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button className="search-clear" onClick={() => setSearchQuery('')}><i className="fas fa-times"></i></button>
                            )}
                        </div>

                        <div className="sec-hdr">
                            <span className="sec-title">Guest Activities</span>
                            <div className="sec-tabs">
                                <button
                                    className={`sec-tab ${activeTab === 'approved' ? 'sec-tab-on' : ''}`}
                                    onClick={() => setActiveTab('approved')}
                                >
                                    Approved
                                </button>
                                <button
                                    className={`sec-tab ${activeTab === 'pending' ? 'sec-tab-on' : ''}`}
                                    onClick={() => setActiveTab('pending')}
                                >
                                    Pending {pendingGuests.length > 0 && <span className="sec-badge">{pendingGuests.length}</span>}
                                </button>
                            </div>
                        </div>

                        <div className="guest-list">
                            {activeTab === 'pending' ? (
                                filteredPending.length === 0 ? (
                                    <div className="list-empty">
                                        <i className="fas fa-check-circle"></i>
                                        <p>{searchQuery ? 'No matches found' : 'No pending requests'}</p>
                                    </div>
                                ) : filteredPending.map(guest => (
                                    <div key={guest.id} className="g-row">
                                        <div className="g-avatar" style={{ background: getAvatarColor(guest.name) }}>
                                            {getInitials(guest.name)}
                                        </div>
                                        <div className="g-info">
                                            <span className="g-name">{guest.name}</span>
                                            <span className="g-sub">{guest.email}</span>
                                        </div>
                                        <div className="g-right">
                                            <span className={`g-status ${isAttending(guest) ? 'gs-yes' : 'gs-no'}`}>
                                                {attendingLabel(guest)}
                                            </span>
                                            <div className="g-acts">
                                                <button className="ga-approve" onClick={() => handleApprove(guest)} disabled={!!processingAction}>
                                                    {processingAction === `${guest.id}-approve`
                                                        ? <i className="fas fa-spinner fa-spin"></i>
                                                        : <><i className="fas fa-check"></i> Approve</>}
                                                </button>
                                                <button className="ga-del" onClick={() => handleDelete(guest.id, guest.name, true)} disabled={!!processingAction}>
                                                    {processingAction === `${guest.id}-delete`
                                                        ? <i className="fas fa-spinner fa-spin"></i>
                                                        : <i className="fas fa-times"></i>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                filteredGuests.length === 0 ? (
                                    <div className="list-empty">
                                        <i className="fas fa-users"></i>
                                        <p>{searchQuery ? 'No matches found' : 'No approved guests yet'}</p>
                                    </div>
                                ) : filteredGuests.map(guest => {
                                    const attending = isAttending(guest);
                                    return (
                                        <div key={guest.id} className={`g-row ${editingId === guest.id ? 'g-row-edit' : ''}`}>
                                            {editingId === guest.id ? (
                                                <div className="edit-form">
                                                    <input className="ef-inp" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
                                                    <input className="ef-inp" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" type="email" />
                                                    <input className="ef-inp" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone" />
                                                    <select className="ef-inp" value={editForm.attending} onChange={e => setEditForm({ ...editForm, attending: e.target.value })}>
                                                        <option value="Yes">Yes — Attending</option>
                                                        <option value="No">No — Declined</option>
                                                    </select>
                                                    <input className="ef-inp" value={editForm.guests_count} onChange={e => setEditForm({ ...editForm, guests_count: e.target.value })} placeholder="# Guests" type="number" min="1" />
                                                    <div className="ef-btns">
                                                        <button className="ga-approve" onClick={() => saveEdit(guest.id)}><i className="fas fa-check"></i> Save</button>
                                                        <button className="ga-del" onClick={cancelEdit}><i className="fas fa-times"></i></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="g-avatar" style={{ background: getAvatarColor(guest.name) }}>
                                                        {getInitials(guest.name)}
                                                    </div>
                                                    <div className="g-info">
                                                        <span className="g-name">{guest.name}</span>
                                                        <span className="g-sub">{guest.email || guest.phone}</span>
                                                    </div>
                                                    <div className="g-right">
                                                        <span className={`g-count ${attending ? 'gc-green' : 'gc-red'}`}>
                                                            +{guest.guests_count || 0}
                                                        </span>
                                                        <span className={`g-pct ${attending ? 'gp-green' : 'gp-red'}`}>
                                                            <i className={`fas fa-${attending ? 'check' : 'times'}`}></i>
                                                            &nbsp;{attending ? 'Attending' : 'Declined'}
                                                        </span>
                                                        <div className="g-acts">
                                                            <button className="ga-ico" onClick={() => startEdit(guest)} title="Edit">
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button className="ga-ico ga-amber" onClick={() => handleMoveToPending(guest)} disabled={!!processingAction} title="Move to Pending">
                                                                {processingAction === `${guest.id}-pending`
                                                                    ? <i className="fas fa-spinner fa-spin"></i>
                                                                    : <i className="fas fa-undo"></i>}
                                                            </button>
                                                            <button className="ga-ico ga-red" onClick={() => handleDelete(guest.id, guest.name, false)} disabled={!!processingAction} title="Delete">
                                                                {processingAction === `${guest.id}-delete`
                                                                    ? <i className="fas fa-spinner fa-spin"></i>
                                                                    : <i className="fas fa-trash"></i>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                    </div>
                </div>

                <nav className="btm-nav">
                    <button className={`bn-item ${activeTab === 'approved' ? 'bn-active' : ''}`} onClick={() => setActiveTab('approved')}>
                        <i className="fas fa-th-large"></i>
                        <span>Summary</span>
                    </button>
                    <button className={`bn-item ${activeTab === 'pending' ? 'bn-active' : ''}`} onClick={() => setActiveTab('pending')}>
                        <i className="fas fa-users"></i>
                        <span>Guests</span>
                        {pendingGuests.length > 0 && <span className="bn-badge">{pendingGuests.length}</span>}
                    </button>
                    <button className="bn-center" onClick={downloadExcel}>
                        <i className="fas fa-file-excel"></i>
                    </button>
                    <button className="bn-item" onClick={handleSendRemindersNow} disabled={sendingReminders}>
                        <i className={`fas fa-${sendingReminders ? 'spinner fa-spin' : 'bell'}`}></i>
                        <span>Remind</span>
                    </button>
                    <button className="bn-item" onClick={() => setShowReminderModal(true)}>
                        <i className="fas fa-cog"></i>
                        <span>Settings</span>
                    </button>
                </nav>

            </div>

            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

                .rr-page {
                    min-height: 100vh;
                    background: #d8dce3;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem 0;
                }

                .rr-toast {
                    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                    background: #12121c; color: #a3e635;
                    padding: .7rem 1.75rem; border-radius: 999px;
                    box-shadow: 0 12px 32px rgba(0,0,0,.3); z-index: 9999;
                    display: flex; align-items: center; gap: 8px;
                    font-weight: 600; font-size: .82rem;
                    animation: toastIn .35s cubic-bezier(.34,1.56,.64,1);
                    white-space: nowrap;
                }
                @keyframes toastIn {
                    from { transform: translate(-50%,-120%); opacity:0; }
                    to   { transform: translate(-50%,0);     opacity:1; }
                }

                .phone-shell {
                    width: 100%; max-width: 420px;
                    height: 90vh;
                    max-height: 860px;
                    min-height: 600px;
                    background: #f4f5f7;
                    border-radius: 44px;
                    overflow: hidden;
                    box-shadow: 0 32px 80px rgba(0,0,0,.22), 0 0 0 8px rgba(0,0,0,.07);
                    display: flex;
                    flex-direction: column;
                }

                .scroll-area {
                    flex: 1;
                    min-height: 0;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                }
                .scroll-area::-webkit-scrollbar { display: none; }

                .hero {
                    background: #12121c;
                    padding: 2.75rem 1.75rem 2.25rem;
                    position: relative; overflow: hidden; text-align: center;
                    flex-shrink: 0;
                }
                .hero-ring {
                    position: absolute; border-radius: 50%; pointer-events: none;
                    border: 38px solid rgba(255,255,255,.035);
                }
                .r1 { width:260px; height:260px; top:-85px; right:-65px; }
                .r2 { width:180px; height:180px; bottom:-55px; left:-45px; }
                .hero-eyebrow {
                    font-size:.7rem; font-weight:600; color:rgba(255,255,255,.38);
                    letter-spacing:.1em; text-transform:uppercase; margin-bottom:.35rem;
                    position:relative; z-index:1;
                }
                .hero-big-num {
                    font-size:4.75rem; font-weight:900; color:#fff;
                    letter-spacing:-.05em; line-height:1; margin-bottom:.45rem;
                    position:relative; z-index:1;
                }
                .hero-couple {
                    font-size:.95rem; font-weight:700; color:rgba(255,255,255,.82);
                    margin-bottom:.25rem; position:relative; z-index:1;
                }
                .hero-meta {
                    font-size:.72rem; color:rgba(255,255,255,.32);
                    margin-bottom:2rem; position:relative; z-index:1;
                }
                .hero-btns {
                    display:flex; justify-content:center; gap:1.75rem;
                    position:relative; z-index:1;
                }
                .hbtn {
                    display:flex; flex-direction:column; align-items:center; gap:.4rem;
                    background:none; border:none; cursor:pointer;
                }
                .hbtn-icon {
                    width:56px; height:56px; border-radius:18px;
                    background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.08);
                    display:flex; align-items:center; justify-content:center;
                    font-size:1.15rem; color:rgba(255,255,255,.82);
                    transition:all .2s ease;
                }
                .hbtn-lbl {
                    font-size:.68rem; font-weight:600; color:rgba(255,255,255,.42); letter-spacing:.02em;
                }
                .hbtn-lime .hbtn-icon {
                    background:#a3e635; color:#12121c; border-color:transparent;
                    box-shadow:0 6px 20px rgba(163,230,53,.4);
                }
                .hbtn-lime .hbtn-lbl { color:#a3e635; }
                .hbtn:hover .hbtn-icon { transform:translateY(-3px); }
                .hbtn:disabled .hbtn-icon { opacity:.45; }

                .content-pad {
                    background: #f4f5f7;
                    flex: 1;
                    padding: 1.2rem 1.2rem 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .stat-row {
                    background:#fff; border-radius:18px; padding:.95rem 1.1rem;
                    display:flex; align-items:center; justify-content:space-around;
                    box-shadow:0 2px 10px rgba(0,0,0,.06);
                }
                .stat-pill { display:flex; flex-direction:column; align-items:center; gap:.15rem; }
                .sp-sep { width:1px; height:30px; background:#e5e7eb; }
                .sp-num {
                    font-size:1.45rem; font-weight:900; color:#111;
                    letter-spacing:-.04em; line-height:1;
                }
                .sp-lbl { font-size:.62rem; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:.07em; }
                .sp-green { color:#16a34a; }
                .sp-red   { color:#dc2626; }
                .sp-amber { color:#d97706; }

                .search-wrap {
                    background:#fff; border-radius:14px;
                    display:flex; align-items:center; gap:.6rem;
                    padding:.82rem 1rem;
                    box-shadow:0 2px 8px rgba(0,0,0,.05);
                }
                .si { color:#9ca3af; font-size:.88rem; flex-shrink:0; }
                .search-inp {
                    border:none; background:transparent; outline:none;
                    font-size:.86rem; color:#374151; width:100%; font-family:inherit;
                }
                .search-inp::placeholder { color:#9ca3af; }
                .search-clear {
                    border:none; background:#f3f4f6; color:#6b7280;
                    width:22px; height:22px; border-radius:50%; cursor:pointer;
                    display:flex; align-items:center; justify-content:center; font-size:.65rem;
                    flex-shrink:0;
                }

                .sec-hdr {
                    display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.5rem;
                }
                .sec-title { font-size:.92rem; font-weight:800; color:#111; letter-spacing:-.01em; }
                .sec-tabs { display:flex; gap:.28rem; background:#e4e6ed; padding:.22rem; border-radius:10px; }
                .sec-tab {
                    padding:.3rem .65rem; border:none; background:transparent; border-radius:7px;
                    font-size:.7rem; font-weight:600; color:#6b7280; cursor:pointer; font-family:inherit;
                    display:flex; align-items:center; gap:.3rem; transition:all .18s; white-space:nowrap;
                }
                .sec-tab-on { background:#12121c; color:#a3e635; box-shadow:0 2px 6px rgba(0,0,0,.2); }
                .sec-tab:hover:not(.sec-tab-on) { background:rgba(255,255,255,.6); color:#374151; }
                .sec-badge {
                    background:#ef4444; color:#fff;
                    border-radius:999px; font-size:.58rem; padding:.05rem .35rem; font-weight:700;
                }

                .guest-list { display:flex; flex-direction:column; gap:.45rem; }

                .g-row {
                    background:#fff; border-radius:16px; padding:.8rem .95rem;
                    display:flex; align-items:center; gap:.8rem;
                    box-shadow:0 1px 5px rgba(0,0,0,.05); transition:transform .15s;
                }
                .g-row:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,.08); }
                .g-row-edit { background:#f0fdf4; align-items:stretch; }

                .g-avatar {
                    width:44px; height:44px; border-radius:14px; flex-shrink:0;
                    display:flex; align-items:center; justify-content:center;
                    font-size:.78rem; font-weight:800; color:#fff; letter-spacing:.03em;
                }
                .g-info { flex:1; min-width:0; }
                .g-name { display:block; font-size:.86rem; font-weight:700; color:#111; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                .g-sub  { display:block; font-size:.7rem; color:#9ca3af; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:.08rem; }
                .g-right { display:flex; flex-direction:column; align-items:flex-end; gap:.22rem; flex-shrink:0; }
                .g-count { font-size:.95rem; font-weight:900; letter-spacing:-.02em; }
                .gc-green { color:#15803d; }
                .gc-red   { color:#dc2626; }
                .g-pct { font-size:.67rem; font-weight:600; }
                .gp-green { color:#16a34a; }
                .gp-red   { color:#dc2626; }
                .g-status { font-size:.68rem; font-weight:700; padding:.2rem .6rem; border-radius:999px; }
                .gs-yes { background:#dcfce7; color:#15803d; }
                .gs-no  { background:#fee2e2; color:#b91c1c; }

                .g-acts { display:flex; gap:.28rem; margin-top:.15rem; }
                .ga-approve {
                    display:flex; align-items:center; gap:.28rem;
                    padding:.26rem .6rem; border:none; border-radius:8px;
                    background:#12121c; color:#a3e635; font-size:.68rem; font-weight:700;
                    cursor:pointer; font-family:inherit; transition:all .15s; white-space:nowrap;
                }
                .ga-approve:hover { background:#1e1e30; }
                .ga-approve:disabled { opacity:.45; cursor:not-allowed; }
                .ga-del {
                    width:28px; height:28px; border:none; border-radius:8px;
                    background:#fee2e2; color:#b91c1c; font-size:.7rem;
                    cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s;
                }
                .ga-del:hover { background:#ef4444; color:#fff; }
                .ga-del:disabled { opacity:.45; cursor:not-allowed; }
                .ga-ico {
                    width:27px; height:27px; border:none; border-radius:8px;
                    background:#f1f5f9; color:#374151; font-size:.7rem;
                    cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s;
                }
                .ga-ico:hover { background:#e2e8f0; }
                .ga-ico:disabled { opacity:.45; cursor:not-allowed; }
                .ga-amber { background:#fef3c7; color:#b45309; }
                .ga-amber:hover { background:#f59e0b; color:#fff; }
                .ga-red { background:#fee2e2; color:#b91c1c; }
                .ga-red:hover { background:#ef4444; color:#fff; }

                .edit-form { display:flex; flex-direction:column; gap:.38rem; width:100%; }
                .ef-inp {
                    padding:.42rem .6rem; border:1.5px solid #a3e635; border-radius:8px;
                    font-size:.78rem; font-family:inherit; outline:none; background:#f9fef0; color:#111;
                }
                .ef-inp:focus { border-color:#65a30d; box-shadow:0 0 0 3px rgba(163,230,53,.2); }
                .ef-btns { display:flex; gap:.35rem; margin-top:.1rem; }

                .list-empty {
                    background:#fff; border-radius:16px; padding:2.5rem 1rem;
                    text-align:center; box-shadow:0 1px 5px rgba(0,0,0,.05);
                }
                .list-empty i { font-size:2.25rem; color:#d1d5db; display:block; margin-bottom:.5rem; }
                .list-empty p { font-size:.82rem; color:#9ca3af; font-weight:500; }

                .btm-nav {
                    display: flex;
                    align-items: center;
                    justify-content: space-around;
                    background: #fff;
                    padding: .7rem 1rem 1.5rem;
                    border-top: 1px solid #f1f5f9;
                    flex-shrink: 0;
                    z-index: 10;
                }
                .bn-item {
                    display:flex; flex-direction:column; align-items:center; gap:.18rem;
                    border:none; background:none; cursor:pointer; color:#9ca3af;
                    font-size:.58rem; font-weight:600; font-family:inherit;
                    position:relative; transition:color .15s; padding:.3rem .5rem;
                }
                .bn-item i { font-size:1.12rem; }
                .bn-active { color:#12121c; }
                .bn-item:hover:not(.bn-center) { color:#374151; }
                .bn-item:disabled { opacity:.45; cursor:not-allowed; }
                .bn-center {
                    width:52px; height:52px; border-radius:50%; border:none;
                    background:#12121c; color:#a3e635; font-size:1.08rem;
                    cursor:pointer; display:flex; align-items:center; justify-content:center;
                    box-shadow:0 6px 20px rgba(0,0,0,.28); transition:all .2s;
                }
                .bn-center:hover { transform:scale(1.08); }
                .bn-badge {
                    position:absolute; top:-2px; right:-2px;
                    background:#ef4444; color:#fff;
                    font-size:.52rem; font-weight:800; border-radius:999px;
                    padding:1px 4px; min-width:14px; text-align:center;
                }

                @media (max-width: 480px) {
                    .rr-page { padding: 0; align-items: stretch; }
                    .phone-shell {
                        border-radius: 0;
                        box-shadow: none;
                        max-width: 100%;
                        width: 100%;
                        height: 100vh;
                        max-height: 100vh;
                    }
                }
            `}</style>
        </div>
    );
};

export default BirthdayReport;
