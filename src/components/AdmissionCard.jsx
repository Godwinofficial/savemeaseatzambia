import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

export default function AdmissionCard({ rsvp, wedding }) {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = React.useState(false);

    const downloadCard = async () => {
        if (!cardRef.current || isGenerating) return;

        setIsGenerating(true);

        // Small delay to ensure rendering is stable
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const element = cardRef.current;
            const canvas = await html2canvas(element, {
                scale: 2, // 2x resolution for printing/sharing
                backgroundColor: null, // Transparent to keep the card's actual background
                useCORS: true,
                logging: false,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.querySelector('.card-wrapper');
                    if (clonedElement) {
                        clonedElement.style.display = 'block';
                        // Keep the actual background and styles exactly as seen
                    }
                }
            });

            // Use toDataURL with JPEG for better compatibility on iOS
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

            const link = document.createElement('a');
            link.download = `${wedding.groom_name || 'Groom'}_${wedding.bride_name || 'Bride'}_Admission_Card.jpg`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setIsGenerating(false);

        } catch (error) {
            console.error('Error generating card:', error);
            // Fallback: Try opening in new tab if download fails (common iOS restriction)
            try {
                const element = cardRef.current;
                const canvas = await html2canvas(element, {
                    scale: 1, // Minimal scale for fallback
                    backgroundColor: '#ffffff',
                    useCORS: true
                });
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

                // Try to trigger download again with lower quality
                const link = document.createElement('a');
                link.download = 'admission_card_fallback.jpg';
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            } catch (fallbackError) {
                alert(`Failed to save card. Please take a screenshot instead.`);
            }
            setIsGenerating(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString, timeString) => {
        if (timeString) {
            // If already formatted with AM/PM, just return it
            if (timeString.includes(' AM') || timeString.includes(' PM') || timeString.includes('AM') || timeString.includes('PM')) {
                return timeString;
            }

            const [hours, minutes] = timeString.split(':');
            const date = new Date();
            date.setHours(parseInt(hours, 10));
            date.setMinutes(parseInt(minutes, 10));
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }
        // Fallback to date string if time string is missing but date has time
        if (dateString && dateString.includes('T')) {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }
        return '';
    };

    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.split(' ')[0];
    };

    return (
        <div className="admission-card-container">
            <div className="card-wrapper" ref={cardRef}>
                {/* Decorative Elements */}
                <div className="card-frame"></div>
                <div className="corner corner-tl"></div>
                <div className="corner corner-tr"></div>
                <div className="corner corner-bl"></div>
                <div className="corner corner-br"></div>

                <div className="card-content">
                    {/* Header Section */}
                    <div className="card-header-premium">
                        <span className="subtitle-invitation">An Invitation To</span>
                        <div className="wedding-pretitle">The Marriage Of</div>
                        <h1 className="couple-names-luxe">
                            <span className="name-wrap">{getFirstName(wedding.couple?.bride?.name || wedding.bride_name)}</span>
                            <span className="ampersand-stylized">&</span>
                            <span className="name-wrap">{getFirstName(wedding.couple?.groom?.name || wedding.groom_name)}</span>

                        </h1>
                    </div>

                    {/* Guest Section */}
                    <div className="guest-section-elegant">
                        <div className="invitation-ornament">
                            <span className="line"></span>
                            <i className="fas fa-heart ornament-icon"></i>
                            <span className="line"></span>
                        </div>
                        <div className="guest-title">To Our Dearest Guest</div>
                        <div className="guest-name-luxe">{rsvp.name}</div>
                        <div className="admission-pill">
                            Admit {rsvp.guests_count} {rsvp.guests_count === 1 ? 'Guest' : 'Guests'}
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="details-stack">
                        <div className="detail-row">
                            <div className="detail-cell">
                                <span className="label">Date</span>
                                <span className="value">{formatDate(wedding.date)}</span>
                            </div>
                            <div className="detail-cell divider-vertical">
                                <span className="label">Time</span>
                                <span className="value">
                                    {wedding.ceremony?.time
                                        ? formatTime(null, wedding.ceremony.time)
                                        : formatTime(wedding.date, null)}
                                </span>
                            </div>
                        </div>

                        <div className="venue-cell">
                            <span className="label">Venue</span>
                            <span className="value-prominent">{wedding.venue?.name || wedding.venue_name}</span>
                            <span style={{ padding: 10 }} className="subvalue">We’re delighted to share this special moment with you. Your presence truly means a lot to us.</span>
                        </div>
                    </div>

                    {/* Footer / Status */}
                    <div className="card-footer-luxury">
                        <div className="status-badge-seal">
                            <span className="seal-text">Confirmed</span>
                        </div>
                        <p className="footer-memo">Please present this card for priority entry</p>
                    </div>
                </div>
            </div>

            {/* Download Button */}
            <button className="download-btn" onClick={downloadCard}>
                <i className="fas fa-download"></i>
                Download Card
            </button>

            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@300;400;500;600&display=swap');

                .admission-card-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 25px;
                    font-family: 'Montserrat', sans-serif;
                }

                .card-wrapper {
                    width: 480px;
                    background: #FFFDF5 !important;
                    background-image: linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), 
                                      url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
                    border-radius: 8px;
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(166, 138, 100, 0.1);
                    padding: 40px;
                    position: relative;
                    color: #2c2c2c !important;
                    overflow: hidden;
                    border: 1px solid rgba(166, 138, 100, 0.1);
                }

                .card-frame {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    bottom: 20px;
                    border: 2px solid #D4AF37;
                    pointer-events: none;
                }

                .card-frame::after {
                    content: '';
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    right: 4px;
                    bottom: 4px;
                    border: 1px solid rgba(212, 175, 55, 0.3);
                }

                .corner {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                    border: 3px solid #D4AF37;
                    z-index: 5;
                }

                .corner-tl { top: 15px; left: 15px; border-right: none; border-bottom: none; }
                .corner-tr { top: 15px; right: 15px; border-left: none; border-bottom: none; }
                .corner-bl { bottom: 15px; left: 15px; border-right: none; border-top: none; }
                .corner-br { bottom: 15px; right: 15px; border-left: none; border-top: none; }

                .card-content {
                    position: relative;
                    z-index: 2;
                    text-align: center;
                }

                .card-header-premium {
                    margin-bottom: 30px;
                }

                .subtitle-invitation {
                    display: block;
                    font-family: 'Montserrat', sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 6px;
                    font-size: 11px;
                    color: #A68A64;
                    margin-bottom: 8px;
                }

                .wedding-pretitle {
                    font-family: 'Cormorant Garamond', serif;
                    font-style: italic;
                    font-size: 14px;
                    color: #797979;
                    margin-bottom: 12px;
                }

                .couple-names-luxe {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 44px;
                    color: #2c2c2c;
                    margin: 0;
                    line-height: 1;
                    font-weight: 500;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }

                .name-wrap {
                    color: #A68A64; /* Solid gold for consistency in PDF/Image renders */
                    padding: 0 10px;
                }

                .ampersand-stylized {
                    font-family: 'Cormorant Garamond', serif;
                    font-style: italic;
                    font-size: 28px;
                    color: #D4AF37;
                    opacity: 0.8;
                }

                .guest-section-elegant {
                    margin: 35px 0;
                    padding: 25px;
                    background: rgba(212, 175, 55, 0.04);
                    border-top: 1px solid rgba(212, 175, 55, 0.1);
                    border-bottom: 1px solid rgba(212, 175, 55, 0.1);
                }

                .invitation-ornament {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    margin-bottom: 15px;
                }

                .invitation-ornament .line {
                    height: 1px;
                    width: 40px;
                    background: #D4AF37;
                    opacity: 0.4;
                }

                .ornament-icon {
                    font-size: 12px;
                    color: #D4AF37;
                }

                .guest-title {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    color: #999;
                    margin-bottom: 10px;
                }

                .guest-name-luxe {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 30px;
                    color: #2c2c2c;
                    font-weight: 600;
                    margin-bottom: 10px;
                    letter-spacing: 1px;
                }

                .admission-pill {
                    display: inline-block;
                    padding: 4px 15px;
                    background: #D4AF37;
                    color: white;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    border-radius: 50px;
                    font-weight: 600;
                    margin-top: 5px;
                }

                .details-stack {
                    margin-bottom: 40px;
                    text-align: center;
                }

                .detail-row {
                    display: flex;
                    justify-content: center;
                    gap: 40px;
                    margin-bottom: 25px;
                }

                .detail-cell {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .divider-vertical {
                    position: relative;
                }

                .divider-vertical::before {
                    content: '';
                    position: absolute;
                    left: -20px;
                    top: 10%;
                    height: 80%;
                    width: 1px;
                    background: rgba(166, 138, 100, 0.2);
                }

                .label {
                    font-size: 9px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    color: #A68A64;
                }

                .value {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    color: #2c2c2c;
                }

                .value-prominent {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 15px;
                    font-weight: 400; /* Unbolded as requested */
                    color: #2c2c2c;
                    display: block;
                    margin-bottom: 5px;
                    line-height: 1.4;
                }

                .subvalue {
                    font-size: 12px;
                    color: #797979;
                    font-style: italic;
                    max-width: 300px;
                    margin: 0 auto;
                    display: block;
                }

                .card-footer-luxury {
                    margin-top: 10px;
                }

                .status-badge-seal {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 80px;
                    height: 80px;
                    background: radial-gradient(circle at center, #D4AF37, #A68A64);
                    border-radius: 50%;
                    box-shadow: 0 4px 15px rgba(166, 138, 100, 0.4), inset 0 0 10px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                    position: relative;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                }

                .status-badge-seal::after {
                    content: '';
                    position: absolute;
                    top: -5px;
                    left: -5px;
                    right: -5px;
                    bottom: -5px;
                    border: 1px dashed #D4AF37;
                    border-radius: 50%;
                    opacity: 0.5;
                }

                .seal-text {
                    font-size: 10px;
                    color: white;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    transform: rotate(-15deg);
                }

                .footer-memo {
                    font-size: 11px;
                    color: #999;
                    font-style: italic;
                    letter-spacing: 0.5px;
                }

                .download-btn {
                    background: #2c2c2c;
                    color: white;
                    border: none;
                    padding: 14px 35px;
                    border-radius: 50px;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    letter-spacing: 1px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                    text-transform: uppercase;
                }

                .download-btn:hover {
                    background: #A68A64;
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px rgba(166, 138, 100, 0.2);
                }

                @media (max-width: 500px) {
                    .card-wrapper {
                        width: 100%;
                        max-width: 380px;
                        padding: 20px;
                    }
                    
                    .couple-names {
                        font-size: 32px;
                    }

                    .guest-name {
                        font-size: 24px;
                    }
                }
            `}</style>
        </div>
    );
}
