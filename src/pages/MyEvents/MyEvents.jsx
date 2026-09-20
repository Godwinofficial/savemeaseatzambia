import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import logoImg from '../../assets/images/logo1.png';
import { isDraftMeaningful, pushDraftToUserAccount, generateEventId } from '../../utils/draftManager';
import { formatKwacha, PAYMENT_PHONE_NUMBER, PAYMENT_PHONE_RAW, formatPricingTier } from '../../utils/pricing';
import useUserRole from '../../utils/useUserRole';
import './MyEvents.css';

// Template styling meta
const TEMPLATE_META = {
    1: { bg: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', accent: '#c5a059', ornament: '♡', name: 'Classic Elegance' },
    2: { bg: 'linear-gradient(135deg, #2a2012 0%, #45341c 100%)', accent: '#e6ca85', ornament: '✦', name: 'Golden Romance' },
    3: { bg: 'linear-gradient(135deg, #0b221a 0%, #13392d 100%)', accent: '#34d399', ornament: '🌿', name: 'Tropical Elegance' },
    4: { bg: 'linear-gradient(135deg, #252e24 0%, #3e4a3b 100%)', accent: '#a3b18a', ornament: '❀', name: 'Botanical Olive' },
    5: { bg: 'linear-gradient(135deg, #3d1f19 0%, #68362d 100%)', accent: '#f87171', ornament: '✧', name: 'Terracotta Earth' },
    7: { bg: 'linear-gradient(135deg, #252e24 0%, #3e4a3b 100%)', accent: '#a3b18a', ornament: '❀', name: 'Botanical Olive' },
    8: { bg: 'linear-gradient(135deg, #3d1f19 0%, #68362d 100%)', accent: '#f87171', ornament: '✧', name: 'Terracotta Earth' },
};

function statusClass(status) {
    if (!status || status === 'draft') return 'status-draft';
    if (status === 'active' || status === 'approved') return 'status-active';
    if (status === 'pending') return 'status-pending';
    if (status === 'rejected') return 'status-rejected';
    return 'status-draft';
}

function statusLabel(status) {
    const map = {
        active: 'Approved',
        approved: 'Approved',
        pending: 'Pending Approval',
        draft: 'Draft',
        rejected: 'Rejected'
    };
    return map[status] || status || 'Draft';
}

const SkeletonCard = () => (
    <div className="me-skeleton-card">
        <div className="me-skeleton-banner" />
        <div className="me-skeleton-body">
            <div className="me-skeleton-line long" />
            <div className="me-skeleton-line short" style={{ marginBottom: 20 }} />
            <div className="me-skeleton-line long" />
        </div>
    </div>
);

const MyEvents = () => {
    const navigate = useNavigate();
    const { isSuperAdmin } = useUserRole();
    const [user, setUser] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Search and Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Actions
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [paymentTarget, setPaymentTarget] = useState(null);
    const [sampleTarget, setSampleTarget] = useState(null);
    const [previewTemplate, setPreviewTemplate] = useState(1);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [copiedPaymentNum, setCopiedPaymentNum] = useState(null);
    const [duplicating, setDuplicating] = useState(null);

    // Copy states
    const [copiedEventId, setCopiedEventId] = useState(null);
    const [copiedPayPhone, setCopiedPayPhone] = useState(null);
    const [copiedPreviewId, setCopiedPreviewId] = useState(null);

    // Dropdowns
    const [avatarOpen, setAvatarOpen] = useState(false);
    const avatarRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (avatarRef.current && !avatarRef.current.contains(e.target)) {
                setAvatarOpen(false);
            }
            if (!e.target.closest('.me-modern-right-badge')) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    // Get current user and auto-push any guest draft to account
    useEffect(() => {
        let mounted = true;
        const checkUserAndSync = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!mounted) return;
            if (!user) {
                navigate('/login');
                return;
            }
            if (isDraftMeaningful()) {
                console.log('[MyEvents] Guest draft detected! Pushing to user account...');
                await pushDraftToUserAccount(user);
            }
            setUser(user);
        };
        checkUserAndSync();
        return () => { mounted = false; };
    }, [navigate]);

    // Fetch user's events
    const fetchEvents = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            // Use select('*') so it never breaks if custom columns aren't added yet
            let { data, error: err } = await supabase
                .from('weddings')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (err) {
                console.warn('[MyEvents] Initial select failed:', err.message, err.details, err);
                // Fallback without ordering by created_at in case created_at doesn't exist
                const fallback = await supabase
                    .from('weddings')
                    .select('*')
                    .eq('user_id', user.id);

                if (fallback.error) {
                    throw fallback.error;
                }
                data = fallback.data;
            }
            setEvents(data || []);
        } catch (err) {
            console.error('Fetch error:', err.message || err);
            setError(err.message || 'Could not load your events. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);


    // Copy Event ID
    const handleCopyEventId = (eventId, e) => {
        e?.stopPropagation();
        if (!eventId) return;
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(eventId)
                .then(() => {
                    setCopiedEventId(eventId);
                    setTimeout(() => setCopiedEventId(null), 2000);
                })
                .catch(() => { });
        }
    };

    // Copy Payment Phone
    const handleCopyPaymentPhone = (eventId, e) => {
        e?.stopPropagation();
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(PAYMENT_PHONE_RAW)
                .then(() => {
                    setCopiedPayPhone(eventId);
                    setTimeout(() => setCopiedPayPhone(null), 2000);
                })
                .catch(() => { });
        }
    };

    // Copy Preview Link
    const handleCopyPreview = (event, e) => {
        e?.stopPropagation();
        const previewUrl = `${window.location.origin}/api/preview?slug=${event.slug || event.id}&template=${event.template_id || 1}`;
        
        const fallbackCopy = () => {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = previewUrl;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
                setCopiedPreviewId(event.id);
                setTimeout(() => setCopiedPreviewId(null), 2000);
            } catch (err) {
                alert("Could not copy. Link: " + previewUrl);
            }
        };

        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(previewUrl)
                .then(() => {
                    setCopiedPreviewId(event.id);
                    setTimeout(() => setCopiedPreviewId(null), 2000);
                })
                .catch(() => fallbackCopy());
        } else {
            fallbackCopy();
        }
    };

    // Delete event
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const { error: err } = await supabase
                .from('weddings')
                .delete()
                .eq('id', deleteTarget.id)
                .eq('user_id', user.id);

            if (err) throw err;
            setEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (err) {
            alert('Delete failed: ' + err.message);
        } finally {
            setDeleting(false);
        }
    };

    // Save Template Change
    const handleSaveTemplate = async () => {
        if (!sampleTarget) return;
        setSavingTemplate(true);
        try {
            const { error } = await supabase
                .from('weddings')
                .update({ template_id: previewTemplate })
                .eq('id', sampleTarget.id);
            if (error) throw error;

            setEvents(events.map(e => e.id === sampleTarget.id ? { ...e, template_id: previewTemplate } : e));
            setSampleTarget(null);
        } catch (err) {
            alert('Failed to save theme: ' + err.message);
        } finally {
            setSavingTemplate(false);
        }
    };

    // Duplicate event
    const handleDuplicate = async (event) => {
        setActiveMenuId(null);
        setDuplicating(event.id);
        try {
            const { data: full, error: fetchErr } = await supabase
                .from('weddings')
                .select('*')
                .eq('id', event.id)
                .single();

            if (fetchErr) throw fetchErr;

            const stamp = Date.now().toString().slice(-6);
            const cleanGroom = (full.groom_name || 'groom').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const cleanBride = (full.bride_name || 'bride').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const cleanDate = (full.date || new Date().toISOString()).slice(0, 10).replace(/[^0-9]+/g, '-');
            const newSlug = `${cleanGroom}-${cleanBride}-${cleanDate}-${stamp}`;

            const { id, created_at, slug, views, payment_proof_sent_at, approved_at, ...rest } = full;
            const newEvent = {
                ...rest,
                event_id: generateEventId(),
                slug: newSlug,
                status: 'pending',
                views: 0,
                user_id: user.id
            };

            const { error: insertErr } = await supabase.from('weddings').insert([newEvent]);
            if (insertErr) throw insertErr;

            await fetchEvents();
        } catch (err) {
            alert('Duplication failed: ' + err.message);
        } finally {
            setDuplicating(null);
        }
    };

    // Filtered events
    const filteredEvents = events.filter(e => {
        // Status filter
        if (statusFilter === 'active') {
            if (e.status !== 'active' && e.status !== 'approved') return false;
        } else if (statusFilter === 'pending') {
            if (e.status !== 'pending') return false;
        } else if (statusFilter === 'draft') {
            if (e.status !== 'draft') return false;
        }

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const names = `${e.groom_name || ''} ${e.bride_name || ''}`.toLowerCase();
            const id = (e.event_id || '').toLowerCase();
            const slug = (e.slug || '').toLowerCase();
            return names.includes(q) || id.includes(q) || slug.includes(q);
        }

        return true;
    });

    const getInitials = (u) => {
        if (!u) return '?';
        const meta = u.user_metadata;
        if (meta?.full_name) return meta.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return (u.email || '??').slice(0, 2).toUpperCase();
    };

    return (
        <div className="my-events-page">
            {/* Navbar */}
            <nav className="my-events-nav">
                <div className="my-events-nav-inner">
                    <Link to="/" className="my-events-brand">
                        <img src={logoImg} alt="SaveMeASeat" />
                    </Link>
                    <div className="my-events-nav-actions">
                        <Link to="/create-event" className="my-events-create-btn">
                            <i className="fas fa-plus" /> Create Event
                        </Link>
                        {user && (
                            <div className="me-avatar-wrap" ref={avatarRef}>
                                <button
                                    type="button"
                                    className="me-avatar-btn"
                                    onClick={() => setAvatarOpen(o => !o)}
                                    aria-label="Account menu"
                                >
                                    {getInitials(user)}
                                </button>
                                {avatarOpen && (
                                    <div className="me-avatar-dropdown">
                                        <div className="me-avatar-email" title={user.email}>{user.email}</div>
                                        <Link to="/my-events" className="me-avatar-item" onClick={() => setAvatarOpen(false)}>
                                            <i className="fas fa-th-large" /> My Events
                                        </Link>
                                        {isSuperAdmin && (
                                            <Link to="/admin" className="me-avatar-item" onClick={() => setAvatarOpen(false)} style={{ color: '#c5a059', fontWeight: 600 }}>
                                                <i className="fas fa-shield-alt" /> Admin Panel
                                            </Link>
                                        )}
                                        <button
                                            type="button"
                                            className="me-avatar-item me-avatar-signout"
                                            onClick={async () => { await supabase.auth.signOut(); navigate('/'); }}
                                        >
                                            <i className="fas fa-sign-out-alt" /> Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Header */}
            {/* Simple Header */}
            <div style={{ maxWidth: '1240px', margin: '2rem auto 1rem', padding: '0 2rem' }}>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>My Events</h1>
            </div>

            {/* Filter & Search Bar */}
            <div className="my-events-controls-wrap">
                <div className="my-events-controls-inner">
                    <div className="me-search-box">
                        <i className="fas fa-search me-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by event name or Event ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="me-search-input"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="me-search-clear"
                                onClick={() => setSearchQuery('')}
                            >
                                <i className="fas fa-times" />
                            </button>
                        )}
                    </div>

                    <div className="me-filter-tabs">
                        <button
                            type="button"
                            className={`me-filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('all')}
                        >
                            All ({events.length})
                        </button>
                        <button
                            type="button"
                            className={`me-filter-tab ${statusFilter === 'active' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('active')}
                        >
                            Approved ({events.filter(e => e.status === 'active' || e.status === 'approved').length})
                        </button>
                        <button
                            type="button"
                            className={`me-filter-tab ${statusFilter === 'pending' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('pending')}
                        >
                            Pending ({events.filter(e => e.status === 'pending').length})
                        </button>
                        {events.some(e => e.status === 'draft') && (
                            <button
                                type="button"
                                className={`me-filter-tab ${statusFilter === 'draft' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('draft')}
                            >
                                Drafts ({events.filter(e => e.status === 'draft').length})
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="my-events-content">
                {error && (
                    <div className="me-error-box" style={{ marginBottom: '1.5rem' }}>
                        <i className="fas fa-exclamation-triangle" />
                        <span>{error}</span>
                        <button onClick={fetchEvents} className="me-btn me-btn-ghost" style={{ marginLeft: 'auto', fontSize: '0.78rem' }}>
                            <i className="fas fa-redo" /> Retry
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="me-skeleton-grid">
                        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                    </div>
                )}

                {/* Friendly Empty State: No events created yet */}
                {!loading && !error && events.length === 0 && (
                    <div className="me-empty-state">
                        <div className="me-empty-icon"><i className="fas fa-calendar-plus" /></div>
                        <h2>No events yet</h2>
                        <p>Create your first digital event invitation in minutes. Select a template, customize details, and share with your guests.</p>
                        <Link to="/create-event" className="me-empty-create-btn">
                            <i className="fas fa-plus" /> Create Event
                        </Link>
                    </div>
                )}

                {/* Friendly Empty State: Search / Filter zero results */}
                {!loading && !error && events.length > 0 && filteredEvents.length === 0 && (
                    <div className="me-empty-state me-empty-filtered">
                        <div className="me-empty-icon"><i className="fas fa-search" /></div>
                        <h2>No matching events found</h2>
                        <p>No events match your search "{searchQuery}" or selected status filter.</p>
                        <button
                            type="button"
                            className="me-empty-create-btn"
                            onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                        >
                            Clear Filters
                        </button>
                    </div>
                )}

                {/* Event Card Grid */}
                {!loading && filteredEvents.length > 0 && (
                    <div className="my-events-grid">
                        {filteredEvents.map(event => {
                            const tpl = TEMPLATE_META[event.template_id] || TEMPLATE_META[1];
                            const isPending = event.status === 'pending';
                            const isApproved = event.status === 'approved' || event.status === 'active';
                            const isRejected = event.status === 'rejected';
                            const eventPrice = event.balance_due ?? event.price ?? 550;
                            const formattedPrice = formatKwacha(eventPrice);
                            let eventDate = null;
                            if (event.date) {
                                try {
                                    const parsed = new Date(event.date);
                                    if (!isNaN(parsed.getTime())) {
                                        eventDate = parsed.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        });
                                    }
                                } catch {
                                    eventDate = null;
                                }
                            }

                            return (
                                <div className="me-modern-card" key={event.id} style={{ zIndex: activeMenuId === event.id ? 50 : 1 }}>
                                    <div className="me-modern-image-container">
                                        {event.cover_image ? (
                                            <img src={event.cover_image} alt="Event Cover" className="me-modern-image" />
                                        ) : (
                                            <div className="me-modern-image-placeholder" style={{ background: tpl.bg || '#e2e8f0' }} />
                                        )}
                                        <div className="me-modern-image-overlay">
                                            <div className="me-modern-image-text">
                                                <h3>{event.groom_name} & {event.bride_name}</h3>
                                                <p>{event.event_id ? `ID: ${event.event_id}` : tpl.name || 'Premium'}</p>
                                            </div>
                                            {isPending ? (
                                                <button onClick={() => setPaymentTarget(event)} className="me-modern-image-btn" style={{ border: 'none', cursor: 'pointer' }}>
                                                    Activate
                                                </button>
                                            ) : (
                                                <button onClick={() => navigate(`/report/${event.slug || event.id}`)} className="me-modern-image-btn" style={{ border: 'none', cursor: 'pointer' }}>
                                                    View Report
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="me-modern-content">
                                        <div className="me-modern-details">
                                            <div className="me-modern-status-title" style={{ color: isApproved ? '#0f172a' : isPending ? '#d97706' : '#dc2626' }}>
                                                {statusLabel(event.status)}
                                            </div>
                                            <div className="me-modern-subtitle">
                                                {event.ceremony_venue || event.tagline || 'SaveMeASeat Digital Invitation'}
                                            </div>

                                            <div className="me-modern-divider" />

                                            <div className="me-modern-stats">
                                                <div className="me-modern-stat">
                                                    <strong>{event.guest_count || 100}</strong>
                                                    <span>Guests</span>
                                                </div>
                                                <div className="me-modern-stat">
                                                    <strong>{formattedPrice}</strong>
                                                    <span>Price</span>
                                                </div>
                                                <div className="me-modern-stat">
                                                    <strong>{eventDate || 'TBA'}</strong>
                                                    <span>Date</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="me-modern-right-badge">
                                            <button
                                                type="button"
                                                className="me-modern-dots"
                                                onClick={() => setActiveMenuId(activeMenuId === event.id ? null : event.id)}
                                            >
                                                <i className="fas fa-ellipsis-h" />
                                            </button>

                                            {activeMenuId === event.id && (
                                                <div className="me-modern-dropdown" style={{ zIndex: 100 }}>
                                                    <button type="button" className="me-menu-item" onPointerDown={(e) => { e.preventDefault(); setActiveMenuId(null); navigate(`/edit-event/${event.slug || event.id}`); }}>
                                                        <i className="fas fa-edit" /> Edit Details
                                                    </button>
                                                    <button type="button" className="me-menu-item" onPointerDown={(e) => { e.preventDefault(); setActiveMenuId(null); navigate(`/report/${event.slug || event.id}`); }}>
                                                        <i className="fas fa-chart-pie" /> RSVP Report
                                                    </button>
                                                    {isApproved && (
                                                        <a href={`${window.location.origin}/w/${event.slug || event.id}`} target="_blank" rel="noopener noreferrer" className="me-menu-item" onPointerDown={(e) => e.stopPropagation()}>
                                                            <i className="fas fa-external-link-alt" /> View Live
                                                        </a>
                                                    )}
                                                    {isApproved ? (
                                                        <button type="button" className="me-menu-item" onPointerDown={(e) => { e.preventDefault(); setActiveMenuId(null); setSampleTarget(event); setPreviewTemplate(event.template_id || 1); }}>
                                                            <i className="fas fa-palette" /> Change Theme
                                                        </button>
                                                    ) : (
                                                        <a href={`${window.location.origin}/api/preview?slug=${event.slug || event.id}&template=${event.template_id || 1}`} target="_blank" rel="noopener noreferrer" className="me-menu-item" onPointerDown={(e) => e.stopPropagation()}>
                                                            <i className="fas fa-mobile-alt" /> View Sample
                                                        </a>
                                                    )}
                                                    <button type="button" className="me-menu-item" onPointerDown={(e) => { e.preventDefault(); handleCopyEventId(event.event_id, e); setActiveMenuId(null); }}>
                                                        <i className="fas fa-copy" /> Copy Event ID
                                                    </button>
                                                    <button type="button" className="me-menu-item" onPointerDown={(e) => { e.preventDefault(); handleDuplicate(event); }} disabled={duplicating === event.id}>
                                                        {duplicating === event.id ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-clone" />} Duplicate
                                                    </button>
                                                    <button type="button" className="me-menu-item me-menu-danger" onPointerDown={(e) => { e.preventDefault(); setActiveMenuId(null); setDeleteTarget(event); }}>
                                                        <i className="fas fa-trash" /> Delete
                                                    </button>
                                                </div>
                                            )}

                                            {(isPending || isRejected) && (
                                                <button
                                                    className="me-modern-icon-wrapper"
                                                    style={{ cursor: 'pointer', background: '#fffbeb', border: '1px dashed #fcd34d', color: '#b45309', display: 'flex', flexDirection: 'row', gap: '6px', width: 'auto', height: 'auto', padding: '6px 12px', borderRadius: '12px' }}
                                                    onClick={() => setPaymentTarget(event)}
                                                >
                                                    <i className="fas fa-wallet" style={{ fontSize: '0.9rem' }} />
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Pay</span>
                                                </button>
                                            )}
                                            {isApproved && (
                                                <>
                                                    <button
                                                        className="me-modern-icon-wrapper"
                                                        style={{ cursor: 'pointer', background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', display: 'flex', flexDirection: 'row', gap: '6px', width: 'auto', height: 'auto', padding: '6px 12px', borderRadius: '12px' }}
                                                        onClick={(e) => { e.stopPropagation(); window.open(`${window.location.origin}/w/${event.slug || event.id}`, '_blank'); }}
                                                    >
                                                        <i className="fas fa-external-link-alt" style={{ fontSize: '0.9rem' }} />
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Live</span>
                                                    </button>
                                                    
                                                    <button
                                                        className="me-modern-icon-wrapper"
                                                        style={{ cursor: 'pointer', background: '#eff6ff', border: '1px solid #3b82f6', color: '#2563eb', display: 'flex', flexDirection: 'row', gap: '6px', width: 'auto', height: 'auto', padding: '6px 12px', borderRadius: '12px' }}
                                                        onClick={(e) => handleCopyPreview(event, e)}
                                                        onPointerDown={(e) => { e.preventDefault(); handleCopyPreview(event, e); }}
                                                        title="Copy Preview Link"
                                                    >
                                                        <i className={copiedPreviewId === event.id ? "fas fa-check" : "fas fa-link"} style={{ fontSize: '0.9rem' }} />
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>{copiedPreviewId === event.id ? 'Copied' : 'Preview'}</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rejection Notice */}
                                    {isRejected && event.rejection_reason && (
                                        <div className="me-modern-rejection">
                                            <i className="fas fa-exclamation-circle" /> {event.rejection_reason}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Delete Confirm Modal */}
            {deleteTarget && (
                <div className="me-confirm-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
                    <div className="me-confirm-card">
                        <div className="me-confirm-icon"><i className="fas fa-trash" /></div>
                        <h3>Delete Event?</h3>
                        <p>
                            This will permanently delete <strong>{deleteTarget.groom_name} & {deleteTarget.bride_name}</strong>'s event
                            and all associated RSVPs. This action cannot be undone.
                        </p>
                        <div className="me-confirm-actions">
                            <button className="me-btn me-btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                                Cancel
                            </button>
                            <button className="me-btn me-btn-danger" onClick={handleDelete} disabled={deleting}>
                                {deleting ? <><i className="fas fa-spinner fa-spin" /> Deleting...</> : <><i className="fas fa-trash" /> Delete Event</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {paymentTarget && (
                <div className="me-confirm-overlay" onClick={(e) => e.target === e.currentTarget && setPaymentTarget(null)}>
                    <div className="me-confirm-card" style={{ maxWidth: '420px', padding: '2rem', textAlign: 'center', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e2e8f0', borderRadius: '24px' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Activate Your Event</h3>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                            Your beautiful digital invitation is ready. Complete the payment of <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>{formatKwacha(paymentTarget.balance_due ?? paymentTarget.price ?? 550)}</strong> to set it live for your guests!
                        </p>

                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', marginBottom: '2rem', border: '2px dashed #cbd5e1', position: 'relative', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Send Payment To
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase' }}>Airtel Money</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '1px', fontFamily: 'monospace' }}>
                                        0973 848066
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '2px', fontWeight: 700 }}>
                                        <i className="fas fa-check-circle" /> Godwin Banda
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (navigator?.clipboard?.writeText) {
                                            navigator.clipboard.writeText('0973848066');
                                            setCopiedPaymentNum('0973848066');
                                            setTimeout(() => setCopiedPaymentNum(null), 2000);
                                        }
                                    }}
                                    style={{ background: copiedPaymentNum === '0973848066' ? '#10b981' : '#f1f5f9', border: 'none', color: copiedPaymentNum === '0973848066' ? '#fff' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', padding: '8px 16px', borderRadius: '8px', transition: 'all 0.2s' }}
                                >
                                    {copiedPaymentNum === '0973848066' ? <><i className="fas fa-check" /> Copied</> : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <a
                            href={`https://wa.me/260960968349?text=${encodeURIComponent(`Hello SaveMeASeat, I have made payment for my event.\n\nEvent ID: ${paymentTarget.event_id || ''}\nEvent: ${paymentTarget.groom_name} & ${paymentTarget.bride_name}\nAmount Paid: ${formatKwacha(paymentTarget.balance_due ?? paymentTarget.price ?? 550)}\n\n[Please attach your screenshot of payment here]`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', color: '#fff', width: '100%', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', fontSize: '1.05rem', padding: '14px', borderRadius: '14px', boxShadow: '0 8px 16px rgba(37, 211, 102, 0.2)', fontWeight: 700, transition: 'transform 0.2s' }}
                            onClick={() => setPaymentTarget(null)}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <i className="fab fa-whatsapp" style={{ fontSize: '1.25rem' }} /> Send Proof via WhatsApp
                        </a>
                        <button type="button" style={{ width: '100%', background: 'transparent', border: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', padding: '10px' }} onClick={() => setPaymentTarget(null)}>
                            I'll do this later
                        </button>
                    </div>
                </div>
            )}
            {/* View Sample / Theme Modal */}
            {/* View Sample / Theme Modal */}
            {sampleTarget && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 99999, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', color: '#fff', borderBottom: '1px solid #1e293b' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Live Template Preview</h3>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{sampleTarget.groom_name} & {sampleTarget.bride_name}</div>
                        </div>
                        <button type="button" onClick={() => setSampleTarget(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                    </div>
                    
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <iframe 
                            src={`${window.location.origin}/w/${sampleTarget.slug || sampleTarget.id}?theme_preview=true&template=${previewTemplate}`} 
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title="Template Preview"
                        />
                    </div>

                    <div style={{ padding: '1rem', background: '#1e293b', borderTop: '1px solid #334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Select Template</div>
                            <button type="button" onClick={handleSaveTemplate} disabled={savingTemplate || previewTemplate === sampleTarget.template_id} style={{ background: (previewTemplate === sampleTarget.template_id) ? '#334155' : '#10b981', color: (previewTemplate === sampleTarget.template_id) ? '#94a3b8' : '#fff', border: 'none', padding: '6px 16px', borderRadius: '8px', fontWeight: 700, cursor: (previewTemplate === sampleTarget.template_id) ? 'not-allowed' : 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}>
                                {savingTemplate ? 'Saving...' : (previewTemplate === sampleTarget.template_id ? 'Current Theme' : 'Save Theme')}
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {Object.entries(TEMPLATE_META).map(([idStr, tpl]) => {
                                const id = Number(idStr);
                                const isSelected = previewTemplate === id;
                                return (
                                    <div key={id} 
                                        onClick={() => setPreviewTemplate(id)}
                                        style={{ minWidth: '110px', background: isSelected ? '#3b82f6' : '#0f172a', border: `2px solid ${isSelected ? '#60a5fa' : '#334155'}`, borderRadius: '10px', padding: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        <div style={{ height: '45px', borderRadius: '6px', background: tpl.bg, color: tpl.textColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '0.4rem' }}>
                                            <span style={{ fontSize: '0.7rem' }}>{tpl.ornament}</span>
                                            <span style={{ fontSize: '0.55rem', color: tpl.accent }}>{sampleTarget.groom_name ? `${sampleTarget.groom_name.split(' ')[0]} & ${sampleTarget.bride_name.split(' ')[0]}` : 'Couple'}</span>
                                        </div>
                                        <div style={{ color: '#f8fafc', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.name}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyEvents;
