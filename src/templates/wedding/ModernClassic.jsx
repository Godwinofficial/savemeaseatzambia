import React, { useState, useEffect, useRef, useMemo } from 'react';
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

// Helper to format time safely (HH:MM:SS -> 12h AM/PM or HH:MM)
const formatTime = (timeString) => {
  if (!timeString) return "";
  if (timeString.includes('AM') || timeString.includes('PM') || timeString.includes('am') || timeString.includes('pm')) {
    return timeString;
  }
  const parts = timeString.split(':');
  const hours = parts[0];
  const minutes = parts[1];
  if (!hours || !minutes) return timeString;
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

const ModernClassic = ({
  weddingData,
  handleRSVPSubmitFromParent,
  parentIsSubmitting,
  parentShowAdmissionCard,
  parentSubmittedRSVP
}) => {
  // Default data from the Meta AI artifact
  const defaultData = {
    couple: {
      her: "Amara",
      him: "James",
      bride: { name: "Amara" },
      groom: { name: "James" },
      monogram: "A & J",
      hashtag: "#AmaraAndJames2026"
    },
    date: {
      full: "December 12, 2026",
      short: "12.12.2026",
      iso: "2026-12-12T15:00:00"
    },
    location: {
      city: "Lusaka, Zambia",
      ceremony: "St. Ignatius Cathedral",
      reception: "Latitude 15°"
    },
    story: [
      {
        year: "2019",
        title: "How We Met",
        desc: "A rainy afternoon in Lusaka, a shared table at a quiet café. We spoke for hours, as if we had known each other before.",
        accent: "The beginning"
      },
      {
        year: "2021",
        title: "Growing Together",
        desc: "Through cities and seasons, we built a language of small rituals — morning walks, Sunday markets, letters kept in a drawer.",
        accent: "Becoming us"
      },
      {
        year: "2024",
        title: "Our Story",
        desc: "At sunrise, on the edge of Lake Kariba. No crowd, just the water and a question that had been waiting for years.",
        accent: "Yes"
      },
      {
        year: "2026",
        title: "The Vow",
        desc: "Now we invite you to witness what was quietly, patiently becoming inevitable.",
        accent: "Forever"
      }
    ],
    timeline: [
      { time: "14:00", title: "Guest Arrival", desc: "Welcome drinks & seating in the garden" },
      { time: "15:00", title: "Ceremony", desc: "Exchange of vows under open sky" },
      { time: "16:30", title: "Reception", desc: "Lunch, toasts & first dance" },
      { time: "20:00", title: "Celebration", desc: "Music into the Lusaka night" }
    ],
    gifts: [
      {
        giftType: "Mobile Money",
        provider: "Airtel Money",
        accountName: "Amara & James",
        accountNumber: "0977 123 456",
        instructions: "Ref: Wedding Gift"
      },
      {
        giftType: "Bank Transfer",
        provider: "FNB Zambia",
        accountName: "James Banda",
        accountNumber: "6289 1234 567",
        instructions: "Branch: Commercial Branch"
      }
    ]
  };

  const d = weddingData || {};

  // Extract couple names with smart fallbacks
  const brideName = d.couple?.bride?.name || d.couple?.her || d.bride_name || defaultData.couple.her;
  const groomName = d.couple?.groom?.name || d.couple?.him || d.groom_name || defaultData.couple.him;
  const brideFirst = brideName.split(' ')[0] || defaultData.couple.her;
  const groomFirst = groomName.split(' ')[0] || defaultData.couple.him;
  const monogram = `${brideFirst[0] || 'A'} & ${groomFirst[0] || 'J'}`;
  const hashtag = d.hashtag || `#${brideFirst}And${groomFirst}2026`;
  const tagline = d.heroTagline || d.tagline || "Together — Since 2019";

  // Date parsing
  const rawDate = d.rawDate || d.date || defaultData.date.iso;
  const parsedDate = new Date(typeof rawDate === 'string' ? rawDate : defaultData.date.iso);
  const isValidDate = !isNaN(parsedDate.getTime());
  const eventDateObj = isValidDate ? parsedDate : new Date(defaultData.date.iso);

  const formattedDateFull = isValidDate
    ? eventDateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : defaultData.date.full;

  const formattedDateShort = isValidDate
    ? `${String(eventDateObj.getDate()).padStart(2, '0')}.${String(eventDateObj.getMonth() + 1).padStart(2, '0')}.${eventDateObj.getFullYear()}`
    : defaultData.date.short;

  const eventCity = d.location?.city || d.location || defaultData.location.city;
  const hasCeremony = Boolean(
    (d.ceremony?.venue && d.ceremony.venue.trim()) ||
    (d.ceremony_venue && d.ceremony_venue.trim()) ||
    (d.ceremony?.address && d.ceremony.address.trim()) ||
    (d.ceremony_address && d.ceremony_address.trim())
  );
  const ceremonyVenue = d.ceremony?.venue || d.ceremony_venue || "";
  const ceremonyAddress = d.ceremony?.address || d.ceremony_address || "";
  const ceremonyTime = d.ceremony?.time ? formatTime(d.ceremony.time) : (d.ceremony_time ? formatTime(d.ceremony_time) : "");
  const ceremonyTitle = d.ceremony_title || "Ceremony";
  const ceremonySubtitle = d.ceremony_subtitle || (hasCeremony ? "Church Service" : "");

  const receptionVenue =
    d.reception?.venue ||
    d.reception_venue ||
    d.receptionVenue?.name ||
    d.receptionVenue ||
    d.venue?.name ||
    d.venue_name ||
    defaultData.location.reception;
  const receptionAddress =
    d.reception?.address ||
    d.reception_address ||
    d.receptionVenue?.address ||
    d.venue?.address ||
    d.venue_address ||
    "Lake Road, Lusaka";
  const receptionTime = d.reception?.time ? formatTime(d.reception.time) : (d.reception_time ? formatTime(d.reception_time) : "17:00 — late");
  const receptionTitle = d.reception_title || "Reception";
  const receptionSubtitle = d.reception_subtitle || "Celebration & Dinner";

  const dressCode = d.dressCode || d.dress_code || "Modern Classic — Soft Tones & Linen";
  const dressCodeDescription = d.dressCodeDescription || d.dress_code_desc || "";

  // Helper to extract or generate map embed URL
  const getMapEmbedUrl = (venue, address) => {
    const raw = d.mapLocation || d.map_location;
    if (raw && typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.includes('<iframe')) {
        const match = trimmed.match(/src=["']([^"']+)["']/i);
        if (match && match[1]) return match[1];
      }
      if (trimmed.includes('output=embed') || trimmed.includes('/embed') || trimmed.includes('openstreetmap.org/export/embed')) {
        return trimmed;
      }
      const coordMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || trimmed.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&z=15&output=embed`;
      }
      if (trimmed.includes('google.com/maps') || trimmed.includes('maps.google.com')) {
        try {
          const urlObj = new URL(trimmed);
          const q = urlObj.searchParams.get('q') || urlObj.searchParams.get('query');
          if (q) {
            return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
          }
        } catch (_) { }
      }
      const rawCoords = trimmed.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
      if (rawCoords) {
        return `https://maps.google.com/maps?q=${rawCoords[1]},${rawCoords[2]}&z=15&output=embed`;
      }
    }

    const queryParts = [venue, address, eventCity].filter(Boolean);
    const query = queryParts.join(', ');
    return `https://maps.google.com/maps?q=${encodeURIComponent(query || 'Lusaka, Zambia')}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };


  // Extract all uploaded gallery and slider images
  const allUploadedImages = useMemo(() => {
    const list = [];
    const pushImages = (imgs) => {
      if (!imgs) return;
      if (Array.isArray(imgs)) {
        imgs.forEach(i => {
          if (typeof i === 'string' && i.trim()) list.push(i.trim());
          else if (i && typeof i.url === 'string' && i.url.trim()) list.push(i.url.trim());
        });
      } else if (typeof imgs === 'string' && imgs.trim()) {
        try {
          const parsed = JSON.parse(imgs);
          if (Array.isArray(parsed)) {
            parsed.forEach(p => { if (typeof p === 'string' && p.trim()) list.push(p.trim()); });
            return;
          }
        } catch (_) { }
        list.push(imgs.trim());
      }
    };
    pushImages(d.sliderImages);
    pushImages(d.slider_images);
    if (d.coverImage) pushImages(d.coverImage);
    if (d.cover_image) pushImages(d.cover_image);
    pushImages(d.galleryImages);
    pushImages(d.gallery_images);
    if (d.couple?.bride?.image) pushImages(d.couple.bride.image);
    if (d.couple?.groom?.image) pushImages(d.couple.groom.image);
    return Array.from(new Set(list));
  }, [d.sliderImages, d.slider_images, d.coverImage, d.cover_image, d.galleryImages, d.gallery_images, d.couple]);

  // Extract user-uploaded gallery images only (deduplicated, no repeated images)
  const userGalleryImages = useMemo(() => {
    const list = [];
    const pushImages = (imgs) => {
      if (!imgs) return;
      if (Array.isArray(imgs)) {
        imgs.forEach(i => {
          if (typeof i === 'string' && i.trim()) list.push(i.trim());
          else if (i && typeof i.url === 'string' && i.url.trim()) list.push(i.url.trim());
        });
      } else if (typeof imgs === 'string' && imgs.trim()) {
        try {
          const parsed = JSON.parse(imgs);
          if (Array.isArray(parsed)) {
            parsed.forEach(p => {
              if (typeof p === 'string' && p.trim()) list.push(p.trim());
              else if (p && typeof p.url === 'string' && p.url.trim()) list.push(p.url.trim());
            });
            return;
          }
        } catch (_) { }
        list.push(imgs.trim());
      }
    };

    pushImages(d.galleryImages);
    pushImages(d.gallery_images);

    if (list.length === 0) {
      pushImages(d.sliderImages);
      pushImages(d.slider_images);
    }

    return Array.from(new Set(list.filter(Boolean)));
  }, [d.galleryImages, d.gallery_images, d.sliderImages, d.slider_images]);

  // Dedicated Hero Slider Images: prioritize sliderImages/slider_images, coverImage, then galleryImages
  const heroImages = useMemo(() => {
    const list = [];
    const pushImgs = (imgs) => {
      if (!imgs) return;
      if (Array.isArray(imgs)) {
        imgs.forEach(i => {
          if (typeof i === 'string' && i.trim()) list.push(i.trim());
          else if (i && typeof i.url === 'string' && i.url.trim()) list.push(i.url.trim());
        });
      } else if (typeof imgs === 'string' && imgs.trim()) {
        try {
          const parsed = JSON.parse(imgs);
          if (Array.isArray(parsed)) {
            parsed.forEach(p => { if (typeof p === 'string' && p.trim()) list.push(p.trim()); });
            return;
          }
        } catch (_) { }
        list.push(imgs.trim());
      }
    };

    // Priority 1: slider images
    pushImgs(d.sliderImages);
    pushImgs(d.slider_images);

    // Priority 2: cover image (if not already first)
    if (d.coverImage) pushImgs(d.coverImage);
    if (d.cover_image) pushImgs(d.cover_image);

    // Priority 3: gallery images to provide a rich slide experience
    pushImgs(d.galleryImages);
    pushImgs(d.gallery_images);

    if (d.couple?.bride?.image) pushImgs(d.couple.bride.image);
    if (d.couple?.groom?.image) pushImgs(d.couple.groom.image);

    const unique = Array.from(new Set(list.filter(Boolean)));
    if (unique.length > 0) return unique;
    if (allUploadedImages.length > 0) return allUploadedImages;
    return [];
  }, [d.sliderImages, d.slider_images, d.coverImage, d.cover_image, d.galleryImages, d.gallery_images, d.couple, allUploadedImages]);

  // First uploaded image for the Hero (fallback)
  const heroImage = useMemo(() => {
    if (heroImages.length > 0) return heroImages[0];
    return null;
  }, [heroImages]);

  // Story parsing (use database story or rich timeline cards)
  const storyList = useMemo(() => {
    if (d.story && Array.isArray(d.story) && d.story.length > 0) {
      return d.story.map((item, idx) => {
        let title = item.title || item.name || `Chapter ${idx + 1}`;
        if (title.toLowerCase().trim() === 'the proposal' || title.toLowerCase().trim() === 'proposal') {
          title = 'Our Story';
        }
        return {
          year: item.year || item.date || `20${19 + idx * 2}`,
          title,
          desc: item.desc || item.description || item.content || "",
          accent: item.accent || `Chapter ${idx + 1}`,
          image: item.image || item.photo || (allUploadedImages[idx + 1] || allUploadedImages[idx] || null)
        };
      });
    }

    const part1 = d.story?.part1 || d.story_part1;
    const highlight = d.story?.highlight || d.story_highlight;
    const part2 = d.story?.part2 || d.story_part2;

    if (part1 || highlight || part2) {
      const list = [];
      if (part1) {
        list.push({
          year: d.story_year1 || "2019",
          title: "How We Met",
          desc: part1,
          accent: "The beginning",
          image: allUploadedImages[1] || allUploadedImages[0] || null
        });
      }
      if (highlight) {
        list.push({
          year: d.story_year2 || "2021",
          title: "Growing Together",
          desc: highlight,
          accent: "Becoming us",
          image: allUploadedImages[2] || allUploadedImages[0] || null
        });
      }
      if (part2) {
        list.push({
          year: d.story_year3 || "2024",
          title: "Our Story",
          desc: part2,
          accent: "The Question",
          image: allUploadedImages[3] || allUploadedImages[0] || null
        });
      }
      list.push({
        year: String(eventDateObj.getFullYear()),
        title: "The Vow",
        desc: `Now we invite you to witness our union on ${formattedDateFull}.`,
        accent: "Forever",
        image: allUploadedImages[0] || null
      });
      return list;
    }

    return defaultData.story.map((item, idx) => ({
      ...item,
      image: allUploadedImages[idx] || null
    }));
  }, [d.story, d.story_part1, d.story_highlight, d.story_part2, d.story_year1, d.story_year2, d.story_year3, allUploadedImages, eventDateObj, formattedDateFull]);

  // Timeline / program schedule parsing - DO NOT fall back to mock data
  const timelineList = useMemo(() => {
    const parseList = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim()) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        } catch (_) { }
      }
      return null;
    };

    // 1. Program from backend
    const prog = parseList(d.program);
    if (prog && prog.length > 0) {
      return prog.map(item => ({
        time: item.time ? formatTime(item.time) : (item.hour || "—"),
        title: item.title || item.name || item.event || item.activity || "Program Event",
        desc: item.desc || item.description || item.details || ""
      })).filter(item => item.title || item.desc);
    }
    // 2. Itinerary
    const itin = parseList(d.itinerary);
    if (itin && itin.length > 0) {
      return itin.map(item => ({
        time: item.time ? formatTime(item.time) : "—",
        title: item.title || item.event || "Event",
        desc: item.desc || item.description || ""
      })).filter(item => item.title || item.desc);
    }
    // 3. Timeline
    const timeL = parseList(d.timeline);
    if (timeL && timeL.length > 0) {
      return timeL.map(item => ({
        time: item.time ? formatTime(item.time) : "—",
        title: item.title || item.event || "Event",
        desc: item.desc || item.description || ""
      })).filter(item => item.title || item.desc);
    }
    // 4. Schedule
    const sched = parseList(d.schedule);
    if (sched && sched.length > 0) {
      return sched.map(item => ({
        time: item.time ? formatTime(item.time) : "—",
        title: item.title || item.event || item.name || "Event",
        desc: item.desc || item.description || ""
      })).filter(item => item.title || item.desc);
    }
    // If no schedule has been added, do not fall back to mock data
    return [];
  }, [d.program, d.itinerary, d.timeline, d.schedule]);

  // Gallery items (frames) mapped dynamically - no mock or placeholder fallback
  const galleryFrames = useMemo(() => {
    if (userGalleryImages.length > 0) {
      return userGalleryImages.map((img) => ({
        img
      }));
    }

    return [];
  }, [userGalleryImages]);

  // Dress code color palette from backend
  const paletteColors = useMemo(() => {
    const raw = d.dress_code_colors || d.theme_colors || [];
    if (Array.isArray(raw) && raw.length > 0) {
      const filtered = raw.filter(c => typeof c === 'string' && (c.startsWith('#') || c.startsWith('rgb')));
      if (filtered.length > 0) return filtered;
    }
    return ['#1A1A1A', '#C9A86A', '#EDE6DA', '#FFFCF8'];
  }, [d.dress_code_colors, d.theme_colors]);

  // Other Events list from backend
  const otherEventsList = useMemo(() => {
    const raw = d.otherEvents || d.other_events;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return [];
  }, [d.otherEvents, d.other_events]);

  // Gifts list from backend (handling arrays, JSON strings, or objects)
  const giftsList = useMemo(() => {
    let raw = d.gifts;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = [];
      }
    }
    if (Array.isArray(raw) && raw.length > 0) {
      const valid = raw.filter(g => g && (
        g.provider || g.bank || g.bank_name || g.giftType || g.type || g.title ||
        g.accountNumber || g.account_number || g.number || g.phone ||
        g.accountName || g.account_name || g.recipient || g.name ||
        g.url || g.link ||
        g.instructions || g.description || g.note || g.branch
      ));
      if (valid.length > 0) return valid;
    }
    // Fallback demo gifts only if weddingData wasn't explicitly provided with empty gifts
    if (!weddingData && defaultData.gifts && defaultData.gifts.length > 0) {
      return defaultData.gifts;
    }
    return [];
  }, [d.gifts, weddingData]);

  // Extra gift note / custom instructions from backend
  const giftNote = useMemo(() => {
    return (
      d.extra_card_text ||
      d.extraCardText ||
      d.gift_note ||
      d.giftNote ||
      (typeof d.venue_description === 'string' && d.venue_description.startsWith("EXTRA_CARD_TEXT:")
        ? d.venue_description.replace("EXTRA_CARD_TEXT:", "")
        : "") ||
      ""
    );
  }, [d.extra_card_text, d.extraCardText, d.gift_note, d.giftNote, d.venue_description]);

  // Entourage from backend
  const bridesmaidsList = useMemo(() => {
    if (Array.isArray(d.bridesmaids) && d.bridesmaids.length > 0) {
      return d.bridesmaids.filter(b => b && (b.name || b.role));
    }
    return [];
  }, [d.bridesmaids]);

  const groomsmenList = useMemo(() => {
    if (Array.isArray(d.groomsmen) && d.groomsmen.length > 0) {
      return d.groomsmen.filter(g => g && (g.name || g.role));
    }
    return [];
  }, [d.groomsmen]);

  // Component states
  const [loading, setLoading] = useState(true);
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [isStoryHovered, setIsStoryHovered] = useState(false);
  const [copiedGiftIdx, setCopiedGiftIdx] = useState(null);

  // Hero Image Slider State
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  // Auto-advance hero background slides every 5.5 seconds
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const handlePrevHeroSlide = (e) => {
    e?.stopPropagation?.();
    if (heroImages.length <= 1) return;
    setCurrentHeroIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const handleNextHeroSlide = (e) => {
    e?.stopPropagation?.();
    if (heroImages.length <= 1) return;
    setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
  };

  const handleCopyGiftNumber = (text, idx) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedGiftIdx(idx);
      setTimeout(() => {
        setCopiedGiftIdx(null);
      }, 2000);
    } catch (e) {
      console.warn("Failed to copy gift number", e);
    }
  };

  // RSVP Form state
  const [rsvpForm, setRsvpForm] = useState({
    name: "",
    partner_name: "",
    email: "",
    phone: "",
    attend: "accept",
    guests: "1"
  });
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);
  const isSubmitting = parentIsSubmitting !== undefined ? parentIsSubmitting : localIsSubmitting;
  const setIsSubmitting = parentIsSubmitting !== undefined ? () => { } : setLocalIsSubmitting;

  const [forceHideAdmissionCard, setForceHideAdmissionCard] = useState(false);
  const [localShowAdmissionCard, setLocalShowAdmissionCard] = useState(false);
  const showAdmissionCard = !forceHideAdmissionCard && Boolean(parentShowAdmissionCard || localShowAdmissionCard);
  const setShowAdmissionCard = (val) => {
    if (!val) setForceHideAdmissionCard(true);
    else setForceHideAdmissionCard(false);
    setLocalShowAdmissionCard(val);
  };

  const [localSubmittedRSVP, setLocalSubmittedRSVP] = useState(null);
  const submittedRSVP = useMemo(() => {
    if (!parentSubmittedRSVP && !localSubmittedRSVP) return null;
    return {
      ...(localSubmittedRSVP || {}),
      ...(parentSubmittedRSVP || {})
    };
  }, [parentSubmittedRSVP, localSubmittedRSVP]);
  const setSubmittedRSVP = (val) => {
    setLocalSubmittedRSVP(val);
  };

  const isIOS = useMemo(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }, []);

  const [isDownloading, setIsDownloading] = useState(false);
  const [cardRenderedUrl, setCardRenderedUrl] = useState(null);

  // Derived seatt number display values (guarantees seat numbers never show as "—")
  const displaySeatNumber = submittedRSVP?.seat_number || localSubmittedRSVP?.seat_number || 1;
  const displaySeatNumberEnd = submittedRSVP?.seat_number_end || localSubmittedRSVP?.seat_number_end || displaySeatNumber;
  const seatDisplayString = (displaySeatNumberEnd && displaySeatNumberEnd !== displaySeatNumber)
    ? `${displaySeatNumber} & ${displaySeatNumberEnd}`
    : `${displaySeatNumber}`;

  // Music state & auto-play
  const musicUrl = d.music_url || d.musicUrl || defaultMusic;
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef(null);

  // Auto-play atmospheric background music on load with browser interaction unlock fallback
  useEffect(() => {
    let unmounted = false;

    const playAudio = () => {
      if (!audioRef.current || unmounted) return;
      audioRef.current.play().then(() => {
        if (!unmounted) setIsPlayingMusic(true);
      }).catch((err) => {
        // Browser autoplay restriction, will unlock on interaction
        console.log("Autoplay waiting for user gesture:", err?.message);
      });
    };

    // Attempt immediate playback
    playAudio();

    // Fallback: unlock on first user click, touch, scroll, or keypress anywhere on screen
    const handleFirstInteraction = () => {
      playAudio();
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction, { passive: true, once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true, once: true });
    window.addEventListener('scroll', handleFirstInteraction, { passive: true, once: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true, once: true });

    return () => {
      unmounted = true;
      cleanup();
    };
  }, [musicUrl]);


  // Refs for interactive animations
  const heroParallaxRef = useRef(null);
  const lastScrollY = useRef(0);
  const storyContainerRef = useRef(null);
  const pointerStartX = useRef(0);
  const scheduleRef = useRef(null);
  const [scheduleProgress, setScheduleProgress] = useState(0);

  // Loading Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  // Countdown Timer
  useEffect(() => {
    const calc = () => {
      const diff = eventDateObj.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000)
      });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [eventDateObj]);

  // Scroll spy, sticky nav and schedule line fill
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      setNavScrolled(scrollY > lastScrollY.current && scrollY > 120);
      lastScrollY.current = scrollY;

      const sections = [
        "home",
        "save",
        "story",
        ...(galleryFrames.length > 0 ? ["gallery"] : []),
        "details",
        ...(timelineList.length > 0 ? ["schedule"] : []),
        "rsvp"
      ];
      for (const secId of [...sections].reverse()) {
        const el = document.getElementById(secId);
        if (el && scrollY + 160 >= el.offsetTop) {
          setActiveSection(secId);
          break;
        }
      }

      if (heroParallaxRef.current) {
        heroParallaxRef.current.style.transform = `translate3d(0, ${scrollY * 0.22}px, 0) scale(${1 + scrollY * 0.00012})`;
      }

      if (scheduleRef.current) {
        const rect = scheduleRef.current.getBoundingClientRect();
        const winHeight = window.innerHeight;
        const progress = Math.min(1, Math.max(0, (winHeight * 0.6 - rect.top) / (rect.height * 0.8)));
        setScheduleProgress(progress);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reveal animations
  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-in");
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  // Sync default guests count from backend allowedGuests
  useEffect(() => {
    if (d.allowedGuests && d.allowedGuests.length > 0) {
      setRsvpForm(prev => ({ ...prev, guests: d.allowedGuests[0] }));
    }
  }, [d.allowedGuests]);

  // Auto-play story carousel (every 6 seconds when not hovered)
  useEffect(() => {
    if (isStoryHovered || storyList.length <= 1) return;
    const timer = setInterval(() => {
      scrollStory('next');
    }, 6000);
    return () => clearInterval(timer);
  }, [isStoryHovered, storyList.length, activeStoryIndex]);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (selectedPhotoIndex === null || galleryFrames.length === 0) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedPhotoIndex(null);
      if (e.key === 'ArrowLeft') setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : galleryFrames.length - 1));
      if (e.key === 'ArrowRight') setSelectedPhotoIndex((prev) => (prev < galleryFrames.length - 1 ? prev + 1 : 0));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, galleryFrames.length]);

  // Story smooth navigation
  const scrollStory = (direction) => {
    if (!storyContainerRef.current) return;
    const container = storyContainerRef.current;
    const card = container.querySelector('[data-story-card]');
    const cardWidth = card ? card.offsetWidth : 480;
    const gap = 24;
    const step = cardWidth + gap;

    if (direction === 'next') {
      const nextIdx = activeStoryIndex < storyList.length - 1 ? activeStoryIndex + 1 : 0;
      container.scrollTo({ left: nextIdx * step, behavior: 'smooth' });
      setActiveStoryIndex(nextIdx);
    } else {
      const prevIdx = activeStoryIndex > 0 ? activeStoryIndex - 1 : storyList.length - 1;
      container.scrollTo({ left: prevIdx * step, behavior: 'smooth' });
      setActiveStoryIndex(prevIdx);
    }
  };

  const scrollToStoryIndex = (index) => {
    if (!storyContainerRef.current) return;
    const container = storyContainerRef.current;
    const card = container.querySelector('[data-story-card]');
    const cardWidth = card ? card.offsetWidth : 480;
    const gap = 24;
    container.scrollTo({ left: index * (cardWidth + gap), behavior: 'smooth' });
    setActiveStoryIndex(index);
  };

  const handleStoryScroll = (e) => {
    const container = e.currentTarget;
    const card = container.querySelector('[data-story-card]');
    const cardWidth = card ? card.offsetWidth : 480;
    const gap = 24;
    const scrollLeft = container.scrollLeft;
    const newIdx = Math.round(scrollLeft / (cardWidth + gap));
    if (newIdx >= 0 && newIdx < storyList.length && newIdx !== activeStoryIndex) {
      setActiveStoryIndex(newIdx);
    }
  };

  // Music toggle
  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => { });
    }
  };

  // Scroll to section helper
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper to compute next seat number
  const computeNextSeatNumber = async (guestsCount = 1) => {
    let nextSeat = 1;
    try {
      if (supabase && d?.id) {
        const { data: seatData } = await supabase
          .from('rsvps')
          .select('seat_number, seat_number_end')
          .eq('wedding_id', d.id)
          .not('seat_number', 'is', null)
          .order('seat_number_end', { ascending: false })
          .limit(1);

        if (seatData && seatData.length > 0) {
          const maxEnd = seatData[0].seat_number_end ?? seatData[0].seat_number ?? 0;
          if (typeof maxEnd === 'number' && maxEnd > 0) {
            nextSeat = maxEnd + 1;
          }
        }
      }
    } catch (e) {
      console.warn("Could not query seat numbers, using fallback:", e);
    }
    return {
      seat_number: nextSeat,
      seat_number_end: guestsCount > 1 ? (nextSeat + guestsCount - 1) : nextSeat
    };
  };

  // RSVP Submission Handler
  const handleRSVPSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!rsvpForm.name.trim() || !rsvpForm.phone.trim()) return;

    setForceHideAdmissionCard(false);
    const guestsCount = parseInt(rsvpForm.guests, 10) || 1;
    const { seat_number, seat_number_end } = await computeNextSeatNumber(guestsCount);

    if (handleRSVPSubmitFromParent) {
      const payload = {
        name: rsvpForm.name,
        partner_name: rsvpForm.partner_name || '',
        email: rsvpForm.email || '',
        phone: rsvpForm.phone || '',
        attendance: rsvpForm.attend === 'accept' ? 'yes' : 'no',
        attending: rsvpForm.attend === 'accept' ? 'yes' : 'no',
        guests: rsvpForm.guests || '1',
        guests_count: guestsCount,
        seat_number,
        seat_number_end,
        message: ''
      };
      setLocalSubmittedRSVP({
        id: `mc-${Date.now()}`,
        ...payload
      });
      setLocalShowAdmissionCard(true);
      try {
        await handleRSVPSubmitFromParent(e, payload);
      } catch (err) {
        console.warn("Parent RSVP submit error:", err);
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      return;
    }

    setIsSubmitting(true);
    try {
      const guestId = `mc-${Date.now()}`;
      const payload = {
        name: rsvpForm.name,
        partner_name: rsvpForm.partner_name || null,
        email: rsvpForm.email || null,
        phone: rsvpForm.phone || null,
        wedding_id: d.id || null,
        attending: rsvpForm.attend === 'accept' ? 'yes' : 'no',
        guests_count: guestsCount,
        seat_number,
        seat_number_end,
        message: ''
      };

      if (supabase && d.id) {
        let res = await supabase.from('rsvps').insert([payload]);
        if (res.error && (res.error.message?.includes('seat_number') || res.error.message?.includes('partner_'))) {
          await supabase.from('rsvps').insert([{
            wedding_id: d.id,
            name: rsvpForm.partner_name ? `${rsvpForm.name} & ${rsvpForm.partner_name}` : rsvpForm.name,
            email: rsvpForm.email || null,
            phone: rsvpForm.phone || null,
            attending: rsvpForm.attend === 'accept' ? 'yes' : 'no',
            guests_count: guestsCount
          }]);
        }
      }

      setSubmittedRSVP({
        id: guestId,
        ...payload
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      setShowAdmissionCard(true);
    } catch (err) {
      console.warn("RSVP fallback:", err);
      const fallbackId = `local-${Date.now()}`;
      setSubmittedRSVP({
        id: fallbackId,
        name: rsvpForm.name,
        partner_name: rsvpForm.partner_name || '',
        email: rsvpForm.email || null,
        phone: rsvpForm.phone || null,
        wedding_id: d.id || null,
        attending: rsvpForm.attend === 'accept' ? 'yes' : 'no',
        guests_count: guestsCount,
        seat_number,
        seat_number_end
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      setShowAdmissionCard(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download pass card (supports iOS Photo save + Android/Desktop Blob download)
  const downloadPassCard = async () => {
    if (isDownloading) return;

    // iOS re-render: if card is currently off-screen (replaced by img), bring it back first
    // so html2canvas captures a visible, fully-laid-out element
    if (isIOS && cardRenderedUrl) {
      setCardRenderedUrl(null);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }

    const el = document.getElementById('modern-classic-pass-card');
    if (!el) {
      console.warn("Pass card element not found in DOM");
      return;
    }

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(el, {
        useCORS: true,
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false
      });

      const guestPart = (submittedRSVP?.name || rsvpForm.name || 'guest')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      const filename = `ecard-${guestPart}.png`;

      // ── iOS: swap the HTML card with a rendered <img> so guest can long-press → Save to Photos ──
      if (isIOS) {
        const dataUrl = canvas.toDataURL('image/png');
        setCardRenderedUrl(dataUrl);
        setIsDownloading(false);
        return;
      }

      // ── Android / Desktop: Blob download ──
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      } else {
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('E Card download error:', err);
      // Fallback: try capturing at lower scale
      try {
        const canvas = await html2canvas(el, { scale: 1.5, backgroundColor: '#ffffff', logging: false });
        const dataUrl = canvas.toDataURL('image/png');
        const guestPart = (submittedRSVP?.name || rsvpForm.name || 'guest').toLowerCase().replace(/[^a-z0-9]/g, '-');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `ecard-${guestPart}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e2) {
        alert('Could not automatically save the E Card.\nPlease take a screenshot of your admission pass.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Keep a stable ref so auto-download useEffect always calls the latest version
  const downloadPassCardRef = useRef(downloadPassCard);
  useEffect(() => { downloadPassCardRef.current = downloadPassCard; });

  // Auto-trigger download/save as soon as a fresh RSVP submission completes
  useEffect(() => {
    if (!submittedRSVP?.id) return;
    let cancelled = false;

    const tryDownload = (attempt = 1) => {
      const el = document.getElementById('modern-classic-pass-card');
      if (!el && attempt < 6) {
        setTimeout(() => { if (!cancelled) tryDownload(attempt + 1); }, 400);
        return;
      }
      if (el && !cancelled) downloadPassCardRef.current();
    };

    const t = setTimeout(() => tryDownload(), 800);
    return () => { cancelled = true; clearTimeout(t); };
  }, [submittedRSVP?.id]);

  return (
    <div className="min-h-screen bg-[#FFFCF8] text-[#1A1A1A] selection:bg-[#C9A86A]/20">
      {/* Styles & Typography matching the Meta AI Share */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Manrope:wght@300;400;500;600&display=swap');
        
        .modern-classic-root {
          font-family: 'Manrope', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #FFFCF8;
          color: #1A1A1A;
          scroll-behavior: smooth;
        }
        .modern-classic-root h1, 
        .modern-classic-root h2, 
        .modern-classic-root h3, 
        .modern-classic-root .serif {
          font-family: 'Playfair Display', Georgia, serif;
        }
        .modern-classic-root .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modern-classic-root .reveal-in {
          opacity: 1;
          transform: translateY(0);
        }
        .modern-classic-root .hairline {
          border-color: rgba(26, 26, 26, 0.08);
        }
        .modern-classic-root .gold-line {
          background: linear-gradient(90deg, transparent, #C9A86A, transparent);
        }
        .modern-classic-root .kenburns {
          transition: transform 1.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modern-classic-root .group:hover .kenburns {
          transform: scale(1.08);
        }
        .modern-classic-root ::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Audio element for atmospheric background music */}
      <audio ref={audioRef} src={musicUrl} loop preload="auto" />

      {/* ─── Hero Monogram Loading Screen ────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[100] bg-[#FFFCF8] flex items-center justify-center transition-opacity duration-[900ms] pointer-events-none ${loading ? "opacity-100" : "opacity-0"
          }`}
      >
        <div className="text-center">
          <div className="relative w-[120px] h-[120px] mx-auto mb-8">
            <svg viewBox="0 0 120 120" className="w-full h-full">
              <circle
                cx="60"
                cy="60"
                r="56"
                fill="none"
                stroke="#C9A86A"
                strokeWidth="0.5"
                strokeDasharray="352"
                strokeDashoffset={loading ? 352 : 0}
                style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)" }}
              />
              <path
                d="M 42 60 L 60 42 L 78 60"
                fill="none"
                stroke="#1A1A1A"
                strokeWidth="0.6"
                opacity="0.6"
                style={{
                  strokeDasharray: 60,
                  strokeDashoffset: loading ? 60 : 0,
                  transition: "stroke-dashoffset 1s 0.3s ease"
                }}
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center serif text-[22px] tracking-[0.18em] font-light">
              {monogram}
            </span>
          </div>
          <p className="text-[11px] tracking-[0.35em] uppercase opacity-60">
            Invitation — Loading
          </p>
        </div>
      </div>

      <div className="modern-classic-root">
        {/* ─── Sticky Glass Navigation Bar ──────────────────────────────────────────── */}
        <nav
          className={`fixed top-0 inset-x-0 z-40 border-b hairline backdrop-blur-[18px] bg-[#FFFCF8]/80 transition-transform duration-500 ${navScrolled ? "-translate-y-full" : "translate-y-0"
            }`}
          style={{ paddingTop: "var(--safe-area-inset-top, 0px)" }}
        >
          <div className="mx-auto max-w-[1280px] px-6 md:px-10 h-[68px] flex items-center justify-between">
            <button onClick={() => scrollToSection("home")} className="serif text-[15px] tracking-[0.2em] uppercase font-light">
              {monogram}
            </button>
            <div className="hidden md:flex items-center gap-9">
              {[
                { id: "save", label: "Save" },
                { id: "story", label: "Story" },
                ...(galleryFrames.length > 0 ? [{ id: "gallery", label: "Gallery" }] : []),
                { id: "details", label: "Details" },
                ...(timelineList.length > 0 ? [{ id: "schedule", label: "Schedule" }] : []),
                { id: "rsvp", label: "RSVP" }
              ].map((navItem) => (
                <button
                  key={navItem.id}
                  onClick={() => scrollToSection(navItem.id)}
                  className={`text-[11px] tracking-[0.22em] uppercase transition-opacity ${activeSection === navItem.id ? "opacity-100 font-medium text-[#C9A86A]" : "opacity-40 hover:opacity-80"
                    }`}
                >
                  {navItem.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Music mute/unmute button */}
              <button
                onClick={toggleMusic}
                aria-label={isPlayingMusic ? "Pause music" : "Play music"}
                className="w-9 h-9 rounded-full border border-[#1A1A1A]/15 grid place-items-center text-[12px] opacity-70 hover:opacity-100 transition-opacity"
                title={isPlayingMusic ? "Mute music" : "Play music"}
              >
                {isPlayingMusic ? (
                  <span className="flex items-center gap-0.5">
                    <span className="w-[2px] h-3 bg-[#1A1A1A] animate-pulse" />
                    <span className="w-[2px] h-4 bg-[#C9A86A] animate-pulse" />
                    <span className="w-[2px] h-2 bg-[#1A1A1A] animate-pulse" />
                  </span>
                ) : (
                  <span>♪</span>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* ─── Hero Section ─────────────────────────────────────────────────────────── */}
        <section id="home" className="relative h-[100svh] min-h-[600px] overflow-hidden bg-[#F7F3EC] flex flex-col">

          {/* Full-bleed background image slider with smooth crossfade */}
          <div className="absolute inset-0">
            <div ref={heroParallaxRef} className="absolute inset-0 will-change-transform">
              {heroImages.length > 0 ? (
                heroImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${idx === currentHeroIndex
                      ? "opacity-100 scale-[1.04] z-[1]"
                      : "opacity-0 scale-100 z-0 pointer-events-none"
                      }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${brideName} & ${groomName} - Slide ${idx + 1}`}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                ))
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#ECE3D5] via-[#DDD0BD] to-[#C9BAA3]" />
              )}
              {/* Ultra-light minimal scrim: keeps photo bright and vibrant while ensuring typography contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-transparent z-[2] pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent z-[2] pointer-events-none" />
            </div>
          </div>

          {/* Content — left-aligned, vertically centred */}
          <div className="relative z-10 flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-[780px]">
            {/* Overline */}
            <div className="reveal flex items-center gap-3 mb-8">
              <span className="h-[1px] w-8 bg-[#C9A86A]" />
              <span className="text-[10px] tracking-[0.42em] uppercase text-[#C9A86A] font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                {tagline}
              </span>
            </div>

            {/* Names */}
            <div className="reveal" style={{ transitionDelay: '80ms' }}>
              <p className="serif italic text-[#FFFCF8]/75 text-[15px] md:text-[18px] font-light mb-3 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
                The wedding of
              </p>
              <h1 className="serif text-[#FFFCF8] text-[52px] sm:text-[68px] md:text-[86px] leading-[0.9] tracking-[-0.02em] font-[500] drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)]">
                {groomFirst}
                <span className="block italic font-light text-[#C9A86A] text-[38px] sm:text-[50px] md:text-[64px] leading-[1.1] my-1">& {brideFirst}</span>
              </h1>
            </div>

            {/* Date + venue pill */}
            <div className="reveal mt-8 flex flex-wrap items-center gap-4 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]" style={{ transitionDelay: '180ms' }}>
              <span className="text-[#FFFCF8]/95 text-[13px] md:text-[15px] tracking-[0.18em] font-light">
                {formattedDateFull}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A86A]" />
              <span className="text-[#FFFCF8]/90 text-[12px] md:text-[13px] tracking-[0.22em] uppercase font-medium">
                {receptionVenue}
              </span>
            </div>

            {/* CTA with elegant underlines (no solid background buttons) */}
            <div className="reveal mt-10 flex items-center gap-8" style={{ transitionDelay: '280ms' }}>
              <button
                onClick={() => scrollToSection('rsvp')}
                className="group relative pb-2 text-[12px] tracking-[0.28em] uppercase text-[#FFFCF8] hover:text-[#C9A86A] transition-colors duration-300 font-medium drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]"
              >
                <span>RSVP Now</span>
                <span className="inline-block ml-2 text-[13px] group-hover:translate-x-1.5 transition-transform duration-300">→</span>
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#C9A86A] origin-left group-hover:scale-x-105 transition-transform duration-300" />
              </button>
              <button
                onClick={() => scrollToSection('story')}
                className="group relative pb-2 text-[12px] tracking-[0.28em] uppercase text-[#FFFCF8]/80 hover:text-[#FFFCF8] transition-colors duration-300 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]"
              >
                <span>Our Story</span>
                <span className="inline-block ml-2 text-[13px] group-hover:translate-y-1 transition-transform duration-300">↓</span>
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#FFFCF8]/40 group-hover:bg-[#FFFCF8] transition-colors duration-300" />
              </button>
            </div>
          </div>

          {/* Bottom strip — date stamp, slider controls & scroll */}
          <div className="relative z-10 border-t border-[#FFFCF8]/[0.12] px-8 md:px-16 lg:px-24 py-4 flex items-center justify-between flex-wrap gap-4">
            <span className="font-mono text-[11px] tracking-[0.35em] text-[#FFFCF8]/60 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
              {`${String(eventDateObj.getDate()).padStart(2, '0')} · ${String(eventDateObj.getMonth() + 1).padStart(2, '0')} · ${String(eventDateObj.getFullYear()).slice(-2)}`}
            </span>

            {/* Hero Slider Dots & Controls (if more than 1 image) */}
            {heroImages.length > 1 && (
              <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                <button
                  type="button"
                  onClick={handlePrevHeroSlide}
                  className="w-6 h-6 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-white/60 grid place-items-center text-[10px] transition-colors"
                  aria-label="Previous slide"
                  title="Previous image"
                >
                  ←
                </button>
                <div className="flex items-center gap-1.5">
                  {heroImages.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setCurrentHeroIndex(dotIdx)}
                      className={`h-1.5 transition-all duration-300 rounded-full ${dotIdx === currentHeroIndex
                        ? "w-6 bg-[#C9A86A]"
                        : "w-1.5 bg-white/40 hover:bg-white/80"
                        }`}
                      aria-label={`Go to slide ${dotIdx + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleNextHeroSlide}
                  className="w-6 h-6 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-white/60 grid place-items-center text-[10px] transition-colors"
                  aria-label="Next slide"
                  title="Next image"
                >
                  →
                </button>
                <span className="font-mono text-[10px] text-white/70 tracking-wider ml-0.5">
                  {String(currentHeroIndex + 1).padStart(2, '0')}/{String(heroImages.length).padStart(2, '0')}
                </span>
              </div>
            )}

            <button
              onClick={() => scrollToSection('save')}
              className="flex items-center gap-2 group"
              aria-label="Scroll down"
            >
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#FFFCF8]/60 group-hover:text-[#C9A86A] transition-colors drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                Scroll
              </span>
              <span className="text-[#FFFCF8]/60 group-hover:text-[#C9A86A] transition-colors text-[14px]">↓</span>
            </button>
          </div>
        </section>

        {/* ─── Save the Date & Countdown Section ─────────────────────────────────────── */}
        <section id="save" className="border-y hairline bg-white">
          <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-20 md:py-28 grid md:grid-cols-[1.1fr_0.9fr] gap-12 md:gap-0">
            <div className="reveal md:border-r hairline md:pr-16">
              <p className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-8">
                Save the date {formattedDateFull} {/* Month Day — Date */}
              </p>
              <h2 className="serif text-[44px] md:text-[64px] leading-[0.95] tracking-[-0.02em]">
                Save<br />the Date
              </h2>
              <p className="mt-8 max-w-[36ch] text-[15px] leading-[1.8] opacity-70">
                {d.saveDateDescription || "A celebration of love, vows spoken with joy. Join us as we begin our forever together."}
              </p>
              <div className="mt-10 h-[1px] w-full gold-line opacity-60" />
              <div className="mt-8 flex gap-10">
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase opacity-50">
                    Date
                  </p>
                  <p className="mt-2 serif text-[18px]">
                    {formattedDateFull}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase opacity-50">
                    Venue
                  </p>
                  <p className="mt-2 serif text-[18px]">
                    {receptionVenue}
                  </p>
                </div>
              </div>
            </div>

            <div className="reveal md:pl-16" style={{ transitionDelay: "120ms" }}>
              <div className="border border-[#1A1A1A]/10 rounded-[4px] p-8 md:p-10 bg-[#FFFCF8]">
                <p className="text-[10px] tracking-[0.35em] uppercase opacity-50 text-center">
                  Countdown to vows
                </p>
                <div className="mt-10 grid grid-cols-4 gap-3 text-center">
                  {[
                    { label: "Days", value: timeLeft.d },
                    { label: "Hours", value: timeLeft.h },
                    { label: "Mins", value: timeLeft.m },
                    { label: "Secs", value: timeLeft.s }
                  ].map((unit, i) => (
                    <div key={i} className="border border-[#1A1A1A]/[0.06] bg-white rounded-[2px] py-6">
                      <p className="serif text-[32px] md:text-[36px] leading-none">
                        {String(unit.value).padStart(2, '0')}
                      </p>
                      <p className="mt-3 text-[10px] tracking-[0.28em] uppercase opacity-50">
                        {unit.label}
                      </p>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ─── Our Story Carousel ──────────────────────────────────────────────────── */}
        <section id="story" className="bg-[#F5F0E8] overflow-hidden">
          <div className="mx-auto max-w-[1280px] px-6 md:px-10 pt-20 md:pt-28">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="reveal">
                <p className="text-[10px] tracking-[0.4em] uppercase opacity-50">
                  Our Story — 02 / 02
                </p>
                <h2 className="mt-4 serif text-[42px] md:text-[56px] leading-[0.95]">
                  A quiet timeline,<br />told slowly.
                </h2>
              </div>
              <div className="reveal flex items-center gap-3" style={{ transitionDelay: "100ms" }}>
                <button
                  type="button"
                  onClick={() => scrollStory('prev')}
                  className="w-11 h-11 rounded-full border border-[#1A1A1A]/15 grid place-items-center hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95"
                  aria-label="Previous story card"
                  title="Previous chapter"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => scrollStory('next')}
                  className="w-11 h-11 rounded-full border border-[#1A1A1A]/15 grid place-items-center hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95"
                  aria-label="Next story card"
                  title="Next chapter"
                >
                  →
                </button>
              </div>
            </div>
          </div>

          <div
            className="mt-12 md:mt-16 select-none"
            onMouseEnter={() => setIsStoryHovered(true)}
            onMouseLeave={() => setIsStoryHovered(false)}
          >
            {/* Scroll track — aligned to page content margin */}
            <div className="mx-auto max-w-[1280px] px-5 md:px-10">
              <div
                ref={storyContainerRef}
                onScroll={handleStoryScroll}
                className="flex items-start gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-8 pt-2 -mr-6 md:-mr-10 pr-6 md:pr-10"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {storyList.map((item, idx) => {
                  const isActive = idx === activeStoryIndex;
                  const cardImg = item.image;
                  // Format event date as DD · MM · YY for the card watermark
                  const eventDateStamp = `${String(eventDateObj.getDate()).padStart(2, '0')} · ${String(eventDateObj.getMonth() + 1).padStart(2, '0')} · ${String(eventDateObj.getFullYear()).slice(-2)}`;

                  return (
                    <div
                      key={idx}
                      data-story-card
                      onClick={() => scrollToStoryIndex(idx)}
                      style={{ minWidth: 'min(480px, 82vw)', maxWidth: 'min(520px, 88vw)' }}
                      className="flex-none snap-start cursor-pointer"
                    >
                      <div
                        className={`group relative bg-white border rounded-[4px] overflow-hidden transition-all duration-500 ${isActive
                          ? "border-[#C9A86A]/70 shadow-[0_24px_60px_rgba(201,168,106,0.18)]"
                          : "border-[#1A1A1A]/[0.08] hover:border-[#1A1A1A]/20 hover:shadow-md"
                          }`}
                      >
                        {/* Image / colour block */}
                        <div className="h-[260px] sm:h-[300px] md:h-[340px] bg-gradient-to-br from-[#EDE6DA] to-[#D9CBB8] relative overflow-hidden">
                          {cardImg ? (
                            <>
                              <img
                                src={cardImg}
                                alt={item.title}
                                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                            </>
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_60%_30%,rgba(201,168,106,0.18),transparent)]" />
                              <div className="absolute inset-0 bg-gradient-to-br from-[#EDE6DA]/60 to-transparent" />
                            </>
                          )}
                          <span className="absolute top-6 left-6 text-[10px] tracking-[0.3em] uppercase px-3 py-1 rounded-full bg-white/90 text-[#1A1A1A] backdrop-blur font-semibold shadow-sm">
                            {item.accent || `Chapter ${idx + 1}`}
                          </span>
                          {/* Event date stamp — replaces raw year number */}
                          <span className="absolute bottom-5 left-6 font-mono text-[11px] tracking-[0.3em] text-white/80 select-none drop-shadow">
                            {eventDateStamp}
                          </span>
                        </div>

                        {/* Text body */}
                        <div className="p-6 sm:p-8">
                          <div className="flex items-baseline justify-between">
                            <p className="text-[10px] tracking-[0.35em] uppercase opacity-50 font-medium">
                              {item.year}
                            </p>
                            <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86A] font-semibold">
                              {String(idx + 1).padStart(2, '0')} / {String(storyList.length).padStart(2, '0')}
                            </p>
                          </div>
                          <h3 className="mt-3 serif text-[22px] sm:text-[26px] md:text-[28px] leading-[1.2]">
                            {item.title}
                          </h3>
                          <p className="mt-3 text-[13px] leading-[1.85] opacity-70">
                            {item.desc}
                          </p>
                          {/* Active indicator bar */}
                          <div className={`mt-5 h-[2px] rounded-full transition-all duration-700 ${isActive ? 'w-10 bg-[#C9A86A]' : 'w-5 bg-[#1A1A1A]/15'
                            }`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dot indicators + hint */}
            <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-5 flex items-center justify-between">
              <div className="flex gap-2 items-center">
                {storyList.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToStoryIndex(i)}
                    className={`rounded-full transition-all duration-500 ${i === activeStoryIndex
                      ? 'w-10 h-[3px] bg-[#C9A86A]'
                      : 'w-6 h-[2px] bg-[#1A1A1A]/15 hover:bg-[#1A1A1A]/35'
                      }`}
                    aria-label={`Go to chapter ${i + 1}`}
                  />
                ))}
              </div>
              <p className="text-[10px] tracking-[0.3em] uppercase opacity-40 hidden md:block">
                Swipe or use arrows above · {activeStoryIndex + 1} / {storyList.length}
              </p>
            </div>
          </div>
        </section>

        {/* ─── Gallery Section ──────────────────────────────────────────────────────── */}
        {galleryFrames.length > 0 && (
          <section id="gallery" className="bg-[#FFFCF8]">
            <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-20 md:py-28">
              <div className="reveal flex flex-wrap items-end justify-between gap-6 border-b hairline pb-10">
                <h2 className="serif text-[42px] md:text-[56px] leading-[0.9]">
                  Gallery<br />
                  <span className="italic font-light">— soft light</span>
                </h2>
                <p className="max-w-[32ch] text-[13px] leading-[1.8] opacity-60">
                  Moments held in quiet tones. Click to open lightbox.
                </p>
              </div>

              <div className="mt-10 columns-1 sm:columns-2 md:columns-3 gap-6 [column-fill:_balance]">
                {galleryFrames.map((frame, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPhotoIndex(index)}
                    className="reveal group relative w-full mb-6 break-inside-avoid overflow-hidden rounded-[4px] border border-[#1A1A1A]/[0.06] text-left block bg-[#F5F0E8]/30 shadow-sm hover:shadow-md transition-all"
                    style={{ transitionDelay: `${index * 60}ms` }}
                  >
                    <img
                      src={frame.img}
                      alt={`Wedding Frame ${index + 1}`}
                      className="w-full h-auto object-cover block group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[#1A1A1A]/10 pointer-events-none" />
                    <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 flex items-end justify-between bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none">
                      <span className="text-[10px] tracking-[0.32em] uppercase bg-white/90 text-[#1A1A1A] backdrop-blur px-3 py-1 rounded-full font-medium shadow-sm">
                        Frame {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="w-8 h-8 rounded-full bg-white text-[#1A1A1A] grid place-items-center text-[14px] shadow-sm">
                        ↗
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lightbox Modal */}
            {selectedPhotoIndex !== null && galleryFrames[selectedPhotoIndex] && (
              <div className="fixed inset-0 z-50 bg-[#FFFCF8]/95 backdrop-blur-[18px] flex flex-col">
                <div
                  className="h-[68px] border-b hairline flex items-center justify-between px-6 md:px-10"
                  style={{ paddingTop: "var(--safe-area-inset-top, 0px)" }}
                >
                  <p className="text-[11px] tracking-[0.32em] uppercase opacity-60">
                    {selectedPhotoIndex + 1} / {galleryFrames.length} — Soft Light
                  </p>
                  <button
                    onClick={() => setSelectedPhotoIndex(null)}
                    className="w-10 h-10 rounded-full border border-[#1A1A1A]/15 grid place-items-center hover:bg-[#1A1A1A] hover:text-white transition-colors"
                    aria-label="Close lightbox"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 relative flex items-center justify-center p-4 sm:p-6 md:p-10">
                  <div className="max-w-[1050px] max-h-[78vh] rounded-[4px] overflow-hidden border border-[#1A1A1A]/10 bg-black/5 shadow-2xl flex items-center justify-center">
                    <img
                      src={galleryFrames[selectedPhotoIndex].img}
                      alt="Gallery preview"
                      className="max-h-[75vh] max-w-[85vw] w-auto h-auto object-contain select-none block"
                    />
                  </div>

                  {/* Left/Right Buttons */}
                  {galleryFrames.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : galleryFrames.length - 1))}
                        className="absolute left-6 md:left-10 w-11 h-11 rounded-full bg-white/80 backdrop-blur border border-[#1A1A1A]/15 grid place-items-center hover:bg-[#1A1A1A] hover:text-white transition-colors"
                        aria-label="Previous image"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setSelectedPhotoIndex((prev) => (prev < galleryFrames.length - 1 ? prev + 1 : 0))}
                        className="absolute right-6 md:right-10 w-11 h-11 rounded-full bg-white/80 backdrop-blur border border-[#1A1A1A]/15 grid place-items-center hover:bg-[#1A1A1A] hover:text-white transition-colors"
                        aria-label="Next image"
                      >
                        →
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ─── The Details Section ─────────────────────────────────────────────────── */}
        <section id="details" className="bg-[#F5F0E8] border-y hairline">
          <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-20 md:py-28">
            <div className="reveal max-w-[720px]">
              <p className="text-[10px] tracking-[0.4em] uppercase opacity-50">
                The Details
              </p>
              <h2 className="mt-4 serif text-[42px] md:text-[56px] leading-[0.95]">
                Where & how we gather
              </h2>
            </div>

            <div className={`mt-12 ${hasCeremony ? "grid md:grid-cols-2 gap-6" : "max-w-[720px] mx-auto"}`}>
              {/* Ceremony Card - only displayed if ceremony data exists */}
              {hasCeremony && (
                <div
                  className="reveal group relative bg-white border border-[#1A1A1A]/[0.06] rounded-[4px] p-8 md:p-10 hover:-translate-y-[2px] hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] transition-all duration-700 flex flex-col justify-between overflow-hidden"
                  style={{ transitionDelay: "0ms" }}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] tracking-[0.35em] uppercase opacity-50 font-medium">
                          {ceremonyTitle}
                        </p>
                        {ceremonySubtitle && (
                          <p className="serif italic text-[14px] opacity-70 mt-0.5">
                            {ceremonySubtitle}
                          </p>
                        )}
                      </div>
                      {ceremonyTime && (
                        <span className="text-[11px] tracking-[0.2em] uppercase px-3 py-1 rounded-full bg-[#F5F0E8] font-medium">
                          {ceremonyTime}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-8 serif text-[28px]">
                      {ceremonyVenue}
                    </h3>
                    {ceremonyAddress && (
                      <p className="mt-3 text-[13px] opacity-60">
                        {ceremonyAddress}
                      </p>
                    )}
                    <div className="mt-8 h-[1px] w-full bg-[#1A1A1A]/10 relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-1/2 gold-line" />
                    </div>
                    <p className="mt-6 text-[12px] tracking-[0.18em] uppercase opacity-60">
                      Dress code — {dressCode}
                    </p>
                  </div>
                </div>
              )}

              {/* Reception Card */}
              <div
                className={`reveal group relative bg-white border border-[#1A1A1A]/[0.06] rounded-[4px] p-8 md:p-10 hover:-translate-y-[2px] hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] transition-all duration-700 flex flex-col justify-between overflow-hidden ${!hasCeremony ? "w-full" : ""}`}
                style={{ transitionDelay: hasCeremony ? "120ms" : "0ms" }}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] tracking-[0.35em] uppercase opacity-50 font-medium">
                        {receptionTitle}
                      </p>
                      {receptionSubtitle && (
                        <p className="serif italic text-[14px] opacity-70 mt-0.5">
                          {receptionSubtitle}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] tracking-[0.2em] uppercase px-3 py-1 rounded-full bg-[#F5F0E8] font-medium">
                      {receptionTime}
                    </span>
                  </div>
                  <h3 className="mt-8 serif text-[28px]">
                    {receptionVenue}
                  </h3>
                  <p className="mt-3 text-[13px] opacity-60">
                    {receptionAddress}
                  </p>
                  <div className="mt-8 h-[1px] w-full bg-[#1A1A1A]/10 relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-1/2 gold-line" />
                  </div>
                  <p className="mt-6 text-[12px] tracking-[0.18em] uppercase opacity-60">
                    Dress code — {dressCode}
                  </p>
                </div>

                {/* Embedded Map with padding */}
                <div className="-mx-8 md:-mx-10 -mb-8 md:-mb-10 mt-8 border-t border-[#1A1A1A]/[0.08] p-3 md:p-4 bg-[#FAF7F2]/60">
                  <div className="relative overflow-hidden rounded-[4px] border border-[#1A1A1A]/10 shadow-sm">
                    <iframe
                      title={`${receptionVenue} Map`}
                      src={getMapEmbedUrl(receptionVenue, receptionAddress)}
                      width="100%"
                      height="185"
                      style={{ border: 0, display: "block" }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(receptionVenue + " " + receptionAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-[#1A1A1A] text-[10px] tracking-[0.18em] uppercase font-semibold shadow-md backdrop-blur border border-black/5 hover:shadow-lg transition-all"
                    >
                      <svg className="w-3 h-3 text-[#C9A86A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Dress code & Color Palette Box */}
            <div className="reveal mt-8 bg-white border border-[#1A1A1A]/[0.06] rounded-[4px] p-8 md:p-10 text-center">
              <p className="text-[10px] tracking-[0.35em] uppercase opacity-50 font-medium">
                Attire & Color Palette
              </p>
              <h4 className="serif text-[24px] mt-2 font-medium">
                {dressCode}
              </h4>
              {dressCodeDescription && (
                <p className="mt-2 text-[14px] opacity-70 max-w-[50ch] mx-auto italic">
                  {dressCodeDescription}
                </p>
              )}
              {paletteColors.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                  {paletteColors.map((color, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-10 h-10 rounded-full border border-black/10 shadow-sm transition-transform hover:scale-110"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                      <span className="text-[10px] font-mono tracking-[0.05em] uppercase opacity-50">
                        {color}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Other Events (if any) */}
            {otherEventsList.length > 0 && (
              <div className="reveal mt-12">
                <p className="text-[10px] tracking-[0.35em] uppercase opacity-50 mb-2 font-medium">
                  Additional Gatherings
                </p>
                <h3 className="serif text-[32px] mb-6">Other Celebrations</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {otherEventsList.map((ev, idx) => (
                    <div key={idx} className="bg-white border border-[#1A1A1A]/[0.06] rounded-[4px] p-6 md:p-8">
                      <div className="flex items-start justify-between">
                        <h4 className="serif text-[22px] font-medium">{ev.title || ev.name || ev.event_name || "Special Gathering"}</h4>
                        {(ev.time || ev.event_time) && (
                          <span className="text-[11px] tracking-[0.2em] uppercase px-3 py-1 rounded-full bg-[#F5F0E8] font-medium">
                            {formatTime(ev.time || ev.event_time)}
                          </span>
                        )}
                      </div>
                      {(ev.date || ev.event_date) && (
                        <p className="mt-2 text-[12px] tracking-[0.18em] uppercase opacity-60 font-medium">
                          {formatDate(ev.date || ev.event_date)}
                        </p>
                      )}
                      {(ev.venue || ev.location) && (
                        <p className="mt-3 serif text-[17px]">{ev.venue || ev.location}</p>
                      )}
                      {ev.address && (
                        <p className="mt-1 text-[13px] opacity-60">{ev.address}</p>
                      )}
                      {(ev.description || ev.desc) && (
                        <p className="mt-4 text-[13px] leading-[1.7] opacity-75">{ev.description || ev.desc}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bridal Party / Entourage (if any) */}
            {(bridesmaidsList.length > 0 || groomsmenList.length > 0) && (
              <div className="reveal mt-14">
                <p className="text-[10px] tracking-[0.35em] uppercase opacity-50 mb-2 font-medium">
                  The Entourage
                </p>
                <h3 className="serif text-[32px] mb-8">Bridal Party & Groomsmen</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[...bridesmaidsList, ...groomsmenList].map((person, idx) => (
                    <div key={idx} className="bg-white border border-[#1A1A1A]/[0.06] rounded-[4px] overflow-hidden text-center p-6">
                      <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border border-[#C9A86A]/40 mb-4 bg-[#F5F0E8]">
                        {person.image ? (
                          <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center serif text-[24px] text-[#C9A86A]">
                            {person.name?.[0] || '✦'}
                          </div>
                        )}
                      </div>
                      <h4 className="serif text-[18px] font-medium">{person.name}</h4>
                      <p className="text-[11px] tracking-[0.2em] uppercase text-[#C9A86A] mt-1 font-medium">
                        {person.role || person.title || "Wedding Party"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gifts / Registry / Wishing Well from Backend Database */}
            {(giftsList.length > 0 || (giftNote && giftNote.trim().length > 0)) && (
              <div className="reveal mt-14 bg-white border border-[#1A1A1A]/[0.08] rounded-[6px] p-8 md:p-12 text-center shadow-sm">

                <h3 className="serif text-[32px] md:text-[38px] text-[#1A1A1A] font-medium leading-tight">
                  Gifts & Contributions
                </h3>
                <p className="mt-3 text-[14px] text-[#1A1A1A]/70 max-w-[58ch] mx-auto leading-relaxed">
                  {giftNote && giftNote.trim() ? giftNote : "Your love and presence on our special day is the greatest gift of all. For friends and family who have graciously inquired about gifting details, our contributions and registry channels are listed below."}
                </p>

                {giftsList.length > 0 && (
                  <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                    {giftsList.map((g, idx) => {
                      const providerName = g.provider || g.bank || g.bank_name || g.giftType || g.type || g.title || "Gift Option";
                      const accNumber = g.accountNumber || g.account_number || g.number || g.phone || "";
                      const accName = g.accountName || g.account_name || g.recipient || g.name || g.holder || "";
                      const noteText = g.instructions || g.description || g.note || g.branch || "";
                      const giftUrl = g.url || g.link || "";
                      const isMomo = (g.giftType && g.giftType.toLowerCase().includes('mobile')) ||
                        (providerName && (
                          providerName.toLowerCase().includes('airtel') ||
                          providerName.toLowerCase().includes('mtn') ||
                          providerName.toLowerCase().includes('zamtel') ||
                          providerName.toLowerCase().includes('momo') ||
                          providerName.toLowerCase().includes('money')
                        ));
                      const badgeLabel = g.giftType || (giftUrl ? "Online Registry" : (isMomo ? "Mobile Money" : "Bank Transfer"));

                      return (
                        <div
                          key={idx}
                          className="flex flex-col justify-between p-6 rounded-[6px] border border-[#1A1A1A]/10 bg-[#FFFCF8] hover:border-[#C9A86A]/50 transition-all duration-300 hover:shadow-md"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[10px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1 rounded bg-[#F5F0E8] text-[#1A1A1A]/70">
                                {badgeLabel}
                              </span>
                              {isMomo ? (
                                <i className="fas fa-mobile-alt text-[#C9A86A] text-[13px]"></i>
                              ) : giftUrl ? (
                                <i className="fas fa-external-link-alt text-[#C9A86A] text-[12px]"></i>
                              ) : (
                                <i className="fas fa-university text-[#C9A86A] text-[12px]"></i>
                              )}
                            </div>

                            <h4 className="serif text-[20px] text-[#1A1A1A] font-medium leading-snug">
                              {providerName}
                            </h4>

                            {accName && (
                              <p className="mt-2 text-[12px] text-[#1A1A1A]/75 font-medium">
                                <span className="opacity-60 font-normal">Name: </span>{accName}
                              </p>
                            )}

                            {accNumber && (
                              <div className="mt-3 bg-white p-2.5 rounded border border-[#1A1A1A]/10 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/50 font-medium">
                                    {isMomo ? "Phone / Account Number" : "Account Number"}
                                  </p>
                                  <p className="text-[14px] font-mono font-semibold text-[#1A1A1A] tracking-wider truncate">
                                    {accNumber}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyGiftNumber(accNumber, idx)}
                                  className="flex-shrink-0 px-2.5 py-1 text-[11px] font-medium rounded border border-[#1A1A1A]/15 hover:bg-[#1A1A1A] hover:text-white transition-colors duration-200"
                                  title="Copy to clipboard"
                                >
                                  {copiedGiftIdx === idx ? (
                                    <span className="text-emerald-600 font-bold">✓ Copied</span>
                                  ) : (
                                    <span><i className="far fa-copy mr-1"></i>Copy</span>
                                  )}
                                </button>
                              </div>
                            )}

                            {noteText && (
                              <p className="mt-3 text-[12px] text-[#1A1A1A]/70 italic leading-relaxed">
                                {noteText}
                              </p>
                            )}
                          </div>

                          {giftUrl && (
                            <div className="mt-4 pt-3 border-t border-[#1A1A1A]/5">
                              <a
                                href={giftUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#C9A86A] hover:text-[#1A1A1A] transition-colors"
                              >
                                View Online Registry <i className="fas fa-arrow-right text-[10px]"></i>
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ─── Schedule / Day Flow (Interactive Timeline) ──────────────────────────── */}
        {timelineList.length > 0 && (
          <section id="schedule" className="bg-white">
            <div className="mx-auto max-w-[980px] px-6 md:px-10 py-20 md:py-28">
              <div className="reveal text-center max-w-[520px] mx-auto">
                <p className="text-[10px] tracking-[0.4em] uppercase opacity-50">
                  Schedule — Day Flow
                </p>
                <h2 className="mt-4 serif text-[40px] md:text-[52px] leading-[0.95]">
                  The day unfolds slowly
                </h2>
              </div>

              <div ref={scheduleRef} className="relative mt-16 md:mt-24">
                {/* Desktop Center Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] -translate-x-1/2 bg-[#1A1A1A]/10 hidden md:block">
                  <div
                    className="absolute top-0 left-0 w-full bg-[#C9A86A] origin-top transition-[height] duration-200"
                    style={{ height: `${Math.round(scheduleProgress * 100)}%` }}
                  />
                </div>

                {/* Mobile Left Line */}
                <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-[#1A1A1A]/10 md:hidden">
                  <div
                    className="absolute top-0 left-0 w-full bg-[#C9A86A] origin-top"
                    style={{ height: `${Math.round(scheduleProgress * 100)}%` }}
                  />
                </div>

                <div className="space-y-14 md:space-y-20">
                  {timelineList.map((item, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <div
                        key={idx}
                        className={`reveal relative grid md:grid-cols-[1fr_80px_1fr] items-center gap-6 ${isEven ? "" : "md:[&>*:first-child]:order-3 md:[&>*:last-child]:order-1"
                          }`}
                        style={{ transitionDelay: `${idx * 80}ms` }}
                      >
                        <div className={`${isEven ? "md:text-right" : "md:text-left"} pl-10 md:pl-0`}>
                          <p className="serif text-[30px] leading-none">
                            {item.time}
                          </p>
                          <h3 className="mt-3 serif text-[22px]">
                            {item.title}
                          </h3>
                          <p className={`mt-2 text-[13px] opacity-60 max-w-[30ch] ${isEven ? "md:ml-auto" : ""}`}>
                            {item.desc}
                          </p>
                        </div>

                        <div className="hidden md:grid place-items-center">
                          <div className="w-3 h-3 rounded-full bg-[#FFFCF8] border border-[#C9A86A] shadow-[0_0_0_6px_rgba(201,168,106,0.12)]" />
                        </div>

                        <div className="md:hidden absolute left-4 top-1 -translate-x-1/2 w-3 h-3 rounded-full bg-white border border-[#C9A86A]" />

                        <div className="hidden md:block" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── RSVP Section ────────────────────────────────────────────────────────── */}
        <section id="rsvp" className="bg-[#FFFCF8] border-y hairline">
          <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-20 md:py-28 grid md:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
            <div className="reveal md:sticky md:top-28">
              <p className="text-[10px] tracking-[0.4em] uppercase opacity-50">
                RSVP
              </p>
              <h2 className="mt-4 serif text-[42px] md:text-[52px] leading-[0.9]">
                Will you<br />be there?
              </h2>
              <p className="mt-6 text-[14px] leading-[1.8] opacity-60 max-w-[32ch]">
                {d.rsvpDeadline
                  ? `Please respond by ${formatDate(d.rsvpDeadline)}. Your presence is the only present we truly wish for.`
                  : "Please respond by November 10th. Your presence is the only present we truly wish for."}
              </p>
              <div className="mt-10 hidden md:block">
                <div className="w-[220px] h-[280px] rounded-[4px] border border-[#1A1A1A]/10 bg-gradient-to-br from-[#F5F0E8] to-[#EDE6DA] p-6 flex flex-col justify-end">
                  <p className="serif italic text-[18px] leading-[1.2]">
                    With love,<br />
                    {brideFirst} & {groomFirst}
                  </p>
                  <p className="mt-3 text-[10px] tracking-[0.3em] uppercase opacity-50">
                    {eventCity.split(',')[0]} — {eventDateObj.getFullYear()}
                  </p>
                </div>
              </div>
            </div>

            <div className={showAdmissionCard && submittedRSVP ? 'w-full' : 'reveal bg-white border border-[#1A1A1A]/[0.06] rounded-[4px] p-8 md:p-10'} style={{ transitionDelay: "120ms" }}>
              {showAdmissionCard && submittedRSVP ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0', background: '#000' }}>

                  {/* Black header */}
                  <div style={{ width: '100%', maxWidth: 390, background: '#000', padding: '24px 20px 20px', boxSizing: 'border-box', textAlign: 'center' }}>
                    <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.45rem', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '3px', margin: 0 }}>
                      THIS IS YOUR E CARD
                    </h3>
                  </div>

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
                    id="modern-classic-pass-card"
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
                            {seatDisplayString}
                          </p>
                        </div>
                      </div>

                      {/* QR Code — centered, large */}
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 16px' }}>
                        <QRCodeCanvas
                          id="qr-canvas"
                          value={JSON.stringify({
                            id: submittedRSVP?.id,
                            name: submittedRSVP?.name,
                            wedding_id: d.id || "amara-james-2026",
                            seat_number: displaySeatNumber,
                            guests: submittedRSVP?.guests_count || parseInt(rsvpForm.guests, 10) || 1
                          })}
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
                          {brideName} & {groomName}
                        </p>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: '#999', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 5px 0' }}>DATE AND TIME</p>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.1rem', fontWeight: '700', color: '#111', margin: 0 }}>
                          {formattedDateFull}{ceremonyTime ? ` ${ceremonyTime}` : ''}
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
                                {ceremonyVenue || receptionVenue || eventCity}
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
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af', fontFamily: '-apple-system, sans-serif', textAlign: 'center' }}>
                        Press &amp; hold your E Card above → <strong style={{ color: '#ffffff' }}>Save to Photos</strong>
                      </p>
                    )}
                    <button
                      onClick={downloadPassCard}
                      disabled={isDownloading}
                      style={{ background: isDownloading ? '#555' : '#ffffff', color: '#111', border: 'none', padding: '13px 32px', borderRadius: '6px', cursor: isDownloading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px', letterSpacing: '0.5px', minWidth: 180, justifyContent: 'center', transition: 'background 0.2s' }}
                    >
                      {isDownloading ? 'Preparing...' : isIOS ? (cardRenderedUrl ? 'Re-render Card' : 'Save to Photos') : 'Save E Card'}
                    </button>
                    <button
                      onClick={() => setShowAdmissionCard(false)}
                      style={{ background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}
                    >
                      Edit RSVP
                    </button>
                  </div>

                </div>
              ) : (
                <form onSubmit={handleRSVPSubmit} className="space-y-8">
                  {/* Floating label name */}
                  <div className="relative">
                    <input
                      id="rsvp-name"
                      type="text"
                      required
                      value={rsvpForm.name}
                      onChange={(e) => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                      className="peer w-full h-[56px] bg-[#FFFCF8] border border-[#1A1A1A]/10 rounded-[2px] px-4 pt-4 text-[15px] outline-none focus:border-[#C9A86A] transition-colors"
                      placeholder=" "
                    />
                    <label
                      htmlFor="rsvp-name"
                      className="pointer-events-none absolute left-4 top-2 text-[10px] tracking-[0.28em] uppercase opacity-60 peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-[12px] peer-placeholder-shown:tracking-[0.18em] peer-focus:top-2 peer-focus:text-[10px] peer-focus:tracking-[0.28em] transition-all"
                    >
                      Full Name
                    </label>
                  </div>

                  {/* Attendance selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRsvpForm({ ...rsvpForm, attend: 'accept' })}
                      className={`text-left border rounded-[2px] p-4 transition-colors ${rsvpForm.attend === 'accept'
                        ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                        : "bg-[#FFFCF8] border-[#1A1A1A]/10 hover:border-[#1A1A1A]/20"
                        }`}
                    >
                      <p className="text-[13px] tracking-[0.04em]">
                        Joyfully Accepts
                      </p>
                      <p className={`mt-1 text-[11px] tracking-[0.18em] uppercase ${rsvpForm.attend === 'accept' ? 'opacity-60' : 'opacity-50'}`}>
                        Will attend
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRsvpForm({ ...rsvpForm, attend: 'decline' })}
                      className={`text-left border rounded-[2px] p-4 transition-colors ${rsvpForm.attend === 'decline'
                        ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                        : "bg-[#FFFCF8] border-[#1A1A1A]/10 hover:border-[#1A1A1A]/20"
                        }`}
                    >
                      <p className="text-[13px] tracking-[0.04em]">
                        Regretfully Declines
                      </p>
                      <p className={`mt-1 text-[11px] tracking-[0.18em] uppercase ${rsvpForm.attend === 'decline' ? 'opacity-60' : 'opacity-50'}`}>
                        Cannot attend
                      </p>
                    </button>
                  </div>

                  {/* Guest count selector */}
                  {d.allowedGuests && d.allowedGuests.length > 0 && (
                    <div>
                      <p className="text-[10px] tracking-[0.28em] uppercase opacity-60 mb-3">Number of Guests</p>
                      <div className="flex flex-wrap gap-2">
                        {d.allowedGuests.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setRsvpForm({ ...rsvpForm, guests: opt, partner_name: opt === '1' ? '' : rsvpForm.partner_name })}
                            className={`h-[44px] px-6 rounded-[2px] border text-[12px] tracking-[0.18em] uppercase transition-colors ${rsvpForm.guests === opt
                              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                              : 'bg-[#FFFCF8] border-[#1A1A1A]/10 hover:border-[#1A1A1A]/25'
                              }`}
                          >
                            {opt === '2' ? '2 — Couple' : `${opt} Guest${parseInt(opt) > 1 ? 's' : ''}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Partner / Second Guest Name — shown when 2 guests selected */}
                  {(rsvpForm.guests === '2' || (parseInt(rsvpForm.guests) >= 2)) && (
                    <div className="relative">
                      <input
                        id="rsvp-partner-name"
                        type="text"
                        value={rsvpForm.partner_name}
                        onChange={(e) => setRsvpForm({ ...rsvpForm, partner_name: e.target.value })}
                        className="peer w-full h-[56px] bg-[#FFFCF8] border border-[#C9A86A]/40 rounded-[2px] px-4 pt-4 text-[15px] outline-none focus:border-[#C9A86A] transition-colors"
                        placeholder=" "
                      />
                      <label
                        htmlFor="rsvp-partner-name"
                        className="pointer-events-none absolute left-4 top-2 text-[10px] tracking-[0.28em] uppercase opacity-60 peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-[12px] peer-placeholder-shown:tracking-[0.18em] peer-focus:top-2 peer-focus:text-[10px] peer-focus:tracking-[0.28em] transition-all"
                      >
                        Partner / Second Guest Name
                      </label>
                    </div>
                  )}

                  {/* Contact details: Phone (required) & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Required Phone Number */}
                    <div className="relative">
                      <input
                        id="rsvp-phone"
                        type="tel"
                        required
                        value={rsvpForm.phone}
                        onChange={(e) => setRsvpForm({ ...rsvpForm, phone: e.target.value })}
                        className="peer w-full h-[56px] bg-[#FFFCF8] border border-[#1A1A1A]/10 rounded-[2px] px-4 pt-4 text-[15px] outline-none focus:border-[#C9A86A] transition-colors"
                        placeholder=" "
                      />
                      <label
                        htmlFor="rsvp-phone"
                        className="pointer-events-none absolute left-4 top-2 text-[10px] tracking-[0.28em] uppercase opacity-60 peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-[12px] peer-placeholder-shown:tracking-[0.18em] peer-focus:top-2 peer-focus:text-[10px] peer-focus:tracking-[0.28em] transition-all"
                      >
                        Phone Number *
                      </label>
                    </div>

                    {/* Email address */}
                    <div className="relative">
                      <input
                        id="rsvp-email"
                        type="email"
                        value={rsvpForm.email}
                        onChange={(e) => setRsvpForm({ ...rsvpForm, email: e.target.value })}
                        className="peer w-full h-[56px] bg-[#FFFCF8] border border-[#1A1A1A]/10 rounded-[2px] px-4 pt-4 text-[15px] outline-none focus:border-[#C9A86A] transition-colors"
                        placeholder=" "
                      />
                      <label
                        htmlFor="rsvp-email"
                        className="pointer-events-none absolute left-4 top-2 text-[10px] tracking-[0.28em] uppercase opacity-60 peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-[12px] peer-placeholder-shown:tracking-[0.18em] peer-focus:top-2 peer-focus:text-[10px] peer-focus:tracking-[0.28em] transition-all"
                      >
                        Email Address
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-[52px] rounded-full bg-[#1A1A1A] text-white text-[12px] tracking-[0.28em] uppercase hover:bg-black transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Confirming..." : "Confirm RSVP"}
                  </button>

                  <p className="text-center text-[11px] tracking-[0.18em] uppercase opacity-40">
                    Invitation response saved directly
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ─── Footer ──────────────────────────────────────────────────────────────── */}
        <footer className="bg-[#1A1A1A] text-[#FFFCF8] overflow-hidden">
          <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-20 md:py-28 text-center">
            <div className="reveal">
              <p className="text-[10px] tracking-[0.4em] uppercase opacity-50">
                With Love
              </p>
              <h2 className="mt-6 serif text-[42px] md:text-[64px] leading-[0.9] tracking-[-0.02em]">
                {groomFirst} & {brideFirst}
              </h2>

            </div>
          </div>

          <div className="border-t border-white/10 py-6 px-6 md:px-10 flex items-center justify-center text-center gap-3 text-[10px] tracking-[0.25em] uppercase opacity-40">
            <span>
              © {eventDateObj.getFullYear()} {brideFirst} & {groomFirst}
            </span>
          </div>
        </footer>

        {/* ─── Global SaveMeASeat Template Footer ───────────────────────────────────── */}
        <TemplateFooter />

        {/* ─── Fixed Toast Notification ────────────────────────────────────────────── */}
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-700 ${showToast ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
            }`}
        >
          <div className="bg-[#1A1A1A] text-white px-6 py-4 rounded-full flex items-center gap-3 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <span className="w-6 h-6 rounded-full bg-[#C9A86A] grid place-items-center text-[12px] text-black font-bold">
              ✓
            </span>
            <span className="text-[12px] tracking-[0.18em] uppercase">
              Thank you, invitation saved — see you in {eventCity.split(',')[0]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernClassic;
