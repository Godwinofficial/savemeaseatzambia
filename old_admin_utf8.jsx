import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { sendEmail } from '../../utils/emailService';
import ReminderModal from '../../components/ReminderModal';
import EmailMarketing from '../../components/EmailMarketing';
import './Admin.css';

// Premium Interactive SVG Dashboard Charts Component
const DashboardCharts = ({ weddings, birthdays, bridalShowers }) => {
    const [hoveredPoint, setHoveredPoint] = useState(null);

    // 1. Data Prep for Area Trend (Weddings and their RSVPs)
    const chartData = weddings.slice(0, 6).reverse().map((w, idx) => ({
        label: w.groom_name ? `${w.groom_name.substring(0, 5)}&${w.bride_name.substring(0, 5)}` : `Evt#${idx + 1}`,
        value: w.rsvp_count || 0,
        fullName: `${w.groom_name} & ${w.bride_name}`,
        views: w.views || 0,
        slug: w.slug
    }));

    // Width & Height of SVG
    const width = 500;
    const height = 220;
    const padding = 35;

    // Compute SVG Points
    const maxVal = Math.max(...chartData.map(d => d.value), 10);
    const getX = (index) => padding + (index * (width - padding * 2)) / Math.max(chartData.length - 1, 1);
    const getY = (val) => height - padding - (val * (height - padding * 2)) / maxVal;

    // Build Curve Path
    let pathD = "";
    let areaD = "";
    if (chartData.length > 0) {
        pathD = `M ${getX(0)} ${getY(chartData[0].value)}`;
        areaD = `M ${getX(0)} ${height - padding} L ${getX(0)} ${getY(chartData[0].value)}`;

        for (let i = 1; i < chartData.length; i++) {
            const x = getX(i);
            const y = getY(chartData[i].value);
            pathD += ` L ${x} ${y}`;
            areaD += ` L ${x} ${y}`;
        }

        areaD += ` L ${getX(chartData.length - 1)} ${height - padding} Z`;
    }

    // 2. Data Prep for Event Ratios (Donut Chart)
    const totalEvents = weddings.length + birthdays.length + bridalShowers.length;
    const wPercent = totalEvents ? Math.round((weddings.length / totalEvents) * 100) : 0;
    const bPercent = totalEvents ? Math.round((birthdays.length / totalEvents) * 100) : 0;
    const bsPercent = totalEvents ? Math.round((bridalShowers.length / totalEvents) * 100) : 0;

    // SVG Donut metrics
    const radius = 50;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;

    const wDashOffset = circumference - (wPercent / 100) * circumference;

    return (
        <div className="dashboard-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* RSVP Area Curve Chart */}
            <div className="chart-container-card" style={{ flex: 1.6 }}>
                <div className="chart-header-row">
                    <h3 className="chart-title-text">
                        <i className="fas fa-chart-line" style={{ marginRight: 8, color: 'var(--secondary)' }}></i>
                        RSVP Conversion Trends
                    </h3>
                    <div className="chart-legend">
                        <div className="legend-item">
                            <span className="legend-dot emerald"></span>
                            <span>Active RSVPs</span>
                        </div>
                    </div>
                </div>

                <div style={{ position: 'relative', width: '100%' }}>
                    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
                        <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#c5a059" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#c5a059" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#2d3a3a" />
                                <stop offset="100%" stopColor="#c5a059" />
                            </linearGradient>
                        </defs>

                        {/* Grid Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                            const y = padding + pct * (height - padding * 2);
                            return (
                                <line
                                    key={i}
                                    x1={padding}
                                    y1={y}
                                    x2={width - padding}
                                    y2={y}
                                    stroke="var(--border-color)"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                />
                            );
                        })}

                        {/* Chart Area and Path */}
                        {chartData.length > 0 && (
                            <>
                                <path d={areaD} fill="url(#areaGrad)" />
                                <path d={pathD} fill="none" stroke="url(#curveGrad)" strokeWidth="3" strokeLinecap="round" />

                                {/* Points & Interaction */}
                                {chartData.map((d, i) => {
                                    const cx = getX(i);
                                    const cy = getY(d.value);
                                    const isHovered = hoveredPoint === i;
                                    return (
                                        <g key={i}>
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={isHovered ? 8 : 5}
                                                fill={isHovered ? '#c5a059' : '#2d3a3a'}
                                                stroke="#ffffff"
                                                strokeWidth="2"
                                                style={{ transition: 'all 0.2s', cursor: 'pointer' }}
                                                onMouseEnter={() => setHoveredPoint(i)}
                                                onMouseLeave={() => setHoveredPoint(null)}
                                            />
                                        </g>
                                    );
                                })}
                            </>
                        )}

                        {/* Axes Labels */}
                        {chartData.map((d, i) => (
                            <text
                                key={i}
                                x={getX(i)}
                                y={height - 10}
                                textAnchor="middle"
                                fontSize="9"
                                fontWeight="700"
                                fill="var(--text-muted)"
                            >
                                {d.label}
                            </text>
                        ))}
                    </svg>

                    {/* Interactive Tooltip Box */}
                    {hoveredPoint !== null && chartData[hoveredPoint] && (
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'rgba(45, 58, 58, 0.95)',
                            color: '#ffffff',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.75rem',
                            fontSize: '0.75rem',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                            zIndex: 10,
                            pointerEvents: 'none',
                            border: '1px solid #c5a059',
                            animation: 'fadeIn 0.2s ease-out'
                        }}>
                            <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>
                                {chartData[hoveredPoint].fullName}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                                <span>RSVPs: <strong style={{ color: '#c5a059' }}>{chartData[hoveredPoint].value}</strong></span>
                                <span>Views: <strong>{chartData[hoveredPoint].views.toLocaleString()}</strong></span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Event Type Donut distribution Chart */}
            <div className="chart-container-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                    <h3 className="chart-title-text" style={{ marginBottom: '1.25rem' }}>
                        <i className="fas fa-chart-pie" style={{ marginRight: 8, color: 'var(--secondary)' }}></i>
                        Campaign Distribution
                    </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1.5rem', flex: 1 }}>
                    <div style={{ position: 'relative', width: 120, height: 120 }}>
                        <svg width="100%" height="100%" viewBox="0 0 120 120">
                            {/* Empty background ring */}
                            <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--bg-surface-elevated)" strokeWidth={strokeWidth} />

                            {/* Weddings Segment (Emerald Green) */}
                            <circle cx="60" cy="60" r={radius} fill="transparent"
                                stroke="var(--primary)" strokeWidth={strokeWidth}
                                strokeDasharray={circumference} strokeDashoffset={wDashOffset}
                                transform="rotate(-90 60 60)" strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                            />

                            {/* Donut inner text */}
                            <text x="60" y="66" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--text-main)">
                                {totalEvents}
                            </text>
                            <text x="60" y="80" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-muted)">
                                TOTAL SITES
                            </text>
                        </svg>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block' }}></span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                Weddings: {wPercent}%
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#c44569', display: 'inline-block' }}></span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                Birthdays: {bPercent}%
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#c5a059', display: 'inline-block' }}></span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                Showers: {bsPercent}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [weddings, setWeddings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredWeddings, setFilteredWeddings] = useState([]);
    const [copiedLink, setCopiedLink] = useState(null);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [stats, setStats] = useState({ totalRSVPs: 0, totalViews: 0 });
    // Reminder States
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [selectedWeddingForReminder, setSelectedWeddingForReminder] = useState(null);
    const [dueReminders, setDueReminders] = useState([]);
    const [processingReminders, setProcessingReminders] = useState(false);
    const [activeTab, setActiveTab] = useState('weddings'); // 'weddings' | 'birthdays' | 'marketing'
    const [showRemindersAlert, setShowRemindersAlert] = useState(true);
    const [activeActionSheet, setActiveActionSheet] = useState(null);

    // Birthday states
    const [birthdays, setBirthdays] = useState([]);
    const [birthdayLoading, setBirthdayLoading] = useState(false);

    // Bridal Shower states
    const [bridalShowers, setBridalShowers] = useState([]);
    const [bridalShowerLoading, setBridalShowerLoading] = useState(false);

    // Vendor states
    const [vendors, setVendors] = useState([]);
    const [vendorLoading, setVendorLoading] = useState(false);
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [vendorForm, setVendorForm] = useState({ name: '', category: 'Makeup', city: 'Lusaka', image: '', rating: '5.0 Verified', description: '', portfolio: [] });
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
    const [vendorUploadProgress, setVendorUploadProgress] = useState({});

    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchWeddings();
        fetchBirthdays();
        fetchBridalShowers();
        fetchVendors();
    }, []);

    useEffect(() => {
        if (weddings.length > 0) {
            checkDueReminders();
        }
    }, [weddings]);

    // NOTE: Auto-send is now handled by Supabase Edge Function + Cron
    // The browser no longer auto-sends reminders
    // This check is kept only to show the alert banner
    // Users can manually click "Send Reminders Now" if needed

    useEffect(() => {
        const filtered = weddings.filter(wedding =>
            wedding.groom_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            wedding.bride_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            wedding.venue_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            wedding.slug?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredWeddings(filtered);

        // Calculate stats
        const totalRSVPs = weddings.reduce((acc, w) => acc + (w.rsvp_count || 0), 0);
        const totalViews = weddings.reduce((acc, w) => acc + (w.views || 0), 0);
        setStats({ totalRSVPs, totalViews });
    }, [searchTerm, weddings]);

    const fetchAllRows = async (table, columns = '*') => {
        let allData = [];
        let start = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from(table)
                .select(columns)
                .range(start, start + limit - 1);

            if (error) throw error;

            allData = [...allData, ...data];

            if (data.length < limit) {
                hasMore = false;
            } else {
                start += limit;
            }
        }
        return allData;
    };

    const fetchWeddings = async () => {
        try {
            const { data: weddingsData, error: weddingsError } = await supabase
                .from('weddings')
                .select('*')
                .order('created_at', { ascending: false });

            if (weddingsError) throw weddingsError;

            // Fetch RSVP counts for all weddings recursively
            const rsvpsData = await fetchAllRows('rsvps', 'wedding_id');

            // Compute counts
            const weddingsWithCounts = weddingsData.map(wedding => {
                const count = rsvpsData ? rsvpsData.filter(r => r.wedding_id === wedding.id).length : 0;
                return { ...wedding, rsvp_count: count };
            });

            setWeddings(weddingsWithCounts);
            setFilteredWeddings(weddingsWithCounts);
        } catch (error) {
            console.error('Error fetching weddings:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBirthdays = async () => {
        setBirthdayLoading(true);
        try {
            const { data: events, error } = await supabase
                .from('birthday_events')
                .select('*')
                .order('date', { ascending: false });
            if (error) throw error;

            // Fetch all birthday RSVPs recursively
            const rsvps = await fetchAllRows('birthday_rsvps', 'event_id');
            const withCounts = (events || []).map(e => ({
                ...e,
                rsvp_count: rsvps ? rsvps.filter(r => r.event_id === e.id).length : 0,
            }));
            setBirthdays(withCounts);
        } catch (err) {
            console.error('Error fetching birthdays:', err);
        } finally {
            setBirthdayLoading(false);
        }
    };

    const fetchBridalShowers = async () => {
        setBridalShowerLoading(true);
        try {
            const { data, error } = await supabase
                .from('bridal_showers')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;

            // Fetch RSVP counts recursively
            const rsvps = await fetchAllRows('bridal_shower_rsvps', 'event_id');

            const withCounts = (data || []).map(bs => ({
                ...bs,
                rsvp_count: rsvps ? rsvps.filter(r => r.event_id === bs.id).length : 0,
            }));
            setBridalShowers(withCounts);
        } catch (err) {
            console.error('Error fetching bridal showers:', err);
        } finally {
            setBridalShowerLoading(false);
        }
    };

    const fetchVendors = async () => {
        setVendorLoading(true);
        try {
            const { data, error } = await supabase
                .from('vendors')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setVendors(data || []);
        } catch (err) {
            console.error('Error fetching vendors:', err);
        } finally {
            setVendorLoading(false);
        }
    };

    const uploadVendorFile = async (file, path, id) => {
        if (!file) return null;
        try {
            setVendorUploadProgress(prev => ({ ...prev, [id]: 0 }));

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${path}/${fileName}`;

            const progressInterval = setInterval(() => {
                setVendorUploadProgress(prev => {
                    const current = prev[id] || 0;
                    if (current < 90) {
                        return { ...prev, [id]: current + 10 };
                    }
                    clearInterval(progressInterval);
                    return prev;
                });
            }, 100);

            const { error: uploadError } = await supabase.storage
                .from('wedding-uploads')
                .upload(filePath, file);

            clearInterval(progressInterval);
            setVendorUploadProgress(prev => ({ ...prev, [id]: 100 }));

            if (uploadError) {
                if (uploadError.message.includes("row-level security")) {
                    alert("Supabase Security Error: You need to run the policies in SUPABASE_SETUP.sql to allow uploads.");
                }
                throw uploadError;
            }

            const { data } = supabase.storage.from('wedding-uploads').getPublicUrl(filePath);

            setTimeout(() => {
                setVendorUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[id];
                    return newProgress;
                });
            }, 500);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading vendor file:', error);
            setVendorUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[id];
                return newProgress;
            });
            alert('Upload failed: ' + error.message);
            return null;
        }
    };

    const handleCoverUploadChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert("Cover image file size should be less than 5MB");
            return;
        }
        setUploadingCover(true);
        const uploadId = `cover-${Date.now()}`;
        const url = await uploadVendorFile(file, 'vendors/covers', uploadId);
        if (url) {
            setVendorForm(prev => ({ ...prev, image: url }));
        }
        setUploadingCover(false);
    };

    const handlePortfolioUploadChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingPortfolio(true);
        const uploadedItems = [];

        for (const file of files) {
            const isVideo = file.type.startsWith('video/');
            const limit = isVideo ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
            if (file.size > limit) {
                alert(`File "${file.name}" exceeds the size limit (${isVideo ? '20MB' : '5MB'}).`);
                continue;
            }

            const uploadId = `port-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const path = isVideo ? 'vendors/portfolios/videos' : 'vendors/portfolios/images';
            const url = await uploadVendorFile(file, path, uploadId);

            if (url) {
                uploadedItems.push({
                    url,
                    type: isVideo ? 'video' : 'image'
                });
            }
        }

        if (uploadedItems.length > 0) {
            setVendorForm(prev => ({
                ...prev,
                portfolio: [...(prev.portfolio || []), ...uploadedItems]
            }));
        }
        setUploadingPortfolio(false);
    };

    const handleSaveVendor = async (e) => {
        e.preventDefault();
        try {
            if (editingVendor) {
                // Update
                const { error } = await supabase
                    .from('vendors')
                    .update({
                        name: vendorForm.name,
                        category: vendorForm.category,
                        city: vendorForm.city,
                        image: vendorForm.image,
                        rating: vendorForm.rating,
                        description: vendorForm.description,
                        portfolio: vendorForm.portfolio || []
                    })
                    .eq('id', editingVendor.id);
                if (error) throw error;
                alert('Vendor updated successfully!');
            } else {
                // Insert
                const { error } = await supabase
                    .from('vendors')
                    .insert([{
                        name: vendorForm.name,
                        category: vendorForm.category,
                        city: vendorForm.city,
                        image: vendorForm.image,
                        rating: vendorForm.rating,
                        description: vendorForm.description,
                        portfolio: vendorForm.portfolio || []
                    }]);
                if (error) throw error;
                alert('Vendor created successfully!');
            }
            setShowVendorModal(false);
            setEditingVendor(null);
            setVendorForm({ name: '', category: 'Makeup', city: 'Lusaka', image: '', rating: '5.0 Verified', description: '', portfolio: [] });
            fetchVendors();
        } catch (err) {
            alert('Error saving vendor: ' + err.message);
        }
    };

    const handleDeleteVendor = async (id, name) => {
        if (!window.confirm(`Delete event vendor "${name}"? This cannot be undone.`)) return;
        try {
            const { error } = await supabase.from('vendors').delete().eq('id', id);
            if (error) throw error;
            setVendors(vendors.filter(v => v.id !== id));
        } catch (err) {
            alert('Error deleting vendor: ' + err.message);
        }
    };

    const openAddVendor = () => {
        setEditingVendor(null);
        setVendorForm({ name: '', category: 'Makeup', city: 'Lusaka', image: '', rating: '5.0 Verified', description: '', portfolio: [] });
        setShowVendorModal(true);
    };

    const openEditVendor = (vendor) => {
        setEditingVendor(vendor);
        setVendorForm({
            name: vendor.name,
            category: vendor.category,
            city: vendor.city,
            image: vendor.image || '',
            rating: vendor.rating || '5.0 Verified',
            description: vendor.description || '',
            portfolio: vendor.portfolio || []
        });
        setShowVendorModal(true);
    };

    const downloadBridalShowerRSVPs = async (eventId, brideName) => {
        try {
            const { data, error } = await supabase
                .from('bridal_shower_rsvps')
                .select('*')
                .eq('event_id', eventId);
            if (error) throw error;
            if (!data || data.length === 0) { alert('No RSVPs yet for this event.'); return; }
            const excelData = data.map(r => ({
                'Name': r.name,
                'Email': r.email,
                'Phone': r.phone,
                'Attending': r.attending ? 'Yes' : 'No',
                'Message': r.message,
                'Date Submitted': new Date(r.created_at).toLocaleDateString(),
            }));
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'RSVPs');
            XLSX.writeFile(wb, `BridalShower_RSVPs_${brideName.replace(/\s+/g, '_')}.xlsx`);
        } catch (err) {
            alert('Error downloading RSVPs: ' + err.message);
        }
    };

    const handleDeleteBirthday = async (id, name) => {
        if (!window.confirm(`Delete birthday event "${name}"? This cannot be undone.`)) return;
        try {
            const { error } = await supabase.from('birthday_events').delete().eq('id', id);
            if (error) throw error;
            setBirthdays(birthdays.filter(b => b.id !== id));
        } catch (err) {
            alert('Error deleting: ' + err.message);
        }
    };

    const handleDeleteBridalShower = async (id, name) => {
        if (!window.confirm(`Delete bridal shower "${name}"? This cannot be undone.`)) return;
        try {
            const { error } = await supabase.from('bridal_showers').delete().eq('id', id);
            if (error) throw error;
            setBridalShowers(bridalShowers.filter(b => b.id !== id));
        } catch (err) {
            alert('Error deleting: ' + err.message);
        }
    };

    const downloadBirthdayRSVPs = async (eventId, childName) => {
        try {
            const { data, error } = await supabase
                .from('birthday_rsvps')
                .select('*')
                .eq('event_id', eventId);
            if (error) throw error;
            if (!data || data.length === 0) { alert('No RSVPs yet for this event.'); return; }
            const excelData = data.map(r => ({
                'Name': r.name,
                'Phone': r.phone,
                'Attending': r.attending ? 'Yes' : 'No',
                'Date Submitted': new Date(r.created_at).toLocaleDateString(),
            }));
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'RSVPs');
            XLSX.writeFile(wb, `Birthday_RSVPs_${childName.replace(/\s+/g, '_')}.xlsx`);
        } catch (err) {
            alert('Error downloading RSVPs: ' + err.message);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete wedding "${name}"? This action cannot be undone.`)) return;

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

    const copyLink = async (slug, type = 'website') => {
        let url = '';
        let message = 'Link copied to clipboard!';

        switch (type) {
            case 'website':
                url = `${window.location.origin}/w/${slug}`;
                message = 'Website link copied to clipboard!';
                break;
            case 'report':
                url = `${window.location.origin}/report/${slug}`;
                message = 'Report link copied to clipboard!';
                break;
            case 'preview':
                url = `${window.location.origin}/api/preview?slug=${slug}`;
                message = 'Preview link copied to clipboard!';
                break;
            case 'preview-bd':
                url = `${window.location.origin}/api/preview?slug=${slug}&type=birthday`;
                message = 'Birthday Preview link copied to clipboard!';
                break;
            case 'bridal-shower':
                url = `${window.location.origin}/api/preview?slug=${slug}&type=bridal-shower`;
                message = 'Bridal Shower Preview link copied to clipboard!';
                break;
        }

        const handleSuccess = () => {
            setCopiedLink(`${slug}-${type}`);
            setTimeout(() => setCopiedLink(null), 2000);
            alert(message);
        };

        const handleError = (err) => {
            console.error('Copy failed:', err);
            prompt('Copy this link:', url);
        };

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
                handleSuccess();
            } else {
                throw new Error('Clipboard API not available');
            }
        } catch (error) {
            // Fallback for mobile/older browsers
            try {
                const textArea = document.createElement('textarea');
                textArea.value = url;

                // Ensure textarea is not visible but part of DOM
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '0';
                document.body.appendChild(textArea);

                textArea.focus();
                textArea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (successful) {
                    handleSuccess();
                } else {
                    handleError('execCommand returned false');
                }
            } catch (fallbackError) {
                handleError(fallbackError);
            }
        }
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

            const excelData = data.map(row => ({
                "Name": row.name,
                "Email": row.email,
                "Phone": row.phone,
                "Attending": row.attending,
                "Guests": row.guests_count,
                "Date": new Date(row.created_at).toLocaleDateString()
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
            XLSX.writeFile(wb, `RSVPs_${weddingName.replace(/\s+/g, '_')}.xlsx`);

        } catch (error) {
            console.error(error);
            alert("Error downloading RSVPs: " + error.message);
        }
    };

    // Reminder Logic
    const checkDueReminders = () => {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);

        console.log('≡ƒöö Checking for due reminders...', {
            currentTime: now.toISOString(),
            todayStr,
            totalWeddings: weddings.length
        });

        const due = weddings.filter(w => {
            let isDue = false;
            let reason = [];

            // Check Day Of Event Reminder
            if (w.reminder_day_of_event_enabled && !w.reminder_sent_day_of) {
                const eventDate = new Date(w.date).toISOString().slice(0, 10);
                if (eventDate === todayStr) {
                    isDue = true;
                    reason.push('Day-of-event reminder due');
                }
            }

            // Check Custom Reminder
            if (w.reminder_custom_date && !w.reminder_sent_custom) {
                const customDate = new Date(w.reminder_custom_date);
                console.log(`  Wedding: ${w.groom_name} & ${w.bride_name}`, {
                    customReminderDate: customDate.toISOString(),
                    customReminderLocal: customDate.toLocaleString(),
                    currentTime: now.toISOString(),
                    currentTimeLocal: now.toLocaleString(),
                    isPast: customDate <= now,
                    timeDifference: `${Math.round((now - customDate) / 1000 / 60)} minutes`,
                    alreadySent: w.reminder_sent_custom
                });

                if (customDate <= now) {
                    isDue = true;
                    reason.push(`Custom reminder due (${customDate.toLocaleString()})`);
                }
            }

            if (isDue) {
                console.log(`  Γ£à DUE: ${w.groom_name} & ${w.bride_name} - ${reason.join(', ')}`);
            }

            return isDue;
        });

        console.log(`≡ƒôè Found ${due.length} wedding(s) with due reminders`);
        setDueReminders(due);
    };

    const sendDueReminders = async () => {
        if (dueReminders.length === 0) return;

        console.log(`≡ƒôº Auto-sending reminders for ${dueReminders.length} wedding(s)...`);
        setProcessingReminders(true);

        try {
            let successCount = 0;

            for (const wedding of dueReminders) {
                console.log(`\n≡ƒô¿ Processing wedding: ${wedding.groom_name} & ${wedding.bride_name}`);

                // Determine type of reminder
                const now = new Date();
                const todayStr = now.toISOString().slice(0, 10);
                const eventDate = new Date(wedding.date).toISOString().slice(0, 10);

                let isDayOfDue = wedding.reminder_day_of_event_enabled && !wedding.reminder_sent_day_of && eventDate === todayStr;
                let isCustomDue = wedding.reminder_custom_date && !wedding.reminder_sent_custom && new Date(wedding.reminder_custom_date) <= now;

                console.log('  Reminder types:', { isDayOfDue, isCustomDue });

                // Fetch Guests (only approved)
                const { data: guests, error } = await supabase
                    .from('rsvps')
                    .select('email, name')
                    .eq('wedding_id', wedding.id)
                    .eq('status', 'approved') // Only send to approved guests
                    .neq('email', null);

                if (error || !guests) {
                    console.error(`  Γ¥î Error fetching guests for ${wedding.groom_name}`, error);
                    continue;
                }

                console.log(`  Found ${guests.length} approved guest(s) with email`);

                // Send Emails (Throttled)
                let emailSent = false;
                for (const guest of guests) {
                    if (!guest.email) continue;

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
                        message: `This is a friendly reminder that the wedding of ${wedding.groom_name} & ${wedding.bride_name} is coming up! We're so excited to celebrate with you. Please be ready and we can't wait to see you there!`,
                        link: `${window.location.origin}/w/${wedding.slug}`,
                        title: `${wedding.groom_name} & ${wedding.bride_name} Wedding`,
                        subtitle: "Wedding Reminder",
                        action_text: "View Invitation & Details",
                    };

                    try {
                        await sendEmail({
                            to: guest.email,
                            subject: `Reminder: ${wedding.groom_name} & ${wedding.bride_name} Wedding`,
                            templateParams: templateParams
                        });
                        console.log(`    Γ£à Sent to ${guest.email}`);
                        emailSent = true;
                        // Small delay to avoid rate limits
                        await new Promise(r => setTimeout(r, 500));
                    } catch (e) {
                        console.error(`    Γ¥î Failed to email ${guest.email}`, e);
                    }
                }

                // Update DB
                const updates = {};
                if (isDayOfDue) updates.reminder_sent_day_of = true;
                if (isCustomDue) updates.reminder_sent_custom = true;

                if (Object.keys(updates).length > 0) {
                    await supabase.from('weddings').update(updates).eq('id', wedding.id);
                    console.log(`  Γ£à Updated database:`, updates);
                    successCount++;
                }
            }

            console.log(`\n≡ƒÄë Processed reminders for ${successCount} wedding(s).`);
            alert(`Successfully sent reminders for ${successCount} wedding(s)!`);
            fetchWeddings(); // Refresh list
        } catch (error) {
            console.error("Batch processing failed:", error);
            alert("Error processing reminders: " + error.message);
        } finally {
            setProcessingReminders(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const getWeddingStatus = (date) => {
        const weddingDate = new Date(date);
        const today = new Date();
        if (weddingDate > today) return 'upcoming';
        if (weddingDate.toDateString() === today.toDateString()) return 'today';
        return 'past';
    };

    const StatusBadge = ({ date }) => {
        const status = getWeddingStatus(date);
        const colors = {
            upcoming: 'var(--success)',
            today: 'var(--accent)',
            past: 'var(--text-muted)'
        };
        const labels = {
            upcoming: 'Upcoming',
            today: 'Today',
            past: 'Completed'
        };

        return (
            <span className="status-badge" style={{ backgroundColor: colors[status] }}>
                {labels[status]}
            </span>
        );
    };

    const activeWeddings = filteredWeddings.filter(w => getWeddingStatus(w.date) !== 'past');
    const archivedWeddings = weddings.filter(w => getWeddingStatus(w.date) === 'past');

    const activeBirthdays = birthdays.filter(b => getWeddingStatus(b.date) !== 'past');
    const archivedBirthdays = birthdays.filter(b => getWeddingStatus(b.date) === 'past');

    const activeBridalShowers = bridalShowers.filter(bs => getWeddingStatus(bs.date) !== 'past');
    const archivedBridalShowers = bridalShowers.filter(bs => getWeddingStatus(bs.date) === 'past');

    return (
        <div className="admin-page admin-dashboard">
            {/* Forced Clean Light-Mode Styles Overrides */}
            <style>{`
                html, body, #root, .admin-page, .admin-dashboard {
                    background-color: var(--bg-base) !important;
                    background: var(--bg-base) !important;
                    color: var(--text-main) !important;
                }
                
                .admin-header {
                    background: var(--glass-bg) !important;
                    backdrop-filter: blur(16px) !important;
                    -webkit-backdrop-filter: blur(16px) !important;
                    border-bottom: 1px solid var(--border-color) !important;
                }

                .content-container {
                    background: var(--bg-surface) !important;
                    border: none !important;
                    border-radius: var(--radius-lg) !important;
                    box-shadow: var(--shadow-md) !important;
                }

                .wedding-card {
                    background: var(--bg-surface) !important;
                    border: none !important;
                    box-shadow: var(--shadow-md) !important;
                    border-radius: var(--radius-lg) !important;
                }

                .card-header {
                    background: transparent !important;
                    border-bottom: 1px solid var(--border-color) !important;
                }

                .venue-info, .stat-item {
                    background: var(--bg-surface-elevated) !important;
                    border: 1px solid var(--border-color) !important;
                    color: var(--text-main) !important;
                    border-radius: var(--radius-md) !important;
                }

                .tab-btn.active {
                    border-bottom-color: var(--primary) !important;
                    color: var(--primary) !important;
                }
                
                .tab-btn:hover {
                    color: var(--primary) !important;
                }

                .stat-card {
                    background: var(--bg-surface) !important;
                    border: none !important;
                    box-shadow: var(--shadow-md) !important;
                    border-radius: var(--radius-lg) !important;
                    padding: 1.5rem !important;
                }

                .stat-card.highlight {
                    background: var(--bg-surface) !important;
                    color: var(--text-main) !important;
                }

                .stat-card.highlight .stat-number {
                    color: var(--primary) !important;
                }
                
                .stat-card.highlight .stat-label {
                    color: var(--text-muted) !important;
                }
            `}</style>
            {/* Mobile Menu Overlay */}
            {showMobileMenu && (
                <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
                    <div className="mobile-menu" onClick={e => e.stopPropagation()}>
                        <div className="mobile-header">
                            <h3>Menu</h3>
                            <button className="close-menu" onClick={() => setShowMobileMenu(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="mobile-nav">
                            <Link to="/addWedding" className="mobile-nav-item" onClick={() => setShowMobileMenu(false)}>
                                <i className="fas fa-plus-circle"></i>
                                Create New Wedding
                            </Link>
                            <Link to="/addBridalShower" className="mobile-nav-item" onClick={() => setShowMobileMenu(false)}>
                                <i className="fas fa-gift"></i>
                                Create Bridal Shower
                            </Link>
                            <button className="mobile-nav-item" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => { setActiveTab('vendors'); setShowMobileMenu(false); }}>
                                <i className="fas fa-store"></i>
                                Manage Ecosystem Vendors
                            </button>
                            <button className="mobile-nav-item" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => { handleLogout(); setShowMobileMenu(false); }}>
                                <i className="fas fa-sign-out-alt"></i>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="admin-header">
                <div className="header-container">
                    <div className="header-main">
                        {/* Mobile Menu Button */}
                        <button className="mobile-menu-btn" onClick={() => setShowMobileMenu(true)}>
                            <i className="fas fa-bars"></i>
                        </button>

                        {/* Order 1 (Left): Brand/Logo */}
                        <div className="brand">
                            <img src="/imgs/logo1.png" alt="Save Me A Seat" className="logo-img" />
                        </div>

                        {/* Order 2 (Center): Navigation & Search */}
                        <div className="desktop-nav">
                            <div className="search-container">
                                <i className="fas fa-search search-icon"></i>
                                <input
                                    type="text"
                                    placeholder="Search weddings..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                                {searchTerm && (
                                    <button className="clear-search" onClick={() => setSearchTerm('')}>
                                        <i className="fas fa-times"></i>
                                    </button>
                                )}
                            </div>

                            <div className="nav-actions">
                                <Link to="/addWedding" className="nav-btn primary">
                                    <i className="fas fa-plus"></i>
                                    <span>New Wedding</span>
                                </Link>
                                <button className="nav-btn outline" onClick={handleLogout}>
                                    <i className="fas fa-sign-out-alt"></i>
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>

                        {/* Order 3 (Right): User Icon */}
                        <div className="user-profile-section">
                            <div className="user-icon-circle" title="Admin Profile">
                                <i className="fas fa-user"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <section className="stats-section">
                {dueReminders.length > 0 && showRemindersAlert && (
                    <div className="alert-banner" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div className="alert-content">
                            <i className="fas fa-bell"></i>
                            <span>{dueReminders.length} weddings have reminders due today or pending.</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button
                                className="alert-btn"
                                onClick={sendDueReminders}
                                disabled={processingReminders}
                            >
                                {processingReminders ? 'Sending...' : 'Send Reminders Now'}
                            </button>
                            <button
                                onClick={() => setShowRemindersAlert(false)}
                                style={{
                                    background: 'var(--bg-surface-elevated)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0.25rem',
                                    transition: 'all 0.2s',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                                title="Dismiss Alert"
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--bg-surface-elevated)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="tab-navigation">
                    <button
                        className={`tab-btn ${activeTab === 'weddings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('weddings')}
                    >
                        <i className="fas fa-glass-cheers"></i>
                        Weddings
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'birthdays' ? 'active' : ''}`}
                        onClick={() => setActiveTab('birthdays')}
                        style={activeTab === 'birthdays' ? { borderBottomColor: '#c44569', color: '#c44569' } : {}}
                    >
                        <i className="fas fa-birthday-cake"></i>
                        Birthdays
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'bridal_showers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bridal_showers')}
                        style={activeTab === 'bridal_showers' ? { borderBottomColor: '#c5a059', color: '#c5a059' } : {}}
                    >
                        <i className="fas fa-gift"></i>
                        Bridal Showers
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'marketing' ? 'active' : ''}`}
                        onClick={() => setActiveTab('marketing')}
                    >
                        <i className="fas fa-envelope"></i>
                        Email Marketing
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'vendors' ? 'active' : ''}`}
                        onClick={() => setActiveTab('vendors')}
                        style={activeTab === 'vendors' ? { borderBottomColor: '#10b981', color: '#10b981' } : {}}
                    >
                        <i className="fas fa-store"></i>
                        Ecosystem Vendors
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'archives' ? 'active' : ''}`}
                        onClick={() => setActiveTab('archives')}
                        style={activeTab === 'archives' ? { borderBottomColor: '#6b7280', color: '#6b7280' } : {}}
                    >
                        <i className="fas fa-archive"></i>
                        Archives
                    </button>
                </div>
            </section>

            {/* Weddings Tab Content */}
            {activeTab === 'weddings' && (
                <>
                    <div className="stats-scroller">
                        <div className="stat-card">
                            <div className="stat-icon-wrapper gradient-1">
                                <i className="fas fa-glass-cheers"></i>
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-number">{weddings.length}</h3>
                                <p className="stat-label">Active Weddings</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper gradient-2">
                                <i className="fas fa-user-friends"></i>
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-number">{stats.totalRSVPs}</h3>
                                <p className="stat-label">Total RSVPs</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper gradient-3">
                                <i className="fas fa-eye"></i>
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-number">{stats.totalViews.toLocaleString()}</h3>
                                <p className="stat-label">Total Views</p>
                            </div>
                        </div>

                        <div className="stat-card highlight">
                            <div className="stat-icon-wrapper gradient-4">
                                <i className="fas fa-star"></i>
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-number">
                                    {weddings.length > 0
                                        ? Math.round((stats.totalRSVPs / weddings.length) * 10) / 10
                                        : 0
                                    }
                                </h3>
                                <p className="stat-label">Avg RSVPs per Wedding</p>
                            </div>
                        </div>
                    </div>

                    {/* Premium Animated Dashboard Charts */}
                    <main className="main-content" style={{ paddingBottom: '1rem' }}>
                        <DashboardCharts weddings={weddings} birthdays={birthdays} bridalShowers={bridalShowers} />
                    </main>

                    {/* Main Content */}
                    <main className="main-content">
                        <div className="content-container">
                            <div className="content-header">
                                <div className="header-left">
                                    <h2 className="section-title">Wedding Websites</h2>
                                    <p className="section-subtitle">Manage all your wedding sites in one place</p>
                                </div>
                                <div className="header-right">
                                    <div className="results-info">
                                        <span className="results-count">{activeWeddings.length}</span>
                                        <span className="results-text">of {weddings.length} weddings</span>
                                    </div>
                                    <div className="sort-options">
                                        <select className="sort-select">
                                            <option>Newest First</option>
                                            <option>Oldest First</option>
                                            <option>Name A-Z</option>
                                            <option>Most RSVPs</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="loading-container">
                                    <div className="loading-spinner">
                                        <div className="spinner-ring"></div>
                                        <div className="spinner-ring"></div>
                                        <div className="spinner-ring"></div>
                                        <div className="spinner-ring"></div>
                                    </div>
                                    <p className="loading-text">Loading your weddings...</p>
                                </div>
                            ) : activeWeddings.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">
                                        <i className="fas fa-heart"></i>
                                    </div>
                                    <h3 className="empty-title">
                                        {searchTerm ? 'No weddings found' : 'No weddings yet'}
                                    </h3>
                                    <p className="empty-description">
                                        {searchTerm
                                            ? 'Try adjusting your search terms'
                                            : 'Create your first beautiful wedding website'
                                        }
                                    </p>
                                    {!searchTerm && (
                                        <Link to="/addWedding" className="empty-action">
                                            <i className="fas fa-plus"></i>
                                            Create First Wedding
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="weddings-list" style={{ display: 'flex', flexDirection: 'column' }}>
                                    {activeWeddings.map((wedding) => (
                                        <div key={wedding.id} className="app-row-item">
                                            {/* Avatar badge with initials */}
                                            <div style={{
                                                width: 52, height: 52, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', marginRight: '1.25rem',
                                                boxShadow: '0 4px 12px rgba(255, 123, 0, 0.3)'
                                            }}>
                                                {wedding.groom_name?.substring(0, 1)}{wedding.bride_name?.substring(0, 1)}
                                            </div>

                                            {/* Content details */}
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                                    {wedding.groom_name} & {wedding.bride_name}
                                                </h4>
                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.15rem' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <i className="far fa-calendar"></i> {formatDate(wedding.date)}
                                                    </span>
                                                    <StatusBadge date={wedding.date} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                    <span><i className="fas fa-users" style={{ color: 'var(--primary)' }}></i> RSVPs: <strong style={{ color: 'var(--text-main)' }}>{wedding.rsvp_count || 0}</strong></span>
                                                    <span><i className="fas fa-eye" style={{ color: 'var(--primary)' }}></i> Views: <strong style={{ color: 'var(--text-main)' }}>{wedding.views?.toLocaleString() || 0}</strong></span>
                                                </div>
                                            </div>

                                            {/* Ellipsis Actions Button */}
                                            <button
                                                onClick={() => setActiveActionSheet({
                                                    type: 'wedding',
                                                    title: `${wedding.groom_name} & ${wedding.bride_name}`,
                                                    subtitle: `Wedding Date: ${formatDate(wedding.date)}`,
                                                    url: `/w/${wedding.slug}`,
                                                    slug: wedding.slug,
                                                    copyType: 'preview',
                                                    editUrl: `/editWedding/${wedding.id}`,
                                                    rawEvent: wedding,
                                                    reportUrl: `/report/${wedding.slug}`,
                                                    onDownload: () => downloadRSVPs(wedding.id, `${wedding.groom_name}_${wedding.bride_name}`),
                                                    onDelete: () => handleDelete(wedding.id, `${wedding.groom_name} & ${wedding.bride_name}`)
                                                })}
                                                style={{
                                                    background: 'none', border: 'none', color: 'var(--text-muted)',
                                                    cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem',
                                                    marginLeft: '0.5rem', transition: 'color 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                            >
                                                <i className="fas fa-ellipsis-v"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </main>
                </>
            )}

            {/* Email Marketing Tab Content */}
            {activeTab === 'marketing' && (
                <main className="main-content">
                    <EmailMarketing />
                </main>
            )}

            {/* Birthday Events Tab */}
            {activeTab === 'birthdays' && (
                <main className="main-content">
                    <div className="content-container">
                        <div className="content-header">
                            <div className="header-left">
                                <h2 className="section-title">Birthday Websites</h2>
                                <p className="section-subtitle">Manage all birthday invitation sites</p>
                            </div>
                            <div className="header-right">
                                <Link to="/addBirthday" className="nav-btn primary" style={{ textDecoration: 'none', background: 'linear-gradient(135deg,#ff6b9d,#c44569)', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, color: '#ffffff', fontWeight: 700, fontSize: '0.85rem' }}>
                                    <i className="fas fa-plus" />
                                    New Birthday
                                </Link>
                            </div>
                        </div>

                        {birthdayLoading ? (
                            <div className="loading-container">
                                <div className="loading-spinner"><div className="spinner-ring" /><div className="spinner-ring" /><div className="spinner-ring" /><div className="spinner-ring" /></div>
                                <p className="loading-text">Loading birthday eventsΓÇª</p>
                            </div>
                        ) : activeBirthdays.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon"><i className="fas fa-birthday-cake" /></div>
                                <h3 className="empty-title">No birthday events yet</h3>
                                <p className="empty-description">Create your first birthday invitation website</p>
                                <Link to="/addBirthday" className="empty-action" style={{ textDecoration: 'none' }}>
                                    <i className="fas fa-plus" /> Create First Birthday
                                </Link>
                            </div>
                        ) : (
                            <div className="birthdays-list" style={{ display: 'flex', flexDirection: 'column' }}>
                                {activeBirthdays.map((bdEvent) => (
                                    <div key={bdEvent.id} className="app-row-item" style={{ borderLeft: '4px solid #c44569' }}>
                                        {/* Avatar badge with cake icon */}
                                        <div style={{
                                            width: 52, height: 52, borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#ffffff', fontWeight: 800, fontSize: '1rem', marginRight: '1.25rem',
                                            boxShadow: '0 4px 12px rgba(196, 69, 105, 0.3)'
                                        }}>
                                            <i className="fas fa-birthday-cake" style={{ fontSize: '1rem' }}></i>
                                        </div>

                                        {/* Content details */}
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                                {bdEvent.child_name}'s Birthday
                                            </h4>
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.15rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <i className="far fa-calendar"></i> {bdEvent.date ? new Date(bdEvent.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Date TBD'}
                                                </span>
                                                {bdEvent.age && <span className="status-badge" style={{ backgroundColor: '#c44569' }}>Age {bdEvent.age}</span>}
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                <span><i className="fas fa-users" style={{ color: '#c44569' }}></i> RSVPs: <strong style={{ color: 'var(--text-main)' }}>{bdEvent.rsvp_count || 0}</strong></span>
                                                <span><i className="fas fa-link" style={{ color: '#c44569' }}></i> Slug: <strong style={{ color: 'var(--text-main)' }}>/{bdEvent.slug}</strong></span>
                                            </div>
                                        </div>

                                        {/* Ellipsis Actions Button */}
                                        <button
                                            onClick={() => setActiveActionSheet({
                                                type: 'birthday',
                                                title: `${bdEvent.child_name}'s Birthday`,
                                                subtitle: `Date: ${bdEvent.date ? new Date(bdEvent.date).toLocaleDateString() : 'TBD'}`,
                                                url: `/b/${bdEvent.slug}`,
                                                slug: bdEvent.slug,
                                                copyType: 'preview-bd',
                                                editUrl: `/editBirthday/${bdEvent.id}`,
                                                reportUrl: `/b-report/${bdEvent.slug}`,
                                                onDownload: () => downloadBirthdayRSVPs(bdEvent.id, bdEvent.child_name),
                                                onDelete: () => handleDeleteBirthday(bdEvent.id, `${bdEvent.child_name}'s Birthday`)
                                            })}
                                            style={{
                                                background: 'none', border: 'none', color: 'var(--text-muted)',
                                                cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem',
                                                marginLeft: '0.5rem', transition: 'color 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#c44569'}
                                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                        >
                                            <i className="fas fa-ellipsis-v"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            )}

            {/* Bridal Showers Tab Content */}
            {activeTab === 'bridal_showers' && (
                <main className="main-content">
                    <div className="content-container">
                        <div className="content-header">
                            <div className="header-left">
                                <h2 className="section-title">Bridal Showers</h2>
                                <p className="section-subtitle">Manage bridal shower websites</p>
                            </div>
                            <div className="header-right">
                                <Link to="/addBridalShower" className="nav-btn primary">
                                    <i className="fas fa-plus"></i>
                                    <span>New Bridal Shower</span>
                                </Link>
                            </div>
                        </div>

                        {bridalShowerLoading ? (
                            <div className="loading-container"><p>Loading bridal showers...</p></div>
                        ) : activeBridalShowers.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon"><i className="fas fa-gift"></i></div>
                                <h3 className="empty-title">No bridal showers yet</h3>
                                <Link to="/addBridalShower" className="empty-action"><i className="fas fa-plus"></i> Create Bridal Shower</Link>
                            </div>
                        ) : (
                            <div className="bridal-showers-list" style={{ display: 'flex', flexDirection: 'column' }}>
                                {activeBridalShowers.map((bs) => (
                                    <div key={bs.id} className="app-row-item" style={{ borderLeft: '4px solid #c5a059' }}>
                                        {/* Avatar badge with gift icon */}
                                        <div style={{
                                            width: 52, height: 52, borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #dfc28c 0%, #c5a059 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#ffffff', fontWeight: 800, fontSize: '1rem', marginRight: '1.25rem',
                                            boxShadow: '0 4px 12px rgba(197, 160, 89, 0.3)'
                                        }}>
                                            <i className="fas fa-gift" style={{ fontSize: '1rem' }}></i>
                                        </div>

                                        {/* Content details */}
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                                {bs.bride_name}'s Bridal Shower
                                            </h4>
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.15rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <i className="far fa-calendar"></i> {bs.date ? new Date(bs.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Date TBD'}
                                                </span>
                                                <StatusBadge date={bs.date} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                <span><i className="fas fa-users" style={{ color: '#c5a059' }}></i> RSVPs: <strong style={{ color: 'var(--text-main)' }}>{bs.rsvp_count || 0}</strong></span>
                                                <span><i className="fas fa-link" style={{ color: '#c5a059' }}></i> Slug: <strong style={{ color: 'var(--text-main)' }}>/{bs.slug}</strong></span>
                                            </div>
                                        </div>

                                        {/* Ellipsis Actions Button */}
                                        <button
                                            onClick={() => setActiveActionSheet({
                                                type: 'bridal_shower',
                                                title: `${bs.bride_name}'s Bridal Shower`,
                                                subtitle: `Date: ${bs.date ? new Date(bs.date).toLocaleDateString() : 'TBD'}`,
                                                url: `/bridal-shower/${bs.slug}`,
                                                slug: bs.slug,
                                                copyType: 'bridal-shower',
                                                editUrl: `/editBridalShower/${bs.id}`,
                                                reportUrl: `/bs-report/${bs.slug}`,
                                                onDownload: () => downloadBridalShowerRSVPs(bs.id, bs.bride_name),
                                                onDelete: () => handleDeleteBridalShower(bs.id, `${bs.bride_name}'s Bridal Shower`)
                                            })}
                                            style={{
                                                background: 'none', border: 'none', color: 'var(--text-muted)',
                                                cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem',
                                                marginLeft: '0.5rem', transition: 'color 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#c5a059'}
                                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                        >
                                            <i className="fas fa-ellipsis-v"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            )}

            {/* Archives Tab Content */}
            {activeTab === 'archives' && (
                <main className="main-content">
                    <div className="content-container">
                        <div className="content-header">
                            <div className="header-left">
                                <h2 className="section-title">Archives</h2>
                                <p className="section-subtitle">Past events automatically moved here</p>
                            </div>
                        </div>

                        <div className="archives-list" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {archivedWeddings.length > 0 && (
                                <div>
                                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Archived Weddings</h3>
                                    {archivedWeddings.map((wedding) => (
                                        <div key={wedding.id} className="app-row-item" style={{ opacity: 0.8 }}>
                                            <div style={{
                                                width: 52, height: 52, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', marginRight: '1.25rem',
                                                boxShadow: '0 4px 12px rgba(255, 123, 0, 0.3)'
                                            }}>
                                                {wedding.groom_name?.substring(0, 1)}{wedding.bride_name?.substring(0, 1)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                                    {wedding.groom_name} & {wedding.bride_name}
                                                </h4>
                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.15rem' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        <i className="far fa-calendar"></i> {wedding.date ? new Date(wedding.date).toLocaleDateString() : 'TBD'}
                                                    </span>
                                                    <StatusBadge date={wedding.date} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                    <span><i className="fas fa-users" style={{ color: 'var(--primary)' }}></i> RSVPs: <strong style={{ color: 'var(--text-main)' }}>{wedding.rsvp_count || 0}</strong></span>
                                                    <span><i className="fas fa-link" style={{ color: 'var(--primary)' }}></i> Slug: <strong style={{ color: 'var(--text-main)' }}>/{wedding.slug}</strong></span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setActiveActionSheet({
                                                    type: 'wedding',
                                                    title: `${wedding.groom_name} & ${wedding.bride_name}`,
                                                    subtitle: `Date: ${wedding.date ? new Date(wedding.date).toLocaleDateString() : 'TBD'}`,
                                                    url: `/${wedding.slug}`,
                                                    slug: wedding.slug,
                                                    copyType: 'preview',
                                                    rawEvent: wedding,
                                                    reportUrl: `/report/${wedding.slug}`,
                                                    onDownload: () => downloadRSVPs(wedding.id, `${wedding.groom_name}_${wedding.bride_name}`),
                                                    onDelete: () => handleDelete(wedding.id, `${wedding.groom_name} & ${wedding.bride_name}`)
                                                })}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem', marginLeft: '0.5rem' }}
                                            >
                                                <i className="fas fa-ellipsis-v"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {archivedBirthdays.length > 0 && (
                                <div>
                                    <h3 style={{ marginBottom: '1rem', color: '#c44569', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Archived Birthdays</h3>
                                    {archivedBirthdays.map((bdEvent) => (
                                        <div key={bdEvent.id} className="app-row-item" style={{ borderLeft: '4px solid #c44569', opacity: 0.8 }}>
                                            <div style={{
                                                width: 52, height: 52, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#ffffff', fontWeight: 800, fontSize: '1rem', marginRight: '1.25rem',
                                            }}>
                                                <i className="fas fa-birthday-cake" style={{ fontSize: '1rem' }}></i>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                                    {bdEvent.child_name}'s Birthday
                                                </h4>
                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.15rem' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        <i className="far fa-calendar"></i> {bdEvent.date ? new Date(bdEvent.date).toLocaleDateString() : 'TBD'}
                                                    </span>
                                                    <StatusBadge date={bdEvent.date} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                    <span><i className="fas fa-users" style={{ color: '#c44569' }}></i> RSVPs: <strong style={{ color: 'var(--text-main)' }}>{bdEvent.rsvp_count || 0}</strong></span>
                                                    <span><i className="fas fa-link" style={{ color: '#c44569' }}></i> Slug: <strong style={{ color: 'var(--text-main)' }}>/{bdEvent.slug}</strong></span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setActiveActionSheet({
                                                    type: 'birthday',
                                                    title: `${bdEvent.child_name}'s Birthday`,
                                                    subtitle: `Date: ${bdEvent.date ? new Date(bdEvent.date).toLocaleDateString() : 'TBD'}`,
                                                    url: `/b/${bdEvent.slug}`,
                                                    slug: bdEvent.slug,
                                                    copyType: 'preview-bd',
                                                    editUrl: `/editBirthday/${bdEvent.id}`,
                                                    reportUrl: `/b-report/${bdEvent.slug}`,
                                                    onDownload: () => downloadBirthdayRSVPs(bdEvent.id, bdEvent.child_name),
                                                    onDelete: () => handleDeleteBirthday(bdEvent.id, `${bdEvent.child_name}'s Birthday`)
                                                })}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem', marginLeft: '0.5rem' }}
                                            >
                                                <i className="fas fa-ellipsis-v"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {archivedBridalShowers.length > 0 && (
                                <div>
                                    <h3 style={{ marginBottom: '1rem', color: '#c5a059', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Archived Bridal Showers</h3>
                                    {archivedBridalShowers.map((bs) => (
                                        <div key={bs.id} className="app-row-item" style={{ borderLeft: '4px solid #c5a059', opacity: 0.8 }}>
                                            <div style={{
                                                width: 52, height: 52, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #dfc28c 0%, #c5a059 100%)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#ffffff', fontWeight: 800, fontSize: '1rem', marginRight: '1.25rem',
                                            }}>
                                                <i className="fas fa-gift" style={{ fontSize: '1rem' }}></i>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                                    {bs.bride_name}'s Bridal Shower
                                                </h4>
                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.15rem' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        <i className="far fa-calendar"></i> {bs.date ? new Date(bs.date).toLocaleDateString() : 'TBD'}
                                                    </span>
                                                    <StatusBadge date={bs.date} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                    <span><i className="fas fa-users" style={{ color: '#c5a059' }}></i> RSVPs: <strong style={{ color: 'var(--text-main)' }}>{bs.rsvp_count || 0}</strong></span>
                                                    <span><i className="fas fa-link" style={{ color: '#c5a059' }}></i> Slug: <strong style={{ color: 'var(--text-main)' }}>/{bs.slug}</strong></span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setActiveActionSheet({
                                                    type: 'bridal_shower',
                                                    title: `${bs.bride_name}'s Bridal Shower`,
                                                    subtitle: `Date: ${bs.date ? new Date(bs.date).toLocaleDateString() : 'TBD'}`,
                                                    url: `/bridal-shower/${bs.slug}`,
                                                    slug: bs.slug,
                                                    copyType: 'bridal-shower',
                                                    editUrl: `/editBridalShower/${bs.id}`,
                                                    reportUrl: `/bs-report/${bs.slug}`,
                                                    onDownload: () => downloadBridalShowerRSVPs(bs.id, bs.bride_name),
                                                    onDelete: () => handleDeleteBridalShower(bs.id, `${bs.bride_name}'s Bridal Shower`)
                                                })}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem', marginLeft: '0.5rem' }}
                                            >
                                                <i className="fas fa-ellipsis-v"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {archivedWeddings.length === 0 && archivedBirthdays.length === 0 && archivedBridalShowers.length === 0 && (
                                <div className="empty-state">
                                    <div className="empty-icon"><i className="fas fa-archive"></i></div>
                                    <h3 className="empty-title">No archived events</h3>
                                    <p className="empty-description">Events that have passed will automatically appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            )}

            {/* Vendors Tab Content */}
            {activeTab === 'vendors' && (
                <main className="main-content">
                    <div className="content-container">
                        <div className="content-header">
                            <div className="header-left">
                                <h2 className="section-title">Supporting Platform Ecosystem</h2>
                                <p className="section-subtitle">Manage service vendors shown on the website directory</p>
                            </div>
                            <div className="header-right">
                                <button className="nav-btn primary" onClick={openAddVendor} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, color: '#ffffff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <i className="fas fa-plus" />
                                    New Vendor
                                </button>
                            </div>
                        </div>

                        {vendorLoading ? (
                            <div className="loading-container">
                                <div className="loading-spinner"><div className="spinner-ring" /><div className="spinner-ring" /><div className="spinner-ring" /><div className="spinner-ring" /></div>
                                <p className="loading-text">Loading platform vendorsΓÇª</p>
                            </div>
                        ) : vendors.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon"><i className="fas fa-store" /></div>
                                <h3 className="empty-title">No vendors listed yet</h3>
                                <p className="empty-description">Create your first directory vendor</p>
                                <button className="empty-action" onClick={openAddVendor} style={{ border: 'none', cursor: 'pointer' }}>
                                    <i className="fas fa-plus" /> Create First Vendor
                                </button>
                            </div>
                        ) : (
                            <div className="vendors-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {vendors.map((vendor) => (
                                    <div key={vendor.id} className="app-row-item" style={{ borderLeft: '4px solid #10b981' }}>
                                        {/* Avatar preview */}
                                        <div style={{
                                            width: 52, height: 52, borderRadius: '50%',
                                            backgroundImage: `url(${vendor.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80'})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            marginRight: '1.25rem',
                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                                            flexShrink: 0
                                        }}>
                                        </div>

                                        {/* Content details */}
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                                {vendor.name}
                                            </h4>
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <i className="fas fa-map-marker-alt" style={{ color: '#10b981' }}></i> {vendor.city}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <i className="fas fa-tag" style={{ color: '#10b981' }}></i> {vendor.category}
                                                </span>
                                                <span className="status-badge" style={{ backgroundColor: '#10b981', color: '#ffffff' }}>
                                                    <i className="fas fa-star" style={{ fontSize: '0.7rem' }}></i> {vendor.rating || '5.0 Verified'}
                                                </span>
                                            </div>
                                            {vendor.description && (
                                                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                    {vendor.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions panel */}
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => openEditVendor(vendor)}
                                                style={{
                                                    background: 'none', border: 'none', color: 'var(--text-muted)',
                                                    cursor: 'pointer', fontSize: '1rem', padding: '0.5rem',
                                                    transition: 'color 0.2s'
                                                }}
                                                title="Edit Vendor"
                                                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                                                style={{
                                                    background: 'none', border: 'none', color: 'var(--text-muted)',
                                                    cursor: 'pointer', fontSize: '1rem', padding: '0.5rem',
                                                    transition: 'color 0.2s'
                                                }}
                                                title="Delete Vendor"
                                                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            )}
            {/* Floating Action Button for Mobile */}
            <Link to={activeTab === 'birthdays' ? '/addBirthday' : '/addWedding'} className="fab">
                <i className="fas fa-plus"></i>
            </Link>

            {showReminderModal && selectedWeddingForReminder && (
                <ReminderModal
                    wedding={selectedWeddingForReminder}
                    onClose={() => setShowReminderModal(false)}
                    onSave={() => {
                        fetchWeddings();
                        setShowReminderModal(false);
                    }}
                />
            )}

            {showVendorModal && (
                <div className="popup-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div className="popup-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', width: '90%', background: 'var(--bg-surface)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-color)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                {editingVendor ? 'Edit Platform Vendor' : 'Add New Platform Vendor'}
                            </h3>
                            <button onClick={() => { setShowVendorModal(false); setEditingVendor(null); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSaveVendor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'left' }}>Vendor Name</label>
                                <input
                                    type="text"
                                    required
                                    className="form-control"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-elevated)', color: 'var(--text-main)' }}
                                    placeholder="e.g. Glow by Sarah M."
                                    value={vendorForm.name}
                                    onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'left' }}>Category / Service</label>
                                    <select
                                        className="form-control"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-elevated)', color: 'var(--text-main)' }}
                                        value={vendorForm.category}
                                        onChange={e => setVendorForm({ ...vendorForm, category: e.target.value })}
                                    >
                                        <option value="Makeup">Makeup</option>
                                        <option value="Photography">Photography</option>
                                        <option value="Decor">Decor</option>
                                        <option value="Catering">Catering</option>
                                        <option value="Venues">Venues</option>
                                        <option value="DJ/Sound">DJ/Sound</option>
                                        <option value="Planning">Planning</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'left' }}>Location / City</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-control"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-elevated)', color: 'var(--text-main)' }}
                                        placeholder="e.g. Lusaka"
                                        value={vendorForm.city}
                                        onChange={e => setVendorForm({ ...vendorForm, city: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'left' }}>Cover Photo</label>
                                <input
                                    type="file"
                                    id="vendor-cover-upload"
                                    accept="image/*"
                                    onChange={handleCoverUploadChange}
                                    style={{ display: 'none' }}
                                />
                                <div
                                    onClick={() => document.getElementById('vendor-cover-upload').click()}
                                    style={{
                                        border: '2px dashed var(--border-color)',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: 'var(--bg-surface-elevated)',
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: '120px'
                                    }}
                                >
                                    {uploadingCover ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#10b981' }}></i>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Uploading Cover Photo...</span>
                                        </div>
                                    ) : vendorForm.image ? (
                                        <div style={{ width: '100%', position: 'relative' }}>
                                            <img src={vendorForm.image} alt="Cover" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setVendorForm({ ...vendorForm, image: '' }); }}
                                                style={{
                                                    position: 'absolute', top: '8px', right: '8px',
                                                    background: 'rgba(239, 68, 68, 0.9)', border: 'none', borderRadius: '50%',
                                                    width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#fff', cursor: 'pointer', zIndex: 10
                                                }}
                                            >
                                                <i className="fas fa-trash" style={{ fontSize: '0.8rem' }}></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                            <i className="fas fa-cloud-upload-alt" style={{ fontSize: '1.8rem', color: 'var(--text-muted)' }}></i>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Upload Cover Photo</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PNG, JPG up to 5MB</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'left' }}>Portfolio Gallery (Videos & Pictures of Work)</label>
                                <input
                                    type="file"
                                    id="vendor-portfolio-upload"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handlePortfolioUploadChange}
                                    style={{ display: 'none' }}
                                />
                                <div
                                    onClick={() => document.getElementById('vendor-portfolio-upload').click()}
                                    style={{
                                        border: '2px dashed var(--border-color)',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: 'var(--bg-surface-elevated)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: '100px'
                                    }}
                                >
                                    {uploadingPortfolio ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#10b981' }}></i>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Uploading Portfolio...</span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                            <i className="fas fa-images" style={{ fontSize: '1.8rem', color: 'var(--text-muted)' }}></i>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Upload Work Gallery Items</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Multi-select images & videos up to 20MB</span>
                                        </div>
                                    )}
                                </div>

                                {vendorForm.portfolio && vendorForm.portfolio.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {vendorForm.portfolio.map((item, index) => (
                                            <div key={index} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', height: '65px', border: '1px solid var(--border-color)', background: '#000' }}>
                                                {item.type === 'video' ? (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <i className="fas fa-play" style={{ color: '#fff', fontSize: '0.8rem' }}></i>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <img src={item.url} alt="Work item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const updated = [...vendorForm.portfolio];
                                                        updated.splice(index, 1);
                                                        setVendorForm({ ...vendorForm, portfolio: updated });
                                                    }}
                                                    style={{
                                                        position: 'absolute', top: '2px', right: '2px',
                                                        background: 'rgba(239, 68, 68, 0.9)', border: 'none', borderRadius: '50%',
                                                        width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', cursor: 'pointer', zIndex: 10
                                                    }}
                                                >
                                                    <i className="fas fa-times" style={{ fontSize: '0.55rem' }}></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'left' }}>Rating & Verification Status</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-elevated)', color: 'var(--text-main)' }}
                                    placeholder="e.g. 5.0 Verified"
                                    value={vendorForm.rating}
                                    onChange={e => setVendorForm({ ...vendorForm, rating: e.target.value })}
                                />
                            </div>

                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'left' }}>Short Description</label>
                                <textarea
                                    className="form-control"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-elevated)', color: 'var(--text-main)', height: '80px', resize: 'vertical' }}
                                    placeholder="e.g. Top-rated makeup professional. One simple search."
                                    value={vendorForm.description}
                                    onChange={e => setVendorForm({ ...vendorForm, description: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => { setShowVendorModal(false); setEditingVendor(null); }} className="nav-btn outline" style={{ flex: 1, padding: '10px 18px', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="nav-btn primary" disabled={uploadingCover || uploadingPortfolio} style={{ flex: 1, padding: '10px 18px', cursor: 'pointer', background: 'var(--primary)', color: '#ffffff', border: 'none', opacity: (uploadingCover || uploadingPortfolio) ? 0.6 : 1 }}>
                                    {(uploadingCover || uploadingPortfolio) ? 'Uploading Files...' : 'Save Vendor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeActionSheet && (
                <div className="bottom-sheet-overlay" onClick={() => setActiveActionSheet(null)}>
                    <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="bottom-sheet-drag-handle"></div>

                        <div className="bottom-sheet-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div className="bottom-sheet-avatar">
                                    <i className={
                                        activeActionSheet.type === 'wedding' ? 'fas fa-glass-cheers' :
                                            activeActionSheet.type === 'birthday' ? 'fas fa-birthday-cake' :
                                                'fas fa-gift'
                                    } style={{
                                        color: activeActionSheet.type === 'wedding' ? 'var(--primary)' :
                                            activeActionSheet.type === 'birthday' ? '#c44569' :
                                                '#c5a059'
                                    }}></i>
                                </div>
                                <div>
                                    <h4 className="bottom-sheet-title">{activeActionSheet.title}</h4>
                                    <p className="bottom-sheet-subtitle">{activeActionSheet.subtitle}</p>
                                </div>
                            </div>
                            <button className="bottom-sheet-close" onClick={() => setActiveActionSheet(null)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="bottom-sheet-actions">
                            {/* View Site */}
                            {activeActionSheet.type === 'wedding' && (
                                <a href={`${window.location.origin}/w/${activeActionSheet.slug}`} target="_blank" rel="noopener noreferrer" className="bottom-sheet-action-btn">
                                    <i className="fas fa-external-link-alt" style={{ color: 'var(--primary)' }}></i>
                                    <span>View Invitation Website</span>
                                </a>
                            )}
                            {activeActionSheet.type === 'birthday' && (
                                <a href={`${window.location.origin}/b/${activeActionSheet.slug}`} target="_blank" rel="noopener noreferrer" className="bottom-sheet-action-btn">
                                    <i className="fas fa-external-link-alt" style={{ color: '#c44569' }}></i>
                                    <span>View Invitation Website</span>
                                </a>
                            )}
                            {activeActionSheet.type === 'bridal_shower' && (
                                <a href={`${window.location.origin}/bridal-shower/${activeActionSheet.slug}`} target="_blank" rel="noopener noreferrer" className="bottom-sheet-action-btn">
                                    <i className="fas fa-external-link-alt" style={{ color: '#c5a059' }}></i>
                                    <span>View Invitation Website</span>
                                </a>
                            )}

                            {/* Share / Copy WhatsApp Link */}
                            <button onClick={() => { copyLink(activeActionSheet.slug, activeActionSheet.copyType); setActiveActionSheet(null); }} className="bottom-sheet-action-btn">
                                <i className="fab fa-whatsapp" style={{ color: '#25D366' }}></i>
                                <span>Copy Link for WhatsApp</span>
                            </button>

                            {/* RSVP Report */}
                            <Link to={activeActionSheet.reportUrl} target="_blank" className="bottom-sheet-action-btn">
                                <i className="fas fa-chart-bar" style={{ color: '#3b82f6' }}></i>
                                <span>View RSVP Report</span>
                            </Link>

                            {/* Download Excel */}
                            <button onClick={() => { activeActionSheet.onDownload(); setActiveActionSheet(null); }} className="bottom-sheet-action-btn">
                                <i className="fas fa-file-excel" style={{ color: 'var(--success)' }}></i>
                                <span>Download RSVPs Excel</span>
                            </button>

                            {/* Manage Reminder Modal (Weddings only) */}
                            {activeActionSheet.type === 'wedding' && (
                                <button onClick={() => {
                                    setSelectedWeddingForReminder(activeActionSheet.rawEvent);
                                    setShowReminderModal(true);
                                    setActiveActionSheet(null);
                                }} className="bottom-sheet-action-btn">
                                    <i className="fas fa-bell" style={{ color: 'var(--primary)' }}></i>
                                    <span>Manage Reminders</span>
                                </button>
                            )}

                            {/* Edit */}
                            <Link to={activeActionSheet.editUrl} className="bottom-sheet-action-btn">
                                <i className="fas fa-edit" style={{ color: '#8b5cf6' }}></i>
                                <span>Edit Event Details</span>
                            </Link>

                            {/* Delete */}
                            <button onClick={() => { activeActionSheet.onDelete(); setActiveActionSheet(null); }} className="bottom-sheet-action-btn delete">
                                <i className="fas fa-trash" style={{ color: 'var(--danger)' }}></i>
                                <span style={{ color: 'var(--danger)' }}>Delete Event</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Premium Mobile Bottom Navigation Bar */}
            <div className="mobile-bottom-nav">
                <button
                    className={`mobile-bottom-nav-item ${activeTab === 'weddings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('weddings')}
                >
                    <i className="fas fa-glass-cheers"></i>
                    <span>Weddings</span>
                </button>
                <button
                    className={`mobile-bottom-nav-item birthdays-tab ${activeTab === 'birthdays' ? 'active' : ''}`}
                    onClick={() => setActiveTab('birthdays')}
                >
                    <i className="fas fa-birthday-cake"></i>
                    <span>Birthdays</span>
                </button>
                <button
                    className={`mobile-bottom-nav-item bridal-tab ${activeTab === 'bridal_showers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bridal_showers')}
                >
                    <i className="fas fa-gift"></i>
                    <span>Showers</span>
                </button>
                <button
                    className={`mobile-bottom-nav-item ${activeTab === 'marketing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('marketing')}
                >
                    <i className="fas fa-envelope"></i>
                    <span>Marketing</span>
                </button>
            </div>
        </div>
    );
};

export default AdminDashboard;
