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

// Helper to render and parse story highlight quotes dynamically (splitting parentage names and making them bold)
const renderStoryHighlight = (text) => {
  if (!text) return null;

  // Strip outer quotes (single, double, smart quotes)
  const cleanText = text.replace(/(^["'“”‘’]|["'“”‘’]$)/g, '').trim();

  // Split by dot followed by optional whitespace
  const sentences = cleanText.split(/\.(?:\s*)/).map(s => s.trim()).filter(s => s.length > 0);

  // Check if any sentence has a dash character
  const hasDash = sentences.some(s => /[-—–]/.test(s));

  if (hasDash || sentences.length > 1) {
    return (
      <div style={{ display: 'block', width: '100%', textAlign: 'center' }}>
        {sentences.map((sentence, idx) => {
          const parts = sentence.split(/\s*[-—–]\s*/);
          if (parts.length >= 2) {
            const name = parts[0].trim();
            const rest = parts.slice(1).join(' — ').trim();
            return (
              <div key={idx} style={{ margin: '12px 0', display: 'block', fontSize: '1.25rem', fontStyle: 'italic', lineHeight: '1.6' }}>
                <strong style={{ fontWeight: '700', fontStyle: 'normal' }}>{name}</strong> — {rest}.
              </div>
            );
          }
          return (
            <div key={idx} style={{ margin: '12px 0', display: 'block', fontSize: '1.25rem', fontStyle: 'italic', lineHeight: '1.6' }}>
              {sentence}.
            </div>
          );
        })}
      </div>
    );
  }

  return `"${text}"`;
};

const BotanicalOlive = ({
  weddingData,
  handleRSVPSubmitFromParent,
  parentIsSubmitting,
  parentShowAdmissionCard,
  parentSubmittedRSVP
}) => {
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
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Colors
  const oliveDark = '#2C361A';
  const sage = '#8A9A75';
  const cream = '#F7F6F2';
  const gold = '#D4AF37';

  // State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpForm, setRsvpForm] = useState({ name: '', partner_name: '', phone: '', email: '', guests: '1', attending: 'yes' });
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
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpId, setRsvpId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [cardRenderedUrl, setCardRenderedUrl] = useState(null);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

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
      console.error("Error submitting RSVP:", err);
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

    const el = document.getElementById('botanical-olive-pass-card');
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
      const el = document.getElementById('botanical-olive-pass-card');
      if (!el && attempt < 6) {
        setTimeout(() => { if (!cancelled) tryDownload(attempt + 1); }, 400);
        return;
      }
      if (el && !cancelled) downloadPassCardRef.current();
    };

    const t = setTimeout(() => tryDownload(), 800);
    return () => { cancelled = true; clearTimeout(t); };
  }, [submittedRSVP?.id, rsvpId]);

  const paletteColors = d.dress_code_colors && d.dress_code_colors.length > 0 ? d.dress_code_colors : defaultData.dress_code_colors;
  const heroImg = sliderImages[0];
  const img2 = sliderImages[1] || heroImg;
  const img3 = sliderImages[2] || heroImg;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Montserrat:wght@200;300;400;500&family=Great+Vibes&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* Floating Audio Player Button */
        .bo-music-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: ${cream};
          border: 1px solid ${sage};
          color: ${oliveDark};
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(44,54,26,0.15);
          z-index: 9999;
          transition: all 0.3s ease;
        }
        .bo-music-btn:hover {
          transform: scale(1.1);
          background: ${sage};
          color: #FFF;
        }
        .bo-music-btn.playing i {
          animation: boMusicPulse 1.5s linear infinite;
        }
        @keyframes boMusicPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
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
              {String(dayNum).padStart(2, '0')} . {String(monthNum + 1).padStart(2, '0')} . {year}
            </div>

            <div className="bo-hero-img-container">
              <img src={heroImg} className="bo-hero-img" alt="Couple" />
            </div>

            <div className="bo-hero-text">
              <div className="bo-name-1">{groomFirst}</div>
              <div className="bo-name-and">and</div>
              <div className="bo-name-2">{brideFirst}</div>
            </div>
          </div>

          {/* CRYSTAL GLASS STORY & COUNTDOWN */}
          <div className="bo-glass-card">
            {/* Our Story (Part 1) */}
            <div className="bo-story-part1 bo-fade-up" style={{ marginBottom: '30px', padding: '0 10px' }}>
              <h3 style={{
                fontFamily: 'Great Vibes',
                fontSize: '2.8rem',
                color: '#D4AF37',
                margin: '0 0 10px 0',
                fontWeight: 'normal'
              }}>
                Our Story
              </h3>
              <p style={{
                fontFamily: 'Cormorant Garamond',
                fontSize: '1.25rem',
                lineHeight: '1.7',
                color: '#2C361A',
                margin: '0',
                whiteSpace: 'pre-line',
                opacity: 0.95
              }}>
                {d.story?.part1 || d.story_part1 || 'Share your love story'}
              </p>
            </div>

            <div className="bo-glass-quote bo-fade-up">
              {renderStoryHighlight(d.story?.highlight || defaultData.story.highlight)}
            </div>

            {/* The Proposal Story */}
            <div className="bo-proposal bo-fade-up" style={{ marginTop: '30px', marginBottom: '25px', padding: '0 10px' }}>
              <h3 style={{
                fontFamily: 'Great Vibes',
                fontSize: '2.8rem',
                color: '#D4AF37',
                margin: '0 0 10px 0',
                fontWeight: 'normal'
              }}>
                The Proposal
              </h3>
              <p style={{
                fontFamily: 'Cormorant Garamond',
                fontStyle: 'italic',
                fontSize: '1.25rem',
                lineHeight: '1.7',
                color: '#2C361A',
                margin: '0',
                whiteSpace: 'pre-line',
                opacity: 0.95
              }}>
                {d.story?.part2 || d.story_part2 || 'Share your proposal story'}
              </p>
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
              <div className="bo-cd-item">
                <div className="bo-cd-ring"><span className="bo-cd-num">{timeLeft.seconds}</span></div>
                <span className="bo-cd-label">Secs</span>
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

              {(() => {
                const events = [];
                if (d.program && Array.isArray(d.program) && d.program.length > 0) {
                  d.program.forEach(p => {
                    events.push({
                      name: p.title || p.name || 'Program Part',
                      time: p.time || '',
                      location: p.description || p.location || ''
                    });
                  });
                } else {
                  if (d.ceremony?.time) {
                    events.push({
                      name: d.ceremony_title || d.ceremony_subtitle || 'Marriage Blessing',
                      time: d.ceremony.time,
                      location: d.ceremony?.venue || d.ceremony?.address || d.venue?.name || d.location
                    });
                  }
                  if (d.reception?.time) {
                    events.push({
                      name: d.reception_title || 'Reception',
                      time: d.reception.time,
                      location: d.reception?.venue || d.reception?.address || d.venue?.name || d.location
                    });
                  }
                  if (d.otherEvents && d.otherEvents.length > 0) events.push(...d.otherEvents);
                }

                // Fallback if no events at all
                if (events.length === 0) {
                  events.push({ name: 'Welcome', time: '3:30 PM', location: 'Garden Terrace' });
                  events.push({ name: 'Marriage Blessing', time: '4:00 PM', location: 'Ceremony Hall' });
                  events.push({ name: 'Cocktails', time: '5:00 PM', location: 'Garden Terrace' });
                  events.push({ name: 'Reception', time: '6:30 PM', location: 'Restaurant Maison La Prairie' });
                }

                return events.map((event, idx) => {
                  const locationText = event.location || event.venue || event.address || '';
                  return (
                    <div className="bo-timeline-item" key={idx}>
                      <div className="bo-timeline-dot"></div>
                      <div className="bo-timeline-card bo-fade-up">
                        <div className="bo-time">{formatTime(event.time)}</div>
                        <div className="bo-event">{event.name}</div>
                        {locationText && (
                          <div style={{ marginTop: '6px' }}>
                            <div style={{ width: '36px', height: '1px', background: `${sage}55`, marginBottom: '4px' }} />
                            <div style={{ fontSize: '0.72rem', color: sage, lineHeight: 1.4, opacity: 0.9 }}>
                              {locationText}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* DETAILS & GIFTS */}
          <div className="bo-details-section">
            <div className="bo-details-card bo-fade-up">
              <div className="bo-details-title">Dress Code</div>
              <div className="bo-details-subtitle">{d.dressCode || d.dress_code || 'Ethereal Botanical'}</div>
              <p style={{ fontSize: '0.85rem', color: sage, lineHeight: '1.8' }}>
                {d.dressCodeDescription || d.dress_code_desc || defaultData.dressCodeDescription}
              </p>
              {paletteColors && paletteColors.length > 0 && (
                <div className="bo-palette">
                  {paletteColors.map((color, idx) => (
                    <div key={idx} className="bo-swatch" style={{ background: color }}></div>
                  ))}
                </div>
              )}
            </div>

            <div className="bo-details-card bo-fade-up" style={{ transitionDelay: '0.2s' }}>
              <div className="bo-details-title">Venue</div>
              <div className="bo-details-subtitle">{d.venue?.name || 'Restaurant Maison La Prairie'}</div>
              <p style={{ fontSize: '0.85rem', color: sage, lineHeight: '1.8' }}>
                {d.venue?.address || 'Heather Street, 12'}
              </p>
              <div style={{ marginTop: '25px', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <iframe
                  title="Venue Map"
                  width="100%"
                  height="250"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(d.venue?.address || d.venue?.name || d.location || 'Lusaka')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                ></iframe>
              </div>
            </div>

            {/* GIFTS - ONLY SHOW IF ADDED */}
            {d.gifts && d.gifts.length > 0 && (
              <div className="bo-details-card bo-fade-up" style={{ transitionDelay: '0.4s' }}>
                <div className="bo-details-title">Registry</div>
                <div className="bo-details-subtitle">A Token of Love</div>
                <p className="bo-gifts-text">
                  Your presence is the greatest gift. However, if you wish to honor us with a gift, a contribution would be deeply appreciated.
                </p>
                <div className="bo-gift-cards-container">
                  {d.gifts.map((gift, idx) => (
                    <div key={idx} className="bo-gift-card bo-fade-up">
                      <h4>{gift.provider || gift.bank || 'Gift'}</h4>
                      <div className="bo-gift-details">
                        {gift.accountName && <><br /><strong>Account Name</strong>{gift.accountName}</>}
                        {gift.accountNumber && <><br /><strong>Account Number</strong>{gift.accountNumber}</>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                      value={rsvpForm.name} onChange={e => setRsvpForm({ ...rsvpForm, name: e.target.value })} />

                    <input type="email" className="bo-input" placeholder="Email Address" required
                      value={rsvpForm.email} onChange={e => setRsvpForm({ ...rsvpForm, email: e.target.value })} />

                    <input type="tel" className="bo-input" placeholder="Phone Number" required
                      value={rsvpForm.phone} onChange={e => setRsvpForm({ ...rsvpForm, phone: e.target.value })} />


                    <div className="bo-radio-wrap">
                      <label className="bo-radio">
                        <input type="radio" name="attending" value="yes" checked={rsvpForm.attending === 'yes'}
                          onChange={e => setRsvpForm({ ...rsvpForm, attending: e.target.value })} /> Joyfully Accept
                      </label>
                      <label className="bo-radio">
                        <input type="radio" name="attending" value="no" checked={rsvpForm.attending === 'no'}
                          onChange={e => setRsvpForm({ ...rsvpForm, attending: e.target.value })} /> Regretfully Decline
                      </label>
                    </div>

                    <button type="submit" className="bo-submit" disabled={rsvpSubmitting}>
                      {rsvpSubmitting ? 'Sending...' : 'Send Reply'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="bo-success bo-fade-in">
                  <i className="fa-solid fa-envelope-open-text"></i>
                  <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.5rem' }}>Thank You</h3>
                  <p style={{ marginTop: '15px', fontSize: '1rem', opacity: 0.9 }}>Your RSVP has been beautifully received.</p>

                  {(rsvpId || showAdmissionCard) && (
                    <div style={{ width: 'calc(100% + 50px)', maxWidth: 390, margin: '25px -25px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0', background: '#000' }}>

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
                        id="botanical-olive-pass-card"
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
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="bo-footer">
            <div className="bo-footer-names"> {groomFirst} & {brideFirst} </div>
            <div className="bo-footer-date">
              {String(dayNum).padStart(2, '0')} . {String(monthNum + 1).padStart(2, '0')} . {year}
            </div>
          </div>

          <TemplateFooter />
        </div>
      </div>

      {/* Floating Audio Player */}
      {audio && (
        <button
          onClick={togglePlay}
          className={`bo-music-btn ${isPlaying ? 'playing' : ''}`}
          aria-label="Toggle Background Music"
        >
          <i className={`fa-solid ${isPlaying ? 'fa-music' : 'fa-volume-xmark'}`}></i>
        </button>
      )}
    </>
  );
};

export default BotanicalOlive;
