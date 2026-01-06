import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';

const RSVPReport = () => {
    const { slug } = useParams();
    const [status, setStatus] = useState('Initializing...');
    const [error, setError] = useState(null);

    useEffect(() => {
        const generateReport = async () => {
            try {
                setStatus(`Fetching data for ${slug}...`);

                // 1. Get Wedding ID from Slug
                const { data: weddingData, error: weddingError } = await supabase
                    .from('weddings')
                    .select('id, groom_name, bride_name, date')
                    .eq('slug', slug)
                    .single();

                if (weddingError) throw new Error("Wedding not found: " + weddingError.message);
                if (!weddingData) throw new Error("Wedding not found");

                const weddingName = `${weddingData.groom_name} & ${weddingData.bride_name}`;
                setStatus(`Found wedding: ${weddingName}. Fetching RSVPs...`);

                // 2. Get RSVPs
                const { data: rsvps, error: rsvpError } = await supabase
                    .from('rsvps')
                    .select('*')
                    .eq('wedding_id', weddingData.id);

                if (rsvpError) throw new Error("Error fetching RSVPs: " + rsvpError.message);

                if (!rsvps || rsvps.length === 0) {
                    setStatus("No RSVPs found for this wedding.");
                    return;
                }

                setStatus("Generating Excel file...");

                // 3. Prepare Excel Data
                const excelData = rsvps.map(row => ({
                    "Name": row.name,
                    "Email": row.email,
                    "Phone": row.phone,
                    "Attending": row.attending,
                    "Guests": row.guests_count,
                    "Date": new Date(row.created_at).toLocaleDateString()
                }));

                // 4. Create and Download
                const ws = XLSX.utils.json_to_sheet(excelData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "RSVPs");

                XLSX.writeFile(wb, `RSVPs_${weddingName.replace(/\s+/g, '_')}.xlsx`);

                setStatus("Download started! You can close this page.");

            } catch (err) {
                console.error(err);
                setError(err.message);
                setStatus("Failed.");
            }
        };

        if (slug) {
            generateReport();
        }
    }, [slug]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            fontFamily: "'Poppins', sans-serif",
            background: '#f7f9fc',
            color: '#333'
        }}>
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                textAlign: 'center',
                maxWidth: '400px',
                width: '90%'
            }}>
                <h2 style={{ color: '#269691', marginBottom: '20px' }}>RSVP Report</h2>
                {error ? (
                    <p style={{ color: '#e74c3c' }}>{error}</p>
                ) : (
                    <>
                        <div className="spinner" style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid #f3f3f3',
                            borderTop: '4px solid #269691',
                            borderRadius: '50%',
                            margin: '0 auto 20px',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <p>{status}</p>
                    </>
                )}
                <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
            </div>
        </div>
    );
};

export default RSVPReport;
