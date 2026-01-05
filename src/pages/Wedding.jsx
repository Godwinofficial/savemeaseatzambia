// WeddingTemplate.jsx
import React, { useState, useEffect, useRef } from 'react';
// import './Wedding.css';

// Mock wedding data with online images
const MOCK_WEDDING_DATA = {
    bride_name: 'Sophia',
    groom_name: 'Alexander',
    couple_names: 'Sophia & Alexander',
    event_date: '2026-08-15',
    event_location: 'The Grand Ballroom, Lusaka',
    venue_name: 'The Grand Ballroom',
    venue_address: 'Cairo Road, Lusaka, Zambia',
    ceremony_time: '15:00',
    reception_time: '18:00',
    story_paragraph1: 'Our love story began on a beautiful spring day in 2020, when fate brought us together at a mutual friend\'s gathering. From the moment our eyes met, we knew there was something special between us.',
    story_highlight: 'Three years of laughter, adventures, and unwavering support later, Alexander got down on one knee during a sunset picnic by the lake, and Sophia said YES!',
    story_paragraph2: 'Now, we\'re thrilled to celebrate our love with our closest family and friends. Join us as we embark on this beautiful journey of forever together.',
    dress_code: 'Formal Attire',
    dress_code_description: 'Black Tie Optional - Elegant evening wear requested',
    bride_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80',
    groom_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80',
    slider_images: [
        'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        'https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80'
    ],
    bridesmaids: [
        {
            name: 'Emma Wilson',
            role: 'Maid of Honor',
            description: "Sophia's sister and best friend since childhood",
            photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80'
        },
        {
            name: 'Olivia Martinez',
            role: 'Bridesmaid',
            description: 'College roommate and travel partner',
            photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80'
        },
        {
            name: 'Isabella Chen',
            role: 'Bridesmaid',
            description: 'Childhood friend and confidante',
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=764&q=80'
        }
    ],
    groomsmen: [
        {
            name: 'James Thompson',
            role: 'Best Man',
            description: 'Childhood friend and college roommate',
            photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80'
        },
        {
            name: 'Michael Rodriguez',
            role: 'Groomsman',
            description: 'College friend and hiking buddy',
            photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80'
        },
        {
            name: 'David Park',
            role: 'Groomsman',
            description: 'Work colleague and golf partner',
            photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80'
        }
    ],
    gifts: [
        {
            name: 'Honeymoon Fund',
            description: 'Help us create unforgettable memories on our dream honeymoon',
            account_name: 'Sophia & Alexander',
            account_number: '1234567890',
            bank_name: 'Zanaco Bank'
        },
        {
            name: 'Home Fund',
            description: 'Contribute to our new home together',
            account_name: 'Sophia & Alexander',
            account_number: '0987654321',
            bank_name: 'FNB Zambia'
        }
    ],
    google_maps_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3846.7847474474!2d28.283333!3d-15.416667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTXCsDI1JzAwLjAiUyAyOMKwMTcnMDAuMCJF!5e0!3m2!1sen!2szm!4v1234567890'
};

