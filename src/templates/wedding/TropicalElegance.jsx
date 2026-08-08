import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import logoImg from '../../assets/images/logo1.png';
import { weddingMockData } from './weddingMockData';

const TropicalElegance = ({ weddingData }) => {
  const d = weddingData || weddingMockData['tropical-elegance'];

  const sliderImages = d.sliderImages?.length > 2 ? d.sliderImages : [
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800'
  ];

  const bgCream = '#FDFBF9'; // Extremely light, almost white cream from image
  const textBrown = '#5C3522'; // Dark brown text
  const accentBrown = '#8F664E'; // Softer brown for cursive
  const iconBg = '#5C3522';

  const brideFirst = d.couple?.bride?.name?.split(' ')[0] || 'Bride';
  const groomFirst = d.couple?.groom?.name?.split(' ')[0] || 'Groom';

  const galleryImages = d.galleryImages && d.galleryImages.length > 0
    ? d.galleryImages
    : (d.sliderImages && d.sliderImages.length > 0 ? d.sliderImages : sliderImages);

  const safeGifts = Array.isArray(d.gifts)
    ? d.gifts
    : (() => {
      if (!d.gifts) return [];
      if (typeof d.gifts === 'string') {
        try {
          const parsed = JSON.parse(d.gifts);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      }
      return [];
    })();

  const dressCodeColors = d.dress_code_colors && d.dress_code_colors.length > 0
    ? d.dress_code_colors
    : [];

  const eventDate = d.date ? new Date(d.date) : new Date('2026-09-28T17:00:00');
  const pad = (n) => String(n).padStart(2, '0');
  const day = eventDate.getDate();
  const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const month = englishMonths[eventDate.getMonth()];
  const year = eventDate.getFullYear();
  const timeStr = d.ceremony?.time || '5:00 PM Sharp';

  // RSVP Form State
  const [form, setForm] = useState({ name: '', email: '', phone: '', guests: '1', attendance: 'yes' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rsvpId, setRsvpId] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(() => {
    const musicUrl = d.music_url;
    if (musicUrl === "none") return null;
    const a = new Audio(musicUrl || "https://archive.org/download/100ClassicalMusicMasterpieces/1838%20Schumann%20-%20Traumerei.mp3");
    a.loop = true;
    return a;
  });

  const togglePlay = () => {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Audio playback failed:", err);
      });
    }
  };

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Hero Carousel State
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex(prev => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderImages]);

  useEffect(() => {
    const timer = setInterval(() => {
      const difference = eventDate.getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    }, 1000);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

    return () => {
      clearInterval(timer);
      observer.disconnect();
    };
  }, [eventDate]);

  useEffect(() => {
    if (!audio) return;
    const handleInteraction = () => {
      audio.play().then(() => {
        setIsPlaying(true);
        cleanup();
      }).catch(() => { });
    };
    const cleanup = () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('scroll', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      cleanup();
      audio.pause();
    };
  }, [audio]);

  useEffect(() => {
    if (d.allowedGuests && d.allowedGuests.length > 0) {
      setForm(prev => ({ ...prev, guests: d.allowedGuests[0] }));
    }
  }, [d.allowedGuests]);

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      if (d.id) {
        const { data, error } = await supabase.from('rsvps').insert([{ 
          wedding_id: d.id, 
          name: form.name, 
          email: form.email, 
          phone: form.phone, 
          attending: form.attendance, 
          guests_count: parseInt(form.guests) || 1, 
          status: 'pending' 
        }]).select();
        
        if (error) throw error;
        setRsvpId((data && data[0]?.id) || `local-${Date.now()}`);
      }
      setSubmitted(true);
    } catch (err) {
      console.error('TropicalElegance RSVP error:', err);
      setRsvpId(`local-${Date.now()}`);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const getQrValue = () => { try { return JSON.stringify({ id: rsvpId, name: form.name, phone: form.phone, guests: form.guests, wedding_id: d.id }); } catch (e) { return rsvpId || form.name || ''; } };

  const downloadPassCard = async () => {
    const getCardElement = () => document.getElementById('pass-card-container');
    let el = getCardElement();
    let attempts = 0;
    while (!el && attempts < 5) {
      await new Promise(resolve => setTimeout(resolve, 120));
      el = getCardElement();
      attempts += 1;
    }
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { useCORS: true, scale: 2, backgroundColor: '#ffffff' });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      const guestPart = (form.name || rsvpId || 'guest').toLowerCase().replace(/\s+/g, '-');
      a.href = url; a.download = `wedding-pass-${guestPart}.png`; a.click();
    } catch (err) { console.error('Error creating pass image', err); }
  };

  useEffect(() => { if (rsvpId) { const t = setTimeout(() => downloadPassCard(), 800); return () => clearTimeout(t); } }, [rsvpId]);

  const SectionPill = ({ icon, topText, bottomText, iconLeft = true }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', maxWidth: '320px', background: 'rgba(255, 255, 255, 0.7)',
      border: '1px solid rgba(92, 53, 34, 0.15)', borderRadius: '50px',
      padding: '5px', margin: '0 auto',
      flexDirection: iconLeft ? 'row' : 'row-reverse',
      boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
    }}>
      <div style={{
        width: '50px', height: '50px', backgroundColor: iconBg, borderRadius: '50%',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        color: '#fff', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(92, 53, 34, 0.2)'
      }}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.55rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: textBrown, marginBottom: '-2px' }}>
          {topText}
        </div>
        <div style={{ fontFamily: "'Alex Brush', cursive", fontSize: '2.1rem', color: accentBrown, lineHeight: '0.9' }}>
          {bottomText}
        </div>
      </div>
    </div>
  );

  const FloralCluster = ({ top, right, bottom, left, rotate }) => (
    <div style={{ position: 'absolute', top, right, bottom, left, transform: `rotate(${rotate}deg)`, opacity: 0.12, pointerEvents: 'none', zIndex: 1, width: '150px', height: '150px' }}>
      <i className="fas fa-leaf" style={{ fontSize: '120px', color: '#5C3522', position: 'absolute', top: 0, left: 0 }}></i>
      <i className="fas fa-seedling" style={{ fontSize: '80px', color: '#8F664E', position: 'absolute', top: '40px', left: '40px', transform: 'rotate(45deg)' }}></i>
      <i className="fab fa-pagelines" style={{ fontSize: '100px', color: '#5C3522', position: 'absolute', top: '-20px', left: '60px', transform: 'rotate(-30deg)' }}></i>
    </div>
  );

  const SquigglyDivider = () => (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '30px 0', opacity: 0.2, width: '100%' }}>
      <svg width="150" height="10" viewBox="0 0 150 10">
        <path d="M0,5 Q37.5,0 75,5 T150,5" fill="none" stroke={textBrown} strokeWidth="1" />
      </svg>
    </div>
  );

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,400;1,400&family=Montserrat:wght@200;300;400;500;600&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .inv-wrapper {
          width: 100%; min-height: 100vh; background-color: #2D1A10; display: flex; justify-content: center; align-items: flex-start;
          font-family: 'Cormorant Garamond', serif; color: ${textBrown};
        }

        .inv-container {
          width: 100%; max-width: 480px; min-height: 100vh; background-color: ${bgCream}; position: relative; overflow-x: hidden;
          box-shadow: 0 0 50px rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; padding-bottom: 80px;
        }

        .animate-on-scroll { opacity: 0; transform: translateY(60px) scale(0.95); transition: opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-on-scroll.visible { opacity: 1; transform: translateY(0) scale(1); }

        .inv-main-img-wrap {
          width: 100%; height: 480px; overflow: hidden; position: relative; z-index: 2;
          -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
          mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
        }
        .inv-main-img { 
          position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;
          opacity: 0; transition: opacity 2s ease-in-out, transform 8s linear; transform: scale(1);
        }
        .inv-main-img.active {
          opacity: 1; transform: scale(1.08);
        }

        .inv-intro {
          font-family: 'Montserrat', sans-serif; font-size: 0.55rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 3px; color: ${textBrown}; margin-bottom: 20px; text-align: center; z-index: 2; padding: 0 20px;
        }

        .inv-names {
          font-family: 'Alex Brush', cursive; font-size: 4.8rem; line-height: 1; margin-bottom: 20px; text-align: center; padding: 0 20px; z-index: 2; color: ${textBrown};
        }

        .inv-sub-intro {
          font-family: 'Montserrat', sans-serif; font-size: 0.6rem; font-weight: 500; text-transform: uppercase;
          letter-spacing: 2px; color: ${textBrown}; text-align: center; line-height: 1.8; padding: 0 40px; margin-bottom: 40px; z-index: 2;
        }

        .inv-date-block { display: flex; flex-direction: column; align-items: center; margin-bottom: 40px; position: relative; z-index: 2; width: 100%; }
        .inv-day { font-family: 'Cormorant Garamond', serif; font-size: 6.5rem; line-height: 0.75; color: ${textBrown}; font-weight: 400; }
        .inv-month { font-family: 'Alex Brush', cursive; font-size: 3.5rem; color: ${accentBrown}; margin-top: -15px; margin-bottom: 15px; z-index: 2; }
        .inv-year-time { font-family: 'Montserrat', sans-serif; font-size: 0.7rem; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: ${textBrown}; text-align: center; line-height: 1.6; }

        .inv-timer-wrap { display: flex; justify-content: center; gap: 10px; margin: 0 0 50px; z-index: 2; width: 85%; }
        .inv-timer-box { background: rgba(255,255,255,0.6); border: 1px solid rgba(92,53,34,0.1); border-radius: 12px; flex: 1; padding: 12px 5px; text-align: center; }
        .inv-timer-val { font-family: 'Playfair Display', serif; font-size: 1.4rem; color: ${textBrown}; line-height: 1; margin-bottom: 5px; }
        .inv-timer-lbl { font-family: 'Montserrat', sans-serif; font-size: 0.45rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${accentBrown}; }

        .inv-section-list { width: 100%; display: flex; flex-direction: column; align-items: center; z-index: 2; position: relative; }
        .inv-section-item { width: 100%; display: flex; flex-direction: column; align-items: center; position: relative; }

        .inv-section-content { width: 85%; max-width: 300px; text-align: center; padding-top: 15px; padding-bottom: 5px; }
        .inv-section-content p { font-family: 'Montserrat', sans-serif; font-size: 0.75rem; line-height: 1.6; color: ${textBrown}; margin-bottom: 15px; font-weight: 500; }
        
        .inv-map-btn {
          display: inline-flex; align-items: center; justify-content: center; padding: 10px 25px; background: transparent;
          border: 1px solid ${iconBg}; border-radius: 30px; color: ${iconBg}; font-family: 'Montserrat', sans-serif;
          font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; text-decoration: none; transition: all 0.3s ease;
        }
        .inv-map-btn:hover { background: ${iconBg}; color: #fff; }

        .inv-form { display: flex; flex-direction: column; gap: 20px; width: 100%; text-align: left; }
        .inv-input-group { position: relative; }
        .inv-input {
          width: 100%; padding: 15px 0; background: transparent; border: none; border-bottom: 1px solid rgba(92,53,34,0.4);
          color: ${textBrown}; font-family: 'Montserrat', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.3s;
        }
        .inv-input::placeholder { color: rgba(92,53,34,0.6); }
        .inv-input:focus { border-bottom-color: ${textBrown}; }
        
        .inv-select {
          width: 100%; padding: 15px 0; background: transparent; border: none; border-bottom: 1px solid rgba(92,53,34,0.4);
          color: ${textBrown}; font-family: 'Montserrat', sans-serif; font-size: 0.9rem; outline: none; cursor: pointer;
        }
        .inv-select option { color: ${textBrown}; background: #FFF; }
        
        .inv-radio-container { display: flex; justify-content: center; gap: 20px; margin-top: 10px; }
        .inv-radio { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; cursor: pointer; color: ${textBrown}; }
        .inv-radio input { accent-color: ${accentBrown}; width: 16px; height: 16px; }
        
        .inv-submit {
          background: ${textBrown}; color: #FFF; padding: 18px; border: none; font-family: 'Montserrat', sans-serif;
          font-size: 0.8rem; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; margin-top: 20px; cursor: pointer;
          transition: transform 0.3s, box-shadow 0.3s; border-radius: 8px; width: 100%;
        }
        .inv-submit:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.15); }
        .inv-submit:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .inv-footer-img { width: 100%; height: 350px; object-fit: cover; border-radius: 0 0 200px 200px; -webkit-mask-image: linear-gradient(to top, black 60%, transparent 100%); mask-image: linear-gradient(to top, black 60%, transparent 100%); margin-top: 50px; }

        /* iPhone / iOS Photos Mosaic Gallery Grid */
        .ios-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: 100px;
          grid-auto-flow: dense;
          gap: 0px;
          padding: 0px;
          background: none;
          border-radius: 0px;
          border: none;
          max-width: 600px;
          margin: 20px auto 35px auto;
          overflow: hidden;
        }
        .ios-gallery-item {
          position: relative;
          overflow: hidden;
          border-radius: 0px;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
        }
        .ios-gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .ios-gallery-item:hover {
          transform: scale(1.05) translateZ(0);
          z-index: 10;
          box-shadow: 0 10px 20px rgba(92,53,34,0.25);
        }
        .ios-gallery-item:hover img {
          transform: scale(1.06);
        }
        .ios-gallery-item.large {
          grid-column: span 2;
          grid-row: span 2;
        }

        @media (min-width: 480px) {
          .ios-gallery-grid {
            grid-auto-rows: 130px;
            gap: 0px;
            padding: 0px;
          }
        }

        /* Floating Audio Player Button */
        .inv-music-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: #FDFBF9;
          border: 1px solid rgba(92, 53, 34, 0.2);
          color: #5C3522;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(92, 53, 34, 0.15);
          z-index: 9999;
          transition: all 0.3s ease;
        }
        .inv-music-btn:hover {
          transform: scale(1.1);
          background: #5C3522;
          color: #FFF;
        }
        .inv-music-btn.playing i {
          animation: invMusicPulse 1.5s linear infinite;
        }
        @keyframes invMusicPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div className="inv-wrapper">
        <div className="inv-container">

          <FloralCluster top="100px" left="-50px" rotate={45} />
          <FloralCluster top="600px" right="-50px" rotate={-135} />
          <FloralCluster bottom="400px" left="-50px" rotate={90} />
          <FloralCluster bottom="100px" right="-30px" rotate={-45} />

          <div className="inv-main-img-wrap animate-on-scroll">
            {sliderImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt="Couple"
                className={`inv-main-img ${idx === currentBgIndex ? 'active' : ''}`}
              />
            ))}
          </div>

          <div className="inv-intro animate-on-scroll">
            With the blessing of God and our parents
          </div>

          <div className="inv-names animate-on-scroll">
            {brideFirst} & {groomFirst}
          </div>

          {(d.couple?.bride?.image || d.couple?.groom?.image) && (
            <div className="animate-on-scroll" style={{ display: 'flex', gap: '30px', margin: '10px 20px 30px', zIndex: 2, justifyContent: 'center' }}>
              {d.couple?.bride?.image && (
                <div style={{ textAlign: 'center' }}>
                  <img src={d.couple.bride.image} alt={brideFirst} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #8F664E', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                </div>
              )}
              {d.couple?.groom?.image && (
                <div style={{ textAlign: 'center' }}>
                  <img src={d.couple.groom.image} alt={groomFirst} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #8F664E', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                </div>
              )}
            </div>
          )}

          <div className="inv-sub-intro animate-on-scroll">
            Joyfully invite you to the<br />celebration of our wedding to<br />be held on
          </div>

          <div className="inv-date-block animate-on-scroll">
            <div className="inv-day">{pad(day)}</div>
            <div className="inv-month">{month}</div>
            <div className="inv-year-time">{year}<br />{timeStr}</div>
          </div>

          <div className="inv-timer-wrap animate-on-scroll">
            <div className="inv-timer-box"><div className="inv-timer-val">{timeLeft.days}</div><div className="inv-timer-lbl">Days</div></div>
            <div className="inv-timer-box"><div className="inv-timer-val">{timeLeft.hours}</div><div className="inv-timer-lbl">Hours</div></div>
            <div className="inv-timer-box"><div className="inv-timer-val">{timeLeft.minutes}</div><div className="inv-timer-lbl">Mins</div></div>
            <div className="inv-timer-box"><div className="inv-timer-val">{timeLeft.seconds}</div><div className="inv-timer-lbl">Secs</div></div>
          </div>

          <SquigglyDivider />

          {/* Alternating Pill Sections - EXACTLY matching reference image layout */}
          <div className="inv-section-list">

            {/* Ceremony - Icon Left */}
            <div className="inv-section-item animate-on-scroll">
              <SectionPill icon="fa-church" topText="LOCATION OF" bottomText="Marriage Blessings" iconLeft={true} />
              <div className="inv-section-content">
                <p>
                  <strong>{typeof d.ceremony?.venue === 'string' ? d.ceremony.venue : (d.venue?.name || 'Igreja Santa Teresinha')}</strong><br />
                  <span style={{ fontSize: '0.85rem', color: accentBrown, fontWeight: 600 }}>{d.ceremony?.time || '5:00 PM'}</span><br />
                  {typeof d.ceremony?.venue === 'string' ? '' : (d.venue?.address || 'Av. Visc. de Guarapuava, 1787')}
                </p>
              </div>
            </div>

            <SquigglyDivider />

            {/* Reception - Icon Right */}
            <div className="inv-section-item animate-on-scroll">
              <SectionPill icon="fa-glass-cheers" topText="RECEPTION" bottomText="Party" iconLeft={false} />
              <div className="inv-section-content">
                <p>
                  <strong>{typeof d.reception?.venue === 'string' ? d.reception.venue : (d.reception?.venue?.name || 'Espaço Klaine')}</strong><br />
                  <span style={{ fontSize: '0.85rem', color: accentBrown, fontWeight: 600 }}>{d.reception?.time || '6:30 PM'}</span><br />
                  {typeof d.reception?.venue === 'string' ? (d.reception?.address || '') : (d.reception?.venue?.address || 'R. Bom Jesus de Iguape, 7122')}
                </p>
                <div style={{ width: '100%', height: '200px', borderRadius: '20px', overflow: 'hidden', marginTop: '15px', border: `1px solid rgba(92,53,34,0.2)` }}>
                  <iframe
                    src={d.mapLocation || d.venue?.mapLocation || d.reception?.venue?.mapLocation || `https://maps.google.com/maps?q=${encodeURIComponent((d.reception?.venue?.name || d.venue?.name || '') + ' ' + (d.reception?.venue?.address || d.venue?.address || ''))}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    title="Reception Map"
                  ></iframe>
                </div>
              </div>
            </div>

            <SquigglyDivider />

            {/* Dress Code Section */}
            <div className="inv-section-item animate-on-scroll">
              <SectionPill icon="fa-user-tie" topText="DRESS CODE" bottomText="What to Wear" iconLeft={true} />
              <div className="inv-section-content" style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', color: textBrown, fontSize: '0.95rem', marginBottom: '8px' }}>
                  {d.dressCode || d.dress_code || 'Elegant Tropical / Formal'}
                </p>
                <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: '1.5', marginBottom: '15px' }}>
                  {d.dressCodeDescription || d.dress_code_desc || ''}
                </p>

                {/* Color Swatches */}
                {dressCodeColors && dressCodeColors.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '15px' }}>
                    {dressCodeColors.map((color, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: color,
                          border: '2px solid #FFF',
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <SquigglyDivider />

            {/* Gifts - Icon Right (DYNAMIC) */}
            {safeGifts && safeGifts.length > 0 && (
              <>
                <div className="inv-section-item animate-on-scroll">
                  <SectionPill icon="fa-gift" topText="GIFT" bottomText="Registry" iconLeft={true} />
                  <div className="inv-section-content">
                    <p>As we prepare to celebrate our special day, we warmly welcome your contribution towards making our wedding celebration a memorable one. Your support is sincerely appreciated.</p>
                    {safeGifts.map((gift, idx) => (
                      <div key={idx} style={{
                        background: '#FFF',
                        padding: '20px',
                        borderRadius: '16px',
                        border: `1px solid rgba(92, 53, 34, 0.12)`,
                        boxShadow: '0 6px 15px rgba(92, 53, 34, 0.04)',
                        textAlign: 'center',
                        fontFamily: 'Montserrat, sans-serif',
                        marginBottom: '15px'
                      }}>
                        <div style={{
                          fontFamily: 'Montserrat',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          letterSpacing: '1.5px',
                          color: accentBrown,
                          marginBottom: '8px'
                        }}>
                          {gift.provider || gift.giftType || gift.bank || 'Registry'}
                        </div>
                        {(gift.accountNumber || gift.account_number) && (
                          <div style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: textBrown,
                            letterSpacing: '0.5px',
                            margin: '6px 0'
                          }}>
                            {gift.accountNumber || gift.account_number}
                          </div>
                        )}
                        {(gift.accountName || gift.account_name) && (
                          <div style={{
                            fontSize: '0.8rem',
                            color: textBrown,
                            opacity: 0.8,
                            fontWeight: '500'
                          }}>
                            Name: {gift.accountName || gift.account_name}
                          </div>
                        )}
                        {gift.instructions && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#7C6E65',
                            fontStyle: 'italic',
                            marginTop: '8px',
                            lineHeight: '1.4'
                          }}>
                            {gift.instructions}
                          </div>
                        )}
                        {gift.url && (
                          <a
                            href={gift.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block',
                              marginTop: '12px',
                              background: textBrown,
                              color: '#FFF',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                              padding: '8px 16px',
                              borderRadius: '20px',
                              textDecoration: 'none',
                              transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = 0.9}
                            onMouseLeave={(e) => e.target.style.opacity = 1}
                          >
                            Visit Link <i className="fas fa-external-link-alt" style={{ marginLeft: '4px', fontSize: '0.65rem' }}></i>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <SquigglyDivider />
              </>
            )}

            {/* Memories - Icon Left */}
            {galleryImages && galleryImages.length > 0 && (() => {
              const maxVisible = 6;
              const visibleImages = galleryImages.slice(0, maxVisible);
              const remainingCount = galleryImages.length - maxVisible;

              return (
                <>
                  <div className="inv-section-item animate-on-scroll">
                    <SectionPill icon="fa-camera-retro" topText="OUR CHERISHED" bottomText="Memories" iconLeft={false} />
                    <div className="inv-section-content" style={{ width: '100%' }}>
                      <p style={{ marginBottom: '15px' }}>A glimpse into our beautiful journey together:</p>
                      <div className="ios-gallery-grid">
                        {visibleImages.map((imgUrl, idx) => {
                          let layoutClass = "";
                          if (idx === 0) layoutClass = "large";

                          const isLast = idx === maxVisible - 1 && remainingCount > 0;

                          return (
                            <div
                              key={idx}
                              className={`ios-gallery-item ${layoutClass}`}
                              onClick={() => setLightboxIndex(idx)}
                            >
                              <img src={imgUrl} alt={`Gallery ${idx + 1}`} loading="lazy" />
                              {isLast && (
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  background: 'rgba(92, 53, 34, 0.7)',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  color: '#FFFFFF',
                                  fontFamily: 'Montserrat',
                                  fontSize: '1.8rem',
                                  fontWeight: '600',
                                  zIndex: 2
                                }}>
                                  +{remainingCount}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <SquigglyDivider />
                </>
              );
            })()}

            {/* RSVP - Icon Left */}
            <div className="inv-section-item animate-on-scroll">
              <SectionPill icon="fa-envelope-open-text" topText="CONFIRM YOUR" bottomText="Attendance" iconLeft={false} />
              <div className="inv-section-content">
                {submitted ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingTop: '10px' }}>
                    <div id="pass-card-container" style={{ background: '#FFF', padding: '30px 24px', borderRadius: '16px', boxShadow: '0 15px 35px rgba(0,0,0,0.08)', border: '1px solid #E6E1D6', maxWidth: '320px', width: '100%', textAlign: 'center', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ borderBottom: '1px solid #F0EDE9', width: '100%', paddingBottom: '15px', marginBottom: '20px' }}>
                        <h4 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.8rem', color: '#2C361A', margin: '0', fontWeight: 'normal', letterSpacing: '1px' }}>
                          {brideFirst} & {groomFirst}
                        </h4>
                        <p style={{ fontFamily: 'Montserrat', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#8A9A75', margin: '6px 0 0 0' }}>
                          Wedding Entrance Pass
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
                        <QRCodeCanvas
                          id="qr-canvas"
                          value={getQrValue()}
                          size={180}
                          level="L"
                          bgColor="#FFFFFF"
                          fgColor="#2C361A"
                        />
                      </div>

                      <div style={{ marginTop: '20px', borderTop: '1px solid #F0EDE9', paddingTop: '15px', width: '100%' }}>
                        <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', fontStyle: 'italic', color: '#2C361A', margin: '0 0 4px 0' }}>
                          {form.name}
                        </p>
                        <p style={{ fontFamily: 'Montserrat', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#8A9A75', margin: '0 0 12px 0' }}>
                          {parseInt(form.guests, 10) > 1 ? `Admit ${form.guests} Guests` : 'Admit 1 Guest'}
                        </p>
                        <p style={{ fontFamily: 'Montserrat', fontSize: '0.7rem', color: '#666', margin: '0 0 3px 0' }}>
                          {d.date ? new Date(d.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                        </p>
                        <p style={{ fontFamily: 'Montserrat', fontSize: '0.7rem', color: '#666', margin: '0' }}>
                          {d.venue?.name || d.location || 'Wedding Venue'}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid #F0EDE9', width: '100%', paddingTop: '12px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <img src={logoImg} alt="SaveMeASeat Logo" style={{ height: '12px', objectFit: 'contain' }} />
                          <span style={{ fontFamily: 'Montserrat', fontSize: '0.5rem', fontWeight: 'bold', color: '#8A9A75' }}>
                            SaveMeASeat
                          </span>
                        </div>
                        <span style={{ fontFamily: 'Montserrat', fontSize: '0.5rem', color: '#8A9A75', letterSpacing: '0.5px' }}>
                          savemeaseatzambia.com
                        </span>
                      </div>
                    </div>

                    <button onClick={downloadPassCard} className="inv-submit" style={{ background: '#8A9A75', color: '#FFF', border: 'none', padding: '10px 24px', borderRadius: '30px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(138,154,117,0.3)', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                      <i className="fas fa-download"></i> Save Pass Again
                    </button>
                  </div>
                ) : (
                  <form className="inv-form" onSubmit={handleRsvpSubmit}>
                    <div className="inv-input-group">
                      <input type="text" className="inv-input" placeholder="Your Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="inv-input-group">
                      <input type="email" className="inv-input" placeholder="Email Address" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="inv-input-group">
                      <input type="tel" className="inv-input" placeholder="Phone Number" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="inv-input-group">
                      <select className="inv-select" value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })}>
                        <option value="" disabled>Number of Guests</option>
                        {d.allowedGuests && d.allowedGuests.length > 0 ? (
                          d.allowedGuests.map((opt, idx) => (
                            <option key={idx} value={opt}>
                              {opt} {parseInt(opt, 10) === 1 ? 'Guest' : 'Guests'}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="1">1 Guest</option>
                            <option value="2">2 Guests</option>
                            <option value="3">3 Guests</option>
                            <option value="4">4 Guests</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div className="inv-radio-container">
                      <label className="inv-radio">
                        <input type="radio" name="attending" value="yes" checked={form.attendance === 'yes'}
                          onChange={e => setForm({ ...form, attendance: e.target.value })} /> Joyfully Accept
                      </label>
                      <label className="inv-radio">
                        <input type="radio" name="attending" value="no" checked={form.attendance === 'no'}
                          onChange={e => setForm({ ...form, attendance: e.target.value })} /> Regretfully Decline
                      </label>
                    </div>
                    <button type="submit" disabled={submitting} className="inv-submit">{submitting ? 'Sending...' : 'Confirm RSVP'}</button>
                  </form>
                )}
              </div>
            </div>

          </div>

          <img src={sliderImages[1] || sliderImages[0]} alt="Couple" className="inv-footer-img animate-on-scroll" />

        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(92, 53, 34, 0.95)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close Button */}
          <button
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              color: '#FFFFFF',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1010
            }}
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
          >
            <i className="fas fa-times"></i>
          </button>

          {/* Left Arrow */}
          {galleryImages.length > 1 && (
            <button
              style={{
                position: 'absolute',
                left: '20px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                color: '#FFFFFF',
                fontSize: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1010
              }}
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
              }}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
          )}

          {/* Main Image */}
          <img
            src={galleryImages[lightboxIndex]}
            alt="Expanded Memory"
            style={{
              maxWidth: '85%',
              maxHeight: '75%',
              borderRadius: '8px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              objectFit: 'contain',
              transition: 'transform 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Right Arrow */}
          {galleryImages.length > 1 && (
            <button
              style={{
                position: 'absolute',
                right: '20px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                color: '#FFFFFF',
                fontSize: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1010
              }}
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
              }}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          )}

          {/* Counter Badge */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            background: 'rgba(0,0,0,0.4)',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontFamily: 'Montserrat',
            zIndex: 1010
          }}>
            {lightboxIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}
      {/* Floating Audio Player */}
      {audio && (
        <button
          onClick={togglePlay}
          className={`inv-music-btn ${isPlaying ? 'playing' : ''}`}
          aria-label="Toggle Background Music"
        >
          <i className={`fa-solid ${isPlaying ? 'fa-music' : 'fa-volume-xmark'}`}></i>
        </button>
      )}
    </>
  );
};

export default TropicalElegance;
