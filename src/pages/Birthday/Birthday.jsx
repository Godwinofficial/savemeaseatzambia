import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './birthday.css';
import Navbar from '../../components_birthday/Navbar';
import HeroSection from '../../components_birthday/HeroSection';
import BirthdayQueen from '../../components_birthday/BirthdayQueen';
import CountdownSection from '../../components_birthday/CountdownSection';
import PartyLocation from '../../components_birthday/PartyLocation';
import RSVPFooter from '../../components_birthday/RSVPFooter';
import { supabase } from '../../supabaseClient';
import { useParams } from 'react-router-dom';

const FontAwesomeCSS = () => (
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
  />
);

const Birthday = () => {
  const { slug } = useParams();
  const [cdnLoaded, setCdnLoaded] = useState(false);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch event data from Supabase
  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) { setLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from('birthday_events')
          .select('*')
          .eq('slug', slug)
          .single();
        if (error) throw error;
        if (data) {
          setEvent(data);
          // Set initial theme based on backend setting if available
          if (data.visual_mode) {
            const mode = data.visual_mode === 'dark';
            setIsDarkMode(mode);
            localStorage.setItem('bd-theme', data.visual_mode);
          }
        }

        // Increment view count
        supabase
          .from('birthday_events')
          .update({ views: (data.views || 0) + 1 })
          .eq('slug', slug)
          .then(() => { });
      } catch (err) {
        console.error('Error fetching birthday event:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  // Load Tailwind CDN
  useEffect(() => {
    if (!document.getElementById('tailwind-config')) {
      const configScript = document.createElement('script');
      configScript.id = 'tailwind-config';
      configScript.innerHTML = `
        window.tailwind = window.tailwind || {};
        window.tailwind.config = {
          theme: {
            extend: {
               colors: {
                background:  'var(--background)',
                foreground:  'var(--foreground)',
                border:      'var(--border)',
                card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
                primary:     { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
                secondary:   { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
                accent:      { DEFAULT: 'var(--accent)',  foreground: 'var(--accent-foreground)' },
                muted:       { DEFAULT: 'var(--muted)',  foreground: 'var(--muted-foreground)' },
                'katy-gold':  'var(--katy-gold)',
                'katy-green': 'var(--katy-green)',
              },
              fontFamily: {
                sans:   ['Nunito', 'sans-serif'],
                nunito: ['Nunito', 'sans-serif'],
                script: ['"Sacramento"', 'cursive'],
              },
            },
          },
        };
      `;
      document.head.appendChild(configScript);
    }
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

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('bd-theme');
    return saved ? saved === 'dark' : true; // Default to dark
  });


  const isReady = cdnLoaded && !loading;

  return (
    <>
      <FontAwesomeCSS />

      <style>{`
        .font-script { font-family: 'Sacramento', cursive !important; }
        .blob-shape {
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          animation: bd-morph 8s ease-in-out infinite;
        }
        @keyframes bd-morph {
          0%,100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          34%      { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
          67%      { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; }
        }
        .confetti-dot {
          position: absolute; border-radius: 50%; opacity: 0.6;
          animation: bd-float 6s ease-in-out infinite;
        }
        .confetti-rect {
          position: absolute; opacity: 0.5;
          animation: bd-spin-float 8s linear infinite;
        }
        @keyframes bd-float {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes bd-spin-float {
          0%   { transform: translateY(0) rotate(0deg); }
          50%  { transform: translateY(-15px) rotate(180deg); }
          100% { transform: translateY(0) rotate(360deg); }
        }
        @keyframes bd-countdown-pulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
        /* Loading skeleton */
        .bd-skeleton {
          background: linear-gradient(90deg, #f0e8e0 25%, #f9f3ee 50%, #f0e8e0 75%);
          background-size: 200% 100%;
          animation: bd-shimmer 1.5s infinite;
          border-radius: 8px;
        }
        @keyframes bd-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {isReady && (
        <div className={`bd-page min-h-screen bg-background text-foreground font-nunito ${!isDarkMode ? 'light-mode' : ''}`}>
          <Navbar 
            childName={event?.logo_initials || event?.child_name} 
            isDarkMode={isDarkMode}
          />
          
          <main>
            <HeroSection event={event} />
            
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <BirthdayQueen event={event} />
              <CountdownSection event={event} />
              <PartyLocation event={event} />
              <RSVPFooter event={event} />
            </motion.div>
          </main>
        </div>
      )}


      {/* Loading state */}
      {!isReady && (
        <div 
          className={`bd-loader-wrapper ${!isDarkMode ? 'light-mode' : ''}`}
          style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'var(--background)',
            color: 'var(--foreground)'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Sacramento', cursive", fontSize: '3rem', color: 'var(--primary)' }}>
              Loading invitation…
            </p>
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Birthday;
