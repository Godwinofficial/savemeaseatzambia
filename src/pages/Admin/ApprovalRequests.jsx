import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { formatKwacha, formatPricingTier } from '../../utils/pricing';
import './ApprovalRequests.css';

const QUICK_REJECTION_REASONS = [
    'Payment proof required or unverified.',
    'Please provide the complete ceremony venue address.',
    'Event date is missing or invalid.',
    'Please upload high-resolution cover photo.',
    'Couple names need to be provided accurately.'
];

const ApprovalRequests = ({ weddings, onRefresh, currentUser, userProfiles = {} }) => {
    // Search & Filter State
    const [filterStatus, setFilterStatus] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    // Modals
    const [viewEvent, setViewEvent] = useState(null);
    const [approveEvent, setApproveEvent] = useState(null);
    const [rejectEvent, setRejectEvent] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditLoading, setAuditLoading] = useState(false);

    // Action loading state
    const [processingId, setProcessingId] = useState(null);

    // Copy Event ID helper
    const handleCopyId = (eventId, e) => {
        e?.stopPropagation();
        if (!eventId) return;
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(eventId)
                .then(() => {
                    setCopiedId(eventId);
                    setTimeout(() => setCopiedId(null), 2000);
                })
                .catch(() => {});
        }
    };

    // Load Audit Logs
    const loadAuditLogs = async () => {
        setAuditLoading(true);
        setShowAuditModal(true);
        try {
            const { data, error } = await supabase
                .from('approval_audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.warn('[ApprovalRequests] Audit logs fetch failed:', error.message);
                setAuditLogs([]);
            } else {
                setAuditLogs(data || []);
            }
        } catch (err) {
            console.error('Audit logs error:', err);
        } finally {
            setAuditLoading(false);
        }
    };

    // Handle Approve Action
    const confirmApprove = async () => {
        if (!approveEvent) return;
        setProcessingId(approveEvent.id);
        try {
            // Attempt server-enforced RPC
            const { data, error: rpcErr } = await supabase.rpc('approve_event', {
                p_wedding_id: approveEvent.id
            });

            if (rpcErr) {
                console.warn('[ApprovalRequests] RPC approve failed, attempting direct table update:', rpcErr.message);
                const { error: updErr } = await supabase
                    .from('weddings')
                    .update({
                        status: 'approved',
                        approved_by: currentUser?.id,
                        approved_at: new Date().toISOString(),
                        rejection_reason: null,
                        rejected_by: null,
                        rejected_at: null
                    })
                    .eq('id', approveEvent.id);

                if (updErr) throw updErr;

                // Log to audit table
                await supabase.from('approval_audit_logs').insert([{
                    wedding_id: approveEvent.id,
                    event_id: approveEvent.event_id,
                    event_name: `${approveEvent.groom_name} & ${approveEvent.bride_name}`,
                    action: 'approved',
                    admin_id: currentUser?.id,
                    admin_email: currentUser?.email
                }]).catch(e => console.warn('Audit log write error:', e));
            }

            alert(`✅ Event "${approveEvent.groom_name} & ${approveEvent.bride_name}" has been approved! The public invitation link is now live.`);
            setApproveEvent(null);
            if (viewEvent?.id === approveEvent.id) setViewEvent(null);
            if (onRefresh) await onRefresh();
        } catch (err) {
            alert('Approval failed: ' + (err.message || err));
        } finally {
            setProcessingId(null);
        }
    };

    // Handle Reject Action
    const confirmReject = async () => {
        if (!rejectEvent) return;
        setProcessingId(rejectEvent.id);
        try {
            const reasonToSave = rejectionReason.trim() || 'Details require revision.';

            // Attempt server-enforced RPC
            const { data, error: rpcErr } = await supabase.rpc('reject_event', {
                p_wedding_id: rejectEvent.id,
                p_reason: reasonToSave
            });

            if (rpcErr) {
                console.warn('[ApprovalRequests] RPC reject failed, attempting direct table update:', rpcErr.message);
                const { error: updErr } = await supabase
                    .from('weddings')
                    .update({
                        status: 'rejected',
                        rejected_by: currentUser?.id,
                        rejected_at: new Date().toISOString(),
                        rejection_reason: reasonToSave
                    })
                    .eq('id', rejectEvent.id);

                if (updErr) throw updErr;

                // Log to audit table
                await supabase.from('approval_audit_logs').insert([{
                    wedding_id: rejectEvent.id,
                    event_id: rejectEvent.event_id,
                    event_name: `${rejectEvent.groom_name} & ${rejectEvent.bride_name}`,
                    action: 'rejected',
                    reason: reasonToSave,
                    admin_id: currentUser?.id,
                    admin_email: currentUser?.email
                }]).catch(e => console.warn('Audit log write error:', e));
            }

            alert(`Event marked as rejected. The host will see: "${reasonToSave}" and will be able to edit and resubmit.`);
            setRejectEvent(null);
            setRejectionReason('');
            if (viewEvent?.id === rejectEvent.id) setViewEvent(null);
            if (onRefresh) await onRefresh();
        } catch (err) {
            alert('Rejection failed: ' + (err.message || err));
        } finally {
            setProcessingId(null);
        }
    };

    // Calculate Counts
    const pendingCount = weddings.filter(w => w.status === 'pending').length;
    const approvedCount = weddings.filter(w => w.status === 'approved' || w.status === 'active').length;
    const rejectedCount = weddings.filter(w => w.status === 'rejected').length;
    const totalCount = weddings.length;

    // Filter and Search Events
    const filteredWeddings = weddings.filter(wedding => {
        // Status filter
        if (filterStatus === 'pending') {
            if (wedding.status !== 'pending') return false;
        } else if (filterStatus === 'approved') {
            if (wedding.status !== 'approved' && wedding.status !== 'active') return false;
        } else if (filterStatus === 'rejected') {
            if (wedding.status !== 'rejected') return false;
        }

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const names = `${wedding.groom_name || ''} ${wedding.bride_name || ''}`.toLowerCase();
            const id = (wedding.event_id || '').toLowerCase();
            const owner = (userProfiles[wedding.user_id]?.email || userProfiles[wedding.user_id]?.full_name || '').toLowerCase();
            return names.includes(q) || id.includes(q) || owner.includes(q);
        }

        return true;
    });

    return (
        <div className="ar-container">
            {/* Top Stat Cards */}
            <div className="ar-stats-grid">
                <div className="ar-stat-card" onClick={() => setFilterStatus('pending')} style={{ cursor: 'pointer' }}>
                    <div className="ar-stat-icon pending">
                        <i className="fas fa-clock" />
                    </div>
                    <div>
                        <div className="ar-stat-val">{pendingCount}</div>
                        <div className="ar-stat-lbl">Pending Review</div>
                    </div>
                </div>

                <div className="ar-stat-card" onClick={() => setFilterStatus('approved')} style={{ cursor: 'pointer' }}>
                    <div className="ar-stat-icon approved">
                        <i className="fas fa-check-circle" />
                    </div>
                    <div>
                        <div className="ar-stat-val">{approvedCount}</div>
                        <div className="ar-stat-lbl">Approved & Live</div>
                    </div>
                </div>

                <div className="ar-stat-card" onClick={() => setFilterStatus('rejected')} style={{ cursor: 'pointer' }}>
                    <div className="ar-stat-icon rejected">
                        <i className="fas fa-times-circle" />
                    </div>
                    <div>
                        <div className="ar-stat-val">{rejectedCount}</div>
                        <div className="ar-stat-lbl">Rejected</div>
                    </div>
                </div>

                <div className="ar-stat-card">
                    <div className="ar-stat-icon audit">
                        <i className="fas fa-history" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div className="ar-stat-val">{totalCount}</div>
                        <div className="ar-stat-lbl">Total Events</div>
                    </div>
                    <button type="button" className="ar-audit-btn" onClick={loadAuditLogs}>
                        <i className="fas fa-list-alt" /> Audit Trail
                    </button>
                </div>
            </div>

            {/* Controls Toolbar: Search and Filter Tabs */}
            <div className="ar-toolbar">
                <div className="ar-search-box">
                    <i className="fas fa-search ar-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by Event ID, couple name, or owner email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ar-search-input"
                    />
                    {searchQuery && (
                        <button type="button" className="ar-search-clear" onClick={() => setSearchQuery('')}>
                            <i className="fas fa-times" />
                        </button>
                    )}
                </div>

                <div className="ar-filter-tabs">
                    <button
                        type="button"
                        className={`ar-filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('pending')}
                    >
                        Pending ({pendingCount})
                    </button>
                    <button
                        type="button"
                        className={`ar-filter-tab ${filterStatus === 'approved' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('approved')}
                    >
                        Approved ({approvedCount})
                    </button>
                    <button
                        type="button"
                        className={`ar-filter-tab ${filterStatus === 'rejected' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('rejected')}
                    >
                        Rejected ({rejectedCount})
                    </button>
                    <button
                        type="button"
                        className={`ar-filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('all')}
                    >
                        All ({totalCount})
                    </button>
                </div>
            </div>

            {/* Events List */}
            {filteredWeddings.length === 0 ? (
                <div className="ar-empty">
                    <i className="fas fa-inbox" />
                    <h3>No {filterStatus !== 'all' ? filterStatus : ''} approval requests found</h3>
                    <p>
                        {searchQuery
                            ? `No events matched your search query "${searchQuery}".`
                            : filterStatus === 'pending'
                            ? 'All incoming events have been reviewed! New submissions will appear here.'
                            : 'No events match the selected filter.'}
                    </p>
                </div>
            ) : (
                <div className="ar-cards-list">
                    {filteredWeddings.map(wedding => {
                        const owner = userProfiles[wedding.user_id] || {};
                        const isPending = wedding.status === 'pending';
                        const isApproved = wedding.status === 'approved' || wedding.status === 'active';
                        const isRejected = wedding.status === 'rejected';
                        const priceDisplay = formatKwacha(wedding.balance_due ?? wedding.price ?? 550);
                        const tierDisplay = formatPricingTier(wedding.pricing_tier);

                        const formattedDate = wedding.date
                            ? new Date(wedding.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Date TBA';

                        const submittedDate = wedding.submitted_at || wedding.created_at
                            ? new Date(wedding.submitted_at || wedding.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'N/A';

                        return (
                            <div key={wedding.id} className={`ar-card ${wedding.status || 'pending'}`}>
                                {/* Header: Event ID + Status */}
                                <div className="ar-card-head">
                                    <div className="ar-id-wrap">
                                        <i className="fas fa-fingerprint" style={{ color: '#1fa09b' }} />
                                        <span>{wedding.event_id || 'ID TBA'}</span>
                                        {wedding.event_id && (
                                            <button
                                                type="button"
                                                className="ar-copy-id-btn"
                                                onClick={(e) => handleCopyId(wedding.event_id, e)}
                                                title="Copy Event ID"
                                            >
                                                <i className={`fas ${copiedId === wedding.event_id ? 'fa-check' : 'fa-copy'}`} />
                                                {copiedId === wedding.event_id ? 'Copied' : 'Copy'}
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                            Submitted: <strong>{submittedDate}</strong>
                                        </span>
                                        <span className={`ar-status-badge ${isPending ? 'pending' : isApproved ? 'approved' : 'rejected'}`}>
                                            <i className={`fas ${isPending ? 'fa-clock' : isApproved ? 'fa-check-circle' : 'fa-times-circle'}`} />
                                            {isPending ? 'Pending Approval' : isApproved ? 'Approved' : 'Rejected'}
                                        </span>
                                    </div>
                                </div>

                                {/* Main Row: Couple & Owner */}
                                <div className="ar-card-main">
                                    <div>
                                        <h3 className="ar-event-title">
                                            {wedding.groom_name || 'Groom'} & {wedding.bride_name || 'Bride'}
                                        </h3>
                                        <div className="ar-owner-info">
                                            <div className="ar-owner-avatar">
                                                <i className="fas fa-user" />
                                            </div>
                                            <span>
                                                Owner: <strong>{owner.full_name || 'Host'}</strong> ({owner.email || 'No email provided'})
                                            </span>
                                        </div>
                                    </div>

                                    {/* Meta Chips */}
                                    <div className="ar-meta-chips">
                                        <span className="ar-chip">
                                            <i className="fas fa-calendar-alt" /> {formattedDate}
                                        </span>
                                        <span className="ar-chip">
                                            <i className="fas fa-users" /> {wedding.guest_count || 100} Guests
                                        </span>
                                        <span className="ar-chip price">
                                            <i className="fas fa-tag" /> {priceDisplay}
                                        </span>
                                        <span className="ar-chip tier">
                                            {tierDisplay}
                                        </span>
                                        {wedding.ceremony_venue && (
                                            <span className="ar-chip" title={wedding.ceremony_venue}>
                                                <i className="fas fa-map-marker-alt" /> {wedding.ceremony_venue.slice(0, 30)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Rejection reason alert banner if rejected */}
                                {isRejected && wedding.rejection_reason && (
                                    <div className="ar-reason-box">
                                        <i className="fas fa-exclamation-circle" style={{ marginTop: 2 }} />
                                        <div>
                                            <strong>Rejection Reason:</strong> {wedding.rejection_reason}
                                        </div>
                                    </div>
                                )}

                                {/* Approval notes if approved */}
                                {isApproved && wedding.approved_at && (
                                    <div style={{ fontSize: '0.78rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <i className="fas fa-shield-alt" />
                                        Approved on {new Date(wedding.approved_at).toLocaleString()} • Public invitation is live
                                    </div>
                                )}

                                {/* Actions Footer */}
                                <div className="ar-card-actions">
                                    <button
                                        type="button"
                                        className="ar-btn ar-btn-view"
                                        onClick={() => setViewEvent(wedding)}
                                    >
                                        <i className="fas fa-eye" /> View Details
                                    </button>

                                    {!isApproved && (
                                        <button
                                            type="button"
                                            className="ar-btn ar-btn-approve"
                                            onClick={() => setApproveEvent(wedding)}
                                            disabled={processingId === wedding.id}
                                        >
                                            <i className="fas fa-check-circle" /> Approve
                                        </button>
                                    )}

                                    {!isRejected && (
                                        <button
                                            type="button"
                                            className="ar-btn ar-btn-reject"
                                            onClick={() => {
                                                setRejectEvent(wedding);
                                                setRejectionReason(wedding.rejection_reason || '');
                                            }}
                                            disabled={processingId === wedding.id}
                                        >
                                            <i className="fas fa-times-circle" /> Reject
                                        </button>
                                    )}

                                    <a
                                        href={`${window.location.origin}/w/${wedding.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ar-btn ar-btn-public"
                                        title="Open public invitation link in new tab"
                                    >
                                        <i className="fas fa-external-link-alt" />
                                        {isApproved ? 'Live Invitation' : 'Preview (Host view)'}
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── View Details Modal ── */}
            {viewEvent && (
                <div className="ar-modal-overlay" onClick={(e) => e.target === e.currentTarget && setViewEvent(null)}>
                    <div className="ar-modal">
                        <div className="ar-modal-header">
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#1fa09b', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Event Review • {viewEvent.event_id || 'ID Pending'}
                                </div>
                                <h3>{viewEvent.groom_name || 'Groom'} & {viewEvent.bride_name || 'Bride'}</h3>
                            </div>
                            <button type="button" className="ar-modal-close" onClick={() => setViewEvent(null)}>
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        {/* Host Profile Info */}
                        <div className="ar-detail-section">
                            <div className="ar-sec-title"><i className="fas fa-user-circle" /> Host Information</div>
                            <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                                <strong>Name:</strong> {userProfiles[viewEvent.user_id]?.full_name || 'Host'}<br />
                                <strong>Email:</strong> {userProfiles[viewEvent.user_id]?.email || 'N/A'}<br />
                                <strong>User ID:</strong> <code style={{ fontSize: '0.78rem' }}>{viewEvent.user_id || 'Guest/Unassigned'}</code>
                            </div>
                        </div>

                        {/* Ceremony & Reception Details */}
                        <div className="ar-detail-section">
                            <div className="ar-sec-title"><i className="fas fa-church" /> Ceremony & Reception</div>
                            <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                                <strong>Ceremony:</strong> {viewEvent.ceremony_venue || 'TBA'} ({viewEvent.ceremony_time || 'Morning'})<br />
                                <strong>Ceremony Address:</strong> {viewEvent.ceremony_address || viewEvent.location || 'Lusaka, Zambia'}<br />
                                <strong>Reception:</strong> {viewEvent.reception_venue || 'TBA'} ({viewEvent.reception_time || 'Afternoon'})<br />
                                <strong>Reception Address:</strong> {viewEvent.reception_address || 'Lusaka, Zambia'}
                            </div>
                        </div>

                        {/* Guest Capacity & Pricing */}
                        <div className="ar-detail-section">
                            <div className="ar-sec-title"><i className="fas fa-tag" /> Guest Capacity & Tier</div>
                            <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                                <strong>Guest Count:</strong> {viewEvent.guest_count || 100} guests<br />
                                <strong>Pricing Tier:</strong> {formatPricingTier(viewEvent.pricing_tier)}<br />
                                <strong>Calculated Price:</strong> {formatKwacha(viewEvent.balance_due ?? viewEvent.price ?? 550)}
                            </div>
                        </div>

                        {/* Dress Code & Story */}
                        <div className="ar-detail-section">
                            <div className="ar-sec-title"><i className="fas fa-tshirt" /> Dress Code & Story</div>
                            <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                                <strong>Dress Code:</strong> {viewEvent.dress_code || 'Formal'}<br />
                                <strong>Tagline:</strong> {viewEvent.tagline || 'We are getting married'}<br />
                                {viewEvent.story_part1 && (
                                    <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#64748b' }}>
                                        "{viewEvent.story_part1.slice(0, 140)}..."
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Modal Action Bar */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                            {viewEvent.status !== 'approved' && viewEvent.status !== 'active' && (
                                <button
                                    type="button"
                                    className="ar-btn ar-btn-approve"
                                    onClick={() => { setApproveEvent(viewEvent); }}
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    <i className="fas fa-check-circle" /> Approve Event
                                </button>
                            )}
                            {viewEvent.status !== 'rejected' && (
                                <button
                                    type="button"
                                    className="ar-btn ar-btn-reject"
                                    onClick={() => {
                                        setRejectEvent(viewEvent);
                                        setRejectionReason(viewEvent.rejection_reason || '');
                                    }}
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    <i className="fas fa-times-circle" /> Reject Event
                                </button>
                            )}
                            <button
                                type="button"
                                className="ar-btn ar-btn-view"
                                onClick={() => setViewEvent(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Approve Confirmation Modal ── */}
            {approveEvent && (
                <div className="ar-modal-overlay" onClick={(e) => e.target === e.currentTarget && setApproveEvent(null)}>
                    <div className="ar-modal" style={{ maxWidth: '460px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '50%',
                                background: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '28px', margin: '0 auto 1rem'
                            }}>
                                <i className="fas fa-check-circle" />
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                                Approve Event?
                            </h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                You are approving <strong>{approveEvent.groom_name} & {approveEvent.bride_name}</strong> ({approveEvent.event_id || 'ID TBA'}).
                            </p>
                        </div>

                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', fontSize: '0.85rem', color: '#334155', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span>Guest Capacity:</span>
                                <strong>{approveEvent.guest_count || 100} Guests</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span>Tier & Amount:</span>
                                <strong>{formatKwacha(approveEvent.balance_due ?? approveEvent.price ?? 550)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Public Link:</span>
                                <strong style={{ color: '#10b981' }}>Will activate immediately</strong>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                className="ar-btn ar-btn-view"
                                onClick={() => setApproveEvent(null)}
                                style={{ flex: 1, justifyContent: 'center' }}
                                disabled={Boolean(processingId)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="ar-btn ar-btn-approve"
                                onClick={confirmApprove}
                                style={{ flex: 1.5, justifyContent: 'center' }}
                                disabled={Boolean(processingId)}
                            >
                                {processingId ? (
                                    <><i className="fas fa-spinner fa-spin" /> Activating...</>
                                ) : (
                                    <><i className="fas fa-check" /> Confirm & Activate</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reject Confirmation Modal ── */}
            {rejectEvent && (
                <div className="ar-modal-overlay" onClick={(e) => e.target === e.currentTarget && setRejectEvent(null)}>
                    <div className="ar-modal" style={{ maxWidth: '500px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '50%',
                                background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '28px', margin: '0 auto 1rem'
                            }}>
                                <i className="fas fa-times-circle" />
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                                Reject Invitation?
                            </h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                Please provide a reason. The host will see this message and be guided to edit and resubmit.
                            </p>
                        </div>

                        {/* Quick Pick Reasons */}
                        <div style={{ marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                Quick Pick Reason:
                            </label>
                            <div className="ar-quick-reasons">
                                {QUICK_REJECTION_REASONS.map((reason, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className="ar-reason-tag"
                                        onClick={() => setRejectionReason(reason)}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Reason Textarea */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                Reason to display to host:
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="E.g. Incomplete venue address or payment proof unverified..."
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    border: '1px solid #cbd5e1',
                                    fontFamily: 'inherit',
                                    fontSize: '0.88rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                className="ar-btn ar-btn-view"
                                onClick={() => setRejectEvent(null)}
                                style={{ flex: 1, justifyContent: 'center' }}
                                disabled={Boolean(processingId)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="ar-btn ar-btn-reject"
                                onClick={confirmReject}
                                style={{ flex: 1.5, justifyContent: 'center' }}
                                disabled={Boolean(processingId)}
                            >
                                {processingId ? (
                                    <><i className="fas fa-spinner fa-spin" /> Saving...</>
                                ) : (
                                    <><i className="fas fa-ban" /> Confirm Rejection</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Audit Trail Modal ── */}
            {showAuditModal && (
                <div className="ar-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAuditModal(false)}>
                    <div className="ar-modal" style={{ maxWidth: '680px' }}>
                        <div className="ar-modal-header">
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Super Admin Activity
                                </div>
                                <h3>Approval & Rejection Audit Trail</h3>
                            </div>
                            <button type="button" className="ar-modal-close" onClick={() => setShowAuditModal(false)}>
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        {auditLoading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '8px' }} /><br />
                                Loading audit log history...
                            </div>
                        ) : auditLogs.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                <i className="fas fa-file-alt" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '8px' }} /><br />
                                No audit records recorded yet. Every approval and rejection action will be logged here.
                            </div>
                        ) : (
                            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                                <table className="ar-audit-table">
                                    <thead>
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>Action</th>
                                            <th>Event ID / Name</th>
                                            <th>Admin</th>
                                            <th>Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {auditLogs.map((log) => (
                                            <tr key={log.id}>
                                                <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#64748b' }}>
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td>
                                                    <span className={`ar-status-badge ${log.action}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td>
                                                    <strong>{log.event_id || '—'}</strong><br />
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.event_name}</span>
                                                </td>
                                                <td style={{ fontSize: '0.78rem' }}>
                                                    {log.admin_email || 'Super Admin'}
                                                </td>
                                                <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    {log.reason || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                            <button
                                type="button"
                                className="ar-btn ar-btn-view"
                                onClick={() => setShowAuditModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalRequests;
