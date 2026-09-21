import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabaseClient';
import logoImg from '../../assets/images/logo1.png';
import QRScanner from '../../components/QRScanner';
import { formatKwacha, PAYMENT_PHONE, WHATSAPP_PHONE, formatPricingTier, calculatePricing } from '../../utils/pricing';
import './EventManage.css';

const TEMPLATE_META = {
    1: { bg: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', accent: '#c5a059', ornament: '♡', name: 'Classic Elegance' },
    2: { bg: 'linear-gradient(135deg, #2a2012 0%, #45341c 100%)', accent: '#e6ca85', ornament: '✦', name: 'Golden Romance' },
    3: { bg: 'linear-gradient(135deg, #0b221a 0%, #13392d 100%)', accent: '#34d399', ornament: '🌿', name: 'Tropical Elegance' },
    4: { bg: 'linear-gradient(135deg, #252e24 0%, #3e4a3b 100%)', accent: '#a3b18a', ornament: '❀', name: 'Botanical Olive' },
    5: { bg: 'linear-gradient(135deg, #3d1f19 0%, #68362d 100%)', accent: '#f87171', ornament: '✧', name: 'Terracotta Earth' },
};

function statusClass(s) {
    if (s === 'approved' || s === 'active') return 'status-approved';
    if (s === 'rejected') return 'status-rejected';
    if (s === 'pending') return 'status-pending';
    return 'status-draft';
}

function statusLabel(s) {
    return {
        active: 'Approved',
        approved: 'Approved',
        pending: 'Pending Approval',
        rejected: 'Rejected',
        draft: 'Draft',
    }[s] || s || 'Draft';
}

const AVATAR_COLORS = ['#4f46e5', '#0891b2', '#7c3aed', '#be185d', '#065f46', '#b45309', '#9f1239', '#1d4ed8'];
const getAvatarColor = (name = '') => AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length];
const getGuestInitials = (name = '') => (name || '').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

