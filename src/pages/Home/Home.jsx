// Home.jsx - Main Application Component (Enhanced UI/UX)
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import sliderImage1 from '/src/assets/images/sliderImage1.jpg';
import sliderImage2 from '/src/assets/images/sliderImage2.jpg';
import sliderImage3 from '/src/assets/images/sliderImage3.jpg';
import logoImg from '/src/assets/images/logo1.png';
import weddingImg from '/src/assets/images/wedding.png';
import wedding2Img from '/src/assets/images/wedding2.jpg';
import { supabase } from '../../supabaseClient';
import corporateImg from '/src/assets/images/Business Meeting Invitation.png';
import birthdayImg from '/src/assets/images/Birthday Greeting Card.png';
import weddingInvitationCardImg from '/src/assets/images/Wedding Invitation Card.png';
import bridalShowerImg from '../../assets/images/Bridal Shower Invitation.png';
import GlobalAIAgentWidget from '../../components/GlobalAIAgentWidget';
import avatar1 from '/src/assets/images/avatars/avatar1.png';
import avatar2 from '/src/assets/images/avatars/avatar2.png';
import avatar3 from '/src/assets/images/avatars/avatar3.png';

// Synthetic Beep Sound Generator using Web Audio API
const playSuccessBeep = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Synthesizing a crisp digital chime scan sound
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // Pitch high A
        osc1.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.08); // Sweep up to E

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.5, audioCtx.currentTime); // Pitch C6
        osc2.frequency.exponentialRampToValueAtTime(1568, audioCtx.currentTime + 0.08); // Sweep up to G6

        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.16); // Sharp decay

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc1.start();
        osc2.start();

        osc1.stop(audioCtx.currentTime + 0.16);
        osc2.stop(audioCtx.currentTime + 0.16);
    } catch (err) {
        console.warn('Web Audio API is blocked or not supported by this browser:', err);
    }
};

