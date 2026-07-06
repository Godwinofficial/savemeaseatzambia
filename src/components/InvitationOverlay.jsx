import React, { useState, useEffect, useRef } from 'react';
import heroVideo from '../assets/videos/hero.MP4';

const InvitationOverlay = ({ weddingData, onEnter, onStartClose }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(e => console.log("Autoplay blocked:", e));
    }

    // Dynamically load elegant fonts for the cursive names and clean date
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:wght@300;400;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Trigger entrance animations
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const groomName = weddingData?.couple?.groom?.name?.split(' ')[0] || 'Groom';
  const brideName = weddingData?.couple?.bride?.name?.split(' ')[0] || 'Bride';

  // Format date to: 14 FEBRUARY 2027
  const formatDateForOverlay = (dateStr) => {
    if (!dateStr) return '';

    // Check if it's already a formatted string (e.g., "October 10, 2026")
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr.toUpperCase();
    }

    const months = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  };

  const weddingDate = formatDateForOverlay(weddingData?.rawDate || weddingData?.date);

  const handleEnterClick = () => {
    setIsFadingOut(true);
    if (onStartClose) onStartClose(); // Trigger mounting of main site immediately for animations
    setTimeout(() => {
      onEnter();
    }, 800); // Match transition duration (800ms)
  };

  return (
    <div
      className={`invitation-overlay-container ${isFadingOut ? 'fade-out' : ''}`}
      style={overlayContainerStyle}
    >
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        defaultMuted
        loop
        playsInline
        className="overlay-video-bg"
        style={videoBgStyle}
        onTimeUpdate={() => {
          if (videoRef.current) {
            // Smooth seamless loop: reset 0.2s before the very end to prevent the browser 'ended' flash
            if (videoRef.current.duration - videoRef.current.currentTime <= 0.2) {
              videoRef.current.currentTime = 0;
              videoRef.current.play().catch(() => { });
            }
          }
        }}
      >
        <source src={heroVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dim/Dark filter overlay */}
      <div className="overlay-darkener" style={darkenerStyle} />

      {/* Content wrapper */}
      <div
        className={`overlay-content-wrap ${mounted ? 'active' : ''}`}
        style={contentWrapStyle}
      >
        {/* Spacer for top */}
        <div style={{ flex: 1 }} />

        {/* Center: Interactive enter button */}
        <div className="overlay-center-section" style={centerSectionStyle}>
          <button
            onClick={handleEnterClick}
            className="overlay-enter-btn"
            style={enterBtnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = 'black';
              e.currentTarget.style.transform = 'scale(1.05)';
              // e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              // e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            VIEW YOUR INVITE
          </button>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1.2 }} />

        {/* Bottom: Couple names & Wedding date */}
        <div className="overlay-bottom-section" style={bottomSectionStyle}>
          <h1 className="overlay-couple-names" style={coupleNamesStyle}>
            {groomName} & {brideName}
          </h1>
          <p className="overlay-wedding-date" style={weddingDateStyle}>
            {weddingDate}
          </p>
        </div>
      </div>

      {/* Inject custom CSS keyframes and animations directly */}
      <style>{`
        .invitation-overlay-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          height: 100dvh;
          z-index: 999999;
          overflow: hidden;
          background: #fff;
          transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .invitation-overlay-container.fade-out {
          opacity: 0;
          transform: scale(1.08);
          pointer-events: none;
        }
        .overlay-content-wrap {
          position: relative;
          z-index: 10;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: calc(40px + env(safe-area-inset-top, 0px)) 20px calc(45px + env(safe-area-inset-bottom, 0px)) 20px;
          box-sizing: border-box;
        }
        .overlay-center-section {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 1s ease-out 0.8s, transform 1s ease-out 0.8s;
        }
        .overlay-content-wrap.active .overlay-center-section {
          opacity: 1;
          transform: translateY(0);
        }
        .overlay-bottom-section {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 1.2s ease-out 0.3s, transform 1.2s ease-out 0.3s;
        }
        .overlay-content-wrap.active .overlay-bottom-section {
          opacity: 1;
          transform: translateY(0);
        }
        .overlay-enter-btn {
          font-family: 'Montserrat', sans-serif;
          font-weight: 400;
          font-size: 0.85rem;
          letter-spacing: 0.25em;
          color: white;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.65);
          padding: 14px 35px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          border-radius: 2px;
          outline: none;
        }
        @media (max-width: 480px) {
          .overlay-couple-names {
            font-size: 3.2rem !important;
          }
          .overlay-wedding-date {
            font-size: 0.75rem !important;
            letter-spacing: 0.25em !important;
          }
          .overlay-enter-btn {
            font-size: 0.75rem !important;
            padding: 12px 28px !important;
          }
        }
      `}</style>
    </div>
  );
};

// Styles
const overlayContainerStyle = {
  fontFamily: '"Montserrat", sans-serif',
};

const videoBgStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  zIndex: 1,
  // transform: 'scale(1.25)', // More aggressive crop
  // transformOrigin: 'top left', // Forces the bottom right to be pushed off-screen
};

const darkenerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0, 0, 0, 0.35)',
  zIndex: 2,
};

const contentWrapStyle = {
  boxSizing: 'border-box',
};

const centerSectionStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const bottomSectionStyle = {
  width: '100%',
  maxWidth: '600px',
  textAlign: 'center',
};

const coupleNamesStyle = {
  fontFamily: '"Great Vibes", cursive',
  fontSize: '4.5rem',
  fontWeight: 'normal',
  color: '#ffffff',
  margin: '0 0 10px 0',
  textShadow: '0 2px 15px rgba(0, 0, 0, 0.6)',
  lineHeight: '1.2',
};

const weddingDateStyle = {
  fontFamily: '"Montserrat", sans-serif',
  fontWeight: '300',
  fontSize: '0.85rem',
  letterSpacing: '0.35em',
  color: 'rgba(255, 255, 255, 0.95)',
  margin: '0',
  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
};

const enterBtnStyle = {
  // Styles are handled mostly in the inline hover definitions and CSS injection block
};

export default InvitationOverlay;
