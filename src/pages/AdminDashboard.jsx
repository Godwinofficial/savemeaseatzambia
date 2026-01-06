import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './Admin.css';

const AdminDashboard = () => {
    const [weddings, setWeddings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchWeddings();
    }, []);

    const fetchWeddings = async () => {
        try {
            const { data, error } = await supabase
                .from('weddings')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWeddings(data);
        } catch (error) {
            console.error('Error fetching weddings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this wedding details?")) return;

        try {
            const { error } = await supabase.from('weddings').delete().eq('id', id);
            if (error) throw error;
            setWeddings(weddings.filter(w => w.id !== id));
        } catch (error) {
            alert('Error deleting wedding: ' + error.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const copyLink = (slug) => {
        const url = `${window.location.origin}/w/${slug}`;
        navigator.clipboard.writeText(url).then(() => {
            alert("Website Link copied!");
        });
    };

    const copyReportLink = (slug) => {
        const url = `${window.location.origin}/report/${slug}`;
        navigator.clipboard.writeText(url).then(() => {
            alert("Download Link copied! Share this link to allow others to download the Excel file.");
        });
    };

    const downloadRSVPs = async (weddingId, weddingName) => {
        try {
            const { data, error } = await supabase
                .from('rsvps')
                .select('*')
                .eq('wedding_id', weddingId);

            if (error) throw error;

            if (!data || data.length === 0) {
                alert("No RSVPs found for this wedding yet.");
                return;
            }

            // Prepare data for Excel
            const excelData = data.map(row => ({
                "Name": row.name,
                "Email": row.email,
                "Phone": row.phone,
                "Attending": row.attending,
                "Guests": row.guests_count,
                "Date": new Date(row.created_at).toLocaleDateString()
            }));

            // Create Worksheet
            const ws = XLSX.utils.json_to_sheet(excelData);
            // Create Workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "RSVPs");

            // Write File
            XLSX.writeFile(wb, `RSVPs_${weddingName.replace(/\s+/g, '_')}.xlsx`);

        } catch (error) {
            console.error(error);
            alert("Error downloading RSVPs: " + error.message);
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Dashboard</h1>
                <div className="admin-actions">
                    <Link to="/addWedding" className="btn btn-primary">
                        <i className="fas fa-plus"></i> Create New Wedding
                    </Link>
                    <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
                </div>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="weddings-grid">
                    {weddings.length === 0 ? (
                        <p>No weddings found. Create one to get started!</p>
                    ) : (
                        weddings.map((wedding) => (
                            <div key={wedding.id} className="wedding-card">
                                <div className="card-header">
                                    <h3>{wedding.groom_name} & {wedding.bride_name}</h3>
                                    <span className="date-badge">{wedding.date}</span>
                                </div>
                                <div className="card-body">
                                    <p>Venue: {wedding.venue_name}</p>
                                    <div className="links">
                                        <a href={`/w/${wedding.slug}`} target="_blank" rel="noopener noreferrer">View Site</a>
                                        <button onClick={() => copyLink(wedding.slug)} className="btn-copy">Copy Site URL</button>
                                        <Link to={`/editWedding/${wedding.id}`} className="btn-edit">Edit</Link>
                                    </div>
                                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => downloadRSVPs(wedding.id, `${wedding.groom_name}_${wedding.bride_name}`)}
                                            className="btn btn-secondary"
                                            style={{ flex: 1, fontSize: '0.8rem' }}
                                        >
                                            <i className="fas fa-file-excel"></i> Download Excel
                                        </button>
                                        <button
                                            onClick={() => copyReportLink(wedding.slug)}
                                            className="btn btn-secondary"
                                            style={{ flex: 1, fontSize: '0.8rem', background: '#34495e' }}
                                            title="Copy link to download Excel"
                                        >
                                            <i className="fas fa-link"></i> Copy DL Link
                                        </button>
                                    </div>
                                </div>
                                <div className="card-footer">
                                    <button onClick={() => handleDelete(wedding.id)} className="btn-delete">
                                        <i className="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
