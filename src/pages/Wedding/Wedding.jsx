import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import AdmissionCard from '../../components/AdmissionCard';

// Import Font Awesome CSS
const FontAwesomeCSS = () => (
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
  />
);

// Import Google Fonts CSS
const GoogleFontsCSS = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500&display=swap"
    rel="stylesheet"
  />
);

import { useParams } from 'react-router-dom';

// Helper to format date safely
const formatDate = (dateString) => {
  if (!dateString) return "";
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  // Handle YYYY-MM-DD from input type="date"
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, options);
};

// Helper to format time safely
const formatTime = (timeString) => {
  if (!timeString) return "";
  // Check if it's already in AM/PM format
  if (timeString.includes('M')) return timeString;

  /* Helper to format time (HH:MM:SS -> 12h AM/PM) */
  // If it comes from DB as HH:MM:SS, take first 5 chars for HH:MM
  const parts = timeString.split(':');
  const hours = parts[0];
  const minutes = parts[1];

  if (!hours || !minutes) return timeString; // Return original if split fails to get HH:MM

  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedH = h % 12 || 12;
  return `${formattedH}:${minutes} ${ampm}`;
};

const WeddingTemplate = () => {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    guests: '1',
    attendance: '',
    message: ''
  });
  const [showAdmissionCard, setShowAdmissionCard] = useState(false);
  const [submittedRSVP, setSubmittedRSVP] = useState(null);
  const [cdnLoaded, setCdnLoaded] = useState(false);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRSVPSubmit = async (e) => {
    e.preventDefault();
    if (!weddingData.id) {
      alert("Wedding ID missing. Please refresh.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('rsvps').insert([{
        wedding_id: weddingData.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        attending: formData.attendance,
        guests_count: parseInt(formData.guests) || 1,
        status: 'pending' // New field: RSVPs start as pending until approved
      }]).select(); // Add .select() to return the created record

      if (error) throw error;

      // Store the created RSVP and show admission card
      if (data && data.length > 0) {
        setSubmittedRSVP(data[0]);
        setShowAdmissionCard(true);
      }

      setFormData({ name: '', email: '', phone: '', guests: '1', attendance: '', message: '' });
    } catch (err) {
      console.error("Full RSVP Error:", err);
      alert("Error sending RSVP: " + (err.message || err.error_description || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initial Mock Data (Fallback)
  // Initial Mock Data (Fallback) - Cleared to prevent static flash
  const initialWeddingData = {
    couple: {
      bride: {
        name: "",
        image: "",
        description: ""
      },
      groom: {
        name: "",
        image: "",
        description: ""
      }
    },
    date: "",
    location: "",
    venue: {
      name: "",
      address: "",
      description: ""
    },
    story: {
      part1: "",
      highlight: "",
      part2: ""
    },
    sliderImages: [],
    bridesmaids: [],
    groomsmen: [],
    ceremony: {
      date: "",
      time: "",
      venue: ""
    },
    reception: {
      date: "",
      time: "",
      venue: "",
      address: ""
    },
    dressCode: "",
    dressCodeDescription: "",
    gifts: [],
    galleryImages: [],
    mapLocation: "",
    rsvpDeadline: "",
    coverImage: null,
    allowedGuests: [],
    otherEvents: [],
    tagline: "We are getting married"
  };

  const [weddingData, setWeddingData] = useState(initialWeddingData);
  const [dataFetched, setDataFetched] = useState(false);

  const isRSVPClosed = (() => {
    if (!weddingData?.rsvpDeadline) return false;
    const deadline = new Date(weddingData.rsvpDeadline);
    deadline.setHours(23, 59, 59, 999);
    return new Date() > deadline;
  })();

  useEffect(() => {
    const fetchWeddingData = async () => {
      try {
        let query = supabase
          .from('weddings')
          .select('*');

        // If we have a slug from the URL, use it
        if (slug) {
          query = query.eq('slug', slug);
        } else {
          // Otherwise get the most recent one (legacy behavior)
          query = query.order('created_at', { ascending: false }).limit(1);
        }

        const { data, error } = await query;

        console.log("1. Supabase RAW Response:", data); // Log detailed array
        if (error) console.error("1. Supabase Error:", error);

        if (error) throw error;

        if (data && data.length > 0) {
          const dbData = data[0];
          console.log("2. Selected Wedding Row:", dbData); // Log the specific row used

          // Increment view count
          // Using RPC is safer than update for counters to avoid race conditions
          // If RPC doesn't exist yet, we can try a direct update but RPC is preferred
          try {
            await supabase.rpc('increment_views', { row_id: dbData.id });
          } catch (viewErr) {
            console.error("Error incrementing views:", viewErr);
            // Fallback: direct update (less safe for concurrency but works)
            const currentViews = dbData.views || 0;
            await supabase.from('weddings').update({ views: currentViews + 1 }).eq('id', dbData.id);
          }

          // Map DB structure to state structure
          setWeddingData({
            id: dbData.id,
            couple: {
              bride: {
                name: dbData.bride_name,
                image: dbData.bride_image,
                description: dbData.bride_description
              },
              groom: {
                name: dbData.groom_name,
                image: dbData.groom_image,
                description: dbData.groom_description
              }
            },
            date: formatDate(dbData.date),
            rawDate: dbData.date, // Store raw ISO date for countdown logic
            location: dbData.location,
            venue: (() => {
              const rawName = dbData.venue_name || dbData.reception_venue || dbData.ceremony_venue || "";
              const rawAddress = dbData.venue_address || dbData.reception_address || "";
              const discardStr = "";

              let finalName = rawName;
              let finalAddress = rawAddress;

              // If specific venue name is missing, try cleaning the location string
              if (!finalName && dbData.location && dbData.location !== discardStr) {
                // If it's a long comma-separated string, take the first part as name, rest as address
                if (dbData.location.includes(',')) {
                  const parts = dbData.location.split(',');
                  finalName = parts[0].trim();
                  if (!finalAddress) finalAddress = dbData.location.trim();
                } else {
                  finalName = dbData.location;
                }
              }

              return {
                name: finalName || "",
                address: finalAddress || dbData.location || "",
                description: dbData.venue_description || ""
              };
            })(),
            story: {
              part1: dbData.story_part1,
              highlight: dbData.story_highlight,
              part2: dbData.story_part2
            },
            sliderImages: dbData.slider_images || initialWeddingData.sliderImages,
            bridesmaids: dbData.bridesmaids || [],
            groomsmen: dbData.groomsmen || [],
            ceremony: {
              date: formatDate(dbData.ceremony_date),
              rawDate: dbData.ceremony_date, // Store raw ISO
              time: formatTime(dbData.ceremony_time),
              venue: dbData.ceremony_venue
            },
            reception: {
              date: formatDate(dbData.reception_date),
              rawDate: dbData.reception_date, // Store raw ISO
              time: formatTime(dbData.reception_time),
              venue: dbData.reception_venue,
              address: dbData.reception_address
            },
            dressCode: dbData.dress_code,
            dressCodeDescription: dbData.dress_code_desc,
            gifts: dbData.gifts || [],
            galleryImages: dbData.gallery_images || [],
            mapLocation: dbData.map_location,
            rsvpDeadline: dbData.rsvp_deadline,
            coverImage: dbData.cover_image,
            tagline: dbData.tagline || "We are getting married",
            allowedGuests: (() => {
              const raw = dbData.allowed_guests;
              if (!raw) return ["1"];
              try {
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                // If it's a number/string like "2", convert to array
                if (parsed) return [parsed.toString()];
              } catch (e) {
                // Not JSON, handle comma-separated string
                if (typeof raw === 'string' && raw.includes(',')) {
                  return raw.split(',').map(s => s.trim()).filter(s => s);
                }
                if (raw) return [raw.toString()];
              }
              return ["1"];
            })(),
            otherEvents: (() => {
              const raw = dbData.other_events;
              if (!raw) return [];
              try {
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                return Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                return [];
              }
            })()
          });
          setDataFetched(true);
        }
      } catch (err) {
        console.error("Error fetching wedding data:", err);
      }
    };

    fetchWeddingData();
    window.scrollTo(0, 0);
  }, [slug]);

  // Load Tailwind CDN for bridal shower-style mobile menu classes
  useEffect(() => {
    window.tailwind = window.tailwind || {};
    window.tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            bsPrimary: '#2d3a3a',
            bsBg: '#fdfbf7',
            bsText: '#1a1a1a',
            bsWhite: '#ffffff',
            bsAccent: '#c5a059'
          },
          fontFamily: {
            outfit: ['Outfit', 'sans-serif'],
            cormorant: ['Cormorant Garamond', 'serif']
          }
        }
      }
    };

    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      script.onload = () => setCdnLoaded(true);
      document.head.appendChild(script);
    } else {
      setCdnLoaded(true);
    }
  }, []);

  // Sync default guests count when wedding data is loaded
  useEffect(() => {
    if (dataFetched && weddingData.allowedGuests.length > 0) {
      setFormData(prev => ({
        ...prev,
        guests: weddingData.allowedGuests[0]
      }));
    }
  }, [dataFetched, weddingData.allowedGuests]);

  // Debug: Log state changes
  useEffect(() => {
    if (dataFetched) {
      console.log("3. Final Component State (weddingData):", weddingData);
    }
  }, [weddingData, dataFetched]);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  /* OLD MOCK DATA REMOVED */

  const slideInterval = useRef(null);
  const coupleRefs = useRef([]);
  const memberRefs = useRef([]);
  const galleryRefs = useRef([]);

  const handleCopyAccount = async (text) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        alert('Account number copied to clipboard!');
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch (err) {
      // Fallback for mobile or non-secure contexts
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Ensure it's not visible but part of DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          alert('Account number copied to clipboard!');
        } else {
          prompt("Copy this account number:", text);
        }
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
        prompt("Copy this account number:", text);
      }
    }
  };

  // Slider Functions
  const showSlide = (index) => {
    setCurrentSlide(index);
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
    }
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % weddingData.sliderImages.length);
    }, 6000);
  };

  const nextSlide = () => {
    showSlide((currentSlide + 1) % weddingData.sliderImages.length);
  };

  const prevSlide = () => {
    showSlide((currentSlide - 1 + weddingData.sliderImages.length) % weddingData.sliderImages.length);
  };

  // Effects
  useEffect(() => {
    // Load Font Awesome
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);

    // Fallback: Hide loader after 3 seconds even if data logic fails
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Hide loader when data is fetched (with a small delay for smoothness)
  useEffect(() => {
    if (dataFetched) {
      const timer = setTimeout(() => {
        setLoading(false);
        window.scrollTo(0, 0); // Ensure it starts at the top
      }, 1500); // 1.5s delay to show off the loader
      return () => clearTimeout(timer);
    }
  }, [dataFetched]);

  // Update document title dynamically
  useEffect(() => {
    if (weddingData.couple.bride.name && weddingData.couple.groom.name) {
      document.title = `${weddingData.couple.groom.name} & ${weddingData.couple.bride.name} | Wedding`;
    } else {
      document.title = "Wedding Invitation";
    }
  }, [weddingData.couple.bride.name, weddingData.couple.groom.name]);

  useEffect(() => {
    // Scroll effect for header
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Dynamic Countdown based on Wedding Date
    // Fallbacks: rawDate (ideal) -> date (formatted) -> ceremony.date (raw typically) -> reception.date
    // We access ceremony/reception dates from the nested objects we created in fetchWeddingData
    let dateStr = weddingData.rawDate || weddingData.date;

    // If main date is missing, try ceremony date
    if (!dateStr || dateStr.trim() === '') {
      if (weddingData.ceremony && weddingData.ceremony.rawDate) {
        dateStr = weddingData.ceremony.rawDate;
      } else if (weddingData.reception && weddingData.reception.rawDate) {
        dateStr = weddingData.reception.rawDate;
      }
    }

    // console.log("Countdown DEBUG: Input dateStr", dateStr); 

    if (!dateStr) {
      // console.log("Countdown DEBUG: No date string");
      return;
    }

    // Parse the date string safely
    const targetDate = new Date(dateStr);

    // Validate date
    if (isNaN(targetDate.getTime())) {
      console.error("Countdown DEBUG: Invalid date format", dateStr);
      return;
    }

    // Set default time to noon if it's just a date (length <= 15 roughly means YYYY-MM-DD or formatted string without time)
    // Note: If falling back to 'date' which is formatted (e.g. 'November 24, 2025'), simple lengths might trigger this too, which is generally good for noon default.
    if (dateStr.length <= 15) {
      targetDate.setHours(12, 0, 0, 0);
    }

    // console.log("Countdown DEBUG: Target Date Object", targetDate.toString());

    const countTo = targetDate.getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = countTo - now;

      if (distance < 0) {
        // If date has passed
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    };

    updateCountdown(); // Run immediately
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [weddingData.date, weddingData.rawDate]);

  useEffect(() => {
    // Slider progress
    const totalSlides = weddingData.sliderImages.length;
    const progressValue = ((currentSlide + 1) / totalSlides) * 100;
    setProgress(progressValue);
  }, [currentSlide]);

  useEffect(() => {
    // Update Meta Tags for Social Sharing
    if (weddingData.coverImage) {
      // Open Graph Image
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', weddingData.coverImage);

      // Twitter Image
      let twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (!twitterImage) {
        twitterImage = document.createElement('meta');
        twitterImage.setAttribute('name', 'twitter:image');
        document.head.appendChild(twitterImage);
      }
      twitterImage.setAttribute('content', weddingData.coverImage);
    }
  }, [weddingData.coverImage]);

  useEffect(() => {
    // Slider auto-play
    // Only start if we have images
    if (!weddingData.sliderImages || weddingData.sliderImages.length === 0) return;

    const startSlider = () => {
      // Clear existing to avoid duplicates
      if (slideInterval.current) clearInterval(slideInterval.current);

      slideInterval.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % weddingData.sliderImages.length);
      }, 6000);
    };

    const stopSlider = () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
    };

    startSlider();

    const sliderElement = document.querySelector('.hero-slider');
    if (sliderElement) {
      sliderElement.addEventListener('mouseenter', stopSlider);
      sliderElement.addEventListener('mouseleave', startSlider);
    }

    return () => {
      stopSlider();
      if (sliderElement) {
        sliderElement.removeEventListener('mouseenter', stopSlider);
        sliderElement.removeEventListener('mouseleave', startSlider);
      }
    };
  }, [weddingData.sliderImages.length]); // Re-run when images are loaded

  useEffect(() => {
    // Intersection Observer for animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Optional: Unobserve after animating once
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    // Observe general fade-in sections
    document.querySelectorAll('.fade-in-section').forEach((el) => {
      observer.observe(el);
    });

    // Observe couple elements
    coupleRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    // Observe member elements
    memberRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    // Observe gallery elements
    galleryRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    // Scroll animations
    const checkVisibility = () => {
      const elements = document.querySelectorAll('.couple, .party-member');
      elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < window.innerHeight - elementVisible) {
          element.classList.add('visible');
        }
      });
    };

    window.addEventListener('scroll', checkVisibility);
    checkVisibility(); // Check immediately in case already in view

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', checkVisibility);
    };
  }, [dataFetched, weddingData]); // Re-run when data is fetched and DOM is present

  const getFormattedHeroDate = () => {
    if (weddingData.rawDate) {
      const d = new Date(weddingData.rawDate);
      if (!isNaN(d.getTime())) {
        const day = d.getDate();
        const month = d.toLocaleDateString('en-US', { month: 'long' });
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
      }
    }
    return weddingData.date;
  };

  // Inline Styles
  const styles = `
    :root {
      --primary-color: #FAFAF9;
      --secondary-color: #E7E5E4;
      --accent-color: #A68A64;
      --text-color: #292524;
      --light-text: #57534E;
      --white: #ffffff;
      --black: #000000;
      --glass-bg: rgba(255, 255, 255, 0.8);
      --glass-border: rgba(255, 255, 255, 0.4);
      --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
      --transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
    }

    body {
      font-family: 'Montserrat', sans-serif;
      color: var(--text-color);
      background-color: var(--primary-color);
      line-height: 1.7;
      overflow-x: hidden;
      width: 100%;
      max-width: 100%;
    }

    h1, h2, h3, h4, h5 {
      font-family: 'Cormorant Garamond', serif;
      font-weight: 400;
      margin-bottom: 1.5rem;
      letter-spacing: 0.5px;
    }

    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      box-sizing: border-box;
    }

    section {
      padding: 80px 0;
      position: relative;
      scroll-margin-top: 110px;
    }

    /* Page Loader */
    .page-loader {
      /* ... existing styles ... */
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--primary-color);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      transition: opacity 0.8s ease-out, visibility 0.8s ease-out;
      overflow: hidden;
    }

    /* General Animation Class */
    .fade-in-section {
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);
      will-change: opacity, transform;
    }

    .fade-in-section.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .loader-content {
      position: relative;
      z-index: 10;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .loader-names {
      font-family: 'Cormorant Garamond', serif;
      font-size: 3rem;
      color: var(--text-color);
      opacity: 0;
      animation: fadeInUp 1.2s ease forwards;
      letter-spacing: 2px;
    }

    .loader-names span {
      display: inline-block;
      color: var(--accent-color);
      margin: 0 10px;
      font-style: italic;
    }

    .loader-bg-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(1.2);
      font-family: 'Cormorant Garamond', serif;
      font-size: 15vw;
      white-space: nowrap;
      color: var(--accent-color);
      opacity: 0.1;
      filter: blur(8px);
      z-index: 1;
      pointer-events: none;
      animation: pulseBlur 3s infinite ease-in-out;
    }

    .spinner-minimal {
      width: 40px;
      height: 2px;
      background: rgba(166, 138, 100, 0.2);
      position: relative;
      overflow: hidden;
      margin-top: 10px;
    }

    .spinner-minimal::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 0%;
      background: var(--accent-color);
      animation: loadingBar 1.5s ease-in-out infinite;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulseBlur {
      0%, 100% { opacity: 0.05; filter: blur(8px); transform: translate(-50%, -50%) scale(1.2); }
      50% { opacity: 0.12; filter: blur(4px); transform: translate(-50%, -50%) scale(1.25); }
    }

    @keyframes loadingBar {
      0% { width: 0%; left: 0; }
      50% { width: 50%; left: 25%; }
      100% { width: 100%; left: 0; }
    }

    /* Header & Navigation */
    header {
      position: fixed;
      width: 100%;
      top: 0;
      left: 0;
      z-index: 1000;
      background-color: var(--white);
      transition: var(--transition);
      padding: 1.2rem 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    header.scrolled {
      padding: 0.8rem 0;
      box-shadow: var(--shadow-sm);
    }

    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 40px;
    }

    .logonobold {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.8rem;
      font-weight: 400;
      color: var(--text-color);
      text-decoration: none;
      letter-spacing: 0.1em;
      transition: var(--transition);
    }

    .nav-links {
      display: flex;
      list-style: none;
      gap: 3rem;
    }

    .nav-links li {
      margin-left: 0;
    }

    .nav-links a {
      text-decoration: none;
      color: var(--text-color);
      font-weight: 500;
      font-size: 0.85rem;
      transition: var(--transition);
      position: relative;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      padding-bottom: 5px;
    }

    .nav-links a:hover {
      color: var(--accent-color);
      opacity: 1;
    }

    .nav-links a::after {
      content: '';
      position: absolute;
      width: 0;
      height: 1px;
      bottom: 0px;
      left: 0;
      background-color: var(--accent-color);
      transition: var(--transition);
    }

    .nav-links a:hover::after {
      width: 100%;
    }

    .mobile-menu-btn {
      display: none;
      background: none;
      border: none;
      outline: none;
      padding: 0;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-color);
    }

    /* Hero Section - Editorial Wedding Layout */
    .hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      min-height: 100vh;
      width: 100%;
      background: #080808;
      padding: 0;
    }

    .hero-slider {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }

    .hero-slide {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0;
      transform: scale(1.1);
      transition: opacity 2s ease-in-out, transform 10s ease-out;
      background-size: cover;
      background-position: center;
    }

    .hero-slide.active {
      opacity: 1;
      transform: scale(1);
    }

    .hero-slide::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        180deg,
        rgba(0,0,0,0.35) 0%,
        rgba(0,0,0,0.15) 40%,
        rgba(0,0,0,0.4) 80%,
        rgba(0,0,0,0.85) 100%
      );
      z-index: 1;
    }

    .hero-content {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 1200px;
      padding: 0 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-top: 40px;
    }

    /* Tagline at the very top */
    .hero-tagline-top {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.75rem;
      letter-spacing: 0.35em;
      text-transform: uppercase;
      color: var(--accent-color);
      font-weight: 500;
      margin-bottom: 2.5rem;
      text-align: center;
      animation: fadeInUp 1s ease-out 0.5s forwards;
      opacity: 0;
    }

    /* Names and Ampersand Layout */
    .hero-names-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      margin-bottom: 1rem;
    }

    .hero-name-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(3rem, 9vw, 5.5rem);
      line-height: 1;
      font-weight: 300;
      color: var(--white);
      text-transform: capitalize;
      opacity: 0;
      animation: heroTitleReveal 2s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards;
      letter-spacing: 0.02em;
    }

    .hero-ampersand-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      margin: 1.5rem 0;
      opacity: 0;
      animation: fadeInUp 1.2s ease-out 0.9s forwards;
    }

    .hero-ampersand-line {
      width: 40px;
      height: 1px;
      background: rgba(255, 255, 255, 0.25);
    }

    .hero-ampersand-text {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.8rem;
      font-style: italic;
      color: rgba(255, 255, 255, 0.5);
      line-height: 1;
    }

    /* Horizontal line under names */
    .hero-details-divider {
      width: 100%;
      max-width: 320px;
      height: 1px;
      background: rgba(255, 255, 255, 0.2);
      margin: 2.5rem auto 2rem;
      opacity: 0;
      animation: fadeIn 1.2s ease-out 1.2s forwards;
    }

    /* Date and Location row */
    .hero-details-row {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-width: 500px;
      margin: 0 auto 3rem;
      opacity: 0;
      animation: fadeInUp 1.2s ease-out 1.4s forwards;
    }

    .hero-details-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 0 15px;
    }

    .hero-details-separator {
      width: 1px;
      height: 40px;
      background: var(--accent-color);
      opacity: 0.6;
    }

    .hero-details-label {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      color: var(--white);
      font-weight: 600;
    }

    .hero-details-value {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.2rem;
      color: var(--white);
      font-weight: 400;
      font-style: italic;
      line-height: 1.2;
      white-space: nowrap;
    }

    /* CTA Button */
    .hero-cta {
      opacity: 0;
      animation: fadeIn 1s ease-out 1.7s forwards;
      margin-top: 1rem;
    }

    .btn-luxury {
      padding: 18px 50px;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.7);
      color: var(--white);
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.35em;
      transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      font-family: 'Montserrat', sans-serif;
      font-weight: 500;
    }

    .btn-luxury:hover {
      background: var(--white);
      color: var(--black);
      border-color: var(--white);
    }

    @keyframes scrollAnim {
      0% { top: -100%; }
      50% { top: 0%; }
      100% { top: 100%; }
    }

    @keyframes heroTitleReveal {
      from { opacity: 0; transform: scale(1.05) translateY(30px); filter: blur(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Slider Progress Overlay */
    .slider-pagination {
      position: absolute;
      right: 60px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      gap: 20px;
      z-index: 10;
    }

    .pagination-item {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      transition: all 0.4s ease;
      position: relative;
    }

    .pagination-item.active {
      background: var(--accent-color);
      transform: scale(2);
    }

    .pagination-item.active::after {
      content: '';
      position: absolute;
      top: -6px;
      left: -6px;
      right: -6px;
      bottom: -6px;
      border: 1px solid var(--accent-color);
      border-radius: 50%;
      animation: pulsePagination 2s infinite;
    }

    @keyframes pulsePagination {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.5); opacity: 0; }
    }

    .hero .slider-dots {
      position: absolute;
      bottom: 50px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      z-index: 10;
    }

    .hero .slider-dot {
      width: 40px;
      height: 2px;
      background: rgba(255, 255, 255, 0.3);
      cursor: pointer;
      transition: all 0.4s ease;
      padding: 0;
      border: none;
      border-radius: 0;
    }

    .hero .slider-dot.active {
      background: var(--white);
      width: 60px;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
    }

    .hero .slider-controls {
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 40px;
      z-index: 5;
      transform: translateY(-50%);
      pointer-events: none;
    }

    .hero .slider-arrow-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: var(--white);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      font-size: 0.8rem;
      pointer-events: auto;
      backdrop-filter: blur(4px);
    }

    .hero .slider-arrow-btn:hover {
      background: var(--white);
      color: var(--black);
      border-color: var(--white);
    }

    .hero .slider-progress {
      position: absolute;
      bottom: 40px;
      right: 40px;
      display: flex;
      align-items: center;
      gap: 15px;
      z-index: 10;
    }

    .hero .progress-text {
      color: var(--white);
      font-size: 0.8rem;
      font-family: 'Montserrat', sans-serif;
      letter-spacing: 0.2em;
      font-weight: 500;
    }

    .hero .progress-line {
      width: 100px;
      height: 1px;
      background: rgba(255, 255, 255, 0.2);
      position: relative;
    }

    .hero .progress-line::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: var(--progress, 0%);
      background: var(--white);
      transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Countdown Section */

    /* Countdown Section */
    .countdown-section {
      background-color: var(--primary-color);
      padding: 80px 0;
      text-align: center;
    }

    .countdown-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 3.5rem;
      margin-bottom: 60px;
      color: var(--text-color);
      font-weight: 300;
      font-style: italic;
    }

    .countdown-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0;
      background: transparent;
      border-radius: 0;
      box-shadow: none;
    }

    .countdown {
      display: flex;
      justify-content: center;
      gap: 60px;
    }

    .countdown-item {
      text-align: center;
      min-width: 140px;
      position: relative;
    }

    .countdown-item:not(:last-child)::after {
      content: ':';
      position: absolute;
      right: -30px;
      top: 10px;
      font-family: 'Cormorant Garamond', serif;
      font-size: 3rem;
      color: var(--accent-color);
      opacity: 0.5;
    }

    .countdown-number {
      font-family: 'Cormorant Garamond', serif;
      font-size: 5rem;
      font-weight: 300;
      display: block;
      line-height: 1;
      margin-bottom: 15px;
      color: var(--text-color);
    }

    .countdown-label {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.25em;
      font-weight: 500;
      color: var(--light-text);
    }

    /* About Section */
    .about {
      background-color: var(--white);
      position: relative;
    }

    .section-title {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      width: 100%;
      margin-bottom: 80px;
      position: relative;
      z-index: 2;
      border-bottom: none !important;
    }

    .section-title::after {
      content: none !important;
      display: none !important;
    }

    .section-title h2 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 3.5rem;
      color: var(--text-color);
      display: block;
      width: 100%;
      text-align: center !important;
      font-weight: 300;
      margin-bottom: 0.5rem;
      line-height: 1.1;
      font-style: italic;
    }

    .section-title h2::after {
      content: none !important;
      display: none !important;
      width: 0 !important;
      height: 0 !important;
      background: none !important;
    }

    .section-title p {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.9rem;
      color: var(--accent-color);
      text-transform: uppercase;
      letter-spacing: 0.2rem;
      font-weight: 500;
      text-align: center !important;
      display: block;
      width: 100%;
    }

    .couple-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      max-width: 900px;
      margin: 0 auto;
      gap: 60px;
      margin-top: 60px;
    }

    .couple {
      text-align: center;
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.8s ease;
    }

    .couple.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .couple-img-container {
      position: relative;
      width: 320px;
      height: 400px;
      margin: 0 auto 30px;
      overflow: hidden;
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
      border-radius: 2px;
    }

    .couple-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: var(--transition);
    }

    .couple-img-border {
      position: absolute;
      inset: 15px;
      border: 1px solid rgba(255, 255, 255, 0.4);
      pointer-events: none;
      z-index: 2;
      border-radius: 1px;
    }

    .couple:hover .couple-img {
      transform: scale(1.05);
    }

    .couple h3 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2rem;
      margin-bottom: 10px;
      font-weight: 400;
      color: var(--text-color);
    }

    .couple p {
      font-family: 'Montserrat', sans-serif;
      color: var(--light-text);
      font-size: 0.9rem;
      line-height: 1.8;
      max-width: 300px;
      margin: 0 auto;
    }

    /* Story Section */
    .story-content {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }

    .story-text {
      font-size: 1.1rem;
      margin-bottom: 40px;
      color: var(--light-text);
    }

    .story-highlight {
      display: inline-block;
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.8rem;
      font-style: italic;
      color: var(--accent-color);
      margin: 40px 0;
      padding: 0 20px;
      position: relative;
    }

    .story-highlight::before,
    .story-highlight::after {
      content: '"';
      font-size: 3rem;
      color: var(--secondary-color);
      position: absolute;
      top: -10px;
    }

    .story-highlight::before {
      left: -10px;
    }

    .story-highlight::after {
      right: 0;
    }

    /* Wedding Party Section */
    .party {
      background-color: var(--primary-color);
      padding: 120px 0;
    }

    .party-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 80px;
      margin-top: 60px;
      max-width: 1200px;
      margin-left: auto;
      margin-right: auto;
    }

    .party-group {
      width: 100%;
    }

    .party-title {
      text-align: center;
      margin-bottom: 50px;
    }

    .party-title h3 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2.5rem;
      color: var(--text-color);
      display: inline-block;
      font-weight: 300;
      font-style: italic;
    }

    .party-members {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 50px;
    }

    .party-member {
      text-align: center;
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.8s ease;
    }

    .party-member.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .member-img-container {
      position: relative;
      width: 100%;
      aspect-ratio: 3/4;
      overflow: hidden;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
      border-radius: 2px;
      margin-bottom: 20px;
    }

    .member-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: var(--transition);
    }

    .member-img-border {
      position: absolute;
      inset: 12px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      pointer-events: none;
      z-index: 2;
      border-radius: 1px;
    }

    .party-member:hover .member-img {
      transform: scale(1.05);
    }

    .member-details-card {
      text-align: left;
      padding: 0 5px;
    }

    .member-info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .member-meta-left {
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: left;
    }

    .member-meta-left h4 {
      margin: 0 !important;
      font-size: 1.3rem !important;
      font-weight: 500;
      color: var(--text-color);
      line-height: 1.2;
    }

    .member-meta-left .member-role {
      margin: 0 !important;
      font-size: 0.75rem !important;
      color: var(--accent-color);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 600;
      display: block;
    }

    .member-icon-right {
      font-size: 1.2rem;
      color: var(--accent-color);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition);
    }

    .party-member:hover .member-icon-right {
      transform: scale(1.15);
    }

    .party-member p {
      color: var(--light-text);
      font-size: 0.85rem;
      margin-top: 8px;
      margin-bottom: 12px;
      line-height: 1.6;
      font-family: 'Montserrat', sans-serif;
      text-align: left;
    }

    .member-social {
      display: flex;
      justify-content: flex-start;
      gap: 15px;
      opacity: 0;
      transition: var(--transition);
    }

    .party-member:hover .member-social {
      opacity: 1;
    }

    .member-social a {
      color: var(--text-color);
      font-size: 0.9rem;
      transition: var(--transition);
    }

    .member-social a:hover {
      color: var(--accent-color);
    }

    /* Wedding Details Section */
    .wedding-details {
      padding: 120px 0;
      background: linear-gradient(135deg, var(--white) 0%, #fafaf9 100%);
    }

    .wedding-details .subtitle {
      font-family: 'Montserrat', sans-serif;
      color: var(--accent-color);
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.3rem; /* Increased letter spacing */
      display: block;
      width: 100%;
      text-align: center !important;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 35px;
      max-width: 1000px;
      margin: 40px auto 0;
      padding: 0 20px;
    }

    .details-card {
      background: var(--white);
      border: 1px solid rgba(166, 138, 100, 0.2);
      padding: 40px 30px;
      border-radius: 8px;
      position: relative;
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
    }

    .details-card::after {
      content: '';
      position: absolute;
      inset: 12px;
      border: 1px solid rgba(166, 138, 100, 0.1);
      border-radius: 6px;
      pointer-events: none;
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .details-card:hover {
      transform: translateY(-8px);
      border-color: var(--accent-color);
      box-shadow: 0 16px 35px rgba(166, 138, 100, 0.12);
    }

    .details-card:hover::after {
      inset: 8px;
      border-color: rgba(166, 138, 100, 0.3);
    }

    .details-card-icon {
      font-size: 2rem;
      color: var(--accent-color);
      margin-bottom: 20px;
      transition: transform 0.5s ease;
    }

    .details-card:hover .details-card-icon {
      transform: scale(1.1) rotate(5deg);
    }

    .details-card h3 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.8rem;
      font-weight: 500;
      color: var(--text-color);
      margin-bottom: 15px;
      letter-spacing: 0.5px;
    }

    .details-card-divider {
      width: 50px;
      height: 1px;
      background: var(--accent-color);
      margin: 15px 0;
      opacity: 0.4;
    }

    .details-card-date {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.8rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--accent-color);
      font-weight: 600;
      margin-bottom: 8px;
    }

    .details-card-time {
      font-family: 'Cormorant Garamond', serif;
      font-style: italic;
      font-size: 1.1rem;
      color: var(--light-text);
      margin-bottom: 15px;
    }

    .details-card-venue {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.2rem;
      color: var(--text-color);
      line-height: 1.4;
      font-weight: 500;
    }

    .details-card-address {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.75rem;
      color: var(--light-text);
      margin-top: 5px;
      letter-spacing: 0.05em;
    }

    /* Gifts Section */
    .btn-luxury-sm {
      padding: 10px 24px;
      background: transparent;
      border: 1px solid rgba(166, 138, 100, 0.4);
      color: var(--accent-color);
      text-transform: uppercase;
      font-size: 0.65rem;
      letter-spacing: 0.2em;
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      transition: all 0.4s ease;
      cursor: pointer;
      margin-top: 15px;
      border-radius: 4px;
      display: inline-block;
      outline: none;
    }

    .btn-luxury-sm:hover {
      background: var(--accent-color);
      color: var(--white);
      border-color: var(--accent-color);
      box-shadow: 0 4px 12px rgba(166, 138, 100, 0.25);
    }

    .details-card-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-color);
      text-decoration: none;
      font-size: 0.8rem;
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      margin-top: 15px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      transition: color 0.3s ease;
    }

    .details-card-link i {
      margin-left: 6px;
      font-size: 0.75rem;
    }

    .details-card-link:hover {
      color: #b38b5d;
    }

    /* Location Map Section */
    .location-map-section {
      position: relative;
      padding: 0;
      margin: 0;
      width: 100%;
      background: var(--white);
    }

    .map-container {
      position: relative;
      width: 100%;
      height: 500px;
    }

    .map-container iframe {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
    }

    .map-overlay {
      position: absolute;
      bottom: 40px;
      right: 40px;
      background: transparent;
      padding: 0;
      border-radius: 0;
      max-width: 100%;
      box-shadow: none;
      z-index: 10;
      text-align: center;
    }

    .directions-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--accent-color) 0%, #b38b5d 100%);
      color: white;
      padding: 0;
      border-radius: 50%;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
      width: 70px;
      height: 70px;
      font-size: 2rem;
      border: 3px solid rgba(255, 255, 255, 0.9);
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    .directions-btn i {
      margin-right: 0;
    }

    .directions-btn:hover {
      background: linear-gradient(135deg, #b38b5d 0%, var(--accent-color) 100%);
      transform: scale(1.15);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
      border-color: var(--white);
    }

    .directions-btn:active {
      transform: scale(0.95);
    }

    /* RSVP Section */
    .rsvp {
      background: var(--primary-color);
      padding: 80px 0;
      color: var(--text-color);
      position: relative;
    }

    .rsvp::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at center, rgba(166, 138, 100, 0.04) 0%, transparent 85%),
                  radial-gradient(circle at 10% 20%, rgba(0, 0, 0, 0.01) 0%, transparent 40%);
      pointer-events: none;
    }

    .rsvp .section-title h2 {
      color: var(--text-color);
    }

    .rsvp .section-title p {
      color: var(--light-text);
      letter-spacing: 0.1em;
    }

    .rsvp-form {
      max-width: 550px;
      margin: 0 auto;
      background: var(--white);
      padding: 55px 45px;
      border: 1px solid rgba(166, 138, 100, 0.15);
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      backdrop-filter: blur(12px);
      border-radius: 8px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
    }

    .rsvp-form::after {
      content: '';
      position: absolute;
      inset: 12px;
      border: 1px solid rgba(166, 138, 100, 0.2);
      border-radius: 4px;
      pointer-events: none;
    }

    .form-group {
      width: 100%;
      margin-bottom: 28px;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: var(--accent-color);
      font-size: 0.65rem;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      transition: color 0.3s ease;
    }

    .form-group:focus-within label {
      color: var(--text-color);
    }

    .form-control {
      background: transparent;
      border: none;
      border-bottom: 1px solid rgba(0, 0, 0, 0.15);
      padding: 12px 5px;
      font-size: 1rem;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      width: 100%;
      border-radius: 0;
      color: var(--text-color) !important;
      font-family: 'Cormorant Garamond', serif;
      letter-spacing: 0.02em;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: none;
      background: rgba(0, 0, 0, 0.01);
    }

    .form-control::placeholder {
      color: rgba(0, 0, 0, 0.4) !important;
      font-style: italic;
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.05rem;
    }

    select.form-control {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23A68A64' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: calc(100% - 10px) center;
      padding-right: 30px;
    }

    select.form-control option {
      background-color: #ffffff;
      color: var(--text-color) !important;
      padding: 15px;
      font-family: 'Cormorant Garamond', serif;
    }

    .rsvp-form .btn-submit {
      background: var(--text-color);
      border: 1px solid var(--text-color);
      color: var(--white) !important;
      padding: 16px 45px;
      letter-spacing: 0.3em;
      font-size: 0.75rem;
      margin-top: 15px;
      width: auto;
      min-width: 220px;
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      border-radius: 4px;
      text-transform: uppercase;
      font-family: 'Montserrat', sans-serif;
      font-weight: 500;
      outline: none;
    }

    .rsvp-form .btn-submit:hover {
      background: var(--accent-color);
      color: var(--white) !important;
      border-color: var(--accent-color);
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(166, 138, 100, 0.25);
    }

    .rsvp-form .btn-submit:active {
      transform: translateY(-1px);
    }

    /* Gallery Section */
    .gallery {
      background-color: var(--primary-color);
      padding-bottom: 100px;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 0;
      margin-top: 60px;
      max-width: 1400px;
      margin-left: auto;
      margin-right: auto;
    }

    .gallery-item {
      height: 350px;
      overflow: hidden;
      position: relative;
      cursor: pointer;
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }

    .gallery-item.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: var(--transition);
    }

    .gallery-item:hover img {
      transform: scale(1.1);
    }

    .gallery-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.2);
      transition: var(--transition);
      opacity: 1;
    }

    .gallery-item:hover .gallery-overlay {
      background: rgba(0, 0, 0, 0);
    }

    /* Footer */
    footer.elegant-footer::before {
      content: none !important;
      display: none !important;
      background: none !important;
    }

    .elegant-footer {
      background-color: var(--primary-color); 
      color: var(--text-color);
      position: relative;
      padding: 40px 0 20px 0;
      display: flex;
      align-items: center;
      min-height: 100px;
      overflow: hidden;
    }

    .footer-bottom {
      width: 100%;
      text-align: center;
      padding: 20px 0;
    }

    .copyright {
      font-size: 1rem;
      color: var(--text-color);
      margin: 0;
      padding: 10px 0;
      line-height: 1.5;
    }

    .footer-love {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      color: var(--text-color);
    }

    .heart-emoji {
      color: #ff6b6b;
      animation: pulse 1.5s infinite;
      display: inline-block;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    /* Responsive Design */
    @media (max-width: 992px) {
      .slide-content h1 {
        font-size: 4rem;
      }

      .section-title h2 {
        font-size: 3rem;
      }

      .countdown-number {
        font-size: 2.5rem;
      }

      .countdown-item {
        min-width: 80px;
      }

      .couple-container {
        grid-template-columns: 1fr;
        gap: 50px;
      }



      .map-overlay {
        bottom: 20px;
        right: 20px;
      }

      .directions-btn {
        width: 60px;
        height: 60px;
        font-size: 1.5rem;
      }
    }

    @media (max-width: 768px) {
      /* Mobile Header Adjustments - FINAL FIX */
      header {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        z-index: 9999 !important;
        background-color: var(--white) !important;
        padding: 0 !important;
        height: 70px !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05) !important;
        display: flex !important;
        align-items: center !important;
      }

      header .container {
        width: 100% !important;
        padding: 0 20px !important;
        height: 100% !important;
        display: flex !important;
        align-items: center !important;
      }

      .navbar {
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        align-items: center !important;
        width: 100% !important;
        height: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        position: static !important;
      }

      .logonobold, #couple-initials {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        font-family: 'Cormorant Garamond', serif !important;
        font-size: 1.8rem !important;
        color: var(--black) !important;
        z-index: 10001 !important;
        position: relative !important;
        text-decoration: none !important;
        white-space: nowrap !important;
        margin: 0 !important;
      }

      .mobile-menu-btn {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        font-size: 1.5rem !important;
        color: var(--black) !important;
        z-index: 10001 !important;
        cursor: pointer !important;
        position: relative !important;
        margin: 0 !important;
        background: none !important;
        border: none !important;
        outline: none !important;
        padding: 0 !important;
      }

      .nav-links {
        display: flex;
        position: fixed;
        top: 0;
        right: -100%;
        width: 80%;
        max-width: 320px;
        height: 100vh;
        background-color: var(--white);
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 2rem;
        padding: 2rem 1.5rem;
        box-shadow: -10px 0 30px rgba(0, 0, 0, 0.12);
        text-align: center;
        transition: right 0.35s ease, opacity 0.35s ease;
        opacity: 0;
        z-index: 10000;
      }

      .nav-links.active {
        right: 0;
        opacity: 1;
      }

      .nav-links li {
        margin: 0;
        width: 100%;
      }

      .mobile-menu-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background: rgba(0, 0, 0, 0.35);
        opacity: 0;
        transition: opacity 0.35s ease;
        z-index: 9999;
      }

      .mobile-menu-overlay.active {
        display: block;
        opacity: 1;
      }

      .section-title h2 {
        font-size: 2.5rem;
      }

      .couple-container {
        grid-template-columns: 1fr;
        gap: 50px;
      }

      .rsvp-form {
        padding: 30px;
      }

      .countdown {
        gap: 10px;
      }

      .countdown-number {
        font-size: 2rem;
      }

      .countdown-item {
        min-width: 70px;
      }

      .party-container {
        gap: 40px;
      }

      .party-group {
        min-width: 100%;
      }

      .hero {
        padding: 0;
      }

      .hero-content {
        padding: 40px 20px;
        width: 100%;
      }

      .hero-title {
        font-size: 3rem !important;
        line-height: 0.9 !important;
      }

      .hero-title span {
        margin: 5px 0;
      }

      .hero-tagline {
        letter-spacing: 0.4em !important;
        font-size: 0.65rem !important;
      }

      .hero-tagline::before,
      .hero-tagline::after {
        width: 15px;
      }

      .hero-meta {
        padding-top: 2rem;
        gap: 1.2rem;
      }

      .hero-location {
        font-size: 2rem !important;
      }

      .hero .slider-dots {
        bottom: 30px;
      }

      .hero .slider-controls {
        display: none;
      }

      .hero .slider-progress {
        display: none;
      }

      .wedding-details {
        padding: 60px 0;
      }

      .details-container {
        padding: 0 15px;
      }

      .info-cards {
        grid-template-columns: 1fr;
        max-width: 500px;
        margin: 40px auto 0;
        padding: 0;
        gap: 20px;
      }

      .event-card {
        flex-direction: column;
      }

      .details-grid {
        grid-template-columns: 1fr !important;
        gap: 25px !important;
        padding: 0 15px !important;
      }

      .details-card {
        padding: 35px 25px !important;
      }

      .map-container {
        height: 400px;
      }

      section {
        padding: 60px 0 !important;
      }

      .countdown-section {
        padding: 60px 0 !important;
      }

      /* Hero Mobile Adjustments */
      .hero-content {
        padding: 0 15px !important;
        margin-top: 20px !important;
      }

      .hero-tagline-top {
        font-size: 0.65rem !important;
        letter-spacing: 0.25em !important;
        margin-bottom: 1.5rem !important;
      }

      .hero-name-title {
        font-size: 3.5rem !important;
        line-height: 1 !important;
      }

      .hero-ampersand-divider {
        margin: 1rem 0 !important;
      }

      .hero-ampersand-text {
        font-size: 1.5rem !important;
      }

      .hero-ampersand-line {
        width: 30px !important;
      }

      .hero-details-divider {
        margin: 2rem auto 1.5rem !important;
        max-width: 280px !important;
      }

      .hero-details-row {
        margin-bottom: 2rem !important;
        max-width: 320px !important;
      }

      .hero-details-col {
        padding: 0 10px !important;
        gap: 4px !important;
      }

      .hero-details-label {
        font-size: 0.55rem !important;
        letter-spacing: 0.2em !important;
      }

      .hero-details-value {
        font-size: 1rem !important;
      }

      .hero-details-separator {
        height: 30px !important;
      }

      .btn-luxury {
        padding: 14px 40px !important;
        font-size: 0.65rem !important;
        letter-spacing: 0.25em !important;
        width: 100% !important;
        max-width: 280px !important;
      }

      .hero .slider-dots {
        display: none !important;
      }
    }

    @media (max-width: 576px) {
      .couple-img-container {
        width: 240px;
        height: 300px;
        margin-bottom: 20px;
      }

      .couple-img {
        width: 100%;
        height: 100%;
        border-radius: 0;
      }

      .countdown {
        flex-wrap: wrap;
      }

      .countdown-item {
        min-width: 60px;
      }

      .countdown-number {
        font-size: 1.8rem;
      }

      .countdown-label {
        font-size: 0.8rem;
      }

      .member-img-container {
        aspect-ratio: 3/4;
        margin-bottom: 15px;
      }

      .member-img {
        width: 100%;
        height: 100%;
        max-width: none;
        border-radius: 0;
        aspect-ratio: auto;
      }

      .party-members {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 30px;
      }


    }
  `;

  return (
    <>
      <FontAwesomeCSS />
      <GoogleFontsCSS />
      <style>{styles}</style>

      {loading && (
        <div className="page-loader" id="pageLoader">
          <div className="loader-bg-text">
            {weddingData.couple.bride.name?.split(' ')[0] || "Wedding"} & {weddingData.couple.groom.name?.split(' ')[0] || "Loading"}
          </div>
          <div className="loader-content">
            <div className="loader-names">
              {weddingData.couple.bride.name?.split(' ')[0] || ""} <span> & </span> {weddingData.couple.groom.name?.split(' ')[0] || ""}
            </div>
            <div className="spinner-minimal"></div>
          </div>
        </div>
      )}

      {/* Header */}
      <header id="header" className={scrolled ? 'scrolled' : ''}>
        <div className="container">
          <nav className="navbar">
            <a href="#" className="logonobold" id="couple-initials" onClick={(e) => e.preventDefault()}>
              {weddingData.couple.groom.name?.charAt(0)} & {weddingData.couple.bride.name?.charAt(0)}
            </a>
            <button className="mobile-menu-btn" aria-label="Toggle navigation menu" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <i className={isMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
            </button>
            <div className={`flex flex-col lg:flex-row gap-8 lg:gap-10 items-center fixed lg:relative top-0 ${isMenuOpen ? 'right-0' : '-right-full'} lg:right-0 w-[80%] lg:w-auto h-screen lg:h-auto bg-white lg:bg-transparent shadow-2xl lg:shadow-none justify-center lg:justify-end transition-all duration-500 z-[1000] lg:z-auto`}>
              <a href="#home" className="uppercase text-sm tracking-widest font-medium hover:text-black transition-colors" onClick={() => setIsMenuOpen(false)}>Home</a>
              <a href="#about" className="uppercase text-sm tracking-widest font-medium hover:text-black transition-colors" onClick={() => setIsMenuOpen(false)}>Our Story</a>
              <a href="#party" className="uppercase text-sm tracking-widest font-medium hover:text-black transition-colors" onClick={() => setIsMenuOpen(false)}>Wedding Party</a>
              <a href="#details" className="uppercase text-sm tracking-widest font-medium hover:text-black transition-colors" onClick={() => setIsMenuOpen(false)}>Details</a>
              <a href="#location-map" className="uppercase text-sm tracking-widest font-medium hover:text-black transition-colors" onClick={() => setIsMenuOpen(false)}>Location</a>
              <a href="#rsvp" className="bg-black text-white px-8 py-3 rounded-sm uppercase text-xs tracking-widest font-medium hover:bg-opacity-90 transition-all" onClick={() => setIsMenuOpen(false)}>RSVP</a>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Slider */}
      <section className="hero" id="home">
        <div className="hero-slider">
          {weddingData.sliderImages && weddingData.sliderImages.length > 0 ? (
            weddingData.sliderImages.map((image, index) => (
              <div
                key={index}
                className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url('${image}')` }}
              ></div>
            ))
          ) : (
            <div className="hero-slide active" style={{ backgroundColor: '#1a1a1a' }}></div>
          )}
        </div>

        <div className="hero-content">
          <div className="hero-tagline-top">
            {(weddingData.tagline || "WE ARE GETTING MARRIED").toUpperCase()}
          </div>

          <div className="hero-names-container">
            <h1 className="hero-name-title">
              {weddingData.couple.groom.name?.split(' ')[0]}
            </h1>
            <div className="hero-ampersand-divider">
              <span className="hero-ampersand-line"></span>
              <span className="hero-ampersand-text">&</span>
              <span className="hero-ampersand-line"></span>
            </div>
            <h1 className="hero-name-title">
              {weddingData.couple.bride.name?.split(' ')[0]}
            </h1>
          </div>

          <div className="hero-details-divider"></div>

          <div className="hero-details-row">
            <div className="hero-details-col">
              <span className="hero-details-label">DATE</span>
              <span className="hero-details-value">{getFormattedHeroDate()}</span>
            </div>
            <div className="hero-details-separator"></div>
            <div className="hero-details-col">
              <span className="hero-details-label">LOCATION</span>
              <span className="hero-details-value">
                {weddingData.venue?.name || weddingData.location?.split(',')[0] || 'TBA'}
              </span>
            </div>
          </div>

          <div className="hero-cta">
            <a href="#about" className="btn-luxury">
              OUR JOURNEY
            </a>
          </div>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="countdown-section fade-in-section">
        <div className="container">
          <h2 className="countdown-title">Counting Down to Our Special Day</h2>
          <div className="countdown-container">
            <div className="countdown">
              <div className="countdown-item">
                <span className="countdown-number">{timeLeft.days.toString().padStart(2, '0')}</span>
                <span className="countdown-label">Days</span>
              </div>
              <div className="countdown-item">
                <span className="countdown-number">{timeLeft.hours.toString().padStart(2, '0')}</span>
                <span className="countdown-label">Hours</span>
              </div>
              <div className="countdown-item">
                <span className="countdown-number">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                <span className="countdown-label">Minutes</span>
              </div>
              <div className="countdown-item">
                <span className="countdown-number">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                <span className="countdown-label">Seconds</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about fade-in-section" id="about">
        <div className="container">
          <div className="section-title">
            <h2>Our Story</h2>
          </div>
          <div className="couple-container">
            <div
              className="couple"
              id="bride"
              ref={el => coupleRefs.current[0] = el}
            >
              {weddingData.couple.bride.image && (
                <div className="couple-img-container">
                  <img src={weddingData.couple.bride.image} alt="Bride" className="couple-img bride-image" />
                  <div className="couple-img-border"></div>
                </div>
              )}
              <h3 className="bride-name">{weddingData.couple.bride.name}</h3>
              <p className="bride-description">{weddingData.couple.bride.description}</p>
            </div>
            <div
              className="couple"
              id="groom"
              ref={el => coupleRefs.current[1] = el}
            >
              {weddingData.couple.groom.image && (
                <div className="couple-img-container">
                  <img src={weddingData.couple.groom.image} alt="Groom" className="couple-img groom-image" />
                  <div className="couple-img-border"></div>
                </div>
              )}
              <h3 className="groom-name">{weddingData.couple.groom.name}</h3>
              <p className="groom-description">{weddingData.couple.groom.description}</p>
            </div>
          </div>
          <div className="story-content">
            <p className="story-text" id="story-part1">{weddingData.story.part1}</p>
            <p className="story-highlight" id="story-highlight">{weddingData.story.highlight}</p>
            <p className="story-text" id="story-part2">{weddingData.story.part2}</p>
          </div>
        </div>
      </section>

      {/* Wedding Party Section */}
      {/* Wedding Party Section */}
      {((weddingData.bridesmaids?.filter(m => m.name && m.name.trim() !== "").length > 0) || (weddingData.groomsmen?.filter(m => m.name && m.name.trim() !== "").length > 0)) && (
        <section className="party fade-in-section" id="party">
          <div className="container">
            <div className="party-container">
              {weddingData.bridesmaids?.filter(m => m.name && m.name.trim() !== "").length > 0 && (
                <div className="party-group">
                  <div className="party-title">
                    <h3>Bridesmaids</h3>
                  </div>
                  <div className="party-members">
                    {weddingData.bridesmaids.filter(m => m.name && m.name.trim() !== "").map((member, index) => (
                      <div
                        key={index}
                        className="party-member"
                        ref={el => memberRefs.current[index] = el}
                      >
                        <div className="member-img-container">
                          <img
                            src={member.photo || member.image || 'https://via.placeholder.com/150'}
                            alt={member.name}
                            className="member-img"
                          />
                          <div className="member-img-border"></div>
                        </div>
                        <div className="member-details-card">
                          <div className="member-info-row">
                            <div className="member-meta-left">
                              <h4>{member.name}</h4>
                              <div className="member-role">{member.role}</div>
                            </div>
                            <div className="member-icon-right">
                              <i className="fas fa-heart"></i>
                            </div>
                          </div>
                          {member.description && <p>{member.description}</p>}
                          {member.instagram && (
                            <div className="member-social">
                              <a href={member.instagram} target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-instagram"></i>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {weddingData.groomsmen?.filter(m => m.name && m.name.trim() !== "").length > 0 && (
                <div className="party-group">
                  <div className="party-title">
                    <h3>Groomsmen</h3>
                  </div>
                  <div className="party-members">
                    {weddingData.groomsmen.filter(m => m.name && m.name.trim() !== "").map((member, index) => (
                      <div
                        key={index}
                        className="party-member"
                        ref={el => memberRefs.current[weddingData.bridesmaids.length + index] = el}
                      >
                        <div className="member-img-container">
                          <img
                            src={member.photo || member.image || 'https://via.placeholder.com/150'}
                            alt={member.name}
                            className="member-img"
                          />
                          <div className="member-img-border"></div>
                        </div>
                        <div className="member-details-card">
                          <div className="member-info-row">
                            <div className="member-meta-left">
                              <h4>{member.name}</h4>
                              <div className="member-role">{member.role}</div>
                            </div>
                            <div className="member-icon-right">
                              <i className="fas fa-crown"></i>
                            </div>
                          </div>
                          {member.description && <p>{member.description}</p>}
                          {member.instagram && (
                            <div className="member-social">
                              <a href={member.instagram} target="_blank" rel="noopener noreferrer">
                                <i className="fab fa-instagram"></i>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Wedding Details Section */}
      {/* Wedding Details Section - Conditionally Rendered */}
      {(weddingData.ceremony.date || weddingData.reception.date) && (
        <section className="wedding-details fade-in-section" id="details">
          <div className="container">
            <div className="section-title">
              <span className="subtitle">The Celebration</span>
              <h2>Wedding Details</h2>
            </div>

            <div className="details-grid" id="wedding-details-grid">
              {weddingData.ceremony.date && (
                <div className="details-card" id="ceremony-item">
                  <div className="details-card-icon">
                    <i className="fas fa-church"></i>
                  </div>
                  <h3>Marriage Blessings</h3>
                  <span className="details-card-date">{formatDate(weddingData.ceremony.date)}</span>
                  <span className="details-card-time">{weddingData.ceremony.time}</span>
                  <div className="details-card-divider"></div>
                  <div className="details-card-venue">{weddingData.ceremony.venue}</div>
                </div>
              )}

              {weddingData.reception.date && (
                <div className="details-card" id="reception-item">
                  <div className="details-card-icon">
                    <i className="fas fa-glass-cheers"></i>
                  </div>
                  <h3>The Reception</h3>
                  <span className="details-card-date">{formatDate(weddingData.reception.date)}</span>
                  <span className="details-card-time">{weddingData.reception.time}</span>
                  <div className="details-card-divider"></div>
                  <div className="details-card-venue">{weddingData.reception.venue}</div>
                  {weddingData.reception.address && (
                    <p className="details-card-address">{weddingData.reception.address}</p>
                  )}
                </div>
              )}

              <div className="details-card" id="dress-code-item">
                <div className="details-card-icon">
                  <i className="fas fa-user-tie"></i>
                </div>
                <h3>Dress Code</h3>
                <span className="details-card-date">Attire</span>
                <span className="details-card-time">Guidelines</span>
                <div className="details-card-divider"></div>
                <div className="details-card-venue" id="dress-code-text">
                  {weddingData.dressCode || "Formal / Black Tie Optional"}
                </div>
                {weddingData.dressCodeDescription && (
                  <p className="details-card-address">{weddingData.dressCodeDescription}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Other Events Section */}
      {weddingData.otherEvents && weddingData.otherEvents.length > 0 && (
        <section className="wedding-details fade-in-section" id="other-events">
          <div className="container">
            <div className="section-title">
              <span className="subtitle">The Celebration</span>
              <h2>Event Details</h2>
            </div>
            <div className="details-grid">
              {weddingData.otherEvents.map((event, index) => (
                <div className="details-card" key={index}>
                  <div className="details-card-icon">
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <h3>{event.name}</h3>
                  <span className="details-card-date">{formatDate(event.date)}</span>
                  <span className="details-card-time">{formatTime(event.time)}</span>
                  <div className="details-card-divider"></div>
                  <div className="details-card-venue">{event.venue}</div>
                  {event.address && (
                    <p className="details-card-address"><strong>Address:</strong> {event.address}</p>
                  )}
                  {event.dress_code && (
                    <p className="details-card-address"><strong>Dress Code:</strong> {event.dress_code}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gifts Section */}
      {weddingData.gifts?.length > 0 && (
        <section className="wedding-details fade-in-section" id="gifts-section" style={{ padding: "60px 0", background: "linear-gradient(135deg, #fafaf9 0%, #ffffff 100%)" }}>
          <div className="container">
            <div className="section-title">
              <h2>Gifts & Contributions</h2>
              <p>We are grateful for your love — if you'd like to contribute.</p>
            </div>

            <div id="gifts-list" className="details-grid" aria-live="polite">
              {weddingData.gifts.map((gift, index) => (
                <div key={index} className="details-card">
                  <div className="details-card-icon">
                    <i className="fas fa-gift"></i>
                  </div>
                  <h3>{gift.provider} {gift.giftType ? `(${gift.giftType})` : ''}</h3>
                  {gift.accountName && (
                    <span className="details-card-date" style={{ color: 'var(--text-color)', fontWeight: 600 }}>
                      {gift.accountName}
                    </span>
                  )}
                  {gift.accountNumber && (
                    <span className="details-card-time" style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.05em', fontSize: '0.95rem', fontWeight: 500, margin: '5px 0 10px' }}>
                      {gift.accountNumber}
                    </span>
                  )}
                  <div className="details-card-divider"></div>
                  {gift.instructions && (
                    <div className="details-card-venue" style={{ fontSize: '0.95rem', color: 'var(--light-text)', fontStyle: 'italic' }}>
                      {gift.instructions}
                    </div>
                  )}
                  {gift.url && (
                    <a href={gift.url} target="_blank" rel="noopener noreferrer" className="details-card-link">
                      Open payment link <i className="fas fa-external-link-alt"></i>
                    </a>
                  )}
                  {gift.accountNumber && (
                    <button
                      className="btn-luxury-sm"
                      onClick={() => handleCopyAccount(gift.accountNumber)}
                    >
                      Copy Account
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Location Map Section */}
      <section className="location-map-section" id="location-map">
        <div className="map-container">
          <iframe
            id="location-map-iframe"
            src={weddingData.mapLocation}
            width="100%"
            height="500"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            title="Wedding Location"
          ></iframe>

        </div>
      </section>

      {/* Gallery Section */}
      {weddingData.galleryImages?.length > 0 && (
        <section className="gallery fade-in-section" id="gallery">
          <div className="container">
            <div className="section-title">
              <h2>Moments</h2>
              <p>Photo Gallery</p>
            </div>
            <div className="gallery-grid">
              {weddingData.galleryImages.map((image, index) => (
                <div
                  key={index}
                  className="gallery-item"
                  ref={el => galleryRefs.current[index] = el}
                  onClick={() => openLightbox(index)}
                >
                  <img src={image} alt={`Gallery ${index + 1}`} />
                  <div className="gallery-overlay"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RSVP Section */}
      <section className="rsvp fade-in-section" id="rsvp">
        <div className="container">
          <div className="section-title">
            <h2>RSVP</h2>
            <p>Kindly respond by {weddingData.rsvpDeadline ? formatDate(weddingData.rsvpDeadline) : "the date specified"}</p>
          </div>
          {isRSVPClosed ? (
            <div className="rsvp-closed-message" style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'var(--white)',
              border: '1px solid rgba(166, 138, 100, 0.2)',
              borderRadius: '8px',
              marginTop: '20px',
              position: 'relative',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)',
              color: 'var(--text-color)'
            }}>
              <i className="fas fa-calendar-times" style={{ fontSize: '3rem', color: 'var(--accent-color)', marginBottom: '20px', display: 'block' }}></i>
              <h3 style={{ marginBottom: '10px' }}>RSVP has Closed</h3>
              <p>The deadline to RSVP for this wedding has passed ({weddingData.rsvpDeadline ? formatDate(weddingData.rsvpDeadline) : ""}). We look forward to celebrating with you!</p>
            </div>
          ) : (
            <form className="rsvp-form" onSubmit={handleRSVPSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-control"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-control"
                  placeholder="Your Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  placeholder="Your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="guests">Number of Guests</label>
                <select
                  id="guests"
                  name="guests"
                  className="form-control"
                  value={formData.guests}
                  onChange={handleChange}
                  required
                  style={{ color: formData.guests ? 'var(--text-color)' : 'rgba(0,0,0,0.4)' }}
                >
                  <option value="" style={{ color: '#1a1a1a' }} disabled>Select number of guests</option>
                  {weddingData.allowedGuests.map((opt, idx) => (
                    <option key={idx} value={opt} style={{ color: '#1a1a1a' }}>
                      {opt === "2" ? "2 (Couple)" : opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="attendance">Will you attend?</label>
                <select
                  id="attendance"
                  name="attendance"
                  className="form-control"
                  value={formData.attendance}
                  onChange={handleChange}
                  required
                  style={{ color: formData.attendance ? 'var(--text-color)' : 'rgba(0,0,0,0.4)' }}
                >
                  <option value="" style={{ color: '#1a1a1a' }} disabled>Select your response</option>
                  <option value="yes" style={{ color: '#1a1a1a' }}>Yes, with pleasure</option>
                  <option value="no" style={{ color: '#1a1a1a' }}>Regretfully, no</option>
                </select>
              </div>
              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Response'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="elegant-footer">
        <div className="footer-bottom" style={{ width: "100%", textAlign: "center", padding: "20px 0" }}>
          <div className="copyright" style={{ fontSize: "1rem", color: "var(--text-color)", margin: 0, padding: "10px 0", lineHeight: "1.5" }}>
            &copy; {new Date().getFullYear()} {weddingData.couple.groom.name} & {weddingData.couple.bride.name}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Admission Card Modal */}
      {showAdmissionCard && submittedRSVP && (
        <div className="admission-modal-overlay">
          <div className="admission-modal-content">
            <button
              className="close-modal-btn"
              onClick={() => setShowAdmissionCard(false)}
            >
              <i className="fas fa-times"></i>
            </button>
            <AdmissionCard rsvp={submittedRSVP} wedding={weddingData} />
          </div>
        </div>
      )}

      <style>{`
        .admission-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          padding: 20px;
          backdrop-filter: blur(5px);
        }

        .admission-modal-content {
          position: relative;
          background: transparent;
          border-radius: 20px;
          max-width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: modalFadeIn 0.3s ease-out;
        }

        .close-modal-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }

        .close-modal-btn:hover {
          transform: scale(1.1);
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default WeddingTemplate;