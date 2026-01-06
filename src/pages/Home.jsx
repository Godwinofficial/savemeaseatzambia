// App.jsx - Main Application Component
import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import sliderImage1 from '../assets/images/sliderImage1.jpg';
import sliderImage2 from '../assets/images/sliderImage2.jpg';
import sliderImage3 from '../assets/images/sliderImage3.jpg';
import logoImg from '../assets/images/logo1.png';
import weddingImg from '../assets/images/wedding.png';
import wedding2Img from '../assets/images/wedding2.jpg';
import corporateImg from '../assets/images/Business Meeting Invitation.png';
import birthdayImg from '../assets/images/Birthday Greeting Card.png';
import weddingInvitationCardImg from '../assets/images/Wedding Invitation Card.png';
import bridalShowerImg from '../assets/images/Bridal Shower Invitation.png';

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
                        style={{
                            height: '35px',
                            width: 'auto',
                            marginRight: '10px',
                            verticalAlign: 'middle'
                        }}
                    />
                </a>
                <button
                    className="mobile-menu-btn"
                    id="mobileMenuBtn"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                </button>
                <nav id="nav" className={isMenuOpen ? 'active' : ''}>
                    <ul>
                        <li><a href="#services" onClick={handleNavClick}>Services</a></li>
                        <li><a href="#templates" onClick={handleNavClick}>Templates</a></li>
                        <li><a href="#pricing" onClick={handleNavClick}>Pricing</a></li>
                        <li><a href="#how-it-works" onClick={handleNavClick}>How It Works</a></li>
                        <li><a href="#why-choose" onClick={handleNavClick}>Why Us</a></li>
                        <li><a href="#testimonials" onClick={handleNavClick}>Testimonials</a></li>
                        <li><a href="#contact" onClick={handleNavClick}>Contact</a></li>
                        <li><a href="#pricing" className="btn btn-outline" onClick={handleNavClick}>Get Started</a></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

// Hero Component with Slider
const Hero = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    const slideIntervalRef = useRef(null);
    const eventIntervalRef = useRef(null);

    const sliderImages = [sliderImage1, sliderImage2, sliderImage3];

    const eventTypes = [
        { text: 'Weddings', icon: 'fas fa-heart' },
        { text: 'Corporate Events', icon: 'fas fa-briefcase' },
        { text: 'Birthdays', icon: 'fas fa-birthday-cake' },
        { text: 'Anniversaries', icon: 'fas fa-gem' },
        { text: 'Celebrations', icon: 'fas fa-glass-cheers' }
    ];

    useEffect(() => {
        // Start slide interval
        slideIntervalRef.current = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % 3);
        }, 6000);

        // Start event type interval
        eventIntervalRef.current = setInterval(() => {
            setCurrentEventIndex(prev => (prev + 1) % eventTypes.length);
        }, 3000);

        return () => {
            if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
            if (eventIntervalRef.current) clearInterval(eventIntervalRef.current);
        };
    }, []);

    const handleSlideClick = (index) => {
        setCurrentSlide(index);
        if (slideIntervalRef.current) {
            clearInterval(slideIntervalRef.current);
            slideIntervalRef.current = setInterval(() => {
                setCurrentSlide(prev => (prev + 1) % 3);
            }, 6000);
        }
    };

    const handleSliderHover = (isHovering) => {
        if (isHovering) {
            if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
        } else {
            slideIntervalRef.current = setInterval(() => {
                setCurrentSlide(prev => (prev + 1) % 3);
            }, 6000);
        }
    };

    return (
        <section className="hero">
            <div
                className="hero-slider"
                onMouseEnter={() => handleSliderHover(true)}
                onMouseLeave={() => handleSliderHover(false)}
            >
                {sliderImages.map((img, index) => (
                    <div
                        key={index}
                        className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{
                            backgroundImage: `linear-gradient(135deg,
                ${index === 0 ? 'rgba(67, 97, 238, 0.4)' : index === 1 ? 'rgba(76, 201, 240, 0.4)' : 'rgba(247, 37, 133, 0.4)'},
                ${index === 0 ? 'rgba(247, 37, 133, 0.4)' : index === 1 ? 'rgba(67, 97, 238, 0.4)' : 'rgba(76, 201, 240, 0.4)'}),
                url(${img})`
                        }}
                    ></div>
                ))}
            </div>

            <div className="container">
                <div className="hero-content">
                    <h1>Premium Digital Invitations for Zambia</h1>
                    <div className="hero-subtitle">
                        Perfect for
                        <span className="event-type-animation">
                            {eventTypes.map((event, index) => (
                                <div
                                    key={index}
                                    className={`event-type ${index === currentEventIndex ? 'active' : ''}`}
                                    data-event={event.text.toLowerCase().replace(/\s+/g, '-')}
                                >
                                    <i className={event.icon}></i>
                                    {event.text}
                                </div>
                            ))}
                        </span>
                    </div>

                    <p className="hero-description">
                        Create stunning digital invitations that impress your guests. Beautiful designs, seamless RSVP management,
                        and unforgettable first impressions for your special events.
                    </p>

                    <div className="hero-buttons">
                        <a href="#templates" className="hero-btn primary">
                            <i className="fas fa-star"></i>View Templates
                        </a>
                        <a href="#pricing" className="hero-btn secondary">
                            <i className="fas fa-gem"></i>View Plans
                        </a>
                    </div>

                    <div className="hero-stats">
                        <div className="hero-stat">
                            <span className="hero-stat-number">1000+</span>
                            <span className="hero-stat-label">Invitations</span>
                        </div>
                        <div className="hero-stat">
                            <span className="hero-stat-number">50K+</span>
                            <span className="hero-stat-label">Guests</span>
                        </div>
                        <div className="hero-stat">
                            <span className="hero-stat-number">99%</span>
                            <span className="hero-stat-label">Satisfaction</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="slider-dots">
                {[0, 1, 2].map((index) => (
                    <button
                        key={index}
                        className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                        data-slide={index}
                        onClick={() => handleSlideClick(index)}
                    ></button>
                ))}
            </div>
        </section>
    );
};

