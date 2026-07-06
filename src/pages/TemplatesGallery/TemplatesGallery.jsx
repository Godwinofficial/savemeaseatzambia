import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/images/logo1.png';
import '../../pages/Home/Home.css';

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
                <Link to="/" className="logo">
                    <img
                        src={logoImg}
                        alt="SaveMeASeat Logo"
                        className="logo-img"
                    />
                </Link>
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
                        <li><Link to="/#services" onClick={handleNavClick}>Services</Link></li>
                        <li><Link to="/#template-showcase" onClick={handleNavClick}>Showcase</Link></li>
                        <li><Link to="/#why-choose" onClick={handleNavClick}>Core Pillars</Link></li>
                        <li><Link to="/#how-it-works" onClick={handleNavClick}>Process</Link></li>
                        <li><Link to="/#pricing" onClick={handleNavClick}>Plans</Link></li>
                        <li><Link to="/#payment" onClick={handleNavClick}>Payment</Link></li>
                        <li><Link to="/#faq-section" onClick={handleNavClick}>FAQ</Link></li>
                        <li><Link to="/#contact" onClick={handleNavClick}>Contact</Link></li>
                        <li><Link to="/templates" onClick={handleNavClick} style={{ color: 'var(--primary)' }}>Templates</Link></li>
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

const Footer = () => {
    return (
        <footer className="footer">
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
                            <li><Link to="/#how-it-works">How It Works</Link></li>
                            <li><Link to="/#pricing">Pricing Plans</Link></li>
                            <li><Link to="/#payment">Kwacha Payment</Link></li>
                            <li><Link to="/#contact">Contact Desk</Link></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>Our Portals</h3>
                        <ul className="footer-links-list">
                            <li><Link to="/#services">Wedding Websites</Link></li>
                            <li><Link to="/#services">Corporate RSVP summits</Link></li>
                            <li><Link to="/#services">Birthday portals</Link></li>
                            <li><Link to="/#services">Shower digital guides</Link></li>
                            <li><Link to="/#services">Bespoke layouts</Link></li>
                        </ul>
                    </div>
                    <div className="footer-col newsletter-col">
                        <h3>Subscribe to Design Insights</h3>
                        <p>Receive monthly digital invitation layouts, design inspiration, and special Kwacha package releases.</p>
                        <form className="newsletter-form-inline" onSubmit={(e) => e.preventDefault()}>
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

const TemplateHorizontalCard = ({ template }) => {
    const p = template.preview;

    return (
        <div className="vendor-horizontal-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <div className="vhc-header" style={{ margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3>{template.name}</h3>
                    {template.isPopular && <span className="v-row-badge-popular">★ Popular</span>}
                    {template.isNew && <span className="v-row-badge-new">New</span>}
                </div>
                <p style={{
                    whiteSpace: 'normal',
                    lineHeight: '1.5',
                    marginTop: '8px'
                }}>
                    {`Premium custom ${template.name.toLowerCase()} invitation with RSVP tracking.`}
                </p>
            </div>

            <div className="vhc-pill-bar">
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
                    <span style={{ fontSize: '1rem', fontFamily: p.fontFamily, fontWeight: 'bold' }}>
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

const TemplatesGallery = () => {
    return (
        <div className="home-page" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <Header />

            <style>{`
                .v-row-btn-preview {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 20px;
                    border-radius: 50px;
                    background: #fff;
                    border: 1px solid #cbd5e1;
                    color: #334155;
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.15s ease;
                }
                .v-row-btn-preview:hover {
                    background: #f8fafc;
                    border-color: #94a3b8;
                }
                .v-row-btn-select {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 24px;
                    border-radius: 50px;
                    background: #10b981;
                    border: none;
                    color: #fff;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.15s ease;
                    box-shadow: 0 2px 6px rgba(16, 185, 129, 0.15);
                }
                .v-row-btn-select:hover {
                    background: #059669;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
                }
                @media (max-width: 768px) {
                    .v-row-right {
                        display: flex;
                        width: 100%;
                        gap: 10px;
                    }
                    .v-row-btn-preview, .v-row-btn-select {
                        flex: 1;
                        justify-content: center;
                        font-size: 0.75rem;
                        padding: 10px 12px;
                    }
                }
            `}</style>

            {/* Hero Section */}
            <section className="hero modern-hero" style={{ minHeight: 'auto', padding: '110px 0 40px 0', borderBottom: '1px solid var(--light-gray)' }}>
                <div className="hero-mesh-bg"></div>
                <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    <span className="hero-badge animate-fade-in-up" style={{ display: 'inline-block', marginBottom: '16px' }}>
                        Premium Wedding Layouts
                    </span>
                    <h1 className="animate-fade-in-up delay-1" style={{ fontSize: '2.5rem', marginBottom: '15px', lineHeight: 1.2 }}>
                        Digital Wedding <span className="highlight-text">Invitation Templates</span>
                    </h1>
                    <p className="hero-subtitle animate-fade-in-up delay-2" style={{ maxWidth: '650px', margin: '0 auto', fontSize: '1rem', color: 'var(--gray)' }}>
                        Select a template to view the live responsive preview. All themes include a digital RSVP dashboard, Google Maps locations, registries, and custom music settings.
                    </p>
                </div>
            </section>

            {/* Templates List Section with Padding container to prevent touching screen edges */}
            <section style={{ padding: '50px 0 100px 0' }}>
                <div className="container">
                    <div className="vendors-grid-list" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        {ALL_TEMPLATES.map((template) => (
                            <TemplateHorizontalCard key={template.id} template={template} />
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default TemplatesGallery;
