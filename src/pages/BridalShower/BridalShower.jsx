import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Calendar, MapPin, Gift, Shirt, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import html2canvas from 'html2canvas';

const BridalShower = () => {
    const { slug } = useParams();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cdnLoaded, setCdnLoaded] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [currentSlide, setCurrentSlide] = useState(0);
    const [rsvpStatus, setRsvpStatus] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [rsvpForm, setRsvpForm] = useState({ first_name: '', last_name: '', email: '', phone: '', attending: '', message: '' });
    const [downloading, setDownloading] = useState(false);
    const cardRef = useRef(null);

    // ─── Fetch event ────────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchEvent = async () => {
            if (!slug) { setNotFound(true); setLoading(false); return; }
            try {
                const { data, error } = await supabase
                    .from('bridal_showers')
                    .select('*')
                    .eq('slug', slug)
                    .single();
                if (error || !data) { setNotFound(true); }
                else {
                    // Parse JSON fields if stored as strings
                    const parsed = {
                        ...data,
                        registry_items: typeof data.registry_items === 'string'
                            ? JSON.parse(data.registry_items) : data.registry_items || [],
                        gallery_images: typeof data.gallery_images === 'string'
                            ? JSON.parse(data.gallery_images) : data.gallery_images || [],
                    };
                    setEvent(parsed);
                }
            } catch (e) {
                console.error(e);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [slug]);

    // ─── Theme color, background, & font styling ───────────────────────────────
    useEffect(() => {
        // Theme color meta tag
        let meta = document.querySelector("meta[name='theme-color']");
        const orig = meta?.getAttribute('content') || null;
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'theme-color';
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', '#fdfbf7');

        // Capture original inline styles to prevent leakage
        const origBodyBg = document.body.style.backgroundColor;
        const origBodyColor = document.body.style.color;
        const origBodyFont = document.body.style.fontFamily;
        const origHtmlBg = document.documentElement.style.backgroundColor;
        const origHtmlColor = document.documentElement.style.color;
        const origHtmlFont = document.documentElement.style.fontFamily;

        // Force brand identities
        document.body.style.setProperty('background-color', '#fdfbf7', 'important');
        document.body.style.setProperty('color', '#1a1a1a', 'important');
        document.body.style.setProperty('font-family', "'Outfit', sans-serif", 'important');

        document.documentElement.style.setProperty('background-color', '#fdfbf7', 'important');
        document.documentElement.style.setProperty('color', '#1a1a1a', 'important');
        document.documentElement.style.setProperty('font-family', "'Outfit', sans-serif", 'important');

        return () => {
            // Restore original states
            orig ? meta.setAttribute('content', orig) : meta.remove();

            document.body.style.backgroundColor = origBodyBg;
            document.body.style.color = origBodyColor;
            document.body.style.fontFamily = origBodyFont;

            document.documentElement.style.backgroundColor = origHtmlBg;
            document.documentElement.style.color = origHtmlColor;
            document.documentElement.style.fontFamily = origHtmlFont;
        };
    }, []);

    // ─── Load Tailwind CDN ───────────────────────────────────────────────────────
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

    // ─── Scroll listener ────────────────────────────────────────────────────────
    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // ─── Countdown ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!event?.date) return;
        const target = new Date(`${event.date}T${event.time || '12:00:00'}`).getTime();
        const tick = () => {
            const diff = target - Date.now();
            if (diff > 0) {
                setTimeLeft({
                    days: Math.floor(diff / 86400000),
                    hours: Math.floor((diff % 86400000) / 3600000),
                    minutes: Math.floor((diff % 3600000) / 60000),
                    seconds: Math.floor((diff % 60000) / 1000),
                });
            }
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [event]);

    // ─── Auto-slide ─────────────────────────────────────────────────────────────
    const slides = event?.gallery_images?.length > 0
        ? event.gallery_images
        : [
            "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2070",
            "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=2069",
            "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=2070"
        ];

    useEffect(() => {
        const t = setInterval(() => setCurrentSlide(p => (p + 1) % slides.length), 5000);
        return () => clearInterval(t);
    }, [slides.length]);

    const nextSlide = () => setCurrentSlide(p => (p + 1) % slides.length);
    const prevSlide = () => setCurrentSlide(p => (p - 1 + slides.length) % slides.length);

    // ─── RSVP Submit ────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setRsvpStatus('sending');
        try {
            const { data, error } = await supabase.from('bridal_shower_rsvps').insert([{
                event_id: event.id,
                first_name: rsvpForm.first_name,
                last_name: rsvpForm.last_name,
                email: rsvpForm.email,
                phone: rsvpForm.phone,
                attending: rsvpForm.attending === 'yes',
                message: rsvpForm.message,
                status: 'pending',
            }]).select().single();
            if (error) throw error;
            if (data) setRsvpForm(p => ({ ...p, id: data.id }));
            setRsvpStatus('success');
        } catch (err) {
            console.error(err);
            setRsvpStatus('error');
        }
    };

    // ─── Download card ───────────────────────────────────────────────────────────
    const downloadCard = async () => {
        if (!cardRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                logging: false,
            });
            const link = document.createElement('a');
            link.download = `RSVP_${rsvpForm.first_name}_${rsvpForm.last_name}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setDownloading(false);
        }
    };

    // ─── Helpers ────────────────────────────────────────────────────────────────
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':');
        const d = new Date();
        d.setHours(+h, +m);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    // ─── Loading / Not Found ─────────────────────────────────────────────────────
    if (loading || !cdnLoaded) return (
        <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-2 border-[#2d3a3a] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <p className="font-cormorant text-2xl text-[#2d3a3a] tracking-widest">Loading…</p>
            </div>
        </div>
    );

    if (notFound) return (
        <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center px-6">
            <div className="text-center">
                <h1 className="font-cormorant text-6xl text-[#2d3a3a] mb-6">404</h1>
                <p className="text-gray-500 tracking-widest uppercase text-sm">This bridal shower page does not exist.</p>
            </div>
        </div>
    );

    const brideName = event?.bride_name || 'The Bride';
    const initials = brideName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="bg-bsBg text-bsText font-outfit overflow-x-hidden min-h-screen">

            {/* ── NAV ── */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-700 ${isScrolled || isMenuOpen ? 'bg-bsBg/95 backdrop-blur-md py-4 shadow-sm' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-10 flex justify-between items-center">
                    <span className="font-cormorant text-2xl lg:text-3xl font-bold tracking-widest">{initials}</span>
                    <button className="lg:hidden text-bsText z-[1001]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                    <div className={`flex flex-col lg:flex-row gap-8 lg:gap-10 items-center fixed lg:relative top-0 ${isMenuOpen ? 'right-0' : '-right-full'} lg:right-0 w-[80%] lg:w-auto h-screen lg:h-auto bg-white lg:bg-transparent shadow-2xl lg:shadow-none justify-center lg:justify-end transition-all duration-500 z-[1000] lg:z-auto`}>
                        {['#about', '#gallery', '#details'].map(href => (
                            <a key={href} href={href} className="uppercase text-sm tracking-widest font-medium hover:text-bsAccent transition-colors" onClick={() => setIsMenuOpen(false)}>
                                {href.replace('#', '')}
                            </a>
                        ))}
                        <a href="#rsvp" className="bg-bsPrimary text-white px-8 py-3 rounded-sm uppercase text-xs tracking-widest font-medium hover:bg-opacity-90 transition-all" onClick={() => setIsMenuOpen(false)}>RSVP</a>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section id="about" className="min-h-screen flex flex-col lg:flex-row items-center pt-32 lg:pt-0 px-6 lg:px-[10%] gap-10 lg:gap-[5%] bg-[radial-gradient(at_0%_0%,rgba(197,160,89,0.05)_0px,transparent_50%),radial-gradient(at_100%_100%,rgba(45,58,58,0.05)_0px,transparent_50%)]">
                <div className="flex-1 z-10 text-left w-full">
                    <div className="uppercase tracking-[4px] text-sm text-bsAccent mb-5">Celebrating Love</div>
                    <h1 className="font-cormorant text-7xl lg:text-[8rem] leading-none lg:leading-[0.85] mb-5 font-light capitalize">
                        The <br />Bridal <br />Shower
                    </h1>
                    <p className="text-lg text-gray-500 mb-10">Honoring the beautiful bride-to-be</p>
                    <div className="font-cormorant text-5xl lg:text-6xl italic mb-5">{brideName}</div>
                    {event?.date && (
                        <div className="text-xl lg:text-2xl tracking-[4px] mb-12">
                            {new Date(event.date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, ' . ')}
                        </div>
                    )}
                    <a href="#rsvp" className="inline-block bg-bsPrimary text-white px-10 py-4 lg:py-5 uppercase tracking-widest text-sm hover:-translate-y-1 hover:bg-bsAccent transition-all duration-300">
                        Save Your Seat
                    </a>
                </div>
                <div className="flex-[1.4] w-full h-[60vh] lg:h-[85vh] relative flex gap-3 lg:gap-5 items-stretch p-2">
                    {/* Primary Sharp Image */}
                    <div className="flex-[1.2] relative overflow-hidden">
                        <img
                            src={slides[0]}
                            alt={brideName}
                            className="w-full h-full object-cover rounded-[1px] grayscale-[0.3] hover:grayscale-0 transition-all duration-1000 ease-in-out scale-100 hover:scale-[1.03]"
                        />
                        {/* Elegant overlay border */}
                        <div className="absolute inset-3 border border-white/30 rounded-[1px] pointer-events-none"></div>
                    </div>

                    {/* Secondary Sharp Image */}
                    <div className="flex-[0.8] relative overflow-hidden hidden sm:block">
                        <img
                            src={slides[1] || slides[0]}
                            alt={brideName}
                            className="w-full h-full object-cover rounded-[1px] grayscale-[0.3] hover:grayscale-0 transition-all duration-1000 ease-in-out scale-100 hover:scale-[1.03]"
                        />
                        {/* Minimalist Caption tag */}
                        <div className="absolute top-0 left-0 bg-white/90 px-4 py-2 text-[10px] uppercase tracking-[4px] font-medium text-bsPrimary rounded-br-[1px]">
                            Portrait
                        </div>
                    </div>

                    {/* Geometric Detail */}
                    <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] border border-gray-100/50 pointer-events-none"></div>
                </div>
            </section>

            {/* ── COUNTDOWN ── */}
            <section className="py-24 lg:py-36 bg-bsPrimary text-white text-center">
                <div className="max-w-5xl mx-auto px-5">
                    <h2 className="font-cormorant text-4xl lg:text-6xl mb-16">Counting the Days</h2>
                    <div className="flex justify-between w-full max-w-sm mx-auto lg:max-w-none lg:justify-center gap-4 lg:gap-20">
                        {[['Days', timeLeft.days], ['Hours', timeLeft.hours], ['Mins', timeLeft.minutes], ['Secs', timeLeft.seconds]].map(([label, val]) => (
                            <div key={label} className="flex flex-col items-center">
                                <span className="font-cormorant text-4xl lg:text-7xl leading-none">{val}</span>
                                <label className="uppercase tracking-[2px] lg:tracking-[3px] text-[10px] lg:text-sm text-bsAccent mt-2">{label}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── GALLERY SLIDER ── */}
            <section id="gallery" className="py-24 lg:py-32 bg-bsBg">
                <div className="text-center mb-16">
                    <h2 className="font-cormorant text-4xl lg:text-6xl">Memories in the Making</h2>
                </div>
                <div className="relative w-full h-[50vh] lg:h-[70vh] flex items-center justify-center overflow-hidden py-10">
                    <button className="absolute left-5 lg:left-10 top-1/2 -translate-y-1/2 bg-bsPrimary/80 text-white p-2 lg:p-3 cursor-pointer z-30 hover:bg-bsPrimary transition-all rounded-full" onClick={prevSlide}>
                        <ChevronLeft size={24} strokeWidth={1.5} />
                    </button>
                    <div className="w-full h-full relative flex items-center justify-center">
                        {slides.map((img, index) => {
                            let offset = index - currentSlide;
                            if (offset < -1) offset += slides.length;
                            if (offset > 1) offset -= slides.length;
                            const isActive = offset === 0;
                            const isPrev = offset === -1 || (currentSlide === 0 && index === slides.length - 1);
                            const isNext = offset === 1 || (currentSlide === slides.length - 1 && index === 0);
                            let cls = "opacity-0 scale-50 z-0 pointer-events-none";
                            if (isActive) cls = "opacity-100 scale-100 z-20 translate-x-0 shadow-2xl";
                            else if (isPrev) cls = "opacity-60 scale-[0.8] z-10 -translate-x-[60%] lg:-translate-x-[45%] cursor-pointer";
                            else if (isNext) cls = "opacity-60 scale-[0.8] z-10 translate-x-[60%] lg:translate-x-[45%] cursor-pointer";
                            return (
                                <div key={index}
                                    className={`absolute w-[85%] lg:w-[60%] h-[45vh] lg:h-[65vh] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] rounded-[1px] overflow-hidden ${cls}`}
                                    onClick={() => { if (isPrev) prevSlide(); if (isNext) nextSlide(); }}>
                                    <img src={img} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                                    {!isActive && <div className="absolute inset-0 bg-black/10 transition-colors duration-700"></div>}
                                </div>
                            );
                        })}
                    </div>
                    <button className="absolute right-5 lg:right-10 top-1/2 -translate-y-1/2 bg-bsPrimary/80 text-white p-2 lg:p-3 cursor-pointer z-30 hover:bg-bsPrimary transition-all rounded-full" onClick={nextSlide}>
                        <ChevronRight size={24} strokeWidth={1.5} />
                    </button>
                    {/* Dots */}
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                        {slides.map((_, i) => (
                            <button key={i} onClick={() => setCurrentSlide(i)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-bsPrimary w-5' : 'bg-white/50'}`} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── DETAILS ── */}
            <section id="details" className="pt-0 lg:pt-40 bg-bsBg">
                <div className="max-w-7xl mx-auto px-5 lg:px-10">
                    <div className="flex flex-col lg:flex-row gap-16 lg:gap-0 border-t border-b border-gray-200/60 py-20 lg:py-28">

                        {/* When & Where */}
                        <div className="flex-1 lg:pr-24 lg:border-r border-gray-200/60 flex flex-col justify-center">
                            <h2 className="font-cormorant text-5xl lg:text-7xl mb-14 font-light text-bsPrimary">The Details</h2>
                            <div className="flex gap-8 mb-14">
                                <div className="mt-2"><Calendar className="text-bsAccent w-7 h-7" strokeWidth={1} /></div>
                                <div>
                                    <h4 className="uppercase tracking-[4px] text-xs text-gray-400 mb-3 font-semibold">When</h4>
                                    <p className="text-3xl font-cormorant text-bsPrimary mb-2">{formatDate(event?.date)}</p>
                                    {event?.time && <p className="text-gray-500 tracking-wide">at {formatTime(event.time)}</p>}
                                </div>
                            </div>
                            <div className="flex gap-8">
                                <div className="mt-2"><MapPin className="text-bsAccent w-7 h-7" strokeWidth={1} /></div>
                                <div>
                                    <h4 className="uppercase tracking-[4px] text-xs text-gray-400 mb-3 font-semibold">Where</h4>
                                    <p className="text-3xl font-cormorant text-bsPrimary mb-2">{event?.venue_name || 'Venue'}</p>
                                    {event?.venue_address && <p className="text-gray-500 tracking-wide">{event.venue_address}</p>}
                                </div>
                            </div>

                            {event?.dress_code && (
                                <div className="flex gap-8 mt-14">
                                    <div className="mt-2"><Shirt className="text-bsAccent w-7 h-7" strokeWidth={1} /></div>
                                    <div>
                                        <h4 className="uppercase tracking-[4px] text-xs text-gray-400 mb-3 font-semibold">Dress Code</h4>
                                        <p className="text-3xl font-cormorant text-bsPrimary mb-2">{event.dress_code}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Registry */}
                        <div className="flex-1 lg:pl-24 flex flex-col justify-center">
                            <h2 className="font-cormorant text-5xl lg:text-7xl mb-14 font-light text-bsPrimary">Registry</h2>
                            <div className="flex gap-8">
                                <div className="mt-2"><Gift className="text-bsAccent w-7 h-7" strokeWidth={1} /></div>
                                <div className="w-full">
                                    <h4 className="uppercase tracking-[4px] text-xs text-gray-400 mb-3 font-semibold">Gifts</h4>
                                    <p className="text-xl font-cormorant text-bsPrimary mb-8 leading-relaxed">
                                        Your presence is the greatest gift. However, for those who wish to honour us, you may use the details below.
                                    </p>
                                    <div className="flex flex-col gap-6 w-full">
                                        {event?.registry_items?.length > 0 ? event.registry_items.map((item, i) => (
                                            <div key={i} className="border border-gray-200 p-6">
                                                <h5 className="uppercase tracking-[3px] text-xs font-bold mb-4 text-bsAccent">{item.type}</h5>
                                                {item.provider && <p className="text-gray-600 text-sm mb-2"><span className="font-semibold text-bsPrimary">Bank/Provider: </span>{item.provider}</p>}
                                                {item.accountName && <p className="text-gray-600 text-sm mb-2"><span className="font-semibold text-bsPrimary">Account Name: </span>{item.accountName}</p>}
                                                {item.accountNumber && <p className="text-gray-600 text-sm"><span className="font-semibold text-bsPrimary">Account/Phone: </span>{item.accountNumber}</p>}
                                            </div>
                                        )) : (
                                            <div className="border border-dashed border-gray-200 p-6 text-center text-gray-400 text-sm tracking-widest">Registry details coming soon</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map */}
                {event?.map_location && (
                    <div className="w-full h-[50vh] lg:h-[60vh] mt-20">
                        <iframe
                            src={event.map_location}
                            width="100%" height="100%"
                            style={{ border: 0 }}
                            allowFullScreen="" loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Event Location"
                        />
                    </div>
                )}
            </section>

            {/* ── RSVP ── */}
            <section id="rsvp" className="py-16 lg:py-24 bg-bsBg px-6 relative">
                <div className="max-w-6xl mx-auto bg-white p-6 lg:p-16 border border-gray-100 shadow-[0_40px_80px_rgba(0,0,0,0.05)] relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-bsAccent"></div>
                    <div className="text-center mb-20">
                        <h2 className="font-cormorant text-5xl lg:text-7xl mb-6 font-light text-bsPrimary">Will you attend?</h2>
                        {event?.rsvp_deadline && (
                            <p className="text-gray-500 tracking-widest uppercase text-xs">
                                Kindly respond by {formatDate(event.rsvp_deadline)}
                            </p>
                        )}
                    </div>

                    {rsvpStatus === 'success' ? (
                        <div>
                            {/* ── DOWNLOADABLE CARD (captured by html2canvas) ── */}
                            <div ref={cardRef} className="bg-white px-2 lg:px-6 py-2 lg:py-4">

                                {/* Landscape Ticket Container */}
                                <div className="flex flex-col lg:flex-row border border-gray-100 rounded-sm overflow-hidden">

                                    {/* Left Side: Main Pass Info */}
                                    <div className="flex-[1.8] p-6 lg:p-8 bg-white relative">
                                        <div className="flex items-center gap-5 mb-5">
                                            <div className="w-14 h-14 rounded-full border-2 border-bsAccent flex items-center justify-center bg-bsBg shrink-0">
                                                <span className="font-cormorant text-lg font-bold text-bsPrimary">{initials}</span>
                                            </div>
                                            <div>
                                                <h2 className="uppercase tracking-[3px] text-[9px] text-bsAccent font-bold">Attendance Card</h2>
                                                <p className="text-gray-400 text-[8px] tracking-[2px] uppercase">Entrance Pass</p>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <h3 className="font-cormorant text-3xl lg:text-4xl font-light text-bsPrimary mb-1">
                                                {rsvpForm.first_name} {rsvpForm.last_name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <div className="h-[1px] w-5 bg-bsAccent/30"></div>
                                                {rsvpForm.attending === 'yes' ? (
                                                    <span className="text-[8px] uppercase tracking-[2px] text-emerald-600 font-bold">Joyfully Attending</span>
                                                ) : (
                                                    <span className="text-[8px] uppercase tracking-[2px] text-rose-600 font-bold">Unable to Attend</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-bsPrimary text-[11px] font-medium italic">Present at entrance</p>
                                            {rsvpForm.id && (
                                                <p className="text-[8px] text-gray-300 tracking-[1px] uppercase font-mono">#{rsvpForm.id.split('-')[0].toUpperCase()}-{initials}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Vertical Divider (Dashed) */}
                                    <div className="hidden lg:flex flex-col items-center relative py-6">
                                        <div className="absolute top-0 -translate-y-1/2 w-6 h-6 rounded-full bg-bsBg border-b border-gray-100"></div>
                                        <div className="h-full border-l border-dashed border-gray-200"></div>
                                        <div className="absolute bottom-0 translate-y-1/2 w-6 h-6 rounded-full bg-bsBg border-t border-gray-100"></div>
                                    </div>

                                    {/* Right Side: Event Stub */}
                                    <div className="flex-1 p-6 lg:p-8 bg-[#fdfbf7] lg:border-l border-gray-100 flex flex-col justify-center">
                                        <div className="space-y-4">
                                            <div>
                                                <p className="uppercase tracking-[2px] text-[8px] text-gray-400 mb-1">When</p>
                                                <p className="font-cormorant text-base text-bsPrimary leading-tight">
                                                    {event?.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="uppercase tracking-[2px] text-[8px] text-gray-400 mb-1">Where</p>
                                                <p className="font-cormorant text-base text-bsPrimary leading-tight">{event?.venue_name || 'The Venue'}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-gray-100 lg:border-none lg:pt-0 lg:mt-6">
                                            <div className="text-center lg:text-left">
                                                <p className="text-[8px] uppercase tracking-[3px] text-bsAccent font-bold">Show at Entry</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Note */}
                                <p className="text-center text-gray-400 text-sm tracking-wide leading-relaxed">
                                    Thank you, <span className="text-bsPrimary font-medium">{rsvpForm.first_name}</span>. We'll be in touch shortly.
                                </p>

                                {/* Bottom accent */}
                                <div className="flex items-center justify-center gap-4 mt-10">
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-bsAccent/40"></div>
                                    <span className="text-bsAccent/50 text-lg">♡</span>
                                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-bsAccent/40"></div>
                                </div>
                            </div>

                            {/* Download button — outside captured area */}
                            <div className="text-center mt-6">
                                <button
                                    onClick={downloadCard}
                                    disabled={downloading}
                                    className="inline-flex items-center gap-3 border border-bsAccent text-bsPrimary px-10 py-4 text-xs uppercase tracking-[4px] hover:bg-bsPrimary hover:text-white hover:border-bsPrimary transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                >
                                    {downloading ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                            </svg>
                                            Preparing…
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download Attendance Card
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-10 lg:px-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <input type="text" placeholder="First Name" required value={rsvpForm.first_name} onChange={e => setRsvpForm(p => ({ ...p, first_name: e.target.value }))}
                                    className="w-full pb-4 border-b border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 outline-none focus:border-bsPrimary transition-colors text-lg" />
                                <input type="text" placeholder="Last Name" required value={rsvpForm.last_name} onChange={e => setRsvpForm(p => ({ ...p, last_name: e.target.value }))}
                                    className="w-full pb-4 border-b border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 outline-none focus:border-bsPrimary transition-colors text-lg" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <input type="tel" placeholder="Phone Number" value={rsvpForm.phone} onChange={e => setRsvpForm(p => ({ ...p, phone: e.target.value }))}
                                    className="w-full pb-4 border-b border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 outline-none focus:border-bsPrimary transition-colors text-lg" />
                                <input type="email" placeholder="Email Address" value={rsvpForm.email} onChange={e => setRsvpForm(p => ({ ...p, email: e.target.value }))}
                                    className="w-full pb-4 border-b border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 outline-none focus:border-bsPrimary transition-colors text-lg" />
                            </div>
                            <select required value={rsvpForm.attending} onChange={e => setRsvpForm(p => ({ ...p, attending: e.target.value }))}
                                className="w-full pb-4 border-b border-gray-200 bg-transparent text-gray-800 outline-none focus:border-bsPrimary transition-colors text-lg appearance-none cursor-pointer">
                                <option value="" disabled>Attendance Status</option>
                                <option value="yes">Joyfully Accept</option>
                                <option value="no">Regretfully Decline</option>
                            </select>
                            {/* <textarea placeholder="Leave a message for the Bride…" value={rsvpForm.message} onChange={e => setRsvpForm(p => ({ ...p, message: e.target.value }))}
                                className="w-full h-24 pb-4 border-b border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 outline-none focus:border-bsPrimary transition-colors resize-y text-lg" />
                            {rsvpStatus === 'error' && <p className="text-red-500 text-sm text-center">Something went wrong. Please try again.</p>} */}
                            <div className="text-center mt-8">
                                <button type="submit" disabled={rsvpStatus === 'sending'}
                                    className="bg-bsPrimary text-white px-12 py-5 text-xs uppercase tracking-[4px] cursor-pointer inline-flex items-center justify-center gap-4 hover:bg-bsAccent transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                                    {rsvpStatus === 'sending' ? 'Sending…' : 'Send Reply'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="py-16 text-center bg-white text-sm tracking-widest text-gray-400">
                <p>&copy; {new Date().getFullYear()} {brideName}'s Bridal Shower. Designed with love.</p>
            </footer>
        </div>
    );
};

export default BridalShower;
