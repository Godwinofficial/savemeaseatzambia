import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import * as XLSX from 'xlsx';

// Set browser theme-color to match hero header
const setThemeColor = (color) => {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.content = color;
};

import { getEmailTemplate } from '../../utils/emailTemplates';
import { sendEmail as sendEmailService } from '../../utils/emailService';
import { useSearchParams } from 'react-router-dom';
import QRScanner from '../../components/QRScanner';

const fallbackVendors = [
    {
        name: 'Glow by Sarah M.',
        category: 'Makeup',
        city: 'Lusaka',
        image: 'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=600',
        rating: '5.0 Verified',
        description: 'Top-rated makeup professional. One simple search.',
        portfolio: [{ type: 'image', url: 'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=600' }]
    },
    {
        name: 'Obelisk Photography',
        category: 'Photography',
        city: 'Lusaka',
        image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
        rating: '5.0 Verified',
        description: 'Top-rated photography professional. One simple search.',
        portfolio: [{ type: 'image', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80' }]
    },
    {
        name: 'Amethyst Decor Designs',
        category: 'Decor',
        city: 'Lusaka',
        image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=600&q=80',
        rating: '5.0 Verified',
        description: 'Top-rated decor professional. One simple search.',
        portfolio: [{ type: 'image', url: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=600&q=80' }]
    },
    {
        name: 'Lusaka Gourmet Caterers',
        category: 'Catering',
        city: 'Lusaka',
        image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
        rating: '5.0 Verified',
        description: 'Top-rated catering professional. One simple search.',
        portfolio: [{ type: 'image', url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80' }]
    },
    {
        name: 'The Savannah Pavilions',
        category: 'Venues',
        city: 'Lusaka',
        image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
        rating: '5.0 Verified',
        description: 'Top-rated venues professional. One simple search.',
        portfolio: [{ type: 'image', url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80' }]
    },
    {
        name: 'Lola Wedding Planners',
        category: 'Decor',
        city: 'Kitwe',
        image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80',
        rating: '5.0 Verified',
        description: 'Top-rated decor professional. One simple search.',
        portfolio: [{ type: 'image', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80' }]
    },
    {
        name: 'Zambia Sound & Stage Lights',
        category: 'Venues',
        city: 'Lusaka',
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
        rating: '5.0 Verified',
        description: 'Top-rated venues professional. One simple search.',
        portfolio: [{ type: 'image', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80' }]
    }
];

const AVATAR_COLORS = ['#4f46e5', '#0891b2', '#7c3aed', '#be185d', '#065f46', '#b45309', '#9f1239', '#1d4ed8'];

const getAvatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials = (name = '') => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

const TEMPLATE_THEMES = [
    {
        id: 1,
        name: 'Classic Elegance',
        tags: ['Classic', 'Minimal', 'Elegant'],
        description: 'Timeless black and white design with clean serif fonts and delicate dividers.',
        colors: ['#000000', '#ffffff', '#333333']
    },
    {
        id: 2,
        name: 'Tropical Elegance',
        tags: ['Tropical', 'Green', 'Gold'],
        description: 'Lush botanical frames with gold accents, perfect for outdoor or destination weddings.',
        colors: ['#cba052', '#f8fcf7', '#072417']
    },
    {
        id: 3,
        name: 'Golden Romance',
        tags: ['Elegant', 'Amber', 'Classic'],
        description: 'Luxurious amber and cream theme radiating warmth and sophisticated romance.',
        colors: ['#c8863b', '#fdfbf7', '#2c1e16']
    },
    {
        id: 7,
        name: 'Botanical Olive',
        tags: ['Olive', 'Earthy', 'Cursive'],
        description: 'Soft olive green leaves with fluid typography, creating a serene organic aesthetic.',
        colors: ['#606c38', '#fcfbf9', '#283618']
    },
    {
        id: 8,
        name: 'Terracotta Earth',
        tags: ['Terracotta', 'Linen', 'Watercolor'],
        description: 'Warm, earthy tones inspired by natural linen, pottery, and rustic landscapes.',
        colors: ['#d9745b', '#fdf8f5', '#5c2c1e']
    }
];

const RSVPReport = () => {
    const { slug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [wedding, setWedding] = useState(null);
    const [guests, setGuests] = useState([]);
    const [checkedInGuests, setCheckedInGuests] = useState([]);
    const [pendingGuests, setPendingGuests] = useState([]);
    const [activeTab, setActiveTab] = useState('approved');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [successMessage, setSuccessMessage] = useState(null);
    const [processingAction, setProcessingAction] = useState(null);
    const [sendingReminders, setSendingReminders] = useState(false);
    const [vendors, setVendors] = useState([]);
    const [selectedVendorFilter, setSelectedVendorFilter] = useState('all');
    const [activeVendor, setActiveVendor] = useState(null);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showQrScanner, setShowQrScanner] = useState(false);
    const [scannedGuest, setScannedGuest] = useState(null);
    const [scanMessage, setScanMessage] = useState(null);
    const weddingUrl = wedding?.slug ? `${window.location.origin}/w/${wedding.slug}` : '';

    const parseVendorPortfolio = (portfolio) => {
        if (!portfolio) return [];
        if (Array.isArray(portfolio)) return portfolio;
        if (typeof portfolio === 'string') {
            try {
                const parsed = JSON.parse(portfolio);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    };

    useEffect(() => {
        const prev = document.querySelector('meta[name="theme-color"]')?.content;
        setThemeColor('#12121c');
        return () => { if (prev) setThemeColor(prev); else setThemeColor('#ffffff'); };
    }, []);

    useEffect(() => {
        if (lightboxIndex === null || !activeVendor || !activeVendor.portfolio) return;
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') {
                setLightboxIndex(prev => prev < activeVendor.portfolio.length - 1 ? prev + 1 : 0);
            } else if (e.key === 'ArrowLeft') {
                setLightboxIndex(prev => prev > 0 ? prev - 1 : activeVendor.portfolio.length - 1);
            } else if (e.key === 'Escape') {
                setLightboxIndex(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, activeVendor]);

    useEffect(() => { fetchReportData(); }, [slug]);

    const fetchReportData = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            const { data: weddingData, error: weddingError } = await supabase
                .from('weddings')
                .select('*')
                .eq('slug', slug)
                .single();
            if (weddingError || !weddingData) throw new Error("Wedding not found");
            setWedding(weddingData);

            const { data: rsvps, error: rsvpError } = await supabase
                .from('rsvps')
                .select('*')
                .eq('wedding_id', weddingData.id)
                .order('created_at', { ascending: false });
            if (rsvpError) throw new Error("Error fetching RSVPs");

            const allGuests = rsvps || [];
            setGuests(allGuests.filter(g => (g.status === 'approved' || !g.status) && !g.checked_in));
            setCheckedInGuests(allGuests.filter(g => g.checked_in));
            setPendingGuests(allGuests.filter(g => g.status === 'pending'));


            try {
                const { data: vendorsData, error: vendorsError } = await supabase
                    .from('vendors').select('*').order('created_at', { ascending: true });
                if (!vendorsError && vendorsData?.length > 0) {
                    setVendors(vendorsData.map(vendor => ({
                        ...vendor,
                        portfolio: parseVendorPortfolio(vendor.portfolio)
                    })));
                } else {
                    setVendors(fallbackVendors);
                }
            } catch {
                setVendors(fallbackVendors);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            if (!isRefresh) setLoading(false);
        }
    };

    const sendEmail = async (guest, type) => {
        try {
            const isRemoval = type === 'removal';
            const templateParams = {
                to_name: guest.name,
                email: guest.email,
                message: isRemoval
                    ? "This change is final. It helps us maintain accurate numbers and comply with venue capacity."
                    : "Great news! Your RSVP has been confirmed. We have reserved your spot and look forward to celebrating with you.",
                wedding_name: `${wedding.groom_name} & ${wedding.bride_name}`,
                event_type: 'wedding',
                event_date: (() => {
                    if (!wedding.date) return 'TBA';
                    const date = new Date(wedding.date);
                    if (wedding.ceremony_time) {
                        const [h, m] = wedding.ceremony_time.split(':');
                        date.setHours(parseInt(h), parseInt(m), 0, 0);
                        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                    }
                    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                })(),
                venue: wedding.venue_name || 'Venue to be announced',
                location: wedding.location || '',
                link: `${window.location.origin}/w/${wedding.slug}`,
                title: isRemoval ? "You have been removed from the guest list" : "You are on the list! RSVP Confirmed",
                subtitle: isRemoval ? "Important Notice" : "You are on the list!",
                action_text: "View Details",
                theme_color: isRemoval ? "#b91c1c" : "#047857",
                light_theme_color: isRemoval ? "#f9fcff" : "#ecfdf5",
                status_badge_text: isRemoval ? "✔ action completed – removed" : "✔ action completed – confirmed",
                badge_bg_color: isRemoval ? "#fcede8" : "#ecfdf5",
                badge_text_color: isRemoval ? "#b53b30" : "#047857",
                alert_title: isRemoval ? "your RSVP has been removed" : "your RSVP is confirmed",
                alert_icon: isRemoval ? "⛔" : "✅",
                action_note: isRemoval ? 'no further action is needed from you' : 'see event details below',
                footer_text: isRemoval ? 'guest list control' : 'guest list update',
                footer_subtext: isRemoval ? 'this notice confirms removal. no response required.' : 'this notice is an automatic confirmation.'
            };
            const htmlContent = getEmailTemplate(templateParams);
            await sendEmailService({ to: guest.email, subject: templateParams.title, html: htmlContent });
        } catch (emailErr) {
            console.error("Email error", emailErr);
        }
    };

    const handleDelete = async (id, name, isPending = false) => {
        if (!window.confirm(`Remove "${name}" from the ${isPending ? 'pending' : 'guest'} list?`)) return;
        setProcessingAction(`${id}-delete`);
        try {
            const guest = isPending ? pendingGuests.find(g => g.id === id) : guests.find(g => g.id === id);
            const { error } = await supabase.from('rsvps').delete().eq('id', id);
            if (error) throw error;
            if (guest?.email) await sendEmail(guest, "removal");
            await fetchReportData(true);
            setSuccessMessage(`🗑️ ${name} removed successfully!`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            alert('Error removing guest: ' + error.message);
        } finally { setProcessingAction(null); }
    };

    const handleMoveToPending = async (guest) => {
        if (!window.confirm(`Move "${guest.name}" back to pending list?`)) return;
        setProcessingAction(`${guest.id}-pending`);
        try {
            const { error } = await supabase.from('rsvps').update({ status: 'pending' }).eq('id', guest.id);
            if (error) throw error;
            if (guest.email) await sendEmail(guest, 'removal');
            await fetchReportData(true);
            setSuccessMessage(`↩️ Moved ${guest.name} back to pending.`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            alert('Error moving guest: ' + error.message);
        } finally { setProcessingAction(null); }
    };

    const playBeepSound = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
        } catch (e) {
            console.error("Web Audio Beep failed:", e);
        }
    };

    const playWarningSound = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            [0, 0.12].forEach(delay => {
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(160, audioCtx.currentTime + delay);
                gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime + delay);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.1);

                oscillator.start(audioCtx.currentTime + delay);
                oscillator.stop(audioCtx.currentTime + delay + 0.1);
            });
        } catch (e) {
            console.error("Web Audio Buzz failed:", e);
        }
    };

    const handleApprove = async (guest) => {
        setProcessingAction(`${guest.id}-approve`);
        try {
            const { error } = await supabase.from('rsvps').update({ status: 'approved' }).eq('id', guest.id);
            if (error) throw error;
            if (guest.email) await sendEmail(guest, 'approval');
            await fetchReportData(true);
            setSuccessMessage(`✅ ${guest.name} approved successfully!`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            alert('Error approving guest: ' + error.message);
        } finally { setProcessingAction(null); }
    };

    const handleUndoCheckIn = async (guest) => {
        if (!window.confirm(`Undo check-in for "${guest.name}"?`)) return;
        setProcessingAction(`${guest.id}-undocheckin`);
        try {
            const { error } = await supabase
                .from('rsvps')
                .update({ checked_in: false, checked_in_at: null })
                .eq('id', guest.id);
            if (error) throw error;
            await fetchReportData(true);
            setSuccessMessage(`↩️ Undid check-in for ${guest.name}.`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            alert('Error undoing check-in: ' + error.message);
        } finally {
            setProcessingAction(null);
        }
    };

    const handleActivateTemplate = async (templateId) => {
        setProcessingAction(`template-${templateId}`);
        try {
            const { error } = await supabase
                .from('weddings')
                .update({ template_id: templateId })
                .eq('id', wedding.id);
            if (error) throw error;
            setWedding(prev => ({ ...prev, template_id: templateId }));
            setSuccessMessage("🎨 Theme activated successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            alert('Error updating template: ' + error.message);
        } finally {
            setProcessingAction(null);
        }
    };

    const startEdit = (guest) => {
        setEditingId(guest.id);
        setEditForm({ name: guest.name, email: guest.email, phone: guest.phone, attending: guest.attending, guests_count: guest.guests_count });
    };
    const cancelEdit = () => { setEditingId(null); setEditForm({}); };
    const saveEdit = async (id) => {
        try {
            const { error } = await supabase.from('rsvps').update(editForm).eq('id', id);
            if (error) throw error;
            setGuests(guests.map(g => g.id === id ? { ...g, ...editForm } : g));
            setEditingId(null);
            setEditForm({});
            setSuccessMessage('✏️ Guest updated successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) { alert('Error updating guest: ' + error.message); }
    };

    const downloadExcel = () => {
        if (!guests?.length) { alert("No RSVPs to download."); return; }
        const excelData = guests.map(row => ({
            "Name": row.name, "Email": row.email, "Phone": row.phone,
            "Attending": row.attending, "Number of Guests": row.guests_count,
            "RSVP Date": new Date(row.created_at).toLocaleDateString()
        }));
        const ws = XLSX.utils.json_to_sheet(excelData);
        ws['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
        XLSX.writeFile(wb, `RSVPs_${wedding.groom_name}_${wedding.bride_name}.xlsx`.replace(/\s+/g, '_'));
    };

    const handleSendRemindersNow = async () => {
        const currentCount = wedding?.manual_reminders_count || 0;
        if (currentCount >= 2) {
            alert("Limit reached: You have already sent 2 rounds of reminders.");
            return;
        }

        const approvedGuests = guests.filter(g => (g.status === 'approved' || !g.status) && g.email);
        if (!approvedGuests.length) { alert("No approved guests with email addresses found."); return; }
        
        const remaining = 2 - currentCount;
        const confirmMessage = `WARNING: You only have ${remaining} round${remaining === 1 ? '' : 's'} of sending reminders left. Users are strictly limited to 2 rounds to prevent email abuse.\n\nAre you sure you want to send reminders to all ${approvedGuests.length} approved guests now? This will consume 1 round.`;
        
        if (!window.confirm(confirmMessage)) return;

        setSendingReminders(true);
        let sentCount = 0, failCount = 0;
        try {
            for (const guest of approvedGuests) {
                const templateParams = {
                    to_name: guest.name, email: guest.email,
                    wedding_name: `${wedding.groom_name} & ${wedding.bride_name}`,
                    event_date: wedding.date ? new Date(wedding.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBA',
                    venue: wedding.venue_name || 'TBA', location: wedding.location || '',
                    message: `This is a friendly reminder that the celebration of ${wedding.groom_name} & ${wedding.bride_name} is coming up!`,
                    link: `${window.location.origin}/w/${wedding.slug}`,
                    title: `${wedding.groom_name} & ${wedding.bride_name} Celebration`,
                    subtitle: "Event Reminder", action_text: "View Invitation & Details",
                    theme_color: "#4f46e5", light_theme_color: "#eef2ff",
                    status_badge_text: "✔ event reminder", badge_bg_color: "#eef2ff",
                    badge_text_color: "#4f46e5", alert_title: "important reminder", alert_icon: "📅",
                    action_note: "see event details below", footer_text: "guest reminder system",
                    footer_subtext: "this is an automated reminder for your upcoming event."
                };
                try {
                    const htmlContent = getEmailTemplate(templateParams);
                    await sendEmailService({ to: guest.email, subject: `Reminder: ${wedding.groom_name} & ${wedding.bride_name} Celebration`, html: htmlContent });
                    sentCount++;
                    if (approvedGuests.length > 5) await new Promise(r => setTimeout(r, 400));
                } catch (e) { failCount++; }
            }

            const newCount = currentCount + 1;
            const { error: updateError } = await supabase
                .from('weddings')
                .update({ manual_reminders_count: newCount })
                .eq('id', wedding.id);

            if (!updateError) {
                setWedding(prev => ({ ...prev, manual_reminders_count: newCount }));
            }

            setSuccessMessage(`🔔 Sent reminders to ${sentCount} guests${failCount > 0 ? ` (${failCount} failed)` : ''}!`);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            alert("Error sending reminders: " + error.message);
        } finally { setSendingReminders(false); }
    };

    const formatDate = (ds) => new Date(ds).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    // ── FILTERED LISTS ──
    const q = searchQuery.toLowerCase();
    const filteredGuests = guests.filter(g =>
        !q || g.name?.toLowerCase().includes(q) || g.email?.toLowerCase().includes(q) || g.phone?.toLowerCase().includes(q)
    );
    const filteredCheckedIn = checkedInGuests.filter(g =>
        !q || g.name?.toLowerCase().includes(q) || g.email?.toLowerCase().includes(q) || g.phone?.toLowerCase().includes(q)
    );
    const filteredPending = pendingGuests.filter(g =>
        !q || g.name?.toLowerCase().includes(q) || g.email?.toLowerCase().includes(q)
    );
    const approvedAttending = guests.filter(g => g.attending?.toLowerCase() === 'yes' || g.attending?.toLowerCase() === 'attending').length;
    const checkedInAttending = checkedInGuests.filter(g => g.attending?.toLowerCase() === 'yes' || g.attending?.toLowerCase() === 'attending').length;
    const attendingCount = approvedAttending + checkedInAttending;
    const declinedCount = [...guests, ...checkedInGuests].filter(g => g.attending?.toLowerCase() === 'no' || g.attending?.toLowerCase() === 'declined').length;
    const totalSeats = [...guests, ...checkedInGuests].reduce((s, g) => s + (parseInt(g.guests_count) || 0), 0);

    // ── LOADING / ERROR ──
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

            {/* Toast */}
            {successMessage && (
                <div className="rr-toast">
                    <i className="fas fa-check-circle"></i> {successMessage}
                </div>
            )}



            {/* QR Scanner Modal - Full Screen */}
            {showQrScanner && (
                <div className="qr-fs-overlay">
                    {/* Top Header */}
                    <div className="qr-fs-header">
                        <div className="qr-fs-title">
                            <i className="fas fa-qrcode"></i>
                            <span>Scan Guest Pass</span>
                        </div>
                        <button className="qr-fs-close" onClick={() => { window.isProcessingScan = false; setScanMessage(null); setShowQrScanner(false); }}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    {/* Camera Viewfinder */}
                    <div className="qr-fs-camera">
                        <QRScanner
                            onScan={async (detectedCodes) => {
                                const rawCode = detectedCodes[0]?.rawValue;
                                if (rawCode && !window.isProcessingScan) {
                                    window.isProcessingScan = true;
                                    setScanMessage(`Scanning code...`);
                                    try {
                                        let code = rawCode;
                                        let embeddedData = null;
                                        if (rawCode.startsWith('{')) {
                                            try {
                                                const parsed = JSON.parse(rawCode);
                                                code = parsed.id;
                                                embeddedData = parsed;
                                                setScanMessage(`✅ Decoded pass for ${parsed.name}`);
                                            } catch (e) {
                                                // Not valid JSON, fallback to raw string
                                            }
                                        }

                                        const isNumericId = /^\d+$/.test(String(code));
                                        let data = null;
                                        let error = null;
                                        if (isNumericId) {
                                            const result = await supabase.from('rsvps').select('*').eq('id', code).eq('wedding_id', wedding.id).single();
                                            data = result.data;
                                            error = result.error;
                                        } else {
                                            error = new Error('Skipping DB lookup for non-numeric pass ID');
                                        }

                                        let guestRecord = data;
                                        let isFallback = false;
                                        if (error || !data) {
                                            console.error("DB lookup fail or skipped, checking embedded data:", error);
                                            if (embeddedData && embeddedData.wedding_id === wedding.id) {
                                                guestRecord = { id: embeddedData.id, name: embeddedData.name, email: embeddedData.email, phone: embeddedData.phone, guests_count: embeddedData.guests_count || 1, wedding_id: embeddedData.wedding_id, checked_in: false };
                                                isFallback = true;
                                            }
                                        }

                                        if (!guestRecord) {
                                            playWarningSound();
                                            setScanMessage("❌ Invalid or not found in this guest list.");
                                            setTimeout(() => { window.isProcessingScan = false; }, 2500);
                                            return;
                                        }

                                        const localCheckedIn = checkedInGuests.some(g => g.id === guestRecord.id);
                                        const isAlreadyCheckedIn = localCheckedIn || guestRecord.checked_in;

                                        if (isAlreadyCheckedIn) {
                                            playWarningSound();
                                            setScanMessage("❌ Already Checked In!");
                                            setScannedGuest({ ...guestRecord, checked_in: true });
                                            return;
                                        }

                                        playBeepSound();
                                        setScanMessage("✅ Guest Found!");
                                        setScannedGuest(guestRecord);
                                    } catch (err) {
                                        console.error("Scanning Error:", err);
                                        setScanMessage("❌ Error checking database.");
                                        setTimeout(() => { window.isProcessingScan = false; }, 2500);
                                    }
                                }
                            }}
                            onError={(e) => console.error("Scanner Error:", e)}
                        />
                    </div>

                    {/* Status bar */}
                    {scanMessage && (
                        <div className="qr-fs-status">{scanMessage}</div>
                    )}

                    {/* Bottom hint */}
                    <div className="qr-fs-hint">
                        <i className="fas fa-camera"></i>
                        Point the camera at a guest's QR code pass
                    </div>
                </div>
            )}

            {/* Scanned Guest Confirmation Modal */}
            {scannedGuest && (
                <div className="vm-overlay" style={{ zIndex: 3100 }} onClick={() => { window.isProcessingScan = false; setScannedGuest(null); }}>
                    <div className="vm-box" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: scannedGuest.checked_in ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                            <i className={`fas fa-${scannedGuest.checked_in ? 'exclamation' : 'check'}`} style={{ fontSize: '32px', color: '#fff' }}></i>
                        </div>
                        <h4 className="vm-name" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{scannedGuest.name}</h4>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                            {scannedGuest.email}<br />
                            {scannedGuest.phone}<br />
                            {scannedGuest.guests_count > 0 && <span style={{ display: 'inline-block', marginTop: '0.5rem', background: '#e0e7ff', color: '#4f46e5', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>{scannedGuest.guests_count} {scannedGuest.guests_count === 1 ? 'Guest' : 'Guests'}</span>}
                        </p>

                        {scannedGuest.checked_in ? (
                            <div style={{ background: '#fef3c7', color: '#b45309', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '500' }}>
                                This guest has ALREADY checked in.
                            </div>
                        ) : (
                            <button
                                className="ga-approve"
                                style={{ width: '100%', padding: '1rem', background: '#10b981', color: '#fff', fontSize: '1rem', justifyContent: 'center', marginBottom: '1rem' }}
                                onClick={async () => {
                                    try {
                                        // Try updating both checked_in and checked_in_at
                                        let { error: updateError } = await supabase
                                            .from('rsvps')
                                            .update({ checked_in: true, checked_in_at: new Date().toISOString() })
                                            .eq('id', scannedGuest.id);

                                        // Safe fallback if column doesn't exist yet
                                        if (updateError && (updateError.message.includes('column') || updateError.code === '42703')) {
                                            const { error: fallbackError } = await supabase
                                                .from('rsvps')
                                                .update({ checked_in: true })
                                                .eq('id', scannedGuest.id);
                                            updateError = fallbackError;
                                        }

                                        if (updateError) throw updateError;
                                        setSuccessMessage(`Checked in ${scannedGuest.name} successfully!`);
                                        setTimeout(() => setSuccessMessage(null), 3000);
                                        fetchReportData(true);
                                        window.isProcessingScan = false;
                                        setScannedGuest(null);
                                    } catch (err) {
                                        alert("Error updating status: " + err.message);
                                    }
                                }}
                            >
                                Confirm Check-In
                            </button>
                        )}

                        <button onClick={() => { window.isProcessingScan = false; setScannedGuest(null); }} className="ga-reject" style={{ width: '100%', padding: '1rem', background: '#f1f5f9', color: '#475569', fontSize: '1rem', justifyContent: 'center' }}>
                            {scannedGuest.checked_in ? 'Scan Next' : 'Cancel & Scan Next'}
                        </button>
                    </div>
                </div>
            )}

            {/* Vendor Detail Modal */}
            {activeVendor && (
                <div className="vm-overlay" onClick={() => setActiveVendor(null)}>
                    <div className="vm-box" onClick={e => e.stopPropagation()}>
                        <div className="vm-cover">
                            <img src={activeVendor.image} alt={activeVendor.name} />
                            <button className="vm-close" onClick={() => setActiveVendor(null)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="vm-body">
                            <h3 className="vm-name">{activeVendor.name}</h3>
                            <div className="vm-tags">
                                <span className="vm-tag vm-tag-green"><i className="fas fa-tag"></i> {activeVendor.category}</span>
                                <span className="vm-tag vm-tag-gray"><i className="fas fa-map-marker-alt"></i> {activeVendor.city}</span>
                                <span className="vm-tag vm-tag-amber"><i className="fas fa-star"></i> {activeVendor.rating?.split(' ')[0] || '5.0'}</span>
                            </div>
                            <p className="vm-desc">{activeVendor.description || `Top-rated ${activeVendor.category} professional in ${activeVendor.city}.`}</p>

                            {activeVendor.portfolio && activeVendor.portfolio.length > 0 && (
                                <div style={{ marginTop: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#111' }}>Sample Work</h4>
                                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{activeVendor.portfolio.length} item(s)</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem' }}>
                                        {activeVendor.portfolio.map((item, idx) => (
                                            <div
                                                key={`${item.url}-${idx}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setLightboxIndex(idx);
                                                }}
                                                style={{
                                                    position: 'relative',
                                                    borderRadius: '16px',
                                                    overflow: 'hidden',
                                                    minHeight: '100px',
                                                    background: '#f8fafc',
                                                    border: '1px solid #e5e7eb',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {item.type === 'video' ? (
                                                    <video
                                                        src={item.url}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        muted
                                                        playsInline
                                                        controls={false}
                                                    />
                                                ) : (
                                                    <img
                                                        src={item.url}
                                                        alt={`Sample work ${idx + 1}`}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                )}
                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.5rem', background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)', color: '#fff', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span>{item.type === 'video' ? 'Video' : 'Image'}</span>
                                                    <span style={{ opacity: 0.85 }}>{idx + 1}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {lightboxIndex !== null && activeVendor && activeVendor.portfolio && activeVendor.portfolio[lightboxIndex] && (
                <div
                    onClick={() => setLightboxIndex(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(10, 10, 12, 0.95)',
                        backdropFilter: 'blur(15px)',
                        zIndex: 4500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        userSelect: 'none'
                    }}
                >
                    <button
                        onClick={() => setLightboxIndex(null)}
                        style={{
                            position: 'absolute',
                            top: '25px',
                            right: '25px',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            fontSize: '1.25rem',
                            color: '#fff',
                            cursor: 'pointer',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >
                        <i className="fas fa-times"></i>
                    </button>

                    {activeVendor.portfolio.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(prev => prev > 0 ? prev - 1 : activeVendor.portfolio.length - 1);
                            }}
                            style={{
                                position: 'absolute',
                                left: '25px',
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                fontSize: '1.25rem',
                                color: '#fff',
                                cursor: 'pointer',
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                    )}

                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '90%',
                            maxHeight: '80vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}
                    >
                        {activeVendor.portfolio[lightboxIndex].type === 'video' ? (
                            <video
                                src={activeVendor.portfolio[lightboxIndex].url}
                                controls
                                autoPlay
                                playsInline
                                style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                            />
                        ) : (
                            <img
                                src={activeVendor.portfolio[lightboxIndex].url}
                                alt={`Work preview ${lightboxIndex}`}
                                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                            />
                        )}
                    </div>

                    {activeVendor.portfolio.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(prev => prev < activeVendor.portfolio.length - 1 ? prev + 1 : 0);
                            }}
                            style={{
                                position: 'absolute',
                                right: '25px',
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                fontSize: '1.25rem',
                                color: '#fff',
                                cursor: 'pointer',
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    )}

                    <div style={{
                        position: 'absolute',
                        bottom: '30px',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        fontSize: '0.85rem',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        {lightboxIndex + 1} / {activeVendor.portfolio.length}
                    </div>
                </div>
            )}

            {/* ── PHONE SHELL ── */}
            <div className="phone-shell">

                {/* ONE scrollable area: hero + all content together */}
                <div className="scroll-area">

                    {/* ─── DARK HERO ─── */}
                    <div className="hero">
                        <div className="hero-ring r1"></div>
                        <div className="hero-ring r2"></div>

                        <p className="hero-eyebrow">Your RSVPs</p>
                        <div className="hero-big-num">{guests.length + pendingGuests.length}</div>
                        <p className="hero-couple">{wedding.bride_name} & {wedding.groom_name} </p>
                        <p className="hero-meta">
                            <i className="far fa-calendar-alt"></i>&nbsp;
                            {new Date(wedding.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {wedding.venue_name && <>&nbsp;·&nbsp;<i className="fas fa-map-marker-alt"></i>&nbsp;{wedding.venue_name}</>}
                        </p>

                        {/* Action Buttons */}
                        <div className="hero-btns">
                            {weddingUrl && (
                                <a
                                    href={weddingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hbtn"
                                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <span className="hbtn-icon"><i className="fas fa-external-link-alt"></i></span>
                                    <span className="hbtn-lbl">Visit Page</span>
                                </a>
                            )}
                            <button className="hbtn hbtn-lime" onClick={downloadExcel}>
                                <span className="hbtn-icon"><i className="fas fa-file-excel"></i></span>
                                <span className="hbtn-lbl">Export</span>
                            </button>
                            <button className="hbtn" onClick={() => { window.isProcessingScan = false; setScanMessage(null); setShowQrScanner(true); }}>
                                <span className="hbtn-icon"><i className="fas fa-qrcode"></i></span>
                                <span className="hbtn-lbl">Scan Pass</span>
                            </button>
                        </div>
                    </div>

                    {/* ─── WHITE CONTENT ─── */}
                    <div className="content-pad">

                        {activeTab === 'templates' ? (
                            <div className="templates-section">
                                <div className="templates-hdr">
                                    <h3 className="templates-title">Invitation Themes</h3>
                                    <p className="templates-subtitle">Preview and activate a premium layout for your wedding invitation</p>
                                </div>
                                <div className="templates-list">
                                    {TEMPLATE_THEMES.map(theme => {
                                        const isActive = (wedding?.template_id?.toString() || '1') === theme.id.toString();
                                        return (
                                            <div key={theme.id} className={`theme-card ${isActive ? 'theme-card-active' : ''}`}>
                                                <div className="theme-card-body">
                                                    <div className="theme-card-header">
                                                        <div className="theme-card-title-row">
                                                            <h4 className="theme-card-name">{theme.name}</h4>
                                                            {isActive && <span className="theme-badge-active">✔ Active</span>}
                                                        </div>
                                                        <div className="theme-tags">
                                                            {theme.tags.map(tag => (
                                                                <span key={tag} className="theme-tag">{tag}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    <p className="theme-desc">{theme.description}</p>
                                                    
                                                    <div className="theme-palette">
                                                        {theme.colors.map(color => (
                                                            <div 
                                                                key={color} 
                                                                className="theme-color-swatch" 
                                                                style={{ backgroundColor: color }} 
                                                                title={color}
                                                            />
                                                        ))}
                                                    </div>
                                                    
                                                    <div className="theme-actions">
                                                        <a 
                                                            href={`${window.location.origin}/w/${wedding.slug}?template=${theme.id}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="theme-btn-preview"
                                                        >
                                                            <i className="fas fa-eye"></i> Live Preview
                                                        </a>
                                                        {!isActive && (
                                                            <button 
                                                                onClick={() => handleActivateTemplate(theme.id)} 
                                                                className="theme-btn-activate"
                                                                disabled={!!processingAction}
                                                            >
                                                                {processingAction === `template-${theme.id}` ? (
                                                                    <i className="fas fa-spinner fa-spin"></i>
                                                                ) : (
                                                                    <><i className="fas fa-check"></i> Activate</>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Stat pills */}
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

                                {/* Reminder Status Card */}
                                <div className="reminder-status-card">
                                    <div className="rsc-left">
                                        <i className="fas fa-bell rsc-icon"></i>
                                        <div className="rsc-info">
                                            <span className="rsc-title">Guest Email Reminders</span>
                                            <span className="rsc-desc">Limit: 2 rounds of manual reminders</span>
                                        </div>
                                    </div>
                                    <div className="rsc-badge">
                                        {2 - (wedding?.manual_reminders_count || 0)} left
                                    </div>
                                </div>

                                {/* Search */}
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

                                {/* Section header */}
                                <div className="sec-hdr">
                                    <span className="sec-title"> Activities</span>
                                    <div className="sec-tabs">
                                        <button
                                            className={`sec-tab ${activeTab === 'approved' ? 'sec-tab-on' : ''}`}
                                            onClick={() => setActiveTab('approved')}
                                        >
                                            Approved
                                        </button>
                                        <button
                                            className={`sec-tab ${activeTab === 'checked_in' ? 'sec-tab-on' : ''}`}
                                            onClick={() => setActiveTab('checked_in')}
                                        >
                                            Checked In {checkedInGuests.length > 0 && <span className="sec-badge sec-badge-green">{checkedInGuests.length}</span>}
                                        </button>
                                        <button
                                            className={`sec-tab ${activeTab === 'pending' ? 'sec-tab-on' : ''}`}
                                            onClick={() => setActiveTab('pending')}
                                        >
                                            Pending {pendingGuests.length > 0 && <span className="sec-badge">{pendingGuests.length}</span>}
                                        </button>
                                    </div>
                                </div>

                                {/* ─── GUEST ROWS ─── */}
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
                                                    <span className={`g-status ${guest.attending?.toLowerCase() === 'yes' ? 'gs-yes' : 'gs-no'}`}>
                                                        {guest.attending}
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
                                    ) : activeTab === 'checked_in' ? (
                                        filteredCheckedIn.length === 0 ? (
                                            <div className="list-empty">
                                                <i className="fas fa-qrcode"></i>
                                                <p>{searchQuery ? 'No matches found' : 'No checked-in guests yet'}</p>
                                            </div>
                                        ) : filteredCheckedIn.map(guest => (
                                            <div key={guest.id} className="g-row">
                                                <div className="g-avatar" style={{ background: getAvatarColor(guest.name) }}>
                                                    {getInitials(guest.name)}
                                                </div>
                                                <div className="g-info">
                                                    <span className="g-name">{guest.name}</span>
                                                    <span className="g-sub">{guest.email || guest.phone}</span>
                                                </div>
                                                <div className="g-right">
                                                    <span className="g-count gc-green">
                                                        +{guest.guests_count || 0}
                                                    </span>
                                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                                        <span className="g-pct gp-green" style={{ margin: 0 }}>
                                                            <i className="fas fa-check-circle"></i> Checked In
                                                        </span>
                                                        {guest.checked_in_at && (
                                                            <span style={{ fontSize: '0.62rem', color: '#6b7280' }}>
                                                                {new Date(guest.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="g-acts">
                                                        <button className="ga-ico ga-amber" onClick={() => handleUndoCheckIn(guest)} disabled={!!processingAction} title="Undo Check-In">
                                                            {processingAction === `${guest.id}-undocheckin`
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
                                            </div>
                                        ))
                                    ) : (
                                        filteredGuests.length === 0 ? (
                                            <div className="list-empty">
                                                <i className="fas fa-users"></i>
                                                <p>{searchQuery ? 'No matches found' : 'No approved guests yet'}</p>
                                            </div>
                                        ) : filteredGuests.map(guest => {
                                            const isAttending = guest.attending?.toLowerCase() === 'yes' || guest.attending?.toLowerCase() === 'attending';
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
                                                                <span className={`g-count ${isAttending ? 'gc-green' : 'gc-red'}`}>
                                                                    +{guest.guests_count || 0}
                                                                </span>
                                                                <span className={`g-pct ${isAttending ? 'gp-green' : 'gp-red'}`}>
                                                                    <i className={`fas fa-${isAttending ? 'check' : 'times'}`}></i>
                                                                    &nbsp;{isAttending ? 'Attending' : 'Declined'}
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

                                {/* ─── VENDORS ─── */}
                                <div className="sec-hdr" style={{ marginTop: '1.5rem' }}>
                                    <span className="sec-title">Featured Vendors</span>
                                    <div className="sec-tabs" style={{ flexWrap: 'wrap' }}>
                                        {['all', 'Makeup', 'Photography', 'Decor', 'Catering', 'Venues'].map(cat => (
                                            <button
                                                key={cat}
                                                className={`sec-tab ${selectedVendorFilter === cat ? 'sec-tab-on' : ''}`}
                                                onClick={() => setSelectedVendorFilter(cat)}
                                            >
                                                {cat === 'all' ? 'All' : cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="vendor-list">
                                    {vendors
                                        .filter(v => selectedVendorFilter === 'all' || v.category === selectedVendorFilter)
                                        .map((vendor, idx) => (
                                            <div key={idx} className="v-row" onClick={() => setActiveVendor(vendor)}>
                                                <img src={vendor.image} alt={vendor.name} className="v-thumb" />
                                                <div className="v-info">
                                                    <span className="v-name">{vendor.name}</span>
                                                    <span className="v-sub">{vendor.category} · {vendor.city}</span>
                                                </div>
                                                <div className="v-right">
                                                    <span className="v-rating"><i className="fas fa-star"></i> {vendor.rating?.split(' ')[0] || '5.0'}</span>
                                                    <span className="v-cta">View <i className="fas fa-chevron-right"></i></span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </>
                        )}

                    </div>{/* end content-pad */}
                </div>{/* end scroll-area */}

                {/* ─── BOTTOM NAV ─── (outside scroll, always at bottom) */}
                <nav className="btm-nav">
                    <button className={`bn-item ${activeTab === 'approved' || activeTab === 'checked_in' ? 'bn-active' : ''}`} onClick={() => setActiveTab('approved')}>
                        <i className="fas fa-th-large"></i>
                        <span>Summary</span>
                    </button>
                    <button className={`bn-item ${activeTab === 'pending' ? 'bn-active' : ''}`} onClick={() => setActiveTab('pending')}>
                        <i className="fas fa-users"></i>
                        <span>Guests</span>
                        {pendingGuests.length > 0 && <span className="bn-badge">{pendingGuests.length}</span>}
                    </button>
                    <button className={`bn-item ${activeTab === 'templates' ? 'bn-active' : ''}`} onClick={() => setActiveTab('templates')}>
                        <i className="fas fa-palette"></i>
                        <span>Themes</span>
                    </button>
                    <button className="bn-item" onClick={handleSendRemindersNow} disabled={sendingReminders || (wedding?.manual_reminders_count || 0) >= 2}>
                        <i className={`fas fa-${sendingReminders ? 'spinner fa-spin' : 'bell'}`}></i>
                        <span>Remind ({2 - (wedding?.manual_reminders_count || 0)} left)</span>
                    </button>
                </nav>

            </div>{/* end phone-shell */}

            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

                /* PAGE */
                .rr-page {
                    min-height: 100vh;
                    background: #d8dce3;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem 0;
                }

                /* TOAST */
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

                /* VENDOR MODAL */
                .vm-overlay {
                    position: fixed; inset: 0;
                    background: rgba(0,0,0,.75); backdrop-filter: blur(10px);
                    z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 1.5rem;
                }
                .vm-box {
                    background: #fff; border-radius: 24px; max-width: 400px; width: 100%;
                    max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;
                    box-shadow: 0 30px 60px rgba(0,0,0,.45);
                }
                .vm-cover { position: relative; height: 190px; flex-shrink: 0; }
                .vm-cover img { width:100%; height:100%; object-fit:cover; }
                .vm-close {
                    position: absolute; top:12px; right:12px; width:30px; height:30px;
                    border-radius:50%; border:none; background:rgba(0,0,0,.55); color:#fff;
                    cursor:pointer; font-size:.82rem; display:flex; align-items:center; justify-content:center;
                }
                .vm-body { padding: 1.2rem; overflow-y:auto; }
                .vm-name { font-size:1.25rem; font-weight:800; color:#111; margin-bottom:.55rem; }
                .vm-tags { display:flex; flex-wrap:wrap; gap:.35rem; margin-bottom:.7rem; }
                .vm-tag { font-size:.7rem; font-weight:700; padding:3px 10px; border-radius:999px; display:inline-flex; align-items:center; gap:4px; }
                .vm-tag-green { background:rgba(16,185,129,.1); color:#047857; }
                .vm-tag-gray  { background:#f3f4f6; color:#374151; }
                .vm-tag-amber { background:rgba(234,179,8,.1); color:#b45309; }
                .vm-desc { font-size:.86rem; color:#6b7280; line-height:1.55; }

                /* ── Full-Screen QR Scanner ── */
                .qr-fs-overlay {
                    position: fixed; inset: 0;
                    background: #000;
                    z-index: 9998;
                    display: flex; flex-direction: column;
                }
                .qr-fs-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 1rem 1.25rem;
                    background: rgba(0,0,0,.85);
                    backdrop-filter: blur(10px);
                    flex-shrink: 0; z-index: 2;
                }
                .qr-fs-title {
                    display: flex; align-items: center; gap: .6rem;
                    color: #a3e635; font-size: 1rem; font-weight: 700;
                }
                .qr-fs-title i { font-size: 1.2rem; }
                .qr-fs-close {
                    width: 38px; height: 38px; border-radius: 50%; border: none;
                    background: rgba(255,255,255,.12); color: #fff; font-size: 1rem;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    transition: background .15s;
                }
                .qr-fs-close:hover { background: rgba(255,255,255,.25); }
                .qr-fs-camera {
                    flex: 1; min-height: 0;
                    display: flex; align-items: center; justify-content: center;
                    overflow: hidden; background: #000;
                }
                .qr-fs-camera > div,
                .qr-fs-camera > div > video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
                .qr-fs-status {
                    padding: .9rem 1.5rem;
                    background: rgba(0,0,0,.88); color: #fff;
                    font-size: .9rem; font-weight: 600;
                    text-align: center; flex-shrink: 0; z-index: 2;
                }
                .qr-fs-hint {
                    padding: .7rem 1rem 1.5rem;
                    background: rgba(0,0,0,.85);
                    color: rgba(255,255,255,.5);
                    font-size: .75rem; font-weight: 500;
                    text-align: center; flex-shrink: 0; z-index: 2;
                    display: flex; align-items: center; justify-content: center; gap: .45rem;
                }

                /* PHONE SHELL — fixed height, two children: scroll-area + btm-nav */
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

                /* SCROLL AREA — hero + content scroll together */
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

                /* HERO — dark top section inside scroll-area */
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
                /* ACTION BUTTONS */
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

                /* WHITE CONTENT PADDING */
                .content-pad {
                    background: #f4f5f7;
                    flex: 1;
                    padding: 1.2rem 1.2rem 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                /* STAT ROW */
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

                /* SEARCH */
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

                /* SECTION HEADER */
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
                .sec-badge-green {
                    background:#10b981; color:#fff;
                    border-radius:999px; font-size:.58rem; padding:.05rem .35rem; font-weight:700;
                }

                /* GUEST LIST */
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

                /* Action buttons */
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

                /* Edit form */
                .edit-form { display:flex; flex-direction:column; gap:.38rem; width:100%; }
                .ef-inp {
                    padding:.42rem .6rem; border:1.5px solid #a3e635; border-radius:8px;
                    font-size:.78rem; font-family:inherit; outline:none; background:#f9fef0; color:#111;
                }
                .ef-inp:focus { border-color:#65a30d; box-shadow:0 0 0 3px rgba(163,230,53,.2); }
                .ef-btns { display:flex; gap:.35rem; margin-top:.1rem; }

                /* EMPTY */
                .list-empty {
                    background:#fff; border-radius:16px; padding:2.5rem 1rem;
                    text-align:center; box-shadow:0 1px 5px rgba(0,0,0,.05);
                }
                .list-empty i { font-size:2.25rem; color:#d1d5db; display:block; margin-bottom:.5rem; }
                .list-empty p { font-size:.82rem; color:#9ca3af; font-weight:500; }

                /* VENDOR LIST */
                .vendor-list { display:flex; flex-direction:column; gap:.42rem; }
                .v-row {
                    background:#fff; border-radius:16px; padding:.75rem .95rem;
                    display:flex; align-items:center; gap:.8rem;
                    box-shadow:0 1px 5px rgba(0,0,0,.05); cursor:pointer; transition:all .15s;
                }
                .v-row:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,.08); }
                .v-thumb { width:44px; height:44px; border-radius:12px; object-fit:cover; flex-shrink:0; }
                .v-info { flex:1; min-width:0; }
                .v-name { display:block; font-size:.86rem; font-weight:700; color:#111; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                .v-sub  { display:block; font-size:.7rem; color:#9ca3af; margin-top:.06rem; }
                .v-right { display:flex; flex-direction:column; align-items:flex-end; gap:.18rem; flex-shrink:0; }
                .v-rating { font-size:.72rem; font-weight:700; color:#d97706; display:flex; align-items:center; gap:3px; }
                .v-rating i { font-size:.62rem; }
                .v-cta { font-size:.65rem; font-weight:600; color:#9ca3af; display:flex; align-items:center; gap:3px; }

                /* TEMPLATE SECTION */
                .templates-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .templates-hdr {
                    text-align: center;
                    padding: 0.5rem 0;
                }
                .templates-title {
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: #12121c;
                    margin-bottom: 0.25rem;
                }
                .templates-subtitle {
                    font-size: 0.76rem;
                    color: #6b7280;
                    line-height: 1.4;
                }
                .templates-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.9rem;
                }
                .theme-card {
                    background: #fff;
                    border-radius: 20px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    overflow: hidden;
                    transition: all 0.2s ease;
                }
                .theme-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.07);
                }
                .theme-card-active {
                    border: 2px solid #a3e635;
                    box-shadow: 0 4px 16px rgba(163, 230, 53, 0.15);
                }
                .theme-card-body {
                    padding: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.8rem;
                }
                .theme-card-header {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                }
                .theme-card-title-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .theme-card-name {
                    font-size: 1.05rem;
                    font-weight: 800;
                    color: #111;
                }
                .theme-badge-active {
                    background: #ecfdf5;
                    color: #047857;
                    font-size: 0.68rem;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 999px;
                    border: 1px solid rgba(4, 120, 87, 0.15);
                }
                .theme-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.3rem;
                }
                .theme-tag {
                    font-size: 0.62rem;
                    font-weight: 700;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: #f3f4f6;
                    color: #4b5563;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                }
                .theme-desc {
                    font-size: 0.78rem;
                    color: #6b7280;
                    line-height: 1.45;
                }
                .theme-palette {
                    display: flex;
                    gap: 0.35rem;
                    align-items: center;
                }
                .theme-color-swatch {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    border: 1px solid rgba(0,0,0,0.08);
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
                }
                .theme-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.3rem;
                }
                .theme-btn-preview {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.35rem;
                    padding: 0.55rem;
                    border-radius: 10px;
                    background: #f3f4f6;
                    color: #374151;
                    font-size: 0.76rem;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.15s ease;
                    border: 1px solid #e5e7eb;
                }
                .theme-btn-preview:hover {
                    background: #e5e7eb;
                    color: #111;
                }
                .theme-btn-activate {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.35rem;
                    padding: 0.55rem;
                    border-radius: 10px;
                    background: #12121c;
                    color: #a3e635;
                    font-size: 0.76rem;
                    font-weight: 700;
                    border: none;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .theme-btn-activate:hover:not(:disabled) {
                    background: #1e1e30;
                }
                .theme-btn-activate:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* REMINDER STATUS CARD */
                .reminder-status-card {
                    background: #fff;
                    border-radius: 18px;
                    padding: 0.9rem 1.15rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 2px 10px rgba(0,0,0,.04);
                    border: 1px solid #e5e7eb;
                    margin-top: 0.25rem;
                }
                .rsc-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .rsc-icon {
                    font-size: 1.15rem;
                    color: #4f46e5;
                    background: #eef2ff;
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .rsc-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.15rem;
                }
                .rsc-title {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #1f2937;
                }
                .rsc-desc {
                    font-size: 0.65rem;
                    color: #6b7280;
                }
                .rsc-badge {
                    font-size: 0.72rem;
                    font-weight: 800;
                    padding: 3px 10px;
                    border-radius: 999px;
                    background: #eef2ff;
                    color: #4f46e5;
                    border: 1px solid rgba(79, 70, 229, 0.15);
                }

                /* BOTTOM NAV — always visible, never scrolls */
                .btm-nav {
                    display: flex;
                    align-items: center;
                    justify-content: space-around;
                    background: #fff;
                    padding: .7rem 1rem 1.5rem;
                    border-top: 1px solid #f1f5f9;
                    flex-shrink: 0; /* never shrinks */
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

                /* LOADING / ERROR */
                .rr-loading { display:flex; flex-direction:column; align-items:center; gap:1rem; }
                .rr-spinner {
                    width:44px; height:44px;
                    border:4px solid rgba(163,230,53,.2); border-top:4px solid #a3e635;
                    border-radius:50%; animation:spin .9s linear infinite;
                }
                @keyframes spin { to { transform:rotate(360deg); } }

                /* FULL WIDTH ON SMALL PHONES */
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

export default RSVPReport;
