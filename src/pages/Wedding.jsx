import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    guests: '',
    attendance: '',
    message: ''
  });

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
      const { error } = await supabase.from('rsvps').insert([{
        wedding_id: weddingData.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        attending: formData.attendance,
        guests_count: parseInt(formData.guests) || 1
      }]);
      if (error) throw error;
      alert("Thank you! Your RSVP has been sent.");
      setFormData({ name: '', email: '', phone: '', guests: '', attendance: '', message: '' });
    } catch (err) {
      console.error("Full RSVP Error:", err);
      alert("Error sending RSVP: " + (err.message || err.error_description || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initial Mock Data (Fallback)
  const initialWeddingData = {
    couple: {
      bride: {
        name: "Sophia",
        image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?ixlib=rb-4.0.3&auto=format&fit=crop&w=880&q=80",
        description: "A passionate architect with an eye for detail and a heart full of love. She loves art, traveling, and early morning coffee."
      },
      groom: {
        name: "Alexander",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
        description: "A successful entrepreneur with a passion for photography and adventure. He believes in love at first sight."
      }
    },
    date: "November 24, 2025",
    location: "The Grand Ballroom, New York",
    venue: {
      name: "The Grand Ballroom",
      address: "123 Park Avenue, New York, NY 10001",
      description: "A historic venue with stunning architecture and beautiful gardens."
    },
    story: {
      part1: "We met on a rainy afternoon in Central Park. Sophia was sketching the Bethesda Fountain, and Alexander was capturing the same scene with his camera. Our eyes met over our respective art forms, and we spent the next three hours talking about everything from architecture to adventure travel.",
      highlight: "Love is not about how many days, months, or years you have been together. Love is about how much you love each other every single day.",
      part2: "Three years later, Alexander proposed at that same Bethesda Fountain, recreating our first meeting with a surprise picnic and a ring hidden in his camera bag. Now we're excited to begin our forever together."
    },
    sliderImages: [
      "https://picsum.photos/seed/wedding1/800/600",
      "https://picsum.photos/seed/wedding2/800/600",
      "https://picsum.photos/seed/wedding3/800/600"
    ],
    bridesmaids: [],
    groomsmen: [],
    ceremony: {
      date: "November 24, 2025",
      time: "3:00 PM",
      venue: "St. Mary's Cathedral"
    },
    reception: {
      date: "November 24, 2025",
      time: "6:00 PM",
      venue: "The Grand Ballroom",
      address: "123 Park Avenue, New York, NY 10001"
    },
    dressCode: "Formal / Black Tie Optional",
    dressCodeDescription: "Elegant evening wear. Gentlemen: Tuxedos or dark suits. Ladies: Evening gowns or cocktail dresses.",
    gifts: [],
    galleryImages: [],
    mapLocation: ""
  };

  const [weddingData, setWeddingData] = useState(initialWeddingData);
  const [dataFetched, setDataFetched] = useState(false);

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
            venue: {
              name: dbData.venue_name,
              address: dbData.venue_address,
              description: dbData.venue_description
            },
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
            rsvpDeadline: dbData.rsvp_deadline
          });
          setDataFetched(true);
        }
      } catch (err) {
        console.error("Error fetching wedding data:", err);
      }
    };

    fetchWeddingData();
  }, [slug]); // Added slug dependency to ensure refetch on nav

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

  const handleCopyAccount = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Account number copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const handleNavClick = (e) => {
    e.preventDefault();
    const targetId = e.target.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: 'smooth'
      });
    }
    setMobileMenuOpen(false);
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

    // Hide loader
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

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
    // Slider auto-play
    const startSlider = () => {
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
  }, []);

  useEffect(() => {
    // Intersection Observer for animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

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

  // Inline Styles
  const styles = `
    :root {
      --primary-color: #FAFAF9;
      --secondary-color: #E7E5E4;
      --accent-color: #A68A64;
      --text-color: #292524;
      --light-text: #57534E;
      --white: #ffffff;
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
      padding: 120px 0;
      position: relative;
    }

    /* Page Loader */
    .page-loader {
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
      transition: opacity 0.5s ease-out, visibility 0.5s ease-out;
    }

    .page-loader.fade-out {
      opacity: 0;
      visibility: hidden;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(166, 138, 100, 0.2);
      border-top: 4px solid var(--accent-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Header & Navigation */
    header {
      position: fixed;
      width: 100%;
      top: 0;
      left: 0;
      z-index: 1000;
      background-color: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
      padding: 1.5rem 0;
      padding-top: max(1.5rem, env(safe-area-inset-top) + 0.5rem);
    }

    header.scrolled {
      padding: 1rem 0;
    }

    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
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

    .mobile-menu {
      display: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-color);
    }

    /* Hero Slider */
    .hero {
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
      padding-top: 120px;
      padding-bottom: 100px;
      min-height: 100vh;
    }

    .hero-slider {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
    }

    .hero-slide {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0;
      transform: scale(1.1);
      transition: all 1.5s cubic-bezier(0.25, 0.8, 0.25, 1);
      background-size: cover;
      background-position: center;
      background-attachment: fixed;
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
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4));
    }

    .hero-content {
      position: relative;
      z-index: 3;
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
      padding: 0 20px;
      color: var(--white);
    }

    .hero h1 {
      font-size: clamp(2.5rem, 6vw, 6rem);
      margin-bottom: 1rem;
      line-height: 1.2;
      font-weight: 700;
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      color: var(--white);
    }

    .hero .hero-tagline {
      font-family: 'Cormorant Garamond', serif;
      font-style: italic;
      font-size: clamp(1.2rem, 2.2vw, 1.8rem);
      margin-bottom: 1rem;
      color: rgba(255, 255, 255, 0.95);
      letter-spacing: 0.04em;
    }

    .hero .hero-meta {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
      padding: 12px 18px;
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-radius: 0;
      background: transparent;
      backdrop-filter: none;
      color: rgba(255, 255, 255, 0.95);
      font-weight: 500;
      letter-spacing: 0.05em;
    }

    .hero .hero-meta > div {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: center;
    }

    .hero .hero-meta a {
      color: rgba(255, 255, 255, 0.95);
      text-decoration: none;
      border-bottom: 1px dotted rgba(255, 255, 255, 0.5);
    }

    .hero .hero-meta a:hover {
      color: #fff;
      border-bottom-color: #fff;
    }

    .hero .slider-dots {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      z-index: 2;
    }

    .hero .slider-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
      border: 2px solid transparent;
      outline: none;
      padding: 0;
      position: relative;
      overflow: hidden;
    }

    .hero .slider-dot::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: var(--white);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .hero .slider-dot.active {
      background: transparent;
      border-color: var(--white);
      transform: scale(1.15);
    }

    .hero .slider-dot.active::before {
      width: 8px;
      height: 8px;
    }

    .hero .slider-controls {
      position: absolute;
      bottom: 50px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 40px;
      z-index: 10;
    }

    .hero .slider-arrows-container {
      display: flex;
      gap: 15px;
    }

    .hero .slider-arrow-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      border: 2px solid rgba(255, 255, 255, 0.4);
      color: var(--white);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
      backdrop-filter: blur(10px);
      font-size: 1.2rem;
    }

    .hero .slider-arrow-btn:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.7);
      transform: scale(1.1);
      box-shadow: 0 8px 32px rgba(255, 255, 255, 0.1);
    }

    .hero .slider-arrow-btn:active {
      transform: scale(0.95);
    }

    .hero .slider-progress {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .hero .progress-bar {
      width: 60px;
      height: 3px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      overflow: hidden;
    }

    .hero .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4));
      width: 0%;
      transition: width 0.3s ease;
      border-radius: 2px;
    }

    .hero .progress-text {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 600;
      min-width: 30px;
    }

    /* Countdown Section */
    .countdown-section {
      background-color: var(--primary-color);
      padding: 120px 0;
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
      text-align: center;
      margin-bottom: 80px;
      position: relative;
      z-index: 2;
    }

    .section-title h2 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 3.5rem;
      color: var(--text-color);
      display: inline-block;
      font-weight: 300;
      margin-bottom: 1rem;
      line-height: 1.1;
    }

    .section-title p {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.9rem;
      color: var(--accent-color);
      text-transform: uppercase;
      letter-spacing: 0.2rem;
      font-weight: 500;
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

    .couple-img {
      width: 300px;
      height: 300px;
      aspect-ratio: 1/1;
      object-fit: cover;
      margin: 0 auto 30px;
      transition: var(--transition);
      border-radius: 50%;
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
    }

    .couple:hover .couple-img {
      transform: scale(1.02);
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

    .member-img {
      width: 250px;
      height: 250px;
      aspect-ratio: 1/1;
      object-fit: cover;
      margin: 0 auto 20px;
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
      transition: var(--transition);
      border-radius: 50%;
    }

    .party-member:hover .member-img {
      transform: scale(1.02);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
    }

    .member-role {
      font-size: 0.75rem;
      color: var(--accent-color);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 8px;
      font-weight: 600;
      display: block;
    }

    .party-member h4 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.4rem;
      margin-bottom: 5px;
      font-weight: 400;
      color: var(--text-color);
    }

    .party-member p {
      color: var(--light-text);
      font-size: 0.85rem;
      margin-bottom: 15px;
      font-family: 'Montserrat', sans-serif;
    }

    .member-social {
      display: flex;
      justify-content: center;
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
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.2rem;
      display: block;
      margin-bottom: 15px;
      font-weight: 500;
    }

    .details-container {
      max-width: 700px;
      margin: 0 auto;
      padding: 0 20px;
      text-align: center;
    }

    .event-item {
      background: var(--white);
      border-left: 3px solid var(--accent-color);
      padding: 45px 40px;
      margin-bottom: 35px;
      border-radius: 4px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
      transition: var(--transition);
      position: relative;
      overflow: hidden;
    }

    .event-item::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 120px;
      height: 120px;
      background: radial-gradient(circle, rgba(166, 138, 100, 0.08) 0%, transparent 70%);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.6s ease;
    }

    .event-item:hover {
      transform: translateX(8px);
      box-shadow: 0 12px 32px rgba(166, 138, 100, 0.15);
    }

    .event-item:hover::before {
      opacity: 1;
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 25px;
      border-bottom: 1px solid rgba(166, 138, 100, 0.15);
      padding-bottom: 20px;
    }

    .event-header h3 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2rem;
      font-weight: 400;
      color: var(--text-color);
      margin: 0;
      letter-spacing: 0.5px;
      flex: 1;
    }

    .event-date {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.9rem;
      color: var(--accent-color);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      font-weight: 500;
      white-space: nowrap;
      margin-left: 40px;
    }

    .event-info {
      display: flex;
      flex-direction: column;
      gap: 18px;
      position: relative;
      z-index: 1;
    }

    .event-info p {
      color: var(--light-text);
      font-size: 0.95rem;
      margin: 0;
      line-height: 1.8;
      letter-spacing: 0.3px;
    }

    .event-info p strong {
      color: var(--text-color);
      font-weight: 600;
      margin-right: 6px;
    }

    .event-info .address {
      color: var(--accent-color);
      font-style: italic;
      font-size: 0.88rem;
      margin-top: 8px;
    }

    /* Gifts Section */
    #gifts-section .info-cards {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      max-width: 960px;
      margin: 40px auto 0;
      padding: 0 10px;
    }

    #gifts-section .info-card {
      padding: 20px 16px;
      border-radius: 10px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      align-items: center;
      text-align: center;
      background: var(--white);
      border: 1px solid rgba(166, 138, 100, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    #gifts-section .info-card:hover {
      transform: translateY(-12px);
      border-color: var(--accent-color);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1);
    }

    #gifts-section .info-card h4 {
      font-size: 1.05rem;
      margin-bottom: 8px;
      font-family: 'Cormorant Garamond', serif;
      color: var(--text-color);
      font-weight: 400;
    }

    #gifts-section .info-card p {
      font-size: 0.95rem;
      margin-bottom: 6px;
      color: var(--light-text);
    }

    #gifts-section .info-icon {
      width: 48px;
      height: 48px;
      font-size: 20px;
      margin-bottom: 12px;
      background: linear-gradient(135deg, rgba(166, 138, 100, 0.1) 0%, rgba(166, 138, 100, 0.05) 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      color: var(--accent-color);
      border: 2px solid rgba(166, 138, 100, 0.2);
      transition: var(--transition);
    }

    #gifts-section .info-card:hover .info-icon {
      background: linear-gradient(135deg, var(--accent-color) 0%, #b38b5d 100%);
      color: var(--white);
      border-color: var(--accent-color);
      transform: scale(1.1);
    }

    #gifts-section .btn.copy-account-btn {
      padding: 8px 12px;
      font-size: 0.9rem;
      border-radius: 6px;
      max-width: 160px;
      background: var(--accent-color);
      color: white;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    #gifts-section .btn.copy-account-btn:hover {
      background: #b38b5d;
    }

    .info-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 30px;
      margin: 80px auto 0;
      max-width: 1200px;
    }

    .info-card {
      background: var(--white);
      border-radius: 12px;
      padding: 45px 35px;
      text-align: center;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      transition: var(--transition);
      border: 1px solid rgba(166, 138, 100, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .info-card:hover {
      transform: translateY(-12px);
      border-color: var(--accent-color);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1);
    }

    .info-icon {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, rgba(166, 138, 100, 0.1) 0%, rgba(166, 138, 100, 0.05) 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 25px;
      color: var(--accent-color);
      font-size: 28px;
      border: 2px solid rgba(166, 138, 100, 0.2);
      transition: var(--transition);
    }

    .info-card:hover .info-icon {
      background: linear-gradient(135deg, var(--accent-color) 0%, #b38b5d 100%);
      color: var(--white);
      border-color: var(--accent-color);
      transform: scale(1.1);
    }

    .info-card h4 {
      font-family: 'Cormorant Garamond', serif;
      color: var(--text-color);
      font-size: 1.5rem;
      margin-bottom: 15px;
      font-weight: 400;
    }

    .info-card p {
      color: var(--light-text);
      margin-bottom: 8px;
      line-height: 1.6;
      font-size: 0.95rem;
    }

    .info-card .hint {
      font-size: 0.85rem;
      color: var(--accent-color);
      font-style: italic;
      margin-top: 10px;
    }

    .info-link {
      display: inline-flex;
      align-items: center;
      color: var(--accent-color);
      text-decoration: none;
      font-size: 0.9rem;
      margin-top: 15px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .info-link i {
      margin-left: 8px;
      font-size: 0.8rem;
      transition: transform 0.3s ease;
    }

    .info-link:hover {
      color: #b38b5d;
    }

    .info-link:hover i {
      transform: translateX(4px);
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
      background: #1c1917;
      padding: 120px 0;
      color: var(--white);
      position: relative;
    }

    .rsvp::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at center, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
      pointer-events: none;
    }

    .rsvp .section-title h2 {
      color: var(--white);
    }

    .rsvp .section-title p {
      color: rgba(255, 255, 255, 0.7);
    }

    .rsvp-form {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.03);
      padding: 60px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      backdrop-filter: blur(10px);
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    .form-group {
      width: 100%;
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    .form-control {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 15px 20px;
      font-size: 1rem;
      transition: var(--transition);
      width: 100%;
      border-radius: 10px;
      color: #ffffff;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 10px rgba(166, 138, 100, 0.3);
    }

    .form-control::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    select.form-control option {
      background-color: #333;
      color: #fff;
    }

    .btn {
      background: linear-gradient(90deg, var(--accent-color) 0%, #b38b5d 100%);
      color: var(--white);
      border: 1px solid var(--accent-color);
      padding: 18px 45px;
      letter-spacing: 0.2rem;
      font-size: 0.9rem;
      margin-top: 30px;
      width: auto;
      max-width: 300px;
      transition: var(--transition);
      cursor: pointer;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      display: block;
      margin: 30px auto;
    }

    .btn:hover {
      background: linear-gradient(90deg, #b38b5d 0%, var(--accent-color) 100%);
      border-color: var(--white);
      color: var(--white);
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
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

      .event-date {
        flex-direction: row;
        justify-content: center;
        padding: 30px 20px;
        min-width: 100%;
      }

      .event-date .date {
        margin: 0 15px 0 0;
        font-size: 2.5rem;
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
        background-color: #ffffff !important;
        padding: 0 !important;
        height: 85px !important;
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
        position: static !important; /* Let container handle positioning context if needed, or relative */
      }

      .logonobold, #couple-initials {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        font-family: 'Cormorant Garamond', serif !important;
        font-size: 1.8rem !important;
        // font-weight: 600 !important;
        color: #000000 !important;
        z-index: 10001 !important;
        position: relative !important;
        text-decoration: none !important;
        white-space: nowrap !important;
        margin: 0 !important;
      }

      .mobile-menu {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        font-size: 1.5rem !important;
        color: #000000 !important;
        z-index: 10001 !important;
        cursor: pointer !important;
        position: relative !important;
        margin: 0 !important;
      }

      .nav-links {
        display: none;
        position: absolute;
        top: 65px; /* Adjust for header height */
        left: 0;
        width: 100%;
        background-color: #ffffff;
        flex-direction: column;
        padding: 30px 0;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        text-align: center;
        border-top: 1px solid rgba(0,0,0,0.05);
      }

      .nav-links.active {
        display: flex !important;
      }

      .nav-links li {
        margin: 15px 0;
        display: block;
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
        padding-top: 120px;
        min-height: 90vh;
      }

      .hero .slider-dots {
        display: flex;
        bottom: 100px;
      }

      .hero .slider-controls {
        bottom: 30px;
        gap: 20px;
      }

      .hero .slider-arrow-btn {
        width: 40px;
        height: 40px;
        font-size: 1rem;
      }

      .hero .progress-bar {
        width: 40px;
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

      .event-date {
        flex-direction: row;
        justify-content: center;
        padding: 20px 15px;
        min-width: 100%;
      }

      .event-date .date {
        margin: 0 15px 0 0;
        font-size: 2rem;
      }

      .event-details {
        padding: 25px;
      }

      .event-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .event-date {
        margin-left: 0;
        margin-top: 12px;
      }

      .event-header h3 {
        font-size: 1.5rem;
      }

      .event-item {
        padding: 35px 25px;
        margin-bottom: 25px;
      }

      .map-container {
        height: 400px;
      }
    }

    @media (max-width: 576px) {
      .couple-img {
        width: 180px;
        height: 180px;
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

      .member-img {
        width: 150px;
        height: 150px;
        aspect-ratio: 1/1;
        max-width: 200px;
        border-radius: 50%;
      }

      .party-members {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 30px;
      }

      #gifts-section .info-cards {
        gap: 14px;
      }

      #gifts-section .info-card {
        padding: 14px 12px;
      }

      #gifts-section .info-icon {
        width: 44px;
        height: 44px;
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
          <div className="spinner"></div>
        </div>
      )}

      {/* Header */}
      <header id="header" className={scrolled ? 'scrolled' : ''}>
        <div className="container">
          <nav className="navbar">
            <a href="#" className="logonobold" id="couple-initials">S & A</a>
            <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
              <li><a href="#home" onClick={handleNavClick}>Home</a></li>
              <li><a href="#about" onClick={handleNavClick}>Our Story</a></li>
              <li><a href="#party" onClick={handleNavClick}>Wedding Party</a></li>
              <li><a href="#location" onClick={handleNavClick}>Location</a></li>
              <li><a href="#details" onClick={handleNavClick}>Details</a></li>
              <li><a href="#gallery" onClick={handleNavClick}>Gallery</a></li>
              <li><a href="#rsvp" onClick={handleNavClick}>RSVP</a></li>
            </ul>
            <div className="mobile-menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <i className="fas fa-bars"></i>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Slider */}
      <section className="hero" id="home">
        <div className="hero-slider">
          {weddingData.sliderImages.map((image, index) => (
            <div
              key={index}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url('${image}')` }}
            ></div>
          ))}
        </div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Sophia & Alexander</h1>
            <div className="hero-tagline">We are getting married</div>
            <div className="hero-meta">
              <div>
                <span className="hero-date">{weddingData.date}</span>
              </div>
              <div>
                <span className="hero-location">{weddingData.location}</span>
              </div>
              <div>
                <a className="hero-view" href="#location-map" rel="noopener">View Map</a>
              </div>
            </div>
          </div>
        </div>

        <div className="slider-dots">
          {weddingData.sliderImages.map((_, index) => (
            <button
              key={index}
              className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => showSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            ></button>
          ))}
        </div>

        <div className="slider-controls">
          <div className="slider-arrows-container">
            <button className="slider-arrow-btn" id="prevSlide" onClick={prevSlide} aria-label="Previous slide">
              <i className="fas fa-chevron-left"></i>
            </button>
            <button className="slider-arrow-btn" id="nextSlide" onClick={nextSlide} aria-label="Next slide">
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
          <div className="slider-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="progress-text">
              <span id="currentSlide">{currentSlide + 1}</span>/
              <span id="totalSlides">{weddingData.sliderImages.length}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="countdown-section">
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
      <section className="about" id="about">
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
              <img src={weddingData.couple.bride.image} alt="Bride" className="couple-img bride-image" />
              <h3 className="bride-name">{weddingData.couple.bride.name}</h3>
              <p className="bride-description">{weddingData.couple.bride.description}</p>
            </div>
            <div
              className="couple"
              id="groom"
              ref={el => coupleRefs.current[1] = el}
            >
              <img src={weddingData.couple.groom.image} alt="Groom" className="couple-img groom-image" />
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
      <section className="party" id="party">
        <div className="container">
          <div className="party-container">
            <div className="party-group">
              <div className="party-title">
                <h3>Bridesmaids</h3>
              </div>
              <div className="party-members">
                {weddingData.bridesmaids.map((member, index) => (
                  <div
                    key={index}
                    className="party-member"
                    ref={el => memberRefs.current[index] = el}
                  >
                    <img
                      src={member.photo || member.image || 'https://via.placeholder.com/150'}
                      alt={member.name}
                      className="member-img"
                    />
                    <div className="member-role">{member.role}</div>
                    <h4>{member.name}</h4>
                    <p>{member.description}</p>
                    {member.instagram && (
                      <div className="member-social">
                        <a href={member.instagram} target="_blank" rel="noopener noreferrer">
                          <i className="fab fa-instagram"></i>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="party-group">
              <div className="party-title">
                <h3>Groomsmen</h3>
              </div>
              <div className="party-members">
                {weddingData.groomsmen.map((member, index) => (
                  <div
                    key={index}
                    className="party-member"
                    ref={el => memberRefs.current[weddingData.bridesmaids.length + index] = el}
                  >
                    <img
                      src={member.photo || member.image || 'https://via.placeholder.com/150'}
                      alt={member.name}
                      className="member-img"
                    />
                    <div className="member-role">{member.role}</div>
                    <h4>{member.name}</h4>
                    <p>{member.description}</p>
                    {member.instagram && (
                      <div className="member-social">
                        <a href={member.instagram} target="_blank" rel="noopener noreferrer">
                          <i className="fab fa-instagram"></i>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wedding Details Section */}
      <section className="wedding-details" id="details">
        <div className="container">
          <div className="section-title">
            <span className="subtitle">The Celebration</span>
            <h2>Wedding Details</h2>
          </div>

          <div className="details-container" id="wedding-details-container">
            <div className="event-item" id="ceremony-item">
              <div className="event-header">
                <h3>Marriage Blessings</h3>
                <span className="event-date" id="ceremony-date">{formatDate(weddingData.ceremony.date)}</span>
              </div>
              <div className="event-info" id="ceremony-details">
                <p className="time"><strong>Time:</strong> <span id="ceremony-time">{weddingData.ceremony.time}</span></p>
                <p className="venue"><strong>Venue:</strong> <span id="ceremony-venue">{weddingData.ceremony.venue}</span></p>
              </div>
            </div>

            <div className="event-item" id="reception-item">
              <div className="event-header">
                <h3>Reception</h3>
                <span className="event-date" id="reception-date">{formatDate(weddingData.reception.date)}</span>
              </div>
              <div className="event-info" id="reception-details">
                <p className="time"><strong>Time:</strong> <span id="reception-time">{weddingData.reception.time}</span></p>
                <p className="venue"><strong>Venue:</strong> <span id="reception-venue">{weddingData.reception.venue}</span></p>
                <p className="address" id="reception-address">{weddingData.reception.address}</p>
              </div>
            </div>

            <div className="event-item" id="dress-code-item">
              <div className="event-header">
                <h3>Dress Code</h3>
              </div>
              <div className="event-info" id="dress-code-details">
                <p id="dress-code-text">{weddingData.dressCode}</p>
                {weddingData.dressCodeDescription && <p>{weddingData.dressCodeDescription}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gifts Section */}
      <section className="wedding-details" id="gifts-section" style={{ padding: "60px 0", background: "linear-gradient(135deg, #ffffff 0%, #fafaf9 100%)" }}>
        <div className="container">
          <div className="section-title">
            <h2>Gifts & Contributions</h2>
            <p>We are grateful for your love — if you'd like to contribute.</p>
          </div>

          <div id="gifts-list" className="info-cards" aria-live="polite">
            {weddingData.gifts.map((gift, index) => (
              <div key={index} className="info-card">
                <div className="info-icon"><i className="fas fa-gift"></i></div>
                <h4>{gift.provider} {gift.giftType ? `(${gift.giftType})` : ''}</h4>
                {gift.accountName && <p><strong>{gift.accountName}</strong></p>}
                {gift.accountNumber && <p style={{ letterSpacing: "0.05em" }}>{gift.accountNumber}</p>}
                {gift.instructions && <p className="hint">{gift.instructions}</p>}
                {gift.url && (
                  <p>
                    <a href={gift.url} target="_blank" rel="noopener noreferrer" className="info-link">
                      Open payment link <i className="fas fa-external-link-alt"></i>
                    </a>
                  </p>
                )}
                <div style={{ marginTop: "12px", display: "flex", justifyContent: "center", gap: "10px" }}>
                  {gift.accountNumber && (
                    <button
                      className="btn copy-account-btn"
                      onClick={() => handleCopyAccount(gift.accountNumber)}
                    >
                      Copy Account
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
          <div className="map-overlay">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(weddingData.venue.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="directions-btn"
              aria-label="Get directions"
            >
              <i className="fas fa-directions"></i>
            </a>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="gallery" id="gallery">
        <div className="container">
          <div className="section-title">
            <span className="subtitle" style={{ color: "white", opacity: 0.8 }}>Moments</span>
            <h2 style={{ color: "white" }}>Photo Gallery</h2>
          </div>
          <div className="gallery-grid">
            {weddingData.galleryImages.map((image, index) => (
              <div
                key={index}
                className="gallery-item"
                ref={el => galleryRefs.current[index] = el}
              >
                <img src={image} alt={`Gallery ${index + 1}`} />
                <div className="gallery-overlay"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RSVP Section */}
      <section className="rsvp" id="rsvp">
        <div className="container">
          <div className="section-title">
            <h2>RSVP</h2>
            <p>Kindly respond by {weddingData.rsvpDeadline ? formatDate(weddingData.rsvpDeadline) : "the date specified"}</p>
          </div>
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
                style={{ color: formData.guests ? '#fff' : '#757575' }}
              >
                <option value="" style={{ color: '#fff' }} disabled>Select number of guests</option>
                <option value="1" style={{ color: '#fff' }}>1</option>
                <option value="2" style={{ color: '#fff' }}>2</option>
                <option value="3" style={{ color: '#fff' }}>3</option>
                <option value="4" style={{ color: '#fff' }}>4+ (Specify in message)</option>
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
                style={{ color: formData.attendance ? '#fff' : '#757575' }}
              >
                <option value="" style={{ color: '#fff' }} disabled>Select your response</option>
                <option value="yes" style={{ color: '#fff' }}>Yes, with pleasure</option>
                <option value="no" style={{ color: '#fff' }}>Regretfully, no</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="message">Message (Optional)</label>
              <textarea
                id="message"
                name="message"
                className="form-control"
                placeholder="Dietary requirements or a note for the couple..."
                value={formData.message}
                onChange={handleChange}
                rows="3"
              ></textarea>
            </div>
            <button type="submit" className="btn" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="elegant-footer">
        <div className="footer-bottom" style={{ width: "100%", textAlign: "center", padding: "20px 0" }}>
          <div className="copyright" style={{ fontSize: "1rem", color: "var(--text-color)", margin: 0, padding: "10px 0", lineHeight: "1.5" }}>
            &copy; 2025 Sophia & Alexander. All rights reserved.
            <div className="footer-love">
              Made with <span className="heart-emoji">❤️</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default WeddingTemplate;