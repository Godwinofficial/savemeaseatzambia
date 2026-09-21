import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import corporateImg from '/src/assets/images/Business Meeting Invitation.png';
import logoImg from '/src/assets/images/logo1.png';
import avatar1 from '/src/assets/images/avatars/avatar1.png';
import avatar2 from '/src/assets/images/avatars/avatar2.png';
import avatar3 from '/src/assets/images/avatars/avatar3.png';

const CorporateSummit = () => {
    const [timeLeft, setTimeLeft] = useState({ days: 24, hours: 8, minutes: 35, seconds: 12 });
    const [activeTab, setActiveTab] = useState('keynote');
    const [passType, setPassType] = useState('executive');
    const [attendeeForm, setAttendeeForm] = useState({
        full_name: '',
        company: '',
        job_title: '',
        email: '',
        phone: '',
        dietary: 'None',
        confirmed: false
    });
    const [registeredTicket, setRegisteredTicket] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const ticketRef = useRef(null);

    // Live countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
                if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleRegister = (e) => {
        e.preventDefault();
        if (!attendeeForm.full_name || !attendeeForm.email) return;

        const ticketNumber = `ZTS-${Math.floor(100000 + Math.random() * 900000)}`;
        setRegisteredTicket({
            ...attendeeForm,
            ticketNumber,
            passType,
            date: 'Thursday, October 15, 2026',
            venue: 'Mulungushi Conference Centre, Lusaka'
        });
    };

    const downloadPass = async () => {
        if (!ticketRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(ticketRef.current, {
                backgroundColor: '#090d16',
                scale: 2,
                useCORS: true
            });
            const link = document.createElement('a');
            link.download = `Pass_${attendeeForm.full_name.replace(/\s+/g, '_')}_ZTS2026.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Download error:', err);
        } finally {
            setDownloading(false);
        }
    };

    const speakers = [
        {
            name: "Dr. Mutale Mwansa",
            title: "Executive Director",
            org: "National Tech & Innovation Commission",
            avatar: avatar1,
            topic: "Keynote: Digital Transformation in Southern Africa"
        },
        {
            name: "Kondwani Banda",
            title: "Head of FinTech Infrastructure",
            org: "Zambia Financial Switch",
            avatar: avatar2,
            topic: "Scaling Real-time Micro-settlements & Digital Rail"
        },
        {
            name: "Natasha Chisanga",
            title: "Chief Investment Officer",
            org: "Savannah Horizon Ventures",
            avatar: avatar3,
            topic: "Venture Capital & Enterprise Scaling in SADC"
        }
    ];

    const agenda = [
        { time: "08:30 - 09:30", title: "Registration, Executive Networking & Welcome Coffee", track: "Main Foyer" },
        { time: "09:30 - 10:45", title: "Opening Presidential Keynote & Tech Sovereign Blueprint", track: "Grand Auditorium" },
        { time: "11:00 - 12:30", title: "FinTech & Banking Rails Panel: Interoperability 2030", track: "Hall Alpha" },
        { time: "12:30 - 14:00", title: "Executive Luncheon & Strategic Bilateral Matchmaking", track: "Dining Pavilion" },
        { time: "14:00 - 15:45", title: "SADC Startup Showcase: 8 High-Growth Enterprise Pitches", track: "Innovation Stage" },
        { time: "16:00 - 17:30", title: "Annual Leadership Banquet & Awards Gala Dinner", track: "Grand Ballroom" }
    ];

    return (
        <div style={{ background: '#090d16', color: '#f1f5f9', minHeight: '100vh', fontFamily: '"Inter", sans-serif' }}>

            {/* Top Navigation Bar */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: 'rgba(9, 13, 22, 0.92)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '14px 24px'
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                            <img src={logoImg} alt="SaveMeASeat" style={{ height: 32 }} />
                        </Link>
                        <span style={{ height: 18, width: 1, background: 'rgba(255,255,255,0.2)' }}></span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', color: '#0066ff' }}>
                            CORPORATE SUMMIT PORTAL
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Link
                            to="/templates"
                            style={{
                                color: '#94a3b8',
                                textDecoration: 'none',
                                fontSize: '0.85rem',
                                fontWeight: 600
                            }}
                        >
                            <i className="fas fa-arrow-left" style={{ marginRight: 6 }}></i> Gallery
                        </Link>
                        <a
                            href="#register"
                            style={{
                                background: 'linear-gradient(135deg, #0066ff 0%, #0044cc 100%)',
                                color: '#fff',
                                textDecoration: 'none',
                                padding: '8px 18px',
                                borderRadius: 8,
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                boxShadow: '0 4px 14px rgba(0, 102, 255, 0.3)'
                            }}
                        >
                            Lock Seats Now
                        </a>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section style={{
                position: 'relative',
                padding: '90px 24px 70px 24px',
                background: 'radial-gradient(ellipse at 50% 10%, rgba(0, 102, 255, 0.18), transparent 70%)',
                textAlign: 'center',
                overflow: 'hidden'
            }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'rgba(0, 102, 255, 0.12)',
                        border: '1px solid rgba(0, 102, 255, 0.3)',
                        borderRadius: 50,
                        padding: '6px 16px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#60a5fa',
                        marginBottom: 20
                    }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }}></span>
                        OFFICIAL ANNUAL LEADERSHIP BANQUET & TECH EXPO
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2.4rem, 5vw, 4rem)',
                        fontWeight: 900,
                        letterSpacing: '-1px',
                        lineHeight: 1.15,
                        marginBottom: 20,
                        background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Zambia Tech Summit 2026
                    </h1>

                    <p style={{
                        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                        color: '#94a3b8',
                        maxWidth: 720,
                        margin: '0 auto 36px auto',
                        lineHeight: 1.6
                    }}>
                        Convening 500+ enterprise leaders, financial regulators, tech founders, and policy architects to engineer scalable digital economic infrastructure for Zambia.
                    </p>

                    {/* Key Metrics / Pills */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 16,
                        flexWrap: 'wrap',
                        marginBottom: 40
                    }}>
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <i className="far fa-calendar-alt" style={{ color: '#0066ff', fontSize: '1.2rem' }}></i>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Date</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>October 15, 2026</div>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <i className="fas fa-map-marker-alt" style={{ color: '#0066ff', fontSize: '1.2rem' }}></i>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Venue</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Mulungushi Conference Centre</div>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <i className="fas fa-shield-alt" style={{ color: '#0066ff', fontSize: '1.2rem' }}></i>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Access Gate</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Verified QR Seat Lock</div>
                            </div>
                        </div>
                    </div>

                    {/* Countdown Box */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 20,
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(0, 102, 255, 0.25)',
                        borderRadius: 16,
                        padding: '16px 28px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0066ff' }}>{timeLeft.days}</div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Days</div>
                        </div>
                        <span style={{ fontSize: '1.4rem', color: '#334155' }}>:</span>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0066ff' }}>{String(timeLeft.hours).padStart(2, '0')}</div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Hours</div>
                        </div>
                        <span style={{ fontSize: '1.4rem', color: '#334155' }}>:</span>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0066ff' }}>{String(timeLeft.minutes).padStart(2, '0')}</div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Mins</div>
                        </div>
                        <span style={{ fontSize: '1.4rem', color: '#334155' }}>:</span>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0066ff' }}>{String(timeLeft.seconds).padStart(2, '0')}</div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Secs</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Keynote Speakers Section */}
            <section style={{ maxWidth: 1100, margin: '40px auto', padding: '0 24px' }}>
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <span style={{ color: '#0066ff', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Distinguished Faculty</span>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: 6 }}>Keynote Speakers & Panelists</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                    {speakers.map((s, idx) => (
                        <div key={idx} style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.07)',
                            borderRadius: 16,
                            padding: 24,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            transition: 'all 0.2s ease'
                        }}>
                            <img src={s.avatar} alt={s.name} style={{ width: 84, height: 84, borderRadius: '50%', marginBottom: 16, border: '2px solid #0066ff', objectFit: 'cover' }} />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0' }}>{s.name}</h3>
                            <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>{s.title}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 12 }}>{s.org}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, width: '100%' }}>
                                "{s.topic}"
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Agenda Schedule */}
            <section style={{ maxWidth: 900, margin: '60px auto', padding: '0 24px' }}>
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <span style={{ color: '#0066ff', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Conference Program</span>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: 6 }}>Executive Agenda & Timeline</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {agenda.map((item, idx) => (
                        <div key={idx} style={{
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: 12,
                            padding: '18px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 12
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <span style={{
                                    background: 'rgba(0, 102, 255, 0.15)',
                                    color: '#60a5fa',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    padding: '6px 12px',
                                    borderRadius: 6
                                }}>
                                    {item.time}
                                </span>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{item.title}</div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: 4 }}>
                                {item.track}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Registration / Seat Lock Section */}
            <section id="register" style={{
                maxWidth: 900,
                margin: '70px auto 90px auto',
                padding: '40px 24px',
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(9, 13, 22, 0.9) 100%)',
                border: '1px solid rgba(0, 102, 255, 0.3)',
                borderRadius: 24,
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <span style={{ color: '#0066ff', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Direct Portal Reservation</span>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: 6 }}>Register & Lock Seat</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 600, margin: '8px auto 0 auto' }}>
                        Choose your pass archetype and complete your executive registration below. Instant verified digital credentials will be generated for gate verification.
                    </p>
                </div>

                {/* Pass Selection Pills */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
                    {[
                        { id: 'executive', name: 'Executive Delegate', badge: 'Full Day Summit + Luncheon', price: 'ZMW 1,500' },
                        { id: 'vip', name: 'VIP Banquet Pass', badge: 'All Tracks + Gala Banquet Dinner', price: 'ZMW 2,800' },
                        { id: 'table', name: 'Corporate Table (8 Seats)', badge: 'Reserved Table + Brand Mention', price: 'ZMW 10,000' }
                    ].map(p => (
                        <div
                            key={p.id}
                            onClick={() => setPassType(p.id)}
                            style={{
                                border: passType === p.id ? '2px solid #0066ff' : '1px solid rgba(255,255,255,0.08)',
                                background: passType === p.id ? 'rgba(0, 102, 255, 0.12)' : 'rgba(255,255,255,0.02)',
                                borderRadius: 12,
                                padding: '16px 20px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{p.name}</div>
                                {passType === p.id && <i className="fas fa-check-circle" style={{ color: '#0066ff' }}></i>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 8 }}>{p.badge}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#38bdf8' }}>{p.price}</div>
                        </div>
                    ))}
                </div>

                {!registeredTicket ? (
                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Kondwani Banda"
                                    value={attendeeForm.full_name}
                                    onChange={(e) => setAttendeeForm({ ...attendeeForm, full_name: e.target.value })}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        borderRadius: 8,
                                        padding: '12px 16px',
                                        color: '#fff',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Corporate Organization *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Standard Chartered Bank Zambia"
                                    value={attendeeForm.company}
                                    onChange={(e) => setAttendeeForm({ ...attendeeForm, company: e.target.value })}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        borderRadius: 8,
                                        padding: '12px 16px',
                                        color: '#fff',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Official Work Email *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="k.banda@company.com"
                                    value={attendeeForm.email}
                                    onChange={(e) => setAttendeeForm({ ...attendeeForm, email: e.target.value })}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        borderRadius: 8,
                                        padding: '12px 16px',
                                        color: '#fff',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Contact Phone / WhatsApp *</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="+260 971 234 567"
                                    value={attendeeForm.phone}
                                    onChange={(e) => setAttendeeForm({ ...attendeeForm, phone: e.target.value })}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        borderRadius: 8,
                                        padding: '12px 16px',
                                        color: '#fff',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            style={{
                                marginTop: 12,
                                background: 'linear-gradient(135deg, #0066ff 0%, #0044cc 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                padding: '16px',
                                fontSize: '1rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                boxShadow: '0 4px 20px rgba(0, 102, 255, 0.4)'
                            }}
                        >
                            <i className="fas fa-lock"></i> Lock My Seat & Generate Verified Pass
                        </button>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            borderRadius: 12,
                            padding: '12px 20px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 24,
                            fontWeight: 700,
                            fontSize: '0.9rem'
                        }}>
                            <i className="fas fa-check-circle" style={{ fontSize: '1.2rem' }}></i> Seat Locked & Verified Successfully!
                        </div>

                        {/* Interactive Digital Badge/Pass Preview */}
                        <div
                            ref={ticketRef}
                            style={{
                                maxWidth: 440,
                                margin: '0 auto 24px auto',
                                background: '#0f172a',
                                border: '2px solid #0066ff',
                                borderRadius: 20,
                                padding: 24,
                                textAlign: 'left',
                                position: 'relative',
                                boxShadow: '0 12px 40px rgba(0, 102, 255, 0.25)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12, marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '2px', color: '#0066ff' }}>ZAMBIA TECH SUMMIT 2026</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>OFFICIAL ATTENDEE BADGE</div>
                                </div>
                                <span style={{
                                    background: '#0066ff',
                                    color: '#fff',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    padding: '3px 8px',
                                    borderRadius: 4,
                                    textTransform: 'uppercase'
                                }}>
                                    {registeredTicket.passType}
                                </span>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>{registeredTicket.full_name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>{registeredTicket.company}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.75rem', marginBottom: 16 }}>
                                <div>
                                    <span style={{ color: '#64748b', display: 'block' }}>Date</span>
                                    <strong style={{ color: '#cbd5e1' }}>Oct 15, 2026</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b', display: 'block' }}>Pass ID</span>
                                    <strong style={{ color: '#0066ff' }}>{registeredTicket.ticketNumber}</strong>
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: 10,
                                padding: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Gate Scanner Check-in</span>
                                    <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>VERIFIED SEAT PASS</span>
                                </div>
                                <div style={{
                                    width: 44,
                                    height: 44,
                                    background: '#ffffff',
                                    borderRadius: 6,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <i className="fas fa-qrcode" style={{ color: '#090d16', fontSize: '1.8rem' }}></i>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
                            <button
                                onClick={downloadPass}
                                disabled={downloading}
                                style={{
                                    background: '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '12px 22px',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8
                                }}
                            >
                                <i className="fas fa-download"></i> {downloading ? 'Generating Image...' : 'Download Pass Card (PNG)'}
                            </button>

                            <button
                                onClick={() => setRegisteredTicket(null)}
                                style={{
                                    background: 'transparent',
                                    color: '#94a3b8',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: 8,
                                    padding: '12px 22px',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Register Another Delegate
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* Corporate Partners Footer */}
            <footer style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '40px 24px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.85rem'
            }}>
                <div style={{ marginBottom: 16 }}>
                    Powered by SaveMeASeat Digital Event Management · Lusaka, Zambia
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                    <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</Link>
                    <Link to="/templates" style={{ color: '#94a3b8', textDecoration: 'none' }}>Templates</Link>
                    <a href="https://wa.me/260960968349" style={{ color: '#0066ff', textDecoration: 'none' }}>WhatsApp Desk</a>
                </div>
            </footer>
        </div>
    );
};

export default CorporateSummit;
