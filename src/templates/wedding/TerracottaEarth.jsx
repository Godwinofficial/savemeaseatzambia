import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import logoImg from '../../assets/images/logo1.png';
import defaultMusic from '../../assets/music/music.mp3';
import TemplateFooter from '../../components/TemplateFooter';

// Helper to format date safely
const formatDate = (dateString) => {
  if (!dateString) return "";
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? dateString : date.toLocaleDateString(undefined, options);
};

// Helper to format time safely (HH:MM:SS -> 12h AM/PM)
const formatTime = (timeString) => {
  if (!timeString) return "";
  if (timeString.includes('AM') || timeString.includes('PM') || timeString.includes('am') || timeString.includes('pm') || timeString.includes('M')) {
    return timeString;
  }

  const parts = timeString.split(':');
  const hours = parts[0];
  const minutes = parts[1];

  if (!hours || !minutes) return timeString;

  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedH = h % 12 || 12;
  return `${formattedH}:${minutes.substring(0, 2)} ${ampm}`;
};

const TerracottaEarth = ({
  weddingData,
  handleRSVPSubmitFromParent,
  parentIsSubmitting,
  parentShowAdmissionCard,
  parentSubmittedRSVP
}) => {
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
    dressCodeDescription: 'We kindly request our guests to dress in the mentioned colors.',
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
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Colors
  const bgMain = '#FCFAF8';
  const terracotta = '#C16E5A';
  const terracottaLight = '#E4A293';
  const darkEspresso = '#2C2421';
  const textMuted = '#887064';
  const accentSand = '#E2D1C3';

  // State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpForm, setRsvpForm] = useState({ name: '', partner_name: '', phone: '', email: '', guests: '1', attending: 'yes', message: '' });
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);
  const isSubmitting = parentIsSubmitting !== undefined ? parentIsSubmitting : localIsSubmitting;
  const setIsSubmitting = parentIsSubmitting !== undefined ? () => { } : setLocalIsSubmitting;
  const [localShowAdmissionCard, setLocalShowAdmissionCard] = useState(false);
  const showAdmissionCard = parentShowAdmissionCard !== undefined ? parentShowAdmissionCard : localShowAdmissionCard;
  const setShowAdmissionCard = parentShowAdmissionCard !== undefined ? () => { } : setLocalShowAdmissionCard;
  const [localSubmittedRSVP, setLocalSubmittedRSVP] = useState(null);
  const submittedRSVP = parentSubmittedRSVP !== undefined ? parentSubmittedRSVP : localSubmittedRSVP;
  const setSubmittedRSVP = parentSubmittedRSVP !== undefined ? () => { } : setLocalSubmittedRSVP;
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [cardRenderedUrl, setCardRenderedUrl] = useState(null);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
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

  const [rsvpId, setRsvpId] = useState(null);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(() => {
    const musicUrl = weddingData?.music_url;
    if (musicUrl === "none") return null;
    const a = new Audio(musicUrl || defaultMusic);
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

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (handleRSVPSubmitFromParent) {
      await handleRSVPSubmitFromParent(e, rsvpForm);
      setRsvpSubmitted(true);
      return;
    }

    if (!rsvpForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      const isCouple = rsvpForm.guests === '2' || rsvpForm.guests?.includes('2') || !!rsvpForm.partner_name;
      const basePayload = {
        wedding_id: d.id,
        name: rsvpForm.name,
        email: rsvpForm.email,
        phone: rsvpForm.phone,
        attending: rsvpForm.attending,
        guests_count: parseInt(rsvpForm.guests, 10) || (isCouple ? 2 : 1),
        status: 'pending'
      };

      let insertData = {
        ...basePayload,
        partner_name: isCouple ? (rsvpForm.partner_name || null) : null,
        partner_phone: isCouple ? (rsvpForm.partner_phone || null) : null,
        partner_email: isCouple ? (rsvpForm.partner_email || null) : null
      };

      let { data, error } = await supabase.from('rsvps').insert([insertData]).select('id').single();

      if (error && (error.message?.includes('partner_') || error.code === 'PGRST204')) {
        const fallbackPayload = {
          ...basePayload,
          name: isCouple && rsvpForm.partner_name ? `${rsvpForm.name} & ${rsvpForm.partner_name}` : rsvpForm.name
        };
        const fallbackRes = await supabase.from('rsvps').insert([fallbackPayload]).select('id').single();
        error = fallbackRes.error;
        data = fallbackRes.data;
      }

      if (error) throw error;
      const genId = data?.id || `local-${Date.now()}`;
      setRsvpId(genId);
      setSubmittedRSVP({
        id: genId,
        name: rsvpForm.name,
        partner_name: isCouple ? rsvpForm.partner_name : '',
        email: rsvpForm.email,
        phone: rsvpForm.phone,
        partner_phone: isCouple ? rsvpForm.partner_phone : '',
        partner_email: isCouple ? rsvpForm.partner_email : '',
        guests_count: parseInt(rsvpForm.guests, 10) || (isCouple ? 2 : 1),
        wedding_id: d.id
      });
      setShowAdmissionCard(true);
      setRsvpSubmitted(true);
    } catch (err) {
      console.error('TerracottaEarth RSVP error:', err);
      const isCouple = rsvpForm.guests === '2' || rsvpForm.guests?.includes('2') || !!rsvpForm.partner_name;
      const fallbackId = `local-${Date.now()}`;
      setRsvpId(fallbackId);
      setSubmittedRSVP({
        id: fallbackId,
        name: rsvpForm.name,
        partner_name: isCouple ? rsvpForm.partner_name : '',
        email: rsvpForm.email,
        phone: rsvpForm.phone,
        guests_count: parseInt(rsvpForm.guests, 10) || (isCouple ? 2 : 1),
        wedding_id: d.id
      });
      setShowAdmissionCard(true);
      setRsvpSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQrValue = () => {
    const guestId = submittedRSVP?.id || rsvpId;
    const guestName = submittedRSVP?.name || rsvpForm.name;
    const partnerName = submittedRSVP?.partner_name || rsvpForm.partner_name || '';
    const isCouple = (submittedRSVP?.guests_count === 2) || (parseInt(rsvpForm.guests, 10) === 2) || !!partnerName;
    const guestEmail = submittedRSVP?.email || rsvpForm.email;
    const guestPhone = submittedRSVP?.phone || rsvpForm.phone;
    const guestCount = submittedRSVP?.guests_count || parseInt(rsvpForm.guests, 10) || (isCouple ? 2 : 1);

    try {
      return JSON.stringify({
        id: guestId,
        name: guestName,
        partner_name: partnerName,
        display_name: partnerName ? `${guestName} & ${partnerName}` : guestName,
        email: guestEmail,
        phone: guestPhone,
        partner_email: submittedRSVP?.partner_email || rsvpForm.partner_email || '',
        partner_phone: submittedRSVP?.partner_phone || rsvpForm.partner_phone || '',
        guests_count: guestCount,
        wedding_id: d?.id || submittedRSVP?.wedding_id || null
      });
    } catch (e) {
      return guestId || (partnerName ? `${guestName} & ${partnerName}` : guestName) || '';
    }
  };

  const downloadPassCard = async () => {
    if (isDownloading) return;

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOSDevice && cardRenderedUrl) {
      setCardRenderedUrl(null);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }

    const el = document.getElementById('terracotta-earth-pass-card');
    if (!el) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(el, {
        useCORS: true,
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false
      });

      const guestPart = (submittedRSVP?.name || rsvpForm.name || rsvpId || 'guest')
        .toLowerCase().replace(/\s+/g, '-');
      const filename = `ecard-${guestPart}.png`;

      if (isIOSDevice) {
        const dataUrl = canvas.toDataURL('image/png');
        setCardRenderedUrl(dataUrl);
        setIsDownloading(false);
        return;
      }

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) { setIsDownloading(false); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (err) {
      console.error('E Card download error:', err);
      alert('Could not save the E Card.\nPlease take a screenshot instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadPassCardRef = useRef(downloadPassCard);
  useEffect(() => { downloadPassCardRef.current = downloadPassCard; });

  useEffect(() => {
    if (!submittedRSVP?.id && !rsvpId) return;
    let cancelled = false;

    const tryDownload = (attempt = 1) => {
      const el = document.getElementById('terracotta-earth-pass-card');
      if (!el && attempt < 6) {
        setTimeout(() => { if (!cancelled) tryDownload(attempt + 1); }, 400);
        return;
      }
      if (el && !cancelled) downloadPassCardRef.current();
    };

    const t = setTimeout(() => tryDownload(), 800);
    return () => { cancelled = true; clearTimeout(t); };
  }, [submittedRSVP?.id, rsvpId]);

  // Only show palette colors if admin has actually configured them (don't fall back to hardcoded defaults when real data is present)
  const paletteColors = weddingData
    ? (d.dress_code_colors && d.dress_code_colors.length > 0 ? d.dress_code_colors : [])
    : (d.dress_code_colors && d.dress_code_colors.length > 0 ? d.dress_code_colors : ['#2C2421', '#887064', '#C16E5A', '#E2D1C3', '#FAF7F2']);
  const heroImage = sliderImages[0];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Montserrat:wght@200;300;400;500;600&family=Pinyon+Script&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* Floating Audio Player Button */
        .te-music-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: #FFF;
          border: 1px solid ${terracotta};
          color: ${terracotta};
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
          z-index: 9999;
          transition: all 0.3s ease;
        }
        .te-music-btn:hover {
          transform: scale(1.1);
          background: ${terracotta};
          color: #FFF;
        }
        .te-music-btn.playing i {
          animation: teMusicPulse 1.5s linear infinite;
        }
        @keyframes teMusicPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
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
              <div className="te-couple-names">{brideFirst}</div>
              <div className="te-couple-and">&</div>
              <div className="te-couple-names">{groomFirst}</div>

              <div className="te-hero-date-box">
                {String(dayNum).padStart(2, '0')}.{String(monthNum + 1).padStart(2, '0')}.{year}
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
              <div className="te-cd-item">
                <span className="te-cd-num">{timeLeft.seconds}</span>
                <span className="te-cd-label">Secs</span>
              </div>
            </div>
          </div>

          {/* CALENDAR */}
          <div className="te-calendar-section">
            <h2 className="te-section-title te-fade-up">Save The Date</h2>
            <div className="te-cal-container te-fade-up" style={{ transitionDelay: '0.2s' }}>
              <div className="te-cal-month">{monthNames[monthNum]}</div>
              <div className="te-calendar-grid">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((wd, i) => (
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
              {d.program && Array.isArray(d.program) && d.program.length > 0 ? (
                d.program.map((item, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <div key={idx} className="te-timeline-item te-slide-right" style={{ transitionDelay: `${0.1 * (idx + 1)}s` }}>
                      {isEven ? (
                        <>
                          <div className="te-timeline-content" style={{ opacity: 0 }}></div>
                          <div className="te-timeline-dot"></div>
                          <div className="te-timeline-content">
                            <div className="te-timeline-time">{formatTime(item.time)}</div>
                            <div className="te-timeline-event">{item.title || item.name}</div>
                            {item.description && (
                              <div style={{ fontSize: '0.7rem', color: textMuted, marginTop: '4px', lineHeight: '1.4' }}>
                                {item.description}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="te-timeline-content">
                            <div className="te-timeline-time">{formatTime(item.time)}</div>
                            <div className="te-timeline-event">{item.title || item.name}</div>
                            {item.description && (
                              <div style={{ fontSize: '0.7rem', color: textMuted, marginTop: '4px', lineHeight: '1.4' }}>
                                {item.description}
                              </div>
                            )}
                          </div>
                          <div className="te-timeline-dot"></div>
                          <div className="te-timeline-content" style={{ opacity: 0 }}></div>
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <>
                  {d.ceremony?.time && (
                    <div className="te-timeline-item te-slide-right" style={{ transitionDelay: '0.1s' }}>
                      <div className="te-timeline-content" style={{ opacity: 0 }}></div>
                      <div className="te-timeline-dot"></div>
                      <div className="te-timeline-content">
                        <div className="te-timeline-time">{formatTime(d.ceremony.time)}</div>
                        <div className="te-timeline-event">{d.ceremony_title || d.ceremony_subtitle || 'Marriage Blessings'}</div>
                        {(d.ceremony.venue || d.ceremony.location) && (
                          <div style={{ fontSize: '0.7rem', color: textMuted, marginTop: '4px', lineHeight: '1.4' }}>
                            {d.ceremony.venue || d.ceremony.location}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {d.reception?.time && (
                    <div className="te-timeline-item te-slide-right" style={{ transitionDelay: '0.3s' }}>
                      <div className="te-timeline-content">
                        <div className="te-timeline-time">{formatTime(d.reception.time)}</div>
                        <div className="te-timeline-event">{d.reception_title || 'Reception'}</div>
                        {(d.reception.venue || d.reception.address || d.reception.location) && (
                          <div style={{ fontSize: '0.7rem', color: textMuted, marginTop: '4px', lineHeight: '1.4' }}>
                            {d.reception.venue}
                            {d.reception.venue && d.reception.address ? <br /> : null}
                            {d.reception.address || d.reception.location}
                          </div>
                        )}
                      </div>
                      <div className="te-timeline-dot"></div>
                      <div className="te-timeline-content" style={{ opacity: 0 }}></div>
                    </div>
                  )}
                </>
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
              <div className="te-card-subtitle">{d.dressCode || d.dress_code || 'Earthy Elegance'}</div>
              <p style={{ fontSize: '0.8rem', color: textMuted, lineHeight: '1.6' }}>
                {d.dressCodeDescription || d.dress_code_desc || defaultData.dressCodeDescription}
              </p>
              {paletteColors && paletteColors.length > 0 && (
                <div className="te-color-palette">
                  {paletteColors.map((color, idx) => (
                    <div key={idx} className="te-swatch" style={{ background: color }}></div>
                  ))}
                </div>
              )}
            </div>

            <div className="te-details-card te-fade-up" style={{ transitionDelay: '0.2s' }}>
              <div className="te-card-title">Venue</div>
              <div className="te-card-subtitle">{d.venue?.name || 'Restaurant Sails'}</div>
              <p style={{ fontSize: '0.8rem', color: textMuted, lineHeight: '1.6' }}>
                {d.venue?.address || 'Marine Embankment, 15'}
              </p>
              <div className="te-map-wrap">
                <iframe
                  src={d.mapLocation || `https://maps.google.com/maps?q=${encodeURIComponent((d.venue?.name || '') + ' ' + (d.venue?.address || d.location || ''))}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  title="Venue Map"
                ></iframe>
              </div>
            </div>

            {/* GIFTS - ONLY SHOW IF ADDED */}
            {d.gifts && d.gifts.length > 0 && (
              <div className="te-details-card te-fade-up" style={{ transitionDelay: '0.4s' }}>
                <div className="te-card-title">Registry</div>
                <div className="te-card-subtitle">A Token of Love</div>
                <p style={{ fontSize: '0.8rem', color: textMuted, lineHeight: '1.6', marginBottom: '20px' }}>
                  Your presence is the greatest gift. However, if you wish to honor us with a gift, a contribution would be deeply appreciated.
                </p>
                <div className="te-gift-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                  {d.gifts.map((gift, idx) => (
                    <div key={idx} className="te-gift-card" style={{
                      background: '#FDFBF9',
                      border: '1px solid rgba(200, 160, 140, 0.2)',
                      borderRadius: '16px',
                      padding: '20px',
                      textAlign: 'center',
                      boxShadow: '0 6px 15px rgba(44,36,33,0.03)'
                    }}>
                      <h4 style={{
                        fontFamily: 'Cormorant Garamond',
                        fontSize: '1.3rem',
                        color: terracotta,
                        margin: '0 0 10px 0',
                        fontWeight: 600
                      }}>
                        {gift.provider || gift.bank || 'Gift'}
                      </h4>
                      <div className="te-gift-details" style={{
                        fontSize: '0.82rem',
                        color: darkEspresso,
                        lineHeight: '1.6'
                      }}>
                        {gift.accountName && <div style={{ marginBottom: '4px' }}><strong>Account Name:</strong> {gift.accountName}</div>}
                        {gift.accountNumber && <div style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.05em' }}><strong>Account Number:</strong> {gift.accountNumber}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RSVP */}
          <div className="te-rsvp-section">
            <h2 className="te-rsvp-title te-fade-up">Join Us</h2>
            <div className="te-rsvp-subtitle te-fade-up">Kindly respond</div>

            {!rsvpSubmitted ? (
              <form className="te-form te-fade-up" style={{ transitionDelay: '0.2s' }} onSubmit={handleRsvpSubmit}>
                <div className="te-input-group">
                  <input type="text" className="te-input" placeholder="Your Name" required
                    value={rsvpForm.name} onChange={e => setRsvpForm({ ...rsvpForm, name: e.target.value })} />
                </div>
                <div className="te-input-group">
                  <input type="tel" className="te-input" placeholder="Phone Number" required
                    value={rsvpForm.phone} onChange={e => setRsvpForm({ ...rsvpForm, phone: e.target.value })} />
                </div>
                <div className="te-input-group">
                  <input type="email" className="te-input" placeholder="Email Address" required
                    value={rsvpForm.email} onChange={e => setRsvpForm({ ...rsvpForm, email: e.target.value })} />
                </div>


                <div className="te-radio-container">
                  <label className="te-radio">
                    <input type="radio" name="attending" value="yes" checked={rsvpForm.attending === 'yes'}
                      onChange={e => setRsvpForm({ ...rsvpForm, attending: e.target.value })} /> Joyfully Accept
                  </label>
                  <label className="te-radio">
                    <input type="radio" name="attending" value="no" checked={rsvpForm.attending === 'no'}
                      onChange={e => setRsvpForm({ ...rsvpForm, attending: e.target.value })} /> Regretfully Decline
                  </label>
                </div>

                <button type="submit" className="te-submit">Send Reply</button>
              </form>
            ) : (
              <div style={{ width: 'calc(100% + 40px)', maxWidth: 390, margin: '20px -20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0', background: '#000' }}>

                {/* Black header */}
                <div style={{ width: '100%', maxWidth: 390, background: '#000', padding: '24px 20px 20px', boxSizing: 'border-box', textAlign: 'center' }}>
                  <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.45rem', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '3px', margin: 0 }}>
                    THIS IS YOUR E CARD
                  </h3>
                </div>

                {/* Main white card */}
                {/* On iOS: once rendered, show as <img> so guest can long-press → Save to Photos */}
                {isIOS && cardRenderedUrl ? (
                  <img
                    src={cardRenderedUrl}
                    alt="Your Wedding E Card — press and hold to save to Photos"
                    style={{
                      width: '100%', maxWidth: 390, display: 'block',
                      WebkitTouchCallout: 'default',
                      userSelect: 'none',
                      touchAction: 'manipulation'
                    }}
                  />
                ) : null}

                {/* HTML card — always rendered for html2canvas; hidden on iOS once image is ready */}
                <div
                  id="terracotta-earth-pass-card"
                  style={{
                    width: '100%', maxWidth: 390, background: '#f2f2f2',
                    boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
                    alignItems: 'stretch',
                    textAlign: 'left',
                    ...(isIOS && cardRenderedUrl ? { position: 'absolute', opacity: 0, pointerEvents: 'none', left: '-9999px', top: 0 } : {})
                  }}
                >

                  {/* Upper white section */}
                  <div style={{ background: '#ffffff', width: '100%', padding: '20px 20px 16px', boxSizing: 'border-box', textAlign: 'left' }}>
                    {/* Brand + Seat Number row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', fontWeight: '800', color: '#111', letterSpacing: '1.5px', textTransform: 'uppercase', textAlign: 'left' }}>
                        SAVEMEASEAT
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 3px 0', textAlign: 'right' }}>SEAT NUMBER</p>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', fontWeight: '900', color: '#111', margin: 0, letterSpacing: '1px', textAlign: 'right' }}>
                          {submittedRSVP?.seat_number
                            ? (submittedRSVP.seat_number_end && submittedRSVP.seat_number_end !== submittedRSVP.seat_number
                              ? `${submittedRSVP.seat_number} & ${submittedRSVP.seat_number_end}`
                              : `${submittedRSVP.seat_number}`)
                            : '—'}
                        </p>
                      </div>
                    </div>

                    {/* QR Code — centered, large */}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 16px' }}>
                      <QRCodeCanvas
                        id="qr-canvas"
                        value={getQrValue()}
                        size={230}
                        level="M"
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                      />
                    </div>

                    {/* Event Name */}
                    <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: '#999', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 5px 0' }}>EVENT NAME</p>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.2rem', fontWeight: '700', color: '#111', margin: '0 0 16px 0', lineHeight: 1.2 }}>
                        {d.couple?.bride?.name || brideFirst} & {d.couple?.groom?.name || groomFirst}
                      </p>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: '#999', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 5px 0' }}>DATE AND TIME</p>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.1rem', fontWeight: '700', color: '#111', margin: 0 }}>
                        {formatDate(d.date)}{d.reception?.time ? ` ${formatTime(d.reception.time)}` : (d.ceremony?.time ? ` ${formatTime(d.ceremony.time)}` : '')}
                      </p>
                    </div>
                  </div>

                  {/* Tear-off divider */}
                  <div style={{ width: '100%', position: 'relative', display: 'flex', alignItems: 'center', height: 24 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#000', position: 'absolute', left: -12 }} />
                    <div style={{ flex: 1, borderTop: '2px dashed #ccc', margin: '0 18px' }} />
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#000', position: 'absolute', right: -12 }} />
                  </div>

                  {/* Lower details section */}
                  <div style={{ background: '#ffffff', width: '100%', padding: '20px 20px 22px', boxSizing: 'border-box', textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                    {/* Row 1 */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginBottom: '20px', border: 'none' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '55%', textAlign: 'left', verticalAlign: 'top', padding: 0, border: 'none' }}>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 5px 0', textAlign: 'left' }}>GUEST NAME</p>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', fontWeight: '800', color: '#111', margin: 0, textTransform: 'uppercase', lineHeight: 1.3, textAlign: 'left', wordBreak: 'break-word' }}>
                              {(() => {
                                const pName = submittedRSVP?.name || rsvpForm.name || 'Guest';
                                const partName = submittedRSVP?.partner_name || rsvpForm.partner_name || '';
                                if (partName) {
                                  const clean = pName.includes(' & ') ? pName.split(' & ')[0].trim() : pName;
                                  return `${clean} & ${partName}`;
                                }
                                return pName;
                              })()}
                            </p>
                          </td>
                          <td style={{ width: '45%', textAlign: 'right', verticalAlign: 'top', padding: 0, border: 'none' }}>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 5px 0', textAlign: 'right' }}>VENUE</p>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', fontWeight: '700', color: '#111', margin: 0, lineHeight: 1.3, textAlign: 'right', wordBreak: 'break-word' }}>
                              {d.venue?.name || d.location || 'Wedding Venue'}
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Row 2 */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: 'none' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '55%', textAlign: 'left', verticalAlign: 'top', padding: 0, border: 'none' }}>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 5px 0', textAlign: 'left' }}>CATEGORY</p>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', fontWeight: '800', color: '#111', margin: 0, textAlign: 'left' }}>
                              {submittedRSVP?.category || 'General'}
                            </p>
                          </td>
                          <td style={{ width: '45%', textAlign: 'right', verticalAlign: 'top', padding: 0, border: 'none' }}>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 5px 0', textAlign: 'right' }}>GUESTS</p>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.2rem', fontWeight: '800', color: '#111', margin: 0, textAlign: 'right' }}>
                              {(submittedRSVP?.guests_count || parseInt(rsvpForm.guests, 10) || 1) > 1
                                ? `Admit ${submittedRSVP?.guests_count || parseInt(rsvpForm.guests, 10) || 1}`
                                : 'Admit 1'}
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Extra card text */}
                    {(d.extra_card_text || (d.venue?.description?.startsWith("EXTRA_CARD_TEXT:") ? d.venue.description.replace("EXTRA_CARD_TEXT:", "") : "")) && (
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: '#b91c1c', fontWeight: '600', marginTop: '14px', borderTop: '1px dashed #ddd', paddingTop: '12px', lineHeight: '1.4', textAlign: 'left' }}>
                        {d.extra_card_text || d.venue?.description?.replace("EXTRA_CARD_TEXT:", "")}
                      </p>
                    )}
                  </div>

                  {/* Footer strip */}
                  <div style={{ background: '#f2f2f2', width: '100%', padding: '12px 20px', boxSizing: 'border-box', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: '#888', margin: '0 0 2px 0' }}>Valid for single entry only • Present at venue entrance</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: '#bbb', margin: 0 }}>Powered by SaveMeASeat Zambia © 2026</p>
                  </div>
                </div>

                {/* Save button — Android/Desktop auto-download; iOS shows hint */}
                <div style={{ background: '#000', width: '100%', maxWidth: 390, padding: '16px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  {isIOS && cardRenderedUrl && (
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#6b7280', fontFamily: '-apple-system, sans-serif', textAlign: 'center' }}>
                      Press &amp; hold your E Card above → <strong style={{ color: '#9ca3af' }}>Save to Photos</strong>
                    </p>
                  )}
                  <button
                    onClick={downloadPassCard}
                    disabled={isDownloading}
                    style={{ background: isDownloading ? '#555' : '#ffffff', color: '#111', border: 'none', padding: '13px 32px', borderRadius: '6px', cursor: isDownloading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px', letterSpacing: '0.5px', minWidth: 180, justifyContent: 'center', transition: 'background 0.2s' }}
                  >
                    {isDownloading ? 'Preparing...' : isIOS ? (cardRenderedUrl ? 'Re-render Card' : 'Save to Photos') : 'Save E Card'}
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="te-footer">
            <div className="te-footer-names">{brideFirst} & {groomFirst}</div>
            <div className="te-footer-date">
              {String(dayNum).padStart(2, '0')}.{String(monthNum + 1).padStart(2, '0')}.{year}
            </div>
          </div>

          <TemplateFooter />
        </div>
      </div>

      {/* Floating Audio Player */}
      {audio && (
        <button
          onClick={togglePlay}
          className={`te-music-btn ${isPlaying ? 'playing' : ''}`}
          aria-label="Toggle Background Music"
        >
          <i className={`fa-solid ${isPlaying ? 'fa-music' : 'fa-volume-xmark'}`}></i>
        </button>
      )}
    </>
  );
};

export default TerracottaEarth;
