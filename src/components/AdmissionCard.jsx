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
                scale: 1.5, // Lower scale for better iOS stability
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.querySelector('.card-wrapper');
                    if (clonedElement) {
                        clonedElement.style.display = 'block';
                        clonedElement.style.backgroundColor = '#ffffff';
                        // Remove shadow in clone to reduce rendering load
                        clonedElement.style.boxShadow = 'none';
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
                <div className="card-content">
                    {/* Decorative Border */}
                    <div className="card-border"></div>

                    {/* Header */}
                    <div className="card-header">
                        <div className="wedding-title">The Wedding Of</div>
                        <h1 className="couple-names">
                            {getFirstName(wedding.couple?.groom?.name || wedding.groom_name)}
                            <span className="ampersand">&</span>
                            {getFirstName(wedding.couple?.bride?.name || wedding.bride_name)}
                        </h1>
                        <div className="divider">
                            <span className="line"></span>
                            <span className="icon">Please Join Us</span>
                            <span className="line"></span>
                        </div>
                    </div>

                    {/* Guest Info */}
                    <div className="guest-info">
                        <div className="info-label">Guest of Honor</div>
                        <div className="guest-name">{rsvp.name}</div>
                        <div className="guest-count">
                            Admit {rsvp.guests_count} {rsvp.guests_count === 1 ? 'Guest' : 'Guests'}
                        </div>
                    </div>

                    {/* Event Details Grid */}
                    <div className="details-grid">
                        <div className="detail-item">
                            <i className="fas fa-calendar-alt detail-icon"></i>
                            <div className="detail-text">
                                <div className="detail-label">Date</div>
                                <div className="detail-value">{formatDate(wedding.date)}</div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <i className="fas fa-clock detail-icon"></i>
                            <div className="detail-text">
                                <div className="detail-label">Time</div>
                                <div className="detail-value">
                                    {wedding.ceremony?.time
                                        ? formatTime(null, wedding.ceremony.time)
                                        : formatTime(wedding.date, null)}
                                </div>
                            </div>
                        </div>

                        <div className="detail-item full-width">
                            <i className="fas fa-map-marker-alt detail-icon"></i>
                            <div className="detail-text">
                                <div className="detail-label">Venue</div>
                                <div className="detail-value">{wedding.venue?.name || wedding.venue_name}</div>
                                <div className="detail-subvalue">{wedding.venue?.address || wedding.location}</div>
                            </div>
                        </div>
                    </div>


                    {/* Footer */}
                    <div className="card-footer">
                        <div className="status-badge">Confirmed</div>
                        <p className="footer-note">Kindly present this card at the entrance</p>
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
                    width: 450px;
                    background: #fff !important;
                    background-color: #ffffff !important;
                    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a68a64' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                    border-radius: 4px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.15);
                    padding: 30px;
                    position: relative;
                    color: #2c2c2c !important;
                    overflow: hidden;
                }

                .card-border {
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    right: 15px;
                    bottom: 15px;
                    border: 1px solid #A68A64;
                    pointer-events: none;
                }

                .card-border::after {
                    content: '';
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    right: 4px;
                    bottom: 4px;
                    border: 1px solid rgba(166, 138, 100, 0.3);
                }

                .card-content {
                    padding: 20px 10px;
                    text-align: center;
                    position: relative;
                    z-index: 2;
                }

                .card-header {
                    margin-bottom: 5px;
                }

                .wedding-title {
                    font-family: 'Montserrat', sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                    font-size: 10px;
                    color: #797979;
                    margin-bottom: 10px;
                }

                .couple-names {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 38px;
                    color: #A68A64;
                    margin: 0;
                    line-height: 1.1;
                    font-weight: 500;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                    text-align: center;
                }

                .ampersand {
                    font-family: 'Cormorant Garamond', serif;
                    font-style: italic;
                    font-size: 24px;
                    color: #D4C3AA;
                }

                .divider {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    margin: 25px 0 15px;
                    width: 100%;
                }

                .line {
                    height: 1px;
                    width: 60px;
                    background: linear-gradient(90deg, transparent, #D4C3AA, transparent);
                }

                .icon {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 9px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    color: #A68A64;
                    text-align: center;
                }

                .guest-info {
                    margin-bottom: 30px;
                    background: rgba(166, 138, 100, 0.03);
                    padding: 20px;
                    border-radius: 2px;
                    border: 1px solid rgba(166, 138, 100, 0.1);
                    text-align: center;
                }

                .info-label {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: #999;
                    margin-bottom: 8px;
                }

                .guest-name {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 28px;
                    color: #2c2c2c;
                    font-weight: 600;
                    margin-bottom: 5px;
                    border-bottom: 1px solid rgba(166, 138, 100, 0.2);
                    display: inline-block;
                    padding-bottom: 5px;
                }

                .guest-count {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 11px;
                    color: #A68A64;
                    font-weight: 500;
                    margin-top: 5px;
                    letter-spacing: 0.5px;
                }

                .details-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                    text-align: left;
                    padding: 0 20px;
                }

                .detail-item {
                    display: flex;
                    gap: 12px;
                }

                .detail-item.full-width {
                    grid-column: span 2;
                }

                .detail-icon {
                    color: #A68A64;
                    font-size: 16px;
                    margin-top: 4px;
                    width: 20px;
                    text-align: center;
                }

                .detail-text {
                    flex: 1;
                }

                .detail-label {
                    font-size: 9px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #999;
                    margin-bottom: 3px;
                }

                .detail-value {
                    font-family: 'Montserrat', sans-serif;
                    font-size: 13px;
                    font-weight: 500;
                    color: #2c2c2c;
                    line-height: 1.4;
                }

                .detail-subvalue {
                    font-size: 11px;
                    color: #666;
                    margin-top: 2px;
                    font-style: italic;
                }

                .status-badge {
                    display: inline-block;
                    padding: 6px 16px;
                    background: #A68A64;
                    color: white;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    border-radius: 50px;
                    font-weight: 600;
                    margin-bottom: 15px;
                }

                .footer-note {
                    font-size: 10px;
                    color: #999;
                    font-style: italic;
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
