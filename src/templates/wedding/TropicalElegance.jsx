import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import logoImg from '../../assets/images/logo1.png';
import defaultMusic from '../../assets/music/music.mp3';
import { weddingMockData } from './weddingMockData';
import TemplateFooter from '../../components/TemplateFooter';

// Helper to format date safely
const formatDate = (dateString) => {
  if (!dateString) return "";
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? dateString : date.toLocaleDateString(undefined, options);
};

// Helper to format time safely
const formatTime = (timeString) => {
  if (!timeString) return "";
  if (timeString.includes('AM') || timeString.includes('PM') || timeString.includes('am') || timeString.includes('pm') || timeString.includes('M')) return timeString;
  const parts = timeString.split(':');
  const hours = parts[0];
  const minutes = parts[1];
  if (!hours || !minutes) return timeString;
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedH = h % 12 || 12;
  return `${formattedH}:${minutes.substring(0, 2)} ${ampm}`;
};

const TropicalElegance = ({
  weddingData,
  handleRSVPSubmitFromParent,
  parentIsSubmitting,
  parentShowAdmissionCard,
  parentSubmittedRSVP
}) => {
  const d = weddingData || weddingMockData['tropical-elegance'];

  const defaultSampleImages = [
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800'
  ];

  // Extract all available pictures attached in the gallery / slider in admin
  const availableGalleryImages = (() => {
    const rawList = [];
    const extract = (val) => {
      if (!val) return;
      if (Array.isArray(val)) {
        val.forEach(item => {
          if (typeof item === 'string' && item.trim()) rawList.push(item.trim());
        });
      } else if (typeof val === 'string' && val.trim()) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              if (typeof item === 'string' && item.trim()) rawList.push(item.trim());
            });
          } else if (typeof parsed === 'string' && parsed.trim()) {
            rawList.push(parsed.trim());
          }
        } catch (e) {
          if (val.startsWith('http') || val.startsWith('/') || val.startsWith('data:')) {
            rawList.push(val.trim());
          }
        }
      }
    };

    extract(d.sliderImages);
    extract(d.slider_images);
    extract(d.galleryImages);
    extract(d.gallery_images);

    if (rawList.length === 0) {
      if (d.coverImage && typeof d.coverImage === 'string' && d.coverImage.trim()) rawList.push(d.coverImage.trim());
      else if (d.cover_image && typeof d.cover_image === 'string' && d.cover_image.trim()) rawList.push(d.cover_image.trim());
    }

    return Array.from(new Set(rawList.filter(Boolean)));
  })();

  const galleryImages = availableGalleryImages.length > 0 ? availableGalleryImages : defaultSampleImages;
  const heroImages = galleryImages;
  const sliderImages = heroImages;
  const footerImage = galleryImages[galleryImages.length - 1];

  const bgCream = '#FDFBF9'; // Extremely light, almost white cream from image
  const textBrown = '#5C3522'; // Dark brown text
  const accentBrown = '#8F664E'; // Softer brown for cursive
  const iconBg = '#5C3522';

  const brideFirst = d.couple?.bride?.name?.split(' ')[0] || 'Bride';
  const groomFirst = d.couple?.groom?.name?.split(' ')[0] || 'Groom';

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
  const [form, setForm] = useState({ name: '', partner_name: '', email: '', phone: '', guests: '1', attendance: 'yes' });
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);
  const isSubmitting = parentIsSubmitting !== undefined ? parentIsSubmitting : localIsSubmitting;
  const setIsSubmitting = parentIsSubmitting !== undefined ? () => { } : setLocalIsSubmitting;
  const [localShowAdmissionCard, setLocalShowAdmissionCard] = useState(false);
  const showAdmissionCard = parentShowAdmissionCard !== undefined ? parentShowAdmissionCard : localShowAdmissionCard;
  const setShowAdmissionCard = parentShowAdmissionCard !== undefined ? () => { } : setLocalShowAdmissionCard;
  const [localSubmittedRSVP, setLocalSubmittedRSVP] = useState(null);
  const submittedRSVP = parentSubmittedRSVP !== undefined ? parentSubmittedRSVP : localSubmittedRSVP;
  const setSubmittedRSVP = parentSubmittedRSVP !== undefined ? () => { } : setLocalSubmittedRSVP;
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rsvpId, setRsvpId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [cardRenderedUrl, setCardRenderedUrl] = useState(null);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(() => {
    const musicUrl = d.music_url;
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

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Hero Carousel State
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBgIndex(prev => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

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
    if (handleRSVPSubmitFromParent) {
      await handleRSVPSubmitFromParent(e, form);
      setSubmitted(true);
      return;
    }

    if (!form.name.trim()) return;
    setIsSubmitting(true);
    try {
      const isCouple = form.guests === '2' || form.guests?.includes('2') || !!form.partner_name;
      const basePayload = {
        wedding_id: d.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        attending: form.attendance,
        guests_count: parseInt(form.guests, 10) || (isCouple ? 2 : 1),
        status: 'pending'
      };

      let insertData = {
        ...basePayload,
        partner_name: isCouple ? (form.partner_name || null) : null,
        partner_phone: isCouple ? (form.partner_phone || null) : null,
        partner_email: isCouple ? (form.partner_email || null) : null
      };

      let { data, error } = await supabase.from('rsvps').insert([insertData]).select('id').single();

      if (error && (error.message?.includes('partner_') || error.code === 'PGRST204')) {
        const fallbackPayload = {
          ...basePayload,
          name: isCouple && form.partner_name ? `${form.name} & ${form.partner_name}` : form.name
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
        name: form.name,
        partner_name: isCouple ? form.partner_name : '',
        email: form.email,
        phone: form.phone,
        partner_phone: isCouple ? form.partner_phone : '',
        partner_email: isCouple ? form.partner_email : '',
        guests_count: parseInt(form.guests, 10) || (isCouple ? 2 : 1),
        wedding_id: d.id
      });
      setShowAdmissionCard(true);
      setSubmitted(true);
    } catch (err) {
      console.error('TropicalElegance RSVP error:', err);
      const isCouple = form.guests === '2' || form.guests?.includes('2') || !!form.partner_name;
      const fallbackId = `local-${Date.now()}`;
      setRsvpId(fallbackId);
      setSubmittedRSVP({
        id: fallbackId,
        name: form.name,
        partner_name: isCouple ? form.partner_name : '',
        email: form.email,
        phone: form.phone,
        guests_count: parseInt(form.guests, 10) || (isCouple ? 2 : 1),
        wedding_id: d.id
      });
      setShowAdmissionCard(true);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQrValue = () => {
    const guestId = submittedRSVP?.id || rsvpId;
    const guestName = submittedRSVP?.name || form.name;
    const partnerName = submittedRSVP?.partner_name || form.partner_name || '';
    const isCouple = (submittedRSVP?.guests_count === 2) || (parseInt(form.guests, 10) === 2) || !!partnerName;
    const guestEmail = submittedRSVP?.email || form.email;
    const guestPhone = submittedRSVP?.phone || form.phone;
    const guestCount = submittedRSVP?.guests_count || parseInt(form.guests, 10) || (isCouple ? 2 : 1);

    try {
      return JSON.stringify({
        id: guestId,
        name: guestName,
        partner_name: partnerName,
        display_name: partnerName ? `${guestName} & ${partnerName}` : guestName,
        email: guestEmail,
        phone: guestPhone,
        partner_email: submittedRSVP?.partner_email || form.partner_email || '',
        partner_phone: submittedRSVP?.partner_phone || form.partner_phone || '',
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

    const el = document.getElementById('tropical-elegance-pass-card');
    if (!el) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(el, {
        useCORS: true,
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false
      });

      const guestPart = (submittedRSVP?.name || form.name || rsvpId || 'guest')
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
      const el = document.getElementById('tropical-elegance-pass-card');
      if (!el && attempt < 6) {
        setTimeout(() => { if (!cancelled) tryDownload(attempt + 1); }, 400);
        return;
      }
      if (el && !cancelled) downloadPassCardRef.current();
    };

    const t = setTimeout(() => tryDownload(), 800);
    return () => { cancelled = true; clearTimeout(t); };
  }, [submittedRSVP?.id, rsvpId]);

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
            {heroImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt="Couple"
                className={`inv-main-img ${idx === currentBgIndex ? 'active' : ''}`}
              />
            ))}
          </div>

          <div className="inv-intro animate-on-scroll">
            And over all these virtues put on love, which binds them all together in perfect unity. - Colossians 3:14
          </div>

          <div className="inv-names animate-on-scroll">
            {groomFirst} & {brideFirst}
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
              <SectionPill icon="fa-church" topText={d.ceremony_subtitle || "LOCATION OF"} bottomText={d.ceremony_title || "Marriage Blessings"} iconLeft={true} />
              <div className="inv-section-content">
                <p>
                  <strong>{typeof d.ceremony?.venue === 'string' ? d.ceremony.venue : (d.venue?.name || 'Igreja Santa Teresinha')}</strong><br />
                  <span style={{ fontSize: '0.85rem', color: accentBrown, fontWeight: 600 }}>{d.ceremony?.time || '5:00 PM'}</span><br />
                  {typeof d.ceremony?.venue === 'string' ? '' : (d.venue?.address || 'Av. Visc. de Guarapuava, 1787')}
                </p>
              </div>
            </div>

            {/* Program / Order of Service - if provided */}
            {d.program && Array.isArray(d.program) && d.program.length > 0 && (
              <>
                <SquigglyDivider />
                <div className="inv-section-item animate-on-scroll">
                  <SectionPill icon="fa-list-ol" topText="ORDER OF EVENTS" bottomText="Wedding Program" iconLeft={false} />
                  <div className="inv-section-content" style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                      {d.program.map((p, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '10px 14px',
                          background: 'rgba(255, 255, 255, 0.7)',
                          borderRadius: '14px',
                          border: `1px solid rgba(92,53,34,0.15)`
                        }}>
                          {p.time && (
                            <span style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: accentBrown,
                              whiteSpace: 'nowrap',
                              minWidth: '65px'
                            }}>
                              {p.time}
                            </span>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: textBrown, fontSize: '0.88rem' }}>
                              {p.title || p.name}
                            </div>
                            {p.description && (
                              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px', lineHeight: 1.3 }}>
                                {p.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            <SquigglyDivider />

            {/* Reception - Icon Right */}
            <div className="inv-section-item animate-on-scroll">
              <SectionPill icon="fa-glass-cheers" topText={d.reception_title || d.receptionTitle || "RECEPTION"} bottomText={d.reception_subtitle || d.receptionSubtitle || "Party"} iconLeft={false} />
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

            {/* Gifts - Icon Right */}
            <div className="inv-section-item animate-on-scroll">
              <SectionPill icon="fa-gift" topText="GIFT" bottomText="Registry" iconLeft={true} />
              <div className="inv-section-content">
                <p style={{ marginBottom: safeGifts && safeGifts.length > 0 ? '15px' : '0' }}>
                  Your presence is our greatest gift. For those who wish to bless us further, monetary gifts will warmly be appreciated Kindly reach out to either the Bride or Groom for gifting details.
                </p>
                {safeGifts && safeGifts.length > 0 && safeGifts.map((gift, idx) => (
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

            {/* Memories - Icon Left */}
            {galleryImages && galleryImages.length > 0 && (() => {
              const maxVisible = 6;
              const visibleImages = galleryImages.slice(0, maxVisible);
              const remainingCount = galleryImages.length - maxVisible;
              const showGalleryTitles = d.show_gallery_titles !== false && d.showGalleryTitles !== false;

              return (
                <>
                  <div className="inv-section-item animate-on-scroll">
                    {showGalleryTitles && (
                      <SectionPill icon="fa-camera-retro" topText="OUR CHERISHED" bottomText="Memories" iconLeft={false} />
                    )}
                    <div className="inv-section-content" style={{ width: '100%' }}>
                      {showGalleryTitles && (
                        <p style={{ marginBottom: '15px' }}>A glimpse into our beautiful journey together:</p>
                      )}
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
              <div className="inv-section-content" style={(showAdmissionCard && (submittedRSVP || rsvpId)) || submitted ? { width: '100%', maxWidth: 390, padding: 0 } : {}}>
                {(showAdmissionCard && (submittedRSVP || rsvpId)) || submitted ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0', background: '#000' }}>

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
                      id="tropical-elegance-pass-card"
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
                                    const pName = submittedRSVP?.name || form.name || 'Guest';
                                    const partName = submittedRSVP?.partner_name || form.partner_name || '';
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
                                  {(submittedRSVP?.guests_count || parseInt(form.guests, 10) || 1) > 1
                                    ? `Admit ${submittedRSVP?.guests_count || parseInt(form.guests, 10) || 1}`
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

          {footerImage && (
            <img
              src={footerImage}
              alt="Couple Footer"
              className="inv-footer-img animate-on-scroll"
            />
          )}

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

      <TemplateFooter />
    </>
  );
};

export default TropicalElegance;
