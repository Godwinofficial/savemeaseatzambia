import React, { useState, useEffect } from 'react';

const TerracottaEarth = ({ weddingData }) => {
  const defaultData = {
    couple: {
      bride: { name: 'Catherine' },
      groom: { name: 'Alexander' }
    },
    date: '2025-09-08T16:00:00',
    venue: { name: 'Restaurant «Sails»', address: 'Marine Embankment, 15' },
    location: 'St. Petersburg',
    ceremony: { time: '4:00 PM', venue: 'Grand Hall' },
    reception: { time: '6:00 PM', venue: 'Restaurant «Sails»', address: 'Marine Embankment, 15' },
    story: { highlight: 'We invite you to share in the romance and joy as we begin our forever. Your presence will make our celebration truly complete.' },
    sliderImages: [
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200'
    ],
    dressCode: 'Earthy Elegance',
    dressCodeDescription: 'We kindly request our guests to dress in our earthy palette to help create a beautiful visual harmony.',
    dress_code_colors: ['#2C2421', '#887064', '#C16E5A', '#E2D1C3', '#FAF7F2']
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
    return new Date('2025-09-08T16:00:00');
  };
  const eventDate = getParsedDate();

  const dayNum = eventDate.getDate();
  const monthNum = eventDate.getMonth();
  const year = eventDate.getFullYear();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Colors
  const bgMain = '#FCFAF8';
  const terracotta = '#C16E5A';
  const terracottaLight = '#E4A293';
  const darkEspresso = '#2C2421';
  const textMuted = '#887064';
  const accentSand = '#E2D1C3';

  // State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpForm, setRsvpForm] = useState({ name: '', phone: '', email: '', guests: '1', attending: 'yes', message: '' });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

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

  // Gallery auto transition
  useEffect(() => {
    if (sliderImages && sliderImages.length > 1) {
      const interval = setInterval(() => {
        setGalleryIndex(prev => (prev + 1) % sliderImages.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [sliderImages]);

  // Scroll animations with a delay logic
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('te-visible');
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.te-fade-up, .te-fade-in, .te-slide-right').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [d]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Calendar
  const generateCalendar = () => {
    const firstDay = new Date(year, monthNum, 1);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
    const prevMonthDays = new Date(year, monthNum, 0).getDate();

    const cells = [];
    for (let i = startDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, current: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ day: i, current: true, isTarget: i === dayNum });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: cells.length - (startDay + daysInMonth) + 1, current: false });
    }
    return cells;
  };

  const calendarCells = generateCalendar();

  const handleRsvpSubmit = (e) => {
    e.preventDefault();
    setRsvpSubmitted(true);
    const text = `Wedding RSVP\n\nFull Name: ${rsvpForm.name}\nPhone: ${rsvpForm.phone}\nAttending: ${rsvpForm.attending === 'yes' ? 'Yes' : 'No'}\nGuests: ${rsvpForm.guests}\nMessage: ${rsvpForm.message || 'None'}`;
    const encoded = encodeURIComponent(text);
    setTimeout(() => {
      window.open(`https://wa.me/260973848066?text=${encoded}`, '_blank');
    }, 1200);
  };

  const paletteColors = d.dress_code_colors || ['#2C2421', '#887064', '#C16E5A', '#E2D1C3', '#FAF7F2'];
  const heroImage = sliderImages[0];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Montserrat:wght@200;300;400;500;600&family=Pinyon+Script&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .te-wrapper {
          width: 100%;
          min-height: 100vh;
          background: #F4F0EA;
          background-image: radial-gradient(#E2D1C3 0.5px, transparent 0.5px);
          background-size: 20px 20px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 0;
        }

        .te-container {
          width: 100%;
          max-width: 440px;
          min-height: 100vh;
          background: ${bgMain};
          box-shadow: 0 40px 100px rgba(44,36,33,0.12);
          overflow: hidden;
          position: relative;
          font-family: 'Montserrat', sans-serif;
          color: ${darkEspresso};
        }

        /* Animations */
        .te-fade-up {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .te-fade-in {
          opacity: 0;
          transition: opacity 1.2s ease-out;
        }
        .te-slide-right {
          opacity: 0;
          transform: translateX(-30px);
          transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .te-visible {
          opacity: 1;
          transform: translate(0);
        }

        h1, h2, h3, h4 {
          font-family: 'Cormorant Garamond', serif;
        }

        /* ===== HERO ANIMATIONS ===== */
        @keyframes teHeroFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes teHeroZoom {
          from { transform: scale(1.08); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes teHeroOutlineSlide {
          from { transform: translateX(-50%) translateY(30px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 0.4; }
        }
        @keyframes teHeroTextUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* ===== HERO ===== */
        .te-hero {
          position: relative;
          min-height: 85vh;
          padding: 40px 25px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: ${bgMain};
        }
        .te-hero-top {
          display: flex;
          justify-content: space-between;
          width: 100%;
          font-size: 0.65rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: ${textMuted};
          margin-bottom: 40px;
          border-bottom: 1px solid ${accentSand};
          padding-bottom: 10px;
          opacity: 0;
          animation: teHeroFadeIn 1.2s ease forwards 0.2s;
        }
        .te-hero-arch-container {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
          margin-bottom: -60px;
          z-index: 1;
        }
        .te-hero-arch-outline {
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 250px;
          height: 350px;
          border-top-left-radius: 125px;
          border-top-right-radius: 125px;
          border: 1px solid ${terracotta};
          opacity: 0;
          z-index: 0;
          animation: teHeroOutlineSlide 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.4s;
        }
        .te-hero-arch {
          width: 230px;
          height: 320px;
          border-top-left-radius: 115px;
          border-top-right-radius: 115px;
          background: url(${heroImage}) center/cover;
          position: relative;
          z-index: 2;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          opacity: 0;
          animation: teHeroZoom 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.1s;
        }
        .te-hero-typography {
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          margin-top: 75px;
          opacity: 0;
          animation: teHeroTextUp 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.6s;
        }
        .te-couple-names {
          font-size: 3.2rem;
          line-height: 1;
          color: ${darkEspresso};
          font-weight: 500;
          text-align: center;
          width: 100%;
        }
        .te-couple-and {
          font-family: 'Pinyon Script', cursive;
          font-size: 4rem;
          color: ${terracotta};
          margin: -25px 0 -15px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        .te-hero-date-box {
          margin-top: 30px;
          display: inline-block;
          border: 1px solid ${accentSand};
          padding: 12px 25px;
          font-size: 0.75rem;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: ${terracotta};
        }

        /* ===== STORY & COUNTDOWN ===== */
        .te-story-section {
          padding: 80px 30px 60px;
          text-align: center;
          position: relative;
        }
        .te-story-text {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1.4rem;
          line-height: 1.6;
          color: ${darkEspresso};
          margin-bottom: 50px;
        }
        .te-countdown {
          display: flex;
          justify-content: space-around;
          align-items: center;
          border-top: 1px solid ${accentSand};
          border-bottom: 1px solid ${accentSand};
          padding: 25px 0;
        }
        .te-cd-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .te-cd-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.2rem;
          color: ${terracotta};
          line-height: 1;
        }
        .te-cd-label {
          font-size: 0.6rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: ${textMuted};
          margin-top: 5px;
        }

        /* ===== SAVE THE DATE / CALENDAR ===== */
        .te-calendar-section {
          padding: 60px 30px;
          background: ${darkEspresso};
          color: ${bgMain};
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .te-calendar-section::before {
          content: 'RSVP';
          position: absolute;
          font-family: 'Cormorant Garamond', serif;
          font-size: 12rem;
          color: rgba(255,255,255,0.03);
          top: -50px;
          left: -20px;
          z-index: 0;
        }
        .te-section-title {
          position: relative;
          z-index: 1;
          font-size: 2.5rem;
          color: ${terracottaLight};
          margin-bottom: 10px;
          font-weight: 400;
        }
        .te-cal-container {
          position: relative;
          z-index: 1;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 30px 20px;
          border-radius: 16px;
          margin-top: 30px;
        }
        .te-cal-month {
          font-family: 'Pinyon Script', cursive;
          font-size: 3rem;
          color: ${bgMain};
          margin-bottom: 20px;
          line-height: 0.8;
        }
        .te-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 12px 5px;
        }
        .te-cal-header {
          font-size: 0.65rem;
          font-weight: 500;
          color: ${terracottaLight};
          text-transform: uppercase;
        }
        .te-cal-cell {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.8);
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 30px;
        }
        .te-cal-cell.other-month {
          color: rgba(255,255,255,0.2);
        }
        .te-cal-cell.target-day {
          color: ${darkEspresso};
          font-weight: 600;
        }
        .te-cal-cell.target-day::before {
          content: '';
          position: absolute;
          width: 32px;
          height: 32px;
          background: ${terracottaLight};
          border-radius: 50%;
          z-index: -1;
        }

        /* ===== PROGRAM ===== */
        .te-program-section {
          padding: 80px 30px;
          background: ${bgMain};
        }
        .te-program-title {
          font-size: 2.5rem;
          color: ${darkEspresso};
          text-align: center;
          margin-bottom: 40px;
        }
        .te-timeline {
          position: relative;
        }
        .te-timeline::before {
          content: '';
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 1px;
          height: 100%;
          background: ${accentSand};
        }
        .te-timeline-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          position: relative;
        }
        .te-timeline-dot {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background: ${bgMain};
          border: 1px solid ${terracotta};
          border-radius: 50%;
          z-index: 2;
        }
        .te-timeline-content {
          width: 42%;
          text-align: right;
        }
        .te-timeline-item:nth-child(even) .te-timeline-content {
          margin-left: auto;
          text-align: left;
        }
        .te-timeline-time {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem;
          color: ${terracotta};
          font-style: italic;
        }
        .te-timeline-event {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: ${darkEspresso};
          margin-top: 5px;
        }

        /* ===== GALLERY CAROUSEL ===== */
        .te-gallery-section {
          padding: 60px 0;
          background: ${bgMain};
          overflow: hidden;
        }
        .te-gallery-title {
          text-align: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.5rem;
          color: ${darkEspresso};
          margin-bottom: 30px;
        }
        .te-gallery-slider {
          position: relative;
          width: 100%;
          height: 480px;
          overflow: hidden;
        }
        .te-gallery-track {
          display: flex;
          height: 100%;
          transition: transform 1.2s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .te-gallery-slide {
          min-width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .te-gallery-slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .te-gallery-nav {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 25px;
        }
        .te-gallery-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${accentSand};
          transition: all 0.4s ease;
          cursor: pointer;
        }
        .te-gallery-dot.active {
          background: ${terracotta};
          transform: scale(1.5);
        }

        /* ===== DETAILS (VENUE/DRESS) ===== */
        .te-details-section {
          padding: 60px 30px;
          background: #F8F5F1;
          text-align: center;
        }
        .te-details-card {
          background: #FFF;
          padding: 40px 20px;
          border: 1px solid ${accentSand};
          margin-bottom: 30px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.02);
        }
        .te-card-title {
          font-family: 'Pinyon Script', cursive;
          font-size: 3rem;
          color: ${terracotta};
          margin-bottom: 10px;
          line-height: 0.8;
        }
        .te-card-subtitle {
          font-size: 0.7rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: ${darkEspresso};
          margin-bottom: 20px;
          font-weight: 600;
        }
        .te-color-palette {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 25px;
        }
        .te-swatch {
          width: 35px; height: 50px;
          border-radius: 20px;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
        }
        .te-map-wrap {
          width: 100%;
          height: 200px;
          margin-top: 25px;
          filter: grayscale(0.4) contrast(1.1);
        }

        /* ===== RSVP ===== */
        .te-rsvp-section {
          padding: 80px 30px;
          background: ${terracotta};
          color: ${bgMain};
          text-align: center;
          position: relative;
        }
        .te-rsvp-section::before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1), transparent 70%);
        }
        .te-rsvp-title {
          font-size: 2.8rem;
          color: #FFF;
          position: relative;
          z-index: 2;
        }
        .te-rsvp-subtitle {
          font-size: 0.8rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 40px;
          opacity: 0.8;
          position: relative;
          z-index: 2;
        }
        .te-form {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .te-input-group {
          position: relative;
        }
        .te-input {
          width: 100%;
          padding: 15px 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.4);
          color: #FFF;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.3s;
        }
        .te-input::placeholder {
          color: rgba(255,255,255,0.6);
        }
        .te-input:focus {
          border-bottom-color: #FFF;
        }
        .te-select {
          width: 100%;
          padding: 15px 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.4);
          color: #FFF;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          outline: none;
          cursor: pointer;
        }
        .te-select option {
          color: ${darkEspresso};
          background: #FFF;
        }
        .te-radio-container {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-top: 10px;
        }
        .te-radio {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .te-radio input {
          accent-color: #FFF;
          width: 16px; height: 16px;
        }
        .te-submit {
          background: #FFF;
          color: ${terracotta};
          padding: 18px;
          border: none;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-top: 20px;
          cursor: pointer;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .te-submit:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        }
        .te-success {
          padding: 40px 0;
          position: relative;
          z-index: 2;
        }
        .te-success i {
          font-size: 3rem;
          margin-bottom: 20px;
        }

        /* ===== FOOTER ===== */
        .te-footer {
          padding: 60px 30px;
          background: ${darkEspresso};
          color: ${bgMain};
          text-align: center;
        }
        .te-footer-names {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.2rem;
          margin-bottom: 10px;
        }
        .te-footer-date {
          font-size: 0.7rem;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: ${terracottaLight};
        }
      `}</style>

      <div className="te-wrapper">
        <div className="te-container">
          
          {/* HERO */}
          <div className="te-hero">
            <div className="te-hero-top">
              <span>Wedding</span>
              <span>Invitation</span>
            </div>
            
            <div className="te-hero-arch-container">
              <div className="te-hero-arch-outline"></div>
              <div className="te-hero-arch"></div>
            </div>

            <div className="te-hero-typography">
              <div className="te-couple-names">{groomFirst}</div>
              <div className="te-couple-and">&</div>
              <div className="te-couple-names">{brideFirst}</div>
              
              <div className="te-hero-date-box">
                {String(dayNum).padStart(2,'0')}.{String(monthNum+1).padStart(2,'0')}.{year}
              </div>
            </div>
          </div>

          {/* STORY & COUNTDOWN */}
          <div className="te-story-section">
            <p className="te-story-text te-fade-up">
              "{d.story?.highlight || defaultData.story.highlight}"
            </p>
            
            <div className="te-countdown te-fade-in">
              <div className="te-cd-item">
                <span className="te-cd-num">{timeLeft.days}</span>
                <span className="te-cd-label">Days</span>
              </div>
              <div className="te-cd-item">
                <span className="te-cd-num">{timeLeft.hours}</span>
                <span className="te-cd-label">Hours</span>
              </div>
              <div className="te-cd-item">
                <span className="te-cd-num">{timeLeft.minutes}</span>
                <span className="te-cd-label">Mins</span>
              </div>
            </div>
          </div>

          {/* CALENDAR */}
          <div className="te-calendar-section">
            <h2 className="te-section-title te-fade-up">Save The Date</h2>
            <div className="te-cal-container te-fade-up" style={{ transitionDelay: '0.2s' }}>
              <div className="te-cal-month">{monthNames[monthNum]}</div>
              <div className="te-calendar-grid">
                {['M','T','W','T','F','S','S'].map((wd, i) => (
                  <div key={i} className="te-cal-header">{wd}</div>
                ))}
                {calendarCells.map((cell, idx) => (
                  <div key={idx} className={`te-cal-cell ${!cell.current ? 'other-month' : ''} ${cell.isTarget ? 'target-day' : ''}`}>
                    {cell.day}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PROGRAM */}
          <div className="te-program-section">
            <h2 className="te-program-title te-fade-up">Itinerary</h2>
            <div className="te-timeline">
              {d.ceremony?.time && (
                <div className="te-timeline-item te-slide-right" style={{ transitionDelay: '0.1s' }}>
                  <div className="te-timeline-content" style={{ opacity: 0 }}></div>
                  <div className="te-timeline-dot"></div>
                  <div className="te-timeline-content">
                    <div className="te-timeline-time">{d.ceremony.time.replace(/\s*(AM|PM)/i, '')}</div>
                    <div className="te-timeline-event">Ceremony</div>
                  </div>
                </div>
              )}
              {d.reception?.time && (
                <div className="te-timeline-item te-slide-right" style={{ transitionDelay: '0.3s' }}>
                  <div className="te-timeline-content">
                    <div className="te-timeline-time">{d.reception.time.replace(/\s*(AM|PM)/i, '')}</div>
                    <div className="te-timeline-event">Reception</div>
                  </div>
                  <div className="te-timeline-dot"></div>
                  <div className="te-timeline-content" style={{ opacity: 0 }}></div>
                </div>
              )}
            </div>
          </div>

          {/* GALLERY CAROUSEL */}
          <div className="te-gallery-section te-fade-up">
            <h2 className="te-gallery-title">Memories</h2>
            <div className="te-gallery-slider">
              <div className="te-gallery-track" style={{ transform: `translateX(-${galleryIndex * 100}%)` }}>
                {sliderImages.map((img, idx) => (
                  <div key={idx} className="te-gallery-slide">
                    <img src={img} alt={`Gallery ${idx + 1}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="te-gallery-nav">
              {sliderImages.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`te-gallery-dot ${idx === galleryIndex ? 'active' : ''}`}
                  onClick={() => setGalleryIndex(idx)}
                ></div>
              ))}
            </div>
          </div>

          {/* DETAILS */}
          <div className="te-details-section">
            <div className="te-details-card te-fade-up">
              <div className="te-card-title">Dress Code</div>
              <div className="te-card-subtitle">{d.dressCode || 'Earthy Elegance'}</div>
              <p style={{ fontSize: '0.8rem', color: textMuted, lineHeight: '1.6' }}>
                {d.dressCodeDescription || defaultData.dressCodeDescription}
              </p>
              <div className="te-color-palette">
                {paletteColors.map((color, idx) => (
                  <div key={idx} className="te-swatch" style={{ background: color }}></div>
                ))}
              </div>
            </div>

            <div className="te-details-card te-fade-up" style={{ transitionDelay: '0.2s' }}>
              <div className="te-card-title">Venue</div>
              <div className="te-card-subtitle">{d.venue?.name || 'Restaurant Sails'}</div>
              <p style={{ fontSize: '0.8rem', color: textMuted, lineHeight: '1.6' }}>
                {d.venue?.address || 'Marine Embankment, 15'}
              </p>
              <div className="te-map-wrap">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent((d.venue?.name || '') + ' ' + (d.venue?.address || d.location || ''))}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  title="Venue Map"
                ></iframe>
              </div>
            </div>
          </div>

          {/* RSVP */}
          <div className="te-rsvp-section">
            <h2 className="te-rsvp-title te-fade-up">Join Us</h2>
            <div className="te-rsvp-subtitle te-fade-up">Kindly respond</div>

            {!rsvpSubmitted ? (
              <form className="te-form te-fade-up" style={{ transitionDelay: '0.2s' }} onSubmit={handleRsvpSubmit}>
                <div className="te-input-group">
                  <input type="text" className="te-input" placeholder="Your Name" required 
                    value={rsvpForm.name} onChange={e => setRsvpForm({...rsvpForm, name: e.target.value})} />
                </div>
                <div className="te-input-group">
                  <input type="tel" className="te-input" placeholder="Phone Number" required 
                    value={rsvpForm.phone} onChange={e => setRsvpForm({...rsvpForm, phone: e.target.value})} />
                </div>
                <div className="te-input-group">
                  <select className="te-select" value={rsvpForm.guests} onChange={e => setRsvpForm({...rsvpForm, guests: e.target.value})}>
                    <option value="" disabled>Number of Guests</option>
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4 Guests</option>
                  </select>
                </div>
                
                <div className="te-radio-container">
                  <label className="te-radio">
                    <input type="radio" name="attending" value="yes" checked={rsvpForm.attending === 'yes'}
                      onChange={e => setRsvpForm({...rsvpForm, attending: e.target.value})} /> Joyfully Accept
                  </label>
                  <label className="te-radio">
                    <input type="radio" name="attending" value="no" checked={rsvpForm.attending === 'no'}
                      onChange={e => setRsvpForm({...rsvpForm, attending: e.target.value})} /> Regretfully Decline
                  </label>
                </div>

                <button type="submit" className="te-submit">Send Reply</button>
              </form>
            ) : (
              <div className="te-success te-fade-in">
                <i className="fa-solid fa-envelope-open-text"></i>
                <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2rem' }}>Thank You</h3>
                <p style={{ marginTop: '10px', fontSize: '0.9rem', opacity: 0.9 }}>Your RSVP has been beautifully received.</p>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="te-footer">
            <div className="te-footer-names">{groomFirst} & {brideFirst}</div>
            <div className="te-footer-date">
              {String(dayNum).padStart(2,'0')}.{String(monthNum+1).padStart(2,'0')}.{year}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default TerracottaEarth;
