import React, { useState, useEffect } from 'react';

const BotanicalOlive = ({ weddingData }) => {
  const defaultData = {
    couple: {
      bride: { name: 'Fernanda' },
      groom: { name: 'Gustavo' }
    },
    date: '2026-08-08T15:00:00',
    venue: { name: 'Restaurant Maison La Prairie', address: 'Heather Street, 12' },
    location: 'Restaurant Maison La Prairie',
    ceremony: { time: '3:00 PM', venue: 'City Registry Office #1', address: 'October Avenue, 3г' },
    reception: { time: '4:30 PM', venue: 'Restaurant Maison La Prairie', address: 'Heather Street, 12' },
    story: { highlight: 'We invite you to share in the romance and joy as we begin our forever. Your presence will make our celebration complete.' },
    sliderImages: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=1200'
    ],
    dressCode: 'Ethereal Botanical',
    dressCodeDescription: 'We invite our guests to wear soft earthy tones to blend harmoniously with our botanical theme.',
    dress_code_colors: ['#2C361A', '#8A9A75', '#C2C8B5', '#E6E1D6', '#D4AF37']
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
    return new Date('2026-08-08T15:00:00');
  };
  const eventDate = getParsedDate();

  const dayNum = eventDate.getDate();
  const monthNum = eventDate.getMonth();
  const year = eventDate.getFullYear();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Colors
  const oliveDark = '#2C361A';
  const sage = '#8A9A75';
  const cream = '#F7F6F2';
  const gold = '#D4AF37';

  // State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpForm, setRsvpForm] = useState({ name: '', phone: '', guests: '1', attending: 'yes' });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

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

  // Scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('bo-visible');
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.bo-fade-up, .bo-parallax-img, .bo-timeline-card').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [d]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleRsvpSubmit = (e) => {
    e.preventDefault();
    setRsvpSubmitted(true);
    const text = `Wedding RSVP\n\nName: ${rsvpForm.name}\nPhone: ${rsvpForm.phone}\nAttending: ${rsvpForm.attending}\nGuests: ${rsvpForm.guests}`;
    const encoded = encodeURIComponent(text);
    setTimeout(() => {
      window.open(`https://wa.me/260973848066?text=${encoded}`, '_blank');
    }, 1200);
  };

  const paletteColors = d.dress_code_colors || defaultData.dress_code_colors;
  const heroImg = sliderImages[0];
  const img2 = sliderImages[1] || heroImg;
  const img3 = sliderImages[2] || heroImg;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Montserrat:wght@200;300;400;500&family=Great+Vibes&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .bo-wrapper {
          width: 100%;
          min-height: 100vh;
          background: #EAE8E3;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px 10px;
        }

        .bo-container {
          width: 100%;
          max-width: 440px;
          background: ${cream};
          box-shadow: 0 40px 100px rgba(44,54,26,0.15);
          overflow: hidden;
          position: relative;
          font-family: 'Montserrat', sans-serif;
          color: ${oliveDark};
        }

        /* Animations */
        .bo-fade-up {
          opacity: 0;
          transform: translateY(50px);
          transition: opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bo-parallax-img {
          opacity: 0;
          transform: translateY(80px) scale(0.95);
          transition: opacity 1.8s cubic-bezier(0.16, 1, 0.3, 1), transform 1.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bo-timeline-card {
          opacity: 0;
          transform: translateX(40px);
          transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bo-timeline-item:nth-child(even) .bo-timeline-card {
          transform: translateX(-40px);
        }
        .bo-visible {
          opacity: 1 !important;
          transform: translate(0) scale(1) !important;
        }

        @keyframes boSlideDownFloat {
          0% { transform: translateY(-50px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes boFadeInRight {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes boFadeInLeft {
          from { transform: translateX(-30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes boSlowPan {
          from { transform: scale(1.0) translate(0, 0); }
          to { transform: scale(1.15) translate(-2%, 2%); }
        }
        @keyframes boSoftFloat {
          0% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0); }
        }
        @keyframes boScrollPulse {
          0% { transform: scaleY(0); transform-origin: top; }
          50% { transform: scaleY(1); transform-origin: top; }
          50.1% { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }

        /* ===== HERO: HORIZONTAL NAMES ===== */
        .bo-hero {
          position: relative;
          min-height: 95vh;
          background: ${cream};
          overflow: hidden;
        }
        .bo-hero-img-container {
          position: absolute;
          top: 0; left: 0;
          width: 85%;
          height: 72%;
          border-bottom-right-radius: 180px;
          overflow: hidden;
          box-shadow: 25px 25px 60px rgba(44,54,26,0.15);
          animation: boSlideDownFloat 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 1;
        }
        .bo-hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          animation: boSlowPan 20s linear infinite alternate;
        }
        .bo-hero-text {
          position: absolute;
          bottom: 12%;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          z-index: 2;
          width: 90%;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }
        .bo-name-1, .bo-name-2 {
          font-family: 'Great Vibes', cursive;
          font-size: clamp(2.5rem, 8vw, 3.5rem);
          color: ${oliveDark};
          line-height: 1.1;
          text-shadow: 2px 2px 8px rgba(212,175,55,0.3);
          padding: 10px 0;
          margin: 0;
        }
        .bo-name-and {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 4px;
          color: ${gold}; 
          margin: 0;
        }
        .bo-hero-date {
          position: absolute;
          top: 40px; right: 20px;
          writing-mode: vertical-rl;
          font-size: 0.75rem;
          letter-spacing: 6px;
          color: ${sage};
          opacity: 0;
          animation: boFadeInRight 1.5s ease forwards 1.4s;
          font-weight: 500;
        }

        /* ===== STORY & COUNTDOWN (CRYSTAL GLASS) ===== */
        .bo-glass-card {
          background: rgba(247, 246, 242, 0.5);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          padding: 45px 30px;
          border-radius: 24px;
          margin: -80px 20px 60px;
          position: relative;
          z-index: 3;
          box-shadow: 0 25px 50px rgba(44,54,26,0.08), inset 0 0 20px rgba(255,255,255,0.6);
          text-align: center;
        }
        .bo-glass-quote {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1.4rem;
          line-height: 1.7;
          color: ${oliveDark};
          margin-bottom: 35px;
          position: relative;
        }
        .bo-glass-quote::before, .bo-glass-quote::after {
          content: '—';
          color: ${gold};
          margin: 0 10px;
          opacity: 0.5;
        }
        .bo-countdown {
          display: flex;
          justify-content: space-around;
          align-items: center;
        }
        .bo-cd-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .bo-cd-ring {
          width: 60px; height: 60px;
          border-radius: 50%;
          border: 1px solid rgba(212,175,55,0.4); 
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 10px;
          background: rgba(255,255,255,0.3);
        }
        .bo-cd-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.8rem;
          color: ${oliveDark};
          line-height: 1;
        }
        .bo-cd-label {
          font-size: 0.55rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: ${sage};
          font-weight: 500;
        }

        /* ===== SCATTERED POLAROID COLLAGE ===== */
        .bo-collage-section {
          padding: 50px 20px;
          position: relative;
          background: ${cream};
        }
        .bo-section-title {
          font-family: 'Great Vibes', cursive;
          font-size: 4rem;
          color: ${oliveDark};
          text-align: center;
          margin-bottom: 50px;
          line-height: 0.8;
          text-shadow: 1px 1px 5px rgba(212,175,55,0.15);
        }
        .bo-collage {
          position: relative;
          height: 700px;
        }
        .bo-collage-img-1 {
          position: absolute;
          top: 0; left: -10px;
          width: 65%; height: 320px;
          border-radius: 12px;
          object-fit: cover;
          box-shadow: 0 20px 40px rgba(44,54,26,0.15);
          z-index: 1;
          transform: rotate(-3deg);
        }
        .bo-collage-img-2 {
          position: absolute;
          top: 220px; right: -10px;
          width: 60%; height: 280px;
          border-radius: 12px;
          object-fit: cover;
          z-index: 2;
          box-shadow: -15px 25px 40px rgba(44,54,26,0.15);
          transform: rotate(4deg);
        }
        .bo-collage-img-3 {
          position: absolute;
          bottom: 20px; left: 15%;
          width: 65%; height: 250px;
          border-radius: 12px;
          object-fit: cover;
          z-index: 3;
          box-shadow: 0 20px 40px rgba(44,54,26,0.15);
          transform: rotate(-2deg);
        }
        .bo-visible.bo-collage-img-1 { transform: rotate(-3deg) scale(1) !important; }
        .bo-visible.bo-collage-img-2 { transform: rotate(4deg) scale(1) !important; }
        .bo-visible.bo-collage-img-3 { transform: rotate(-2deg) scale(1) !important; }

        /* ===== ORGANIC ITINERARY ===== */
        .bo-program-section {
          padding: 90px 20px;
          background: #F0EFEA;
          position: relative;
        }
        .bo-timeline-container {
          position: relative;
          margin-top: 50px;
        }
        .bo-timeline-line {
          position: absolute;
          left: 50%; top: 0;
          width: 1px; height: 100%;
          background: ${gold};
          opacity: 0.4;
        }
        .bo-timeline-item {
          position: relative;
          margin-bottom: 50px;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .bo-timeline-item:nth-child(odd) { justify-content: flex-start; }
        .bo-timeline-item:nth-child(even) { justify-content: flex-end; }
        
        .bo-timeline-card {
          width: 45%;
          background: ${cream};
          padding: 25px 15px;
          border-radius: 18px;
          box-shadow: 0 15px 35px rgba(44,54,26,0.06);
          text-align: center;
          position: relative;
          z-index: 2;
        }
        .bo-timeline-dot {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 14px; height: 14px;
          background: ${cream};
          border: 2px solid ${gold};
          border-radius: 50%;
          z-index: 3;
          box-shadow: 0 0 10px rgba(212,175,55,0.4);
        }
        .bo-time {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.3rem;
          color: ${oliveDark};
          font-weight: 600;
          margin-bottom: 8px;
        }
        .bo-event {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 3px;
          color: ${sage};
          font-weight: 500;
        }

        /* ===== DETAILS & GIFTS ===== */
        .bo-details-section {
          padding: 90px 20px;
          text-align: center;
          background: ${cream};
        }
        .bo-details-card {
          margin-bottom: 60px;
        }
        .bo-details-title {
          font-family: 'Great Vibes', cursive;
          font-size: 3.5rem;
          color: ${oliveDark};
          margin-bottom: 10px;
        }
        .bo-details-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.3rem;
          color: ${sage};
          margin-bottom: 25px;
        }
        .bo-palette {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 30px;
        }
        .bo-swatch {
          width: 38px; height: 55px;
          border-radius: 20px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
          border: 2px solid ${cream};
        }
        
        .bo-gifts-text {
          font-size: 0.85rem;
          color: ${sage};
          line-height: 1.8;
          margin-bottom: 30px;
          padding: 0 10px;
        }
        .bo-gift-cards-container {
          display: flex;
          flex-direction: column;
          gap: 30px;
          padding: 0 20px;
          margin-top: 40px;
        }
        .bo-gift-card {
          background: transparent;
          padding: 50px 20px 40px;
          border-radius: 140px 140px 15px 15px; /* Elegant Arch shape */
          border: 1px solid rgba(138, 154, 117, 0.4); /* Thin sage border */
          position: relative;
        }
        .bo-gift-card h4 {
          font-family: 'Great Vibes', cursive;
          font-size: 3rem;
          color: ${oliveDark};
          margin-bottom: 10px;
          line-height: 1;
        }
        .bo-gift-details {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.3rem;
          color: ${oliveDark};
          line-height: 1.4;
        }
        .bo-gift-details strong {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.65rem;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: ${sage};
          display: block;
          margin-top: 25px;
          margin-bottom: 5px;
        }

        /* ===== RSVP REVERTED (ORIGINAL INPUTS) ===== */
        .bo-rsvp-wrapper {
          position: relative;
          padding: 120px 20px;
          background: url(${heroImg}) center/cover fixed;
        }
        .bo-rsvp-overlay {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(135deg, rgba(44,54,26,0.7) 0%, rgba(44,54,26,0.9) 100%);
        }
        .bo-rsvp-glass {
          position: relative;
          z-index: 2;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.5);
          border-left: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 30px;
          padding: 60px 30px;
          text-align: center;
          color: #FFF;
          box-shadow: 0 40px 80px rgba(0,0,0,0.4), inset 0 0 30px rgba(255,255,255,0.1);
        }
        .bo-rsvp-title {
          font-family: 'Great Vibes', cursive;
          font-size: 4rem;
          margin-bottom: 10px;
          text-shadow: 2px 2px 10px rgba(0,0,0,0.2);
        }
        .bo-rsvp-subtitle {
          font-size: 0.8rem;
          letter-spacing: 4px;
          text-transform: uppercase;
          margin-bottom: 50px;
          color: ${gold};
          font-weight: 500;
        }
        .bo-input {
          width: 100%;
          padding: 15px 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.3);
          color: #FFF;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem;
          outline: none;
          margin-bottom: 30px;
          transition: border-color 0.3s, background 0.3s;
        }
        .bo-input::placeholder { color: rgba(255,255,255,0.5); }
        .bo-input:focus { 
          border-bottom-color: ${gold}; 
          background: rgba(255,255,255,0.05);
        }
        
        .bo-select {
          width: 100%;
          padding: 15px 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.3);
          color: #FFF;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem;
          outline: none;
          margin-bottom: 30px;
        }
        .bo-select option { color: ${oliveDark}; background: #FFF; }
        
        .bo-radio-wrap {
          display: flex;
          justify-content: center;
          gap: 25px;
          margin-bottom: 40px;
        }
        .bo-radio {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          cursor: pointer;
          letter-spacing: 1px;
        }
        .bo-radio input { accent-color: ${gold}; width: 16px; height: 16px; }
        
        .bo-submit {
          background: #FFF;
          color: ${oliveDark};
          padding: 20px 50px;
          border: none;
          border-radius: 40px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, background 0.4s;
        }
        .bo-submit:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.3);
          background: ${gold};
          color: #FFF;
        }
        .bo-success {
          padding: 20px 0;
        }
        .bo-success i {
          font-size: 3.5rem;
          color: ${gold};
          margin-bottom: 25px;
        }

        /* ===== FOOTER ===== */
        .bo-footer {
          padding: 60px 20px;
          text-align: center;
          background: ${cream};
          position: relative;
        }
        .bo-footer::before {
          content: '';
          position: absolute;
          top: 0; left: 30%; right: 30%;
          height: 1px;
          background: rgba(44,54,26,0.1);
        }
        .bo-footer-names {
          font-family: 'Great Vibes', cursive;
          font-size: 3rem;
          color: ${oliveDark};
          margin-bottom: 15px;
        }
        .bo-footer-date {
          font-size: 0.7rem;
          letter-spacing: 5px;
          text-transform: uppercase;
          color: ${sage};
          font-weight: 500;
        }
      `}</style>

      <div className="bo-wrapper">
        <div className="bo-container">
          
          {/* HERO */}
          <div className="bo-hero">
            <div className="bo-hero-date">
              {String(dayNum).padStart(2,'0')} . {String(monthNum+1).padStart(2,'0')} . {year}
            </div>
            
            <div className="bo-hero-img-container">
              <img src={heroImg} className="bo-hero-img" alt="Couple" />
            </div>

            <div className="bo-hero-text">
              <div className="bo-name-1">{brideFirst}</div>
              <div className="bo-name-and">and</div>
              <div className="bo-name-2">{groomFirst}</div>
            </div>
          </div>

          {/* CRYSTAL GLASS STORY & COUNTDOWN */}
          <div className="bo-glass-card">
            <div className="bo-glass-quote bo-fade-up">
              "{d.story?.highlight || defaultData.story.highlight}"
            </div>
            <div className="bo-countdown bo-fade-up" style={{ transitionDelay: '0.2s' }}>
              <div className="bo-cd-item">
                <div className="bo-cd-ring"><span className="bo-cd-num">{timeLeft.days}</span></div>
                <span className="bo-cd-label">Days</span>
              </div>
              <div className="bo-cd-item">
                <div className="bo-cd-ring"><span className="bo-cd-num">{timeLeft.hours}</span></div>
                <span className="bo-cd-label">Hours</span>
              </div>
              <div className="bo-cd-item">
                <div className="bo-cd-ring"><span className="bo-cd-num">{timeLeft.minutes}</span></div>
                <span className="bo-cd-label">Mins</span>
              </div>
            </div>
          </div>

          {/* SCATTERED POLAROID COLLAGE */}
          <div className="bo-collage-section">
            <h2 className="bo-section-title bo-fade-up">Memories</h2>
            <div className="bo-collage">
              <img src={img2} className="bo-collage-img-1 bo-parallax-img" style={{ transitionDelay: '0.1s' }} alt="Gallery 1" />
              <img src={img3} className="bo-collage-img-2 bo-parallax-img" style={{ transitionDelay: '0.3s' }} alt="Gallery 2" />
              <img src={heroImg} className="bo-collage-img-3 bo-parallax-img" style={{ transitionDelay: '0.5s' }} alt="Gallery 3" />
            </div>
          </div>

          {/* ORGANIC ITINERARY */}
          <div className="bo-program-section">
            <h2 className="bo-section-title bo-fade-up">Itinerary</h2>
            <div className="bo-timeline-container">
              <div className="bo-timeline-line"></div>
              
              <div className="bo-timeline-item">
                <div className="bo-timeline-dot"></div>
                <div className="bo-timeline-card bo-fade-up">
                  <div className="bo-time">3:30 PM</div>
                  <div className="bo-event">Welcome</div>
                </div>
              </div>
              
              <div className="bo-timeline-item">
                <div className="bo-timeline-dot"></div>
                <div className="bo-timeline-card bo-fade-up">
                  <div className="bo-time">{d.ceremony?.time || '4:00 PM'}</div>
                  <div className="bo-event">Ceremony</div>
                </div>
              </div>
              
              <div className="bo-timeline-item">
                <div className="bo-timeline-dot"></div>
                <div className="bo-timeline-card bo-fade-up">
                  <div className="bo-time">5:00 PM</div>
                  <div className="bo-event">Cocktails</div>
                </div>
              </div>
              
              <div className="bo-timeline-item">
                <div className="bo-timeline-dot"></div>
                <div className="bo-timeline-card bo-fade-up">
                  <div className="bo-time">{d.reception?.time || '6:30 PM'}</div>
                  <div className="bo-event">Reception</div>
                </div>
              </div>

            </div>
          </div>

          {/* DETAILS & GIFTS */}
          <div className="bo-details-section">
            <div className="bo-details-card bo-fade-up">
              <div className="bo-details-title">Dress Code</div>
              <div className="bo-details-subtitle">{d.dressCode || 'Ethereal Botanical'}</div>
              <p style={{ fontSize: '0.85rem', color: sage, lineHeight: '1.8' }}>
                {d.dressCodeDescription || defaultData.dressCodeDescription}
              </p>
              <div className="bo-palette">
                {paletteColors.map((color, idx) => (
                  <div key={idx} className="bo-swatch" style={{ background: color }}></div>
                ))}
              </div>
            </div>

            <div className="bo-details-card bo-fade-up" style={{ transitionDelay: '0.2s' }}>
              <div className="bo-details-title">Venue</div>
              <div className="bo-details-subtitle">{d.venue?.name || 'Restaurant Maison La Prairie'}</div>
              <p style={{ fontSize: '0.85rem', color: sage, lineHeight: '1.8' }}>
                {d.venue?.address || 'Heather Street, 12'}
              </p>
            </div>
            
            <div className="bo-details-card bo-fade-up" style={{ transitionDelay: '0.4s' }}>
              <div className="bo-details-title">Registry</div>
              <div className="bo-details-subtitle">A Token of Love</div>
              <p className="bo-gifts-text">
                Your presence is the greatest gift. However, if you wish to honor us with a gift, a contribution would be deeply appreciated.
              </p>
              <div className="bo-gift-cards-container">
                <div className="bo-gift-card bo-fade-up">
                  <h4>Bank Transfer</h4>
                  <div className="bo-gift-details">
                    <strong>Bank</strong>
                    Zambia National Commercial Bank (Zanaco)
                    
                    <strong>Account Name</strong>
                    {groomFirst} & {brideFirst}
                    
                    <strong>Account Number</strong>
                    1029384756
                    
                    <strong>Branch</strong>
                    Lusaka Corporate
                  </div>
                </div>

                <div className="bo-gift-card bo-fade-up" style={{ transitionDelay: '0.2s' }}>
                  <h4>Mobile Money</h4>
                  <div className="bo-gift-details">
                    <strong>MTN Money</strong>
                    +260 973 848066
                    
                    <strong>Airtel Money</strong>
                    +260 762 123456
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RSVP CRYSTAL GLASS */}
          <div className="bo-rsvp-wrapper">
            <div className="bo-rsvp-overlay"></div>
            <div className="bo-rsvp-glass bo-fade-up">
              {!rsvpSubmitted ? (
                <>
                  <h2 className="bo-rsvp-title">RSVP</h2>
                  <div className="bo-rsvp-subtitle">Kindly Respond</div>
                  <form onSubmit={handleRsvpSubmit}>
                    <input type="text" className="bo-input" placeholder="Your Name" required 
                      value={rsvpForm.name} onChange={e => setRsvpForm({...rsvpForm, name: e.target.value})} />
                    
                    <input type="tel" className="bo-input" placeholder="Phone Number" required 
                      value={rsvpForm.phone} onChange={e => setRsvpForm({...rsvpForm, phone: e.target.value})} />
                    
                    <select className="bo-select" value={rsvpForm.guests} onChange={e => setRsvpForm({...rsvpForm, guests: e.target.value})}>
                      <option value="" disabled>Number of Guests</option>
                      <option value="1">1 Guest</option>
                      <option value="2">2 Guests</option>
                      <option value="3">3 Guests</option>
                      <option value="4">4 Guests</option>
                    </select>
                    
                    <div className="bo-radio-wrap">
                      <label className="bo-radio">
                        <input type="radio" name="attending" value="yes" checked={rsvpForm.attending === 'yes'}
                          onChange={e => setRsvpForm({...rsvpForm, attending: e.target.value})} /> Joyfully Accept
                      </label>
                      <label className="bo-radio">
                        <input type="radio" name="attending" value="no" checked={rsvpForm.attending === 'no'}
                          onChange={e => setRsvpForm({...rsvpForm, attending: e.target.value})} /> Regretfully Decline
                      </label>
                    </div>

                    <button type="submit" className="bo-submit">Send Reply</button>
                  </form>
                </>
              ) : (
                <div className="bo-success bo-fade-in">
                  <i className="fa-solid fa-envelope-open-text"></i>
                  <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.5rem' }}>Thank You</h3>
                  <p style={{ marginTop: '15px', fontSize: '1rem', opacity: 0.9 }}>Your RSVP has been beautifully received.</p>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="bo-footer">
            <div className="bo-footer-names">{groomFirst} & {brideFirst}</div>
            <div className="bo-footer-date">
              {String(dayNum).padStart(2,'0')} . {String(monthNum+1).padStart(2,'0')} . {year}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default BotanicalOlive;