const WeddingTemplate = () => {
    const [eventData, setEventData] = useState(MOCK_WEDDING_DATA);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [countdown, setCountdown] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        guests: '',
        attendance: ''
    });

    const slideIntervalRef = useRef(null);
    const heroSliderRef = useRef(null);

    // Countdown timer
    const startCountdown = (weddingDate) => {
        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = new Date(weddingDate).getTime() - now;

            if (distance < 0) return;

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setCountdown({
                days: days.toString().padStart(2, '0'),
                hours: hours.toString().padStart(2, '0'),
                minutes: minutes.toString().padStart(2, '0'),
                seconds: seconds.toString().padStart(2, '0')
            });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    };

    // Format wedding date
    const formatWeddingDate = (dateString) => {
        if (!dateString) return '';
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    // Format time
    const formatWeddingTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };


    // Start countdown on mount
    useEffect(() => {
        startCountdown(MOCK_WEDDING_DATA.event_date);
    }, []);

    // Hero slider functions
    useEffect(() => {
        if (!eventData || !eventData.slider_images || eventData.slider_images.length <= 1) return;

        const startSlider = () => {
            slideIntervalRef.current = setInterval(() => {
                setCurrentSlide(prev => (prev + 1) % eventData.slider_images.length);
            }, 6000);
        };

        startSlider();

        return () => {
            if (slideIntervalRef.current) {
                clearInterval(slideIntervalRef.current);
            }
        };
    }, [eventData]);

    const nextSlide = () => {
        if (!eventData || !eventData.slider_images) return;
        const totalSlides = eventData.slider_images.length;
        setCurrentSlide(prev => (prev + 1) % totalSlides);
        resetSliderTimer();
    };

    const prevSlide = () => {
        if (!eventData || !eventData.slider_images) return;
        const totalSlides = eventData.slider_images.length;
        setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
        resetSliderTimer();
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
        resetSliderTimer();
    };

    const resetSliderTimer = () => {
        if (slideIntervalRef.current) {
            clearInterval(slideIntervalRef.current);
            slideIntervalRef.current = setInterval(nextSlide, 6000);
        }
    };

    // Header scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Mobile menu toggle
    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    // Smooth scrolling
    const handleScrollTo = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 80,
                behavior: 'smooth'
            });
            setMobileMenuOpen(false);
        }
    };

    // Form handling
    const handleFormChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        if (!formData.name || !formData.attendance) {
            alert('Please fill in all required fields.');
            return;
        }

        // Simulate successful RSVP submission
        console.log('RSVP Submitted:', {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            guests: formData.guests,
            attendance: formData.attendance
        });

        alert('Thank you for your RSVP! We look forward to celebrating with you.');

        // Reset form
        setFormData({
            name: '',
            phone: '',
            email: '',
            guests: '',
            attendance: ''
        });
    };

    // Copy account number
    const copyAccountNumber = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Account number copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    };

    return (
        <>
            <style>{`
        /* All the CSS styles from the original HTML go here */
        /* I'm including a condensed version - you should copy the complete CSS from the original */
        
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
          padding: 1rem 0;
        }

        header.scrolled {
          padding: 1.5rem 0;
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
          cursor: pointer;
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
        .hero-slider {
          height: 100vh;
          position: relative;
          overflow: hidden;
        }

        .slider-container {
          height: 100%;
          position: relative;
        }

        .slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          transform: scale(1.1);
          transition: all 1.5s cubic-bezier(0.25, 0.8, 0.25, 1);
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .slide.active {
          opacity: 1;
          transform: scale(1);
        }

        .slide::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5));
        }

        .slide-content {
          position: relative;
          z-index: 2;
          text-align: center;
          color: var(--white);
          max-width: 900px;
          padding: 0 20px;
          animation: fadeInUp 1.5s ease;
        }

        .slide-content h1 {
          font-size: clamp(3rem, 8vw, 6rem);
          margin-bottom: 20px;
          font-weight: 300;
          letter-spacing: 3px;
          line-height: 1.1;
          font-family: 'Cormorant Garamond', serif;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
        }

        .slide-content p {
          font-size: clamp(1rem, 2vw, 1.3rem);
          margin-bottom: 30px;
          font-weight: 300;
          letter-spacing: 3px;
          text-transform: uppercase;
          opacity: 0.9;
        }

        .slide-content .date {
          font-size: clamp(1.2rem, 2.5vw, 1.8rem);
          margin-top: 30px;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          letter-spacing: 1px;
          padding: 15px 30px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 50px;
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.1);
          display: inline-block;
          transition: all 0.3s ease;
        }

        .slide-content .date:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
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

        /* Wedding Party Section */
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
          box-shadow: var(--shadow-lg);
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

        /* Wedding Details Section */
        .wedding-details {
          padding: 120px 0;
          background: linear-gradient(135deg, var(--white) 0%, #fafaf9 100%);
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
        }

        #gifts-section .info-card h4 {
          font-size: 1.05rem;
          margin-bottom: 8px;
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
        }

        #gifts-section .btn.copy-account-btn {
          padding: 8px 12px;
          font-size: 0.9rem;
          border-radius: 6px;
          max-width: 160px;
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

        /* RSVP Section */
        .rsvp {
          background: #1c1917;
          padding: 120px 0;
          color: var(--white);
          position: relative;
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

        .form-control {
          background: transparent;
          border: none;
          padding: 15px 20px;
          font-size: 1.1rem;
          transition: var(--transition);
          width: 100%;
          margin-bottom: 20px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          color: #ffffff;
        }

        .form-control:focus {
          background: transparent;
          border: none;
          padding-left: 20px;
          padding-right: 20px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          outline: none;
        }

        .form-control::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .btn {
          background: linear-gradient(90deg, var(--accent-color) 0%, var(--secondary-color) 100%);
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
          background: linear-gradient(90deg, var(--secondary-color) 0%, var(--accent-color) 100%);
          border-color: var(--white);
          color: var(--white);
        }

        /* Footer */
        .elegant-footer {
          background-color: var(--primary-color);
          color: #fff;
          position: relative;
          padding: 40px 0;
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

        /* Responsive Styles */
        @media (max-width: 992px) {
          .countdown-number {
            font-size: 2.5rem;
          }
          .countdown-item {
            min-width: 80px;
          }
        }

        @media (max-width: 768px) {
          .navbar {
            padding: 0;
          }

          .nav-links {
            display: none;
            position: absolute;
            top: 70px;
            left: 0;
            width: 100%;
            background-color: var(--white);
            flex-direction: column;
            padding: 20px;
            box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
          }

          .nav-links.active {
            display: flex;
          }

          .nav-links li {
            margin: 15px 0;
          }

          .mobile-menu {
            display: block;
          }

          .couple-container {
            grid-template-columns: 1fr;
            gap: 50px;
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
        }

        @media (max-width: 576px) {
          .couple-img {
            width: 180px;
            height: 180px;
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

        /* Hero section specific styles */
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

        .hero-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .hero-btn {
          padding: 14px 28px;
          border-radius: 4px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .hero-btn.primary {
          background: linear-gradient(135deg, var(--white), #f8f9fa);
          color: var(--text-color);
          border: 2px solid var(--white);
        }

        .hero-btn.secondary {
          background: transparent;
          color: var(--white);
          border: 2px solid var(--white);
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

        @media (max-width: 768px) {
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
        }
      `}</style>

            {/* Header */}
            <header id="header" className={scrolled ? 'scrolled' : ''}>
                <div className="container">
                    <nav className="navbar">
                        <a href="#" className="logonobold" id="couple-initials">
                            {eventData ? `${eventData.bride_name?.charAt(0) || 'S'} & ${eventData.groom_name?.charAt(0) || 'A'}` : 'S & A'}
                        </a>
                        <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
                            <li><a onClick={() => handleScrollTo('home')}>Home</a></li>
                            <li><a onClick={() => handleScrollTo('about')}>Our Story</a></li>
                            <li><a onClick={() => handleScrollTo('party')}>Wedding Party</a></li>
                            <li><a onClick={() => handleScrollTo('details')}>Details</a></li>
                            <li><a onClick={() => handleScrollTo('gifts-section')}>Gifts</a></li>
                            <li><a onClick={() => handleScrollTo('rsvp')}>RSVP</a></li>
                        </ul>
                        <div className="mobile-menu" onClick={toggleMobileMenu}>
                            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Hero Slider */}
            <section className="hero" id="home">
                <div className="hero-slider" ref={heroSliderRef}>
                    {eventData?.slider_images?.map((image, index) => (
                        <div
                            key={index}
                            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                            style={{
                                backgroundImage: `url('${image}')`
                            }}
                        ></div>
                    ))}
                    {(!eventData?.slider_images || eventData.slider_images.length === 0) && (
                        <div className="hero-slide active"></div>
                    )}
                </div>

                <div className="container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            {eventData ? `${eventData.bride_name || 'Sophia'} & ${eventData.groom_name || 'Alexander'}` : 'Sophia & Alexander'}
                        </h1>
                        <div className="hero-tagline">We are getting married</div>
                        <div className="hero-meta">
                            <div>
                                <span className="hero-date">
                                    {eventData ? formatWeddingDate(eventData.event_date) : 'November 24, 2025'}
                                </span>
                            </div>
                            <div>
                                <span className="hero-location">
                                    {eventData?.event_location || 'The Grand Ballroom, New York'}
                                </span>
                            </div>
                            <div>
                                <a className="hero-view" href="#" target="_blank" rel="noopener">View Map</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="slider-dots">
                    {eventData?.slider_images?.map((_, index) => (
                        <button
                            key={index}
                            className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                        ></button>
                    ))}
                </div>

                <div className="slider-controls">
                    <div className="slider-arrows-container">
                        <button className="slider-arrow-btn" onClick={prevSlide}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <button className="slider-arrow-btn" onClick={nextSlide}>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div className="slider-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${((currentSlide + 1) / (eventData?.slider_images?.length || 1)) * 100}%`
                                }}
                            ></div>
                        </div>
                        <span className="progress-text">
                            <span id="currentSlide">{currentSlide + 1}</span>/
                            <span id="totalSlides">{eventData?.slider_images?.length || 1}</span>
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
                                <span className="countdown-number">{countdown.days}</span>
                                <span className="countdown-label">Days</span>
                            </div>
                            <div className="countdown-item">
                                <span className="countdown-number">{countdown.hours}</span>
                                <span className="countdown-label">Hours</span>
                            </div>
                            <div className="countdown-item">
                                <span className="countdown-number">{countdown.minutes}</span>
                                <span className="countdown-label">Minutes</span>
                            </div>
                            <div className="countdown-item">
                                <span className="countdown-number">{countdown.seconds}</span>
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
                        <div className="couple" id="bride">
                            <img
                                src={eventData?.bride_image || 'https://placehold.co/300x300?text=Bride'}
                                alt="Bride"
                                className="couple-img bride-image"
                            />
                            <h3 className="bride-name">{eventData?.bride_name || 'Bride'}</h3>
                            <p className="bride-description">
                                {eventData?.bride_description || "Beautiful description about the bride"}
                            </p>
                        </div>
                        <div className="couple" id="groom">
                            <img
                                src={eventData?.groom_image || 'https://placehold.co/300x300?text=Groom'}
                                alt="Groom"
                                className="couple-img groom-image"
                            />
                            <h3 className="groom-name">{eventData?.groom_name || 'Groom'}</h3>
                            <p className="groom-description">
                                {eventData?.groom_description || "Handsome description about the groom"}
                            </p>
                        </div>
                    </div>
                    <div className="story-content">
                        <p className="story-highlight" id="story-highlight">
                            {eventData?.story_highlight || "And then we fell in love..."}
                        </p>
                        <p className="story-text" id="story-part2">
                            {eventData?.story_paragraph2 || "Loading more of our story..."}
                        </p>
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
                                {eventData?.bridesmaids?.map((member, index) => (
                                    <div key={index} className="party-member">
                                        <img
                                            src={member.photo || 'https://placehold.co/250x250?text=Bridesmaid'}
                                            alt={member.name}
                                            className="member-img"
                                        />
                                        <div className="member-role">{member.role}</div>
                                        <h4>{member.name}</h4>
                                        <p>{member.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="party-group">
                            <div className="party-title">
                                <h3>Groomsmen</h3>
                            </div>
                            <div className="party-members">
                                {eventData?.groomsmen?.map((member, index) => (
                                    <div key={index} className="party-member">
                                        <img
                                            src={member.photo || 'https://placehold.co/250x250?text=Groomsman'}
                                            alt={member.name}
                                            className="member-img"
                                        />
                                        <div className="member-role">{member.role}</div>
                                        <h4>{member.name}</h4>
                                        <p>{member.description}</p>
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
                                <span className="event-date" id="ceremony-date">
                                    {eventData ? new Date(eventData.event_date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    }).toUpperCase() : 'NOV 24, 2025'}
                                </span>
                            </div>
                            <div className="event-info" id="ceremony-details">
                                <p className="time">
                                    <strong>Time:</strong>
                                    <span id="ceremony-time">
                                        {eventData ? formatWeddingTime(eventData.ceremony_time) : '3:00 PM'}
                                    </span>
                                </p>
                                <p className="venue">
                                    <strong>Venue:</strong>
                                    <span id="ceremony-venue">
                                        {eventData?.venue_name || 'The Grand Ballroom'}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="event-item" id="reception-item">
                            <div className="event-header">
                                <h3>Reception</h3>
                                <span className="event-date" id="reception-date">
                                    {eventData ? new Date(eventData.event_date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    }).toUpperCase() : 'NOV 24, 2025'}
                                </span>
                            </div>
                            <div className="event-info" id="reception-details">
                                <p className="time">
                                    <strong>Time:</strong>
                                    <span id="reception-time">
                                        {eventData ? formatWeddingTime(eventData.reception_time) : '6:00 PM'}
                                    </span>
                                </p>
                                <p className="venue">
                                    <strong>Venue:</strong>
                                    <span id="reception-venue">
                                        {eventData?.venue_name || 'The Grand Ballroom'}
                                    </span>
                                </p>
                                <p className="address" id="reception-address">
                                    {eventData?.venue_address || '123 Wedding Avenue, New York, NY'}
                                </p>
                            </div>
                        </div>

                        <div className="event-item" id="dress-code-item">
                            <div className="event-header">
                                <h3>Dress Code</h3>
                            </div>
                            <div className="event-info" id="dress-code-details">
                                <p id="dress-code-text">{eventData?.dress_code || 'Formal'}</p>
                                {eventData?.dress_code_description && (
                                    <p>{eventData.dress_code_description}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gifts & Contributions Section */}
            <section className="wedding-details" id="gifts-section">
                <div className="container">
                    <div className="section-title">
                        <h2>Gifts & Contributions</h2>
                        <p>We are grateful for your love — if you'd like to contribute.</p>
                    </div>

                    <div id="gifts-list" className="info-cards">
                        {eventData?.gifts && eventData.gifts.length > 0 ? (
                            eventData.gifts.map((gift, index) => (
                                <div key={index} className="info-card">
                                    <div className="info-icon"><i className="fas fa-gift"></i></div>
                                    <h4>{gift.provider || 'Contribution'} {gift.gift_type ? `(${gift.gift_type})` : ''}</h4>
                                    <p><strong>{gift.account_name}</strong></p>
                                    <p style={{ letterSpacing: '0.05em' }}>{gift.account_number}</p>
                                    {gift.instructions && <p className="hint">{gift.instructions}</p>}
                                    {gift.url && (
                                        <p>
                                            <a href={gift.url} target="_blank" rel="noopener noreferrer" className="info-link">
                                                Open payment link <i className="fas fa-external-link-alt"></i>
                                            </a>
                                        </p>
                                    )}
                                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                        <button
                                            className="btn copy-account-btn"
                                            onClick={() => copyAccountNumber(gift.account_number || gift.account_name)}
                                        >
                                            Copy Account
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="info-card">
                                <div className="info-icon"><i className="fas fa-heart"></i></div>
                                <h4>No contribution details</h4>
                                <p className="hint">There are currently no gift or contribution details available.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* RSVP Section */}
            <section className="rsvp" id="rsvp">
                <div className="container">
                    <div className="section-title">
                        <h2>RSVP</h2>
                        <p>Kindly respond by the day before the event</p>
                    </div>
                    <form className="rsvp-form" onSubmit={handleFormSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="form-control"
                                placeholder="Your full name"
                                required
                                value={formData.name}
                                onChange={handleFormChange}
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
                                onChange={handleFormChange}
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
                                onChange={handleFormChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="guests">Number of Guests</label>
                            <select
                                id="guests"
                                name="guests"
                                className="form-control"
                                required
                                value={formData.guests}
                                onChange={handleFormChange}
                                style={{ color: '#757575' }}
                            >
                                <option style={{ color: '#fff' }} value="" disabled>Select number of guests</option>
                                <option style={{ color: '#fff' }} value="1">1</option>
                                <option style={{ color: '#fff' }} value="2">2 (Couple)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="attendance">Will you attend?</label>
                            <select
                                id="attendance"
                                name="attendance"
                                className="form-control"
                                required
                                value={formData.attendance}
                                onChange={handleFormChange}
                                style={{ color: '#757575' }}
                            >
                                <option style={{ color: '#fff' }} value="" disabled>Select your response</option>
                                <option style={{ color: '#fff' }} value="yes">Yes, with pleasure</option>
                                <option style={{ color: '#fff' }} value="no">Regretfully, no</option>
                            </select>
                        </div>
                        <button type="submit" className="btn">Submit Response</button>
                    </form>
                </div>
            </section>

            {/* Footer */}
            <footer className="elegant-footer">
                <div className="footer-bottom">
                    <div className="copyright">
                        &copy; 2025 SaveMeASeat. All rights reserved.
                    </div>
                </div>
            </footer>
        </>
    );
};

export default WeddingTemplate;