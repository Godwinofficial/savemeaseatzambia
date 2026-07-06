import React, { useState, useEffect } from 'react';

const GoldenRomance = ({ weddingData }) => {
  const defaultData = {
    couple: {
      bride: { name: 'Eleanor' },
      groom: { name: 'Alexander' }
    },
    date: '2026-09-15T16:30:00',
    venue: { name: 'The Grand Champagne Estate', address: '123 Golden Valley Road, Wine Country' },
    location: 'The Grand Champagne Estate',
    ceremony: { time: '4:30 PM', venue: 'The Rose Garden', address: '123 Golden Valley Road' },
    reception: { time: '6:00 PM', venue: 'The Crystal Ballroom', address: '123 Golden Valley Road' },
    story: { highlight: 'A romance written in the stars, glowing brighter with every passing day. Join us as we begin our forever.' },
    sliderImages: [
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200'
    ]
  };

  const d = weddingData || defaultData;
  const brideFirst = d.couple?.bride?.name?.split(' ')[0] || defaultData.couple.bride.name;
  const groomFirst = d.couple?.groom?.name?.split(' ')[0] || defaultData.couple.groom.name;
  const sliderImages = d.sliderImages && d.sliderImages.length > 0 ? d.sliderImages : defaultData.sliderImages;

  const getParsedDate = () => {
    const raw = d.rawDate || d.date;
    if (raw) {
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date('2026-09-15T16:30:00');
  };
  const eventDate = getParsedDate();

  const dayNum = eventDate.getDate();
  const monthNum = eventDate.getMonth();
  const year = eventDate.getFullYear();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Colors
  const ivorySilk = '#FDFBF7';
  const champagneGold = '#D4AF37';
  const darkCharcoal = '#2A2825';
  const softBlush = '#FDF8F7';

  // State
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'story', 'itinerary', 'rsvp'
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpForm, setRsvpForm] = useState({ name: '', phone: '', email: '', guests: '1', attending: 'yes' });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [tabAnimating, setTabAnimating] = useState(false);

  // Background Slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex(prev => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderImages]);

  // Countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = eventDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      } else {
        setTimeLeft({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [eventDate]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.overflow = 'hidden'; // Lock scrolling
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setTabAnimating(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTabAnimating(false);
      // reset scroll position of the viewport
      const viewport = document.getElementById('gh-viewport');
      if (viewport) viewport.scrollTop = 0;
    }, 400); // Wait for fade out
  };

  const handleRsvpSubmit = (e) => {
    e.preventDefault();
    setRsvpSubmitted(true);
    const text = `Wedding RSVP\n\nName: ${rsvpForm.name}\nEmail: ${rsvpForm.email}\nPhone: ${rsvpForm.phone}\nAttending: ${rsvpForm.attending}\nGuests: ${rsvpForm.guests}`;
    const encoded = encodeURIComponent(text);
    setTimeout(() => {
      window.open(`https://wa.me/260973848066?text=${encoded}`, '_blank');
    }, 1200);
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Montserrat:wght@200;300;400;500&family=Allura&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .gh-app-wrapper {
          width: 100%;
          height: 100vh;
          height: 100dvh;
          background: #000;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          position: relative;
        }

        .gh-app-container {
          width: 100%;
          max-width: 480px;
          height: 100%;
          position: relative;
          font-family: 'Montserrat', sans-serif;
          color: ${darkCharcoal};
          overflow: hidden;
          background: #fff;
        }

        /* ===== BACKGROUND SLIDER ===== */
        .gh-bg-slider {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          z-index: 0;
        }
        .gh-bg-slide {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 2s ease-in-out, transform 10s linear;
          transform: scale(1);
        }
        .gh-bg-slide.active {
          opacity: 1;
          transform: scale(1.05);
        }

        /* ===== OVERLAYS ===== */
        .gh-overlay {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(253, 251, 247, 0.25);
          z-index: 1;
        }
        .gh-pearl-noise {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          opacity: 0.3;
          pointer-events: none;
          z-index: 2;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        /* ===== FROSTED VIEWPORT ===== */
        .gh-viewport-container {
          position: absolute;
          top: 40px;
          bottom: 110px; /* Leave space for tab bar */
          left: 20px;
          right: 20px;
          z-index: 10;
          background: rgba(253, 251, 247, 0.75);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 30px 60px rgba(42,40,37,0.1), inset 0 0 20px rgba(255,255,255,0.5);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .gh-viewport-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 40px 25px;
          scroll-behavior: smooth;
          /* Hide scrollbar */
          -ms-overflow-style: none;
          scrollbar-width: none;
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .gh-viewport-content::-webkit-scrollbar {
          display: none;
        }
        .gh-viewport-content.animating {
          opacity: 0;
          transform: translateY(15px);
        }

        /* ===== TAB BAR ===== */
        .gh-tab-bar {
          position: absolute;
          bottom: 25px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 40px);
          height: 70px;
          background: rgba(253, 251, 247, 0.9);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border-radius: 40px;
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 15px 40px rgba(42,40,37,0.15);
          z-index: 20;
          display: flex;
          justify-content: space-evenly;
          align-items: center;
          padding: 0 10px;
        }
        .gh-tab-btn {
          background: transparent;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          cursor: pointer;
          color: rgba(42,40,37,0.5);
          transition: all 0.3s ease;
          position: relative;
        }
        .gh-tab-icon {
          font-size: 1.2rem;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .gh-tab-label {
          font-family: 'Playfair Display', serif;
          font-size: 0.55rem;
          letter-spacing: 1px;
          font-weight: 600;
          opacity: 0;
          position: absolute;
          bottom: 8px;
          transform: translateY(10px);
          transition: all 0.3s ease;
        }
        .gh-tab-btn.active {
          color: ${champagneGold};
        }
        .gh-tab-btn.active .gh-tab-icon {
          transform: translateY(-8px) scale(1.1);
        }
        .gh-tab-btn.active .gh-tab-label {
          opacity: 1;
          transform: translateY(0);
        }
        
        /* Highlight pill behind active tab */
        .gh-tab-btn.active::before {
          content: '';
          position: absolute;
          top: 4px; left: 50%;
          transform: translateX(-50%);
          width: 40px; height: 40px;
          background: rgba(212,175,55,0.1);
          border-radius: 50%;
          z-index: -1;
        }

        /* ===== VIEWS STYLING ===== */
        
        /* HOME VIEW */
        .gh-view-home {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        .gh-home-top {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.65rem;
          letter-spacing: 5px;
          text-transform: uppercase;
          color: ${champagneGold};
          margin-bottom: 30px;
        }
        .gh-home-initials {
          position: relative;
          width: 220px;
          height: 220px;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px solid ${champagneGold};
          border-radius: 50%;
        }
        .gh-home-initials::before {
          content: '';
          position: absolute;
          top: -10px; left: -10px; right: -10px; bottom: -10px;
          border: 1px solid rgba(212,175,55,0.3);
          border-radius: 50%;
        }
        .gh-home-initials-text {
          font-family: 'Allura', cursive;
          font-size: 5rem;
          color: ${darkCharcoal};
          line-height: 1;
          transform: translateY(5px);
        }
        .gh-home-names {
          font-family: 'Playfair Display', serif;
          font-size: 1.8rem;
          color: ${darkCharcoal};
          margin-top: 40px;
          line-height: 1.4;
        }
        .gh-home-names i {
          display: block;
          font-family: 'Allura', cursive;
          font-size: 2rem;
          color: ${champagneGold};
          margin: -10px 0;
        }

        /* STORY VIEW */
        .gh-view-story {
          text-align: center;
        }
        .gh-story-icon {
          font-size: 2rem;
          color: ${champagneGold};
          margin-bottom: 20px;
        }
        .gh-story-quote {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 1.6rem;
          color: ${darkCharcoal};
          line-height: 1.6;
          margin-bottom: 40px;
        }
        .gh-countdown-wrap {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 50px;
          padding: 30px 0;
          border-top: 1px solid rgba(212,175,55,0.3);
          border-bottom: 1px solid rgba(212,175,55,0.3);
        }
        .gh-cd-box {
          text-align: center;
        }
        .gh-cd-num {
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem;
          color: ${darkCharcoal};
          line-height: 1;
        }
        .gh-cd-lbl {
          font-size: 0.55rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: ${champagneGold};
          margin-top: 5px;
        }

        /* ITINERARY VIEW */
        .gh-view-itinerary {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .gh-view-title {
          font-family: 'Allura', cursive;
          font-size: 3.5rem;
          color: ${champagneGold};
          margin-bottom: 40px;
          line-height: 0.8;
          text-align: center;
        }
        .gh-timeline {
          position: relative;
          width: 100%;
          padding-left: 20px;
        }
        .gh-timeline::before {
          content: '';
          position: absolute;
          top: 0; bottom: 0; left: 24px;
          width: 1px;
          background: ${champagneGold};
        }
        .gh-timeline-item {
          position: relative;
          padding-left: 30px;
          margin-bottom: 40px;
        }
        .gh-timeline-dot {
          position: absolute;
          top: 5px; left: 0;
          width: 10px; height: 10px;
          background: ${ivorySilk};
          border: 2px solid ${champagneGold};
          border-radius: 50%;
        }
        .gh-time {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          color: ${champagneGold};
          font-weight: 600;
          margin-bottom: 5px;
        }
        .gh-event {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem;
          color: ${darkCharcoal};
          font-weight: 700;
        }
        .gh-event-desc {
          font-size: 0.8rem;
          color: rgba(42,40,37,0.7);
          margin-top: 5px;
          line-height: 1.5;
        }

        /* RSVP VIEW */
        .gh-view-rsvp {
          text-align: center;
        }
        .gh-input, .gh-select {
          width: 100%;
          padding: 15px 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(212,175,55,0.4);
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          color: ${darkCharcoal};
          margin-bottom: 25px;
          outline: none;
          text-align: center;
          text-align-last: center;
          transition: border-color 0.3s;
        }
        .gh-input::placeholder { color: rgba(42,40,37,0.5); }
        .gh-input:focus, .gh-select:focus { border-bottom-color: ${champagneGold}; }
        
        .gh-radio-container { display: flex; justify-content: center; gap: 20px; margin-top: 10px; margin-bottom: 30px; }
        .gh-radio { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; cursor: pointer; color: ${darkCharcoal}; }
        .gh-radio input { accent-color: ${champagneGold}; width: 16px; height: 16px; }

        .gh-submit {
          width: 100%;
          padding: 18px;
          background: ${darkCharcoal};
          color: ${ivorySilk};
          border: none;
          border-radius: 40px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 3px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .gh-submit:hover {
          background: ${champagneGold};
          box-shadow: 0 10px 25px rgba(212,175,55,0.3);
        }

        .gh-gifts-box {
          margin-top: 50px;
          padding: 30px 20px;
          background: rgba(253,251,247,0.5);
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.8);
        }
        .gh-gifts-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          color: ${darkCharcoal};
          margin-bottom: 10px;
        }
      `}</style>

      <div className="gh-app-wrapper">
        <div className="gh-app-container">

          {/* BACKGROUND SLIDER */}
          <div className="gh-bg-slider">
            {sliderImages.map((img, i) => (
              <img
                key={i}
                src={img}
                className={`gh-bg-slide ${i === currentBgIndex ? 'active' : ''}`}
                alt="Couple Background"
              />
            ))}
          </div>
          <div className="gh-overlay"></div>
          <div className="gh-pearl-noise"></div>

          {/* MAIN GLASS VIEWPORT */}
          <div className="gh-viewport-container">
            <div id="gh-viewport" className={`gh-viewport-content ${tabAnimating ? 'animating' : ''}`}>

              {/* === VIEW: HOME === */}
              {activeTab === 'home' && (
                <div className="gh-view-home">
                  <div className="gh-home-top">
                    {String(dayNum).padStart(2, '0')}.{String(monthNum + 1).padStart(2, '0')}.{String(year).slice(2)}
                  </div>
                  <div className="gh-home-initials">
                    <span className="gh-home-initials-text">{brideFirst[0]}&{groomFirst[0]}</span>
                  </div>
                  <div className="gh-home-names">
                    {brideFirst}
                    <i>and</i>
                    {groomFirst}
                  </div>
                  
                  {(d.couple?.bride?.image || d.couple?.groom?.image) && (
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
                      {d.couple?.bride?.image && (
                        <img src={d.couple.bride.image} alt={brideFirst} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #D4AF37' }} />
                      )}
                      {d.couple?.groom?.image && (
                        <img src={d.couple.groom.image} alt={groomFirst} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #D4AF37' }} />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* === VIEW: STORY === */}
              {activeTab === 'story' && (
                <div className="gh-view-story">
                  <div className="gh-story-icon"><i className="fa-solid fa-sparkles"></i></div>
                  <div className="gh-story-quote">
                    "{d.story?.highlight || defaultData.story.highlight}"
                  </div>

                  <div className="gh-countdown-wrap">
                    <div className="gh-cd-box">
                      <div className="gh-cd-num">{timeLeft.days}</div>
                      <div className="gh-cd-lbl">Days</div>
                    </div>
                    <div className="gh-cd-box">
                      <div className="gh-cd-num">{timeLeft.hours}</div>
                      <div className="gh-cd-lbl">Hours</div>
                    </div>
                    <div className="gh-cd-box">
                      <div className="gh-cd-num">{timeLeft.minutes}</div>
                      <div className="gh-cd-lbl">Mins</div>
                    </div>
                  </div>
                </div>
              )}

              {/* === VIEW: ITINERARY === */}
              {activeTab === 'itinerary' && (
                <div className="gh-view-itinerary">
                  <h2 className="gh-view-title">The Details</h2>

                  <div className="gh-timeline">

                    <div className="gh-timeline-item">
                      <div className="gh-timeline-dot"></div>
                      <div className="gh-time">3:30 PM</div>
                      <div className="gh-event">Guest Arrival</div>
                      <div className="gh-event-desc">Welcome drinks and seating</div>
                    </div>

                    <div className="gh-timeline-item">
                      <div className="gh-timeline-dot"></div>
                      <div className="gh-time">{d.ceremony?.time || '4:30 PM'}</div>
                      <div className="gh-event">Ceremony</div>
                      <div className="gh-event-desc">{d.ceremony?.venue || 'The Rose Garden'}<br />{d.venue?.address || '123 Golden Valley Road'}</div>
                    </div>

                    <div className="gh-timeline-item">
                      <div className="gh-timeline-dot"></div>
                      <div className="gh-time">{d.reception?.time || '6:00 PM'}</div>
                      <div className="gh-event">Reception</div>
                      <div className="gh-event-desc">{d.reception?.venue || 'The Crystal Ballroom'}<br />Dinner, Drinks & Dancing</div>
                    </div>

                  </div>
                </div>
              )}

              {/* === VIEW: RSVP & GIFTS === */}
              {activeTab === 'rsvp' && (
                <div className="gh-view-rsvp">
                  <div className="gh-gifts-box" style={{ marginTop: '0', marginBottom: '50px' }}>
                    <h3 className="gh-gifts-title">Gifts</h3>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(42,40,37,0.7)', marginBottom: '15px' }}>
                      Your presence is pure gold. If you wish to gift us, please consider:
                    </div>
                    {d.gifts && d.gifts.length > 0 ? (
                      d.gifts.map((gift, idx) => (
                        <div key={idx} style={{ marginBottom: '15px' }}>
                          <div style={{ fontFamily: 'Playfair Display', fontSize: '1.2rem', color: champagneGold }}>
                            {gift.provider || gift.bank || 'Gift'}
                          </div>
                          <div style={{ fontSize: '0.8rem' }}>
                            {gift.accountName && <>{gift.accountName}<br /></>}
                            {gift.accountNumber}
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div style={{ fontFamily: 'Playfair Display', fontSize: '1.2rem', color: champagneGold }}>Zanaco Bank</div>
                        <div style={{ fontSize: '0.8rem', marginBottom: '15px' }}>{groomFirst} & {brideFirst}<br />1029384756</div>

                        <div style={{ fontFamily: 'Playfair Display', fontSize: '1.2rem', color: champagneGold }}>Mobile Money</div>
                        <div style={{ fontSize: '0.8rem' }}>MTN: +260 973 848066<br />Airtel: +260 762 123456</div>
                      </>
                    )}
                  </div>

                  <h2 className="gh-view-title" style={{ marginBottom: '10px' }}>RSVP</h2>
                  <div style={{ fontFamily: 'Playfair Display', fontSize: '1.2rem', marginBottom: '30px' }}>Be our guest</div>

                  {!rsvpSubmitted ? (
                    <form onSubmit={handleRsvpSubmit}>
                      <input type="text" className="gh-input" placeholder="Your Full Name" required
                        value={rsvpForm.name} onChange={e => setRsvpForm({ ...rsvpForm, name: e.target.value })} />

                      <input type="email" className="gh-input" placeholder="Email Address" required
                        value={rsvpForm.email} onChange={e => setRsvpForm({ ...rsvpForm, email: e.target.value })} />

                      <input type="tel" className="gh-input" placeholder="Phone Number" required
                        value={rsvpForm.phone} onChange={e => setRsvpForm({ ...rsvpForm, phone: e.target.value })} />

                      <select className="gh-select" value={rsvpForm.guests} onChange={e => setRsvpForm({ ...rsvpForm, guests: e.target.value })}>
                        <option value="" disabled>Number of Guests</option>
                        <option value="1">1 Guest</option>
                        <option value="2">2 Guests</option>
                        <option value="3">3 Guests</option>
                        <option value="4">4 Guests</option>
                      </select>

                      <div className="gh-radio-container">
                        <label className="gh-radio">
                          <input type="radio" name="attending" value="yes" checked={rsvpForm.attending === 'yes'}
                            onChange={e => setRsvpForm({ ...rsvpForm, attending: e.target.value })} />
                          Joyfully Accept
                        </label>
                        <label className="gh-radio">
                          <input type="radio" name="attending" value="no" checked={rsvpForm.attending === 'no'}
                            onChange={e => setRsvpForm({ ...rsvpForm, attending: e.target.value })} />
                          Regretfully Decline
                        </label>
                      </div>

                      <button type="submit" className="gh-submit">Confirm</button>
                    </form>
                  ) : (
                    <div style={{ padding: '40px 0' }}>
                      <i className="fa-solid fa-envelope-circle-check" style={{ fontSize: '3rem', color: champagneGold, marginBottom: '20px' }}></i>
                      <h3 style={{ fontFamily: 'Playfair Display', fontSize: '1.8rem' }}>Thank You</h3>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* TAB BAR NAVIGATION */}
          <div className="gh-tab-bar">
            <button className={`gh-tab-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => handleTabChange('home')}>
              <i className="fa-solid fa-house gh-tab-icon"></i>
              <span className="gh-tab-label">Home</span>
            </button>
            <button className={`gh-tab-btn ${activeTab === 'story' ? 'active' : ''}`} onClick={() => handleTabChange('story')}>
              <i className="fa-solid fa-book-open gh-tab-icon"></i>
              <span className="gh-tab-label">Story</span>
            </button>
            <button className={`gh-tab-btn ${activeTab === 'itinerary' ? 'active' : ''}`} onClick={() => handleTabChange('itinerary')}>
              <i className="fa-solid fa-clock gh-tab-icon"></i>
              <span className="gh-tab-label">Details</span>
            </button>
            <button className={`gh-tab-btn ${activeTab === 'rsvp' ? 'active' : ''}`} onClick={() => handleTabChange('rsvp')}>
              <i className="fa-solid fa-envelope gh-tab-icon"></i>
              <span className="gh-tab-label">RSVP</span>
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default GoldenRomance;
