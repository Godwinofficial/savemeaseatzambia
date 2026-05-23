import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import * as XLSX from 'xlsx';

const BridalShowerReport = () => {
    const { slug } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [event, setEvent] = useState(null);
    const [rsvps, setRsvps] = useState([]);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'approved'

    useEffect(() => { fetchData(); }, [slug]);

    const fetchData = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            const { data: ev, error: evErr } = await supabase
                .from('bridal_showers').select('*').eq('slug', slug).single();
            if (evErr || !ev) throw new Error('Bridal shower not found');
            setEvent(ev);

            const { data: rsvpData, error: rsvpErr } = await supabase
                .from('bridal_shower_rsvps').select('*').eq('event_id', ev.id).order('created_at', { ascending: false });
            if (rsvpErr) throw new Error('Error fetching RSVPs');
            setRsvps(rsvpData || []);
        } catch (err) {
            setError(err.message);
        } finally {
            if (!isRefresh) setLoading(false);
        }
    };

    const handleApprove = async (id, name) => {
        try {
            const { error } = await supabase.from('bridal_shower_rsvps').update({ status: 'approved' }).eq('id', id);
            if (error) throw error;
            setRsvps(rsvps.map(r => r.id === id ? { ...r, status: 'approved' } : r));
            flash(`✅ ${name} approved!`);
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Remove "${name}" from the guest list?`)) return;
        try {
            const { error } = await supabase.from('bridal_shower_rsvps').delete().eq('id', id);
            if (error) throw error;
            setRsvps(rsvps.filter(r => r.id !== id));
            flash(`🗑️ ${name} removed.`);
        } catch (err) { alert(err.message); }
    };

    const startEdit = (r) => { setEditingId(r.id); setEditForm({ first_name: r.first_name, last_name: r.last_name, email: r.email, phone: r.phone, attending: r.attending, message: r.message }); };
    const cancelEdit = () => { setEditingId(null); setEditForm({}); };
    const saveEdit = async (id) => {
        try {
            const { error } = await supabase.from('bridal_shower_rsvps').update(editForm).eq('id', id);
            if (error) throw error;
            setRsvps(rsvps.map(r => r.id === id ? { ...r, ...editForm } : r));
            setEditingId(null);
            flash('✅ Guest updated.');
        } catch (err) { alert(err.message); }
    };

    const flash = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(null), 3000); };

    const downloadExcel = () => {
        if (!rsvps.length) { alert('No RSVPs to download.'); return; }
        const ws = XLSX.utils.json_to_sheet(rsvps.map(r => ({
            'First Name': r.first_name,
            'Last Name': r.last_name,
            'Email': r.email,
            'Phone': r.phone,
            'Attending': r.attending ? 'Yes' : 'No',
            'Status': r.status,
            'Message': r.message,
            'Date Submitted': new Date(r.created_at).toLocaleDateString(),
        })));
        ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 40 }, { wch: 15 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'RSVPs');
        XLSX.writeFile(wb, `BridalShower_RSVPs_${(event?.bride_name || 'event').replace(/\s+/g, '_')}.xlsx`);
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const formatEventDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const pending = rsvps.filter(r => r.status === 'pending');
    const approved = rsvps.filter(r => r.status === 'approved');
    const filteredRsvps = activeTab === 'pending' ? pending : approved;

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#fdfbf7,#f5e6d0)' }}>
            <div style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ width: 40, height: 40, border: '2px solid #c5a059', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
                <p style={{ color: '#2d3a3a', letterSpacing: 4 }}>Loading…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: 'Inter, sans-serif', color: '#ef4444' }}>
            <i className="fas fa-exclamation-circle" style={{ fontSize: 40 }}></i>
            <h2>{error}</h2>
        </div>
    );

    return (
        <div className="bs-report">
            {successMessage && (
                <div className="bs-flash">{successMessage}</div>
            )}

            {/* Header */}
            <header className="bs-report-header">
                <div className="bs-header-content">
                    <div className="bs-header-info">
                        <h1>{event.bride_name}'s Bridal Shower</h1>
                        <p><i className="far fa-calendar"></i> {formatEventDate(event.date)}</p>
                        {event.venue_name && <p><i className="fas fa-map-marker-alt"></i> {event.venue_name}</p>}
                    </div>
                    <div className="bs-header-actions">
                        <button onClick={downloadExcel} className="bs-excel-btn">
                            <i className="fas fa-file-excel"></i> Download Excel
                        </button>
                        <a href={`/bridal-shower/${slug}`} target="_blank" rel="noopener noreferrer" className="bs-view-btn">
                            <i className="fas fa-external-link-alt"></i> View Page
                        </a>
                    </div>
                </div>
            </header>

            {/* Stats */}
            <section className="bs-stats">
                {[
                    { icon: 'fas fa-clock',         color: '#f59e0b', label: 'Pending Approval', value: pending.length },
                    { icon: 'fas fa-check-circle', color: '#10b981', label: 'Approved Guests',  value: approved.length },
                    { icon: 'fas fa-users',        color: '#6366f1', label: 'Total Responses', value: rsvps.length },
                ].map(({ icon, color, label, value }) => (
                    <div key={label} className="bs-stat-card">
                        <div className="bs-stat-icon" style={{ background: color + '20', color }}><i className={icon}></i></div>
                        <div className="bs-stat-info"><h3>{value}</h3><p>{label}</p></div>
                    </div>
                ))}
            </section>

            {/* Guest Table */}
            <section className="bs-guest-section">
                <div className="bs-section-header">
                    <div className="bs-tabs">
                        <button 
                            className={`bs-tab ${activeTab === 'pending' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('pending')}
                        >
                            Pending {pending.length > 0 && <span className="tab-dot"></span>}
                        </button>
                        <button 
                            className={`bs-tab ${activeTab === 'approved' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('approved')}
                        >
                            Approved
                        </button>
                    </div>
                </div>

                {filteredRsvps.length === 0 ? (
                    <div className="bs-empty">
                        <i className="fas fa-inbox"></i>
                        <h3>No {activeTab} RSVPs</h3>
                        <p>{activeTab === 'pending' ? 'All guests have been reviewed.' : 'Start approving guests to see them here.'}</p>
                    </div>
                ) : (
                    <div className="bs-table-wrap">
                        <table className="bs-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>First Name</th>
                                    <th>Last Name</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Attending</th>
                                    <th>Message</th>
                                    <th>Submitted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRsvps.map((r, i) => (
                                    <tr key={r.id} className={editingId === r.id ? 'bs-editing' : ''}>
                                        {editingId === r.id ? (
                                            <>
                                                <td style={{ color: '#9ca3af' }}>{i + 1}</td>
                                                <td><input className="bs-edit-input" placeholder="First Name" value={editForm.first_name || ''} onChange={e => setEditForm(p => ({ ...p, first_name: e.target.value }))} /></td>
                                                <td><input className="bs-edit-input" placeholder="Last Name" value={editForm.last_name || ''} onChange={e => setEditForm(p => ({ ...p, last_name: e.target.value }))} /></td>
                                                <td><input className="bs-edit-input" value={editForm.phone || ''} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} /></td>
                                                <td><input className="bs-edit-input" type="email" value={editForm.email || ''} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} /></td>
                                                <td>
                                                    <select className="bs-edit-input" value={editForm.attending} onChange={e => setEditForm(p => ({ ...p, attending: e.target.value === 'true' }))}>
                                                        <option value="true">Yes</option>
                                                        <option value="false">No</option>
                                                    </select>
                                                </td>
                                                <td><input className="bs-edit-input" value={editForm.message || ''} onChange={e => setEditForm(p => ({ ...p, message: e.target.value }))} /></td>
                                                <td style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{formatDate(r.created_at)}</td>
                                                <td>
                                                    <div className="bs-actions">
                                                        <button className="bs-save-btn" onClick={() => saveEdit(r.id)} title="Save"><i className="fas fa-check"></i></button>
                                                        <button className="bs-cancel-btn" onClick={cancelEdit} title="Cancel"><i className="fas fa-times"></i></button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={{ color: '#9ca3af' }}>{i + 1}</td>
                                                <td className="bs-name">{r.first_name}</td>
                                                <td className="bs-name">{r.last_name}</td>
                                                <td className="bs-phone">{r.phone || '—'}</td>
                                                <td className="bs-email">{r.email || '—'}</td>
                                                <td>
                                                    <span className={`bs-badge ${r.attending ? 'bs-yes' : 'bs-no'}`}>
                                                        {r.attending ? <><i className="fas fa-check"></i> Attending</> : <><i className="fas fa-times"></i> Declined</>}
                                                    </span>
                                                </td>
                                                <td className="bs-message">{r.message || '—'}</td>
                                                <td style={{ color: '#9ca3af', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(r.created_at)}</td>
                                                <td>
                                                    <div className="bs-actions">
                                                        {r.status === 'pending' && (
                                                            <button className="bs-approve-btn" onClick={() => handleApprove(r.id, r.first_name)} title="Approve"><i className="fas fa-user-plus"></i></button>
                                                        )}
                                                        <button className="bs-edit-btn" onClick={() => startEdit(r)} title="Edit"><i className="fas fa-edit"></i></button>
                                                        <button className="bs-del-btn" onClick={() => handleDelete(r.id, r.first_name)} title="Delete"><i className="fas fa-trash"></i></button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

                * { box-sizing: border-box; margin: 0; padding: 0; }

                .bs-report {
                    min-height: 100vh;
                    background: #f8fafc;
                    font-family: 'Inter', sans-serif;
                    padding-bottom: 3rem;
                }

                .bs-flash {
                    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                    background: #2d3a3a; color: white; padding: 0.875rem 2rem;
                    border-radius: 50px; font-weight: 600; z-index: 9999;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    animation: slideDown 0.3s ease;
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to   { opacity: 1; transform: translate(-50%, 0); }
                }

                .bs-report-header {
                    background: #2d3a3a;
                    color: white; padding: 2.5rem 0;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                .bs-header-content {
                    max-width: 1200px; margin: 0 auto; padding: 0 1.5rem;
                    display: flex; justify-content: space-between; align-items: center;
                    flex-wrap: wrap; gap: 1rem;
                }
                .bs-header-info h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
                .bs-header-info p  { font-size: 0.9rem; opacity: 0.8; display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem; }
                .bs-header-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
                .bs-excel-btn, .bs-view-btn {
                    padding: 0.625rem 1.25rem; border-radius: 8px; font-size: 0.875rem;
                    font-weight: 500; cursor: pointer; display: flex; align-items: center;
                    gap: 0.5rem; border: none; text-decoration: none; transition: 0.2s;
                }
                .bs-excel-btn  { background: #10b981; color: white; }
                .bs-excel-btn:hover { background: #059669; }
                .bs-view-btn   { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); }
                .bs-view-btn:hover { background: rgba(255,255,255,0.2); }

                .bs-stats {
                    max-width: 1200px; margin: -2rem auto 0; padding: 0 1.5rem;
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem;
                }
                .bs-stat-card {
                    background: white; border-radius: 16px; padding: 1.5rem;
                    display: flex; align-items: center; gap: 1.25rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .bs-stat-icon {
                    width: 54px; height: 54px; border-radius: 14px;
                    display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
                    flex-shrink: 0;
                }
                .bs-stat-info h3 { font-size: 1.85rem; font-weight: 700; color: #1e293b; line-height: 1; }
                .bs-stat-info p  { font-size: 0.85rem; color: #64748b; margin-top: 4px; font-weight: 500; }

                .bs-guest-section {
                    max-width: 1200px; margin: 2.5rem auto 0; padding: 0 1.5rem;
                }
                .bs-section-header {
                    margin-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;
                }
                .bs-tabs { display: flex; gap: 2rem; }
                .bs-tab {
                    padding: 0.75rem 0.5rem; font-weight: 600; color: #64748b; border: none; background: none; cursor: pointer;
                    position: relative; transition: 0.3s; font-size: 0.95rem;
                }
                .bs-tab.active { color: #2d3a3a; }
                .bs-tab.active::after {
                    content: ''; position: absolute; bottom: -0.5rem; left: 0; right: 0; height: 3px; background: #c5a059; border-radius: 10px;
                }
                .tab-dot {
                    width: 8px; height: 8px; background: #f59e0b; border-radius: 50%; display: inline-block; margin-left: 6px;
                }

                .bs-table-wrap {
                    background: white; border-radius: 16px; overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.04); overflow-x: auto;
                }
                .bs-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
                .bs-table th {
                    padding: 1.25rem 1rem; text-align: left; font-weight: 600;
                    color: #475569; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;
                    background: #f8fafc; border-bottom: 1px solid #f1f5f9;
                }
                .bs-table td {
                    padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b;
                    vertical-align: middle;
                }
                .bs-table tr:hover td { background: #fcfdfe; }
                .bs-editing td { background: #fefcf5 !important; }
                .bs-name { font-weight: 600; }
                .bs-phone { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; }
                .bs-email { color: #6366f1; font-weight: 500; }
                .bs-message { max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #64748b; font-style: italic; }

                .bs-badge {
                    display: inline-flex; align-items: center; gap: 0.35rem;
                    padding: 0.3rem 0.75rem; border-radius: 20px;
                    font-size: 0.75rem; font-weight: 600;
                }
                .bs-yes { background: #dcfce7; color: #166534; }
                .bs-no  { background: #fee2e2; color: #991b1b; }

                .bs-actions { display: flex; gap: 0.5rem; }
                .bs-edit-btn, .bs-del-btn, .bs-save-btn, .bs-cancel-btn, .bs-approve-btn {
                    width: 36px; height: 36px; border-radius: 10px; border: none;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    font-size: 0.9rem; transition: 0.2s;
                }
                .bs-approve-btn { background: #fef3c7; color: #92400e; }
                .bs-approve-btn:hover { background: #fde68a; transform: translateY(-2px); }
                .bs-edit-btn   { background: #f1f5f9; color: #475569; }
                .bs-edit-btn:hover { background: #e2e8f0; }
                .bs-del-btn    { background: #fee2e2; color: #b91c1c; }
                .bs-del-btn:hover { background: #fecaca; }
                .bs-save-btn   { background: #2d3a3a; color: white; }
                .bs-cancel-btn { background: #f1f5f9; color: #64748b; }

                .bs-empty { padding: 5rem 2rem; text-align: center; color: #94a3b8; }
                .bs-empty i { font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.3; }
                .bs-empty h3 { color: #475569; margin-bottom: 0.5rem; }

                @media (max-width: 768px) {
                    .bs-stats { margin-top: 1rem; }
                    .bs-header-content { text-align: center; justify-content: center; }
                    .bs-header-info p { justify-content: center; }
                }
            `}</style>
        </div>
    );
};

export default BridalShowerReport;