const getGuestDetails = (guest) => {
    if (!guest) return { isCouple: false, primaryName: '', partnerName: '', displayName: '' };
    let primaryName = guest.name || 'Guest';
    let partnerName = guest.partner_name || '';

    if (!partnerName && primaryName.includes(' & ')) {
        const parts = primaryName.split(' & ');
        primaryName = parts[0].trim();
        partnerName = parts.slice(1).join(' & ').trim();
    }

    const isCouple = (parseInt(guest.guests_count, 10) === 2) || !!partnerName;
    const displayName = partnerName ? `${primaryName} & ${partnerName}` : primaryName;

    return { isCouple, primaryName, partnerName, displayName };
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

const TABS = [
    { id: 'details', label: 'Details', icon: 'fa-info-circle' },
    { id: 'guests', label: 'Guests', icon: 'fa-users' },
    { id: 'rsvps', label: 'RSVPs', icon: 'fa-envelope-open-text' },
    { id: 'share', label: 'Share', icon: 'fa-share-alt' },
];

const EventManage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('details');

    // Data
    const [event, setEvent] = useState(null);
    const [rsvps, setRsvps] = useState([]);
    const [user, setUser] = useState(null);

    // UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // RSVP Reporting & Scanning states
    const [rsvpSearch, setRsvpSearch] = useState('');
    const [activeRsvpTab, setActiveRsvpTab] = useState('approved');
    const [showQrScanner, setShowQrScanner] = useState(false);
    const [scannedGuest, setScannedGuest] = useState(null);
    const [scanMessage, setScanMessage] = useState(null);
    const [scanNextPrompt, setScanNextPrompt] = useState(null);
    const [processingAction, setProcessingAction] = useState(null);
    const [successToast, setSuccessToast] = useState('');
    const recentScannedCodesRef = useRef(new Set());
    const lastScanTimeRef = useRef(0);
    const lastScannedCodeRef = useRef('');

    // Copy states
    const [copied, setCopied] = useState(false);
    const [copiedEventId, setCopiedEventId] = useState(false);
    const [copiedPhone, setCopiedPhone] = useState(false);

    // Avatar dropdown
    const [avatarOpen, setAvatarOpen] = useState(false);
    const avatarRef = useRef(null);
    useEffect(() => {
        const close = (e) => {
            if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const getInitials = (u) => {
        if (!u) return '?';
        const meta = u.user_metadata;
        if (meta?.full_name) return meta.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return (u.email || '??').slice(0, 2).toUpperCase();
    };

    const handleCopyEventId = (id) => {
        navigator.clipboard.writeText(id).then(() => {
            setCopiedEventId(true);
            setTimeout(() => setCopiedEventId(false), 2000);
        });
    };

    const handleCopyPhone = () => {
        navigator.clipboard.writeText(PAYMENT_PHONE).then(() => {
            setCopiedPhone(true);
            setTimeout(() => setCopiedPhone(false), 2000);
        });
    };

    // Load current user
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            if (!user) navigate('/login');
        });
    }, [navigate]);

    // Fetch event (enforces ownership via user_id)
    const fetchEvent = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            const { data, error: err } = await supabase
                .from('weddings')
                .select('*')
                .eq('slug', slug)
                .eq('user_id', user.id)
                .single();

            if (err) {
                if (err.code === 'PGRST116') {
                    setError("This invitation doesn't exist or you don't have permission to view it.");
                } else {
                    throw err;
                }
                return;
            }
            setEvent(data);
        } catch (err) {
            setError('Failed to load event: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [user, slug]);

    // Fetch RSVPs
    const fetchRsvps = useCallback(async () => {
        if (!event) return;
        const { data } = await supabase
            .from('rsvps')
            .select('*')
            .eq('wedding_id', event.id)
            .order('created_at', { ascending: false });
        setRsvps(data || []);
    }, [event]);

    useEffect(() => {
        fetchEvent();
    }, [fetchEvent]);

    useEffect(() => {
        if (event) fetchRsvps();
    }, [event, fetchRsvps]);

    // Delete Event
    const handleDelete = async () => {
        setDeleting(true);
        try {
            const { error: err } = await supabase
                .from('weddings')
                .delete()
                .eq('slug', slug)
                .eq('user_id', user.id);

            if (err) throw err;
            navigate('/my-events');
        } catch (err) {
            alert('Delete failed: ' + err.message);
        } finally {
            setDeleting(false);
        }
    };

    // Delete RSVP
    const handleDeleteRsvp = async (guestOrId) => {
        const id = typeof guestOrId === 'object' ? guestOrId.id : guestOrId;
        const name = typeof guestOrId === 'object' ? (getGuestDetails(guestOrId).displayName) : 'this guest';
        if (!window.confirm(`Are you sure you want to remove "${name}" from the RSVP list?`)) return;
        setProcessingAction(`${id}-delete`);
        try {
            const { error: err } = await supabase.from('rsvps').delete().eq('id', id);
            if (err) throw err;
            setRsvps(prev => prev.filter(r => r.id !== id));
            setSuccessToast(`Removed ${name}`);
            setTimeout(() => setSuccessToast(''), 3000);
        } catch (err) {
            alert('Error deleting RSVP: ' + err.message);
        } finally {
            setProcessingAction(null);
        }
    };

    // Toggle check-in (supports offline / column fallback)
    const handleToggleCheckIn = async (guest) => {
        if (!guest.checked_in && (guest.status || '').toLowerCase() !== 'approved') {
            alert(`Cannot check in ${guest.name || 'Guest'}: Must be approved first.`);
            return;
        }
        const newCheckedIn = !guest.checked_in;
        setProcessingAction(`${guest.id}-checkin`);
        try {
            let updatePayload = {
                checked_in: newCheckedIn,
                checked_in_at: newCheckedIn ? new Date().toISOString() : null
            };
            let { error: updateError } = await supabase
                .from('rsvps')
                .update(updatePayload)
                .eq('id', guest.id);

            if (updateError && (updateError.message.includes('column') || updateError.code === '42703')) {
                const { error: fallbackError } = await supabase
                    .from('rsvps')
                    .update({ checked_in: newCheckedIn })
                    .eq('id', guest.id);
                updateError = fallbackError;
            }

            if (updateError) throw updateError;

            if (newCheckedIn) playBeepSound();
            setRsvps(prev => prev.map(r => r.id === guest.id ? { ...r, ...updatePayload } : r));
            setSuccessToast(newCheckedIn ? `Checked in ${guest.name || 'Guest'}!` : `Check-in undone for ${guest.name || 'Guest'}`);
            setTimeout(() => setSuccessToast(''), 3000);
        } catch (err) {
            alert('Error updating check-in: ' + err.message);
        } finally {
            setProcessingAction(null);
        }
    };

    // Approve RSVP
    const handleApproveRsvp = async (guest) => {
        setProcessingAction(`${guest.id}-approve`);
        try {
            const { error: updateError } = await supabase
                .from('rsvps')
                .update({ status: 'approved' })
                .eq('id', guest.id);
            if (updateError) throw updateError;
            playBeepSound();
            setRsvps(prev => prev.map(r => r.id === guest.id ? { ...r, status: 'approved' } : r));
            setSuccessToast(`Approved ${guest.name || 'Guest'}!`);
            setTimeout(() => setSuccessToast(''), 3000);
        } catch (err) {
            alert('Error approving guest: ' + err.message);
        } finally {
            setProcessingAction(null);
        }
    };

    // Export Excel (.xlsx) matching admin report
    const downloadExcel = () => {
        if (!rsvps?.length) {
            alert("No RSVPs to export.");
            return;
        }
        const excelData = rsvps.map(row => {
            const { isCouple, primaryName, partnerName } = getGuestDetails(row);
            return {
                "Type": isCouple ? "Couple" : "Single",
                "Primary Guest": primaryName,
                "Primary Email": row.email || "N/A",
                "Primary Phone": row.phone || "N/A",
                "Partner / Second Guest": partnerName || "N/A",
                "Partner Email": row.partner_email || "N/A",
                "Partner Phone": row.partner_phone || "N/A",
                "Attending": row.attending,
                "Number of Guests": row.guests_count || 1,
                "Status": row.status || 'approved',
                "Checked In": row.checked_in ? "Yes" : "No",
                "Checked In At": row.checked_in_at ? new Date(row.checked_in_at).toLocaleString() : "N/A",
                "RSVP Date": new Date(row.created_at).toLocaleDateString()
            };
        });
        const ws = XLSX.utils.json_to_sheet(excelData);
        ws['!cols'] = [
            { wch: 10 }, { wch: 25 }, { wch: 25 }, { wch: 18 },
            { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 12 },
            { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 15 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
        const title = (event?.bride_name && event?.groom_name)
            ? `${event.bride_name}_${event.groom_name}`
            : (event?.title || event?.slug || 'RSVPs');
        XLSX.writeFile(wb, `RSVPs_${title}.xlsx`.replace(/\s+/g, '_'));
    };

    // Camera QR Pass Scanner handler
    const handleQrScan = async (detectedCodes) => {
        const rawCode = detectedCodes[0]?.rawValue;
        if (!rawCode || window.isProcessingScan) return;

        const now = Date.now();
        const rawScanKey = String(rawCode).trim().toLowerCase();
        if (lastScannedCodeRef.current === rawScanKey && (now - lastScanTimeRef.current < 2500)) {
            return;
        }
        lastScannedCodeRef.current = rawScanKey;
        lastScanTimeRef.current = now;

        window.isProcessingScan = true;
        setScanMessage('Reading pass...');

        try {
            let code = rawCode;
            let embeddedData = null;
            if (rawCode.startsWith('{')) {
                try {
                    const parsed = JSON.parse(rawCode);
                    code = parsed.id;
                    embeddedData = parsed;
                } catch (e) {}
            }

            const tokenLookup = embeddedData?.token || embeddedData?.qr_token || null;
            let data = null;
            let error = null;
            if (tokenLookup) {
                const res = await supabase.from('rsvps').select('*').eq('qr_token', tokenLookup).eq('wedding_id', event.id).single();
                data = res.data;
                error = res.error;
            } else {
                const isValidId = /^[0-9a-fA-F-]+$/.test(String(code));
                if (isValidId) {
                    const res = await supabase.from('rsvps').select('*').eq('id', code).eq('wedding_id', event.id).single();
                    data = res.data;
                    error = res.error;
                }
            }

            let guestRecord = data;
            if (error || !data) {
                if (embeddedData && embeddedData.wedding_id === event.id) {
                    guestRecord = {
                        id: embeddedData.id,
                        name: embeddedData.name,
                        partner_name: embeddedData.partner_name || null,
                        email: embeddedData.email,
                        phone: embeddedData.phone,
                        partner_email: embeddedData.partner_email || null,
                        partner_phone: embeddedData.partner_phone || null,
                        guests_count: embeddedData.guests_count || 1,
                        wedding_id: embeddedData.wedding_id,
                        status: embeddedData.status || null,
                        checked_in: false,
                        is_embedded_fallback: true
                    };
                } else {
                    const localMatch = rsvps.find(r => r.id === code || r.qr_token === code);
                    if (localMatch) guestRecord = localMatch;
                }
            }

            if (!guestRecord) {
                playWarningSound();
                setScanMessage('INVALID PASS — Guest not found for this event');
                window.isProcessingScan = false;
                return;
            }

            // ── Approval check: ONLY scan success for approved guests ──
            const guestStatus = (guestRecord.status || '').toLowerCase();
            if (guestStatus !== 'approved') {
                playWarningSound();
                const statusText = guestStatus === 'pending' ? 'Pending Approval' : (guestStatus ? guestStatus.toUpperCase() : 'Not Approved');
                setScanMessage(`❌ ENTRY REJECTED — ${guestRecord.name || 'Guest'} is not approved for this event (${statusText}).`);
                setShowQrScanner(false);
                setScannedGuest({ ...guestRecord, not_approved: true, checked_in: false, statusText });
                window.isProcessingScan = false;
                return;
            }

            if (guestRecord.checked_in) {
                playWarningSound();
                setScanMessage('ALREADY CHECKED IN');
                setShowQrScanner(false);
                setScannedGuest({ ...guestRecord, checked_in: true });
            } else {
                playBeepSound();
                setScanMessage('✅ PASS VALID & APPROVED');
                setShowQrScanner(false);
                setScannedGuest(guestRecord);
            }
        } catch (err) {
            console.error('Scan error:', err);
            setScanMessage('SCAN ERROR — ' + err.message);
        } finally {
            window.isProcessingScan = false;
        }
    };


    const handleConfirmScannedCheckIn = async () => {
        if (!scannedGuest) return;
        if (scannedGuest.not_approved || (scannedGuest.status || '').toLowerCase() !== 'approved') {
            alert("Entry Rejected: Guest is not approved for this event.");
            return;
        }
        const { displayName } = getGuestDetails(scannedGuest);
        try {
            let updatePayload = {
                checked_in: true,
                checked_in_at: new Date().toISOString(),
                qr_token: null
            };
            let { error: updateError } = await supabase
                .from('rsvps')
                .update(updatePayload)
                .eq('id', scannedGuest.id);

            if (updateError && (updateError.message.includes('column') || updateError.code === '42703')) {
                const { error: fallbackError } = await supabase
                    .from('rsvps')
                    .update({ checked_in: true })
                    .eq('id', scannedGuest.id);
                updateError = fallbackError;
            }

            if (updateError) throw updateError;

            playBeepSound();
            setRsvps(prev => prev.map(r => r.id === scannedGuest.id ? { ...r, checked_in: true, checked_in_at: new Date().toISOString() } : r));
            try { recentScannedCodesRef.current.add(String(scannedGuest.id).trim().toLowerCase()); } catch (e) {}
            const email = scannedGuest.email;
            setScannedGuest(null);
            setScanNextPrompt({ name: displayName, email });
        } catch (err) {
            alert('Error updating check-in: ' + err.message);
        }
    };

    const tpl = event ? (TEMPLATE_META[event.template_id] || TEMPLATE_META[1]) : TEMPLATE_META[1];

    if (loading) {
        return (
            <div className="em-page">
                <div className="em-loading">
                    <div className="em-spinner" />
                    <span>Loading your event...</span>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="em-page">
                <nav className="em-nav">
                    <div className="em-nav-inner">
                        <Link to="/my-events" className="em-nav-brand">
                            <img src={logoImg} alt="SaveMeASeat" />
                        </Link>
                    </div>
                </nav>
                <div className="em-error">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                    <h2>{error ? 'Access Denied' : 'Event Not Found'}</h2>
                    <p>{error || "This invitation doesn't exist or you don't have permission to view it."}</p>
                    <Link to="/my-events" className="em-btn em-btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                        <i className="fas fa-arrow-left" /> Back to My Events
                    </Link>
                </div>
            </div>
        );
    }

    const isApproved = event.status === 'approved' || event.status === 'active';
    const isPending = event.status === 'pending';
    const isRejected = event.status === 'rejected';
    const isUnapproved = !isApproved;
    const eventIdDisplay = event.event_id || `EVT-${event.id?.slice(0, 8).toUpperCase()}`;

    // Pricing calculations
    const pricing = calculatePricing(event.guest_count || 100);
    const amountToPay = event.balance_due && event.balance_due > 0
        ? event.balance_due
        : (event.price || pricing.price);
    const formattedAmount = formatKwacha(amountToPay);

    const coupleTitle = event.groom_name && event.bride_name
        ? `${event.groom_name} & ${event.bride_name}`
        : (event.title || 'Untitled Event');

    const waPaymentMsg = encodeURIComponent(
        `Hello SaveMeASeat Zambia,\n\nI have made payment for my wedding invitation.\n\n*Event ID:* ${eventIdDisplay}\n*Couple:* ${coupleTitle}\n*Amount:* ${formattedAmount}\n*Expected Guests:* ${event.guest_count || 100}\n*Invitation Link:* ${liveUrl}\n\nPlease confirm activation. Thank you!`
    );

    // RSVP Subsets & Stats
    const approvedGuests = rsvps.filter(g => (g.status === 'approved' || !g.status) && !g.checked_in);
    const checkedInGuests = rsvps.filter(g => !!g.checked_in);
    const pendingGuests = rsvps.filter(g => g.status === 'pending');
    const declinedGuests = rsvps.filter(g => g.attending?.toLowerCase() === 'no' || g.attending?.toLowerCase() === 'not attending' || g.attending?.toLowerCase() === 'declined');

    const approvedAttending = approvedGuests.filter(g => g.attending?.toLowerCase() === 'yes' || g.attending?.toLowerCase() === 'attending').length;
    const checkedInAttending = checkedInGuests.filter(g => g.attending?.toLowerCase() === 'yes' || g.attending?.toLowerCase() === 'attending').length;
    const attendingCount = approvedAttending + checkedInAttending;
    const declinedCount = declinedGuests.length;
    const totalSeats = rsvps
        .filter(g => g.attending?.toLowerCase() === 'yes' || g.attending?.toLowerCase() === 'attending')
        .reduce((sum, g) => sum + (parseInt(g.guests_count, 10) || 1), 0);
    const totalGuestsAttending = attendingCount;

    // Filtered RSVPs by search and active tab
    const rsvpQuery = rsvpSearch.toLowerCase().trim();
    const guestMatchesQuery = (g) => {
        if (!rsvpQuery) return true;
        const { primaryName, partnerName } = getGuestDetails(g);
        return (
            primaryName.toLowerCase().includes(rsvpQuery) ||
            partnerName.toLowerCase().includes(rsvpQuery) ||
            (g.name && g.name.toLowerCase().includes(rsvpQuery)) ||
            (g.partner_name && g.partner_name.toLowerCase().includes(rsvpQuery)) ||
            (g.email && g.email.toLowerCase().includes(rsvpQuery)) ||
            (g.partner_email && g.partner_email.toLowerCase().includes(rsvpQuery)) ||
            (g.phone && g.phone.toLowerCase().includes(rsvpQuery)) ||
            (g.partner_phone && g.partner_phone.toLowerCase().includes(rsvpQuery))
        );
    };

    const getDisplayedGuests = () => {
        let list = [];
        if (activeRsvpTab === 'approved') list = approvedGuests;
        else if (activeRsvpTab === 'checked_in') list = checkedInGuests;
        else if (activeRsvpTab === 'pending') list = pendingGuests;
        else if (activeRsvpTab === 'declined') list = declinedGuests;
        else list = rsvps;
        return list.filter(guestMatchesQuery);
    };
    const displayedGuests = getDisplayedGuests();

    return (
        <div className="em-page">
            {/* Top Navigation Bar */}
            <nav className="em-nav">
                <div className="em-nav-inner">
                    <Link to="/my-events" className="em-nav-brand">
                        <img src={logoImg} alt="SaveMeASeat" />
                    </Link>
                    <div className="em-nav-actions">
                        <Link to="/my-events" className="em-nav-link">
                            <i className="fas fa-arrow-left" /> My Events
                        </Link>
                        {isApproved && (
                            <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="em-nav-link em-nav-link-live">
                                <i className="fas fa-external-link-alt" /> View Live
                            </a>
                        )}
                        {user && (
                            <div className="em-avatar-wrap" ref={avatarRef}>
                                <button type="button" className="em-avatar-btn" onClick={() => setAvatarOpen(o => !o)} aria-label="Account menu">
                                    {getInitials(user)}
                                </button>
                                {avatarOpen && (
                                    <div className="em-avatar-dropdown">
                                        <div className="em-avatar-email" title={user.email}>{user.email}</div>
                                        <Link to="/my-events" className="em-avatar-item" onClick={() => setAvatarOpen(false)}>
                                            <i className="fas fa-th-large" /> My Events
                                        </Link>
                                        <button type="button" className="em-avatar-item em-avatar-signout" onClick={async () => { await supabase.auth.signOut(); navigate('/'); }}>
                                            <i className="fas fa-sign-out-alt" /> Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Header / Title Bar */}
            <header className="em-header">
                <div className="em-header-inner">
                    <div className="em-header-meta">
                        <div className="em-header-title-row">
                            <h1 className="em-header-title">{coupleTitle}</h1>
                            <span className={`em-status-pill ${statusClass(event.status)}`}>
                                {statusLabel(event.status)}
                            </span>
                        </div>
                        <div className="em-header-subtitle-row">
                            <div className="em-id-pill" title="Click to copy Event ID">
                                <span className="em-id-label">Event ID:</span>
                                <span className="em-id-value">{eventIdDisplay}</span>
                                <button
                                    type="button"
                                    className={`em-id-copy-btn ${copiedEventId ? 'copied' : ''}`}
                                    onClick={() => handleCopyEventId(eventIdDisplay)}
                                    aria-label="Copy Event ID"
                                >
                                    <i className={`fas ${copiedEventId ? 'fa-check' : 'fa-copy'}`} />
                                    {copiedEventId ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            {event.date && (
                                <span className="em-header-date">
                                    <i className="far fa-calendar-alt" />
                                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="em-header-actions">
                        <Link to={`/edit-event/${slug}`} className="em-btn em-btn-primary">
                            <i className="fas fa-magic" /> Edit in Wizard
                        </Link>
                    </div>
                </div>
            </header>

            {/* Approved Event Banner */}
            {isApproved && (
                <section className="em-approved-banner-wrap" style={{ maxWidth: '1200px', margin: '1.5rem auto 0', padding: '0 1.5rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '16px',
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                background: '#10b981',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                flexShrink: 0
                            }}>
                                <i className="fas fa-check" />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, color: '#065f46' }}>
                                    Your event is approved. You can now share your invitation.
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#047857' }}>
                                    Your digital invitation link is active and ready for guests to view and RSVP.
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="em-btn"
                                style={{
                                    background: '#ffffff',
                                    border: '1px solid #10b981',
                                    color: '#065f46',
                                    fontWeight: 700,
                                    padding: '0.6rem 1rem',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} /> {copied ? 'Copied Link' : 'Copy Live Link'}
                            </button>
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(`We are pleased to invite you to our wedding! View our digital invitation and RSVP here: ${liveUrl}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="em-btn"
                                style={{
                                    background: '#25D366',
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    padding: '0.6rem 1rem',
                                    fontSize: '0.85rem',
                                    textDecoration: 'none'
                                }}
                            >
                                <i className="fab fa-whatsapp" /> Share via WhatsApp
                            </a>
                            <a
                                href={liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="em-btn em-btn-primary"
                                style={{
                                    padding: '0.6rem 1rem',
                                    fontSize: '0.85rem',
                                    textDecoration: 'none'
                                }}
                            >
                                <i className="fas fa-external-link-alt" /> View Live
                            </a>
                        </div>
                    </div>
                </section>
            )}

            {/* Rejected Event Banner */}
            {isRejected && (
                <section className="em-rejected-banner-wrap" style={{ maxWidth: '1200px', margin: '1.5rem auto 0', padding: '0 1.5rem' }}>
                    <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '16px',
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.08)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                background: '#ef4444',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                flexShrink: 0
                            }}>
                                <i className="fas fa-times" />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, color: '#991b1b' }}>
                                    Event Not Approved
                                </h3>
                                <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#b91c1c' }}>
                                    {event.rejection_reason
                                        ? `Reason: "${event.rejection_reason}"`
                                        : 'Your event details or payment proof require review.'}
                                </p>
                                <span style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>
                                    Please edit your event details and resubmit for approval.
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <Link
                                to={`/edit-event/${slug}`}
                                className="em-btn"
                                style={{
                                    background: '#ef4444',
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    padding: '0.65rem 1.25rem',
                                    fontSize: '0.85rem',
                                    textDecoration: 'none'
                                }}
                            >
                                <i className="fas fa-edit" /> Edit Details & Resubmit
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Unapproved / Pending Payment & Review Banner */}
            {isUnapproved && !isRejected && (
                <section className="em-payment-banner-wrap">
                    <div className="em-payment-banner">
                        <div className="em-pb-header">
                            <div className="em-pb-badge">
                                <i className={isPending ? "fas fa-clock" : "fas fa-shield-alt"} />
                                {isPending ? " Under Review by Super Admin" : " Action Required to Activate"}
                            </div>
                            <div className="em-pb-amount">
                                <span className="em-pb-amount-label">Amount:</span>
                                <span className="em-pb-amount-val">{formattedAmount}</span>
                            </div>
                        </div>

                        <p className="em-pb-text">
                            {isPending
                                ? "Your event has been submitted and is currently awaiting Super Admin review and verification. Once approved, your invitation link will immediately go live."
                                : "Your invitation is securely saved. To activate guest access, RSVP tracking, and live sharing, please complete your payment and send proof via WhatsApp."}
                        </p>

                        <div className="em-pb-methods-notice">
                            <div className="em-pb-notice-heading">
                                <i className="fas fa-info-circle" /> Online payment options are not available at the moment.
                            </div>
                            <div className="em-pb-methods-row">
                                <div className="em-pb-method-card" aria-disabled="true">
                                    <span className="em-pb-method-name airtel"><i className="fas fa-mobile-alt" /> Airtel Money</span>
                                    <span className="em-pb-method-badge">Coming soon</span>
                                </div>
                                <div className="em-pb-method-card" aria-disabled="true">
                                    <span className="em-pb-method-name mtn"><i className="fas fa-money-bill-wave" /> MTN MoMo</span>
                                    <span className="em-pb-method-badge">Coming soon</span>
                                </div>
                                <div className="em-pb-method-card" aria-disabled="true">
                                    <span className="em-pb-method-name zamtel"><i className="fas fa-wallet" /> Zamtel Kwacha</span>
                                    <span className="em-pb-method-badge">Coming soon</span>
                                </div>
                            </div>
                        </div>

                        <div className="em-pb-actions">
                            <div className="em-pb-phone-box">
                                <span className="em-pb-phone-label">Payment Recipient Number:</span>
                                <div className="em-pb-phone-row">
                                    <span className="em-pb-phone-num">{PAYMENT_PHONE}</span>
                                    <button
                                        type="button"
                                        className={`em-pb-copy-phone ${copiedPhone ? 'copied' : ''}`}
                                        onClick={handleCopyPhone}
                                    >
                                        <i className={`fas ${copiedPhone ? 'fa-check' : 'fa-copy'}`} />
                                        {copiedPhone ? 'Copied' : 'Copy Number'}
                                    </button>
                                </div>
                            </div>

                            <a
                                href={`https://wa.me/${WHATSAPP_PHONE}?text=${waPaymentMsg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="em-pb-wa-btn"
                            >
                                <i className="fab fa-whatsapp" /> Send Payment Proof on WhatsApp
                            </a>
                        </div>
                    </div>
                </section>
            )}

            <main className="em-content">
                {/* 4 Summary Cards */}
                <section className="em-summary-grid">
                    {/* Card 1: Date & Schedule */}
                    <div className="em-stat-card">
                        <div className="em-stat-icon-wrap date-icon">
                            <i className="far fa-calendar-alt" />
                        </div>
                        <div className="em-stat-content">
                            <span className="em-stat-label">Date & Schedule</span>
                            <span className="em-stat-main">
                                {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                            </span>
                            <div className="em-stat-sub">
                                <span><i className="far fa-clock" /> Ceremony: {event.ceremony_time || 'TBD'}</span>
                                <span><i className="far fa-clock" /> Reception: {event.reception_time || 'TBD'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Venue & City */}
                    <div className="em-stat-card">
                        <div className="em-stat-icon-wrap venue-icon">
                            <i className="fas fa-map-marker-alt" />
                        </div>
                        <div className="em-stat-content">
                            <span className="em-stat-label">Venue & City</span>
                            <span className="em-stat-main" title={event.ceremony_venue || event.reception_venue || 'Venue TBD'}>
                                {event.ceremony_venue || event.reception_venue || 'Venue TBD'}
                            </span>
                            <div className="em-stat-sub">
                                <span>{event.venue_address || event.reception_address || 'Address not specified'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Guests & Pricing */}
                    <div className="em-stat-card">
                        <div className="em-stat-icon-wrap guests-icon">
                            <i className="fas fa-users" />
                        </div>
                        <div className="em-stat-content">
                            <span className="em-stat-label">Guests & Tier</span>
                            <span className="em-stat-main">
                                {event.guest_count || 100} Guests
                            </span>
                            <div className="em-stat-sub">
                                <span>Tier: {formatPricingTier(event.pricing_tier || pricing.tier)}</span>
                                <span className="em-stat-price-badge">Package: {formatKwacha(event.price || pricing.price)}</span>
                                {event.balance_due > 0 && (
                                    <span className="em-stat-balance-due">Balance: {formatKwacha(event.balance_due)}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Card 4: RSVPs */}
                    <div className="em-stat-card">
                        <div className="em-stat-icon-wrap rsvp-icon">
                            <i className="fas fa-ticket-alt" />
                        </div>
                        <div className="em-stat-content">
                            <span className="em-stat-label">RSVPs Received</span>
                            <span className="em-stat-main">
                                {rsvps.length} Responses
                            </span>
                            <div className="em-stat-sub">
                                <span className="rsvp-green"><i className="fas fa-check" /> {rsvpYes} Attending</span>
                                <span className="rsvp-red"><i className="fas fa-times" /> {rsvpNo} Declined</span>
                                {rsvpMaybe > 0 && <span>{rsvpMaybe} Maybe</span>}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4 Navigation Tabs */}
                <nav className="em-tabs" aria-label="Event Management Tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            id={`tab-${tab.id}`}
                            className={`em-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            type="button"
                        >
                            <i className={`fas ${tab.icon}`} /> {tab.label}
                        </button>
                    ))}
                </nav>

                {/* TAB 1: DETAILS */}
                {activeTab === 'details' && (
                    <div className="em-tab-content em-details-layout">
                        <div className="em-details-main">
                            <div className="em-panel">
                                <div className="em-panel-header">
                                    <div>
                                        <h3>Wedding Overview</h3>
                                        <p className="em-panel-desc">Key details visible on your guest invitation</p>
                                    </div>
                                    <Link to={`/edit-event/${slug}`} className="em-btn em-btn-secondary">
                                        <i className="fas fa-pen" /> Edit Details in Wizard
                                    </Link>
                                </div>

                                <div className="em-details-grid">
                                    <div className="em-detail-block">
                                        <span className="em-d-label">Groom's Name</span>
                                        <span className="em-d-val">{event.groom_name || '—'}</span>
                                    </div>
                                    <div className="em-detail-block">
                                        <span className="em-d-label">Bride's Name</span>
                                        <span className="em-d-val">{event.bride_name || '—'}</span>
                                    </div>
                                    <div className="em-detail-block full">
                                        <span className="em-d-label">Tagline / Header</span>
                                        <span className="em-d-val italic">{event.tagline || 'Together with their families'}</span>
                                    </div>
                                    <div className="em-detail-block">
                                        <span className="em-d-label">Wedding Date</span>
                                        <span className="em-d-val">
                                            {event.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}
                                        </span>
                                    </div>
                                    <div className="em-detail-block">
                                        <span className="em-d-label">RSVP Deadline</span>
                                        <span className="em-d-val">
                                            {event.rsvp_deadline ? new Date(event.rsvp_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'None specified'}
                                        </span>
                                    </div>
                                    <div className="em-detail-block">
                                        <span className="em-d-label">Ceremony Venue</span>
                                        <span className="em-d-val">{event.ceremony_venue || '—'}</span>
                                        {event.venue_address && <span className="em-d-sub">{event.venue_address}</span>}
                                    </div>
                                    <div className="em-detail-block">
                                        <span className="em-d-label">Ceremony Time</span>
                                        <span className="em-d-val">{event.ceremony_time || '—'}</span>
                                    </div>
                                    <div className="em-detail-block">
                                        <span className="em-d-label">Reception Venue</span>
                                        <span className="em-d-val">{event.reception_venue || '—'}</span>
                                        {event.reception_address && <span className="em-d-sub">{event.reception_address}</span>}
                                    </div>
                                    <div className="em-detail-block">
                                        <span className="em-d-label">Reception Time</span>
                                        <span className="em-d-val">{event.reception_time || '—'}</span>
                                    </div>
                                    <div className="em-detail-block">
                                        <span className="em-d-label">Dress Code</span>
                                        <span className="em-d-val">{event.dress_code || 'Formal / Traditional'}</span>
                                    </div>
                                    <div className="em-detail-block">
                                        <span className="em-d-label">Design Template</span>
                                        <span className="em-d-val">{tpl.name}</span>
                                    </div>
                                    {event.story_part2 && (
                                        <div className="em-detail-block full">
                                            <span className="em-d-label">Love Story / Proposal</span>
                                            <p className="em-d-story">{event.story_part2}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Details Sidebar */}
                        <div className="em-details-side">
                            <div className="em-panel em-preview-panel">
                                <h3>Live Invitation</h3>
                                <iframe
                                    title="Event Preview"
                                    src={`${liveUrl}?preview=true`}
                                    className="em-mini-preview-iframe"
                                />
                                <div className="em-preview-actions">
                                    <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="em-btn em-btn-secondary full-width">
                                        <i className="fas fa-external-link-alt" /> Open Full Screen
                                    </a>
                                </div>
                            </div>

                            <div className="em-panel em-danger-panel">
                                <h4>Delete Event</h4>
                                <p>Permanently remove this wedding invitation and all recorded RSVPs.</p>
                                <button type="button" className="em-btn em-btn-danger" onClick={() => setDeleteConfirm(true)}>
                                    <i className="fas fa-trash-alt" /> Delete Event
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: GUESTS */}
                {activeTab === 'guests' && (
                    <div className="em-tab-content">
                        <div className="em-panel">
                            <div className="em-panel-header">
                                <div>
                                    <h3>Expected Guests & Capacity</h3>
                                    <p className="em-panel-desc">Manage your guest list limits and pricing tier package</p>
                                </div>
                                <Link to={`/edit-event/${slug}`} className="em-btn em-btn-secondary">
                                    <i className="fas fa-sliders-h" /> Change Guest Capacity
                                </Link>
                            </div>

                            <div className="em-guest-tier-card">
                                <div className="em-gt-left">
                                    <span className="em-gt-pill">Current Tier</span>
                                    <h4 className="em-gt-title">{formatPricingTier(event.pricing_tier || pricing.tier)}</h4>
                                    <p className="em-gt-desc">
                                        Accommodates up to <strong>{event.guest_count || 100} guests</strong> with full RSVP tracking and invitation access.
                                    </p>
                                </div>
                                <div className="em-gt-right">
                                    <div className="em-gt-price">
                                        <span className="em-gt-price-val">{formatKwacha(event.price || pricing.price)}</span>
                                        <span className="em-gt-price-sub">Package fee</span>
                                    </div>
                                    {event.balance_due > 0 && (
                                        <div className="em-gt-balance">
                                            <span>Upgrade Balance Due: <strong>{formatKwacha(event.balance_due)}</strong></span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Capacity Progress */}
                            <div className="em-capacity-box">
                                <div className="em-capacity-header">
                                    <span>Guest Responses Received</span>
                                    <strong>{totalGuestsAttending} of {event.guest_count || 100} guests</strong>
                                </div>
                                <div className="em-capacity-bar">
                                    <div
                                        className="em-capacity-fill"
                                        style={{ width: `${Math.min(100, Math.round((totalGuestsAttending / (event.guest_count || 100)) * 100))}%` }}
                                    />
                                </div>
                                <p className="em-capacity-hint">
                                    Need to invite more guests? Update your expected guest count in the wizard. If your guest count moves into a higher tier, your balance due will be calculated automatically.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: RSVPS - FULL ADMIN-GRADE RSVP REPORT */}
                {activeTab === 'rsvps' && (
                    <div className="em-tab-content">
                        {/* Toast Alert */}
                        {successToast && (
                            <div className="em-report-toast">
                                <i className="fas fa-check-circle" /> {successToast}
                            </div>
                        )}

                        {/* Continuous Scan-Next Flow Modal */}
                        {scanNextPrompt && (
                            <div className="em-modal-overlay" onClick={() => { window.isProcessingScan = false; setScanNextPrompt(null); }}>
                                <div className="em-modal-card" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'inline-block', background: '#10b981', borderRadius: '50%', width: 56, height: 56, lineHeight: '56px', textAlign: 'center', marginBottom: '1rem' }}>
                                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}><polyline points="20 6 9 17 4 12" /></svg>
                                    </div>
                                    <h4 className="em-modal-name" style={{ marginBottom: '0.25rem' }}>{scanNextPrompt.name}</h4>
                                    <p className="em-modal-desc" style={{ marginBottom: '1rem' }}>{scanNextPrompt.email || 'Guest Pass'}</p>
                                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#065f46', fontWeight: 600, marginBottom: '1.25rem' }}>
                                        Checked in successfully
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            window.isProcessingScan = false;
                                            setScanNextPrompt(null);
                                            setShowQrScanner(true);
                                        }}
                                        className="em-btn em-btn-primary full-width"
                                    >
                                        Scan Next Pass
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* QR Camera Scanner Viewfinder Modal */}
                        {showQrScanner && (
                            <div className="qr-fs-overlay">
                                <div className="qr-fs-header">
                                    <div className="qr-fs-title">
                                        <span>SCAN GUEST PASS</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="qr-fs-close"
                                        onClick={() => {
                                            window.isProcessingScan = false;
                                            setScanMessage(null);
                                            setShowQrScanner(false);
                                        }}
                                    >
                                        &#x2715;
                                    </button>
                                </div>

                                <div className="qr-fs-camera">
                                    <QRScanner onScan={handleQrScan} />
                                    <div className="qr-fs-viewfinder">
                                        <div className="qr-fs-corner tl" />
                                        <div className="qr-fs-corner tr" />
                                        <div className="qr-fs-corner bl" />
                                        <div className="qr-fs-corner br" />
                                        <div className="qr-fs-laser" />
                                    </div>
                                </div>

                                {scanMessage && (
                                    <div className={`qr-fs-msg ${
                                        scanMessage.startsWith('NOT APPROVED') || scanMessage.startsWith('INVALID') || scanMessage.startsWith('SCAN ERROR') ? 'qr-fs-msg--error' :
                                        scanMessage.startsWith('ALREADY') ? 'qr-fs-msg--warn' :
                                        scanMessage.startsWith('PASS VALID') ? 'qr-fs-msg--success' : ''
                                    }`}>
                                        {scanMessage}
                                    </div>
                                )}

                                <div className="qr-fs-hint">
                                    Point camera at the guest's QR code on their digital pass
                                </div>
                            </div>
                        )}

                        {/* Scanned Guest Pass Confirmation Card */}
                        {scannedGuest && (() => {
                            const { isCouple, primaryName, partnerName, displayName } = getGuestDetails(scannedGuest);
                            const isNotApproved = scannedGuest.not_approved || (scannedGuest.status || '').toLowerCase() !== 'approved';
                            const isAlreadyIn = scannedGuest.checked_in;
                            return (
                                <div className="em-modal-overlay" style={{ zIndex: 3200 }} onClick={() => { window.isProcessingScan = false; setScannedGuest(null); }}>
                                    <div className="em-modal-card" onClick={e => e.stopPropagation()} style={{ padding: '0', overflow: 'hidden', maxWidth: '380px' }}>

                                        {/* Status bar */}
                                        <div style={{
                                            background: isNotApproved ? '#ef4444' : isAlreadyIn ? '#f59e0b' : '#10b981',
                                            padding: '1rem 1.5rem',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em', color: isNotApproved ? '#fef2f2' : isAlreadyIn ? '#78350f' : '#022c22', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                                {isNotApproved ? 'ENTRY REJECTED' : isAlreadyIn ? 'Already Checked In' : 'Valid Pass'}
                                            </div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{displayName}</div>
                                            {isCouple && (
                                                <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', fontWeight: 600, color: isNotApproved ? '#fee2e2' : isAlreadyIn ? '#fef3c7' : '#a7f3d0', letterSpacing: '0.05em' }}>COUPLE PASS — 2 GUESTS</div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ marginBottom: partnerName ? '1rem' : 0 }}>
                                                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.4rem' }}>Guest</div>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.2rem' }}>{primaryName}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                    {scannedGuest.phone && <span style={{ marginRight: '1rem' }}>{scannedGuest.phone}</span>}
                                                    {scannedGuest.email && <span>{scannedGuest.email}</span>}
                                                </div>
                                            </div>
                                            {partnerName && (
                                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.4rem' }}>Partner</div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.2rem' }}>{partnerName}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                        {scannedGuest.partner_phone && <span style={{ marginRight: '1rem' }}>{scannedGuest.partner_phone}</span>}
                                                        {scannedGuest.partner_email && <span>{scannedGuest.partner_email}</span>}
                                                    </div>
                                                </div>
                                            )}

                                            {isNotApproved ? (
                                                <div style={{ marginTop: '1.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#991b1b', fontWeight: 600 }}>
                                                    <i className="fas fa-ban" style={{ marginRight: '6px' }}></i>
                                                    ENTRY REJECTED: Guest is NOT approved for this event ({scannedGuest.statusText || 'Pending Approval'}). Entry is denied.
                                                </div>
                                            ) : isAlreadyIn ? (
                                                <div style={{ marginTop: '1.25rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#92400e', fontWeight: 600 }}>
                                                    This pass has already been used for entry.
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="em-btn em-btn-primary full-width"
                                                    style={{ background: '#10b981', marginTop: '1.25rem', marginBottom: '0', padding: '0.9rem', fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.05em' }}
                                                    onClick={handleConfirmScannedCheckIn}
                                                >
                                                    Confirm Check-In
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    window.isProcessingScan = false;
                                                    lastScanTimeRef.current = Date.now() + 800;
                                                    lastScannedCodeRef.current = '';
                                                    setScannedGuest(null);
                                                    if (isNotApproved || isAlreadyIn) {
                                                        setShowQrScanner(true);
                                                    }
                                                }}
                                                className="em-btn em-btn-secondary full-width"
                                                style={{ marginTop: '0.6rem', background: isNotApproved ? '#ef4444' : undefined, color: isNotApproved ? '#fff' : undefined }}
                                            >
                                                {isNotApproved ? 'Close & Scan Next' : isAlreadyIn ? 'Scan Next Pass' : 'Cancel'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ── 1. DARK HERO REPORT BANNER ── */}
                        <div className="em-report-hero">
                            <div className="em-rhero-ring r1" />
                            <div className="em-rhero-ring r2" />

                            <div className="em-rhero-top">
                                <span className="em-rhero-eyebrow">Guest RSVP Dashboard</span>
                                <span className="em-rhero-badge">
                                    <i className="fas fa-circle" style={{ color: '#a3e635', fontSize: '8px' }} /> Live Operations
                                </span>
                            </div>

                            <div className="em-rhero-bignum">{rsvps.length}</div>
                            <h2 className="em-rhero-couple">{coupleTitle}</h2>
                            <p className="em-rhero-meta">
                                <i className="far fa-calendar-alt" />&nbsp;
                                {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBA'}
                                {event.ceremony_venue && <>&nbsp;·&nbsp;<i className="fas fa-map-marker-alt" />&nbsp;{event.ceremony_venue}</>}
                            </p>

                            {/* Hero Actions */}
                            <div className="em-rhero-btns">
                                <a
                                    href={liveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="em-rbtn"
                                >
                                    <i className="fas fa-external-link-alt" />
                                    <span>Visit Page</span>
                                </a>
                                <button type="button" className="em-rbtn em-rbtn-lime" onClick={downloadExcel}>
                                    <i className="fas fa-file-excel" />
                                    <span>Export (.xlsx)</span>
                                </button>
                                <button
                                    type="button"
                                    className="em-rbtn em-rbtn-primary"
                                    onClick={() => {
                                        window.isProcessingScan = false;
                                        setScanMessage(null);
                                        setShowQrScanner(true);
                                    }}
                                >
                                    <i className="fas fa-qrcode" />
                                    <span>Scan Pass</span>
                                </button>
                                <Link
                                    to={`/report/${slug}`}
                                    target="_blank"
                                    className="em-rbtn em-rbtn-ghost"
                                    title="Open Dedicated Fullscreen Report"
                                >
                                    <i className="fas fa-expand" />
                                    <span>Fullscreen Report</span>
                                </Link>
                            </div>
                        </div>

                        {/* ── 2. STAT PILLS STRIP (Same as Admin Report) ── */}
                        <div className="em-report-stats-strip">
                            <div className="em-rstat-pill">
                                <span className="em-rstat-num em-rstat-green">{attendingCount}</span>
                                <span className="em-rstat-lbl">Attending</span>
                            </div>
                            <div className="em-rstat-sep" />
                            <div className="em-rstat-pill">
                                <span className="em-rstat-num em-rstat-red">{declinedCount}</span>
                                <span className="em-rstat-lbl">Declined</span>
                            </div>
                            <div className="em-rstat-sep" />
                            <div className="em-rstat-pill">
                                <span className="em-rstat-num">{totalSeats}</span>
                                <span className="em-rstat-lbl">Total Seats</span>
                            </div>
                            <div className="em-rstat-sep" />
                            <div className="em-rstat-pill">
                                <span className="em-rstat-num em-rstat-emerald">{checkedInGuests.length}</span>
                                <span className="em-rstat-lbl">Checked In</span>
                            </div>
                            <div className="em-rstat-sep" />
                            <div className="em-rstat-pill">
                                <span className={`em-rstat-num ${pendingGuests.length > 0 ? 'em-rstat-amber' : ''}`}>{pendingGuests.length}</span>
                                <span className="em-rstat-lbl">Pending</span>
                            </div>
                        </div>

                        {/* ── 3. SEARCH TOOLBAR ── */}
                        <div className="em-report-search-wrap">
                            <i className="fas fa-search em-rsi" />
                            <input
                                type="text"
                                className="em-report-search-inp"
                                placeholder='Search by guest name, partner, email, or phone...'
                                value={rsvpSearch}
                                onChange={e => setRsvpSearch(e.target.value)}
                            />
                            {rsvpSearch && (
                                <button type="button" className="em-report-search-clear" onClick={() => setRsvpSearch('')}>
                                    <i className="fas fa-times" />
                                </button>
                            )}
                        </div>

                        {/* ── 4. ACTIVITY TABS ── */}
                        <div className="em-report-tabs-header">
                            <span className="em-report-tabs-title">Activities</span>
                            <div className="em-report-activity-tabs">
                                <button
                                    type="button"
                                    className={`em-ract-tab ${activeRsvpTab === 'approved' ? 'active' : ''}`}
                                    onClick={() => setActiveRsvpTab('approved')}
                                >
                                    Approved ({approvedGuests.length})
                                </button>
                                <button
                                    type="button"
                                    className={`em-ract-tab ${activeRsvpTab === 'checked_in' ? 'active' : ''}`}
                                    onClick={() => setActiveRsvpTab('checked_in')}
                                >
                                    Checked In {checkedInGuests.length > 0 && <span className="em-ract-badge green">{checkedInGuests.length}</span>}
                                </button>
                                <button
                                    type="button"
                                    className={`em-ract-tab ${activeRsvpTab === 'pending' ? 'active' : ''}`}
                                    onClick={() => setActiveRsvpTab('pending')}
                                >
                                    Pending {pendingGuests.length > 0 && <span className="em-ract-badge amber">{pendingGuests.length}</span>}
                                </button>
                                <button
                                    type="button"
                                    className={`em-ract-tab ${activeRsvpTab === 'declined' ? 'active' : ''}`}
                                    onClick={() => setActiveRsvpTab('declined')}
                                >
                                    Declined ({declinedGuests.length})
                                </button>
                                <button
                                    type="button"
                                    className={`em-ract-tab ${activeRsvpTab === 'all' ? 'active' : ''}`}
                                    onClick={() => setActiveRsvpTab('all')}
                                >
                                    All ({rsvps.length})
                                </button>
                            </div>
                        </div>

                        {/* ── 5. GUEST ROWS LIST (Same rich cards as Admin Report) ── */}
                        <div className="em-report-guest-list">
                            {displayedGuests.length === 0 ? (
                                <div className="em-empty-rsvps">
                                    <div className="em-empty-icon"><i className="fas fa-inbox" /></div>
                                    <h4>No guest responses found</h4>
                                    <p>
                                        {rsvps.length === 0
                                            ? 'Share your invitation link with guests to start collecting RSVPs.'
                                            : 'No guest responses match your current filter or search criteria.'}
                                    </p>
                                </div>
                            ) : (
                                displayedGuests.map(guest => {
                                    const { isCouple, primaryName, partnerName, displayName } = getGuestDetails(guest);
                                    const isCheckedIn = !!guest.checked_in;
                                    const isAttending = guest.attending?.toLowerCase() === 'yes' || guest.attending?.toLowerCase() === 'attending';
                                    const isPendingStatus = guest.status === 'pending';

                                    return (
                                        <div key={guest.id} className="em-guest-row">
                                            <div className="em-guest-avatar" style={{ background: getAvatarColor(primaryName) }}>
                                                {getGuestInitials(primaryName)}
                                                {isCouple && (
                                                    <span className="em-couple-heart" title="Couple">
                                                        <i className="fas fa-heart" />
                                                    </span>
                                                )}
                                            </div>

                                            <div className="em-guest-info">
                                                <div className="em-guest-name-row">
                                                    <span className="em-guest-name">
                                                        {isCouple && partnerName ? (
                                                            <>{primaryName} <span style={{ color: '#d97706', fontWeight: 'bold' }}>&</span> {partnerName}</>
                                                        ) : displayName}
                                                    </span>
                                                    {isCouple && <span className="em-couple-badge">Couple</span>}
                                                    <span className={`em-attending-tag ${isAttending ? 'yes' : 'no'}`}>
                                                        {isAttending ? 'Attending' : 'Declined'}
                                                    </span>
                                                </div>

                                                {isCouple && partnerName ? (
                                                    <div className="em-guest-contacts-couple">
                                                        <div>👤 {primaryName}: {guest.phone || 'No phone'} {guest.email ? `• ${guest.email}` : ''}</div>
                                                        <div>👥 {partnerName}: {guest.partner_phone || 'No phone'} {guest.partner_email ? `• ${guest.partner_email}` : ''}</div>
                                                    </div>
                                                ) : (
                                                    <div className="em-guest-contact">
                                                        {guest.phone && <span><i className="fas fa-phone" /> {guest.phone}</span>}
                                                        {guest.email && <span><i className="fas fa-envelope" /> {guest.email}</span>}
                                                        {!guest.phone && !guest.email && <span style={{ color: '#94a3b8' }}>No contact details</span>}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="em-guest-meta-right">
                                                <span className="em-seats-badge">
                                                    +{guest.guests_count || (isCouple ? 2 : 1)} {guest.guests_count > 1 || isCouple ? 'seats' : 'seat'}
                                                </span>

                                                <div className="em-guest-actions">
                                                    {isPendingStatus ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="em-gact-btn approve"
                                                                onClick={() => handleApproveRsvp(guest)}
                                                                disabled={!!processingAction}
                                                                title="Approve RSVP"
                                                            >
                                                                <i className="fas fa-check" /> Approve
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="em-gact-btn delete"
                                                                onClick={() => handleDeleteRsvp(guest)}
                                                                disabled={!!processingAction}
                                                                title="Delete RSVP"
                                                            >
                                                                <i className="fas fa-trash" />
                                                            </button>
                                                        </>
                                                    ) : isCheckedIn ? (
                                                        <>
                                                            <div className="em-checkedin-pill">
                                                                <i className="fas fa-check-circle" /> Checked In
                                                                {guest.checked_in_at && (
                                                                    <small>{new Date(guest.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                                                )}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="em-gact-btn undo"
                                                                onClick={() => handleToggleCheckIn(guest)}
                                                                disabled={!!processingAction}
                                                                title="Undo Check-In"
                                                            >
                                                                <i className="fas fa-undo" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="em-gact-btn delete"
                                                                onClick={() => handleDeleteRsvp(guest)}
                                                                disabled={!!processingAction}
                                                                title="Delete RSVP"
                                                            >
                                                                <i className="fas fa-trash" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="em-gact-btn checkin"
                                                                onClick={() => handleToggleCheckIn(guest)}
                                                                disabled={!!processingAction}
                                                                title="Check In Guest"
                                                            >
                                                                <i className="fas fa-qrcode" /> Check In
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="em-gact-btn delete"
                                                                onClick={() => handleDeleteRsvp(guest)}
                                                                disabled={!!processingAction}
                                                                title="Delete RSVP"
                                                            >
                                                                <i className="fas fa-trash" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 4: SHARE */}
                {activeTab === 'share' && (
                    <div className="em-tab-content">
                        {isUnapproved ? (
                            <div className="em-share-locked-panel">
                                <div className="em-locked-icon">
                                    <i className="fas fa-lock" />
                                </div>
                                <h3>Sharing unlocks once your event is approved</h3>
                                <p>
                                    Your event is currently <strong>{statusLabel(event.status)}</strong>. Complete your payment of <strong>{formattedAmount}</strong> to unlock invitation links, QR codes, and WhatsApp sharing.
                                </p>
                                <div className="em-locked-actions">
                                    <a
                                        href={`https://wa.me/${WHATSAPP_PHONE}?text=${waPaymentMsg}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="em-btn em-btn-whatsapp"
                                    >
                                        <i className="fab fa-whatsapp" /> Complete Payment on WhatsApp
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="em-share-grid">
                                <div className="em-panel">
                                    <h3>Invitation Link</h3>
                                    <p className="em-panel-desc">Share this direct link with your wedding guests</p>
                                    <div className="em-share-url-box">
                                        <span className="em-share-url-text">{liveUrl}</span>
                                        <button
                                            type="button"
                                            className={`em-btn em-btn-primary ${copied ? 'copied' : ''}`}
                                            onClick={handleCopy}
                                        >
                                            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} />
                                            {copied ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>

                                    <div className="em-share-quick-links">
                                        <a
                                            href={`https://wa.me/?text=${encodeURIComponent(`You're invited! ${coupleTitle}'s wedding invitation: ${liveUrl}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="em-share-quick-btn wa"
                                        >
                                            <i className="fab fa-whatsapp" /> Share via WhatsApp
                                        </a>
                                        <a
                                            href={`mailto:?subject=You're invited to ${coupleTitle}'s wedding!&body=View the digital invitation and RSVP here: ${liveUrl}`}
                                            className="em-share-quick-btn email"
                                        >
                                            <i className="fas fa-envelope" /> Share via Email
                                        </a>
                                        <a
                                            href={liveUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="em-share-quick-btn preview"
                                        >
                                            <i className="fas fa-external-link-alt" /> View Live Invitation
                                        </a>
                                    </div>
                                </div>

                                <div className="em-panel em-qr-panel">
                                    <h3>QR Code for Printed Cards</h3>
                                    <p className="em-panel-desc">Print this code on your cards for one-tap guest access</p>
                                    <div className="em-qr-container">
                                        <QRCodeSVG value={liveUrl} size={180} />
                                    </div>
                                    <p className="em-qr-help">Guests scan with their camera to open the invitation and RSVP.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="em-confirm-overlay" onClick={e => e.target === e.currentTarget && setDeleteConfirm(false)}>
                    <div className="em-confirm-card">
                        <div className="em-confirm-icon"><i className="fas fa-trash" /></div>
                        <h3>Delete Event?</h3>
                        <p>
                            Are you sure you want to delete <strong>{coupleTitle}</strong>? All {rsvps.length} RSVP responses will be permanently removed.
                        </p>
                        <div className="em-confirm-actions">
                            <button type="button" className="em-btn em-btn-ghost" onClick={() => setDeleteConfirm(false)} disabled={deleting}>
                                Cancel
                            </button>
                            <button type="button" className="em-btn em-btn-danger" onClick={handleDelete} disabled={deleting}>
                                {deleting ? <><i className="fas fa-spinner fa-spin" /> Deleting...</> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventManage;