// ServiceCard Component
const ServiceCard = ({ icon, title, description, features }) => (
    <div className="service-card">
        <div className="service-icon">
            <i className={icon}></i>
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
        <ul className="service-features">
            {features.map((feature, index) => (
                <li key={index}>{feature}</li>
            ))}
        </ul>
    </div>
);

// Services Component
const Services = () => {
    const services = [
        {
            icon: 'fas fa-envelope-open-text',
            title: 'Wedding Invitations',
            description: 'Elegant and romantic digital wedding invitations with RSVP management. Perfect for traditional and modern weddings with customizable designs.',
            features: [
                'Custom wedding designs',
                'RSVP management',
                'Guest list tracking',
                'Photo gallery integration',
                'Gift registry links'
            ]
        },
        {
            icon: 'fas fa-briefcase',
            title: 'Corporate Events',
            description: 'Professional digital invitations for conferences, seminars, product launches, and business meetings. Clean designs that reflect your brand.',
            features: [
                'Branded designs',
                'Professional templates',
                'Attendee management',
                'Agenda integration',
                'Corporate branding'
            ]
        },
        {
            icon: 'fas fa-birthday-cake',
            title: 'Birthday & Celebrations',
            description: 'Fun and colorful digital invitations for birthdays, anniversaries, and special celebrations. Interactive designs that excite your guests.',
            features: [
                'Fun themed designs',
                'Interactive elements',
                'Birthday wish collection',
                'Photo sharing',
                'Celebration timelines'
            ]
        },
        {
            icon: 'fas fa-heart',
            title: 'Anniversary Events',
            description: 'Beautiful digital invitations for anniversary celebrations and milestone events. Romantic designs that celebrate your journey together.',
            features: [
                'Romantic designs',
                'Memory sharing',
                'Timeline integration',
                'Photo galleries',
                'Guest messages'
            ]
        }
    ];

    return (
        <section className="services" id="services">
            <div className="container">
                <h2>Our Digital Invitation Services</h2>
                <p className="text-center mb-4">
                    Beautiful, customizable digital invitations that make your events unforgettable
                </p>
                <div className="services-grid">
                    {services.map((service, index) => (
                        <ServiceCard key={index} {...service} />
                    ))}
                </div>
            </div>
        </section>
    );
};

