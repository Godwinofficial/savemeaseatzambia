import React, { useState, useEffect } from 'react';
import './birthday.css';
import Navbar from '../components_birthday/Navbar';
import HeroSection from '../components_birthday/HeroSection';
import BirthdayQueen from '../components_birthday/BirthdayQueen';
import CountdownSection from '../components_birthday/CountdownSection';
import PartyLocation from '../components_birthday/PartyLocation';
import RSVPFooter from '../components_birthday/RSVPFooter';
import { supabase } from '../supabaseClient';
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
        setEvent(data);

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
                background:  '#000000',
                foreground:  '#ffffff',
                border:      '#333333',
                card: { DEFAULT: '#111111', foreground: '#ffffff' },
                primary:     { DEFAULT: '#f4d05c', foreground: '#000000' },
                secondary:   { DEFAULT: '#222222', foreground: '#ffffff' },
                accent:      { DEFAULT: '#f4d05c',  foreground: '#000000' },
                muted:       { DEFAULT: '#222222',  foreground: '#aaaaaa' },
                'katy-gold':  '#f4d05c',
                'katy-green': 'hsl(150, 40%, 55%)',
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
        <div className="bd-page min-h-screen bg-background text-foreground font-nunito">
          <Navbar childName={event?.child_name} />
          <HeroSection event={event} />
          <BirthdayQueen event={event} />
          <CountdownSection event={event} />
          <PartyLocation event={event} />
          <RSVPFooter event={event} />
        </div>
      )}

      {/* Loading state */}
      {!isReady && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Sacramento', cursive", fontSize: '2rem', color: '#f4d05c' }}>
              Loading invitation…
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Birthday;
