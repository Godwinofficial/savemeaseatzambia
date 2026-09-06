import React, { useState, useEffect, useRef } from 'react';
import heroVideo from '../assets/videos/hero.MP4';

const InvitationOverlay = ({ weddingData, onEnter, onStartClose }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPlayingCustomVideo, setIsPlayingCustomVideo] = useState(false);
  const [isCustomVideoMuted, setIsCustomVideoMuted] = useState(false);
  const videoRef = useRef(null);
  const customVideoRef = useRef(null);

  // Check if couple uploaded a custom intro video
  const customVideoUrl = weddingData?.hero_video_url || null;
  const hasCustomVideo = !!customVideoUrl;

  useEffect(() => {
    // Only autoplay background video for DEFAULT intro video!
    // Custom video must NOT autoplay on link open.
    if (!hasCustomVideo && videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
    }

    // Load fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:wght@300;400;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, [hasCustomVideo, customVideoUrl]);

  const groomName = weddingData?.couple?.groom?.name?.split(' ')[0] || 'Groom';
  const brideName = weddingData?.couple?.bride?.name?.split(' ')[0] || 'Bride';

  const formatDateForOverlay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr.toUpperCase();
    const months = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const weddingDate = formatDateForOverlay(weddingData?.rawDate || weddingData?.date);

  // Close overlay and reveal website
  const finishAndEnterWebsite = () => {
    setIsFadingOut(true);
    if (onStartClose) onStartClose();
    setTimeout(() => {
      onEnter();
    }, 800);
  };

  // When user clicks "VIEW INVITATION"
  const handleViewInviteClick = () => {
    if (hasCustomVideo) {
      // Start playing the custom video fullscreen once user presses View Invitation
      setIsPlayingCustomVideo(true);
      setTimeout(() => {
        if (customVideoRef.current) {
          customVideoRef.current.currentTime = 0;
          customVideoRef.current.muted = false;
          customVideoRef.current.play().then(() => {
            setIsCustomVideoMuted(false);
          }).catch(err => {
            console.warn('Video play with sound blocked by browser, trying muted:', err);
            if (customVideoRef.current) {
              customVideoRef.current.muted = true;
              setIsCustomVideoMuted(true);
              customVideoRef.current.play().catch(() => {});
            }
          });
        }
      }, 50);
    } else {
      // Default template video: immediately open website
      finishAndEnterWebsite();
    }
  };

  // Toggle mute on custom video if needed
  const toggleCustomVideoMute = (e) => {
    e.stopPropagation();
    if (!customVideoRef.current) return;
    const newMuted = !customVideoRef.current.muted;
    customVideoRef.current.muted = newMuted;
    setIsCustomVideoMuted(newMuted);
  };

  // When custom video finishes playing, automatically open website
  const handleCustomVideoEnded = () => {
    finishAndEnterWebsite();
  };

  return (
    <div
      className={`invitation-overlay-container ${isFadingOut ? 'fade-out' : ''}`}
      style={overlayContainerStyle}
    >
      {/* ── Background Video / Still ── */}
      {!isPlayingCustomVideo && (
        <>
          {hasCustomVideo ? (
            // Custom video: static poster / preview (paused, no autoplay until user presses View Invitation)
            weddingData?.coverImage ? (
              <img
                src={weddingData.coverImage}
                alt="Wedding Invitation Cover"
                className="overlay-video-bg"
                style={videoBgStyle}
              />
            ) : (
              <video
                key={customVideoUrl}
                ref={videoRef}
                muted
                playsInline
                preload="metadata"
                poster={weddingData?.coverImage || ''}
                className="overlay-video-bg"
                style={videoBgStyle}
              >
                <source src={`${customVideoUrl}#t=0.001`} type="video/mp4" />
              </video>
            )
          ) : (
            // Default intro video: auto plays in background loop
            <video
              key="default-hero"
              ref={videoRef}
              autoPlay
              muted
              defaultMuted
              loop
              playsInline
              preload="auto"
              poster={weddingData?.coverImage || ''}
              className="overlay-video-bg"
              style={videoBgStyle}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  if (videoRef.current.duration - videoRef.current.currentTime <= 0.2) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play().catch(() => {});
                  }
                }
              }}
            >
              <source src={heroVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          <div className="overlay-darkener" style={darkenerStyle} />
        </>
      )}

      {/* ── Fullscreen Custom Video Player (Plays on View Invitation click) ── */}
      {hasCustomVideo && isPlayingCustomVideo && (
        <div style={customVideoContainerStyle}>
          <video
            ref={customVideoRef}
            autoPlay
            playsInline
            preload="auto"
            style={customVideoPlayerStyle}
            onEnded={handleCustomVideoEnded}
          >
            <source src={customVideoUrl} type="video/mp4" />
          </video>

          {/* Unmute button if browser auto-muted */}
          {isCustomVideoMuted && (
            <button
              type="button"
              onClick={toggleCustomVideoMute}
              style={unmuteBtnStyle}
              title="Unmute video"
            >
              <i className="fas fa-volume-xmark" style={{ marginRight: '6px' }}></i> TAP FOR SOUND
            </button>
          )}

          {/* Discreet Skip Button in corner */}
          <button
            type="button"
            onClick={finishAndEnterWebsite}
            style={skipBtnStyle}
            title="Skip video"
          >
            SKIP <i className="fas fa-chevron-right" style={{ marginLeft: '4px' }}></i>
          </button>
        </div>
      )}

      {/* ── Overlay Text & "VIEW INVITATION" Button ── */}
      {!isPlayingCustomVideo && (
        <div
          className={`overlay-content-wrap ${mounted ? 'active' : ''}`}
          style={contentWrapStyle}
        >
          <div style={{ flex: 1 }} />

          {/* Center: "VIEW INVITATION" Button */}
          <div className="overlay-center-section" style={centerSectionStyle}>
            <button
              onClick={handleViewInviteClick}
              className="overlay-enter-btn"
              style={enterBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = 'black';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {hasCustomVideo && (
                <i className="fas fa-play" style={{ marginRight: '8px', fontSize: '0.72rem' }}></i>
              )}
              VIEW INVITATION
            </button>
          </div>

          <div style={{ flex: 1.2 }} />

          {/* Bottom: Couple names & Wedding date */}
          <div className="overlay-bottom-section" style={bottomSectionStyle}>
            <h1 className="overlay-couple-names" style={coupleNamesStyle}>
              {groomName} &amp; {brideName}
            </h1>
            <p className="overlay-wedding-date" style={weddingDateStyle}>
              {weddingDate}
            </p>
          </div>
        </div>
      )}

      {/* Inject custom CSS keyframes and animations */}
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
          background: #000;
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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
};

const darkenerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0, 0, 0, 0.4)',
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

const enterBtnStyle = {};

const customVideoContainerStyle = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  background: '#000',
  zIndex: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const customVideoPlayerStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  outline: 'none',
};

const unmuteBtnStyle = {
  position: 'absolute',
  top: 'calc(20px + env(safe-area-inset-top, 0px))',
  left: '20px',
  background: 'rgba(0, 0, 0, 0.65)',
  color: '#ffffff',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  borderRadius: '20px',
  padding: '6px 14px',
  fontSize: '0.72rem',
  letterSpacing: '0.12em',
  fontFamily: '"Montserrat", sans-serif',
  cursor: 'pointer',
  zIndex: 30,
  backdropFilter: 'blur(4px)',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
};

const skipBtnStyle = {
  position: 'absolute',
  top: 'calc(20px + env(safe-area-inset-top, 0px))',
  right: '20px',
  background: 'rgba(0, 0, 0, 0.5)',
  color: 'rgba(255, 255, 255, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '20px',
  padding: '6px 14px',
  fontSize: '0.72rem',
  letterSpacing: '0.15em',
  fontFamily: '"Montserrat", sans-serif',
  cursor: 'pointer',
  zIndex: 30,
  backdropFilter: 'blur(4px)',
  transition: 'all 0.2s ease',
};

export default InvitationOverlay;
