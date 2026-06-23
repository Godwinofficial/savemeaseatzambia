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

    const parsePortfolio = (portfolio) => {
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

        // Calculate stats (only for active weddings)
        const activeList = weddings.filter(w => getWeddingStatus(w.date) !== 'past');
        const totalRSVPs = activeList.reduce((acc, w) => acc + (w.rsvp_count || 0), 0);
        const totalViews = activeList.reduce((acc, w) => acc + (w.views || 0), 0);
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
            setVendors((data || []).map(vendor => ({
                ...vendor,
                portfolio: parsePortfolio(vendor.portfolio)
            })));
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
            portfolio: parsePortfolio(vendor.portfolio)
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

        console.log('🔔 Checking for due reminders...', {
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
                console.log(`  ✅ DUE: ${w.groom_name} & ${w.bride_name} - ${reason.join(', ')}`);
            }

            return isDue;
        });

        console.log(`📊 Found ${due.length} wedding(s) with due reminders`);
        setDueReminders(due);
    };

    const sendDueReminders = async () => {
        if (dueReminders.length === 0) return;

        console.log(`📧 Auto-sending reminders for ${dueReminders.length} wedding(s)...`);
        setProcessingReminders(true);

        try {
            let successCount = 0;

            for (const wedding of dueReminders) {
                console.log(`\n📨 Processing wedding: ${wedding.groom_name} & ${wedding.bride_name}`);

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
                    console.error(`  ❌ Error fetching guests for ${wedding.groom_name}`, error);
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
                        console.log(`    ✅ Sent to ${guest.email}`);
                        emailSent = true;
                        // Small delay to avoid rate limits
                        await new Promise(r => setTimeout(r, 500));
                    } catch (e) {
                        console.error(`    ❌ Failed to email ${guest.email}`, e);
                    }
                }

                // Update DB
                const updates = {};
                if (isDayOfDue) updates.reminder_sent_day_of = true;
                if (isCustomDue) updates.reminder_sent_custom = true;

                if (Object.keys(updates).length > 0) {
                    await supabase.from('weddings').update(updates).eq('id', wedding.id);
                    console.log(`  ✅ Updated database:`, updates);
                    successCount++;
                }
            }

            console.log(`\n🎉 Processed reminders for ${successCount} wedding(s).`);
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

    const filteredWeddingsList = weddings.filter(w =>
        w.groom_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.bride_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.venue_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const activeWeddings = filteredWeddingsList.filter(w => getWeddingStatus(w.date) !== 'past');
    const archivedWeddings = filteredWeddingsList.filter(w => getWeddingStatus(w.date) === 'past');

    const filteredBirthdaysList = birthdays.filter(b =>
        b.child_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.venue_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const activeBirthdays = filteredBirthdaysList.filter(b => getWeddingStatus(b.date) !== 'past');
    const archivedBirthdays = filteredBirthdaysList.filter(b => getWeddingStatus(b.date) === 'past');

    const filteredBridalShowersList = bridalShowers.filter(bs =>
        bs.bride_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bs.venue_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bs.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const activeBridalShowers = filteredBridalShowersList.filter(bs => getWeddingStatus(bs.date) !== 'past');
    const archivedBridalShowers = filteredBridalShowersList.filter(bs => getWeddingStatus(bs.date) === 'past');

    const filteredVendorsList = vendors.filter(v =>
        v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <div className="rr-page">
            <div className="phone-shell">
                <div className="scroll-area">
                    {/* HERO */}
                    <div className="hero">
                        <div className="hero-ring r1"></div>
                        <div className="hero-ring r2"></div>

                        <div className="hero-eyebrow">SAVE ME A SEAT</div>
                        <div className="hero-big-num">{weddings.length + birthdays.length + bridalShowers.length}</div>
                        <div className="hero-couple">Total Events</div>
                        <div className="hero-meta">Managing all your celebrations</div>

                        <div className="hero-btns">
                            <Link to="/addWedding" className="hbtn" style={{ textDecoration: 'none' }}>
                                <div className="hbtn-icon"><i className="fas fa-plus"></i></div>
                                <span className="hbtn-lbl">WEDDING</span>
                            </Link>
                            <Link to="/addBridalShower" className="hbtn hbtn-lime" style={{ textDecoration: 'none' }}>
                                <div className="hbtn-icon"><i className="fas fa-gift"></i></div>
                                <span className="hbtn-lbl">SHOWER</span>
                            </Link>
                            <button className="hbtn" onClick={() => setShowMobileMenu(true)}>
                                <div className="hbtn-icon"><i className="fas fa-bars"></i></div>
                                <span className="hbtn-lbl">MENU</span>
                            </button>
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="content-pad">
                        {/* SEARCH */}
                        <div className="search-wrap">
                            <i className="fas fa-search si"></i>
                            <input
                                type="text"
                                className="search-inp"
                                placeholder="Search events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button className="search-clear" onClick={() => setSearchTerm('')}>
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>

                        {/* TABS */}
                        <div className="sec-hdr" style={{ marginTop: '0.5rem' }}>
                            <div className="sec-title">Event Activities</div>
                            <div className="sec-tabs" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <style>{`.sec-tabs::-webkit-scrollbar { display: none; }`}</style>
                                <button className={`sec-tab ${activeTab === 'weddings' ? 'sec-tab-on' : ''}`} onClick={() => setActiveTab('weddings')}>Weddings</button>
                                <button className={`sec-tab ${activeTab === 'birthdays' ? 'sec-tab-on' : ''}`} onClick={() => setActiveTab('birthdays')}>Birthdays</button>
                                <button className={`sec-tab ${activeTab === 'bridal_showers' ? 'sec-tab-on' : ''}`} onClick={() => setActiveTab('bridal_showers')}>Bridal Showers</button>
                                <button className={`sec-tab ${activeTab === 'marketing' ? 'sec-tab-on' : ''}`} onClick={() => setActiveTab('marketing')}>Marketing</button>
                                <button className={`sec-tab ${activeTab === 'vendors' ? 'sec-tab-on' : ''}`} onClick={() => setActiveTab('vendors')}>Vendors</button>
                                <button className={`sec-tab ${activeTab === 'archives' ? 'sec-tab-on' : ''}`} onClick={() => setActiveTab('archives')}>Archives</button>
                            </div>
                        </div>

                        {/* LIST */}
                        <div className="guest-list">
                            {/* Render active events based on activeTab */}
                            {activeTab === 'weddings' && activeWeddings.map(wedding => {
                                const isPositive = (wedding.rsvp_count || 0) > 0;
                                return (
                                    <div key={wedding.id} className="g-row" onClick={() => navigate(`/w/${wedding.slug}`)} style={{ cursor: 'pointer' }}>
                                        <div className="g-avatar" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)' }}>
                                            {wedding.groom_name?.substring(0, 1)}{wedding.bride_name?.substring(0, 1)}
                                        </div>
                                        <div className="g-info">
                                            <span className="g-name">{wedding.groom_name} & {wedding.bride_name}</span>
                                            <span className="g-sub">Wedding Co. • {new Date(wedding.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="g-right">
                                            <span className={`g-count ${isPositive ? 'gc-green' : 'gc-red'}`}>{wedding.rsvp_count || 0}</span>
                                            <span className={`g-pct ${isPositive ? 'gp-green' : 'gp-red'}`}>
                                                {isPositive ? '+' : ''}{wedding.views ? Math.round(wedding.views / 10) : 0}%
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveActionSheet({
                                                    type: 'wedding',
                                                    title: `${wedding.groom_name} & ${wedding.bride_name}`,
                                                    subtitle: `Wedding Date: ${new Date(wedding.date).toLocaleDateString()}`,
                                                    url: `/w/${wedding.slug}`,
                                                    slug: wedding.slug,
                                                    copyType: 'preview',
                                                    editUrl: `/editWedding/${wedding.id}`,
                                                    rawEvent: wedding,
                                                    reportUrl: `/report/${wedding.slug}`,
                                                    onDownload: () => downloadRSVPs(wedding.id, `${wedding.groom_name}_${wedding.bride_name}`),
                                                    onDelete: () => handleDelete(wedding.id, `${wedding.groom_name} & ${wedding.bride_name}`)
                                                });
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#9ca3af', padding: '0.5rem', cursor: 'pointer' }}
                                        >
                                            <i className="fas fa-ellipsis-v"></i>
                                        </button>
                                    </div>
                                )
                            })}

                            {activeTab === 'birthdays' && activeBirthdays.map(bday => {
                                const isPositive = (bday.rsvp_count || 0) > 0;
                                return (
                                    <div key={bday.id} className="g-row" onClick={() => navigate(`/b/${bday.slug}`)} style={{ cursor: 'pointer' }}>
                                        <div className="g-avatar" style={{ background: '#c44569' }}>
                                            {bday.celebrant_name?.substring(0, 1)}
                                        </div>
                                        <div className="g-info">
                                            <span className="g-name">{bday.celebrant_name}'s Birthday</span>
                                            <span className="g-sub">Birthday • {new Date(bday.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="g-right">
                                            <span className={`g-count ${isPositive ? 'gc-green' : 'gc-red'}`}>{bday.rsvp_count || 0}</span>
                                            <span className={`g-pct ${isPositive ? 'gp-green' : 'gp-red'}`}>
                                                {isPositive ? '+' : ''}{bday.views ? Math.round(bday.views / 10) : 0}%
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveActionSheet({
                                                    type: 'birthday',
                                                    title: `${bday.celebrant_name}'s Birthday`,
                                                    subtitle: `Date: ${new Date(bday.date).toLocaleDateString()}`,
                                                    url: `/b/${bday.slug}`,
                                                    slug: bday.slug,
                                                    copyType: 'birthday',
                                                    editUrl: `/editBirthday/${bday.id}`,
                                                    rawEvent: bday,
                                                    reportUrl: `/report/${bday.slug}`,
                                                    onDownload: () => downloadBirthdayRSVPs(bday.id, bday.celebrant_name),
                                                    onDelete: () => handleDeleteBirthday(bday.id, `${bday.celebrant_name}'s Birthday`)
                                                });
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#9ca3af', padding: '0.5rem', cursor: 'pointer' }}
                                        >
                                            <i className="fas fa-ellipsis-v"></i>
                                        </button>
                                    </div>
                                )
                            })}

                            {activeTab === 'bridal_showers' && activeBridalShowers.map(shower => {
                                const isPositive = (shower.rsvp_count || 0) > 0;
                                return (
                                    <div key={shower.id} className="g-row" onClick={() => navigate(`/bridal-shower/${shower.slug}`)} style={{ cursor: 'pointer' }}>
                                        <div className="g-avatar" style={{ background: '#c5a059' }}>
                                            {shower.bride_name?.substring(0, 1)}
                                        </div>
                                        <div className="g-info">
                                            <span className="g-name">{shower.bride_name}'s Shower</span>
                                            <span className="g-sub">Shower • {new Date(shower.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="g-right">
                                            <span className={`g-count ${isPositive ? 'gc-green' : 'gc-red'}`}>{shower.rsvp_count || 0}</span>
                                            <span className={`g-pct ${isPositive ? 'gp-green' : 'gp-red'}`}>
                                                {isPositive ? '+' : ''}{shower.views ? Math.round(shower.views / 10) : 0}%
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveActionSheet({
                                                    type: 'bridal_shower',
                                                    title: `${shower.bride_name}'s Bridal Shower`,
                                                    subtitle: `Date: ${new Date(shower.date).toLocaleDateString()}`,
                                                    url: `/bridal-shower/${shower.slug}`,
                                                    slug: shower.slug,
                                                    copyType: 'bridal_shower',
                                                    editUrl: `/editBridalShower/${shower.id}`,
                                                    rawEvent: shower,
                                                    reportUrl: `/report/${shower.slug}`,
                                                    onDownload: () => downloadBridalShowerRSVPs(shower.id, shower.bride_name),
                                                    onDelete: () => handleDeleteBridalShower(shower.id, `${shower.bride_name}'s Bridal Shower`)
                                                });
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#9ca3af', padding: '0.5rem', cursor: 'pointer' }}
                                        >
                                            <i className="fas fa-ellipsis-v"></i>
                                        </button>
                                    </div>
                                )
                            })}

                            {activeTab === 'marketing' && (
                                <div style={{ background: '#fff', borderRadius: '16px', padding: '0.25rem', boxShadow: '0 1px 5px rgba(0,0,0,.05)' }}>
                                    <EmailMarketing />
                                </div>
                            )}

                            {activeTab === 'vendors' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <button
                                        className="ga-approve"
                                        onClick={openAddVendor}
                                        style={{
                                            background: '#10b981',
                                            color: '#fff',
                                            padding: '0.85rem',
                                            justifyContent: 'center',
                                            fontSize: '0.85rem',
                                            borderRadius: '12px',
                                            marginBottom: '0.5rem',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            width: '100%'
                                        }}
                                    >
                                        <i className="fas fa-plus"></i> Add New Vendor
                                    </button>
                                    {filteredVendorsList.map(vendor => (
                                        <div key={vendor.id} className="g-row">
                                            <div
                                                className="g-avatar"
                                                style={{
                                                    backgroundImage: `url(${vendor.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80'})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    borderRadius: '14px',
                                                    width: '44px',
                                                    height: '44px'
                                                }}
                                            />
                                            <div className="g-info">
                                                <span className="g-name">{vendor.name}</span>
                                                <span className="g-sub">{vendor.category} • {vendor.city}</span>
                                            </div>
                                            <div className="g-right" style={{ marginRight: '0.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                                                    ★ {vendor.rating?.split(' ')[0] || '5.0'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <button
                                                    onClick={() => openEditVendor(vendor)}
                                                    style={{ background: 'none', border: 'none', color: '#9ca3af', padding: '0.4rem', cursor: 'pointer' }}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', padding: '0.4rem', cursor: 'pointer' }}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredVendorsList.length === 0 && (
                                        <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                                            <i className="fas fa-store" style={{ fontSize: '2.5rem', color: '#9ca3af', marginBottom: '1rem', display: 'block' }}></i>
                                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>No vendors listed yet.</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'archives' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {archivedWeddings.length > 0 && (
                                        <div>
                                            <div className="sec-title" style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Archived Weddings</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                                {archivedWeddings.map(wedding => {
                                                    const isPositive = (wedding.rsvp_count || 0) > 0;
                                                    return (
                                                        <div key={wedding.id} className="g-row" onClick={() => navigate(`/w/${wedding.slug}`)} style={{ cursor: 'pointer', opacity: 0.7 }}>
                                                            <div className="g-avatar" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)' }}>
                                                                {wedding.groom_name?.substring(0, 1)}{wedding.bride_name?.substring(0, 1)}
                                                            </div>
                                                            <div className="g-info">
                                                                <span className="g-name">{wedding.groom_name} & {wedding.bride_name}</span>
                                                                <span className="g-sub">Wedding • {new Date(wedding.date).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="g-right">
                                                                <span className={`g-count ${isPositive ? 'gc-green' : 'gc-red'}`}>{wedding.rsvp_count || 0}</span>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveActionSheet({
                                                                        type: 'wedding',
                                                                        title: `${wedding.groom_name} & ${wedding.bride_name}`,
                                                                        subtitle: `Wedding Date: ${new Date(wedding.date).toLocaleDateString()}`,
                                                                        url: `/w/${wedding.slug}`,
                                                                        slug: wedding.slug,
                                                                        copyType: 'preview',
                                                                        editUrl: `/editWedding/${wedding.id}`,
                                                                        rawEvent: wedding,
                                                                        reportUrl: `/report/${wedding.slug}`,
                                                                        onDownload: () => downloadRSVPs(wedding.id, `${wedding.groom_name}_${wedding.bride_name}`),
                                                                        onDelete: () => handleDelete(wedding.id, `${wedding.groom_name} & ${wedding.bride_name}`)
                                                                    });
                                                                }}
                                                                style={{ background: 'none', border: 'none', color: '#9ca3af', padding: '0.5rem', cursor: 'pointer' }}
                                                            >
                                                                <i className="fas fa-ellipsis-v"></i>
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {archivedBirthdays.length > 0 && (
                                        <div>
                                            <div className="sec-title" style={{ marginBottom: '0.5rem', color: '#c44569' }}>Archived Birthdays</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                                {archivedBirthdays.map(bday => {
                                                    const isPositive = (bday.rsvp_count || 0) > 0;
                                                    return (
                                                        <div key={bday.id} className="g-row" onClick={() => navigate(`/b/${bday.slug}`)} style={{ cursor: 'pointer', opacity: 0.7 }}>
                                                            <div className="g-avatar" style={{ background: '#c44569' }}>
                                                                {bday.celebrant_name?.substring(0, 1)}
                                                            </div>
                                                            <div className="g-info">
                                                                <span className="g-name">{bday.celebrant_name}'s Birthday</span>
                                                                <span className="g-sub">Birthday • {new Date(bday.date).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="g-right">
                                                                <span className={`g-count ${isPositive ? 'gc-green' : 'gc-red'}`}>{bday.rsvp_count || 0}</span>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveActionSheet({
                                                                        type: 'birthday',
                                                                        title: `${bday.celebrant_name}'s Birthday`,
                                                                        subtitle: `Date: ${new Date(bday.date).toLocaleDateString()}`,
                                                                        url: `/b/${bday.slug}`,
                                                                        slug: bday.slug,
                                                                        copyType: 'birthday',
                                                                        editUrl: `/editBirthday/${bday.id}`,
                                                                        rawEvent: bday,
                                                                        reportUrl: `/report/${bday.slug}`,
                                                                        onDownload: () => downloadBirthdayRSVPs(bday.id, `${bday.celebrant_name}_Birthday`),
                                                                        onDelete: () => handleDeleteBirthday(bday.id, `${bday.celebrant_name}'s Birthday`)
                                                                    });
                                                                }}
                                                                style={{ background: 'none', border: 'none', color: '#9ca3af', padding: '0.5rem', cursor: 'pointer' }}
                                                            >
                                                                <i className="fas fa-ellipsis-v"></i>
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {archivedBridalShowers.length > 0 && (
                                        <div>
                                            <div className="sec-title" style={{ marginBottom: '0.5rem', color: '#c5a059' }}>Archived Bridal Showers</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                                {archivedBridalShowers.map(shower => {
                                                    const isPositive = (shower.rsvp_count || 0) > 0;
                                                    return (
                                                        <div key={shower.id} className="g-row" onClick={() => navigate(`/bridal-shower/${shower.slug}`)} style={{ cursor: 'pointer', opacity: 0.7 }}>
                                                            <div className="g-avatar" style={{ background: '#c5a059' }}>
                                                                {shower.bride_name?.substring(0, 1)}
                                                            </div>
                                                            <div className="g-info">
                                                                <span className="g-name">{shower.bride_name}'s Shower</span>
                                                                <span className="g-sub">Shower • {new Date(shower.date).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="g-right">
                                                                <span className={`g-count ${isPositive ? 'gc-green' : 'gc-red'}`}>{shower.rsvp_count || 0}</span>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveActionSheet({
                                                                        type: 'bridal_shower',
                                                                        title: `${shower.bride_name}'s Bridal Shower`,
                                                                        subtitle: `Date: ${new Date(shower.date).toLocaleDateString()}`,
                                                                        url: `/bridal-shower/${shower.slug}`,
                                                                        slug: shower.slug,
                                                                        copyType: 'bridal_shower',
                                                                        editUrl: `/editBridalShower/${shower.id}`,
                                                                        rawEvent: shower,
                                                                        reportUrl: `/report/${shower.slug}`,
                                                                        onDownload: () => downloadBridalShowerRSVPs(shower.id, `${shower.bride_name}_Bridal_Shower`),
                                                                        onDelete: () => handleDeleteBridalShower(shower.id, `${shower.bride_name}'s Bridal Shower`)
                                                                    });
                                                                }}
                                                                style={{ background: 'none', border: 'none', color: '#9ca3af', padding: '0.5rem', cursor: 'pointer' }}
                                                            >
                                                                <i className="fas fa-ellipsis-v"></i>
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {archivedWeddings.length === 0 && archivedBirthdays.length === 0 && archivedBridalShowers.length === 0 && (
                                        <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                                            <i className="fas fa-archive" style={{ fontSize: '2.5rem', color: '#9ca3af', marginBottom: '1rem', display: 'block' }}></i>
                                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>No archived events.</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BOTTOM NAV */}
                <nav className="btm-nav">
                    <button className={`bn-item ${activeTab === 'weddings' ? 'bn-active' : ''}`} onClick={() => setActiveTab('weddings')}>
                        <i className="fas fa-ring"></i><span>Weddings</span>
                    </button>
                    <button className={`bn-item ${activeTab === 'birthdays' ? 'bn-active' : ''}`} onClick={() => setActiveTab('birthdays')}>
                        <i className="fas fa-birthday-cake"></i><span>Birthdays</span>
                    </button>
                    <button className="bn-center" onClick={() => setShowMobileMenu(true)}>
                        <i className="fas fa-bars"></i>
                    </button>
                    <button className={`bn-item ${activeTab === 'bridal_showers' ? 'bn-active' : ''}`} onClick={() => setActiveTab('bridal_showers')}>
                        <i className="fas fa-gift"></i><span>Showers</span>
                    </button>
                    <button className={`bn-item ${activeTab === 'vendors' ? 'bn-active' : ''}`} onClick={() => setActiveTab('vendors')}>
                        <i className="fas fa-store"></i><span>Vendors</span>
                    </button>
                </nav>
            </div>

            {/* Mobile Menu Overlay */}
            {showMobileMenu && (
                <div className="vm-overlay" onClick={() => setShowMobileMenu(false)}>
                    <div className="vm-box" onClick={e => e.stopPropagation()} style={{ padding: '1.5rem', height: 'auto', gap: '0.85rem' }}>
                        <h3 className="vm-name">Menu</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <Link to="/addWedding" className="nav-btn primary" onClick={() => setShowMobileMenu(false)} style={{ padding: '0.85rem', textAlign: 'center', background: '#12121c', color: '#a3e635', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-plus"></i> Create New Wedding
                            </Link>
                            <Link to="/addBirthday" className="nav-btn primary" onClick={() => setShowMobileMenu(false)} style={{ padding: '0.85rem', textAlign: 'center', background: '#c44569', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-plus"></i> Create New Birthday
                            </Link>
                            <Link to="/addBridalShower" className="nav-btn primary" onClick={() => setShowMobileMenu(false)} style={{ padding: '0.85rem', textAlign: 'center', background: '#c5a059', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-plus"></i> Create Bridal Shower
                            </Link>
                            <button className="nav-btn outline" onClick={() => { setActiveTab('marketing'); setShowMobileMenu(false); }} style={{ padding: '0.85rem', background: '#f3f4f6', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-envelope"></i> Email Marketing
                            </button>
                            <button className="nav-btn outline" onClick={() => { setActiveTab('vendors'); setShowMobileMenu(false); }} style={{ padding: '0.85rem', background: '#f3f4f6', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-store"></i> Manage Ecosystem Vendors
                            </button>
                            <button className="nav-btn outline" onClick={() => { setActiveTab('archives'); setShowMobileMenu(false); }} style={{ padding: '0.85rem', background: '#f3f4f6', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-archive"></i> View Archives
                            </button>
                            <button className="nav-btn outline" onClick={() => { handleLogout(); setShowMobileMenu(false); }} style={{ padding: '0.85rem', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Overlays (Action Sheets) */}
            {activeActionSheet && (
                <div className="vm-overlay" onClick={() => setActiveActionSheet(null)}>
                    <div className="vm-box" onClick={(e) => e.stopPropagation()} style={{ padding: '1.5rem' }}>
                        <h4 className="vm-name">{activeActionSheet.title}</h4>
                        <p className="vm-desc" style={{ marginBottom: '1.5rem' }}>{activeActionSheet.subtitle}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <a href={`${window.location.origin}${activeActionSheet.type === 'wedding' ? '/w/' : activeActionSheet.type === 'birthday' ? '/b/' : '/bridal-shower/'}${activeActionSheet.slug}`} target="_blank" rel="noopener noreferrer" className="ga-approve" style={{ padding: '0.85rem', justifyContent: 'center', fontSize: '0.85rem', textDecoration: 'none' }}>
                                <i className="fas fa-external-link-alt"></i> View Website
                            </a>
                            <button onClick={() => { copyLink(activeActionSheet.slug, activeActionSheet.copyType); setActiveActionSheet(null); }} className="ga-approve" style={{ background: '#25D366', color: '#fff', padding: '0.85rem', justifyContent: 'center', fontSize: '0.85rem' }}>
                                <i className="fab fa-whatsapp"></i> Copy Link for WhatsApp
                            </button>
                            <Link to={activeActionSheet.reportUrl} target="_blank" className="ga-approve" style={{ background: '#3b82f6', color: '#fff', padding: '0.85rem', justifyContent: 'center', fontSize: '0.85rem', textDecoration: 'none' }}>
                                <i className="fas fa-chart-bar"></i> View RSVP Report
                            </Link>
                            <button onClick={() => { activeActionSheet.onDownload(); setActiveActionSheet(null); }} className="ga-approve" style={{ background: '#10b981', color: '#fff', padding: '0.85rem', justifyContent: 'center', fontSize: '0.85rem' }}>
                                <i className="fas fa-file-excel"></i> Download Excel
                            </button>
                            <Link to={activeActionSheet.editUrl} className="ga-approve" style={{ background: '#8b5cf6', color: '#fff', padding: '0.85rem', justifyContent: 'center', fontSize: '0.85rem', textDecoration: 'none' }}>
                                <i className="fas fa-edit"></i> Edit Details
                            </Link>
                            <button onClick={() => { activeActionSheet.onDelete(); setActiveActionSheet(null); }} className="ga-approve" style={{ background: '#ef4444', color: '#fff', padding: '0.85rem', justifyContent: 'center', fontSize: '0.85rem' }}>
                                <i className="fas fa-trash"></i> Delete Event
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showVendorModal && (
                <div className="vm-overlay" onClick={() => setShowVendorModal(false)}>
                    <div className="vm-box" onClick={(e) => e.stopPropagation()} style={{ padding: '1.5rem', maxWidth: '520px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <h4 className="vm-name">{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</h4>
                                <p className="vm-desc">{editingVendor ? 'Update existing vendor details.' : 'Add a new vendor to the ecosystem.'}</p>
                            </div>
                            <button onClick={() => setShowVendorModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
                        </div>

                        <form onSubmit={handleSaveVendor} style={{ display: 'grid', gap: '1rem' }}>
                            <label style={{ display: 'grid', gap: '0.35rem' }}>
                                Vendor Name
                                <input
                                    type="text"
                                    value={vendorForm.name}
                                    onChange={e => setVendorForm(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                    style={{ width: '100%', padding: '0.95rem 1rem', borderRadius: '12px', border: '1px solid #d1d5db', background: '#f8fafc' }}
                                />
                            </label>

                            <label style={{ display: 'grid', gap: '0.35rem' }}>
                                Category
                                <select
                                    value={vendorForm.category}
                                    onChange={e => setVendorForm(prev => ({ ...prev, category: e.target.value }))}
                                    required
                                    style={{ width: '100%', padding: '0.95rem 1rem', borderRadius: '12px', border: '1px solid #d1d5db', background: '#f8fafc' }}
                                >
                                    <option>Makeup</option>
                                    <option>Photography</option>
                                    <option>Venue</option>
                                    <option>Catering</option>
                                    <option>Attire</option>
                                    <option>Decor</option>
                                    <option>Entertainment</option>
                                    <option>Florist</option>
                                </select>
                            </label>

                            <label style={{ display: 'grid', gap: '0.35rem' }}>
                                City
                                <input
                                    type="text"
                                    value={vendorForm.city}
                                    onChange={e => setVendorForm(prev => ({ ...prev, city: e.target.value }))}
                                    required
                                    style={{ width: '100%', padding: '0.95rem 1rem', borderRadius: '12px', border: '1px solid #d1d5db', background: '#f8fafc' }}
                                />
                            </label>

                            <label style={{ display: 'grid', gap: '0.35rem' }}>
                                Rating
                                <input
                                    type="text"
                                    value={vendorForm.rating}
                                    onChange={e => setVendorForm(prev => ({ ...prev, rating: e.target.value }))}
                                    style={{ width: '100%', padding: '0.95rem 1rem', borderRadius: '12px', border: '1px solid #d1d5db', background: '#f8fafc' }}
                                />
                            </label>

                            <label style={{ display: 'grid', gap: '0.35rem' }}>
                                Description
                                <textarea
                                    value={vendorForm.description}
                                    onChange={e => setVendorForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={4}
                                    style={{ width: '100%', padding: '0.95rem 1rem', borderRadius: '12px', border: '1px solid #d1d5db', background: '#f8fafc', resize: 'vertical' }}
                                />
                            </label>

                            <label style={{ display: 'grid', gap: '0.35rem' }}>
                                Cover Image
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    {vendorForm.image && (
                                        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #269691', background: '#f0f0f0', height: '180px' }}>
                                            <img src={vendorForm.image} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button
                                                type="button"
                                                onClick={() => setVendorForm(prev => ({ ...prev, image: '' }))}
                                                style={{ position: 'absolute', top: '8px', right: '8px', background: '#ef4444', border: 'none', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                    <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '12px', border: '2px dashed #269691', cursor: 'pointer', background: '#e0f2f1', width: '100%', position: 'relative' }}>
                                        <input type="file" accept="image/*" onChange={handleCoverUploadChange} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                        <div style={{ pointerEvents: 'none', textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}></div>
                                            <span style={{ color: '#269691', fontWeight: 600, fontSize: '0.9rem' }}>
                                                {uploadingCover ? 'Uploading cover...' : 'Click or drag to upload cover image'}
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </label>

                            <label style={{ display: 'grid', gap: '0.35rem' }}>
                                Sample Work (Upload Images/Videos)
                                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.5rem', borderRadius: '12px', border: '2px dashed #269691', cursor: 'pointer', background: '#e0f2f1', width: '100%', position: 'relative' }}>
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        multiple
                                        onChange={handlePortfolioUploadChange}
                                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    />
                                    <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                                             <span style={{ color: '#269691', fontWeight: 600 }}>
                                            {uploadingPortfolio ? 'Uploading samples...' : 'Click or drag to upload images/videos'}
                                        </span>
                                    </div>
                                </div>
                            </label>

                            {vendorForm.portfolio?.length > 0 && (
                                <div style={{ display: 'grid', gap: '0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                                    <strong style={{ color: '#111', fontSize: '0.95rem' }}>Sample Work Preview</strong>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
                                        {vendorForm.portfolio.map((item, index) => (
                                            <div key={`${item.url}-${index}`} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #d1d5db', background: '#000', aspectRatio: '1' }}>
                                                {item.type === 'video' ? (
                                                    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <div style={{ position: 'absolute', fontSize: '1.5rem' }}></div>
                                                    </div>
                                                ) : (
                                                    <img src={item.url} alt={`Sample ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setVendorForm(prev => ({
                                                            ...prev,
                                                            portfolio: prev.portfolio.filter((_, idx) => idx !== index)
                                                        }));
                                                    }}
                                                    style={{
                                                        position: 'absolute', top: '4px', right: '4px',
                                                        background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff',
                                                        width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem'
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Total: {vendorForm.portfolio.length} item(s)</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowVendorModal(false)} style={{ padding: '0.95rem 1.2rem', borderRadius: '12px', border: '1px solid #d1d5db', background: '#f8fafc', color: '#374151', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button type="submit" style={{ padding: '0.95rem 1.2rem', borderRadius: '12px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                                    {editingVendor ? 'Update Vendor' : 'Create Vendor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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

                /* VENDOR MODAL / ACTION SHEET */
                .vm-overlay {
                    position: fixed; inset: 0;
                    background: rgba(0,0,0,.75); backdrop-filter: blur(10px);
                    z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 1.5rem;
                }
                .vm-box {
                    background: #fff; border-radius: 24px; max-width: 400px; width: 100%;
                    max-height: 80vh; overflow-y: auto; display: flex; flex-direction: column;
                    box-shadow: 0 30px 60px rgba(0,0,0,.45);
                }
                .vm-name { font-size:1.25rem; font-weight:800; color:#111; margin-bottom:.55rem; }
                .vm-desc { font-size:.86rem; color:#6b7280; line-height:1.55; }

                /* PHONE SHELL */
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

                /* SCROLL AREA */
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

                /* HERO */
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
                .hbtn-lbl { font-size:.68rem; font-weight:600; color:rgba(255,255,255,.42); letter-spacing:.02em; }
                .hbtn-lime .hbtn-icon {
                    background:#a3e635; color:#12121c; border-color:transparent;
                    box-shadow:0 6px 20px rgba(163,230,53,.4);
                }
                .hbtn-lime .hbtn-lbl { color:#a3e635; }
                .hbtn:hover .hbtn-icon { transform:translateY(-3px); }

                /* WHITE CONTENT PADDING */
                .content-pad {
                     <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📸 📹</div>
                                  background: #f4f5f7;
                    flex: 1;
                    padding: 1.2rem 1.2rem 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

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
                .search-clear {
                    border:none; background:#f3f4f6; color:#6b7280;
                    width:22px; height:22px; border-radius:50%; cursor:pointer;
                    display:flex; align-items:center; justify-content:center; font-size:.65rem; flex-shrink:0;
                }

                /* SECTION HEADER */
                .sec-hdr { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.5rem; }
                .sec-title { font-size:.92rem; font-weight:800; color:#111; letter-spacing:-.01em; }
                .sec-tabs { display:flex; gap:.28rem; background:#e4e6ed; padding:.22rem; border-radius:10px; }
                .sec-tab {
                    padding:.3rem .65rem; border:none; background:transparent; border-radius:7px;
                    font-size:.7rem; font-weight:600; color:#6b7280; cursor:pointer; font-family:inherit; transition:all .18s;
                }
                .sec-tab-on { background:#12121c; color:#a3e635; box-shadow:0 2px 6px rgba(0,0,0,.2); }
                .sec-tab:hover:not(.sec-tab-on) { background:rgba(255,255,255,.6); color:#374151; }

                /* LIST */
                .guest-list { display:flex; flex-direction:column; gap:.45rem; }
                .g-row {
                    background:#fff; border-radius:16px; padding:.8rem .95rem;
                    display:flex; align-items:center; gap:.8rem;
                    box-shadow:0 1px 5px rgba(0,0,0,.05); transition:transform .15s;
                }
                .g-row:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,.08); }
                .g-avatar {
                    width:44px; height:44px; border-radius:14px; flex-shrink:0;
                    display:flex; align-items:center; justify-content:center;
                    font-size:.78rem; font-weight:800; color:#fff; letter-spacing:.03em;
                }
                .g-info { flex:1; min-width:0; }
                .g-name { display:block; font-size:.86rem; font-weight:700; color:#111; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                .g-sub  { display:block; font-size:.7rem; color:#9ca3af; margin-top:.08rem; }
                .g-right { display:flex; flex-direction:column; align-items:flex-end; gap:.22rem; flex-shrink:0; }
                .g-count { font-size:.95rem; font-weight:900; letter-spacing:-.02em; }
                .gc-green { color:#15803d; }
                .gc-red   { color:#dc2626; }
                .g-pct { font-size:.67rem; font-weight:600; }
                .gp-green { color:#16a34a; }
                .gp-red   { color:#dc2626; }
                .ga-approve {
                    display:flex; align-items:center; gap:.28rem;
                    padding:.26rem .6rem; border:none; border-radius:8px;
                    background:#12121c; color:#a3e635; font-size:.68rem; font-weight:700;
                    cursor:pointer; font-family:inherit; transition:all .15s; white-space:nowrap;
                }
                .ga-approve:hover { filter:brightness(1.1); }

                /* BOTTOM NAV */
                .btm-nav {
                    display: flex; align-items: center; justify-content: space-around;
                    background: #fff; padding: .7rem 1rem 1.5rem;
                    border-top: 1px solid #f1f5f9; flex-shrink: 0; z-index: 10;
                }
                .bn-item {
                    display:flex; flex-direction:column; align-items:center; gap:.18rem;
                    border:none; background:none; cursor:pointer; color:#9ca3af;
                    font-size:.58rem; font-weight:600; font-family:inherit; padding:.3rem .5rem;
                }
                .bn-item i { font-size:1.12rem; }
                .bn-active { color:#12121c; }
                .bn-item:hover:not(.bn-center) { color:#374151; }
                .bn-center {
                    width:52px; height:52px; border-radius:50%; border:none;
                    background:#12121c; color:#a3e635; font-size:1.08rem;
                    cursor:pointer; display:flex; align-items:center; justify-content:center;
                    box-shadow:0 6px 20px rgba(0,0,0,.28); transition:all .2s;
                }
                .bn-center:hover { transform:scale(1.08); }

                /* FULL WIDTH ON SMALL PHONES */
                @media (max-width: 480px) {
                    .rr-page { padding: 0; align-items: stretch; }
                    .phone-shell { border-radius: 0; box-shadow: none; max-width: 100%; width: 100%; height: 100vh; max-height: 100vh; }
                }
            `}</style>
        </div>
    );

}

export default AdminDashboard;