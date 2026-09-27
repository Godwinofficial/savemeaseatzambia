import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/images/logo1.png';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('overview');

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = 'Privacy Policy | SaveMeASeat Zambia';

        const handleScroll = () => {
            const sections = document.querySelectorAll('.privacy-section');
            let current = 'overview';
            const scrollPos = window.scrollY + 140;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                    current = section.id;
                }
            });
            setActiveSection(current);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const offset = 90;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            setActiveSection(id);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const sections = [
        { id: 'overview', title: '1. Introduction & Overview', icon: 'fa-info-circle' },
        { id: 'collection', title: '2. Information We Collect', icon: 'fa-database' },
        { id: 'email-communications', title: '3. Email Sending & Notifications', icon: 'fa-envelope-open-text', highlight: true },
        { id: 'usage', title: '4. How We Use Personal Data', icon: 'fa-cogs' },
        { id: 'organizers-role', title: '5. Event Hosts as Data Controllers', icon: 'fa-user-tie' },
        { id: 'third-parties', title: '6. Third-Party Infrastructure & Sharing', icon: 'fa-share-alt' },
        { id: 'security', title: '7. Data Security & Encryption', icon: 'fa-shield-alt' },
        { id: 'retention', title: '8. Data Retention & Deletion', icon: 'fa-trash-alt' },
        { id: 'user-rights', title: '9. Your Legal Rights (Zambia Act)', icon: 'fa-balance-scale' },
        { id: 'cookies', title: '10. Cookies & Local Storage', icon: 'fa-cookie-bite' },
        { id: 'children', title: '11. Children’s Privacy', icon: 'fa-child' },
        { id: 'contact', title: '12. Contact Desk & Inquiries', icon: 'fa-headset' },
    ];

    return (
        <div className="privacy-page">
            {/* Top Navigation Bar */}
            <header className="privacy-header">
                <div className="privacy-header-container">
                    <Link to="/" className="privacy-logo-link" title="SaveMeASeat Home">
                        <img src={logoImg} alt="SaveMeASeat Zambia" className="privacy-logo-img" />
                    </Link>

                    <div className="privacy-nav-actions">
                        <Link to="/" className="privacy-btn-outline">
                            <i className="fas fa-arrow-left"></i> Back to Home
                        </Link>
                        <a
                            href="https://wa.me/260960968349?text=Hello%20SaveMeASeat,%20I%20have%20a%20question%20regarding%20privacy%20and%20data."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="privacy-btn-primary"
                        >
                            <i className="fab fa-whatsapp"></i> Support
                        </a>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="privacy-hero">
                <div className="privacy-hero-badge">
                    <i className="fas fa-lock"></i> Official Privacy Policy & Transparency Notice
                </div>
                <h1 className="privacy-hero-title">SaveMeASeat Privacy Policy</h1>
                <p className="privacy-hero-subtitle">
                    Learn how SaveMeASeat Zambia collects, processes, and protects personal information,
                    including how we communicate and dispatch transactional emails to guests and event hosts.
                </p>

                <div className="privacy-meta-bar">
                    <div className="privacy-meta-item">
                        <i className="far fa-calendar-alt"></i>
                        <span>Effective Date: <strong>September 2026</strong></span>
                    </div>
                    <div className="privacy-meta-item">
                        <i className="fas fa-shield-alt"></i>
                        <span>Jurisdiction: <strong>Republic of Zambia Data Protection Act No. 3 of 2021</strong></span>
                    </div>
                    <div className="privacy-meta-item">
                        <i className="fas fa-building"></i>
                        <span>Operator: <strong>Lightstack Group / SaveMeASeat</strong></span>
                    </div>
                </div>
            </section>

            {/* Quick Action Toolbar */}
            <div className="privacy-toolbar">
                <div className="privacy-search-box">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Search policy (e.g., 'email', 'RSVP', 'delete', 'cookies')..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                            &times;
                        </button>
                    )}
                </div>

                <div className="privacy-tool-actions">
                    <button className="privacy-tool-btn" onClick={handlePrint}>
                        <i className="fas fa-print"></i> Print Document
                    </button>
                    <a href="#email-communications" onClick={(e) => scrollToSection(e, 'email-communications')} className="privacy-tool-btn" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                        <i className="fas fa-envelope"></i> Email Policy
                    </a>
                </div>
            </div>

            {/* Main Layout */}
            <div className="privacy-container">
                {/* Table of Contents Sticky Sidebar */}
                <aside className="privacy-sidebar">
                    <div className="privacy-sidebar-title">Table of Contents</div>
                    <ul className="privacy-nav-list">
                        {sections.map((sec) => (
                            <li
                                key={sec.id}
                                className={`privacy-nav-item ${activeSection === sec.id ? 'highlight' : ''}`}
                            >
                                <a href={`#${sec.id}`} onClick={(e) => scrollToSection(e, sec.id)}>
                                    <i className={`fas ${sec.icon}`}></i>
                                    <span>{sec.title}</span>
                                </a>
                            </li>
                        ))}
                    </ul>

                    <div className="privacy-sidebar-cta">
                        <p>Questions about your data or email preferences?</p>
                        <a
                            href="mailto:contact.savemeaseatzambia@gmail.com?subject=Privacy%20Inquiry%20-%20SaveMeASeat"
                            className="privacy-btn-outline"
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            <i className="fas fa-envelope"></i> Contact DPO
                        </a>
                    </div>
                </aside>

                {/* Content Area */}
                <main className="privacy-content">
                    {/* Executive Summary Card */}
                    <div className="privacy-summary-card">
                        <div className="privacy-summary-header">
                            <i className="fas fa-user-shield"></i>
                            <h2>At a Glance: Our Privacy Commitment</h2>
                        </div>
                        <p>
                            SaveMeASeat Zambia is dedicated to safeguarding the personal information of event hosts,
                            celebrants, and invited guests. We operate on principles of privacy-by-design, data minimization,
                            and total transparency. We <strong>never sell, rent, or monetize</strong> guest contact lists,
                            and we only dispatch emails that are directly necessary for event coordination, attendance verification,
                            and host management.
                        </p>
                        <div className="privacy-summary-pills">
                            <div className="privacy-summary-pill"><i className="fas fa-check-circle"></i> Zero Third-Party Advertising</div>
                            <div className="privacy-summary-pill"><i className="fas fa-check-circle"></i> SSL/TLS End-to-End Encryption</div>
                            <div className="privacy-summary-pill"><i className="fas fa-check-circle"></i> Transparent Email Dispatch</div>
                            <div className="privacy-summary-pill"><i className="fas fa-check-circle"></i> Zambia Data Protection Act Compliant</div>
                        </div>
                    </div>

                    {/* Section 1: Overview */}
                    <section className="privacy-section" id="overview">
                        <div className="privacy-section-header">
                            <div className="privacy-section-icon"><i className="fas fa-info-circle"></i></div>
                            <h2>1. Introduction & Overview</h2>
                        </div>
                        <p>
                            Welcome to <strong>SaveMeASeat Zambia</strong> (accessible at <a href="https://savemeaseatzambia.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>savemeaseatzambia.com</a> and related subdomains), an event invitation and RSVP management platform operated by <strong>Lightstack Group</strong> in Lusaka, Zambia.
                        </p>
                        <p>
                            This Privacy Policy sets out how we collect, handle, store, and protect personal data collected from individuals who:
                        </p>
                        <ul className="privacy-list">
                            <li>Create, customize, and manage digital invitations (referred to as <strong>"Event Hosts"</strong> or <strong>"Organizers"</strong>).</li>
                            <li>View event pages, respond to invitations, or submit RSVPs (referred to as <strong>"Guests"</strong>, <strong>"Attendees"</strong>, or <strong>"Invitees"</strong>).</li>
                            <li>Browse our public websites, explore template designs, or contact our customer support desk (referred to as <strong>"Visitors"</strong>).</li>
                        </ul>
                        <p>
                            By accessing or using our services, creating an event, or submitting an RSVP form, you acknowledge that you have read and understood this Privacy Policy.
                        </p>
                    </section>

                    {/* Section 2: Information We Collect */}
                    <section className="privacy-section" id="collection">
                        <div className="privacy-section-header">
                            <div className="privacy-section-icon"><i className="fas fa-database"></i></div>
                            <h2>2. Information We Collect</h2>
                        </div>
                        <p>
                            Depending on how you interact with SaveMeASeat, we collect specific categories of personal data:
                        </p>

                        <div className="privacy-grid-2">
                            <div className="privacy-subcard">
                                <div className="privacy-subcard-title">
                                    <i className="fas fa-user-edit"></i> From Event Hosts
                                </div>
                                <p>
                                    Full name, email address, password hash, phone or WhatsApp number, event metadata (celebrant names, wedding dates, banquet times, venue coordinates, love story narratives, dress codes, gift registry links, photo gallery uploads), and payment confirmation references.
                                </p>
                            </div>

                            <div className="privacy-subcard">
                                <div className="privacy-subcard-title">
                                    <i className="fas fa-envelope-open-text"></i> From Guests (RSVP Data)
                                </div>
                                <p>
                                    Guest full name, email address, mobile/WhatsApp telephone number, RSVP attendance response (Attending, Declined, Waitlist), plus-one companion names, dietary restrictions/allergies, personal notes to the hosts, and entry check-in status (including QR code scan records).
                                </p>
                            </div>
                        </div>

                        <div className="privacy-subcard" style={{ marginTop: '16px' }}>
                            <div className="privacy-subcard-title">
                                <i className="fas fa-laptop-code"></i> Technical & Diagnostic Information
                            </div>
                            <p>
                                Internet Protocol (IP) addresses, browser type, device operating system, referring URLs, timestamps of RSVP submissions, and session identifiers necessary for security monitoring and preventing abusive automated submissions.
                            </p>
                        </div>
                    </section>

                    {/* Section 3: EMAIL POLICY - HIGHLIGHTED DEEP-DIVE */}
                    <section className="privacy-section featured-email-section" id="email-communications">
                        <div className="featured-email-badge">
                            <i className="fas fa-envelope-check"></i> Critical Transparency Notice
                        </div>
                        <div className="privacy-section-header">
                            <div className="privacy-section-icon" style={{ background: 'var(--primary)', color: '#fff' }}>
                                <i className="fas fa-paper-plane"></i>
                            </div>
                            <h2>3. Sending Emails & Electronic Communications to Users</h2>
                        </div>

                        <p>
                            A core functionality of SaveMeASeat is keeping hosts and guests synchronized before, during, and after celebrations.
                            To deliver this service, <strong>we send automated, transactional, and organizer-initiated electronic communications (primarily email)</strong>.
                            Below is our comprehensive, transparent breakdown of every email type sent, recipient triggers, and safeguards in place.
                        </p>

                        <h3><i className="fas fa-list-alt"></i> Categories of Emails Dispatched</h3>

                        <div className="privacy-table-wrapper">
                            <table className="privacy-table">
                                <thead>
                                    <tr>
                                        <th>Email Type</th>
                                        <th>Intended Recipient</th>
                                        <th>Trigger / Frequency</th>
                                        <th>Purpose & Content Included</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <strong>RSVP Confirmation Receipt</strong><br />
                                            <span className="privacy-tag transactional">Transactional</span>
                                        </td>
                                        <td>Invited Guest / Attendee</td>
                                        <td>Immediately upon submitting an RSVP response</td>
                                        <td>
                                            Confirms successful reservation; includes event date, ceremony/reception start time, venue address with Google Maps directions, host notes, and guest count confirmation.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Host Approval Notice</strong><br />
                                            <span className="privacy-tag transactional">Transactional</span>
                                        </td>
                                        <td>Invited Guest / Attendee</td>
                                        <td>Triggered by Event Host via dashboard approval</td>
                                        <td>
                                            Notifies the guest that their attendance or seat allocation has been confirmed by the couple/organizer, with final itinerary details.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Waitlist / Removal Notice</strong><br />
                                            <span className="privacy-tag transactional">Transactional</span>
                                        </td>
                                        <td>Invited Guest / Attendee</td>
                                        <td>Triggered if a host updates attendance or cancels a seat</td>
                                        <td>
                                            Informs the guest of updated capacity constraints or confirms their voluntary cancellation to keep records accurate.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Event Countdown Reminders</strong><br />
                                            <span className="privacy-tag reminder">Operational Reminder</span>
                                        </td>
                                        <td>Confirmed Attendees</td>
                                        <td>Pre-scheduled (e.g. 7 days or 24 hours before the event)</td>
                                        <td>
                                            Sent on behalf of the host with parking guidance, dress code reminders, weather notices, or last-minute schedule adjustments.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Digital Pass / QR Entry Code</strong><br />
                                            <span className="privacy-tag transactional">Transactional</span>
                                        </td>
                                        <td>Confirmed Attendees (Platinum/Corporate)</td>
                                        <td>Pre-event or upon RSVP confirmation</td>
                                        <td>
                                            Contains unique cryptographic QR code ticket for physical gate check-in and allocated table/seat number.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Host Account & Security</strong><br />
                                            <span className="privacy-tag admin">Administrative</span>
                                        </td>
                                        <td>Registered Event Host</td>
                                        <td>Account creation, password reset, draft sync</td>
                                        <td>
                                            Email address verification links, password recovery tokens, notification when guests RSVP, and invoice/receipt confirmations.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Product Updates & Newsletter</strong><br />
                                            <span className="privacy-tag marketing">Optional Marketing</span>
                                        </td>
                                        <td>Subscribed Users / Hosts</td>
                                        <td>Occasional (approx. 1 per month)</td>
                                        <td>
                                            Digital invitation trends, new template releases, and special Kwacha package deals. Always includes a 1-click unsubscribe option.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <h3><i className="fas fa-server"></i> Email Delivery Infrastructure & Security</h3>
                        <p>
                            All emails from SaveMeASeat are transmitted through verified mail routing infrastructure (including authenticated Google Workspace SMTP and hardened server relays using Nodemailer/API gateways).
                        </p>
                        <ul className="privacy-list">
                            <li><strong>Encrypted in Transit:</strong> Every outbound email connection utilizes Transport Layer Security (TLS/SSL) encryption.</li>
                            <li><strong>Sender Authentication:</strong> Outbound emails are authenticated with industry standards (SPF, DKIM, DMARC) to prevent phishing, spoofing, or unauthorized impersonation.</li>
                            <li><strong>Sender Identity:</strong> Emails will arrive from an authorized SaveMeASeat domain (e.g., <code>notifications@savemeaseatzambia.com</code> or authorized relays), clearly displaying the event couple's or host's name in the sender banner.</li>
                        </ul>

                        <div className="privacy-alert info">
                            <i className="fas fa-shield-alt"></i>
                            <div className="privacy-alert-content">
                                <strong>Strict Anti-Spam Commitment</strong>
                                We treat guest contact information as strictly confidential. SaveMeASeat <strong>never</strong> sells, rents, or licenses guest email addresses to third-party marketers, advertisers, or lead brokers. Guests will <strong>never</strong> receive unsolicited commercial offers through their RSVP submission.
                            </div>
                        </div>

                        <h3><i className="fas fa-sliders-h"></i> User Choices & Managing Email Preferences</h3>
                        <p>
                            We respect your inbox and provide clear options to control electronic correspondence:
                        </p>
                        <ul className="privacy-list">
                            <li><strong>Marketing Unsubscribe:</strong> Every promotional email includes an instant "Unsubscribe" link in the footer. Clicking this immediately suppresses promotional mailings to that address.</li>
                            <li><strong>Event Reminder Opt-Out:</strong> If an attendee wishes to stop receiving reminder emails for a specific event, they may reply directly to the email, contact the event host, or email our support desk at <a href="mailto:contact.savemeaseatzambia@gmail.com" style={{ color: 'var(--primary)' }}>contact.savemeaseatzambia@gmail.com</a>.</li>
                            <li><strong>Essential Transactional Mail:</strong> Certain emails (such as password recovery links, system security warnings, or immediate receipts) are essential for account security and service performance; these cannot be opted out of while maintaining an active host account.</li>
                        </ul>
                    </section>

                    {/* Section 4: How We Use Personal Data */}
                    <section className="privacy-section" id="usage">
                        <div className="privacy-section-header">
                            <div className="privacy-section-icon"><i className="fas fa-cogs"></i></div>
                            <h2>4. How We Use Personal Data</h2>
                        </div>
                        <p>
                            SaveMeASeat uses personal data solely for the following legitimate business and contractual purposes:
                        </p>
                        <ul className="privacy-list">
                            <li><strong>Invitation Hosting & Deployment:</strong> Generating unique digital invitation web portals with custom countdown timers, story galleries, directions, and dress codes.</li>
                            <li><strong>RSVP Collection & Real-Time Analytics:</strong> Aggregating headcount counts, dietary preferences, and seating allocations for the host's private dashboard.</li>
                            <li><strong>Gate Check-In & Verification:</strong> Validating QR code entry passes on event days to ensure secure, private access for invited guests only.</li>
                            <li><strong>Communication Delivery:</strong> Transmitting the event updates and transactional notifications described in Section 3.</li>
                            <li><strong>Platform Security & Abuse Prevention:</strong> Detecting fraudulent registrations, spam submissions, or unauthorized system access.</li>
                            <li><strong>Customer Service:</strong> Assisting hosts with template customizations, package activations, and troubleshooting via email or WhatsApp.</li>
                        </ul>
                    </section>

                    {/* Section 5: Event Hosts as Data Controllers */}
                    <section className="privacy-section" id="organizers-role">
                        <div className="privacy-section-header">
                            <div className="privacy-section-icon"><i className="fas fa-user-tie"></i></div>
                            <h2>5. Event Hosts as Data Controllers</h2>
                        </div>
                        <p>
                            Under data protection law, an important distinction exists between SaveMeASeat and the Event Host:
                        </p>
                        <div className="privacy-alert highlight">
                            <i className="fas fa-info-circle"></i>
                            <div className="privacy-alert-content">
                                <strong>Controller vs. Processor Relationship</strong>
                                The <strong>Event Host</strong> is the primary Data Controller of their event guest list. SaveMeASeat acts as the <strong>Data Processor</strong> providing the software platform and infrastructure to capture and manage those entries on the host's behalf.
                            </div>
                        </div>
                        <p>
                            By using SaveMeASeat, Event Hosts agree to:
                        </p>
                        <ul className="privacy-list">
                            <li>Only invite individuals with whom they have a genuine social or professional relationship.</li>
                            <li>Treat guest contact information (emails, phone numbers, dietary details) strictly confidentially.</li>
                            <li>Refrain from exporting guest lists for unauthorized marketing, commercial solicitation, or non-event purposes.</li>
                            <li>Promptly honor any guest's request to be removed from their attendee list.</li>
                        </ul>
                    </section>

                    {/* Section 6: Third-Party Infrastructure */}
                    <section className="privacy-section" id="third-parties">
                        <div className="privacy-section-header">
                            <div className="privacy-section-icon"><i className="fas fa-share-alt"></i></div>
                            <h2>6. Third-Party Infrastructure & Service Providers</h2>
                        </div>
                        <p>
                            To maintain a world-class, high-availability platform, we engage reputable third-party cloud infrastructure providers who adhere to strict data security standards:
                        </p>

                        <div className="privacy-grid-2">
                            <div className="privacy-subcard">
                                <div className="privacy-subcard-title">
                                    <i className="fas fa-database"></i> Supabase (Cloud Database)
                                </div>
                                <p>
                                    Hosts our encrypted PostgreSQL database and authentication engine. Uses Row-Level Security (RLS) to ensure data separation.
                                </p>
                            </div>

                            <div className="privacy-subcard">
                                <div className="privacy-subcard-title">
                                    <i className="fas fa-envelope"></i> Google Workspace SMTP / Mail Relays
                                </div>
                                <p>
                                    Provides authenticated SMTP transport for real-time delivery of transactional RSVP confirmations and reminder notices.
                                </p>
                            </div>

                            <div className="privacy-subcard">
                                <div className="privacy-subcard-title">
                                    <i className="fas fa-map-marked-alt"></i> Google Maps Platform
                                </div>
                                <p>
                                    Enables interactive venue maps and GPS location pins so guests can navigate easily to ceremonies and receptions.
                                </p>
                            </div>

                            <div className="privacy-subcard">
                                <div className="privacy-subcard-title">
                                    <i className="fab fa-whatsapp"></i> WhatsApp Business (Meta)
                                </div>
                                <p>
                                    Powers direct click-to-chat links for customer support, quick consultation, and host-guest messaging links.
                                </p>
                            </div>
                        </div>
                        <p>
                            We do not share your information with any other third parties except when compelled by lawful process, court order, or regulatory obligation under the laws of Zambia.
                        </p>
                    </section>

                    {/* Section 7: Security */}
                    <section className="privacy-section" id="security">
                        <div className="privacy-section-header">
                            <div className="privacy-section-icon"><i className="fas fa-shield-alt"></i></div>
                            <h2>7. Data Security & Technical Measures</h2>
                        </div>
                        <p>
                            We employ multi-layered technical and organizational safeguards to protect data against unauthorized access, loss, or alteration:
                        </p>
                        <ul className="privacy-list">
                            <li><strong>Encryption in Transit:</strong> 256-bit SSL/TLS HTTPS encryption enforces secure connections across every page, API request, and email transmission.</li>
                            <li><strong>Database Row-Level Security (RLS):</strong> Granular database policies guarantee that an event organizer can only query and view the guest list of their own events.</li>
                            <li><strong>Credential Hashing:</strong> Passwords are never stored in plaintext; they are hashed using one-way cryptographic algorithms.</li>
                            <li><strong>Vulnerability Monitoring:</strong> Routine system updates, environment isolation, and continuous auditing to mitigate security risks.</li>
                        </ul>
                    </section>

                    {/* Section 8: Retention */}
                    <section className="privacy-section" id="retention">
                        <div className="privacy-section-header">
                            <div className="privacy-section-icon"><i className="fas fa-trash-alt"></i></div>
                            <h2>8. Data Retention & Account Deletion</h2>
                        </div>
                        <p>
                            We retain personal data only as long as necessary to fulfill event management objectives and comply with statutory legal requirements:
                        </p>
                        <ul className="privacy-list">
                            <li><strong>Event Life-Cycle:</strong> Event details and guest RSVP responses remain accessible to the host throughout planning and for a reasonable archival period post-event.</li>
                            <li><strong>Host Deletion Rights:</strong> Organizers can delete specific guest records or entire event workspaces directly from the dashboard.</li>
                            <li><strong>Guest Erasure Requests:</strong> Any attendee who wishes to have their RSVP record and email address permanently purged from our databases can email <a href="mailto:contact.savemeaseatzambia@gmail.com" style={{ color: 'var(--primary)' }}>contact.savemeaseatzambia@gmail.com</a>; we will fulfill verification and deletion within 7 business days.</li>
                        </ul>
                    </section>

                    {/* Section 9: Legal Rights */}
                    <section className="privacy-section" id="user-rights">
                        <div className="privacy-section-header">
                            <div className="privacy-section-icon"><i className="fas fa-balance-scale"></i></div>
                            <h2>9. Your Legal Rights (Zambia Data Protection Act)</h2>
                        </div>
                        <p>
                            Under the <strong>Republic of Zambia Data Protection Act No. 3 of 2021</strong>, and in alignment with international privacy standards, you are entitled to:
                        </p>
                        <ul className="privacy-list">
                            <li><strong>Right of Access:</strong> Request a copy of the personal information we hold about you.</li>
                            <li><strong>Right to Rectification:</strong> Request correction of inaccurate, incomplete, or outdated personal details.</li>
                            <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request total deletion of your personal records and email contact history.</li>
                            <li><strong>Right to Restrict or Object to Processing:</strong> Object to specific types of processing, including marketing correspondence.</li>
                            <li><strong>Right to Data Portability:</strong> Event hosts have the right to export their guest lists in standardized formats (CSV/Excel) at any time.</li>
                        </ul>
                        <p>
                            To exercise any of these statutory rights, please contact our Data Protection Officer at <a href="mailto:contact.savemeaseatzambia@gmail.com" style={{ color: 'var(--primary)', fontWeight: 600 }}>contact.savemeaseatzambia@gmail.com</a>.
                        </p>
                    </section>

                    {/* Section 10: Cookies */}
                    <section className="privacy-section" id="cookies">
                        <div className="privacy-section-header">
                            <div className="privacy-section-icon"><i className="fas fa-cookie-bite"></i></div>
                            <h2>10. Cookies & Local Browser Storage</h2>
                        </div>
                        <p>
                            SaveMeASeat uses minimal, privacy-friendly storage technologies:
                        </p>
                        <ul className="privacy-list">
                            <li><strong>Authentication Sessions:</strong> Secure tokens stored to keep logged-in hosts authenticated while managing their events.</li>
                            <li><strong>Draft Preservation (LocalStorage):</strong> Temporary storage of draft invitation selections so work is not lost if a browser window is refreshed prior to account creation.</li>
                            <li><strong>No Third-Party Advertising Trackers:</strong> We do not deploy third-party advertising cookies or cross-site tracking pixels that follow your activity across the internet.</li>
                        </ul>
                    </section>

                    {/* Section 11: Children */}
                    <section className="privacy-section" id="children">
                        <div className="privacy-section-header">
                            <div className="privacy-section-icon"><i className="fas fa-child"></i></div>
                            <h2>11. Children’s Privacy</h2>
                        </div>
                        <p>
                            SaveMeASeat is designed for adult event hosts, coordinators, and adult attendees. We do not knowingly solicit or collect personal information directly from children under the age of 16. In the context of family events (such as weddings or birthday celebrations) where children are attendees, their attendance count or meal requirements must be submitted by their parent or legal guardian.
                        </p>
                    </section>

                    {/* Section 12: Contact Desk */}
                    <section className="privacy-section" id="contact">
                        <div className="privacy-section-header">
                            <div className="privacy-section-icon"><i className="fas fa-headset"></i></div>
                            <h2>12. Contact Desk & Inquiries</h2>
                        </div>
                        <p>
                            If you have any questions, concerns, or requests regarding this Privacy Policy, your personal data, or our email notification procedures, please reach out through our official communication channels:
                        </p>

                        <div className="privacy-contact-box">
                            <h3 style={{ margin: '0 0 12px 0', color: 'var(--dark)' }}>SaveMeASeat Zambia / Lightstack Group</h3>
                            <p style={{ margin: 0, color: 'var(--gray)', fontSize: '0.9rem' }}>
                                Lusaka, Republic of Zambia
                            </p>

                            <div className="privacy-contact-grid">
                                <a href="mailto:contact.savemeaseatzambia@gmail.com" className="privacy-contact-card">
                                    <i className="fas fa-envelope"></i>
                                    <div className="privacy-contact-card-info">
                                        <h4>Email Desk</h4>
                                        <p style={{ wordBreak: 'break-all' }}>contact.savemeaseatzambia@gmail.com</p>
                                    </div>
                                </a>

                                <a href="https://wa.me/260960968349" target="_blank" rel="noreferrer" className="privacy-contact-card">
                                    <i className="fab fa-whatsapp"></i>
                                    <div className="privacy-contact-card-info">
                                        <h4>WhatsApp Hotline</h4>
                                        <p>+260 960 968 349</p>
                                    </div>
                                </a>

                                <div className="privacy-contact-card">
                                    <i className="fas fa-map-marker-alt"></i>
                                    <div className="privacy-contact-card-info">
                                        <h4>Headquarters</h4>
                                        <p>Lusaka, Zambia</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>

            {/* Standard Footer */}
            <footer style={{ background: '#090a15', color: '#f8fafc', padding: '60px 24px 30px 24px', borderTop: '1px solid #1e293b' }}>
                <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', paddingBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                            <img src={logoImg} alt="SaveMeASeat" style={{ height: '38px', filter: 'brightness(0) invert(1)' }} />
                        </Link>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <a href="mailto:contact.savemeaseatzambia@gmail.com" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>
                                <i className="fas fa-envelope" style={{ marginRight: 6 }}></i> contact.savemeaseatzambia@gmail.com
                            </a>
                            <a href="https://wa.me/260960968349" target="_blank" rel="noreferrer" style={{ color: '#25D366', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
                                <i className="fab fa-whatsapp" style={{ marginRight: 6 }}></i> WhatsApp Desk
                            </a>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '24px', fontSize: '0.85rem', color: '#64748b' }}>
                        <p style={{ margin: 0 }}>
                            &copy; 2026 SaveMeASeat Zambia. All Rights Reserved.
                        </p>
                        <p style={{ margin: 0 }}>
                            Powered by <a href="https://www.lightstackgroup.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>Lightstack Group</a>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PrivacyPolicy;