// WhyChoose Component
const WhyChoose = () => {
    const features = [
        {
            icon: 'fas fa-map-marked-alt',
            title: 'Local Expertise',
            description: 'Deep understanding of Zambian culture and celebrations for authentic, locally-relevant digital invitations.'
        },
        {
            icon: 'fas fa-palette',
            title: 'Beautiful Designs',
            description: 'Professional designers creating stunning digital invitations that impress your guests and match your event theme.'
        },
        {
            icon: 'fas fa-mobile-alt',
            title: 'Digital Innovation',
            description: 'Modern digital tools for invitations, RSVPs, and guest management with real-time updates and mobile-friendly designs.'
        },
        {
            icon: 'fas fa-heart',
            title: 'Personal Touch',
            description: 'Every invitation is unique. We provide personalized attention and custom solutions for your special celebration.'
        }
    ];

    return (
        <section className="why-choose" id="why-choose">
            <div className="container">
                <h2>Why Choose SaveMeASeat?</h2>
                <p className="text-center mb-4">
                    Zambia's trusted partner for beautiful digital invitations and RSVP management
                </p>
                <div className="why-features">
                    {features.map((feature, index) => (
                        <div key={index} className="why-feature-card">
                            <div className="why-feature-icon"><i className={feature.icon}></i></div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// HowItWorks Component
const HowItWorks = () => {
    const steps = [
        {
            number: '1',
            icon: 'fas fa-comments',
            title: 'Initial Consultation',
            description: 'We discuss your vision, budget, and requirements to create a personalized event plan that matches your dreams.'
        },
        {
            number: '2',
            icon: 'fas fa-calendar-alt',
            title: 'Planning & Coordination',
            description: 'Our team handles venue selection, vendor coordination, timeline creation, and all logistics planning.'
        },
        {
            number: '3',
            icon: 'fas fa-mobile-alt',
            title: 'Digital Invitations',
            description: 'We create beautiful digital invitations and RSVP pages, manage guest lists, and track responses in real-time.'
        },
        {
            number: '4',
            icon: 'fas fa-star',
            title: 'Perfect Execution',
            description: 'On your special day, we ensure everything runs smoothly with professional on-site coordination and support.'
        }
    ];

    return (
        <section className="how-it-works" id="how-it-works">
            <div className="container">
                <h2>How It Works</h2>
                <p className="text-center mb-4">
                    Our streamlined process makes event planning stress-free and enjoyable
                </p>
                <div className="steps">
                    {steps.map((step, index) => (
                        <div key={index} className="step">
                            <div className="step-number">{step.number}</div>
                            <i className={`${step.icon} step-icon`}></i>
                            <h3>{step.title}</h3>
                            <p>{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Templates Component
const Templates = () => {
    const templates = [
        {
            image: weddingImg,
            title: 'Elegant Wedding',
            description: 'Classic and elegant digital wedding invitation with RSVP management and guest tracking features.',
            link: 'https://www.savemeaseatzambia.com/wedding.html?slug=natasha-mike-2026-06-06',
            available: true
        },
        {
            image: wedding2Img,
            title: 'Modern Wedding',
            description: 'Contemporary wedding invitation design with interactive features and premium RSVP management.',
            link: 'http://www.savemeaseatzambia.com/wedding2.html?slug=dd-dd-2025-11-01',
            available: true
        },
        {
            image: corporateImg,
            title: 'Corporate Pro',
            description: 'Professional digital invitation for corporate events, conferences, and business meetings.',
            link: '#',
            available: false
        },
        {
            image: birthdayImg,
            title: 'Birthday Celebration',
            description: 'Fun and colorful digital invitation for birthday parties and special celebrations.',
            link: '#',
            available: false
        }
    ];

    const handleTemplateClick = (template, e) => {
        if (!template.available) {
            e.preventDefault();
            // Show popup logic here
            console.log('Template not available');
        }
    };

    return (
        <section className="templates" id="templates">
            <div className="container">
                <h2>Digital Invitation Templates</h2>
                <p className="text-center mb-4">
                    Beautiful, customizable digital invitation templates for all types of events
                </p>
                <div className="gallery">
                    {templates.map((template, index) => (
                        <div key={index} className="template-card">
                            <div className="template-image">
                                <img src={template.image} alt={template.title} />
                            </div>
                            <div className="template-info">
                                <h3>{template.title}</h3>
                                <p>{template.description}</p>
                                <a
                                    href={template.link}
                                    className="btn"
                                    onClick={(e) => handleTemplateClick(template, e)}
                                >
                                    Preview Template
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ECards Component
const ECards = ({ onOpenEcardPopup }) => {
    const [category, setCategory] = useState('all');

    const ecardsData = [
        {
            id: 1,
            title: "Wedding Invitation Card",
            category: "wedding",
            description: "Elegant floral wedding invitation, perfect for your special day.",
            image: weddingInvitationCardImg
        },
        {
            id: 2,
            title: "Birthday Greeting Card",
            category: "birthday",
            description: "Colorful and fun birthday greeting card for all ages.",
            image: birthdayImg
        },
        {
            id: 3,
            title: "Bridal Shower Invitation",
            category: "wedding",
            description: "Chic and modern bridal shower invitation card.",
            image: bridalShowerImg
        },
        {
            id: 4,
            title: "Business Meeting Invitation",
            category: "corporate",
            description: "Professional invitation card for business meetings and events.",
            image: corporateImg
        }
    ];

    const filteredCards = category === 'all' ? ecardsData : ecardsData.filter(card => card.category === category);
    const ECARD_PRICE = 'ZMW 350';

    return (
        <section className="ecards-section" id="ecards">
            <div className="container">
                <h2>Beautiful E-Cards</h2>
                <p className="text-center mb-4">Select from our premium collection of digital greeting cards for every special occasion. Perfect for any celebration!</p>
                <div className="ecards-tabs" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                    {['all', 'wedding', 'birthday', 'corporate'].map(cat => (
                        <button
                            key={cat}
                            className={`btn btn-outline ecard-tab-btn ${category === cat ? 'active' : ''}`}
                            onClick={() => setCategory(cat)}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {cat === 'all' ? 'All Cards' : cat}
                        </button>
                    ))}
                </div>
                <div className="gallery" id="ecardsGallery">
                    {filteredCards.map(card => (
                        <div key={card.id} className={`template-card ${card.category}`} style={{ position: 'relative', opacity: 1, transform: 'translateY(0)' }}>
                            <div className="template-image"><img src={card.image} alt={card.title} /></div>
                            <div className="template-info">
                                <h3>{card.title}</h3>
                                <p>{card.description}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="price" style={{ fontSize: '1.2rem', background: 'none', WebkitTextFillColor: 'unset', color: 'var(--primary)' }}>{ECARD_PRICE}</span>
                                    <button
                                        className="btn view-ecard-btn"
                                        style={{ marginLeft: '10px' }}
                                        onClick={() => onOpenEcardPopup(card)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// PricingCard Component
const PricingCard = ({ title, price, features, popular, packageType, onOpenPackage }) => {
    const handleViewPackage = (e) => {
        e.preventDefault();
        onOpenPackage(packageType);
    };

    return (
        <div className={`pricing-card ${popular ? 'popular' : ''}`}>
            {popular && <div className="popular-badge">Most Popular</div>}
            <h3>{title}</h3>
            <div className="price">{price}<span>/invitation</span></div>
            <ul className="pricing-features">
                {features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                ))}
            </ul>
            <a href="#" className="btn view-package" data-package={packageType} onClick={handleViewPackage}>
                View Plan
            </a>
        </div>
    );
};

// Pricing Component
const Pricing = ({ onOpenPackage }) => {
    const plans = [
        {
            title: 'Starter Plan',
            price: 'ZMW 750',
            features: [
                'Beautiful digital invitation',
                'Up to 250 guests',
                'Standard template design',
                'Basic RSVP tracking',
                'Mobile-friendly design'
            ],
            popular: false,
            packageType: 'standard'
        },
        {
            title: 'Standard Plan',
            price: 'ZMW 1600',
            features: [
                'Custom digital invitation',
                'Up to 800 guests',
                'Premium template designs',
                'Advanced RSVP management',
                'Guest list tracking',
                'Photo gallery integration'
            ],
            popular: true,
            packageType: 'custom'
        },
        {
            title: 'Premium Plan',
            price: 'ZMW 2500',
            features: [
                'Luxury custom invitation',
                'Unlimited guests',
                'Bespoke design & branding',
                'Advanced RSVP features',
                'Multi-page invitation website',
                'Video integration',
                'Priority support'
            ],
            popular: false,
            packageType: 'custom-plus'
        }
    ];

    return (
        <section className="pricing" id="pricing">
            <div className="container">
                <h2>Digital Invitation Plans</h2>
                <p className="text-center mb-4">Flexible plans designed to meet your digital invitation needs</p>
                <div className="pricing-plans">
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
                <h2>Payment Methods</h2>
                <p className="text-center mb-4">
                    Secure payment options available in Zambian Kwacha
                </p>
                <div className="payment-methods">
                    <div className="payment-method">
                        <i className="fas fa-mobile-alt"></i>
                        <div>
                            <h4>Mobile Money</h4>
                            <p>Airtel</p>
                        </div>
                    </div>
                    <div className="payment-method">
                        <i className="fas fa-university"></i>
                        <div>
                            <h4>Bank Transfer</h4>
                            <p>FNB Zambia</p>
                        </div>
                    </div>
                </div>
                <div className="payment-details">
                    <h3>How to Complete Your Payment</h3>
                    <p>
                        Select your preferred payment method above and follow these
                        instructions:
                    </p>
                    <p><strong>Account Name:</strong> Godwin Banda</p>
                    <p><strong>Mobile Money (Airtel):</strong> +260973848066</p>
                    <p>
                        <strong>Bank Details:</strong> FNB | Account #63149798184 | Branch:
                        Lusaka Main
                    </p>
                    <p>
                        After payment, send proof to WhatsApp
                        <strong><a href="https://wa.me/260973848066" target="_blank"
                            style={{ color: 'var(--primary)', textDecoration: 'none', marginLeft: '5px' }}>+260973848066</a></strong>
                        with your event information.
                    </p>
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
                        <div className="stat-number">500+</div>
                        <div className="stat-label">Events Managed</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">50,000+</div>
                        <div className="stat-label">Happy Guests</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">98%</div>
                        <div className="stat-label">Client Satisfaction</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">5+</div>
                        <div className="stat-label">Years Experience</div>
                    </div>
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
                <h2>What Our Clients Say</h2>
                <p className="text-center mb-4">
                    Don't just take our word for it - hear from our satisfied clients
                </p>
                <div className="testimonials-grid">
                    <div className="testimonial-card">
                        <div className="testimonial-content">
                            <p>"SaveMeASeat made our wedding planning stress-free! Their digital invitations were beautiful and the RSVP
                                management was seamless. Highly recommended!"</p>
                        </div>
                        <div className="testimonial-author">
                            <div className="author-info">
                                <h4>Sarah & Michael</h4>
                                <span>Wedding Couple</span>
                            </div>
                        </div>
                    </div>

                    <div className="testimonial-card">
                        <div className="testimonial-content">
                            <p>"Professional, reliable, and creative. They handled our corporate conference perfectly from start to
                                finish. The team is exceptional!"</p>
                        </div>
                        <div className="testimonial-author">
                            <div className="author-info">
                                <h4>David Mwale</h4>
                                <span>Corporate Client</span>
                            </div>
                        </div>
                    </div>

                    <div className="testimonial-card">
                        <div className="testimonial-content">
                            <p>"Amazing birthday party planning! They created the perfect theme and everything was executed flawlessly.
                                Our guests loved it!"</p>
                        </div>
                        <div className="testimonial-author">
                            <div className="author-info">
                                <h4>Grace Banda</h4>
                                <span>Birthday Celebration</span>
                            </div>
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
        // EmailJS submission logic here
        console.log('Form submitted:', formData);
        // Reset form
        setFormData({
            user_name: '',
            user_email: '',
            user_phone: '',
            event_type: '',
            user_message: ''
        });
        alert('Thank you! Your message has been sent.');
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
                <h2>Get In Touch</h2>
                <div className="contact-container">
                    <div className="contact-info">
                        <h3>Ready to Plan Your Event?</h3>
                        <p>
                            Our experienced team is ready to help you create the perfect event experience.
                            From initial consultation to final execution, we're here to make your vision a reality.
                            Reach out and we'll respond within 24 hours.
                        </p>
                        <ul className="contact-details">
                            <li>
                                <i className="fas fa-map-marker-alt"></i>
                                <div>
                                    <h4>Our Office</h4>
                                    <p>Lusaka, Zambia</p>
                                </div>
                            </li>
                            <li>
                                <i className="fas fa-phone-alt"></i>
                                <div>
                                    <h4>Call Us</h4>
                                    <p>+260973848066</p>
                                </div>
                            </li>
                            <li>
                                <i className="fas fa-envelope"></i>
                                <div>
                                    <h4>Email Us</h4>
                                    <p>godwinbanda19@gmail.com</p>
                                </div>
                            </li>
                        </ul>
                        <div className="social-links">
                            <a href="https://godwinofficial.github.io/godwinbanda/" target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-facebook-f"></i>
                            </a>
                            <a href="https://godwinofficial.github.io/godwinbanda/" target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-twitter"></i>
                            </a>
                            <a href="https://godwinofficial.github.io/godwinbanda/" target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-instagram"></i>
                            </a>
                            <a href="https://godwinofficial.github.io/godwinbanda/" target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-linkedin-in"></i>
                            </a>
                        </div>
                    </div>
                    <div className="contact-form">
                        <form id="contact-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="user_name"
                                    className="form-control"
                                    placeholder="Your Name"
                                    required
                                    value={formData.user_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="email"
                                    name="user_email"
                                    className="form-control"
                                    placeholder="Email Address"
                                    required
                                    value={formData.user_email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="tel"
                                    name="user_phone"
                                    className="form-control"
                                    placeholder="Phone Number"
                                    value={formData.user_phone}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <select
                                    name="event_type"
                                    className="form-control"
                                    required
                                    value={formData.event_type}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Event Type</option>
                                    <option value="Wedding">Wedding</option>
                                    <option value="Corporate Event">Corporate Event</option>
                                    <option value="Birthday Party">Birthday Party</option>
                                    <option value="Anniversary">Anniversary</option>
                                    <option value="Graduation">Graduation</option>
                                    <option value="Product Launch">Product Launch</option>
                                    <option value="Conference">Conference</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <textarea
                                    name="user_message"
                                    className="form-control"
                                    placeholder="Tell us about your event vision, budget, and requirements..."
                                    required
                                    value={formData.user_message}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                            <button type="submit" className="btn">Send Message</button>
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
        // Newsletter subscription logic here
        alert('Thank you for subscribing!');
        e.target.reset();
    };

    return (
        <footer>
            <div className="container">
                <div className="footer-container">
                    <div className="footer-col">
                        <h3>SaveMeASeat</h3>
                        <p>
                            Zambia's premier digital invitation platform. Creating beautiful digital invitations with RSVP management
                            and seamless guest experience for all your special events.
                        </p>
                        <div className="social-links">
                            <a href="#"><i className="fab fa-facebook-f"></i></a>
                            <a href="#"><i className="fab fa-twitter"></i></a>
                            <a href="#"><i className="fab fa-instagram"></i></a>
                        </div>
                    </div>
                    <div className="footer-col">
                        <h3>Quick Links</h3>
                        <ul className="footer-links">
                            <li><a href="#how-it-works">How It Works</a></li>
                            <li><a href="#templates">Templates</a></li>
                            <li><a href="#pricing">Pricing</a></li>
                            <li><a href="#payment">Payment</a></li>
                            <li><a href="#contact">Contact</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>Services</h3>
                        <ul className="footer-links">
                            <li><a href="#services">Wedding Invitations</a></li>
                            <li><a href="#services">Corporate Events</a></li>
                            <li><a href="#services">Birthday & Celebrations</a></li>
                            <li><a href="#services">Anniversary Events</a></li>
                            <li><a href="#templates">Digital Templates</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>Newsletter</h3>
                        <p>Subscribe for digital invitation tips, design inspiration, and special offers.</p>
                        <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                            <div className="form-group">
                                <input type="email" placeholder="Your Email" className="form-control" required />
                            </div>
                            <button type="submit" className="btn">Subscribe</button>
                        </form>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>
                        &copy; 2025 SaveMeASeat. All Rights Reserved. |
                        <a href="#" id="privacyPolicyLink">Privacy Policy</a> |
                        <a href="#" id="termsServiceLink">Terms of Service</a><br />
                        Developed by
                        <a href="https://godwinofficial.github.io/godwinbanda/" target="_blank" rel="noopener noreferrer"
                            style={{ color: '#4cc9f0', marginLeft: '5px' }}>Godwin Banda</a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

// Main App Component
function App() {
    const [activePopup, setActivePopup] = useState(null);
    const [selectedEcard, setSelectedEcard] = useState(null);

    // Smooth scroll effect for anchor links
    useEffect(() => {
        const handleAnchorClick = (e) => {
            const href = e.target.getAttribute('href');
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
        setSelectedEcard(null);
    };

    const openEcardPopup = (card) => {
        setSelectedEcard(card);
        setActivePopup('ecardDetails');
    };

    const openPackagePopup = (packageType) => {
        if (packageType === 'standard') setActivePopup('standardPackage');
        else if (packageType === 'custom') setActivePopup('customPackage');
        else if (packageType === 'custom-plus') setActivePopup('customPlusPackage');
    };

    return (
        <div className="home-page">
            <Header />
            <Hero />
            <Services />
            <WhyChoose />
            <HowItWorks />
            <Templates />
            <ECards onOpenEcardPopup={openEcardPopup} />
            <Pricing onOpenPackage={openPackagePopup} />
            <Payment />
            <Statistics />
            <Testimonials />
            <Contact />
            <Footer />

            {/* Popups */}
            <div className={`popup-overlay ${activePopup === 'privacyPolicy' ? 'active' : ''}`} id="privacyPolicyPopup" onClick={(e) => e.target.id === 'privacyPolicyPopup' && closePopup()}>
                <div className="popup-content">
                    <button className="popup-close" onClick={closePopup}>&times;</button>
                    <h3>Privacy Policy</h3>
                    <p>We respect your privacy. Your data is only used for RSVP management and will never be shared with third parties. For more details, contact us at godwinbanda19@gmail.com.</p>
                </div>
            </div>

            <div className={`popup-overlay ${activePopup === 'termsService' ? 'active' : ''}`} id="termsServicePopup" onClick={(e) => e.target.id === 'termsServicePopup' && closePopup()}>
                <div className="popup-content">
                    <button className="popup-close" onClick={closePopup}>&times;</button>
                    <h3>Terms of Service</h3>
                    <p>By using SaveMeASeat, you agree to use the service for lawful events only. All payments are final. For questions, contact us at godwinbanda19@gmail.com.</p>
                </div>
            </div>

            <div className={`popup-overlay ${activePopup === 'standardPackage' ? 'active' : ''}`} id="standardPackagePopup">
                <div className="popup-content package-popup">
                    <button className="popup-close" onClick={closePopup}>&times;</button>
                    <h3>Digital Package</h3>
                    <p className="package-tagline">Digital Excellence. Real Results.</p>
                    <p className="package-description">Perfect for events that need beautiful digital presence. Our Digital Package delivers stunning invitations and RSVP pages using our curated templates — fast, beautiful, and easy to share with your guests.</p>
                    <div className="package-section">
                        <h4>What You Get:</h4>
                        <ul>
                            <li>One-page digital invite or RSVP page</li>
                            <li>Choose from a selection of designer templates</li>
                            <li>Custom event link (e.g. savemeaseatzambia.com/benandlisa)</li>
                            <li>Downloadable program card included in RSVP confirmation</li>
                            <li>Guest list tracked in a Google Sheet</li>
                            <li>Open or closed RSVP option</li>
                            <li>Some templates include gallery or map</li>
                            <li>2 free edit rounds (extra changes: K300 per round)</li>
                        </ul>
                    </div>
                    <div className="package-section">
                        <h4>How It Works:</h4>
                        <ol>
                            <li>Choose Your Template</li>
                            <li>Pay & Send Receipt via WhatsApp or Email</li>
                            <li>Fill Out Event Info via Short Form</li>
                            <li>Your Page Goes Live in 24 Hours</li>
                            <li>You Review & Request Up to 2 Changes</li>
                        </ol>
                    </div>
                </div>
            </div>

            <div className={`popup-overlay ${activePopup === 'customPackage' ? 'active' : ''}`} id="customPackagePopup">
                <div className="popup-content package-popup">
                    <button className="popup-close" onClick={closePopup}>&times;</button>
                    <h3>Planning Package</h3>
                    <p className="package-tagline">Complete Planning. Perfect Execution.</p>
                    <p className="package-description">For hosts who want comprehensive event planning with personal touch. We handle everything from venue selection to vendor coordination — ensuring your event is perfectly executed.</p>
                    <div className="package-section">
                        <h4>What You Get:</h4>
                        <ul>
                            <li>Custom-designed single-page RSVP or invite</li>
                            <li>Personalized planning call with our team</li>
                            <li>Event link like savemeaseatzambia.com/emmaandpatrick</li>
                            <li>Guest list managed in real-time via Google Sheets</li>
                            <li>Optional: dress code, gift info, gallery, location, downloads</li>
                            <li>Open or private RSVP</li>
                            <li>2 free edit rounds (extra changes: K300 per round)</li>
                        </ul>
                    </div>
                    <div className="package-section">
                        <h4>How It Works:</h4>
                        <ol>
                            <li>Book the Custom Package</li>
                            <li>Pay & Send Proof</li>
                            <li>Complete Our Form</li>
                            <li>Hop on a Quick Planning Call</li>
                            <li>We Build and Launch Your Page Within 48 Hours</li>
                            <li>You Get 2 Free Revisions</li>
                        </ol>
                    </div>
                </div>
            </div>

            <div className={`popup-overlay ${activePopup === 'customPlusPackage' ? 'active' : ''}`} id="customPlusPackagePopup">
                <div className="popup-content package-popup">
                    <button className="popup-close" onClick={closePopup}>&times;</button>
                    <h3>Premium Package</h3>
                    <p className="package-tagline">Luxury Experience. Unforgettable Events.</p>
                    <p className="package-description">Ideal for premium events, large celebrations, or when you want the complete luxury experience. This comprehensive package includes everything from planning to execution with premium services.</p>
                    <div className="package-section">
                        <h4>What You Get:</h4>
                        <ul>
                            <li>Multi-page custom RSVP or invitation website</li>
                            <li>Unlimited guests and responses</li>
                            <li>Personalized layout and strategy call</li>
                            <li>Custom link (e.g. savemeaseatzambia.com/thekundaunion2025)</li>
                            <li>Sections for: Agenda, Travel, Gift Registry</li>
                            <li>Photo Galleries, Maps, Videos</li>
                            <li>Downloads, FAQs, and more</li>
                            <li>Google Sheet for live guest tracking</li>
                            <li>Open or invite-only registration</li>
                            <li>2 edit rounds included (K300 for each extra)</li>
                        </ul>
                    </div>
                    <div className="package-section">
                        <h4>How It Works:</h4>
                        <ol>
                            <li>Confirm Your Custom Plus Booking</li>
                            <li>Make Payment & Share Proof</li>
                            <li>Submit Event Info via Form</li>
                            <li>Join a Planning Call with Our Team</li>
                            <li>Your Website Goes Live in 48 Hours</li>
                            <li>Refinements? You Get 2 Free</li>
                        </ol>
                    </div>
                </div>
            </div>

            <div className={`popup-overlay ${activePopup === 'ecardDetails' ? 'active' : ''}`} id="ecardDetailsPopup" onClick={(e) => e.target.id === 'ecardDetailsPopup' && closePopup()}>
                {selectedEcard && (
                    <div className="popup-content package-popup" style={{ maxWidth: '500px' }}>
                        <button className="popup-close" onClick={closePopup} style={{ top: '8px', right: '10px' }}>&times;</button>
                        <div id="ecardDetailsContent">
                            <div style={{ textAlign: 'center' }}>
                                <img src={selectedEcard.image} alt={selectedEcard.title} style={{ maxWidth: '100%', borderRadius: '10px', marginBottom: '1.2rem' }} />
                            </div>
                            <h3 style={{ marginBottom: '0.5rem' }}>{selectedEcard.title}</h3>
                            <div style={{ color: 'var(--gray)', marginBottom: '1.2rem' }}>{selectedEcard.description}</div>
                            <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '1.2rem' }}>ZMW 350</div>
                            <div style={{ fontSize: '0.98rem', color: 'var(--dark)', marginBottom: '1.2rem' }}>
                                To order, contact us via WhatsApp <a href="https://wa.me/260973848066" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>+260973848066</a>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

export default App;