// Header Component
const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavClick = () => {
        setIsMenuOpen(false);
    };

    return (
        <header id="header" className={isScrolled ? 'scrolled' : ''}>
            <div className="container header-container">
                <a href="#" className="logo">
                    <img
                        src={logoImg}
                        alt="SaveMeASeat Logo"
                        className="logo-img"
                    />
                </a>
                <button
                    className="mobile-menu-btn"
                    id="mobileMenuBtn"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle Navigation Menu"
                >
                    <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                </button>
                <nav id="nav" className={isMenuOpen ? 'active' : ''}>
                    <ul>
                        <li><a href="#services" onClick={handleNavClick}>Services</a></li>
                        <li><a href="#template-showcase" onClick={handleNavClick}>Showcase</a></li>
                        <li><a href="#why-choose" onClick={handleNavClick}>Core Pillars</a></li>
                        <li><a href="#how-it-works" onClick={handleNavClick}>Process</a></li>
                        <li><a href="#pricing" onClick={handleNavClick}>Plans</a></li>
                        <li><a href="#payment" onClick={handleNavClick}>Payment</a></li>
                        <li><a href="#faq-section" onClick={handleNavClick}>FAQ</a></li>
                        <li><a href="#contact" onClick={handleNavClick}>Contact</a></li>
                        <li className="nav-cta-item">
                            <a
                                href="https://wa.me/260973848066"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="nav-whatsapp-btn"
                            >
                                WhatsApp Call
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

// Modern Hero Component (SaaS Layout)
const Hero = () => {
    return (
        <section className="hero modern-hero">
            <div className="hero-mesh-bg"></div>

            <div className="container hero-container-layout">
                {/* Left Content Area */}
                <div className="hero-content">
                    <h1 className="animate-fade-in-up delay-1 hero-main-title">
                        Create The <br />
                        <span className="highlight-text">Perfect Invitation</span>
                    </h1>

                    <p className="hero-description animate-fade-in-up delay-2">
                        Create unforgettable digital invitations with seamless guest management for weddings, birthdays, bridal showers, and corporate events.
                    </p>

                    <div className="hero-buttons animate-fade-in-up delay-3">
                        <a href="#pricing" className="hero-btn-dark">
                            Get Started <i className="fas fa-arrow-right btn-arrow"></i>
                        </a>
                        <a href="#demo" className="hero-btn-line-link">
                            <span className="btn-inline-line"></span>VIEW DEMO
                        </a>
                    </div>

                    <div className="hero-social-proof animate-fade-in-up delay-3">
                        <div className="avatar-group">
                            <img src={avatar1} alt="User" className="avatar-img" />
                            <img src={avatar2} alt="User" className="avatar-img" />
                            <img src={avatar3} alt="User" className="avatar-img" />
                            <div className="avatar-overflow">+2h</div>
                        </div>
                        <div className="social-proof-text">
                            <strong>Trusted by 200+</strong> hosts and planners across Zambia.
                        </div>
                    </div>
                </div>

                {/* Right Visual Area */}
                <div className="hero-visual animate-fade-in-up delay-2">
                    <div className="visual-glow"></div>
                    <div className="floating-cards-wrapper">
                        {/* Floating Event Cards */}
                        <img src={weddingInvitationCardImg} alt="Wedding Invitation" className="float-card card-main" />
                        <img src={corporateImg} alt="Corporate Event" className="float-card card-side card-left" />
                        <img src={birthdayImg} alt="Birthday Card" className="float-card card-side card-right" />

                    </div>
                </div>
            </div>
        </section>
    );
};

// ============================================================
// WEDDING TEMPLATES GALLERY SECTION
// ============================================================

const ALL_TEMPLATES = [
    {
        id: 'default-elegance',
        name: 'Classic Elegance',
        tags: ['Classic', 'Minimal', 'Elegant'],
        usedBy: 2150,
        isNew: false,
        isPopular: true,
        route: '/templates/default-elegance',
        preview: {
            bg: 'linear-gradient(135deg, #ffffff 0%, #f4f4f4 100%)',
            accentColor: '#000000',
            textColor: '#333333',
            fontFamily: '"Montserrat", sans-serif',
            couple: 'Chris & Sasha',
            ornament: '♡',
            taglineText: 'WEDDING INVITATION',
            dateText: '10 · X · 2026',
            dark: false,
        }
    },
    {
        id: 'terracotta-earth',
        name: 'Terracotta Earth',
        tags: ['Terracotta', 'Linen', 'Watercolor'],
        usedBy: 870,
        isNew: true,
        isPopular: false,
        route: '/templates/terracotta-earth',
        preview: {
            bg: 'linear-gradient(135deg, #fdf8f5 0%, #f4e3dc 100%)',
            accentColor: '#d9745b',
            textColor: '#5c2c1e',
            fontFamily: '"Playfair Display", Georgia, serif',
            couple: 'Kondwani & Natasha',
            ornament: '✦',
            taglineText: 'WEDDING INVITATION',
            dateText: '20 · VI · 2026',
            dark: false,
        }
    },
    {
        id: 'tropical-elegance',
        name: 'Tropical Elegance',
        tags: ['Tropical', 'Green', 'Gold'],
        usedBy: 1420,
        isNew: true,
        isPopular: false,
        route: '/templates/tropical-elegance',
        preview: {
            bg: 'linear-gradient(135deg, #f8fcf7 0%, #edf5eb 100%)',
            accentColor: '#cba052',
            textColor: '#072417',
            fontFamily: '"Playfair Display", Georgia, serif',
            couple: 'Sarfo & Cecilia',
            ornament: '🌿',
            taglineText: 'SAVE THE DATE',
            dateText: '31 · V · 2026',
            dark: false,
        }
    },
    {
        id: 'golden-romance',
        name: 'Golden Romance',
        tags: ['Elegant', 'Amber', 'Classic'],
        usedBy: 980,
        isNew: true,
        isPopular: false,
        route: '/templates/golden-romance',
        preview: {
            bg: 'linear-gradient(135deg, #fdfbf7 0%, #f5ecd7 100%)',
            accentColor: '#c8863b',
            textColor: '#2c1e16',
            fontFamily: '"Playfair Display", Georgia, serif',
            couple: 'Samuel & Gina',
            ornament: '✦',
            taglineText: 'THE WEDDING OF',
            dateText: '28 · VIII · 2024',
            dark: false,
        }
    },
    {
        id: 'botanical-olive',
        name: 'Botanical Olive',
        tags: ['Olive', 'Earthy', 'Cursive'],
        usedBy: 1240,
        isNew: true,
        isPopular: false,
        route: '/templates/botanical-olive',
        preview: {
            bg: 'linear-gradient(135deg, #fcfbf9 0%, #f5f3ee 100%)',
            accentColor: '#606c38',
            textColor: '#283618',
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            couple: 'Taonga & Luyando',
            ornament: '🍃',
            taglineText: 'OUR CELEBRATION',
            dateText: '12 · XII · 2026',
            dark: false,
        }
    }
];

// Individual template card — CSS-rendered visual preview (no images, no simulation)
// Individual template card — clean, small layout with Unsplash cover image & accent color details
const TemplateHorizontalCard = ({ template }) => {
    const p = template.preview;

    return (
        <div className="vendor-horizontal-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <div className="vhc-header" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3>{template.name}</h3>
                        {template.isPopular && <span className="v-row-badge-popular">★ Popular</span>}
                        {template.isNew && <span className="v-row-badge-new">New</span>}
                    </div>
                    <p>{`Premium custom ${template.name.toLowerCase()} layout featuring guest RSVP portal and direction details.`}</p>
                </div>
            </div>

            <div className="vhc-pill-bar" style={{ marginTop: '20px', display: 'flex', width: '100%' }}>
                <div className="vhc-segment">
                    <i className="fas fa-map-marker-alt"></i>
                    <div className="vhc-seg-text">
                        <span className="vhc-label">Location</span>
                        <span className="vhc-value">Zambia</span>
                    </div>
                </div>

                <div className="vhc-divider"></div>

                <div className="vhc-segment">
                    <i className="fas fa-envelope-open-text"></i>
                    <div className="vhc-seg-text">
                        <span className="vhc-label">Service</span>
                        <span className="vhc-value">Wedding Invite</span>
                    </div>
                </div>

                <div className="vhc-divider"></div>

                <div className="vhc-segment">
                    <i className="far fa-star"></i>
                    <div className="vhc-seg-text">
                        <span className="vhc-label">Rating</span>
                        <span className="vhc-value">5.0 Verified</span>
                    </div>
                </div>

                {/* Circular dynamic CSS-rendered avatar preview */}
                <Link
                    to={template.route}
                    className="vhc-avatar-img"
                    style={{
                        background: p.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: p.textColor,
                        border: `2px solid ${p.accentColor}`,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        textDecoration: 'none'
                    }}
                    title="Live Preview"
                >
                    <span style={{ fontSize: '0.9rem', fontFamily: p.fontFamily, fontWeight: 'bold' }}>
                        {p.ornament}
                    </span>
                </Link>
            </div>

            {/* Bottom Actions Row */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', width: '100%' }} className="v-row-right">
                <Link
                    to={template.route}
                    className="v-row-btn-preview"
                >
                    Live Demo <i className="fas fa-external-link-alt"></i>
                </Link>
                <a
                    href={`https://wa.me/260973848066?text=Hi! I'm interested in the *${template.name}* digital invitation template for my wedding.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="v-row-btn-select"
                >
                    Select Template
                </a>
            </div>
        </div>
    );
};

const WeddingTemplatesPreview = () => {
    const PREVIEW_COUNT = 3;

    return (
        <section className="wedding-templates-preview" id="wedding-templates" style={{ padding: '80px 0' }}>
            <div className="container">

                {/* ── Section Header ── */}
                <div className="section-title-wrap">
                    <span className="sub-title">WEDDING TEMPLATE COLLECTION</span>
                    <h2>Handcrafted Wedding Invitation Templates</h2>
                    <p className="section-desc">
                        Each template is a fully functional digital invitation — live countdown, RSVP system, venue map, gift registry, dress code & more.
                    </p>
                </div>

                {/* ── Template Cards list ── */}
                <div className="vendors-grid-list" style={{ maxWidth: '800px', margin: '0 auto 40px auto' }}>
                    {ALL_TEMPLATES.slice(0, PREVIEW_COUNT).map(tmpl => (
                        <TemplateHorizontalCard key={tmpl.id} template={tmpl} />
                    ))}
                </div>

                {/* ── See All CTA ── */}
                <div className="tmpl-see-all-row">
                    <Link
                        to="/templates"
                        className="hero-btn-dark"
                        id="browseAllTemplatesBtn"
                    >
                        Browse All Templates <i className="fas fa-arrow-right btn-arrow"></i>
                    </Link>
                    <p className="tmpl-see-all-sub">
                        <span><i className="fas fa-check-circle"></i> 4 Unique Designs</span>
                        <span><i className="fas fa-check-circle"></i> Fully Customizable</span>
                        <span><i className="fas fa-check-circle"></i> Live RSVP System</span>
                    </p>
                </div>

            </div>
        </section>
    );
};


// ServiceCard Component




// ServiceCard Component
const ServiceCard = ({ icon, title, description, labelCode, index }) => (
    <div className="service-card">
        <div className="service-header-row">
            <div className="card-icon-box">
                <i className={icon}></i>
            </div>
            <span className="card-engine-tag">{`PORTAL 0${index + 1}`}</span>
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
    </div>
);

// Services Component
const Services = () => {
    const services = [
        {
            icon: 'fas fa-envelope-open-text',
            title: 'Wedding Invitations',
            description: 'Elegant and romantic wedding invitation portals with robust guest lists, map widgets, gift registry integration, and live RSVP dashboards.',
            labelCode: 'PRT-WD-01'
        },
        {
            icon: 'fas fa-briefcase',
            title: 'Corporate Events',
            description: 'Professional high-speed event invitations built for conferences, product launches, and annual banquets with direct brand customization.',
            labelCode: 'PRT-CP-02'
        },
        {
            icon: 'fas fa-birthday-cake',
            title: 'Birthdays & Anniversaries',
            description: 'Fun, modern templates featuring memory sharing columns, photo uploaders, custom guest message walls, and vibrant colors.',
            labelCode: 'PRT-BD-03'
        },
        {
            icon: 'fas fa-crown',
            title: 'Bridal & Baby Showers',
            description: 'Editorial-grade customized showcase invitations with beautiful script typography, dress code guidelines, and direct register syncs.',
            labelCode: 'PRT-BS-04'
        }
    ];

    return (
        <section className="services" id="services">
            <div className="container">
                <div className="section-title-wrap">
                    <span className="sub-title">CORE CAPABILITIES</span>
                    <h2>Tailored Digital Guest Infrastructure</h2>
                    <p className="section-desc">
                        Beautiful, high-speed, and interactive digital invitations that simplify how Zambia plans celebrations.
                    </p>
                </div>
                <div className="services-grid">
                    {services.map((service, index) => (
                        <ServiceCard key={index} {...service} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};

// Available template showcases configuration list
const TEMPLATE_DESIGNS = [
    {
        id: 'royal-ivory',
        category: 'wedding',
        title: 'Royal Ivory Wedding',
        description: 'Graceful luxury layout with script typography, Google Maps widgets, custom registry, and live attendee counter.',
        image: weddingInvitationCardImg,
        accentColor: '#c5a059',
        style: 'elegant',
        details: {
            title: 'Royal Ivory',
            subtitle: 'THE WEDDING OF',
            hosts: 'Chileshe & Mutale',
            date: 'September 26, 2026',
            venue: 'The Savannah Pavilions, Lusaka',
            countdownLabel: 'Days to Celebration',
            registryLink: 'FNB Lusaka Main Account 621...',
            dressCode: 'Strictly Formal: Rose Gold & Navy Blue'
        }
    },
    {
        id: 'obsidian-midnight',
        category: 'birthday',
        title: 'Obsidian Midnight',
        description: 'Vibrant dark mode birthday page featuring guest comment columns, digital countdown, and RSVP limits.',
        image: birthdayImg,
        accentColor: '#1fa09b',
        style: 'modern',
        details: {
            title: 'Midnight 30',
            subtitle: 'JOIN THE CELEBRATION OF',
            hosts: 'Kondwani Banda',
            date: 'July 14, 2026',
            venue: 'Amethyst Sky Lounge, Lusaka',
            countdownLabel: 'Party Begins In',
            registryLink: 'Airtel Money +260 973 848 066',
            dressCode: 'All-Black Sleek Casual'
        }
    },
    {
        id: 'blossom-chic',
        category: 'bridal',
        title: 'Blossom Chic Shower',
        description: 'Chic, soft script theme tailored for elegant bridal/baby showers. Features dress code directives and timeline agendas.',
        image: bridalShowerImg,
        accentColor: '#e07a5f',
        style: 'floral',
        details: {
            title: 'Blossom Bridal',
            subtitle: 'HONORING THE BRIDE-TO-BE',
            hosts: 'Natasha Lungu',
            date: 'June 05, 2026',
            venue: 'Rose Garden Gazebo, Kitwe',
            countdownLabel: 'Shower Commences In',
            registryLink: 'MTN Mobile Money +260 762 949 123',
            dressCode: 'Pastel Floral Dresses'
        }
    },
    {
        id: 'pro-summit',
        category: 'corporate',
        title: 'Corporate Pro Summit',
        description: 'High-speed business invitation featuring interactive schedule modules, corporate sponsorships, and verified seat locking.',
        image: corporateImg,
        accentColor: '#0066ff',
        style: 'business',
        details: {
            title: 'Zambia Tech Summit',
            subtitle: 'ANNUAL LEADERSHIP BANQUET',
            hosts: 'Zambia Tech Forum',
            date: 'October 15, 2026',
            venue: 'Mulungushi Conference Centre',
            countdownLabel: 'Summit Commences In',
            registryLink: 'Corporate ABSA Account 10928...',
            dressCode: 'Business Formal / Traditional Attire'
        }
    }
];

// Interactive Template Gallery Showcase Component
const TemplateShowcase = ({ onSelectTemplate }) => {
    const [activeFilter, setActiveFilter] = useState('all');

    const filteredTemplates = activeFilter === 'all'
        ? TEMPLATE_DESIGNS
        : TEMPLATE_DESIGNS.filter(t => t.category === activeFilter);

    return (
        <section className="template-showcase" id="template-showcase">
            <div className="container">
                <div className="section-title-wrap">
                    <span className="sub-title">BESPOKE COLLECTION</span>
                    <h2>Interactive Invitation Showcase</h2>
                    <p className="section-desc">
                        Explore our high-fidelity layout archetypes. Click on any design below to open the Mobile View Simulator and interact with our live RSVP portal system.
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="showcase-tabs-row">
                    {['all', 'wedding', 'birthday', 'bridal', 'corporate'].map((cat) => (
                        <button
                            key={cat}
                            className={`showcase-tab-btn ${activeFilter === cat ? 'active' : ''}`}
                            onClick={() => setActiveFilter(cat)}
                        >
                            {cat === 'all' ? 'View All' : cat === 'wedding' ? 'Weddings' : cat === 'birthday' ? 'Birthdays' : cat === 'bridal' ? 'Bridal Showers' : 'Corporate'}
                        </button>
                    ))}
                </div>

                {/* Templates Grid */}
                <div className="templates-grid">
                    {filteredTemplates.map((tmpl) => (
                        <div key={tmpl.id} className="template-card" onClick={() => onSelectTemplate(tmpl)}>
                            <div className="template-image-box">
                                <img src={tmpl.image} alt={tmpl.title} className="template-img" />
                                <div className="template-card-hover-overlay">
                                    <span className="hover-btn-action">
                                        <i className="fas fa-mobile-alt"></i> Preview Live Portal
                                    </span>
                                </div>
                            </div>
                            <div className="template-info-box">
                                <span className="template-tag" style={{ color: tmpl.accentColor, borderColor: tmpl.accentColor }}>
                                    {tmpl.category.toUpperCase()}
                                </span>
                                <h3>{tmpl.title}</h3>
                                <p>{tmpl.description}</p>
                                <div className="template-card-footer">
                                    <span className="learn-more-link" style={{ color: tmpl.accentColor }}>
                                        Launch Mobile Simulator <i className="fas fa-arrow-right"></i>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Immersive Mobile View Preview Simulator Modal
const MobileSimulatorModal = ({ template, onClose }) => {
    const [rsvped, setRsvped] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const [attendance, setAttendance] = useState('yes');
    const [dietInput, setDietInput] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    // Mock countdown (starts at 12 days, 4 hours, 45 mins)
    const [countdown, setCountdown] = useState({ days: 12, hours: 4, mins: 45, secs: 30 });

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
                if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
                if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
                if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59 };
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleMockSubmit = (e) => {
        e.preventDefault();
        if (!nameInput.trim()) return;
        setSubmitLoading(true);
        setTimeout(() => {
            setSubmitLoading(false);
            setRsvped(true);
        }, 1200);
    };

    return (
        <div className="simulator-overlay-container" onClick={(e) => e.target.className === 'simulator-overlay-container' && onClose()}>
            <div className="simulator-modal-inner">
                {/* Left Side: Mockup Specifications info */}
                <div className="simulator-description-panel">
                    <button className="simulator-close-x" onClick={onClose}>&times;</button>
                    <h2>{template.title}</h2>
                    <span className="spec-tag mb-4">{template.category.toUpperCase()} LAYOUT MODEL</span>
                    <p className="description-text">
                        This is a live interactive simulation showing exactly how your custom invitation loads and acts on your guests' smartphones. Feel free to type in a guest name and test the RSVP logic!
                    </p>
                    <div className="feature-bullets">
                        <div className="bullet-row">
                            <span className="bullet-bullet" style={{ backgroundColor: template.accentColor }}></span>
                            <span><strong>Responsive Adaptive Viewport</strong>: Auto-fits Airtel/MTN networks smoothly.</span>
                        </div>
                        <div className="bullet-row">
                            <span className="bullet-bullet" style={{ backgroundColor: template.accentColor }}></span>
                            <span><strong>Interactive Forms</strong>: Updates guest checklists and client panels.</span>
                        </div>
                        <div className="bullet-row">
                            <span className="bullet-bullet" style={{ backgroundColor: template.accentColor }}></span>
                            <span><strong>Event Directives</strong>: Details custom map coordinates & dress codes.</span>
                        </div>
                    </div>
                    <button className="simulator-action-btn-back" onClick={onClose}>
                        Close Simulator View
                    </button>
                </div>

                {/* Right Side: Smartphone mockup viewport */}
                <div className="simulator-phone-wrapper">
                    <div className="phone-outer-shell">
                        <div className="phone-camera-island"></div>
                        <div className="phone-screen-viewport">
                            {/* Mobile Top Bar */}
                            <div className="mobile-status-bar-mock">
                                <span className="mobile-time">10:42 AM</span>
                                <div className="mobile-icons-slot">
                                    <i className="fas fa-signal"></i>
                                    <i className="fas fa-wifi"></i>
                                    <i className="fas fa-battery-three-quarters"></i>
                                </div>
                            </div>

                            {/* Scrollable Invite Viewport */}
                            <div className="mobile-scrollable-content" style={{ fontFamily: template.style === 'elegant' ? '"Cormorant Garamond", serif' : '"Outfit", sans-serif' }}>
                                {/* Hero banner */}
                                <div className="mobile-invite-hero" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.75)), url(${template.image})` }}>
                                    <span className="mobile-subtitle">{template.details.subtitle}</span>
                                    <h1 className="mobile-hosts-title">{template.details.hosts}</h1>
                                </div>

                                {/* Core Card Info */}
                                <div className="mobile-invite-card-info" style={{ borderColor: template.accentColor }}>
                                    <div className="mobile-date-badge" style={{ backgroundColor: `${template.accentColor}1A`, color: template.accentColor }}>
                                        <i className="far fa-calendar-alt"></i> {template.details.date}
                                    </div>
                                    <div className="mobile-venue-text">
                                        <i className="fas fa-map-marker-alt"></i> {template.details.venue}
                                    </div>
                                </div>

                                {/* Countdown Block */}
                                <div className="mobile-countdown-block" style={{ background: template.style === 'modern' ? '#12131C' : '#FAF9F6', color: template.style === 'modern' ? '#FFF' : '#333' }}>
                                    <span className="countdown-label-tag">{template.details.countdownLabel}</span>
                                    <div className="countdown-grid-slots">
                                        <div>
                                            <span className="c-num" style={{ color: template.accentColor }}>{countdown.days}</span>
                                            <span className="c-lbl">Days</span>
                                        </div>
                                        <div>
                                            <span className="c-num" style={{ color: template.accentColor }}>{countdown.hours}</span>
                                            <span className="c-lbl">Hrs</span>
                                        </div>
                                        <div>
                                            <span className="c-num" style={{ color: template.accentColor }}>{countdown.mins}</span>
                                            <span className="c-lbl">Mins</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Dress Code Panel */}
                                <div className="mobile-section-card">
                                    <h4 className="card-lbl-title" style={{ color: template.accentColor }}><i className="fas fa-tshirt"></i> DRESS CODE GUIDELINE</h4>
                                    <p className="card-lbl-desc">{template.details.dressCode}</p>
                                </div>

                                {/* RSVP Interactive Form */}
                                <div className="mobile-section-card rsvp-section-bg" style={{ borderColor: template.accentColor }}>
                                    <h4 className="card-lbl-title" style={{ color: template.accentColor }}><i className="fas fa-envelope-open"></i> GUEST RSVP GATEWAY</h4>

                                    {!rsvped ? (
                                        <form onSubmit={handleMockSubmit} className="mobile-rsvp-form">
                                            <div className="mobile-form-group">
                                                <label>Your Full Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter name as per invite"
                                                    value={nameInput}
                                                    onChange={(e) => setNameInput(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="mobile-form-group">
                                                <label>Will You Attend?</label>
                                                <div className="mobile-radio-group">
                                                    <label className={`radio-pill ${attendance === 'yes' ? 'selected' : ''}`} style={{ backgroundColor: attendance === 'yes' ? template.accentColor : '' }} onClick={() => setAttendance('yes')}>
                                                        Attending
                                                    </label>
                                                    <label className={`radio-pill ${attendance === 'no' ? 'selected' : ''}`} style={{ backgroundColor: attendance === 'no' ? template.accentColor : '' }} onClick={() => setAttendance('no')}>
                                                        Decline
                                                    </label>
                                                </div>
                                            </div>
                                            {attendance === 'yes' && (
                                                <div className="mobile-form-group">
                                                    <label>Dietary Restrictions / Seating Notes</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Vegetarian, None"
                                                        value={dietInput}
                                                        onChange={(e) => setDietInput(e.target.value)}
                                                    />
                                                </div>
                                            )}
                                            <button type="submit" className="mobile-submit-btn" style={{ backgroundColor: template.accentColor }}>
                                                {submitLoading ? 'Transmitting Seating Data...' : 'Confirm RSVP Seating'}
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="mobile-rsvp-success">
                                            <div className="success-badge-circle" style={{ backgroundColor: template.accentColor }}>
                                                <i className="fas fa-check"></i>
                                            </div>
                                            <h5>RSVP Registered Successfully!</h5>
                                            <p>Your seat has been reserved. Check your email for your unique gate checkpoint scan QR code ticket.</p>
                                            <div className="success-mock-qr">
                                                <i className="fas fa-qrcode"></i>
                                                <span>SCAN GATE PASS</span>
                                            </div>
                                            <button type="button" className="reset-btn" onClick={() => { setRsvped(false); setNameInput(''); setDietInput(''); }}>
                                                Register Another Guest
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Registry Panel */}
                                <div className="mobile-section-card bg-cream">
                                    <h4 className="card-lbl-title" style={{ color: template.accentColor }}><i className="fas fa-gift"></i> GIFT REGISTRY CHANNEL</h4>
                                    <p className="card-lbl-desc">Registry details or banking channel for gifting:</p>
                                    <div className="registry-box-pills">
                                        <strong>{template.details.registryLink}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Supported Networks / Trust Cloud Bar
const TrustCloud = () => (
    <div className="trust-cloud-section">
        <div className="container">
            <span className="trust-title">INTEGRATED PAYMENT CHANNELS & LOCAL CHANNELS</span>
            <div className="trust-logos">
                <span className="trust-logo-item">AIRTEL MONEY</span>
                <span className="trust-logo-item">MTN MOMO</span>
                <span className="trust-logo-item">FNB ZAMBIA</span>
                <span className="trust-logo-item">ZANACO</span>
                <span className="trust-logo-item">ABSA</span>
            </div>
        </div>
    </div>
);

// WhyChoose Component (Modern Obsidian Grid)
const WhyChoose = () => {
    const features = [
        {
            num: '01',
            title: 'LIVE RSVP DASHBOARD',
            description: 'Gain instant, complete visibility over guest confirmation statuses, meal selections, and check-in metrics from your interactive client panel.'
        },
        {
            num: '02',
            title: 'SMART CAPACITY CONTROL',
            description: 'Set strict guest capacity limits, configure automatic deadline locks, and adjust response rules instantly as your venue layout evolves.'
        },
        {
            num: '03',
            title: 'ULTRA-FAST MOBILE LOAD',
            description: 'Optimized, highly-compressed invitation layouts load in under 2 seconds on low-bandwidth Airtel and MTN connections, so no guest is left behind.'
        },
        {
            num: '04',
            title: 'EXCLUSIVE GUEST SECURITY',
            description: 'Prevent uninvited gatecrashers by locking RSVP access exclusively to verified invitee names, family units, or security-capped guest passes.'
        },
        {
            num: '05',
            title: 'LUXURY DESIGN DIRECTIVES',
            description: 'Every digital invitation website is tailor-made by elite designers, incorporating premium typography, smooth transitions, and high-fidelity layouts.'
        },
        {
            num: '06',
            title: 'AUTOMATED GUEST NUDGES',
            description: 'Shorten guest coordination cycles using automated email nudges and friendly reminder updates that prompt pending invitees before deadlines close.'
        }
    ];

    return (
        <section className="why-choose" id="why-choose">
            <div className="container">
                <div className="section-title-wrap dark-section-title">
                    <span className="sub-title">THE SAVE ME A SEAT WAY</span>
                    <h2>The Pillars of Zambia's Event Excellence</h2>
                    <p className="section-desc">
                        Engineering digital coordination tools that prioritize speed, security, and beautiful aesthetics.
                    </p>
                </div>
                <div className="why-features-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="why-feature-card">
                            <span className="card-arrow"><i className="fas fa-chevron-right"></i></span>
                            <span className="card-bg-number">{feature.num}</span>
                            <div className="why-feature-icon-wrapper">
                                <div className="why-feature-icon-outline">
                                    <i className={index === 0 ? "fas fa-eye" : index === 1 ? "fas fa-cogs" : index === 2 ? "fas fa-bolt" : index === 3 ? "fas fa-fingerprint" : index === 4 ? "fas fa-palette" : "fas fa-bell"}></i>
                                </div>
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Refined Interactive Range Slider Savings Calculator
const SavingsCalculator = () => {
    const [guestCount, setGuestCount] = useState(300);

    // Compute metrics dynamically based on standard Kwacha physical invitation rates
    const printCost = guestCount * 30; // ZMW 30 per printed invitation card average
    const fuelCost = guestCount * 11; // ZMW 11 average fuel cost for physical card distribution
    const hoursSaved = Math.round(guestCount * 0.15); // 0.15 hours saved per guest
    const treesSaved = Math.round(guestCount * 0.008 * 10) / 10; // 0.008 trees saved per card
    const totalSavings = printCost + fuelCost;

    return (
        <section className="savings-calculator" id="savings-calculator">
            <div className="container">
                <div className="section-title-wrap">
                    <span className="sub-title">FINANCIAL & TIME METRICS</span>
                    <h2>Calculate Your Coordination Savings</h2>
                    <p className="section-desc">
                        Traditional paper cards incur high printing charges, fuel costs for delivery, and hours of phone tag. Adjust your guest count below to see your instant Kwacha savings.
                    </p>
                </div>

                <div className="calculator-wrapper">
                    {/* Continuous Fluid Range Slider */}
                    <div className="calculator-slider-container">
                        <div className="slider-label-row">
                            <span>Adjust Guest Count:</span>
                            <span className="guest-count-display">{guestCount} Guests</span>
                        </div>
                        <input
                            type="range"
                            min="50"
                            max="1500"
                            step="25"
                            value={guestCount}
                            onChange={(e) => setGuestCount(Number(e.target.value))}
                            className="kwacha-range-slider"
                        />
                        <div className="slider-limits">
                            <span>50 Guests</span>
                            <span>750 Guests</span>
                            <span>1,500 Guests</span>
                        </div>
                    </div>

                    {/* Metric Display Grid */}
                    <div className="calculator-metrics-grid">
                        <div className="metric-box">
                            <span className="metric-icon-slot"><i className="fas fa-wallet"></i></span>
                            <h4 className="metric-heading">Print Costs Saved</h4>
                            <div className="metric-value">ZMW {printCost.toLocaleString()}</div>
                            <p className="metric-subtext">Estimated average price of physical card design and print runs.</p>
                        </div>
                        <div className="metric-box">
                            <span className="metric-icon-slot"><i className="fas fa-gas-pump"></i></span>
                            <h4 className="metric-heading">Fuel Costs Saved</h4>
                            <div className="metric-value">ZMW {fuelCost.toLocaleString()}</div>
                            <p className="metric-subtext">Estimated average fuel saved from manual card distribution across town.</p>
                        </div>
                        <div className="metric-box">
                            <span className="metric-icon-slot"><i className="fas fa-hourglass-half"></i></span>
                            <h4 className="metric-heading">Hours Saved</h4>
                            <div className="metric-value">{hoursSaved} Hours</div>
                            <p className="metric-subtext">Estimated manual coordinating hours saved by replacing continuous follow-up calls.</p>
                        </div>
                        <div className="metric-box green-metric">
                            <span className="metric-icon-slot"><i className="fas fa-leaf"></i></span>
                            <h4 className="metric-heading">Environmental Impact</h4>
                            <div className="metric-value">{treesSaved} Tree{treesSaved !== 1 ? 's' : ''} Saved</div>
                            <p className="metric-subtext">Direct paper usage offset by transitioning fully to our cloud invitation platform.</p>
                        </div>
                    </div>

                    <div className="calculator-total-saved-banner">
                        <span>ESTIMATED TOTAL SAVINGS:</span>
                        <strong>ZMW {totalSavings.toLocaleString()}</strong>
                    </div>
                </div>
            </div>
        </section>
    );
};

// HowItWorks Component
const HowItWorks = () => {
    const steps = [
        {
            number: '01',
            icon: 'fas fa-comments',
            title: 'Initial Consultation',
            description: 'We discuss your event theme, program layout, guest limit requirements, and custom registry preferences.'
        },
        {
            number: '02',
            icon: 'fas fa-paint-brush',
            title: 'Bespoke Design Phase',
            description: 'Our design collective creates a premium digital invitation draft matching your colors, images, and fonts.'
        },
        {
            number: '03',
            icon: 'fas fa-rocket',
            title: 'Launch & Guest Sendout',
            description: 'Your invitation site goes live with a custom slug link, ready to be shared instantly across WhatsApp and social channels.'
        },
        {
            number: '04',
            icon: 'fas fa-chart-line',
            title: 'Real-Time RSVP Control',
            description: 'Track responses instantly. Export guest Excel sheets, scan check-in QR codes, and monitor attendance live.'
        }
    ];

    return (
        <section className="how-it-works" id="how-it-works">
            <div className="container">
                <div className="section-title-wrap">
                    <span className="sub-title">STREAMLINED PLANNING</span>
                    <h2>How It Works</h2>
                    <p className="section-desc">
                        Our straightforward four-step process takes the hassle and stress out of invitation logistics.
                    </p>
                </div>
                <div className="steps">
                    {steps.map((step, index) => (
                        <div key={index} className="step">
                            <div className="step-header-wrapper">
                                <div className="step-icon-box">
                                    <i className={step.icon}></i>
                                </div>
                                <div className="step-number">{step.number}</div>
                            </div>
                            <h3>{step.title}</h3>
                            <p>{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// High-Fidelity Entry check-in scanner with synthesized beep sound
const EntryGateway = () => {
    const [scanLogs, setScanLogs] = useState([
        { time: '04:12 PM', guest: 'Sarah Mwanga', status: 'VALID', table: 'Table 2' },
        { time: '04:14 PM', guest: 'George Mwale + 1', status: 'VALID', table: 'Table 5' },
        { time: '04:18 PM', guest: 'Natasha Banda', status: 'VIP VALID', table: 'VIP Table 1' }
    ]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanSuccess, setScanSuccess] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [isMuted, setIsMuted] = useState(false);

    const mockGuests = [
        { guest: 'Chileshe Kunda', table: 'Table 3', status: 'VALID' },
        { guest: 'Mr. & Mrs. Lungu', table: 'Table 8', status: 'VALID' },
        { guest: 'Sarah Phiri', table: 'VIP Table 2', status: 'VIP VALID' },
        { guest: 'Agness Tembo + 2', table: 'Table 4', status: 'VALID' }
    ];

    const simulateDoorScan = () => {
        if (isScanning) return;
        setIsScanning(true);
        setScanResult(null);

        setTimeout(() => {
            const randomGuest = mockGuests[Math.floor(Math.random() * mockGuests.length)];
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            setScanLogs(prev => [
                { time: timeString, ...randomGuest },
                ...prev.slice(0, 4) // Keep last 5 scans
            ]);

            setScanResult(randomGuest);
            setScanSuccess(true);
            setIsScanning(false);

            if (!isMuted) {
                playSuccessBeep();
            }

            // Reset the scan success flashing overlay after 2 seconds
            setTimeout(() => {
                setScanSuccess(false);
            }, 2000);
        }, 1200);
    };

    return (
        <section className="entry-gateway" id="entry-gateway">
            <div className="container">
                <div className="section-title-wrap dark-section-title">
                    <span className="sub-title">SECURE CHECKPOINT SCANNING</span>
                    <h2>Secure Entry Checkpoint Gateway</h2>
                    <p className="section-desc">
                        Prevent uninvited gatecrashing and coordinate table seating easily. Every verified guest receives a unique QR code entry ticket alongside their RSVP confirmation sheet.
                    </p>
                </div>

                <div className="gateway-dashboard-layout">
                    {/* High-Fidelity Scanner Device App Mockup */}
                    <div className="scanner-phone-mockup">
                        <div className="scanner-mock-inner">
                            <div className="scanner-phone-header">
                                <span className="scanner-app-header">GATE CHECKPOINT</span>
                                <button
                                    className="scanner-mute-btn"
                                    onClick={() => setIsMuted(!isMuted)}
                                    title={isMuted ? "Unmute Scanner Sound" : "Mute Scanner Sound"}
                                >
                                    <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
                                </button>
                            </div>

                            <div className={`scanner-aiming-reticle ${scanSuccess ? 'success-flash' : ''}`}>
                                <div className={`scanner-laser-line ${isScanning ? 'scanning' : ''}`}></div>
                                {scanSuccess && scanResult ? (
                                    <div className="scanner-display-card animate-fade-in">
                                        <div className="scan-card-icon"><i className="fas fa-check-circle"></i></div>
                                        <h5>ADMISSION GRANTED</h5>
                                        <p className="scanner-guest-name">{scanResult.guest}</p>
                                        <p className="scanner-guest-table">{scanResult.table}</p>
                                        <span className="scanner-guest-badge">{scanResult.status}</span>
                                    </div>
                                ) : isScanning ? (
                                    <div className="scanner-processing-loader">
                                        <i className="fas fa-sync fa-spin"></i>
                                        <span>Decoding QR Code...</span>
                                    </div>
                                ) : (
                                    <>
                                        <i className="fas fa-qrcode qr-icon-glow"></i>
                                        <span className="scanner-reticle-status">READY TO SCAN</span>
                                    </>
                                )}
                            </div>

                            <button
                                className="scan-simulator-action-btn"
                                onClick={simulateDoorScan}
                                disabled={isScanning}
                            >
                                {isScanning ? 'Scanning Ticket...' : 'Simulate Guest Scan'}
                            </button>
                            <span className="scanner-hint">Airtel & MTN optimized mobile web scanner</span>
                        </div>
                    </div>

                    {/* Live Entry Status Logs */}
                    <div className="scanner-feed-card">
                        <h3>Live Entrance Admission Feed</h3>
                        <p>Real-time checkpoint scan results captured at the main gate terminal:</p>

                        <div className="live-logs-container">
                            {scanLogs.map((log, idx) => (
                                <div key={idx} className="log-line-item animate-log">
                                    <span className="log-timestamp">{log.time}</span>
                                    <div className="log-details-block">
                                        <span className="guest-name">{log.guest}</span>
                                        <span className="guest-table">{log.table}</span>
                                    </div>
                                    <span className={`log-badge ${log.status.toLowerCase().includes('vip') ? 'vip' : 'valid'}`}>
                                        {log.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="log-totals-row">
                            <span>TOTAL ADMITTED: <strong>164 Guests</strong></span>
                            <span>PENDING ARRIVAL: <strong>136 Guests</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// PricingCard Component (Modern Specification Style)
const PricingCard = ({ title, price, features, popular, packageType, onOpenPackage, labelCode }) => {
    const handleViewPackage = (e) => {
        e.preventDefault();
        onOpenPackage(packageType);
    };

    const getIconClass = (pkgType) => {
        switch (pkgType) {
            case 'starter': return 'fas fa-paper-plane';
            case 'silver': return 'fas fa-palette';
            case 'gold': return 'fas fa-gem';
            case 'platinum': return 'fas fa-crown';
            case 'corporate': return 'fas fa-building';
            default: return 'fas fa-rocket';
        }
    };

    return (
        <div className={`pricing-card-spec ${popular ? 'popular' : ''}`}>
            {popular && <span className="spec-card-badge">Most Popular</span>}
            <div className="spec-card-header">
                <div className="spec-icon-box">
                    <i className={getIconClass(packageType)}></i>
                </div>
                <span className="spec-tag">{labelCode}</span>
            </div>
            <h3>{title}</h3>
            <div className="spec-price-tag">
                {price} {packageType !== 'corporate' && <span className="price-sub">/ portal</span>}
            </div>
            <ul className="spec-features-list">
                {features.map((feature, index) => (
                    <li key={index}>
                        <span className="spec-bullet-dot"></span>
                        {feature}
                    </li>
                ))}
            </ul>
            <button className="spec-cta-btn" onClick={handleViewPackage}>
                View Plan Specifications
            </button>
        </div>
    );
};

// Pricing Component
const Pricing = ({ onOpenPackage }) => {
    const plans = [
        {
            title: 'Starter Package',
            price: 'ZMW 450',
            features: [
                'Up to 100 Guests limit',
                'Premium digital invitation',
                'Event details page',
                'WhatsApp sharing & directions',
                'RSVP tracking & maps location',
                'Countdown timer & 1 free revision'
            ],
            popular: false,
            packageType: 'starter',
            labelCode: 'PKG-STR-01'
        },
        {
            title: 'Silver Package',
            price: 'ZMW 650',
            features: [
                'Up to 200 Guests limit',
                'Everything in Starter package',
                'Stunning photo gallery panel',
                'Background music integration',
                'Event schedule section',
                '3 free revisions support'
            ],
            popular: false,
            packageType: 'silver',
            labelCode: 'PKG-SLV-02'
        },
        {
            title: 'Gold Package',
            price: 'ZMW 850',
            features: [
                'Up to 350 Guests limit',
                'Everything in Silver package',
                'Fully custom RSVP form layout',
                'Guest list groupings/categories',
                'Gift registry integration',
                'Unlimited revisions guarantee'
            ],
            popular: true,
            packageType: 'gold',
            labelCode: 'PKG-GLD-03'
        },
        {
            title: 'Platinum Package',
            price: 'ZMW 1,500',
            features: [
                'Up to 500 Guests limit',
                'Everything in Gold package',
                'Personalized guest invitation cards',
                'Unique QR Code gate entry tickets',
                'Premium interactive animations',
                'VIP guest management & support'
            ],
            popular: false,
            packageType: 'platinum',
            labelCode: 'PKG-PLT-04'
        },
        {
            title: 'Corporate Package',
            price: 'From ZMW 2,500',
            features: [
                'Custom branded portal design',
                'Corporate colors & brand assets',
                'Multiple RSVP attendee categories',
                'Event analytics live dashboard',
                'Dedicated planning manager support',
                'Conference & product launch modules'
            ],
            popular: false,
            packageType: 'corporate',
            labelCode: 'PKG-CRP-05'
        }
    ];

    return (
        <section className="pricing" id="pricing">
            <div className="container">
                <div className="section-title-wrap">
                    <span className="sub-title">PRICING PACKAGES</span>
                    <h2>Digital Invitations Starting From Just ZMW 450</h2>
                    <p className="section-desc">
                        Whether it's a wedding, birthday, bridal shower, kitchen party, graduation, or corporate event, SaveMeASeat helps you create stunning digital invitations that impress your guests and simplify event management.
                    </p>
                    <div className="pricing-promo-highlights">
                        <span><i className="fas fa-check-circle"></i> Easy Sharing</span>
                        <span><i className="fas fa-check-circle"></i> Maps & Directions</span>
                        <span><i className="fas fa-check-circle"></i> Countdown Timer</span>
                        <span><i className="fas fa-check-circle"></i> RSVP Tracking</span>
                    </div>
                    <p className="pricing-slogan">Save money. Save time. Save your seat with SaveMeASeat.</p>
                </div>
                <div className="pricing-plans-grid">
                    {plans.map((plan, index) => (
                        <PricingCard key={index} {...plan} onOpenPackage={onOpenPackage} />
                    ))}
                </div>
            </div>
        </section>
    );
};

// Payment Instructions Component
const Payment = () => {
    return (
        <section className="payment-instructions" id="payment">
            <div className="container">
                <div className="section-title-wrap">
                    <span className="sub-title">SECURE GATEWAY</span>
                    <h2>Secure Payment Methods</h2>
                    <p className="section-desc">
                        Direct support for local Zambian mobile money systems and instant banking transfers.
                    </p>
                </div>

                <div className="payment-methods-grid">
                    <div className="payment-method-card">
                        <div className="pay-method-icon">
                            <i className="fas fa-mobile-alt"></i>
                        </div>
                        <h3>Mobile Money Transfer</h3>
                        <p className="method-label">Airtel Money Channel</p>
                        <div className="payment-detail-table">
                            <div className="table-row">
                                <span className="label">Registered Name</span>
                                <span className="value">Godwin Banda</span>
                            </div>
                            <div className="table-row">
                                <span className="label">Airtel Number</span>
                                <span className="value">+260 973 848 066</span>
                            </div>
                        </div>
                    </div>

                    <div className="payment-method-card">
                        <div className="pay-method-icon">
                            <i className="fas fa-university"></i>
                        </div>
                        <h3>Direct FNB Transfer</h3>
                        <p className="method-label">First National Bank Zambia</p>
                        <div className="payment-detail-table">
                            <div className="table-row">
                                <span className="label">Account Holder</span>
                                <span className="value">Godwin Banda</span>
                            </div>
                            <div className="table-row">
                                <span className="label">Account Number</span>
                                <span className="value">63149798184</span>
                            </div>
                            <div className="table-row">
                                <span className="label">Branch Name</span>
                                <span className="value">Lusaka Main</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="payment-instruction-box">
                    <h3>Completion & Work Order Checklist</h3>
                    <p>
                        After completing your Kwacha payment through either Mobile Money or FNB transfer, please:
                    </p>
                    <ol>
                        <li>Take a screenshot or receipt of the completed transaction.</li>
                        <li>Send the payment proof directly to our active WhatsApp link: <strong><a href="https://wa.me/260973848066" target="_blank" rel="noopener noreferrer" className="highlight-link">+260 973 848 066</a></strong></li>
                        <li>Include your event name, selected package code, and target launching deadline.</li>
                    </ol>
                </div>
            </div>
        </section>
    );
};

// Statistics Component
const Statistics = () => {
    return (
        <section className="statistics" id="statistics">
            <div className="container">
                <div className="stats-grid">
                    <div className="stat-item">
                        <div className="stat-number">1,000+</div>
                        <div className="stat-label">Portals Delivered</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">50,000+</div>
                        <div className="stat-label">Verified RSVPs</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">99.2%</div>
                        <div className="stat-label">Host Satisfaction</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">5+ Years</div>
                        <div className="stat-label">Design Experience</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Elite Local Zambia Event Vendor Directory (with real-time filters)
const VendorDirectory = () => {
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeVendor, setActiveVendor] = useState(null);
    const [lightboxIndex, setLightboxIndex] = useState(null);

    const fallbackVendors = [
        {
            name: 'Glow by Sarah M.',
            category: 'Makeup',
            city: 'Lusaka',
            image: 'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=600',
            rating: '5.0 Verified',
            description: 'Top-rated makeup professional. One simple search.'
        },
        {
            name: 'Obelisk Photography',
            category: 'Photography',
            city: 'Lusaka',
            image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
            rating: '5.0 Verified',
            description: 'Top-rated photography professional. One simple search.'
        },
        {
            name: 'Amethyst Decor Designs',
            category: 'Decor',
            city: 'Lusaka',
            image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=600&q=80',
            rating: '5.0 Verified',
            description: 'Top-rated decor professional. One simple search.'
        },
        {
            name: 'Lusaka Gourmet Caterers',
            category: 'Catering',
            city: 'Lusaka',
            image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
            rating: '5.0 Verified',
            description: 'Top-rated catering professional. One simple search.'
        },
        {
            name: 'The Savannah Pavilions',
            category: 'Venues',
            city: 'Lusaka',
            image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
            rating: '5.0 Verified',
            description: 'Top-rated venues professional. One simple search.'
        },
        {
            name: 'Lola Wedding Planners',
            category: 'Decor',
            city: 'Kitwe',
            image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80',
            rating: '5.0 Verified',
            description: 'Top-rated decor professional. One simple search.'
        },
        {
            name: 'Zambia Sound & Stage Lights',
            category: 'Venues',
            city: 'Lusaka',
            image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
            rating: '5.0 Verified',
            description: 'Top-rated venues professional. One simple search.'
        }
    ];

    const parseVendorPortfolio = (portfolio) => {
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
        const getVendors = async () => {
            try {
                const { data, error } = await supabase
                    .from('vendors')
                    .select('*')
                    .order('created_at', { ascending: true });
                if (error) throw error;
                if (data && data.length > 0) {
                    setVendors(data.map(vendor => ({
                        ...vendor,
                        portfolio: parseVendorPortfolio(vendor.portfolio)
                    })));
                } else {
                    setVendors(fallbackVendors);
                }
            } catch (err) {
                console.warn('Failed to fetch vendors from Supabase, loading fallbacks:', err);
                setVendors(fallbackVendors);
            } finally {
                setLoading(false);
            }
        };
        getVendors();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (lightboxIndex === null || !activeVendor || !activeVendor.portfolio) return;
            if (e.key === 'ArrowRight') {
                setLightboxIndex(prev => (prev < activeVendor.portfolio.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'ArrowLeft') {
                setLightboxIndex(prev => (prev > 0 ? prev - 1 : activeVendor.portfolio.length - 1));
            } else if (e.key === 'Escape') {
                setLightboxIndex(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, activeVendor]);

    const filteredVendors = selectedFilter === 'all'
        ? vendors
        : vendors.filter(v => v.category === selectedFilter);

    return (
        <section className="vendor-directory" id="vendor-directory">
            <div className="container">
                <div className="section-title-wrap">
                    <span className="sub-title">SUPPORTING PLATFORM ECOSYSTEM</span>
                    <h2>Elite Event Vendor Network</h2>
                    <p className="section-desc">
                        Need an expert local planner, decorator, photographer, or caterer? Discover top-tier Zambian professionals highly recommended by our invitation coordinators.
                    </p>
                </div>

                {/* Filter Tabs Row */}
                <div className="vendor-tabs-row">
                    {['all', 'Makeup', 'Photography', 'Decor', 'Catering', 'Venues', 'DJ/Sound', 'Planning'].map((cat) => (
                        <button
                            key={cat}
                            className={`vendor-tab-btn ${selectedFilter === cat ? 'active' : ''}`}
                            onClick={() => setSelectedFilter(cat)}
                        >
                            {cat === 'all' ? 'View All' : cat}
                        </button>
                    ))}
                </div>

                <div className="vendors-grid-list">
                    {filteredVendors.map((vendor, idx) => {
                        let catIcon = "fas fa-star";
                        if (vendor.category === "Makeup") catIcon = "fas fa-eye";
                        if (vendor.category === "Photography") catIcon = "fas fa-camera";
                        if (vendor.category === "Decor") catIcon = "fas fa-palette";
                        if (vendor.category === "Catering") catIcon = "fas fa-utensils";
                        if (vendor.category === "Venues") catIcon = "fas fa-map-marker-alt";
                        if (vendor.category === "DJ/Sound") catIcon = "fas fa-music";
                        if (vendor.category === "Planning") catIcon = "fas fa-calendar-alt";

                        return (
                            <div key={idx} className="vendor-horizontal-card" onClick={() => setActiveVendor(vendor)} style={{ cursor: 'pointer' }}>
                                <div className="vhc-header">
                                    <h3>{vendor.name}</h3>
                                    <p>{vendor.description || `Top-rated ${vendor.category.toLowerCase()} professional. One simple search.`}</p>
                                </div>

                                <div className="vhc-pill-bar">
                                    <div className="vhc-segment">
                                        <i className="fas fa-map-marker-alt"></i>
                                        <div className="vhc-seg-text">
                                            <span className="vhc-label">Location</span>
                                            <span className="vhc-value">{vendor.city}</span>
                                        </div>
                                    </div>

                                    <div className="vhc-divider"></div>

                                    <div className="vhc-segment">
                                        <i className={catIcon}></i>
                                        <div className="vhc-seg-text">
                                            <span className="vhc-label">Service</span>
                                            <span className="vhc-value">{vendor.category}</span>
                                        </div>
                                    </div>

                                    <div className="vhc-divider"></div>

                                    <div className="vhc-segment">
                                        <i className="far fa-star"></i>
                                        <div className="vhc-seg-text">
                                            <span className="vhc-label">Rating</span>
                                            <span className="vhc-value">{vendor.rating || '5.0 Verified'}</span>
                                        </div>
                                    </div>

                                    <div className="vhc-avatar-img" style={{ backgroundImage: `url(${vendor.image})` }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {activeVendor && (
                <div
                    className="popup-overlay active"
                    onClick={() => setActiveVendor(null)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3000,
                        background: 'rgba(8, 8, 10, 0.8)',
                        backdropFilter: 'blur(12px)',
                        padding: '1.5rem',
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0
                    }}
                >
                    <div
                        className="popup-content"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '600px',
                            width: '100%',
                            maxHeight: '85vh',
                            overflowY: 'auto',
                            background: 'var(--bg-surface)',
                            borderRadius: '24px',
                            border: '1px solid var(--border-color)',
                            position: 'relative',
                            boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            padding: 0,
                            margin: 0
                        }}
                    >
                        <style>{`
                            @keyframes modalSlideUp {
                                from { transform: translateY(20px); opacity: 0; }
                                to { transform: translateY(0); opacity: 1; }
                            }
                            .portfolio-thumb-card {
                                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
                            }
                            .portfolio-thumb-card:hover {
                                transform: translateY(-3px) !important;
                                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
                            }
                            .portfolio-thumb-card:hover .video-play-btn {
                                transform: scale(1.1) !important;
                                background: #10b981 !important;
                                color: #ffffff !important;
                            }
                        `}</style>

                        {/* Modal Header Cover */}
                        <div style={{ position: 'relative', width: '100%', height: '220px', background: '#000', overflow: 'hidden', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
                            <img
                                src={activeVendor.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80'}
                                alt={activeVendor.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: 'linear-gradient(to top, var(--bg-surface), transparent)',
                                height: '120px'
                            }}></div>
                            <button
                                onClick={() => setActiveVendor(null)}
                                style={{
                                    position: 'absolute', top: '15px', right: '15px',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    color: '#ffffff',
                                    width: '32px', height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    zIndex: 10
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left', marginTop: '-40px', zIndex: 2 }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                                    {activeVendor.name}
                                </h3>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.08)',
                                        padding: '4px 10px', borderRadius: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                                    }}>
                                        <i className="fas fa-tag"></i> {activeVendor.category}
                                    </span>
                                    <span style={{
                                        fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-surface-elevated)',
                                        padding: '4px 10px', borderRadius: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <i className="fas fa-map-marker-alt"></i> {activeVendor.city}
                                    </span>
                                    <span style={{
                                        fontSize: '0.75rem', color: '#eab308', background: 'rgba(234, 179, 8, 0.08)',
                                        padding: '4px 10px', borderRadius: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                                    }}>
                                        <i className="fas fa-star"></i> {activeVendor.rating || '5.0 Verified'}
                                    </span>
                                </div>
                            </div>

                            {/* About Section */}
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                    {activeVendor.description || `Top-rated ${activeVendor.category.toLowerCase()} professional providing premium wedding and event services in ${activeVendor.city}.`}
                                </p>
                            </div>

                            {/* Portfolio Gallery Section */}
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                                    Work Portfolio
                                </h4>
                                {activeVendor.portfolio && activeVendor.portfolio.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                                        {activeVendor.portfolio.map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setLightboxIndex(idx)}
                                                style={{
                                                    position: 'relative',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    aspectRatio: '4 / 3',
                                                    border: '1px solid var(--border-color)',
                                                    background: '#0a0a0c',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                                }}
                                                className="portfolio-thumb-card"
                                            >
                                                {item.type === 'video' ? (
                                                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                                        <video
                                                            src={item.url}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            muted
                                                            playsInline
                                                            preload="metadata"
                                                        />
                                                        <div style={{
                                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                            background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            zIndex: 2
                                                        }}>
                                                            <div className="video-play-btn" style={{
                                                                width: '32px', height: '32px', borderRadius: '50%',
                                                                background: 'rgba(255, 255, 255, 0.95)', display: 'flex',
                                                                alignItems: 'center', justifyContent: 'center', color: '#10b981',
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.2s'
                                                            }}>
                                                                <i className="fas fa-play" style={{ fontSize: '0.75rem', marginLeft: '2px' }}></i>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <img src={item.url} alt={`Work ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                )}
                                                <span style={{
                                                    position: 'absolute', bottom: '6px', left: '6px',
                                                    background: 'rgba(15, 23, 42, 0.75)', color: '#fff', fontSize: '0.55rem',
                                                    padding: '2px 6px', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase',
                                                    zIndex: 5, letterSpacing: '0.05em'
                                                }}>
                                                    {item.type}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{
                                        padding: '1.5rem',
                                        border: '1px dashed var(--border-color)',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        background: 'var(--bg-surface-elevated)'
                                    }}>
                                        <i className="fas fa-camera" style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}></i>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No work samples uploaded yet.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Slider for Images & Videos */}
            {lightboxIndex !== null && activeVendor && activeVendor.portfolio && activeVendor.portfolio[lightboxIndex] && (
                <div
                    onClick={() => setLightboxIndex(null)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(10, 10, 12, 0.95)',
                        backdropFilter: 'blur(15px)',
                        zIndex: 4000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        userSelect: 'none'
                    }}
                >
                    <button
                        onClick={() => setLightboxIndex(null)}
                        style={{
                            position: 'absolute', top: '25px', right: '25px',
                            background: 'rgba(255,255,255,0.1)', border: 'none', fontSize: '1.25rem',
                            color: '#fff', cursor: 'pointer', width: '44px', height: '44px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >
                        <i className="fas fa-times"></i>
                    </button>

                    {/* Previous Button */}
                    {activeVendor.portfolio.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(prev => prev > 0 ? prev - 1 : activeVendor.portfolio.length - 1);
                            }}
                            style={{
                                position: 'absolute', left: '25px',
                                background: 'rgba(255,255,255,0.1)', border: 'none', fontSize: '1.25rem',
                                color: '#fff', cursor: 'pointer', width: '50px', height: '50px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                    )}

                    {/* Main Content Item */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '90%',
                            maxHeight: '80vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}
                    >
                        {activeVendor.portfolio[lightboxIndex].type === 'video' ? (
                            <video
                                src={activeVendor.portfolio[lightboxIndex].url}
                                controls
                                autoPlay
                                playsInline
                                style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                            />
                        ) : (
                            <img
                                src={activeVendor.portfolio[lightboxIndex].url}
                                alt={`Work preview ${lightboxIndex}`}
                                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                            />
                        )}
                    </div>

                    {/* Next Button */}
                    {activeVendor.portfolio.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(prev => prev < activeVendor.portfolio.length - 1 ? prev + 1 : 0);
                            }}
                            style={{
                                position: 'absolute', right: '25px',
                                background: 'rgba(255,255,255,0.1)', border: 'none', fontSize: '1.25rem',
                                color: '#fff', cursor: 'pointer', width: '50px', height: '50px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    )}

                    {/* Navigation Counter */}
                    <div style={{
                        position: 'absolute', bottom: '30px',
                        background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.85rem',
                        padding: '6px 14px', borderRadius: '20px', fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        {lightboxIndex + 1} / {activeVendor.portfolio.length}
                    </div>
                </div>
            )}
        </section>
    );
};

// High-Converting Interactive Accordion FAQ Section
const FaqAccordion = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    const faqs = [
        {
            q: 'How fast can my digital invitation site go live?',
            a: 'Our Starter Package portals go live within 24 hours of Kwacha payment receipt and content submission. Standard and Premium bespoke portals are completed in 48-72 hours. We guarantee quick, flawless delivery.'
        },
        {
            q: 'Are uninvited gatecrashers able to access my RSVP page?',
            a: 'No. Our Standard and Premium plans feature exclusive invitation control methods. You can choose to lock RSVP submissions strictly to a predefined list of verified invitee names, limit responses to family-units, or issue secure PIN verification access codes.'
        },
        {
            q: 'Can I export my RSVPs to Excel or Google Sheets?',
            a: 'Absolutely. Real-time synchronisation with Google Sheets is configured as standard. You will have direct access to a live spreadsheet tracking all guest attendance, meal choices, and dietary requests with one-click Excel download capabilities.'
        },
        {
            q: 'How do guests receive their entry check-in QR codes?',
            a: 'For Premium Plan portals, upon completing their RSVP confirmation form on the mobile web page, guests automatically receive a unique gate pass ticket containing their QR code. This ticket is instantly downloadable and is also sent to their verified email desk.'
        },
        {
            q: 'What local payment methods do you support in Zambia?',
            a: 'To make coordinating straightforward, we support local payment channels. You can settle your Kwacha plan fees easily through Airtel Money transfers, MTN MoMo channels, or direct banking transfers to our FNB Zambia account.'
        }
    ];

    const toggleFaq = (idx) => {
        setActiveIndex(activeIndex === idx ? null : idx);
    };

    return (
        <section className="faq-section" id="faq-section">
            <div className="container">
                <div className="section-title-wrap">
                    <span className="sub-title">FREQUENT INQUIRIES</span>
                    <h2>Common Host & Event Questions</h2>
                    <p className="section-desc">
                        Everything you need to know about setting up bespoke digital invitations, guest list security, and RSVP coordination.
                    </p>
                </div>

                <div className="faq-accordion-wrapper">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className={`faq-item-card ${activeIndex === idx ? 'active' : ''}`}>
                            <div className="faq-header-row" onClick={() => toggleFaq(idx)}>
                                <h3>{faq.q}</h3>
                                <span className="faq-toggle-icon">
                                    <i className={`fas ${activeIndex === idx ? 'fa-minus' : 'fa-plus'}`}></i>
                                </span>
                            </div>
                            <div className="faq-answer-content">
                                <p>{faq.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Testimonials Component
const Testimonials = () => {
    return (
        <section className="testimonials" id="testimonials">
            <div className="container">
                <div className="section-title-wrap dark-section-title">
                    <span className="sub-title">HOST REVIEWS</span>
                    <h2>What Our Clients Say</h2>
                    <p className="section-desc">
                        Read verified responses from couples and event planners who coordinated celebrations at scale.
                    </p>
                </div>
                <div className="testimonials-grid">
                    <div className="testimonial-card">
                        <div className="testimonial-header">
                            <span className="quote-mark">“</span>
                            <div className="stars">
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                            </div>
                        </div>
                        <p className="testimonial-text">
                            "SaveMeASeat made our wedding planning stress-free! The RSVP management was incredibly clean and seamless, allowing us to lock in dietary preferences and guest lists accurately."
                        </p>
                        <div className="testimonial-author">
                            <h4>Sarah & Michael</h4>
                            <span>Wedding Couple | Lusaka</span>
                        </div>
                    </div>

                    <div className="testimonial-card">
                        <div className="testimonial-header">
                            <span className="quote-mark">“</span>
                            <div className="stars">
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                            </div>
                        </div>
                        <p className="testimonial-text">
                            "Extremely professional, lightweight, and custom-branded. Our tech summit invitation loaded instantly on mobile web, helping us track corporate attendees with precise accuracy."
                        </p>
                        <div className="testimonial-author">
                            <h4>David Mwale</h4>
                            <span>Corporate Director | Kitwe</span>
                        </div>
                    </div>

                    <div className="testimonial-card">
                        <div className="testimonial-header">
                            <span className="quote-mark">“</span>
                            <div className="stars">
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                            </div>
                        </div>
                        <p className="testimonial-text">
                            "An absolutely beautiful birthday invitation dashboard. Our guests were wowed by the gallery slider and gift registry details, and RSVP responses came in record time."
                        </p>
                        <div className="testimonial-author">
                            <h4>Grace Banda</h4>
                            <span>Birthday Celebration | Ndola</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Contact Component
const Contact = () => {
    const [formData, setFormData] = useState({
        user_name: '',
        user_email: '',
        user_phone: '',
        event_type: '',
        user_message: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Contact form submission details:', formData);
        alert('Thank you for getting in touch! Our design collective will contact you within 24 hours.');
        setFormData({
            user_name: '',
            user_email: '',
            user_phone: '',
            event_type: '',
            user_message: ''
        });
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <section className="contact" id="contact">
            <div className="container">
                <div className="section-title-wrap">
                    <span className="sub-title">INITIATE CONSULTATION</span>
                    <h2>Ready to Plan Your Event?</h2>
                    <p className="section-desc">
                        Our premium design team is ready to engineer a custom digital portal for your celebration.
                    </p>
                </div>

                <div className="contact-container">
                    <div className="contact-info-card">
                        <h3>Connect with Us</h3>
                        <p>
                            From initial layout wireframing to custom RSVP dashboards and live checkpoint check-in codes, we are here to support your coordinate pipeline.
                        </p>
                        <ul className="contact-details-list">
                            <li>
                                <div className="c-icon-wrap">
                                    <i className="fas fa-map-marker-alt"></i>
                                </div>
                                <div>
                                    <h4>Corporate Office</h4>
                                    <p>Lusaka, Zambia</p>
                                </div>
                            </li>
                            <li>
                                <div className="c-icon-wrap">
                                    <i className="fas fa-phone-alt"></i>
                                </div>
                                <div>
                                    <h4>Call or WhatsApp</h4>
                                    <p>+260 973 848 066</p>
                                </div>
                            </li>
                            <li>
                                <div className="c-icon-wrap">
                                    <i className="fas fa-envelope"></i>
                                </div>
                                <div>
                                    <h4>Email Desk</h4>
                                    <p>godwinbanda19@gmail.com</p>
                                </div>
                            </li>
                        </ul>
                        <div className="social-links-row">
                            <a href="https://godwinofficial.github.io/godwinbanda/" target="_blank" rel="noopener noreferrer" aria-label="Facebook Link">
                                <i className="fab fa-facebook-f"></i>
                            </a>
                            <a href="https://godwinofficial.github.io/godwinbanda/" target="_blank" rel="noopener noreferrer" aria-label="Twitter Link">
                                <i className="fab fa-twitter"></i>
                            </a>
                            <a href="https://godwinofficial.github.io/godwinbanda/" target="_blank" rel="noopener noreferrer" aria-label="Instagram Link">
                                <i className="fab fa-instagram"></i>
                            </a>
                            <a href="https://godwinofficial.github.io/godwinbanda/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn Link">
                                <i className="fab fa-linkedin-in"></i>
                            </a>
                        </div>
                    </div>
                    <div className="contact-form-card">
                        <form id="contact-form" onSubmit={handleSubmit}>
                            <div className="form-group-row">
                                <div className="form-group">
                                    <label htmlFor="user_name">Your Name</label>
                                    <input
                                        type="text"
                                        id="user_name"
                                        name="user_name"
                                        className="form-control-input"
                                        placeholder="Enter name"
                                        required
                                        value={formData.user_name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="user_email">Email Address</label>
                                    <input
                                        type="email"
                                        id="user_email"
                                        name="user_email"
                                        className="form-control-input"
                                        placeholder="name@domain.com"
                                        required
                                        value={formData.user_email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="form-group-row">
                                <div className="form-group">
                                    <label htmlFor="user_phone">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="user_phone"
                                        name="user_phone"
                                        className="form-control-input"
                                        placeholder="e.g. +260 97x xxxxxx"
                                        value={formData.user_phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="event_type">Event Type</label>
                                    <select
                                        id="event_type"
                                        name="event_type"
                                        className="form-control-select"
                                        required
                                        value={formData.event_type}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Event</option>
                                        <option value="Wedding">Wedding Celebration</option>
                                        <option value="Corporate Event">Corporate Summit</option>
                                        <option value="Birthday Party">Birthday Bash</option>
                                        <option value="Anniversary">Anniversary Event</option>
                                        <option value="Graduation">Graduation</option>
                                        <option value="Product Launch">Product Launch</option>
                                        <option value="Conference">Seminar/Conference</option>
                                        <option value="Other">Other Event</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="user_message">Tell Us About Your Vision</label>
                                <textarea
                                    id="user_message"
                                    name="user_message"
                                    className="form-control-textarea"
                                    placeholder="Brief details about invite theme, guest cap limit, food lists, timeline requirements..."
                                    required
                                    value={formData.user_message}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                            <button type="submit" className="contact-submit-btn">
                                Submit Invitation Inquiry
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Footer Component
const Footer = () => {
    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        alert('Thank you for subscribing! Stay tuned for beautiful invitation tips and styling releases.');
        e.target.reset();
    };

    return (
        <footer>
            <div className="container">
                <div className="footer-container">
                    <div className="footer-col brand-col">
                        <h3>SaveMeASeat</h3>
                        <p>
                            Zambia's premier digital invitation and RSVP management platform. Engineering beautiful guest entry gateways that operate seamlessly at scale.
                        </p>
                        <div className="social-links-footer">
                            <a href="#" aria-label="Facebook Link"><i className="fab fa-facebook-f"></i></a>
                            <a href="#" aria-label="Twitter Link"><i className="fab fa-twitter"></i></a>
                            <a href="#" aria-label="Instagram Link"><i className="fab fa-instagram"></i></a>
                        </div>
                    </div>
                    <div className="footer-col">
                        <h3>Quick Navigation</h3>
                        <ul className="footer-links-list">
                            <li><a href="#how-it-works">How It Works</a></li>
                            <li><a href="#pricing">Pricing Plans</a></li>
                            <li><a href="#payment">Kwacha Payment</a></li>
                            <li><a href="#contact">Contact Desk</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>Our Portals</h3>
                        <ul className="footer-links-list">
                            <li><a href="#services">Wedding Websites</a></li>
                            <li><a href="#services">Corporate RSVP summits</a></li>
                            <li><a href="#services">Birthday portals</a></li>
                            <li><a href="#services">Shower digital guides</a></li>
                            <li><a href="#services">Bespoke layouts</a></li>
                        </ul>
                    </div>
                    <div className="footer-col newsletter-col">
                        <h3>Subscribe to Design Insights</h3>
                        <p>Receive monthly digital invitation layouts, design inspiration, and special Kwacha package releases.</p>
                        <form className="newsletter-form-inline" onSubmit={handleNewsletterSubmit}>
                            <input type="email" placeholder="name@domain.com" className="newsletter-input" required />
                            <button type="submit" className="newsletter-btn">Join</button>
                        </form>
                    </div>
                </div>
                <div className="footer-bottom-row">
                    <p>
                        &copy; 2026 SaveMeASeat Zambia. All Rights Reserved. |
                        <a href="#" id="privacyPolicyLink"> Privacy Policy</a> |
                        <a href="#" id="termsServiceLink"> Terms of Service</a>
                    </p>
                    <p className="developer-tag">
                        Powered by <a href="https://www.lightstackgroup.com/" target="_blank" rel="noopener noreferrer">Lightstack Group</a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

// Main App Component
function App() {
    const [activePopup, setActivePopup] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // Smooth scroll effect for anchor links
    useEffect(() => {
        const handleAnchorClick = (e) => {
            const anchor = e.target.closest('a');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const element = document.querySelector(href);
                if (element) {
                    window.scrollTo({
                        top: element.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        };

        const privacyLink = document.getElementById('privacyPolicyLink');
        const termsLink = document.getElementById('termsServiceLink');

        if (privacyLink) privacyLink.onclick = (e) => { e.preventDefault(); setActivePopup('privacyPolicy'); };
        if (termsLink) termsLink.onclick = (e) => { e.preventDefault(); setActivePopup('termsService'); };

        document.addEventListener('click', handleAnchorClick);
        return () => document.removeEventListener('click', handleAnchorClick);
    }, []);

    const closePopup = () => {
        setActivePopup(null);
    };

    const openPackagePopup = (packageType) => {
        if (packageType === 'starter') setActivePopup('starterPackage');
        else if (packageType === 'silver') setActivePopup('silverPackage');
        else if (packageType === 'gold') setActivePopup('goldPackage');
        else if (packageType === 'platinum') setActivePopup('platinumPackage');
        else if (packageType === 'corporate') setActivePopup('corporatePackage');
    };

    return (
        <div className="home-page">
            <Header />
            <Hero />
            <WeddingTemplatesPreview />
            <Services />
            <TemplateShowcase onSelectTemplate={setSelectedTemplate} />
            <TrustCloud />
            <WhyChoose />
            <SavingsCalculator />
            <HowItWorks />
            <EntryGateway />
            <Pricing onOpenPackage={openPackagePopup} />
            <Payment />

            <VendorDirectory />
            <Testimonials />
            <FaqAccordion />
            <Contact />
            <Footer />
            <GlobalAIAgentWidget />

            {/* Live Template Mobile Preview Simulator Modal */}
            {selectedTemplate && (
                <MobileSimulatorModal
                    template={selectedTemplate}
                    onClose={() => setSelectedTemplate(null)}
                />
            )}

            {/* Popups Overlay */}
            <div className={`popup-overlay ${activePopup === 'privacyPolicy' ? 'active' : ''}`} id="privacyPolicyPopup" onClick={(e) => e.target.id === 'privacyPolicyPopup' && closePopup()}>
                <div className="popup-content">
                    <button className="popup-close" onClick={closePopup}>&times;</button>
                    <h3>Privacy Policy</h3>
                    <p>We respect your privacy. Your data is only used for RSVP management and will never be shared with third parties. For more details, contact us at info@lightstackgroup.com.</p>
                </div>
            </div>

            <div className={`popup-overlay ${activePopup === 'termsService' ? 'active' : ''}`} id="termsServicePopup" onClick={(e) => e.target.id === 'termsServicePopup' && closePopup()}>
                <div className="popup-content">
                    <button className="popup-close" onClick={closePopup}>&times;</button>
                    <h3>Terms of Service</h3>
                    <p>By using SaveMeASeat, you agree to use the service for lawful events only. All payments are final. For questions, contact us at info@lightstackgroup.com.</p>
                </div>
            </div>

            {/* Starter Package Modal */}
            <div className={`popup-overlay ${activePopup === 'starterPackage' ? 'active' : ''}`} id="starterPackagePopup" onClick={(e) => e.target.id === 'starterPackagePopup' && closePopup()}>
                <div className="popup-content package-popup">
                    <button className="popup-close" onClick={closePopup}>&times;</button>
                    <h3>Starter Package Specs</h3>
                    <p className="package-tagline">Premium Digital Invitation. Essential Features.</p>
                    <p className="package-description">Ideal for standard intimate celebrations for up to 100 guests. Share easily and track your seats instantly.</p>
                    <div className="package-section">
                        <h4>What You Get:</h4>
                        <ul>
                            <li>Premium digital invitation & event details page</li>
                            <li>RSVP tracking & WhatsApp sharing</li>
                            <li>Google Maps location integration</li>
                            <li>Interactive Countdown timer</li>
                            <li>1 free design/text revision included</li>
                            <li>Mobile-friendly clean layout</li>
                        </ul>
                    </div>
                    <div className="package-section">
                        <h4>Fulfill Process:</h4>
                        <ol>
                            <li>Select your theme preferences</li>
                            <li>Settle payment and share receipt proof via WhatsApp</li>
                            <li>Submit your event details and schedule</li>
                            <li>Your portal goes live within 24 hours for review</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Silver Package Modal */}
            <div className={`popup-overlay ${activePopup === 'silverPackage' ? 'active' : ''}`} id="silverPackagePopup" onClick={(e) => e.target.id === 'silverPackagePopup' && closePopup()}>
                <div className="popup-content package-popup">
                    <button className="popup-close" onClick={closePopup}>&times;</button>
                    <h3>Silver Package Specs</h3>
                    <p className="package-tagline">Everything in Starter, Plus Beautiful Media.</p>
                    <p className="package-description">Perfect for mid-sized events up to 200 guests with media, audio integration, and timeline schedule views.</p>
                    <div className="package-section">
                        <h4>What You Get:</h4>
                        <ul>
                            <li>Everything in Starter Package</li>
                            <li>Stunning image photo gallery panel</li>
                            <li>Elegant background music integration</li>
                            <li>Detailed event schedule/program section</li>
                            <li>3 free design/text revisions included</li>
                        </ul>
                    </div>
                    <div className="package-section">
                        <h4>Fulfill Process:</h4>
                        <ol>
                            <li>Choose your style and complete Kwacha payment</li>
                            <li>Share transaction confirmation screenshot on WhatsApp</li>
                            <li>Send event photos, music audio, and schedule details</li>
                            <li>Portal goes live within 24-48 hours for review</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Gold Package Modal */}
            <div className={`popup-overlay ${activePopup === 'goldPackage' ? 'active' : ''}`} id="goldPackagePopup" onClick={(e) => e.target.id === 'goldPackagePopup' && closePopup()}>
                <div className="popup-content package-popup">
                    <button className="popup-close" onClick={closePopup}>&times;</button>
                    <h3>Gold Package Specs</h3>
                    <p className="package-tagline">Tailored Customization. Unlimited Revisions.</p>
                    <p className="package-description">Our best-value plan for weddings and events up to 350 guests. Offers complete layout styling and registries.</p>
                    <div className="package-section">
                        <h4>What You Get:</h4>
                        <ul>
                            <li>Everything in Silver Package</li>
                            <li>Fully customized RSVP submission form</li>
                            <li>Guest lists categorization (VIP, Family, Friends)</li>
                            <li>Interactive gift registry section with links</li>
                            <li>Unlimited package design revisions</li>
                        </ul>
                    </div>
                    <div className="package-section">
                        <h4>Fulfill Process:</h4>
                        <ol>
                            <li>Book the Gold plan and transfer package fee</li>
                            <li>Provide payment receipt and design guide suggestions</li>
                            <li>Our designer creates your bespoke layout draft</li>
                            <li>Revision feedback is processed immediately with unlimited edits</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Platinum Package Modal */}
            <div className={`popup-overlay ${activePopup === 'platinumPackage' ? 'active' : ''}`} id="platinumPackagePopup" onClick={(e) => e.target.id === 'platinumPackagePopup' && closePopup()}>
                <div className="popup-content package-popup">
                    <button className="popup-close" onClick={closePopup}>&times;</button>
                    <h3>Platinum Package Specs</h3>
                    <p className="package-tagline">Bespoke Luxury. Security gate check-ins.</p>
                    <p className="package-description">Curated for high-profile weddings, large events, and elite celebrations up to 500 guests with unique QR Code tickets.</p>
                    <div className="package-section">
                        <h4>What You Get:</h4>
                        <ul>
                            <li>Everything in Gold Package</li>
                            <li>Personalized guest invitation sheets</li>
                            <li>Secure QR Code tickets generated for gate entry</li>
                            <li>Premium customized animations & visual layouts</li>
                            <li>Priority planning support & dedicated coordination desk</li>
                            <li>Advanced VIP guest management features</li>
                        </ul>
                    </div>
                    <div className="package-section">
                        <h4>Fulfill Process:</h4>
                        <ol>
                            <li>Book Platinum Package and complete FNB or MoMo transfer</li>
                            <li>Send proof via WhatsApp and connect with your dedicated designer</li>
                            <li>Provide guest list database for QR code generation</li>
                            <li>Luxury portal goes live in 48-72 hours with VIP features</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Corporate Package Modal */}
            <div className={`popup-overlay ${activePopup === 'corporatePackage' ? 'active' : ''}`} id="corporatePackagePopup" onClick={(e) => e.target.id === 'corporatePackagePopup' && closePopup()}>
                <div className="popup-content package-popup">
                    <button className="popup-close" onClick={closePopup}>&times;</button>
                    <h3>Corporate Package Specs</h3>
                    <p className="package-tagline">Professional Branding. Robust Event Analytics.</p>
                    <p className="package-description">A custom-built solution for corporate summits, product launches, banquets, and seminars.</p>
                    <div className="package-section">
                        <h4>What You Get:</h4>
                        <ul>
                            <li>Custom-branded event invitation portal</li>
                            <li>Complete corporate color scheme and identity assets</li>
                            <li>Multiple RSVP categories (VIP, general, media, speakers)</li>
                            <li>Advanced event registration analytics dashboard</li>
                            <li>Dedicated project manager & priority SLA support</li>
                            <li>Custom feature additions based on conference goals</li>
                        </ul>
                    </div>
                    <div className="package-section">
                        <h4>Fulfill Process:</h4>
                        <ol>
                            <li>Submit business requirements via email or WhatsApp</li>
                            <li>Receive a custom project quote and statement of work</li>
                            <li>Review prototype wireframes with branding assets</li>
                            <li>Live deployment with direct coordination dashboard access</li>
                        </ol>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default App;
