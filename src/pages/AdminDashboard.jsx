import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { sendEmail } from '../utils/emailService';
import ReminderModal from '../components/ReminderModal';
import EmailMarketing from '../components/EmailMarketing';

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

    // Birthday states
    const [birthdays, setBirthdays] = useState([]);
    const [birthdayLoading, setBirthdayLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchWeddings();
        fetchBirthdays();
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

    // Removed auto-send effect - Supabase cron handles this now
    // useEffect(() => {
    //     if (dueReminders.length > 0 && !processingReminders) {
    //         sendDueReminders();
    //     }
    // }, [dueReminders, processingReminders]);

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

    const fetchWeddings = async () => {
        try {
            const { data: weddingsData, error: weddingsError } = await supabase
                .from('weddings')
                .select('*')
                .order('created_at', { ascending: false });

            if (weddingsError) throw weddingsError;

            // Fetch RSVP counts for all weddings
            const { data: rsvpsData, error: rsvpsError } = await supabase
                .from('rsvps')
                .select('wedding_id');

            if (rsvpsError) console.error("Error fetching RSVPs for counts:", rsvpsError);

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

            const { data: rsvps } = await supabase.from('birthday_rsvps').select('event_id');
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
        }

        const handleSuccess = () => {
            setCopiedLink(`${slug}-${type}`);
            setTimeout(() => setCopiedLink(null), 2000);
            alert(message);
        };

        const handleError = (err) => {
            console.error('Copy failed:', err);
            // prompt user to copy manually as last resort
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
            past: 'var(--gray)'
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

    return (
        <div className="admin-dashboard">
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
                            <button className="mobile-nav-item" onClick={() => { handleLogout(); setShowMobileMenu(false); }}>
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
                {dueReminders.length > 0 && (
                    <div className="alert-banner">
                        <div className="alert-content">
                            <i className="fas fa-bell"></i>
                            <span>{dueReminders.length} weddings have reminders due today or pending.</span>
                        </div>
                        <button
                            className="alert-btn"
                            onClick={sendDueReminders}
                            disabled={processingReminders}
                        >
                            {processingReminders ? 'Sending...' : 'Send Reminders Now'}
                        </button>
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
                        className={`tab-btn ${activeTab === 'marketing' ? 'active' : ''}`}
                        onClick={() => setActiveTab('marketing')}
                    >
                        <i className="fas fa-envelope"></i>
                        Email Marketing
                    </button>
                </div>
            </section>

            {/* Weddings Tab Content */}
            {activeTab === 'weddings' && (
                <>
                    <div className="stats-container">
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
                                        <span className="results-count">{filteredWeddings.length}</span>
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
                            ) : filteredWeddings.length === 0 ? (
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
                                <div className="weddings-grid">
                                    {filteredWeddings.map((wedding) => (
                                        <div key={wedding.id} className="wedding-card">
                                            <div className="card-gradient"></div>

                                            <div className="card-header">
                                                <div className="wedding-info">
                                                    <div className="couple-names">
                                                        <h3 className="groom-name">{wedding.groom_name}</h3>
                                                        <div className="and-symbol">
                                                            <i className="fas fa-heart"></i>
                                                        </div>
                                                        <h3 className="bride-name">{wedding.bride_name}</h3>
                                                    </div>
                                                    <div className="wedding-meta">
                                                        <span className="wedding-date">
                                                            <i className="far fa-calendar"></i>
                                                            {formatDate(wedding.date)}
                                                        </span>
                                                        <StatusBadge date={wedding.date} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="card-body">
                                                <div className="venue-info">
                                                    <i className="fas fa-map-marker-alt"></i>
                                                    <span>{wedding.venue_name || 'Venue to be announced'}</span>
                                                </div>

                                                <div className="stats-row">
                                                    <div className="stat-item">
                                                        <div className="stat-icon-small">
                                                            <i className="fas fa-users"></i>
                                                        </div>
                                                        <div className="stat-details">
                                                            <span className="stat-value">{wedding.rsvp_count || 0}</span>
                                                            <span className="stat-label">RSVPs</span>
                                                        </div>
                                                    </div>
                                                    <div className="stat-item">
                                                        <div className="stat-icon-small">
                                                            <i className="fas fa-eye"></i>
                                                        </div>
                                                        <div className="stat-details">
                                                            <span className="stat-value">{wedding.views?.toLocaleString() || 0}</span>
                                                            <span className="stat-label">Views</span>
                                                        </div>
                                                    </div>
                                                    <div className="stat-item">
                                                        <div className="stat-icon-small">
                                                            <i className="fas fa-link"></i>
                                                        </div>
                                                        <div className="stat-details">
                                                            <span className="stat-value">/{wedding.slug}</span>
                                                            <span className="stat-label">URL</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="quick-actions">
                                                    <a
                                                        href={`/w/${wedding.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="action-btn view"
                                                        style={{ textDecoration: 'none' }}
                                                    >
                                                        <i className="fas fa-external-link-alt"></i>
                                                        View Site
                                                    </a>
                                                    <button
                                                        className={`action-btn preview ${copiedLink === `${wedding.slug}-preview` ? 'copied' : ''}`}
                                                        onClick={() => copyLink(wedding.slug, 'preview')}
                                                    >
                                                        <i className="fab fa-whatsapp"></i>
                                                        {copiedLink === `${wedding.slug}-preview` ? 'Copied!' : 'Preview'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="card-footer">
                                                <div className="footer-actions">
                                                    <div className="download-group" style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            className="footer-btn download"
                                                            onClick={() => downloadRSVPs(wedding.id, `${wedding.groom_name}_${wedding.bride_name}`)}
                                                        >
                                                            <i className="fas fa-file-excel"></i>
                                                            Download Excel
                                                        </button>
                                                        <Link
                                                            to={`/report/${wedding.slug}`}
                                                            className="footer-btn download"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="View RSVP Report"
                                                        >
                                                            <i className="fas fa-chart-bar"></i>
                                                            View Report
                                                        </Link>
                                                    </div>

                                                    <div className="action-group">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedWeddingForReminder(wedding);
                                                                setShowReminderModal(true);
                                                            }}
                                                            className="footer-btn edit"
                                                            title="Reminders"
                                                            style={{ color: '#6366f1' }}
                                                        >
                                                            <i className="fas fa-bell"></i>
                                                        </button>
                                                        <Link
                                                            to={`/editWedding/${wedding.id}`}
                                                            className="footer-btn edit"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(wedding.id, `${wedding.groom_name} & ${wedding.bride_name}`)}
                                                            className="footer-btn delete"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
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
                                <Link to="/addBirthday" className="nav-btn primary" style={{ textDecoration: 'none', background: 'linear-gradient(135deg,#ff6b9d,#c44569)', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, color: '#1a1a1a', fontWeight: 700, fontSize: '0.85rem' }}>
                                    <i className="fas fa-plus" />
                                    New Birthday
                                </Link>
                            </div>
                        </div>

                        {birthdayLoading ? (
                            <div className="loading-container">
                                <div className="loading-spinner"><div className="spinner-ring" /><div className="spinner-ring" /><div className="spinner-ring" /><div className="spinner-ring" /></div>
                                <p className="loading-text">Loading birthday events…</p>
                            </div>
                        ) : birthdays.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon"><i className="fas fa-birthday-cake" /></div>
                                <h3 className="empty-title">No birthday events yet</h3>
                                <p className="empty-description">Create your first birthday invitation website</p>
                                <Link to="/addBirthday" className="empty-action" style={{ textDecoration: 'none' }}>
                                    <i className="fas fa-plus" /> Create First Birthday
                                </Link>
                            </div>
                        ) : (
                            <div className="weddings-grid">
                                {birthdays.map((bdEvent) => (
                                    <div key={bdEvent.id} className="wedding-card" style={{ '--card-accent': '#c44569' }}>
                                        <div className="card-gradient" style={{ background: 'linear-gradient(135deg,#ff6b9d22,#c4456911)' }} />

                                        <div className="card-header">
                                            <div className="wedding-info">
                                                <div className="couple-names">
                                                    <h3 className="groom-name" style={{ color: '#c44569' }}>
                                                        <i className="fas fa-birthday-cake" style={{ marginRight: 6, fontSize: '0.9rem' }} />
                                                        {bdEvent.child_name}'s Birthday
                                                    </h3>
                                                </div>
                                                <div className="wedding-meta">
                                                    <span className="wedding-date">
                                                        <i className="far fa-calendar" />
                                                        {bdEvent.date ? new Date(bdEvent.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Date TBD'}
                                                    </span>
                                                    {bdEvent.age && <span className="status-badge" style={{ backgroundColor: '#c44569' }}>Age {bdEvent.age}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-body">
                                            <div className="venue-info">
                                                <i className="fas fa-map-marker-alt" />
                                                <span>{bdEvent.venue_name || 'Venue TBD'}</span>
                                            </div>

                                            <div className="stats-row">
                                                <div className="stat-item">
                                                    <div className="stat-icon-small"><i className="fas fa-users" /></div>
                                                    <div className="stat-details">
                                                        <span className="stat-value">{bdEvent.rsvp_count || 0}</span>
                                                        <span className="stat-label">RSVPs</span>
                                                    </div>
                                                </div>
                                                <div className="stat-item">
                                                    <div className="stat-icon-small"><i className="fas fa-link" /></div>
                                                    <div className="stat-details">
                                                        <span className="stat-value" style={{ fontSize: '0.75rem' }}>/{bdEvent.slug}</span>
                                                        <span className="stat-label">URL</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="quick-actions">
                                                <a
                                                    href={`/b/${bdEvent.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="action-btn view"
                                                    style={{ textDecoration: 'none' }}
                                                >
                                                    <i className="fas fa-external-link-alt" /> View Site
                                                </a>
                                                <button
                                                    className={`action-btn preview ${copiedLink === `${bdEvent.slug}-preview-bd` ? 'copied' : ''}`}
                                                    onClick={() => copyLink(bdEvent.slug, 'preview-bd')}
                                                >
                                                    <i className="fab fa-whatsapp"></i>
                                                    {copiedLink === `${bdEvent.slug}-preview-bd` ? 'Copied!' : 'Preview'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="card-footer">
                                            <div className="footer-actions">
                                                <div className="download-group" style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="footer-btn download"
                                                        onClick={() => downloadBirthdayRSVPs(bdEvent.id, bdEvent.child_name)}
                                                    >
                                                        <i className="fas fa-file-excel" /> Download RSVPs
                                                    </button>
                                                    <Link
                                                        to={`/b-report/${bdEvent.slug}`}
                                                        className="footer-btn download"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="View RSVP Report"
                                                    >
                                                        <i className="fas fa-chart-bar"></i> View Report
                                                    </Link>
                                                </div>
                                                <div className="action-group">
                                                    <Link
                                                        to={`/editBirthday/${bdEvent.id}`}
                                                        className="footer-btn edit"
                                                    >
                                                        <i className="fas fa-edit" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteBirthday(bdEvent.id, `${bdEvent.child_name}'s Birthday`)}
                                                        className="footer-btn delete"
                                                    >
                                                        <i className="fas fa-trash" />
                                                    </button>
                                                </div>
                                            </div>
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

            <style jsx>{`
                :root {
                    --primary: #6366f1;
                    --primary-light: #818cf8;
                    --primary-dark: #4f46e5;
                    --secondary: #f472b6;
                    --accent: #f59e0b;
                    --success: #10b981;
                    --warning: #f59e0b;
                    --danger: #ef4444;
                    --dark: #1f2937;
                    --darker: #111827;
                    --light: #f9fafb;
                    --lighter: #f3f4f6;
                    --gray: #6b7280;
                    --gray-light: #9ca3af;
                    --white: #ffffff;
                    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
                    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
                    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
                    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
                    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
                    --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.15);
                    --radius-sm: 0.5rem;
                    --radius-md: 0.75rem;
                    --radius-lg: 1rem;
                    --radius-xl: 1.25rem;
                    --radius-2xl: 1.5rem;
                    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
                    --transition: 250ms cubic-bezier(0.4, 0, 0.2, 1);
                    --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
                }

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Segoe UI', sans-serif;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    color: var(--dark);
                    overflow-x: hidden;
                }

                .admin-dashboard {
                    min-height: 100vh;
                    position: relative;
                }

                /* Header Styles */
                .admin-header {
                    background: linear-gradient(135deg, var(--darker) 0%, var(--dark) 100%);
                    color: var(--white);
                    padding: 0.75rem 0;
                    box-shadow: var(--shadow-xl);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                    background: rgba(31, 41, 55, 0.98);
                    border: none;
                    border-radius: 0;
                }
                
                .alert-banner {
                    background-color: #fef2f2;
                    border-bottom: 1px solid #fee2e2;
                    color: #991b1b;
                    padding: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    border-radius: var(--radius-md);
                    margin: 1rem auto;
                    max-width: 1440px;
                    width: 95%;
                }
                
                .alert-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-weight: 500;
                }
                
                .alert-btn {
                    background-color: #ef4444;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                
                .alert-btn:hover {
                    background-color: #dc2626;
                }
                
                .alert-btn:disabled {
                    background-color: #fca5a5;
                    cursor: not-allowed;
                }

                /* Tab Navigation */
                .tab-navigation {
                    display: flex;
                    gap: 1rem;
                    max-width: 1440px;
                    margin: 1.5rem auto 2rem;
                    padding: 0 1.5rem;
                    border-bottom: 2px solid #e5e7eb;
                }

                .tab-btn {
                    padding: 1rem 2rem;
                    background: transparent;
                    border: none;
                    border-bottom: 3px solid transparent;
                    color: #6b7280;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: -2px;
                }

                .tab-btn:hover {
                    color: #6366f1;
                    background: rgba(99, 102, 241, 0.05);
                }

                .tab-btn.active {
                    color: #6366f1;
                    border-bottom-color: #6366f1;
                }

                .tab-btn i {
                    font-size: 18px;
                }

                @media (max-width: 768px) {
                    .tab-navigation {
                        padding: 0 1rem;
                    }

                    .tab-btn {
                        padding: 0.75rem 1rem;
                        font-size: 14px;
                    }

                    .tab-btn i {
                        font-size: 16px;
                    }
                }

                .header-container {
                    max-width: 1440px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                }

                .header-main {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .brand {
                    display: flex;
                    align-items: center;
                    order: 1; /* Left */
                    margin-right: 2rem;
                }
                
                .logo-img {
                    height: 48px;
                    width: auto;
                    object-fit: contain;
                }
                
                .user-profile-section {
                    order: 3; /* Right on Desktop */
                    display: flex;
                    align-items: center;
                    margin-left: 1rem;
                    margin-right: 0;
                }

                .user-icon-circle {
                    width: 44px;
                    height: 44px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--white);
                    font-size: 1.25rem;
                    cursor: pointer;
                    transition: var(--transition);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
                }

                .user-icon-circle:hover {
                    background: var(--primary);
                    color: var(--white);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
                    border-color: transparent;
                }

                /* Desktop Navigation */
                .desktop-nav {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    flex: 1;
                    justify-content: center;
                    margin: 0 1rem;
                    order: 2;
                }

                @media (max-width: 1024px) {
                    .desktop-nav {
                        display: none;
                    }
                }

                .search-container {
                    flex: 1;
                    position: relative;
                    max-width: 400px;
                }

                .search-icon {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--gray-light);
                    font-size: 0.875rem;
                }

                .search-input {
                    width: 100%;
                    padding: 0.75rem 1rem 0.75rem 3rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: var(--radius-lg);
                    color: var(--white);
                    font-size: 0.875rem;
                    transition: var(--transition);
                }

                .search-input::placeholder {
                    color: rgba(255, 255, 255, 0.5);
                }

                .search-input:focus {
                    outline: none;
                    background: rgba(255, 255, 255, 0.15);
                    border-color: var(--primary-light);
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
                }

                .clear-search {
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: var(--gray-light);
                    cursor: pointer;
                    padding: 0.25rem;
                    font-size: 0.75rem;
                }

                .nav-actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .nav-btn {
                    padding: 0.625rem 1.25rem;
                    border-radius: var(--radius-lg);
                    font-size: 0.875rem;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: var(--transition);
                    border: none;
                    text-decoration: none;
                }

                .nav-btn.primary {
                    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                    color: var(--white);
                    box-shadow: var(--shadow-md);
                }

                .nav-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-lg);
                }

                .nav-btn.outline {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: var(--white);
                }

                .nav-btn.outline:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.5);
                }

                .mobile-menu-btn {
                    order: 4;
                    display: none;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: var(--radius-md);
                    width: 40px;
                    height: 40px;
                    color: var(--white);
                    cursor: pointer;
                    transition: var(--transition);
                }

                .mobile-menu-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                @media (max-width: 1024px) {
                    .mobile-menu-btn {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .user-profile-section {
                        display: none;
                    }
                }

                /* Mobile Menu */
                .mobile-menu-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(4px);
                    z-index: 2000;
                    display: flex;
                    align-items: flex-start;
                    justify-content: flex-end;
                    padding: 1rem;
                }

                .mobile-menu {
                    background: var(--white);
                    border-radius: var(--radius-xl);
                    width: 320px;
                    max-width: 90vw;
                    box-shadow: var(--shadow-2xl);
                    animation: slideIn 0.3s ease-out;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                .mobile-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--lighter);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .mobile-header h3 {
                    color: var(--dark);
                    font-size: 1.25rem;
                    font-weight: 600;
                }

                .close-menu {
                    background: none;
                    border: none;
                    color: var(--gray);
                    cursor: pointer;
                    font-size: 1.25rem;
                    padding: 0.25rem;
                }

                .mobile-nav {
                    padding: 1rem;
                }

                .mobile-nav-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    width: 100%;
                    background: none;
                    border: none;
                    color: var(--dark);
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: var(--transition);
                    border-radius: var(--radius-md);
                    text-decoration: none;
                }

                .mobile-nav-item:hover {
                    background: var(--lighter);
                }

                .mobile-nav-item i {
                    color: var(--primary);
                    width: 20px;
                }

                /* Stats Section */
                .stats-section {
                    padding: 2rem 1.5rem;
                    max-width: 1440px;
                    margin: 0 auto;
                }

                .stats-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                }

                .stat-card {
                    background: var(--white);
                    border-radius: var(--radius-xl);
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    box-shadow: var(--shadow-lg);
                    transition: var(--transition);
                    border: 1px solid rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(10px);
                }

                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-xl);
                }

                .stat-card.highlight {
                    background: linear-gradient(135deg, var(--primary-light), var(--primary));
                    color: var(--white);
                }

                .stat-card.highlight .stat-label {
                    color: rgba(255, 255, 255, 0.9);
                }

                .stat-icon-wrapper {
                    width: 60px;
                    height: 60px;
                    border-radius: var(--radius-lg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    color: var(--white);
                    flex-shrink: 0;
                }

                .gradient-1 {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }

                .gradient-2 {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                }

                .gradient-3 {
                    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                }

                .gradient-4 {
                    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                }

                .stat-content {
                    flex: 1;
                }

                .stat-number {
                    font-size: 2rem;
                    font-weight: 700;
                    line-height: 1;
                    margin-bottom: 0.25rem;
                    color: var(--dark);
                }

                .stat-card.highlight .stat-number {
                    color: var(--white);
                }

                .stat-label {
                    font-size: 0.875rem;
                    color: var(--gray);
                    font-weight: 500;
                }

                /* Main Content */
                .main-content {
                    padding: 0 1.5rem 3rem;
                    max-width: 1440px;
                    margin: 0 auto;
                }

                .content-container {
                    background: var(--white);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-lg);
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.8);
                }

                .content-header {
                    padding: 2rem 2rem 1.5rem;
                    border-bottom: 1px solid var(--lighter);
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                }

                .header-left {
                    flex: 1;
                    min-width: 300px;
                }

                .section-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--dark);
                    margin-bottom: 0.5rem;
                }

                .section-subtitle {
                    color: var(--gray);
                    font-size: 0.875rem;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .results-info {
                    display: flex;
                    align-items: baseline;
                    gap: 0.5rem;
                }

                .results-count {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--primary);
                }

                .results-text {
                    color: var(--gray);
                    font-size: 0.875rem;
                }

                .sort-select {
                    padding: 0.625rem 1rem 0.625rem 2.5rem;
                    border: 1px solid var(--lighter);
                    border-radius: var(--radius-lg);
                    background: var(--lighter);
                    color: var(--dark);
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: left 0.75rem center;
                    background-size: 1rem;
                    padding-left: 2.5rem;
                    appearance: none;
                }

                .sort-select:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }

                /* Loading State */
                .loading-container {
                    padding: 4rem 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1.5rem;
                }

                .loading-spinner {
                    position: relative;
                    width: 60px;
                    height: 60px;
                }

                .spinner-ring {
                    display: block;
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 4px solid transparent;
                    animation: spinner 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
                }

                .spinner-ring:nth-child(1) {
                    border-top-color: var(--primary);
                    animation-delay: -0.45s;
                }

                .spinner-ring:nth-child(2) {
                    border-right-color: var(--primary);
                    animation-delay: -0.3s;
                }

                .spinner-ring:nth-child(3) {
                    border-bottom-color: var(--primary);
                    animation-delay: -0.15s;
                }

                .spinner-ring:nth-child(4) {
                    border-left-color: var(--primary);
                }

                @keyframes spinner {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .loading-text {
                    color: var(--gray);
                    font-size: 0.875rem;
                }

                /* Empty State */
                .empty-state {
                    padding: 4rem 2rem;
                    text-align: center;
                }

                .empty-icon {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, var(--lighter), var(--light));
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    color: var(--primary);
                    font-size: 2rem;
                }

                .empty-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--dark);
                    margin-bottom: 0.5rem;
                }

                .empty-description {
                    color: var(--gray);
                    margin-bottom: 2rem;
                    max-width: 400px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .empty-action {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                    color: var(--white);
                    border-radius: var(--radius-lg);
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 0.875rem;
                    transition: var(--transition);
                    box-shadow: var(--shadow-md);
                }

                .empty-action:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-lg);
                }

                /* Weddings Grid */
                .weddings-grid {
                    padding: 2rem;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
                    gap: 1.5rem;
                }

                @media (max-width: 1024px) {
                    .weddings-grid {
                        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                        padding: 1.5rem;
                    }
                }

                @media (max-width: 768px) {
                    .weddings-grid {
                        grid-template-columns: 1fr;
                        padding: 1rem;
                    }
                }

                /* Wedding Card */
                .wedding-card {
                    background: var(--white);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    box-shadow: var(--shadow-md);
                    transition: var(--transition);
                    position: relative;
                    border: 1px solid var(--lighter);
                    animation: fadeIn 0.5s ease-out;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .wedding-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-xl);
                    border-color: var(--primary-light);
                }

                .card-gradient {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, var(--primary), var(--secondary));
                }

                .card-header {
                    padding: 1.5rem 1.5rem 1rem;
                    border-bottom: 1px solid var(--lighter);
                }

                .wedding-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .couple-names {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                .groom-name, .bride-name {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--dark);
                }

                .and-symbol {
                    color: var(--primary);
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                }

                .wedding-meta {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .wedding-date {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--gray);
                    font-size: 0.875rem;
                }

                .status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--white);
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }

                /* Card Body */
                .card-body {
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .venue-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: var(--gray);
                    font-size: 0.875rem;
                    padding: 0.75rem;
                    background: var(--lighter);
                    border-radius: var(--radius-md);
                }

                .venue-info i {
                    color: var(--primary);
                }

                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                }

                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    background: var(--lighter);
                    border-radius: var(--radius-md);
                }

                .stat-icon-small {
                    width: 32px;
                    height: 32px;
                    background: var(--white);
                    border-radius: var(--radius-sm);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary);
                    font-size: 0.875rem;
                }

                .stat-details {
                    display: flex;
                    flex-direction: column;
                }

                .stat-value {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--dark);
                    line-height: 1;
                }

                .stat-label {
                    font-size: 0.75rem;
                    color: var(--gray);
                    margin-top: 0.125rem;
                }

                .quick-actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .action-btn {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    border: none;
                    border-radius: var(--radius-md);
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: var(--transition);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .action-btn.view {
                    background: var(--primary);
                    color: var(--white);
                }

                .action-btn.view:hover {
                    background: var(--primary-dark);
                }

                .action-btn.preview {
                    background: #25D366;
                    color: var(--white);
                }

                .action-btn.preview:hover {
                    background: #128C7E;
                }

                .action-btn.copied {
                    background: var(--success);
                    color: var(--white);
                }

                /* Card Footer */
                .card-footer {
                    padding: 1.25rem 1.5rem;
                    border-top: 1px solid var(--lighter);
                    background: var(--lighter);
                }

                .footer-actions {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                }

                @media (max-width: 480px) {
                    .footer-actions {
                        flex-direction: column;
                    }
                }

                .footer-btn {
                    padding: 0.625rem 1rem;
                    border: none;
                    border-radius: var(--radius-md);
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: var(--transition);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    text-decoration: none;
                }

                .footer-btn.download {
                    background: var(--white);
                    color: var(--dark);
                    border: 1px solid var(--lighter);
                }

                .footer-btn.download:hover {
                    background: var(--lighter);
                    transform: translateY(-2px);
                }

                .action-group {
                    display: flex;
                    gap: 0.5rem;
                }

                .footer-btn.edit, .footer-btn.delete {
                    width: 40px;
                    height: 40px;
                    padding: 0;
                    border-radius: 50%;
                }

                .footer-btn.edit {
                    background: var(--success);
                    color: var(--white);
                }

                .footer-btn.edit:hover {
                    background: #0da271;
                    transform: translateY(-2px);
                }

                .footer-btn.delete {
                    background: var(--danger);
                    color: var(--white);
                }

                .footer-btn.delete:hover {
                    background: #dc2626;
                    transform: translateY(-2px);
                }

                /* Floating Action Button */
                .fab {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--white);
                    font-size: 1.25rem;
                    box-shadow: var(--shadow-xl);
                    cursor: pointer;
                    transition: var(--transition);
                    z-index: 100;
                    text-decoration: none;
                }

                .fab:hover {
                    transform: scale(1.1) rotate(90deg);
                    box-shadow: var(--shadow-2xl);
                }

                @media (min-width: 1025px) {
                    .fab {
                        display: none;
                    }
                }

                /* Mobile Optimizations */
                @media (max-width: 640px) {
                    .header-container,
                    .stats-section,
                    .main-content {
                        padding-left: 1rem;
                        padding-right: 1rem;
                    }

                    .content-header {
                        flex-direction: column;
                        gap: 1rem;
                        padding: 1.5rem 1rem;
                    }

                    .header-left, .header-right {
                        width: 100%;
                    }

                    .section-title {
                        font-size: 1.5rem;
                    }

                    .results-info {
                        justify-content: space-between;
                        width: 100%;
                    }

                    .sort-select {
                        width: 100%;
                    }

                    .stats-container {
                        grid-template-columns: 1fr;
                    }

                    .stat-card {
                        padding: 1.25rem;
                    }

                    .weddings-grid {
                        padding: 1rem;
                        gap: 1rem;
                    }

                    .card-body {
                        padding: 1rem;
                    }

                    .stats-row {
                        grid-template-columns: 1fr;
                    }

                    .quick-actions {
                        flex-direction: column;
                    }

                    .fab {
                        bottom: 1.5rem;
                        right: 1.5rem;
                    }
                }

                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    body {
                        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    }

                    .content-container,
                    .wedding-card,
                    .stat-card {
                        background: #2d3748;
                        border-color: #4a5568;
                    }

                    .groom-name, .bride-name,
                    .stat-number,
                    .stat-value,
                    .section-title {
                        color: #e2e8f0;
                    }

                    .section-subtitle,
                    .stat-label,
                    .wedding-date,
                    .venue-info,
                    .empty-description {
                        color: #a0aec0;
                    }

                    .lighter {
                        background: #4a5568;
                    }

                    .venue-info,
                    .stat-item {
                        background: #4a5568;
                        color: #e2e8f0;
                    }

                    .card-footer {
                        background: #4a5568;
                    }

                    .footer-btn.download {
                        background: #4a5568;
                        color: #e2e8f0;
                        border-color: #718096;
                    }

                    .footer-btn.download:hover {
                        background: #5a6b82;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;