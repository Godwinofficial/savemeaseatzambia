import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Link, useSearchParams, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import defaultMusic from '../../assets/music/music.mp3';
import logoImg from '../../assets/images/logo1.png';
import AuthModal from '../../components/AuthModal';
import { saveDraft, loadDraft, clearDraft, isDraftMeaningful, getDraftAge, pushDraftToUserAccount } from '../../utils/draftManager';
import {
    calculatePricing,
    formatKwacha,
    calculateBalanceDue,
    PAYMENT_PHONE_NUMBER,
    PAYMENT_PHONE_RAW,
    PAYMENT_ACCOUNT_NAME,
    PAYMENT_MOBILE_NETWORK,
    PAYMENT_BANK_NAME,
    PAYMENT_BANK_ACCOUNT,
    PAYMENT_BANK_BRANCH,
    PRICING_TIERS
} from '../../utils/pricing';
import './ClientCreateWedding.css';

// ─── Story Presets ────────────────────────────────────────────────────────────
const PROPOSAL_STORIES = [
    "Under a canopy of stars on a quiet evening by the lake, with soft waves lapping at the shore, a whispered question changed our lives forever. With happy tears and racing hearts, saying yes was the easiest decision ever made.",
    "During a weekend getaway surrounded by scenic mountain views, what seemed like a casual sunset walk turned into the most breathtaking surprise. Dropping to one knee with the ring shining in the golden hour light, our forever began right there.",
    "On the exact anniversary of our very first date at our favorite quiet cafe, a scrapbook of our fondest memories was handed over. On the last page was written: 'Will you marry me?' An unforgettable, heartfelt yes followed instantly.",
    "On a cozy rainy Sunday morning over homemade coffee and breakfast, with laughter filling the kitchen, a velvet box was placed on the table with words spoken straight from the heart. Pure, simple, and perfectly us.",
    "Underneath the dazzling city lights at a rooftop garden overlooking the skyline, a surprise serenade played in the background as the question was popped. It felt as if time stood completely still."
];
const HOW_WE_MET_STORIES = [
    "Our story began with an unexpected encounter and a simple smile across a crowded room. What started as casual conversation quickly turned into hours of talking, realizing we had found someone truly extraordinary.",
    "A mutual friend's gathering brought us together on a warm summer evening. A shared laugh over a silly joke sparked a connection that neither of us saw coming, but both of us knew was special.",
    "We crossed paths unexpectedly on a rainy afternoon, sharing an umbrella and endless conversation. From that spontaneous moment onward, we knew our lives were destined to intertwine."
];
const SPECIAL_QUOTES = [
    "\u201cIn your eyes, I found my home. In your heart, I found my love. In your soul, I found my mate.\u201d",
    "\u201cYou are my today and all of my tomorrows.\u201d \u2014 Leo Christopher",
    "\u201cWhatever our souls are made of, his and mine are the same.\u201d \u2014 Emily Bront\u00eb",
    "\u201cI have found the one whom my soul loves.\u201d \u2014 Song of Solomon 3:4",
    "\u201cEvery love story is beautiful, but ours is my favorite.\u201d"
];

// ─── Template Options ─────────────────────────────────────────────────────────
const TEMPLATE_OPTIONS = [
    { id: 1, name: 'Default Elegance', badge: 'Popular', desc: 'Timeless monochrome with crisp serif typography.', bg: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', accent: '#c5a059', textColor: '#ffffff', ornament: '♡' },
    { id: 2, name: 'Tropical Elegance', badge: 'Vibrant', desc: 'Deep emerald greens with lush botanical accents.', bg: 'linear-gradient(135deg, #0b221a 0%, #13392d 100%)', accent: '#34d399', textColor: '#ecfdf5', ornament: '🌿' },
    { id: 3, name: 'Golden Romance', badge: 'Luxury', desc: 'Warm champagne gold with royal candlelight vibes.', bg: 'linear-gradient(135deg, #2a2012 0%, #45341c 100%)', accent: '#e6ca85', textColor: '#fffaf0', ornament: '✦' },
    { id: 7, name: 'Botanical Olive', badge: 'Minimal', desc: 'Earthy olive tones and clean organic minimalism.', bg: 'linear-gradient(135deg, #252e24 0%, #3e4a3b 100%)', accent: '#a3b18a', textColor: '#f4f6f0', ornament: '❀' },
    { id: 8, name: 'Terracotta Earth', badge: 'Warm', desc: 'Warm terracotta and desert rose for romantic events.', bg: 'linear-gradient(135deg, #3d1f19 0%, #68362d 100%)', accent: '#f87171', textColor: '#fff5f5', ornament: '✧' },
    { id: 9, name: 'Modern Classic', badge: 'Editorial', desc: 'Warm ivory, gold accents, and bespoke serif typography.', bg: 'linear-gradient(135deg, #1A1A1A 0%, #2A2521 100%)', accent: '#C9A86A', textColor: '#FFFCF8', ornament: '✦' }
];

// ─── Music Tracks ─────────────────────────────────────────────────────────────
const MUSIC_TRACKS = [
    { url: defaultMusic, label: 'SaveMeASeat Wedding Soundtrack', artist: 'Default', mood: 'Soft & Romantic (Recommended)' },
    { url: 'https://archive.org/download/100ClassicalMusicMasterpieces/1698%20Pachelbel%20%2C%20Canon%20in%20D.mp3', label: 'Canon in D', artist: 'Pachelbel', mood: 'Classic Wedding Strings' },
    { url: 'https://archive.org/download/100ClassicalMusicMasterpieces/1847%20Liszt%20-%20Liebestraum%20No.3%20in%20A%20flat.mp3', label: 'Liebestraum (Love Dream)', artist: 'Liszt', mood: 'Sweet Wedding Piano' },
    { url: 'https://archive.org/download/100ClassicalMusicMasterpieces/1838%20Schumann%20-%20Traumerei.mp3', label: 'Träumerei (Dreaming)', artist: 'Schumann', mood: 'Soft Romantic Piano' },
    { url: 'https://archive.org/download/100ClassicalMusicMasterpieces/1727%20Bach%20%2C%20Air%20%28from%20Orchestral%20Suite%20No.%203%20in%20D%29.mp3', label: 'Air on the G String', artist: 'J.S. Bach', mood: 'Soft Elegant Strings' },
    { url: 'https://archive.org/download/100ClassicalMusicMasterpieces/1843%20Mendelssohn%20-%20Wedding%20March%2C%20from%20%27A%20Midsummer%20Night%27s%20Dream%27.mp3', label: 'Traditional Wedding March', artist: 'Mendelssohn', mood: 'Grand Processional' },
    { url: 'https://archive.org/download/100ClassicalMusicMasterpieces/1825%20Schubert%20-%20Ave%20Maria.mp3', label: 'Ave Maria', artist: 'Schubert', mood: 'Serene & Peaceful' },
    { url: 'https://archive.org/download/100ClassicalMusicMasterpieces/1810%20Beethoven-%20Fur%20Elise.mp3', label: 'Für Elise', artist: 'Beethoven', mood: 'Gentle Solo Piano' },
];

// ─── Dress Color Presets ──────────────────────────────────────────────────────
const DRESS_COLOR_PRESETS = [
    { name: 'Emerald Green', hex: '#1fa09b' }, { name: 'Champagne Gold', hex: '#c5a059' },
    { name: 'Burgundy', hex: '#881337' }, { name: 'Royal Navy', hex: '#1e3a8a' },
    { name: 'Blush Pink', hex: '#f472b6' }, { name: 'Terracotta', hex: '#ea580c' },
    { name: 'Classic Black', hex: '#000000' }, { name: 'Pearl White', hex: '#f8f8f0' },
    { name: 'Dusty Rose', hex: '#dcb5b0' }, { name: 'Sage Green', hex: '#7d9e7d' },
];

// ─── Default Form State ───────────────────────────────────────────────────────
const DEFAULT_FORM = {
    cover_image: '',
    groom_name: '', groom_image: '', groom_description: '',
    bride_name: '', bride_image: '', bride_description: '',
    tagline: '',
    date: '', location: '',
    ceremony_date: '', ceremony_time: '', ceremony_venue: '', ceremony_address: '',
    ceremony_title: 'Church Service', ceremony_subtitle: 'Marriage Blessings',
    program: [],
    reception_date: '', reception_time: '', reception_venue: '', reception_address: '',
    reception_title: '', reception_subtitle: '',
    rsvp_deadline: '',
    venue_name: '', venue_address: '', map_location: '',
    story_part1: '',
    story_highlight: '',
    story_part2: '',
    dress_code: '',
    dress_code_desc: '',
    dress_code_colors: [],
    extra_card_text: '',
    template_id: 1,
    theme_colors: [],
    music_url: '',
    hero_video_url: '',
    slider_images: [],
    gallery_images: [],
    bridesmaids: [],
    groomsmen: [],
    gifts: [],
    allowed_guests: ['1', '2'],
    guest_count: 100,
    show_gallery_titles: true,
};

// ─── NavBar with Avatar Dropdown ──────────────────────────────────────────────
const NavBar = ({ user, onSignIn, showExit }) => {
    const [dropOpen, setDropOpen] = React.useState(false);
    const dropRef = React.useRef(null);

    React.useEffect(() => {
        const close = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const getInitials = (u) => {
        if (!u) return '?';
        const meta = u.user_metadata;
        if (meta?.full_name) return meta.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return (u.email || '??').slice(0, 2).toUpperCase();
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <nav className="client-studio-nav">
            <div className="studio-nav-container">
                <Link to="/" className="studio-brand">
                    <img src={logoImg} alt="SaveMeASeat" />
                </Link>
                <div className="studio-nav-actions">
                    {user ? (
                        <div className="avatar-dropdown-wrap" ref={dropRef}>
                            <button
                                type="button"
                                className="avatar-circle-btn"
                                onClick={() => setDropOpen(o => !o)}
                                aria-label="Account menu"
                            >
                                {getInitials(user)}
                            </button>
                            {dropOpen && (
                                <div className="avatar-dropdown-menu">
                                    <div className="avatar-drop-email" title={user.email}>
                                        {user.email}
                                    </div>
                                    <Link to="/my-events" className="avatar-drop-item" onClick={() => setDropOpen(false)}>
                                        <i className="fas fa-th-large" /> My Events
                                    </Link>
                                    <button type="button" className="avatar-drop-item avatar-drop-signout" onClick={handleSignOut}>
                                        <i className="fas fa-sign-out-alt" /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : onSignIn ? (
                        <button type="button" className="studio-nav-link" onClick={onSignIn} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                            <i className="fas fa-sign-in-alt" /> Sign In
                        </button>
                    ) : null}
                </div>
            </div>
        </nav>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ClientCreateWedding = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { slug: routeSlug } = useParams();
    const queryEditSlug = searchParams.get('edit');
    const editSlug = routeSlug || queryEditSlug;
    const isEditMode = Boolean(editSlug);

    const iframeRef = useRef(null);
    const previewAudioRef = useRef(null);
    const saveTimerRef = useRef(null);

    const prefill = location.state?.prefill || {};
    const isRestoreRedirect = searchParams.get('draft') === 'restore';

    // Auth
    const [currentUser, setCurrentUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Edit Mode State
    const [existingEvent, setExistingEvent] = useState(null);
    const [editLoading, setEditLoading] = useState(isEditMode);
    const [saveToast, setSaveToast] = useState('');

    // UI
    const [currentStep, setCurrentStep] = useState(0);
    const [validationErrors, setValidationErrors] = useState({});
    const [stepErrorBanner, setStepErrorBanner] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [publishError, setPublishError] = useState('');
    const [publishedWedding, setPublishedWedding] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    // Draft
    const [draftRestored, setDraftRestored] = useState(false);
    const [draftAge, setDraftAge] = useState(null);
    const [draftDismissed, setDraftDismissed] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    // Music
    const [musicTab, setMusicTab] = useState('curated');
    const [previewingUrl, setPreviewingUrl] = useState(null);
    const [musicSearchQuery, setMusicSearchQuery] = useState('');
    const [musicSearchResults, setMusicSearchResults] = useState([]);
    const [isSearchingMusic, setIsSearchingMusic] = useState(false);
    const [musicSearchError, setMusicSearchError] = useState(null);
    const [selectedSongMeta, setSelectedSongMeta] = useState(null);

    // Map
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [addressQuery, setAddressQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchingMap, setIsSearchingMap] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);
    const [markerInstance, setMarkerInstance] = useState(null);
    const [leafletLoaded, setLeafletLoaded] = useState(false);

    // Form state
    const [formData, setFormData] = useState(() => {
        const base = { ...DEFAULT_FORM };
        if (prefill.groom_name) base.groom_name = prefill.groom_name;
        if (prefill.bride_name) base.bride_name = prefill.bride_name;
        if (prefill.date) { base.date = prefill.date; base.ceremony_date = prefill.date; base.reception_date = prefill.date; }
        if (prefill.venue_city) { base.location = prefill.venue_city; }
        return base;
    });

    // ── Auth check ───────────────────────────────────────────────────────────
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setCurrentUser(user);
            setAuthChecked(true);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // ── Edit Mode: Load existing event from DB ────────────────────────────────
    useEffect(() => {
        if (!authChecked || !isEditMode) return;
        if (!currentUser) {
            setShowAuthModal(true);
            return;
        }

        const fetchExistingEvent = async () => {
            setEditLoading(true);
            setPublishError('');
            try {
                const { data, error: fetchErr } = await supabase
                    .from('weddings')
                    .select('*')
                    .eq('slug', editSlug)
                    .eq('user_id', currentUser.id)
                    .single();

                if (fetchErr || !data) {
                    throw new Error(fetchErr?.message || "Event not found or you don't have permission to edit it.");
                }

                setExistingEvent(data);
                setFormData(prev => ({
                    ...prev,
                    ...data,
                    guest_count: data.guest_count || 100,
                    date: data.date ? data.date.slice(0, 10) : '',
                    ceremony_date: data.ceremony_date ? data.ceremony_date.slice(0, 10) : (data.date ? data.date.slice(0, 10) : ''),
                    reception_date: data.reception_date ? data.reception_date.slice(0, 10) : (data.date ? data.date.slice(0, 10) : ''),
                    rsvp_deadline: data.rsvp_deadline ? data.rsvp_deadline.slice(0, 10) : '',
                    bridesmaids: Array.isArray(data.bridesmaids) ? data.bridesmaids : [],
                    groomsmen: Array.isArray(data.groomsmen) ? data.groomsmen : [],
                    gifts: Array.isArray(data.gifts) ? data.gifts : [],
                    allowed_guests: data.allowed_guests || ['1', '2'],
                    slider_images: Array.isArray(data.slider_images) ? data.slider_images : [],
                    gallery_images: Array.isArray(data.gallery_images) ? data.gallery_images : [],
                    dress_code_colors: Array.isArray(data.dress_code_colors) ? data.dress_code_colors : [],
                    theme_colors: Array.isArray(data.theme_colors) ? data.theme_colors : [],
                    ceremony_title: data.ceremony_title || (() => {
                        const rawTheme = data.theme_colors;
                        if (rawTheme) {
                            try {
                                const parsed = typeof rawTheme === 'string' ? JSON.parse(rawTheme) : rawTheme;
                                const found = Array.isArray(parsed) ? parsed.find(c => typeof c === 'string' && c.startsWith("CEREMONY_TITLE:")) : null;
                                if (found) return found.substring("CEREMONY_TITLE:".length);
                            } catch (e) { }
                        }
                        return 'Church Service';
                    })(),
                    ceremony_subtitle: data.ceremony_subtitle || (() => {
                        const rawTheme = data.theme_colors;
                        if (rawTheme) {
                            try {
                                const parsed = typeof rawTheme === 'string' ? JSON.parse(rawTheme) : rawTheme;
                                const found = Array.isArray(parsed) ? parsed.find(c => typeof c === 'string' && c.startsWith("CEREMONY_SUBTITLE:")) : null;
                                if (found) return found.substring("CEREMONY_SUBTITLE:".length);
                            } catch (e) { }
                        }
                        return 'Marriage Blessings';
                    })(),
                    program: (() => {
                        if (data.program) {
                            try {
                                const p = typeof data.program === 'string' ? JSON.parse(data.program) : data.program;
                                if (Array.isArray(p)) return p;
                            } catch (e) { }
                        }
                        const rawTheme = data.theme_colors;
                        if (rawTheme) {
                            try {
                                const parsed = typeof rawTheme === 'string' ? JSON.parse(rawTheme) : rawTheme;
                                const found = Array.isArray(parsed) ? parsed.find(c => typeof c === 'string' && c.startsWith("PROGRAM:")) : null;
                                if (found) {
                                    const parsedProg = JSON.parse(found.substring("PROGRAM:".length));
                                    if (Array.isArray(parsedProg)) return parsedProg;
                                }
                            } catch (e) { }
                        }
                        return [];
                    })(),
                }));
            } catch (err) {
                console.error('Error fetching event for edit:', err);
                setPublishError(err.message || 'Failed to load event details.');
            } finally {
                setEditLoading(false);
            }
        };

        fetchExistingEvent();
    }, [authChecked, currentUser, isEditMode, editSlug]);

    // ── Draft restoration (Create mode only) ──────────────────────────────────
    useEffect(() => {
        if (!authChecked || isEditMode) return;

        // If returning from email confirmation redirect
        if (isRestoreRedirect && isDraftMeaningful()) {
            const saved = loadDraft();
            if (saved) {
                setFormData(saved.formData);
                setDraftAge(getDraftAge());
                setDraftRestored(true);
                if (currentUser) {
                    saveDraftToDatabase(currentUser, saved.formData);
                }
            }
            return;
        }

        const hasPrefill = Object.keys(prefill).length > 0;
        if (!hasPrefill && isDraftMeaningful()) {
            const saved = loadDraft();
            if (saved) {
                setFormData(saved.formData);
                setDraftAge(getDraftAge());
                setDraftRestored(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authChecked, currentUser, isRestoreRedirect, isEditMode]);

    // ── Auto-save draft (Create mode only) ────────────────────────────────────
    useEffect(() => {
        if (isEditMode) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => { saveDraft(formData); setLastSaved(new Date()); }, 700);
        return () => clearTimeout(saveTimerRef.current);
    }, [formData, isEditMode]);

    // ── Leaflet map ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css'; link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        if (!window.L) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true;
            script.onload = () => setLeafletLoaded(true);
            document.body.appendChild(script);
        } else { setLeafletLoaded(true); }
    }, []);

    useEffect(() => {
        if (leafletLoaded && !mapInstance && document.getElementById('leaflet-map-container') && isMapOpen) {
            const L = window.L;
            const map = L.map('leaflet-map-container').setView([-15.3875, 28.3228], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
            const marker = L.marker([-15.3875, 28.3228], { draggable: true }).addTo(map);
            marker.on('dragend', () => { const { lat, lng } = marker.getLatLng(); updateMapLocation(lat, lng); });
            map.on('click', (e) => { marker.setLatLng(e.latlng); updateMapLocation(e.latlng.lat, e.latlng.lng); });
            setMapInstance(map); setMarkerInstance(marker);
            setTimeout(() => map.invalidateSize(), 100);
        }
    }, [leafletLoaded, isMapOpen]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (addressQuery.length > 2) {
                setIsSearchingMap(true);
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery + ', Zambia')}&addressdetails=1&limit=8&countrycodes=zm`);
                    setSearchResults(await res.json());
                } catch { setSearchResults([]); } finally { setIsSearchingMap(false); }
            } else { setSearchResults([]); }
        }, 500);
        return () => clearTimeout(timer);
    }, [addressQuery]);

    const updateMapLocation = (lat, lng) => {
        setFormData(prev => ({ ...prev, map_location: `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed` }));
    };
    const selectMapAddress = (result) => {
        const lat = parseFloat(result.lat), lon = parseFloat(result.lon);
        if (mapInstance && markerInstance) { mapInstance.setView([lat, lon], 16); markerInstance.setLatLng([lat, lon]); }
        updateMapLocation(lat, lon);
        setFormData(prev => ({ ...prev, venue_address: result.display_name }));
        setSearchResults([]); setAddressQuery(result.display_name.split(',')[0]);
    };

    // ── Auto-fill bio helper ─────────────────────────────────────────────────
    const getAutoBio = (type, name) => {
        const n = (name || '').trim() || (type === 'bride' ? 'The bride' : 'The groom');
        if (type === 'bride') return `${n} is a kind, graceful, and loving woman who brings warmth, joy, and heart to every moment. She is admired for her beauty, strength, and the love she shares so effortlessly.`;
        return `${n} is a thoughtful, loyal, and loving man who brings laughter, strength, and heart to every moment. He is admired for his kindness, humor, and the way he makes life feel full of love.`;
    };

    const handlePersonNameChange = (e) => {
        const { name, value } = e.target;
        const bioKey = name === 'bride_name' ? 'bride_description' : 'groom_description';
        const personType = name === 'bride_name' ? 'bride' : 'groom';
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
            setStepErrorBanner('');
        }
        setFormData(prev => {
            const prevBio = getAutoBio(personType, prev[name]);
            const newBio = getAutoBio(personType, value);
            const shouldUpdate = !prev[bioKey] || prev[bioKey] === prevBio;
            return { ...prev, [name]: value, [bioKey]: shouldUpdate ? newBio : prev[bioKey] };
        });
    };

    // ── Image upload helper ──────────────────────────────────────────────────
    // ── Image upload helper ──────────────────────────────────────────────────
    const readFileAsDataUrl = (file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });

    const uploadImage = async (file, path, uploadId) => {
        if (!file) return null;
        setUploadingImage(true);
        if (uploadId) setUploadProgress(prev => ({ ...prev, [uploadId]: 15 }));
        let interval = null;
        try {
            const ext = file.name.split('.').pop() || 'jpg';
            const filePath = `${path}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
            if (uploadId) {
                interval = setInterval(() => {
                    setUploadProgress(prev => {
                        const c = prev[uploadId] || 15;
                        return c < 85 ? { ...prev, [uploadId]: c + 15 } : prev;
                    });
                }, 100);
            }
            const { error } = await supabase.storage.from('wedding-uploads').upload(filePath, file, { upsert: true });
            if (interval) clearInterval(interval);

            if (error) {
                console.warn('Supabase storage upload returned error, falling back to Data URL:', error);
                const dataUrl = await readFileAsDataUrl(file);
                if (uploadId) {
                    setUploadProgress(prev => ({ ...prev, [uploadId]: 100 }));
                    setTimeout(() => setUploadProgress(prev => { const n = { ...prev }; delete n[uploadId]; return n; }), 400);
                }
                return dataUrl || (window.URL ? URL.createObjectURL(file) : null);
            }

            const { data } = supabase.storage.from('wedding-uploads').getPublicUrl(filePath);
            if (uploadId) {
                setUploadProgress(prev => ({ ...prev, [uploadId]: 100 }));
                setTimeout(() => setUploadProgress(prev => { const n = { ...prev }; delete n[uploadId]; return n; }), 400);
            }
            return data.publicUrl;
        } catch (err) {
            console.error('Image upload failed, fallback to Data URL:', err);
            if (interval) clearInterval(interval);
            const dataUrl = await readFileAsDataUrl(file);
            if (uploadId) {
                setUploadProgress(prev => { const n = { ...prev }; delete n[uploadId]; return n; });
            }
            return dataUrl || (window.URL ? URL.createObjectURL(file) : null);
        } finally {
            setUploadingImage(false);
        }
    };

    const ImageUpload = ({ label, value, onUpload, path = 'misc', id, multiple = false, subtitle = '' }) => {
        const uid = id || `upload-${Date.now()}`;
        const prog = uploadProgress[uid] || 0;
        const [isLocalUploading, setIsLocalUploading] = useState(false);

        const handleFileChange = async (e) => {
            const fileList = e.target.files;
            if (!fileList || !fileList.length) return;
            const files = Array.from(fileList);
            e.target.value = ''; // Reset input so re-selection of the same file always triggers onChange

            setIsLocalUploading(true);
            try {
                if (multiple) {
                    setUploadProgress(prev => ({ ...prev, [uid]: 20 }));
                    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
                    if (validFiles.length < files.length) {
                        toast.error('Some files were skipped because they exceed 10MB.');
                    }
                    const uploadedUrls = [];
                    for (let i = 0; i < validFiles.length; i++) {
                        const url = await uploadImage(validFiles[i], path);
                        if (url) uploadedUrls.push(url);
                        setUploadProgress(prev => ({ ...prev, [uid]: Math.round(((i + 1) / validFiles.length) * 100) }));
                    }
                    if (uploadedUrls.length > 0) {
                        onUpload(uploadedUrls);
                        toast.success(`${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} attached successfully!`);
                    }
                    setTimeout(() => setUploadProgress(prev => { const n = { ...prev }; delete n[uid]; return n; }), 400);
                } else {
                    if (files[0].size > 10 * 1024 * 1024) {
                        toast.error('File size exceeds 10MB limit.');
                        return;
                    }
                    const url = await uploadImage(files[0], path, uid);
                    if (url) {
                        onUpload(url);
                        toast.success('Photo attached successfully!');
                    }
                }
            } catch (err) {
                console.error('Upload handler error:', err);
                toast.error('Failed to attach image. Please try again.');
            } finally {
                setIsLocalUploading(false);
            }
        };

        return (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
                {label && <label className="studio-label"><span>{label}</span></label>}
                {subtitle && <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '-0.2rem 0 0.5rem' }}>{subtitle}</p>}
                <div
                    className="studio-upload-box"
                    onClick={() => document.getElementById(uid)?.click()}
                    style={{ minHeight: value && !multiple ? '0' : undefined, cursor: 'pointer' }}
                >
                    <input
                        type="file"
                        id={uid}
                        accept="image/*"
                        multiple={multiple}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    {value && !multiple ? (
                        <div className="uploaded-preview-wrap" style={{ position: 'relative' }}>
                            <img src={value} alt="Preview" className="uploaded-preview-img" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '10px' }} />
                            <div className="uploaded-preview-actions">
                                <button type="button" className="preview-act-btn delete" onClick={e => { e.stopPropagation(); onUpload(''); }}>
                                    <i className="fas fa-trash" /> Remove
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="upload-icon-circle">
                            {(prog > 0 || isLocalUploading) ? (
                                <i className="fas fa-spinner fa-spin" style={{ color: '#1fa09b' }} />
                            ) : (
                                <i className="fas fa-cloud-upload-alt" style={{ color: '#1fa09b' }} />
                            )}
                            <div className="upload-prompt" style={{ marginLeft: '0.75rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.85rem' }}>
                                    {(prog > 0 || isLocalUploading) ? `Attaching ${prog > 0 ? prog + '%' : 'photos...'}...` : multiple ? 'Click or drag to add photos' : 'Click to upload photo'}
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Max 10MB · JPG / PNG / WEBP</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ── List helpers ─────────────────────────────────────────────────────────
    const addItem = (field, init) => setFormData(prev => ({ ...prev, [field]: [...(prev[field] || []), init] }));
    const updateItem = (field, idx, key, val) => setFormData(prev => { const arr = [...(prev[field] || [])]; arr[idx] = { ...arr[idx], [key]: val }; return { ...prev, [field]: arr }; });
    const removeItem = (field, idx) => setFormData(prev => { const arr = [...(prev[field] || [])]; arr.splice(idx, 1); return { ...prev, [field]: arr }; });
    const moveItem = (field, fromIdx, toIdx) => setFormData(prev => {
        const arr = [...(prev[field] || [])];
        if (toIdx < 0 || toIdx >= arr.length) return prev;
        const [moved] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, moved);
        return { ...prev, [field]: arr };
    });

    // ── Music ────────────────────────────────────────────────────────────────
    const togglePreview = (url) => {
        const audio = previewAudioRef.current;
        if (!audio) return;
        if (previewingUrl === url) { audio.pause(); audio.currentTime = 0; setPreviewingUrl(null); }
        else { audio.src = url; audio.play().catch(() => { }); setPreviewingUrl(url); audio.onended = () => setPreviewingUrl(null); }
    };
    const searchOnlineMusic = async (term) => {
        const q = (term || musicSearchQuery).trim();
        if (!q || q.length < 2) return;
        setIsSearchingMusic(true); setMusicSearchError(null);
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=25`);
            const data = await res.json();
            const valid = (data.results || []).filter(r => r.previewUrl);
            setMusicSearchResults(valid);
            if (!valid.length) setMusicSearchError(`No results for "${q}". Try another term.`);
        } catch { setMusicSearchError('Music search failed. Check your connection.'); }
        finally { setIsSearchingMusic(false); }
    };

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
            setStepErrorBanner('');
        }
        setFormData(prev => ({ ...prev, [name]: value, ...(name === 'date' ? { ceremony_date: value, reception_date: value } : {}) }));
    };

    const validateStep = (stepIdx) => {
        if (isEditMode) return true;
        const errors = {};

        if (stepIdx === 0) {
            if (!formData.groom_name?.trim()) {
                errors.groom_name = "Groom's full name is required";
            }
            if (!formData.bride_name?.trim()) {
                errors.bride_name = "Bride's full name is required";
            }
            if (Object.keys(errors).length > 0) {
                setValidationErrors(errors);
                const msg = !formData.groom_name?.trim() && !formData.bride_name?.trim()
                    ? "Please enter both the Groom and Bride's full names to proceed."
                    : errors.groom_name ? "Please enter the Groom's full name." : "Please enter the Bride's full name.";
                setStepErrorBanner(msg);
                toast.error(msg);
                const firstField = errors.groom_name ? 'groom_name' : 'bride_name';
                document.querySelector(`[name="${firstField}"]`)?.focus();
                return false;
            }
        }

        if (stepIdx === 1) {
            if (!formData.date) {
                errors.date = "Wedding date cannot be empty. Please select your wedding date.";
            }
            if (!formData.ceremony_venue?.trim()) {
                errors.ceremony_venue = "Ceremony venue cannot be empty. Please enter your venue.";
            }
            if (Object.keys(errors).length > 0) {
                setValidationErrors(errors);
                const msg = errors.date
                    ? "Wedding date cannot be empty! Please select your wedding date to continue."
                    : "Ceremony venue cannot be empty! Please enter your ceremony venue to continue.";
                setStepErrorBanner(msg);
                toast.error(msg);
                const firstField = errors.date ? 'date' : 'ceremony_venue';
                document.querySelector(`[name="${firstField}"]`)?.focus();
                return false;
            }
        }

        setValidationErrors({});
        setStepErrorBanner('');
        return true;
    };

    const handleNextStep = () => {
        if (!validateStep(currentStep)) {
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, 5));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleStepClick = (targetIdx) => {
        if (isEditMode) {
            setCurrentStep(targetIdx);
            return;
        }
        if (targetIdx <= currentStep) {
            setValidationErrors({});
            setStepErrorBanner('');
            setCurrentStep(targetIdx);
            return;
        }
        if (!validateStep(currentStep)) {
            return;
        }
        if (targetIdx > 1) {
            if (!formData.groom_name?.trim() || !formData.bride_name?.trim()) {
                setCurrentStep(0);
                validateStep(0);
                return;
            }
            if (!formData.date || !formData.ceremony_venue?.trim()) {
                setCurrentStep(1);
                validateStep(1);
                return;
            }
        }
        setCurrentStep(targetIdx);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const canProceed = (stepIdx) => {
        if (isEditMode) return true;
        if (stepIdx === 0) return (formData.groom_name?.trim() || '') !== '' && (formData.bride_name?.trim() || '') !== '';
        if (stepIdx === 1) return (formData.date || '') !== '' && (formData.ceremony_venue?.trim() || '') !== '';
        return true;
    };

    const handleSaveCurrentChanges = async (finish = false) => {
        if (!currentUser) {
            saveDraft(formData);
            navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
            return;
        }

        const step0Valid = (formData.groom_name?.trim() || '') !== '' && (formData.bride_name?.trim() || '') !== '';
        const step1Valid = (formData.date || '') !== '' && (formData.ceremony_venue?.trim() || '') !== '';
        if (!step0Valid || !step1Valid) {
            setPublishError('Please ensure Groom & Bride names, Wedding Date, and Ceremony Venue are provided.');
            return;
        }

        setSaving(true);
        setPublishError('');
        try {
            const pricing = calculatePricing(formData.guest_count || 100);
            const paid = Number(existingEvent?.amount_paid) || (existingEvent?.status === 'active' || existingEvent?.status === 'approved' ? Number(existingEvent?.price) || 550 : 0);
            const balance = calculateBalanceDue(pricing.price, paid);

            const updatePayload = {
                groom_name: formData.groom_name?.trim() || '',
                bride_name: formData.bride_name?.trim() || '',
                groom_image: formData.groom_image || '',
                bride_image: formData.bride_image || '',
                groom_description: formData.groom_description || '',
                bride_description: formData.bride_description || '',
                tagline: formData.tagline?.trim() || 'We are getting married',
                cover_image: formData.cover_image || '',
                date: formData.date || null,
                location: formData.location || '',
                ceremony_date: formData.ceremony_date || formData.date || null,
                ceremony_time: formData.ceremony_time || null,
                ceremony_venue: formData.ceremony_venue || '',
                ceremony_address: formData.ceremony_address || '',
                ceremony_title: formData.ceremony_title || 'Church Service',
                ceremony_subtitle: formData.ceremony_subtitle || 'Marriage Blessings',
                program: Array.isArray(formData.program) ? formData.program : [],
                venue_name: formData.ceremony_venue || '',
                venue_address: formData.ceremony_address || '',
                reception_date: formData.reception_date || formData.date || null,
                reception_time: formData.reception_time || null,
                reception_venue: formData.reception_venue || '',
                reception_address: formData.reception_address || '',
                venue_description: formData.venue_description || (formData.extra_card_text ? `EXTRA_CARD_TEXT:${formData.extra_card_text}` : ''),
                rsvp_deadline: formData.rsvp_deadline || null,
                story_part1: formData.story_part1 || '',
                story_highlight: formData.story_highlight || '',
                story_part2: formData.story_part2 || '',
                dress_code: formData.dress_code || '',
                dress_code_desc: formData.dress_code_desc || '',
                dress_code_colors: formData.dress_code_colors || [],
                theme_colors: formData.theme_colors || [],
                map_location: formData.map_location || '',
                extra_card_text: formData.extra_card_text || '',
                template_id: formData.template_id || 1,
                music_url: formData.music_url || '',
                hero_video_url: formData.hero_video_url || '',
                reception_title: formData.reception_title || 'RECEPTION',
                reception_subtitle: formData.reception_subtitle || 'Party',
                show_gallery_titles: formData.show_gallery_titles !== false,
                slider_images: formData.slider_images || [],
                gallery_images: formData.gallery_images || [],
                bridesmaids: formData.bridesmaids || [],
                groomsmen: formData.groomsmen || [],
                gifts: formData.gifts || [],
                allowed_guests: formData.allowed_guests || ['1', '2'],
                guest_count: parseInt(formData.guest_count, 10) || 100,
                price: pricing.price,
                pricing_tier: pricing.tier,
                balance_due: balance,
            };

            let { data: updated, error: updateErr } = await supabase
                .from('weddings')
                .update(updatePayload)
                .eq('slug', editSlug)
                .eq('user_id', currentUser.id)
                .select()
                .single();

            if (updateErr) {
                console.warn('Update failed, attempting unmigrated column fallback...', updateErr.message);
                const retryPayload = { ...updatePayload };
                let fallbackThemeColors = [...(retryPayload.theme_colors || [])];
                if (retryPayload.program && retryPayload.program.length > 0) {
                    fallbackThemeColors.push(`PROGRAM:${JSON.stringify(retryPayload.program)}`);
                }
                if (retryPayload.ceremony_title) {
                    fallbackThemeColors.push(`CEREMONY_TITLE:${retryPayload.ceremony_title}`);
                }
                if (retryPayload.ceremony_subtitle) {
                    fallbackThemeColors.push(`CEREMONY_SUBTITLE:${retryPayload.ceremony_subtitle}`);
                }
                delete retryPayload.ceremony_title;
                delete retryPayload.ceremony_subtitle;
                delete retryPayload.program;
                retryPayload.theme_colors = fallbackThemeColors;

                const retryRes = await supabase
                    .from('weddings')
                    .update(retryPayload)
                    .eq('slug', editSlug)
                    .eq('user_id', currentUser.id)
                    .select()
                    .single();
                if (retryRes.error) throw retryRes.error;
                updated = retryRes.data;
            }

            setExistingEvent(updated || { ...existingEvent, ...updatePayload });
            setSaveToast('All changes saved successfully!');
            setTimeout(() => setSaveToast(''), 3500);

            if (finish) {
                setTimeout(() => {
                    navigate('/my-events');
                }, 800);
            }
        } catch (err) {
            console.error('Save error:', err);
            setPublishError(err.message || 'Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const handlePublishClick = () => {
        setPublishError('');
        if (isEditMode) {
            handleSaveCurrentChanges(true);
            return;
        }
        if (!currentUser) {
            saveDraft(formData);
            navigate(`/signup?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
            return;
        } else {
            saveDraftToDatabase(currentUser, formData);
        }
    };

    const handleAuthSuccess = useCallback((user) => {
        setCurrentUser(user);
        setShowAuthModal(false);
        if (isEditMode) {
            // Already handled by fetchExistingEvent hook
            return;
        }
        const saved = loadDraft();
        saveDraftToDatabase(user, saved ? saved.formData : formData);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, isEditMode]);

    const saveDraftToDatabase = async (user, data = formData) => {
        setSaving(true); setPublishError('');
        try {
            const res = await pushDraftToUserAccount(user, data);
            if (!res.success) {
                throw new Error(res.error?.message || res.reason || 'Failed to save invitation');
            }
            setDraftRestored(false);
            if (res.event) {
                setPublishedWedding(res.event);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                navigate('/my-events');
            }
        } catch (err) {
            console.error('Publish error:', err);
            setPublishError(err.message || 'Failed to save. Please try again.');
        } finally { setSaving(false); }
    };

    // Avatar dropdown helpers
    const getUserInitials = (user) => {
        if (!user) return '?';
        const email = user.email || '';
        const meta = user.user_metadata;
        if (meta?.full_name) {
            return meta.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return email.slice(0, 2).toUpperCase();
    };

    const activeTemplate = TEMPLATE_OPTIONS.find(t => t.id === formData.template_id) || TEMPLATE_OPTIONS[0];
    const draftLabel = formData.groom_name && formData.bride_name ? `${formData.groom_name} & ${formData.bride_name}` : null;
    const currentPricing = calculatePricing(formData.guest_count || 100);
    const amountPaid = Number(existingEvent?.amount_paid) || (existingEvent?.status === 'active' || existingEvent?.status === 'approved' ? Number(existingEvent?.price) || 550 : 0);
    const balanceDue = calculateBalanceDue(currentPricing.price, amountPaid);

    // ─────────────────────────────────────────────────────────────────────────
    // SUCCESS / PAYMENT VIEW
    // ─────────────────────────────────────────────────────────────────────────
    const [copiedEventId, setCopiedEventId] = useState(false);
    const [copiedPayPhone, setCopiedPayPhone] = useState(false);
    const handleCopyEventId = (id) => {
        navigator.clipboard.writeText(id).then(() => { setCopiedEventId(true); setTimeout(() => setCopiedEventId(false), 2000); });
    };
    const handleCopyPayPhone = () => {
        navigator.clipboard.writeText(PAYMENT_PHONE_RAW).then(() => { setCopiedPayPhone(true); setTimeout(() => setCopiedPayPhone(false), 2000); });
    };

    if (publishedWedding) {
        const liveUrl = `${window.location.origin}/w/${publishedWedding.slug}`;
        const eventIdDisplay = publishedWedding.event_id || '';
        const currentAmount = publishedWedding.balance_due ?? publishedWedding.price ?? 550;
        const formattedPrice = formatKwacha(currentAmount);
        const waMsg = encodeURIComponent(
            `Hello SaveMeASeat, I have made payment for my wedding invitation.\n\nEvent ID: ${eventIdDisplay}\nCouple: ${publishedWedding.groom_name} & ${publishedWedding.bride_name}\nAmount: ${formattedPrice}\nInvitation Link: ${liveUrl}\n\nPlease confirm activation. Thank you.`
        );
        const formattedEventDate = publishedWedding.date
            ? new Date(publishedWedding.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })
            : null;

        return (
            <div className="client-studio-page">
                <NavBar user={currentUser} />

                <div className="studio-success-page">
                    <div className="payment-page-card">
                        {/* Status Header */}
                        <div className="payment-card-header">
                            <div className="payment-status-badge">
                                <i className="fas fa-check-circle" /> Invitation Saved
                            </div>
                            <h1 className="payment-main-heading">Complete Payment & Activate</h1>
                            <p className="payment-main-subtitle">
                                Your digital wedding invitation for <strong>{publishedWedding.groom_name} & {publishedWedding.bride_name}</strong> is saved. Complete payment below to activate it for guests.
                            </p>
                        </div>

                        {/* Order Summary (Top) */}
                        <div className="order-summary-card">
                            <div className="order-summary-top">
                                <div className="order-summary-label">
                                    <i className="fas fa-receipt" />
                                    <span>ORDER SUMMARY</span>
                                </div>
                                <span className="order-badge-pending">Pending Approval</span>
                            </div>
                            {eventIdDisplay && (
                                <div className="event-id-row">
                                    <span className="event-id-label"><i className="fas fa-fingerprint" /> Event ID</span>
                                    <span className="event-id-value">{eventIdDisplay}</span>
                                    <button
                                        type="button"
                                        className={`event-id-copy-btn ${copiedEventId ? 'copied' : ''}`}
                                        onClick={() => handleCopyEventId(eventIdDisplay)}
                                        title="Copy Event ID"
                                    >
                                        <i className={`fas ${copiedEventId ? 'fa-check' : 'fa-copy'}`} />
                                        {copiedEventId ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            )}
                            <div className="order-summary-body">
                                <div className="order-item-info">
                                    <h2 className="order-event-title">
                                        {publishedWedding.groom_name} & {publishedWedding.bride_name}'s Wedding
                                    </h2>
                                    <p className="order-event-meta">
                                        Digital Invitation Package {formattedEventDate ? `• ${formattedEventDate}` : ''}
                                    </p>
                                </div>
                                <div className="order-item-price">
                                    <span className="price-subtext">Total Due</span>
                                    <span className="price-amount">{formattedPrice}</span>
                                    {publishedWedding.pricing_tier && (
                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({publishedWedding.guest_count || 100} guests • {publishedWedding.pricing_tier})</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Attached Photos Showcase */}
                        {((publishedWedding.slider_images && publishedWedding.slider_images.length > 0) || publishedWedding.groom_image || publishedWedding.bride_image) && (
                            <div className="payment-media-showcase">
                                <div className="payment-media-label">
                                    <i className="fas fa-camera" style={{ color: '#1fa09b' }} />
                                    <span>ATTACHED MEDIA & VISUALS</span>
                                </div>
                                <div className="payment-media-row">
                                    {/* Couple Avatars */}
                                    <div className="payment-avatars-pair">
                                        <div className="payment-avatar-item">
                                            {publishedWedding.groom_image ? (
                                                <img src={publishedWedding.groom_image} alt={publishedWedding.groom_name} className="payment-thumb-avatar" />
                                            ) : (
                                                <div className="payment-thumb-placeholder"><i className="fas fa-male" /></div>
                                            )}
                                            <span>{publishedWedding.groom_name || 'Groom'}</span>
                                        </div>
                                        <span className="payment-avatar-amp">&</span>
                                        <div className="payment-avatar-item">
                                            {publishedWedding.bride_image ? (
                                                <img src={publishedWedding.bride_image} alt={publishedWedding.bride_name} className="payment-thumb-avatar" />
                                            ) : (
                                                <div className="payment-thumb-placeholder"><i className="fas fa-female" /></div>
                                            )}
                                            <span>{publishedWedding.bride_name || 'Bride'}</span>
                                        </div>
                                    </div>

                                    {/* Slider Thumbnails Strip */}
                                    {publishedWedding.slider_images && publishedWedding.slider_images.length > 0 && (
                                        <div className="payment-slider-group">
                                            <div className="payment-slider-head">
                                                <span>Slider Carousel Photos ({publishedWedding.slider_images.length})</span>
                                            </div>
                                            <div className="payment-slider-strip">
                                                {publishedWedding.slider_images.map((img, idx) => (
                                                    <img key={idx} src={img} alt={`Slide ${idx + 1}`} className="payment-slider-thumb" />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Payment Methods (Dimmed & Disabled) */}
                        <div className="payment-methods-section">
                            <p className="payment-methods-notice">
                                <i className="fas fa-info-circle" /> Online payment options are not available at the moment.
                            </p>
                            <div className="payment-methods-grid">
                                {/* Airtel Money */}
                                <div
                                    className="method-card-disabled"
                                    aria-disabled="true"
                                    tabIndex={-1}
                                    role="region"
                                    aria-label="Airtel Money - Coming soon"
                                >
                                    <div className="method-badge-unavailable">Coming soon</div>
                                    <div className="method-brand-icon airtel">
                                        <i className="fas fa-mobile-alt" />
                                    </div>
                                    <span className="method-brand-name">Airtel Money</span>
                                </div>

                                {/* MTN MoMo */}
                                <div
                                    className="method-card-disabled"
                                    aria-disabled="true"
                                    tabIndex={-1}
                                    role="region"
                                    aria-label="MTN MoMo - Coming soon"
                                >
                                    <div className="method-badge-unavailable">Coming soon</div>
                                    <div className="method-brand-icon mtn">
                                        <i className="fas fa-bolt" />
                                    </div>
                                    <span className="method-brand-name">MTN MoMo</span>
                                </div>

                                {/* Zamtel Kwacha */}
                                <div
                                    className="method-card-disabled"
                                    aria-disabled="true"
                                    tabIndex={-1}
                                    role="region"
                                    aria-label="Zamtel Kwacha - Coming soon"
                                >
                                    <div className="method-badge-unavailable">Coming soon</div>
                                    <div className="method-brand-icon zamtel">
                                        <i className="fas fa-wallet" />
                                    </div>
                                    <span className="method-brand-name">Zamtel Kwacha</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Instructions Section */}
                        <div className="payment-instructions-section">
                            <h3 className="instructions-heading">Payment instructions</h3>
                            <p className="instructions-intro">
                                Complete your payment, then send your proof of payment to our WhatsApp team. We'll review it and approve your event manually.
                            </p>

                            {/* Account Details */}
                            <div className="payment-accounts-card">
                                <div className="accounts-header">
                                    <i className="fas fa-university" /> Payment Details
                                </div>
                                <div className="accounts-columns">
                                    <div className="account-column">
                                        <span className="account-tag">Mobile Money</span>
                                        <div className="account-field">
                                            <span className="f-label">Network:</span>
                                            <span className="f-val">Airtel Money</span>
                                        </div>
                                        <div className="account-field">
                                            <span className="f-label">Name:</span>
                                            <span className="f-val">Godwin Banda</span>
                                        </div>
                                        <div className="account-field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <span className="f-label">Number:</span>
                                                <span className="f-val highlight">{PAYMENT_PHONE_NUMBER}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className={`event-id-copy-btn ${copiedPayPhone ? 'copied' : ''}`}
                                                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                                onClick={handleCopyPayPhone}
                                                title="Copy Payment Number"
                                            >
                                                <i className={`fas ${copiedPayPhone ? 'fa-check' : 'fa-copy'}`} />
                                                {copiedPayPhone ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="account-column">
                                        <span className="account-tag">Bank Transfer</span>
                                        <div className="account-field">
                                            <span className="f-label">Bank:</span>
                                            <span className="f-val">First National Bank (FNB)</span>
                                        </div>
                                        <div className="account-field">
                                            <span className="f-label">Account:</span>
                                            <span className="f-val highlight">63149798184</span>
                                        </div>
                                        <div className="account-field">
                                            <span className="f-label">Branch:</span>
                                            <span className="f-val">Lusaka Main</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3 Numbered Steps */}
                            <div className="numbered-steps-container">
                                <div className="numbered-step-row">
                                    <div className="step-circle">1</div>
                                    <div className="step-desc">Make your payment using the details provided.</div>
                                </div>
                                <div className="numbered-step-row">
                                    <div className="step-circle">2</div>
                                    <div className="step-desc">Take a screenshot or photo of your proof of payment.</div>
                                </div>
                                <div className="numbered-step-row">
                                    <div className="step-circle">3</div>
                                    <div className="step-desc">Send it to us on WhatsApp for manual approval.</div>
                                </div>
                            </div>

                            {/* Prominent Full-Width WhatsApp Button */}
                            <a
                                href={`https://wa.me/260960968349?text=${waMsg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="whatsapp-pay-button"
                            >
                                <i className="fab fa-whatsapp" /> Send Proof of Payment via WhatsApp
                            </a>

                            {/* Reassurance Line */}
                            <p className="reassurance-text">
                                <i className="fas fa-check" /> Approval usually takes a short while. You'll be notified once your event is active.
                            </p>
                        </div>

                        {/* Live Preview Collapsible Bar */}
                        <div className="preview-collapsible-bar">
                            <button
                                type="button"
                                className="preview-collapsible-trigger"
                                onClick={() => setShowPreview(prev => !prev)}
                            >
                                <i className={showPreview ? "fas fa-eye-slash" : "fas fa-eye"} />
                                <span>{showPreview ? "Hide Live Invitation Preview" : "Preview Live Invitation"}</span>
                            </button>
                            <a
                                href={`${liveUrl}?preview=true`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="preview-direct-link"
                            >
                                Open in new tab <i className="fas fa-external-link-alt" />
                            </a>
                        </div>

                        {showPreview && (
                            <div className="preview-embed-frame">
                                <iframe title="Preview" src={`${liveUrl}?preview=true`} />
                            </div>
                        )}

                        {/* Navigation Actions */}
                        <div className="payment-nav-actions">
                            <button
                                type="button"
                                className="studio-btn studio-btn-primary"
                                onClick={() => navigate(`/my-events/${publishedWedding.slug}`)}
                            >
                                <i className="fas fa-cog" /> Manage My Event
                            </button>
                            <Link to="/my-events" className="launch-btn-report">
                                <i className="fas fa-th-large" /> All My Events
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MAIN BUILDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="client-studio-page">
            {showAuthModal && <AuthModal onAuthSuccess={handleAuthSuccess} onClose={() => setShowAuthModal(false)} draftLabel={draftLabel} />}
            <audio ref={previewAudioRef} style={{ display: 'none' }} />

            {/* Navbar */}
            <NavBar
                user={currentUser}
                onSignIn={() => {
                    saveDraft(formData);
                    navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                }}
                showExit
            />

            {/* Draft banner */}
            {draftRestored && !draftDismissed && (
                <div className="draft-restore-banner">
                    <div className="draft-restore-inner">
                        <i className="fas fa-file-alt" style={{ color: '#1fa09b' }} />
                        <span><strong>Draft restored</strong> — your progress was saved {draftAge ? `(${draftAge})` : ''}. Continue editing below.</span>
                        <button type="button" className="draft-dismiss-btn" onClick={() => setDraftDismissed(true)}><i className="fas fa-times" /></button>
                    </div>
                </div>
            )}
            {lastSaved && (
                <div className="draft-autosave-bar"><i className="fas fa-cloud-upload-alt" style={{ color: '#1fa09b', marginRight: 5 }} />Draft auto-saved locally</div>
            )}

            {/* Save Notification Toast */}
            {saveToast && (
                <div className="studio-save-toast">
                    <i className="fas fa-check-circle" /> {saveToast}
                </div>
            )}

            {/* Hero */}
            <div className="studio-hero-bar">
                <div className="studio-title-box">
                    <h1>
                        {isEditMode ? (
                            <>
                                Edit Wedding Details{' '}
                                {existingEvent?.event_id && (
                                    <span className="studio-hero-event-id" title="Event ID">
                                        <i className="fas fa-fingerprint" /> {existingEvent.event_id}
                                    </span>
                                )}
                            </>
                        ) : (
                            <p style={{ color: 'black', fontSize: '1.1rem' }}>Create Your Wedding Invitation</p>
                        )}
                    </h1>
                    <p>
                        {isEditMode
                            ? 'Update any fields below. Click any step to jump directly, and click "Save Changes" at any time.'
                            : 'Fill in all details below — the live preview updates as you type.'
                        }
                    </p>
                </div>
                {isEditMode && (
                    <div className="studio-hero-actions">
                        <button
                            type="button"
                            className="studio-btn studio-btn-primary"
                            onClick={() => handleSaveCurrentChanges(false)}
                            disabled={saving}
                        >
                            {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-save" /> Save Changes</>}
                        </button>
                        <button
                            type="button"
                            className="studio-btn studio-btn-outline"
                            onClick={() => navigate(`/my-events/${editSlug}`)}
                        >
                            <i className="fas fa-arrow-left" /> Back to Event
                        </button>
                    </div>
                )}
            </div>

            {/* Stepper */}
            <div className="studio-stepper-wrap">
                <div className="studio-stepper">
                    {[
                        { label: 'The Couple', icon: 'fa-heart' },
                        { label: 'Event Details', icon: 'fa-calendar-alt' },
                        { label: 'Our Story', icon: 'fa-book-open' },
                        { label: 'Party & Slider', icon: 'fa-film' },
                        { label: 'Style & Music', icon: 'fa-palette' },
                        { label: 'Preview & Launch', icon: 'fa-paper-plane' },
                    ].map((step, idx) => (
                        <button
                            key={idx} type="button"
                            className={`studio-step-btn ${currentStep === idx ? 'active' : ''} ${currentStep > idx ? 'completed' : ''}`}
                            onClick={() => handleStepClick(idx)}
                            title={isEditMode ? `Jump to ${step.label}` : step.label}
                        >
                            <div className="step-label-group">
                                <span className="step-main-title">{step.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Workspace */}
            <div className="studio-workspace">
                <div className="studio-form-card">

                    {/* ══════════════════════════════════════════════════════
                        STEP 1 — The Couple
                    ══════════════════════════════════════════════════════ */}
                    {currentStep === 0 && (
                        <div>
                            <div className="form-step-header">
                                {/* <span className="step-badge"><i className="fas fa-heart" /> Step 1 of 6 • The Happy Couple</span> */}
                                {/* <h2>Tell Us About The Couple</h2> */}
                                <p>Add names, individual photos, bios, and a tagline for your invitation.</p>
                            </div>

                            {/* Cover image */}
                            <div className="studio-section-subhead"><i className="fas fa-image" style={{ color: '#1fa09b' }} /><span>Cover / Banner Photo</span></div>
                            <ImageUpload label="Cover Image (used for shared link previews)" value={formData.cover_image} onUpload={url => setFormData(p => ({ ...p, cover_image: url }))} path="covers" id="cover-upload" />

                            {/* Couple Grid */}
                            <div className="form-row-2" style={{ marginTop: '1.25rem' }}>
                                {/* Groom */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(31,160,155,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1fa09b' }}>
                                            <i className="fas fa-male" />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>The Groom</h3>
                                    </div>
                                    <label className="studio-label"><span>Full Name *</span></label>
                                    <div className="studio-input-wrap">
                                        <i className="fas fa-user input-icon-left" style={{ color: '#1fa09b' }} />
                                        <input
                                            type="text"
                                            name="groom_name"
                                            value={formData.groom_name}
                                            onChange={handlePersonNameChange}
                                            placeholder="e.g. Chanda Banda"
                                            className={`studio-input ${validationErrors.groom_name ? 'input-error' : ''}`}
                                        />
                                    </div>
                                    {validationErrors.groom_name && (
                                        <div className="studio-field-error-msg">
                                            <i className="fas fa-exclamation-circle" /> {validationErrors.groom_name}
                                        </div>
                                    )}
                                    <div style={{ marginTop: '0.85rem' }}>
                                        <ImageUpload label="Groom's Photo" value={formData.groom_image} onUpload={url => setFormData(p => ({ ...p, groom_image: url }))} path="couples" id="groom-photo-upload" />
                                    </div>
                                    <label className="studio-label"><span>Bio & Description</span></label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                        <textarea name="groom_description" value={formData.groom_description} onChange={handleChange} className="studio-textarea" placeholder="Share his personality and story..." style={{ flex: 1, minHeight: '80px' }} />
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, groom_description: getAutoBio('groom', p.groom_name) }))} style={{ whiteSpace: 'nowrap', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#1fa09b' }}>Auto Fill</button>
                                    </div>
                                </div>

                                {/* Bride */}
                                <div style={{ background: '#fdf2f8', border: '1px solid #fce7f3', borderRadius: '16px', padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(236,72,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
                                            <i className="fas fa-female" />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>The Bride</h3>
                                    </div>
                                    <label className="studio-label"><span>Full Name *</span></label>
                                    <div className="studio-input-wrap">
                                        <i className="fas fa-user input-icon-left" style={{ color: '#ec4899' }} />
                                        <input
                                            type="text"
                                            name="bride_name"
                                            value={formData.bride_name}
                                            onChange={handlePersonNameChange}
                                            placeholder="e.g. Mutale Mwila"
                                            className={`studio-input ${validationErrors.bride_name ? 'input-error' : ''}`}
                                        />
                                    </div>
                                    {validationErrors.bride_name && (
                                        <div className="studio-field-error-msg">
                                            <i className="fas fa-exclamation-circle" /> {validationErrors.bride_name}
                                        </div>
                                    )}
                                    <div style={{ marginTop: '0.85rem' }}>
                                        <ImageUpload label="Bride's Photo" value={formData.bride_image} onUpload={url => setFormData(p => ({ ...p, bride_image: url }))} path="couples" id="bride-photo-upload" />
                                    </div>
                                    <label className="studio-label"><span>Bio & Description</span></label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                        <textarea name="bride_description" value={formData.bride_description} onChange={handleChange} className="studio-textarea" placeholder="Share her personality and story..." style={{ flex: 1, minHeight: '80px' }} />
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, bride_description: getAutoBio('bride', p.bride_name) }))} style={{ whiteSpace: 'nowrap', padding: '6px 10px', borderRadius: '8px', border: '1px solid #fce7f3', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#ec4899' }}>Auto Fill</button>
                                    </div>
                                </div>
                            </div>

                            {/* Tagline */}
                            <div className="form-row-1" style={{ marginTop: '1.25rem' }}>
                                <label className="studio-label"><span>Invitation Tagline / Headline</span></label>
                                <div className="studio-input-wrap">
                                    <i className="fas fa-quote-right input-icon-left" style={{ color: '#1fa09b' }} />
                                    <input type="text" name="tagline" value={formData.tagline} onChange={handleChange} placeholder="e.g. We are getting married" className="studio-input" />
                                </div>
                                <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Shown below the couple names on the invitation.</small>
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        STEP 2 — Event Details
                    ══════════════════════════════════════════════════════ */}
                    {currentStep === 1 && (
                        <div>
                            <div className="form-step-header">
                                <span className="step-badge"><i className="fas fa-calendar-alt" /> Step 2 of 6 • Event Details</span>
                                <h2>When & Where Is The Wedding?</h2>
                                <p>Set dates, times, venues, location and dress code for your special day.</p>
                            </div>

                            {/* Main Event */}
                            <div className="studio-section-subhead"><i className="fas fa-star" style={{ color: '#1fa09b' }} /><span>Main Event Details</span></div>
                            <div className="form-row-2">
                                <div>
                                    <label className="studio-label">Wedding Date *</label>
                                    <div className="studio-input-wrap">
                                        <i className="fas fa-calendar input-icon-left" style={{ color: '#1fa09b' }} />
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleChange}
                                            className={`studio-input ${validationErrors.date ? 'input-error' : ''}`}
                                            required
                                        />
                                    </div>
                                    {validationErrors.date && (
                                        <div className="studio-field-error-msg">
                                            <i className="fas fa-exclamation-circle" /> {validationErrors.date}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="studio-label">RSVP Deadline</label>
                                    <div className="studio-input-wrap">
                                        <i className="fas fa-hourglass-half input-icon-left" style={{ color: '#1fa09b' }} />
                                        <input type="date" name="rsvp_deadline" value={formData.rsvp_deadline} onChange={handleChange} className="studio-input" />
                                    </div>
                                </div>
                                <div>
                                    <label className="studio-label">Location / City</label>
                                    <div className="studio-input-wrap">
                                        <i className="fas fa-map-marker-alt input-icon-left" style={{ color: '#1fa09b' }} />
                                        <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Lusaka, Zambia" className="studio-input" />
                                    </div>
                                </div>
                                <div>
                                    <label className="studio-label">Dress Code</label>
                                    <div className="studio-input-wrap">
                                        <i className="fas fa-tshirt input-icon-left" style={{ color: '#1fa09b' }} />
                                        <input type="text" name="dress_code" value={formData.dress_code} onChange={handleChange} placeholder="e.g. Emerald Green Formal" className="studio-input" />
                                    </div>
                                </div>
                            </div>

                            {/* Dress code colors */}
                            <div style={{ marginTop: '0.85rem' }}>
                                <label className="studio-label">Dress Code Colors (Pick Manually)</label>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <input
                                        type="color"
                                        id="manual-dress-color"
                                        defaultValue="#1fa09b"
                                        style={{ width: 40, height: 40, border: 'none', borderRadius: '50%', cursor: 'pointer', padding: 0, background: 'none' }}
                                        title="Pick a color"
                                    />
                                    <button
                                        type="button"
                                        className="studio-btn studio-btn-outline"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                        onClick={() => {
                                            const cInput = document.getElementById('manual-dress-color');
                                            if (!cInput) return;
                                            const hex = cInput.value;
                                            setFormData(prev => {
                                                const arr = prev.dress_code_colors || [];
                                                if (arr.includes(hex)) return prev;
                                                return { ...prev, dress_code_colors: [...arr, hex] };
                                            });
                                        }}
                                    >
                                        <i className="fas fa-plus" /> Add Color
                                    </button>
                                </div>
                                {(formData.dress_code_colors || []).length > 0 && (
                                    <div className="dress-code-colors-wrap">
                                        {(formData.dress_code_colors || []).map((hex, i) => (
                                            <div key={i} className="dress-color-pill selected" style={{ cursor: 'default', paddingRight: '0.25rem' }}>
                                                <span className="dress-color-circle" style={{ backgroundColor: hex }} />
                                                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#262626' }}>{hex}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, dress_code_colors: p.dress_code_colors.filter(c => c !== hex) }))}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px 6px', fontSize: '0.85rem' }}
                                                    title="Remove color"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Expected Guest Count & Pricing Tier */}
                            <div className="studio-section-subhead" style={{ marginTop: '1.5rem' }}>
                                <i className="fas fa-users" style={{ color: '#1fa09b' }} />
                                <span>Expected Guest Count & Pricing Tier</span>
                            </div>
                            <div className="guest-pricing-picker-card">
                                <div className="guest-pricing-header-row">
                                    <div>
                                        <label className="studio-label" style={{ marginBottom: '0.25rem' }}>
                                            Estimated Number of Guests *
                                        </label>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                                            Price is calculated automatically from your guest count.
                                        </p>
                                    </div>
                                    <div className="guest-pricing-tier-badge">
                                        <span className="tier-badge-label">{currentPricing.tier}</span>
                                        <span className="tier-badge-price">{currentPricing.formattedPrice}</span>
                                    </div>
                                </div>

                                {/* Quick Presets */}
                                <div className="guest-count-presets">
                                    {[50, 100, 200, 250, 350, 400, 500].map(cnt => (
                                        <button
                                            key={cnt}
                                            type="button"
                                            className={`guest-preset-btn ${formData.guest_count === cnt ? 'active' : ''}`}
                                            onClick={() => setFormData(p => ({ ...p, guest_count: cnt }))}
                                        >
                                            {cnt === 500 ? '500+' : `${cnt} guests`}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Input & Tier Summary */}
                                <div className="form-row-2" style={{ marginTop: '0.85rem', alignItems: 'center' }}>
                                    <div>
                                        <div className="studio-input-wrap">
                                            <i className="fas fa-user-friends input-icon-left" style={{ color: '#1fa09b' }} />
                                            <input
                                                type="number"
                                                min="1"
                                                max="10000"
                                                name="guest_count"
                                                value={formData.guest_count ?? 100}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    setFormData(p => ({ ...p, guest_count: isNaN(val) ? '' : val }));
                                                }}
                                                placeholder="e.g. 150"
                                                className="studio-input"
                                            />
                                        </div>
                                    </div>
                                    <div className="guest-pricing-summary-inline">
                                        <div className="pricing-tier-tag-box">
                                            <i className="fas fa-tag" style={{ color: '#1fa09b' }} />
                                            <span><strong>{currentPricing.tier}</strong> ({currentPricing.badge})</span>
                                        </div>
                                        <div className="pricing-tier-price-box">
                                            <span>Package Total: <strong>{currentPricing.formattedPrice}</strong></span>
                                        </div>
                                    </div>
                                </div>

                                {isEditMode && existingEvent && currentPricing.price > (existingEvent.price || 550) && (
                                    <div className="guest-tier-upgrade-notice" style={{
                                        marginTop: '1rem',
                                        padding: '0.9rem 1.1rem',
                                        borderRadius: '12px',
                                        background: '#fffbeb',
                                        border: '1px solid #fde68a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.85rem',
                                        color: '#92400e',
                                        fontSize: '0.86rem'
                                    }}>
                                        <i className="fas fa-arrow-circle-up" style={{ fontSize: '1.4rem', color: '#d97706', flexShrink: 0 }} />
                                        <div>
                                            <strong>Tier Upgrade Notice:</strong> Capacity increased from <strong>{existingEvent.guest_count || 100} guests ({existingEvent.pricing_tier || 'Up to 100 guests'})</strong> to <strong>{formData.guest_count || 100} guests ({currentPricing.tier})</strong>. An upgrade balance of <strong>{formatKwacha(balanceDue)}</strong> will be due upon saving.
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Ceremony */}
                            <div className="studio-section-subhead" style={{ marginTop: '1.5rem' }}>
                                <i className="fas fa-church" style={{ color: '#1fa09b' }} />
                                <span>Ceremony Details (Church Service / Marriage Blessings)</span>
                            </div>
                            <div className="form-row-2">
                                <div>
                                    <label className="studio-label">Ceremony Section Title</label>
                                    <div className="studio-input-wrap">
                                        <i className="fas fa-heading input-icon-left" style={{ color: '#1fa09b' }} />
                                        <input
                                            type="text"
                                            name="ceremony_title"
                                            value={formData.ceremony_title !== undefined ? formData.ceremony_title : 'Church Service'}
                                            onChange={handleChange}
                                            placeholder="e.g. Church Service or Marriage Blessings"
                                            className="studio-input"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="studio-label">Ceremony Subheading</label>
                                    <div className="studio-input-wrap">
                                        <i className="fas fa-quote-right input-icon-left" style={{ color: '#1fa09b' }} />
                                        <input
                                            type="text"
                                            name="ceremony_subtitle"
                                            value={formData.ceremony_subtitle !== undefined ? formData.ceremony_subtitle : 'Marriage Blessings'}
                                            onChange={handleChange}
                                            placeholder="e.g. Holy Matrimony or Blessing"
                                            className="studio-input"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="form-row-2">
                                <div>
                                    <label className="studio-label">Ceremony Venue *</label>
                                    <div className="studio-input-wrap">
                                        <i className="fas fa-landmark input-icon-left" style={{ color: '#1fa09b' }} />
                                        <input
                                            type="text"
                                            name="ceremony_venue"
                                            value={formData.ceremony_venue}
                                            onChange={handleChange}
                                            placeholder="e.g. Cathedral of the Holy Cross"
                                            className={`studio-input ${validationErrors.ceremony_venue ? 'input-error' : ''}`}
                                            required
                                        />
                                    </div>
                                    {validationErrors.ceremony_venue && (
                                        <div className="studio-field-error-msg">
                                            <i className="fas fa-exclamation-circle" /> {validationErrors.ceremony_venue}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="studio-label">Ceremony Time</label>
                                    <div className="studio-input-wrap">
                                        <i className="fas fa-clock input-icon-left" style={{ color: '#1fa09b' }} />
                                        <input type="time" name="ceremony_time" value={formData.ceremony_time} onChange={handleChange} className="studio-input" />
                                    </div>
                                </div>
                            </div>
                            <div className="form-row-1">
                                <label className="studio-label">Ceremony Address</label>
                                <div className="studio-input-wrap">
                                    <i className="fas fa-map-marker-alt input-icon-left" style={{ color: '#1fa09b' }} />
                                    <input type="text" name="ceremony_address" value={formData.ceremony_address} onChange={handleChange} placeholder="e.g. Great East Road, Lusaka" className="studio-input" />
                                </div>
                            </div>

                            {/* Program / Order of Service Builder */}
                            <div className="studio-section-subhead" style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-list-ol" style={{ color: '#1fa09b' }} />
                                    <span>Program / Order of Service</span>
                                </div>
                                <span style={{ fontSize: '0.78rem', color: '#0369a1', background: '#e0f2fe', padding: '2px 9px', borderRadius: '999px', fontWeight: 600 }}>
                                    {(formData.program || []).length} {(formData.program || []).length === 1 ? 'part' : 'parts'}
                                </span>
                            </div>
                            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '-0.3rem', marginBottom: '0.9rem' }}>
                                Add each part of your church service or wedding day program (e.g. Processional, Vows & Rings, Sermon, Signing of Register, Photo Session). Guests can follow the timeline seamlessly!
                            </p>

                            <div className="studio-program-builder">
                                {(formData.program || []).length === 0 ? (
                                    <div className="studio-program-empty">
                                        <i className="fas fa-clipboard-list" style={{ fontSize: '1.6rem', color: '#cbd5e1', marginBottom: '0.5rem' }} />
                                        <p style={{ margin: 0, fontWeight: 600, color: '#475569', fontSize: '0.88rem' }}>No program parts added yet</p>
                                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Outline your order of service so guests know the schedule of events.</span>
                                    </div>
                                ) : (
                                    <div className="studio-program-list">
                                        {(formData.program || []).map((prog, idx) => (
                                            <div key={idx} className="studio-program-item">
                                                <div className="studio-program-header">
                                                    <span className="studio-program-badge">Part {idx + 1}</span>
                                                    <div className="studio-program-controls">
                                                        <button
                                                            type="button"
                                                            className="studio-btn-icon"
                                                            title="Move Up"
                                                            disabled={idx === 0}
                                                            onClick={() => moveItem('program', idx, idx - 1)}
                                                        >
                                                            <i className="fas fa-arrow-up" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="studio-btn-icon"
                                                            title="Move Down"
                                                            disabled={idx === (formData.program.length - 1)}
                                                            onClick={() => moveItem('program', idx, idx + 1)}
                                                        >
                                                            <i className="fas fa-arrow-down" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="studio-btn-icon studio-btn-delete"
                                                            title="Delete Part"
                                                            onClick={() => removeItem('program', idx)}
                                                        >
                                                            <i className="fas fa-trash-alt" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="form-row-2" style={{ marginBottom: '0.65rem' }}>
                                                    <div>
                                                        <label className="studio-label" style={{ fontSize: '0.78rem' }}>Time</label>
                                                        <div className="studio-input-wrap">
                                                            <i className="fas fa-clock input-icon-left" style={{ color: '#1fa09b' }} />
                                                            <input
                                                                type="text"
                                                                className="studio-input"
                                                                placeholder="e.g. 10:00 AM or 10:00"
                                                                value={prog.time || ''}
                                                                onChange={(e) => updateItem('program', idx, 'time', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="studio-label" style={{ fontSize: '0.78rem' }}>Activity / Program Part *</label>
                                                        <div className="studio-input-wrap">
                                                            <i className="fas fa-bookmark input-icon-left" style={{ color: '#1fa09b' }} />
                                                            <input
                                                                type="text"
                                                                className="studio-input"
                                                                placeholder="e.g. Processional & Bridal Entry"
                                                                value={prog.title || ''}
                                                                onChange={(e) => updateItem('program', idx, 'title', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="form-row-1">
                                                    <label className="studio-label" style={{ fontSize: '0.78rem' }}>Officiant / Details / Location (Optional)</label>
                                                    <div className="studio-input-wrap">
                                                        <i className="fas fa-info-circle input-icon-left" style={{ color: '#94a3b8' }} />
                                                        <input
                                                            type="text"
                                                            className="studio-input"
                                                            placeholder="e.g. Officiated by Pastor Banda / Church Sanctuary"
                                                            value={prog.description || ''}
                                                            onChange={(e) => updateItem('program', idx, 'description', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="studio-program-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
                                    <button
                                        type="button"
                                        className="studio-btn studio-btn-primary"
                                        onClick={() => addItem('program', { time: '', title: '', description: '' })}
                                    >
                                        <i className="fas fa-plus" /> Add Program Part
                                    </button>
                                    <button
                                        type="button"
                                        className="studio-btn studio-btn-outline"
                                        onClick={() => {
                                            const defaultChurchProgram = [
                                                { time: '09:30 AM', title: 'Arrival of Guests', description: 'Guests seated in the main sanctuary' },
                                                { time: '10:00 AM', title: 'Processional & Bridal Entry', description: 'Entrance of Bridal Party & The Bride' },
                                                { time: '10:30 AM', title: 'Scripture Reading & Sermon', description: 'Word of encouragement' },
                                                { time: '11:00 AM', title: 'Exchange of Vows & Rings', description: 'Holy Matrimony & Blessing' },
                                                { time: '11:45 AM', title: 'Signing of Marriage Register', description: 'Official signing and presentation of couple' },
                                                { time: '12:15 PM', title: 'Recessional & Photo Session', description: 'Family and church photo shoot' },
                                            ];
                                            setFormData(prev => ({
                                                ...prev,
                                                program: [...(prev.program || []), ...defaultChurchProgram]
                                            }));
                                        }}
                                        title="Quickly fill with standard church ceremony parts"
                                    >
                                        <i className="fas fa-magic" /> Load Standard Church Program
                                    </button>
                                    {(formData.program || []).length > 0 && (
                                        <button
                                            type="button"
                                            className="studio-btn"
                                            style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fff' }}
                                            onClick={() => setFormData(prev => ({ ...prev, program: [] }))}
                                        >
                                            <i className="fas fa-times" /> Clear Program
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Reception */}
                            <div className="studio-section-subhead" style={{ marginTop: '1.5rem' }}><i className="fas fa-glass-cheers" style={{ color: '#1fa09b' }} /><span>Reception Details</span></div>
                            <div className="form-row-2">
                                <div>
                                    <label className="studio-label">Reception Venue</label>
                                    <div className="studio-input-wrap">
                                        <i className="fas fa-hotel input-icon-left" style={{ color: '#1fa09b' }} />
                                        <input type="text" name="reception_venue" value={formData.reception_venue} onChange={handleChange} placeholder="e.g. Taj Pamodzi Grand Ballroom" className="studio-input" />
                                    </div>
                                </div>
                                <div>
                                    <label className="studio-label">Reception Time</label>
                                    <div className="studio-input-wrap">
                                        <i className="fas fa-clock input-icon-left" style={{ color: '#1fa09b' }} />
                                        <input type="time" name="reception_time" value={formData.reception_time} onChange={handleChange} className="studio-input" />
                                    </div>
                                </div>
                            </div>
                            <div className="form-row-1">
                                <label className="studio-label">Reception Address</label>
                                <div className="studio-input-wrap">
                                    <i className="fas fa-map-marker-alt input-icon-left" style={{ color: '#1fa09b' }} />
                                    <input type="text" name="reception_address" value={formData.reception_address} onChange={handleChange} placeholder="e.g. Church Road, Lusaka" className="studio-input" />
                                </div>
                            </div>

                            {/* Map */}
                            <div className="studio-section-subhead" style={{ marginTop: '1.5rem' }}><i className="fas fa-map" style={{ color: '#1fa09b' }} /><span>Venue Map Location</span></div>
                            <button type="button" className="studio-btn studio-btn-outline" style={{ marginBottom: '1rem' }} onClick={() => setIsMapOpen(v => !v)}>
                                <i className={`fas fa-${isMapOpen ? 'chevron-up' : 'map-marked-alt'}`} /> {isMapOpen ? 'Hide Map' : 'Set Map Location (Leaflet)'}
                            </button>
                            {isMapOpen && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.65rem' }}>Search for a venue or click the map pin to set the location. Guests will see this map on the invitation.</p>
                                    <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                                        <div className="studio-input-wrap">
                                            <i className="fas fa-search input-icon-left" style={{ color: '#1fa09b' }} />
                                            <input type="text" className="studio-input" value={addressQuery} onChange={e => setAddressQuery(e.target.value)} placeholder="Search venue name (e.g. Twangale Park)..." />
                                            {isSearchingMap && <i className="fas fa-spinner fa-spin" style={{ position: 'absolute', right: '0.9rem', color: '#94a3b8' }} />}
                                        </div>
                                        {searchResults.length > 0 && (
                                            <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0 0 10px 10px', listStyle: 'none', padding: 0, margin: 0, maxHeight: 220, overflowY: 'auto', zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                                                {searchResults.map((r, i) => (
                                                    <li key={i} onClick={() => selectMapAddress(r)} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                                        <strong>{r.name || r.display_name.split(',')[0]}</strong><br />
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.display_name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div id="leaflet-map-container" style={{ width: '100%', height: '340px', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }} />
                                    {formData.map_location && (
                                        <p style={{ fontSize: '0.78rem', color: '#22c55e', marginTop: '0.5rem' }}>
                                            <i className="fas fa-check-circle" /> Map location set! <a href={formData.map_location} target="_blank" rel="noopener noreferrer">Test link</a>
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Extra card text */}
                            <div className="form-row-1" style={{ marginTop: '0.85rem' }}>
                                <label className="studio-label"><span>Pass Card Note (Gift / Mobile Money info)</span></label>
                                <textarea name="extra_card_text" value={formData.extra_card_text} onChange={handleChange} className="studio-textarea" rows={2} placeholder="e.g. Your presence is our gift. For cash gifts: Airtel 097… MTN 096…" />
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        STEP 3 — Our Story
                    ══════════════════════════════════════════════════════ */}
                    {currentStep === 2 && (
                        <div>
                            <div className="form-step-header">
                                <span className="step-badge"><i className="fas fa-book-open" /> Step 3 of 6 • Our Story</span>
                                <h2>The Love Journey</h2>
                                <p>Share how you met, a romantic quote, and the proposal story.</p>
                            </div>


                            <div className="form-row-1" style={{ marginTop: '1.25rem' }}>
                                <label className="studio-label">Highlight Quote</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <div className="studio-input-wrap" style={{ flex: 1 }}>
                                        <i className="fas fa-quote-left input-icon-left" style={{ color: '#1fa09b' }} />
                                        <input type="text" name="story_highlight" value={formData.story_highlight} onChange={handleChange} placeholder="A romantic quote…" className="studio-input" />
                                    </div>
                                    <button type="button" onClick={() => {
                                        const avail = SPECIAL_QUOTES.filter(s => s !== formData.story_highlight);
                                        setFormData(p => ({ ...p, story_highlight: avail[Math.floor(Math.random() * avail.length)] || SPECIAL_QUOTES[0] }));
                                    }} style={{ whiteSpace: 'nowrap', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#1fa09b' }}>
                                        <i className="fas fa-random" /> Random
                                    </button>
                                </div>
                            </div>

                            <div className="form-row-1" style={{ marginTop: '1.25rem' }}>
                                <label className="studio-label">The Proposal Story</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                    <textarea name="story_part2" value={formData.story_part2} onChange={handleChange} className="studio-textarea" placeholder="Describe the magical proposal moment…" style={{ flex: 1, minHeight: '110px' }} />
                                    <button type="button" onClick={() => {
                                        const avail = PROPOSAL_STORIES.filter(s => s !== formData.story_part2);
                                        setFormData(p => ({ ...p, story_part2: avail[Math.floor(Math.random() * avail.length)] || PROPOSAL_STORIES[0] }));
                                    }} style={{ whiteSpace: 'nowrap', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#1fa09b' }}>
                                        <i className="fas fa-random" /> Inspire
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        STEP 4 — Party & Slider
                    ══════════════════════════════════════════════════════ */}
                    {currentStep === 3 && (
                        <div>
                            <div className="form-step-header">
                                <span className="step-badge"><i className="fas fa-film" /> Step 4 of 6 • Party & Slider</span>
                                <h2>Wedding Party & Image Slider</h2>
                                <p>Add your animated image slider photos, wedding party members, and gift options.</p>
                            </div>

                            {/* ── Image Slider Section (Hero Carousel) ── */}
                            <div className="studio-section-subhead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                    <i className="fas fa-film" style={{ color: '#1fa09b' }} />
                                    <span>Invitation Image Slider</span>
                                </div>
                                {(formData.slider_images || []).length > 0 && (
                                    <span style={{ fontSize: '0.78rem', background: '#ecfdf5', color: '#059669', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', border: '1px solid #a7f3d0' }}>
                                        {(formData.slider_images || []).length} Photo{(formData.slider_images || []).length > 1 ? 's' : ''} Attached
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                                These photos will be displayed in the high-impact animated image slider at the top of your wedding invitation.
                            </p>

                            <ImageUpload
                                label="Upload Slider Photos (Multiple allowed)"
                                subtitle="Upload favorite couple portraits, pre-wedding shots, or celebratory photos."
                                value=""
                                onUpload={urls => setFormData(p => ({
                                    ...p,
                                    slider_images: [...(p.slider_images || []), ...urls],
                                    gallery_images: [...(p.slider_images || []), ...urls],
                                }))}
                                path="slider"
                                id="slider-upload"
                                multiple
                            />

                            {/* Attached Slider Images Grid */}
                            {(formData.slider_images || []).length > 0 ? (
                                <div style={{ marginTop: '0.75rem', marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                        <label className="studio-label" style={{ margin: 0 }}>
                                            <span>Attached Slider Images ({(formData.slider_images || []).length})</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (window.confirm('Remove all slider photos?')) {
                                                    setFormData(p => ({ ...p, slider_images: [], gallery_images: [] }));
                                                }
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Clear All Photos
                                        </button>
                                    </div>
                                    <div className="slider-images-grid">
                                        {formData.slider_images.map((img, i) => (
                                            <div
                                                key={i}
                                                className={`slider-img-item ${i === 0 ? 'is-cover' : ''}`}
                                            >
                                                <img src={img} alt={`Slide ${i + 1}`} />
                                                <span className={`slider-img-badge ${i === 0 ? 'cover' : ''}`}>
                                                    {i === 0 ? 'Cover Slide' : `#${i + 1}`}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="slider-img-delete-btn"
                                                    onClick={() => setFormData(p => {
                                                        const next = [...(p.slider_images || [])];
                                                        next.splice(i, 1);
                                                        return { ...p, slider_images: next, gallery_images: next };
                                                    })}
                                                    title="Remove photo"
                                                >
                                                    ✕
                                                </button>
                                                <div className="slider-img-controls">
                                                    {i > 0 ? (
                                                        <button
                                                            type="button"
                                                            className="slider-reorder-btn"
                                                            onClick={() => moveItem('slider_images', i, i - 1)}
                                                            title="Move earlier"
                                                        >
                                                            ‹
                                                        </button>
                                                    ) : <span />}
                                                    {i < (formData.slider_images.length - 1) && (
                                                        <button
                                                            type="button"
                                                            className="slider-reorder-btn"
                                                            onClick={() => moveItem('slider_images', i, i + 1)}
                                                            title="Move later"
                                                        >
                                                            ›
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    background: '#f8fafc',
                                    border: '1.5px dashed #cbd5e1',
                                    borderRadius: '12px',
                                    padding: '1.25rem',
                                    textAlign: 'center',
                                    color: '#64748b',
                                    fontSize: '0.84rem',
                                    marginBottom: '2.5rem'
                                }}>
                                    <i className="fas fa-images" style={{ fontSize: '1.6rem', color: '#94a3b8', marginBottom: '0.4rem', display: 'block' }} />
                                    No slider images attached yet. Click the upload box above to add your couple photos.
                                </div>
                            )}

                            {/* ── Bridesmaids Section ── */}
                            <div className="studio-section-subhead"><i className="fas fa-female" style={{ color: '#ec4899' }} /><span>Bridesmaids</span></div>
                            {(formData.bridesmaids || []).length === 0 ? (
                                <div className="party-empty-card bridesmaid">
                                    <div className="party-empty-info">
                                        <h4 style={{ color: '#831843' }}>No Bridesmaids Added</h4>
                                        <p style={{ color: '#9d174d' }}>If you have bridesmaids, click the button below to add them to your invitation.</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="studio-btn"
                                        onClick={() => addItem('bridesmaids', { name: '', role: 'Bridesmaid', photo: '' })}
                                        style={{ background: '#ec4899', color: '#fff', border: 'none', padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                        <i className="fas fa-plus" /> Add Bridesmaid
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {(formData.bridesmaids || []).map((bm, i) => (
                                        <div key={i} className="form-row-2" style={{ background: '#fdf2f8', padding: '1rem', borderRadius: '12px', marginBottom: '0.75rem', position: 'relative', border: '1px solid #fce7f3' }}>
                                            <button type="button" onClick={() => removeItem('bridesmaids', i)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.78rem' }}><i className="fas fa-trash" /></button>
                                            <div>
                                                <label className="studio-label">Name</label>
                                                <input type="text" className="studio-input" value={bm.name} onChange={e => updateItem('bridesmaids', i, 'name', e.target.value)} placeholder="e.g. Thandiwe Phiri" />
                                                <label className="studio-label" style={{ marginTop: '0.5rem' }}>Role</label>
                                                <input type="text" className="studio-input" value={bm.role} onChange={e => updateItem('bridesmaids', i, 'role', e.target.value)} placeholder="e.g. Maid of Honour" />
                                            </div>
                                            <ImageUpload label="Photo" value={bm.photo} onUpload={url => updateItem('bridesmaids', i, 'photo', url)} path="party" id={`bm-photo-${i}`} />
                                        </div>
                                    ))}
                                    <button type="button" className="studio-btn studio-btn-outline" onClick={() => addItem('bridesmaids', { name: '', role: 'Bridesmaid', photo: '' })} style={{ marginBottom: '1.5rem' }}>
                                        <i className="fas fa-plus" /> Add Another Bridesmaid
                                    </button>
                                </>
                            )}

                            {/* ── Groomsmen Section ── */}
                            <div className="studio-section-subhead"><i className="fas fa-male" style={{ color: '#1fa09b' }} /><span>Groomsmen</span></div>
                            {(formData.groomsmen || []).length === 0 ? (
                                <div className="party-empty-card groomsman">
                                    <div className="party-empty-info">
                                        <h4 style={{ color: '#14532d' }}>No Groomsmen Added</h4>
                                        <p style={{ color: '#166534' }}>If you have groomsmen, click the button below to add them to your invitation.</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="studio-btn"
                                        onClick={() => addItem('groomsmen', { name: '', role: 'Groomsman', photo: '' })}
                                        style={{ background: '#1fa09b', color: '#fff', border: 'none', padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                        <i className="fas fa-plus" /> Add Groomsman
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {(formData.groomsmen || []).map((gm, i) => (
                                        <div key={i} className="form-row-2" style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', marginBottom: '0.75rem', position: 'relative', border: '1px solid #bbf7d0' }}>
                                            <button type="button" onClick={() => removeItem('groomsmen', i)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.78rem' }}><i className="fas fa-trash" /></button>
                                            <div>
                                                <label className="studio-label">Name</label>
                                                <input type="text" className="studio-input" value={gm.name} onChange={e => updateItem('groomsmen', i, 'name', e.target.value)} placeholder="e.g. Bwalya Mwansa" />
                                                <label className="studio-label" style={{ marginTop: '0.5rem' }}>Role</label>
                                                <input type="text" className="studio-input" value={gm.role} onChange={e => updateItem('groomsmen', i, 'role', e.target.value)} placeholder="e.g. Best Man" />
                                            </div>
                                            <ImageUpload label="Photo" value={gm.photo} onUpload={url => updateItem('groomsmen', i, 'photo', url)} path="party" id={`gm-photo-${i}`} />
                                        </div>
                                    ))}
                                    <button type="button" className="studio-btn studio-btn-outline" onClick={() => addItem('groomsmen', { name: '', role: 'Groomsman', photo: '' })} style={{ marginBottom: '1.5rem' }}>
                                        <i className="fas fa-plus" /> Add Another Groomsman
                                    </button>
                                </>
                            )}

                            {/* ── Gifts & Contributions Section ── */}
                            <div className="studio-section-subhead"><i className="fas fa-gift" style={{ color: '#1fa09b' }} /><span>Gifts & Contributions</span></div>
                            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>Add payment identifiers for mobile money, bank details, cash gifts, or registry links.</p>
                            {(formData.gifts || []).length === 0 ? (
                                <div className="party-empty-card gift">
                                    <div className="party-empty-info">
                                        <h4 style={{ color: '#0f172a' }}>No Gift / Payment Options Added</h4>
                                        <p style={{ color: '#64748b' }}>If you would like to provide gift or payment options for guests, click the button below.</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="studio-btn studio-btn-outline"
                                        onClick={() => addItem('gifts', { giftType: 'Mobile Money', provider: 'Airtel Money', accountName: '', accountNumber: '', instructions: '', url: '' })}
                                    >
                                        <i className="fas fa-plus" /> Add Gift Option
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {(formData.gifts || []).map((gift, i) => (
                                        <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>Gift Option #{i + 1}</strong>
                                                <button type="button" onClick={() => removeItem('gifts', i)} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.78rem' }}><i className="fas fa-trash" /> Remove</button>
                                            </div>
                                            <div className="form-row-2">
                                                <div>
                                                    <label className="studio-label">Type</label>
                                                    <select className="studio-input" value={gift.giftType} onChange={e => updateItem('gifts', i, 'giftType', e.target.value)} style={{ paddingLeft: '0.9rem' }}>
                                                        <option value="Mobile Money">Mobile Money</option>
                                                        <option value="Bank Transfer">Bank Transfer</option>
                                                        <option value="Cash at Event">Cash at Event</option>
                                                        <option value="Gift Registry">Gift Registry / URL</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="studio-label">Provider / Bank Name</label>
                                                    <input type="text" className="studio-input" value={gift.provider} onChange={e => updateItem('gifts', i, 'provider', e.target.value)} placeholder="e.g. MTN, Airtel, FNB" />
                                                </div>
                                                {(gift.giftType === 'Mobile Money' || gift.giftType === 'Bank Transfer' || gift.giftType === 'Other') && (
                                                    <>
                                                        <div>
                                                            <label className="studio-label">Account Name</label>
                                                            <input type="text" className="studio-input" value={gift.accountName} onChange={e => updateItem('gifts', i, 'accountName', e.target.value)} placeholder="Account Holder Name" />
                                                        </div>
                                                        <div>
                                                            <label className="studio-label">Account / Phone Number</label>
                                                            <input type="text" className="studio-input" value={gift.accountNumber} onChange={e => updateItem('gifts', i, 'accountNumber', e.target.value)} placeholder="e.g. 097 000 0000" />
                                                        </div>
                                                    </>
                                                )}
                                                <div>
                                                    <label className="studio-label">Instructions (Optional)</label>
                                                    <input type="text" className="studio-input" value={gift.instructions} onChange={e => updateItem('gifts', i, 'instructions', e.target.value)} placeholder="e.g. Use ref: Wedding" />
                                                </div>
                                                <div>
                                                    <label className="studio-label">Registry URL (Optional)</label>
                                                    <input type="url" className="studio-input" value={gift.url} onChange={e => updateItem('gifts', i, 'url', e.target.value)} placeholder="https://..." />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" className="studio-btn studio-btn-outline" onClick={() => addItem('gifts', { giftType: 'Mobile Money', provider: 'Airtel Money', accountName: '', accountNumber: '', instructions: '', url: '' })} style={{ marginBottom: '1.5rem' }}>
                                        <i className="fas fa-plus" /> Add Another Gift Option
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        STEP 5 — Style & Music
                    ══════════════════════════════════════════════════════ */}
                    {currentStep === 4 && (
                        <div>
                            <div className="form-step-header">
                                <span className="step-badge"><i className="fas fa-palette" /> Step 5 of 6 • Style & Music</span>
                                <h2>Invitation Template, Colors & Soundtrack</h2>
                                <p>Pick a luxury layout, customize theme colors and add romantic background music.</p>
                            </div>

                            {/* Templates */}
                            <label className="studio-label">Select Invitation Template</label>
                            <div className="templates-selection-grid">
                                {TEMPLATE_OPTIONS.map(tpl => {
                                    const isSelected = formData.template_id === tpl.id;
                                    return (
                                        <div key={tpl.id} className={`template-card-item ${isSelected ? 'selected' : ''}`} onClick={() => setFormData(p => ({ ...p, template_id: tpl.id, theme_colors: [] }))}>
                                            {tpl.badge && <span className="template-badge-popular">{tpl.badge}</span>}
                                            <div className="template-card-banner" style={{ background: tpl.bg, color: tpl.textColor }}>
                                                <span className="template-mini-ornament">{tpl.ornament}</span>
                                                <span className="template-mini-couple" style={{ color: tpl.accent }}>
                                                    {formData.groom_name ? `${formData.groom_name.split(' ')[0]} & ${formData.bride_name.split(' ')[0]}` : 'Couple'}
                                                </span>
                                            </div>
                                            <h4 className="template-card-name">{tpl.name}</h4>
                                            <p className="template-card-desc">{tpl.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Music */}
                            <div className="studio-section-subhead" style={{ marginTop: '2rem' }}><i className="fas fa-music" style={{ color: '#1fa09b' }} /><span>Background Music</span></div>
                            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>Choose the song that plays when guests open your invitation. Search any song, upload your MP3, or pick from our wedding classics.</p>

                            {/* Currently selected */}
                            {formData.music_url && formData.music_url !== 'none' && (() => {
                                const match = MUSIC_TRACKS.find(t => t.url === formData.music_url);
                                const title = selectedSongMeta?.title || match?.label || 'Custom Track';
                                const artist = selectedSongMeta?.artist || match?.artist || 'Selected';
                                const isPrev = previewingUrl === formData.music_url;
                                return (
                                    <div className="music-selected-card" style={{ marginBottom: '1rem' }}>
                                        <div className="music-selected-left">
                                            <div className="music-selected-thumb-placeholder"><i className="fas fa-music" /></div>
                                            <div className="music-selected-info">
                                                <div className="music-selected-badge"><i className="fas fa-check-circle" /> Active Song</div>
                                                <div className="music-selected-title">{title}</div>
                                                <div className="music-selected-artist">{artist}</div>
                                            </div>
                                        </div>
                                        <div className="music-selected-actions">
                                            <button type="button" className={`music-preview-btn ${isPrev ? 'playing' : ''}`} onClick={() => togglePreview(formData.music_url)}><i className={`fas ${isPrev ? 'fa-stop' : 'fa-play'}`} /></button>
                                            <button type="button" className="music-remove-btn" onClick={() => { if (previewAudioRef.current) previewAudioRef.current.pause(); setPreviewingUrl(null); setFormData(p => ({ ...p, music_url: 'none' })); setSelectedSongMeta(null); }}><i className="fas fa-times" style={{ marginRight: 4 }} />Remove</button>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Music mode tabs */}
                            <div className="music-mode-tabs">
                                {[['curated', 'fa-heart', 'Wedding Classics'], ['search', 'fa-search', 'Search Online'], ['upload', 'fa-cloud-upload-alt', 'Upload MP3'], ['url', 'fa-link', 'Direct URL']].map(([tab, icon, lbl]) => (
                                    <button key={tab} type="button" className={`music-mode-tab-btn ${musicTab === tab ? 'active' : ''}`} onClick={() => setMusicTab(tab)}>
                                        <i className={`fas ${icon}`} /> {lbl}
                                    </button>
                                ))}
                            </div>

                            {/* Curated */}
                            {musicTab === 'curated' && (
                                <div className="music-track-list">
                                    {MUSIC_TRACKS.map(track => {
                                        const isSel = formData.music_url === track.url;
                                        const isPrev = previewingUrl === track.url;
                                        return (
                                            <div key={track.url} className={`music-track-row ${isSel ? 'selected' : ''}`} onClick={() => { setFormData(p => ({ ...p, music_url: track.url })); setSelectedSongMeta({ title: track.label, artist: track.artist }); }}>
                                                <button type="button" className={`music-preview-btn ${isPrev ? 'playing' : ''}`} onClick={e => { e.stopPropagation(); togglePreview(track.url); }}><i className={`fas ${isPrev ? 'fa-stop' : 'fa-play'}`} /></button>
                                                <div className="music-track-info"><span className="music-track-label">{track.label}</span><span className="music-track-meta">{track.artist} · {track.mood}</span></div>
                                                <div className="music-track-select-indicator">{isSel ? <i className="fas fa-check-circle" style={{ color: '#1fa09b' }} /> : <i className="far fa-circle" style={{ color: '#cbd5e1' }} />}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Search online */}
                            {musicTab === 'search' && (
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div className="music-search-box">
                                        <div className="music-search-input-wrap">
                                            <i className="fas fa-search search-icon" />
                                            <input type="text" className="music-search-input" placeholder="e.g. Ed Sheeran Perfect, Yo Maps, A Thousand Years..." value={musicSearchQuery} onChange={e => setMusicSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchOnlineMusic())} />
                                            {musicSearchQuery && <button type="button" className="music-clear-search-btn" onClick={() => { setMusicSearchQuery(''); setMusicSearchResults([]); setMusicSearchError(null); }}><i className="fas fa-times" /></button>}
                                        </div>
                                        <button type="button" className="music-search-submit-btn" onClick={() => searchOnlineMusic()} disabled={isSearchingMusic || !musicSearchQuery.trim()}>
                                            {isSearchingMusic ? <><i className="fas fa-spinner fa-spin" /> Searching...</> : <><i className="fas fa-search" /> Search</>}
                                        </button>
                                    </div>
                                    <div className="music-chips-row">
                                        <span className="music-chip-label">Popular:</span>
                                        {['Ed Sheeran Perfect', 'A Thousand Years', 'All of Me', 'Yo Maps', 'Until I Found You', 'Canon in D'].map(s => (
                                            <button key={s} type="button" className="music-chip" onClick={() => { setMusicSearchQuery(s); searchOnlineMusic(s); }}>{s}</button>
                                        ))}
                                    </div>
                                    {musicSearchError && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '12px' }}><i className="fas fa-info-circle" style={{ marginRight: 6 }} />{musicSearchError}</div>}
                                    {musicSearchResults.length > 0 && (
                                        <div className="music-results-container">
                                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>Found {musicSearchResults.length} songs (click play to preview, then Select):</div>
                                            {musicSearchResults.map(track => {
                                                const isSel = formData.music_url === track.previewUrl;
                                                const isPrev = previewingUrl === track.previewUrl;
                                                return (
                                                    <div key={track.trackId || track.previewUrl} className={`music-result-item ${isSel ? 'selected' : ''}`}>
                                                        <img src={track.artworkUrl60 || track.artworkUrl100} alt={track.trackName} className="music-result-art" />
                                                        <div className="music-result-details"><div className="music-result-name">{track.trackName}</div><div className="music-result-sub">{track.artistName}{track.collectionName ? ` · ${track.collectionName}` : ''}</div></div>
                                                        <div className="music-result-actions">
                                                            <button type="button" className={`music-preview-btn ${isPrev ? 'playing' : ''}`} onClick={() => togglePreview(track.previewUrl)}><i className={`fas ${isPrev ? 'fa-stop' : 'fa-play'}`} /></button>
                                                            <button type="button" className={`music-select-btn ${isSel ? 'selected' : ''}`} onClick={() => { setFormData(p => ({ ...p, music_url: track.previewUrl })); setSelectedSongMeta({ title: track.trackName, artist: track.artistName, artwork: track.artworkUrl100 }); }}>
                                                                {isSel ? <><i className="fas fa-check" /> Selected</> : 'Select Track'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Upload */}
                            {musicTab === 'upload' && (
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div className="studio-upload-box" onClick={() => document.getElementById('audio-file-upload')?.click()} style={{ minHeight: 120 }}>
                                        <input type="file" id="audio-file-upload" accept="audio/mp3,audio/mpeg,audio/m4a,audio/wav,audio/*" style={{ display: 'none' }} onChange={async e => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            if (file.size > 50 * 1024 * 1024) { alert('Audio max 50MB'); return; }
                                            const url = await uploadImage(file, 'wedding-music', 'music-upload');
                                            if (url) { setFormData(p => ({ ...p, music_url: url })); setSelectedSongMeta({ title: file.name.replace(/\.[^/.]+$/, ''), artist: 'Custom Upload' }); }
                                        }} />
                                        <div className="upload-icon-circle">
                                            <i className="fas fa-music" style={{ color: '#1fa09b' }} />
                                            <div className="upload-prompt" style={{ marginLeft: '0.75rem' }}>
                                                <h4 style={{ margin: 0, fontSize: '0.85rem' }}>Click to upload your custom wedding song</h4>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>MP3 / M4A / WAV · Max 50MB</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Direct URL */}
                            {musicTab === 'url' && (
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <label className="studio-label">Direct Audio URL</label>
                                    <div className="studio-input-wrap">
                                        <i className="fas fa-link input-icon-left" style={{ color: '#1fa09b' }} />
                                        <input type="url" className="studio-input" placeholder="https://example.com/song.mp3" value={MUSIC_TRACKS.some(t => t.url === formData.music_url) || formData.music_url === 'none' ? '' : formData.music_url} onChange={e => { setFormData(p => ({ ...p, music_url: e.target.value })); setSelectedSongMeta({ title: 'Direct URL Track', artist: e.target.value }); }} />
                                    </div>
                                    <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Paste any direct audio link (.mp3, .m4a or cloud stream).</small>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        STEP 6 — Preview & Launch
                    ══════════════════════════════════════════════════════ */}
                    {currentStep === 5 && (
                        <div>
                            <div className="form-step-header">
                                <span className="step-badge"><i className="fas fa-paper-plane" /> Step 6 of 6 • Final Review</span>
                                <h2>Review & Publish Your Invitation</h2>
                                <p>Check all details below and launch your wedding website.</p>
                            </div>

                            {/* ── Modern Hero Review Banner ── */}
                            <div
                                className="review-hero-banner"
                                style={{
                                    backgroundImage: (formData.slider_images && formData.slider_images.length > 0)
                                        ? `url(${formData.slider_images[0]})`
                                        : (formData.cover_image ? `url(${formData.cover_image})` : 'none')
                                }}
                            >
                                <div className="review-hero-overlay" />
                                <div className="review-hero-content">
                                    <div className="review-hero-tagline">{formData.tagline || 'WE ARE GETTING MARRIED'}</div>
                                    <h3 className="review-hero-title">
                                        {formData.groom_name || 'Groom'} & {formData.bride_name || 'Bride'}
                                    </h3>
                                    <div className="review-hero-meta-row">
                                        <span className="review-hero-pill">
                                            <i className="fas fa-calendar-alt" style={{ color: '#1fa09b' }} />
                                            {formData.date ? new Date(formData.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Date not set'}
                                        </span>
                                        <span className="review-hero-pill">
                                            <i className="fas fa-map-marker-alt" style={{ color: '#1fa09b' }} />
                                            {formData.location || formData.ceremony_venue || 'Zambia'}
                                        </span>
                                        <span className="review-hero-pill">
                                            <i className="fas fa-palette" style={{ color: '#1fa09b' }} />
                                            {activeTemplate.name}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Attached Photos & Media Showcase ── */}
                            <div className="review-media-card">
                                <div className="review-section-header">
                                    <h4><i className="fas fa-images" style={{ color: '#1fa09b' }} /> Attached Photos & Visuals</h4>
                                    <button type="button" className="edit-jump-link" onClick={() => setCurrentStep(3)}>
                                        Manage Photos
                                    </button>
                                </div>

                                {/* Couple Avatars */}
                                <div className="review-couple-media-grid">
                                    <div className="review-person-card">
                                        {formData.groom_image ? (
                                            <img src={formData.groom_image} alt={formData.groom_name || 'Groom'} className="review-person-img" />
                                        ) : (
                                            <div className="review-person-placeholder"><i className="fas fa-male" /></div>
                                        )}
                                        <div>
                                            <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block' }}>{formData.groom_name || 'Groom'}</strong>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>The Groom {formData.groom_image ? '· Photo Attached' : '· No photo'}</span>
                                        </div>
                                    </div>

                                    <div className="review-person-card">
                                        {formData.bride_image ? (
                                            <img src={formData.bride_image} alt={formData.bride_name || 'Bride'} className="review-person-img" />
                                        ) : (
                                            <div className="review-person-placeholder"><i className="fas fa-female" /></div>
                                        )}
                                        <div>
                                            <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block' }}>{formData.bride_name || 'Bride'}</strong>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>The Bride {formData.bride_image ? '· Photo Attached' : '· No photo'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Slider Photos Strip */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Animated Slider Photos ({(formData.slider_images || []).length})
                                        </span>
                                        {(formData.slider_images || []).length > 0 && (
                                            <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>Active in top carousel</span>
                                        )}
                                    </div>
                                    {(formData.slider_images || []).length > 0 ? (
                                        <div className="review-slider-strip">
                                            {formData.slider_images.map((img, i) => (
                                                <div key={i} style={{ position: 'relative' }}>
                                                    <img src={img} alt={`Slide ${i + 1}`} className="review-slider-thumb" />
                                                    <span style={{
                                                        position: 'absolute',
                                                        bottom: 4,
                                                        left: 4,
                                                        background: 'rgba(15,23,42,0.8)',
                                                        color: '#fff',
                                                        fontSize: '0.62rem',
                                                        fontWeight: 700,
                                                        padding: '1px 5px',
                                                        borderRadius: '4px'
                                                    }}>
                                                        #{i + 1}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', fontSize: '0.82rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>No slider photos added yet. Default template backgrounds will be used.</span>
                                            <button type="button" onClick={() => setCurrentStep(3)} style={{ border: 'none', background: 'none', color: '#1fa09b', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                                                + Add Slider Photos
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Key Event Details Grid ── */}
                            <div className="review-details-grid">
                                {/* Ceremony & Reception Card */}
                                <div className="review-detail-card">
                                    <div>
                                        <div className="review-detail-card-head">
                                            <span><i className="fas fa-church" style={{ color: '#1fa09b' }} /> Ceremony & Reception</span>
                                            <button type="button" className="edit-jump-link" onClick={() => setCurrentStep(1)}>Edit</button>
                                        </div>
                                        <div style={{ marginBottom: '0.65rem' }}>
                                            <h5 className="review-detail-item-title">{formData.ceremony_venue || 'Venue not specified'}</h5>
                                            <p className="review-detail-item-sub">
                                                {formData.ceremony_title || 'Ceremony'} {formData.ceremony_time ? `· ${formData.ceremony_time}` : ''}
                                            </p>
                                        </div>
                                        {formData.reception_venue && (
                                            <div>
                                                <h5 className="review-detail-item-title">{formData.reception_venue}</h5>
                                                <p className="review-detail-item-sub">
                                                    {formData.reception_title || 'Reception'} {formData.reception_time ? `· ${formData.reception_time}` : ''}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Wedding Party & Registry Card */}
                                <div className="review-detail-card">
                                    <div>
                                        <div className="review-detail-card-head">
                                            <span><i className="fas fa-users" style={{ color: '#1fa09b' }} /> Party & Registry</span>
                                            <button type="button" className="edit-jump-link" onClick={() => setCurrentStep(3)}>Edit</button>
                                        </div>
                                        <div style={{ marginBottom: '0.65rem' }}>
                                            <h5 className="review-detail-item-title">
                                                {(formData.bridesmaids || []).length} Bridesmaids · {(formData.groomsmen || []).length} Groomsmen
                                            </h5>
                                            <p className="review-detail-item-sub">
                                                {((formData.bridesmaids || []).length + (formData.groomsmen || []).length) > 0 ? 'Wedding entourage listed' : 'No party members added'}
                                            </p>
                                        </div>
                                        <div>
                                            <h5 className="review-detail-item-title">
                                                {(formData.gifts || []).length} Gift / Payment Option{(formData.gifts || []).length !== 1 ? 's' : ''}
                                            </h5>
                                            <p className="review-detail-item-sub">
                                                {(formData.gifts || []).length > 0 ? 'Contributions enabled for guests' : 'No registry details added'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Atmosphere & Soundtrack Card */}
                                <div className="review-detail-card">
                                    <div>
                                        <div className="review-detail-card-head">
                                            <span><i className="fas fa-music" style={{ color: '#1fa09b' }} /> Music & Dress Code</span>
                                            <button type="button" className="edit-jump-link" onClick={() => setCurrentStep(4)}>Edit</button>
                                        </div>
                                        <div style={{ marginBottom: '0.65rem' }}>
                                            <h5 className="review-detail-item-title">
                                                {selectedSongMeta?.title || (formData.music_url && formData.music_url !== 'none' ? 'Custom Music Track' : 'Default Romantic Soundtrack')}
                                            </h5>
                                            <p className="review-detail-item-sub">
                                                {formData.music_url === 'none' ? 'Music disabled' : 'Plays automatically when invitation opens'}
                                            </p>
                                        </div>
                                        <div>
                                            <h5 className="review-detail-item-title">
                                                {formData.dress_code || 'Formal Attire'}
                                            </h5>
                                            <p className="review-detail-item-sub">
                                                {(formData.dress_code_colors || []).length > 0 ? `${(formData.dress_code_colors || []).length} theme colors highlighted` : 'Guest attire guideline'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Pricing Summary Card */}
                            <div className="publish-pricing-summary-card">
                                <div className="publish-pricing-top">
                                    <div className="publish-pricing-badge">
                                        <i className="fas fa-tag" />
                                        <span>PACKAGE & PRICING</span>
                                    </div>
                                    <span className="tier-tag-pill">{currentPricing.badge}</span>
                                </div>
                                <div className="publish-pricing-content">
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', color: '#0f172a' }}>
                                            {currentPricing.tier}
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                                            Estimated {formData.guest_count || 100} guests capacity with all premium features.
                                        </p>
                                    </div>
                                    <div className="publish-pricing-val-box">
                                        <span className="price-label-tiny">Total Package</span>
                                        <span className="price-number-big">{currentPricing.formattedPrice}</span>
                                    </div>
                                </div>
                                {isEditMode && amountPaid > 0 && (
                                    <div className="publish-pricing-balance-row">
                                        <div className="balance-info-col">
                                            <span className="bal-subtext">Previously Paid:</span>
                                            <strong className="bal-val">{formatKwacha(amountPaid)}</strong>
                                        </div>
                                        <div className="balance-info-col">
                                            <span className="bal-subtext">Balance Due:</span>
                                            <strong className={`bal-val ${balanceDue > 0 ? 'due' : 'settled'}`}>
                                                {balanceDue > 0 ? formatKwacha(balanceDue) : 'Paid in full (K0)'}
                                            </strong>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {currentUser ? (
                                <div style={{ padding: '1rem', background: 'var(--cw-primary-light)', border: '1.5px solid var(--cw-primary-border)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
                                    <i className="fas fa-shield-alt" style={{ color: '#1fa09b', fontSize: '1.35rem' }} />
                                    <div>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--cw-dark)', fontWeight: 700 }}>Signed in as: {currentUser.email}</span>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Your invitation will be saved directly to your account.</p>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '1rem', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
                                    <i className="fas fa-info-circle" style={{ color: '#d97706', fontSize: '1.2rem' }} />
                                    <div>
                                        <span style={{ fontSize: '0.88rem', color: '#92400e', fontWeight: 700 }}>You're not signed in</span>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#78350f' }}>You'll be taken to sign up to create your account when you click Save & Launch — your draft is safe and will not be lost.</p>
                                    </div>
                                </div>
                            )}

                            {publishError && (
                                <div className="inflow-error-box" style={{ marginBottom: '1rem' }}>
                                    <i className="fas fa-exclamation-triangle" /><span>{publishError}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step Validation Banner */}
                    {stepErrorBanner && (
                        <div className="studio-step-validation-banner">
                            <i className="fas fa-exclamation-triangle" style={{ fontSize: '1.2rem', flexShrink: 0 }} />
                            <span>{stepErrorBanner}</span>
                        </div>
                    )}

                    {/* Footer navigation */}
                    <div className="studio-footer-actions">
                        <button
                            type="button"
                            className="studio-btn studio-btn-outline"
                            disabled={currentStep === 0}
                            onClick={() => {
                                setStepErrorBanner('');
                                setValidationErrors({});
                                setCurrentStep(p => p - 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            <i className="fas fa-arrow-left" /> Back
                        </button>
                        {currentStep < 5 ? (
                            <button
                                type="button"
                                className="studio-btn studio-btn-primary"
                                onClick={handleNextStep}
                            >
                                Next Step <i className="fas fa-arrow-right" style={{ color: '#1fa09b', marginLeft: '4px' }} />
                            </button>
                        ) : (
                            <button id="launch-invitation-btn" type="button" className="studio-btn studio-btn-launch-final" disabled={saving} onClick={handlePublishClick}>
                                {saving ? (
                                    <><i className="fas fa-spinner fa-spin" style={{ color: '#1fa09b' }} /> Saving...</>
                                ) : isEditMode ? (
                                    <><i className="fas fa-check-circle" style={{ color: '#1fa09b' }} /> Save <i className="fas fa-arrow-right" style={{ color: '#1fa09b', marginLeft: '6px' }} /></>
                                ) : (
                                    <><i className="fas fa-paper-plane" style={{ color: '#1fa09b' }} />{currentUser ? 'Launch Wedding Invitation' : 'Save & Launch'}<i className="fas fa-arrow-right" style={{ color: '#1fa09b', marginLeft: '6px' }} /></>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Live Preview */}
                <div className="studio-preview-col">
                    <div className="preview-col-header">
                        <h3><span className="live-pulse-dot" /> Live Mobile Simulator</h3>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{activeTemplate.name}</span>
                    </div>
                    <div className="phone-mockup-frame">
                        <div className="phone-speaker-island" />
                        <div className="phone-screen">
                            <div className="mock-invitation-container" style={{ background: activeTemplate.bg }}>
                                <div className="mock-hero" style={{ backgroundImage: (formData.slider_images && formData.slider_images.length > 0) ? `url(${formData.slider_images[0]})` : (formData.cover_image ? `url(${formData.cover_image})` : 'none') }}>
                                    <div className="mock-hero-overlay" style={{ background: activeTemplate.bg, opacity: ((formData.slider_images && formData.slider_images.length > 0) || formData.cover_image) ? 0.75 : 1 }} />
                                    <div className="mock-hero-content" style={{ color: activeTemplate.textColor }}>
                                        <span className="mock-ornament" style={{ color: activeTemplate.accent }}>{activeTemplate.ornament}</span>
                                        <div className="mock-tagline" style={{ color: activeTemplate.accent }}>{formData.tagline || 'WE ARE GETTING MARRIED'}</div>
                                        <h2 className="mock-couple-title" style={{ color: activeTemplate.accent }}>
                                            {formData.groom_name || 'Groom'}<br />
                                            <span style={{ fontSize: '1rem', fontStyle: 'italic', fontWeight: 400, color: activeTemplate.textColor }}>&</span><br />
                                            {formData.bride_name || 'Bride'}
                                        </h2>
                                        <div className="mock-date-pill" style={{ borderColor: activeTemplate.accent, color: activeTemplate.accent }}>
                                            {formData.date ? new Date(formData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select Date'}
                                        </div>
                                    </div>
                                </div>
                                <div className="mock-section" style={{ background: 'rgba(255,255,255,0.95)' }}>
                                    <div className="mock-section-title" style={{ color: '#0f172a' }}>
                                        <i className="fas fa-church" style={{ color: '#1fa09b' }} /><span>{formData.ceremony_title || 'Ceremony'} & {formData.reception_title || 'Reception'}</span>
                                    </div>
                                    <div className="mock-venue-item"><strong>{formData.ceremony_venue || 'Ceremony Venue'}</strong><span>{formData.ceremony_time || 'Morning Service'}</span></div>
                                    <div className="mock-venue-item"><strong>{formData.reception_venue || 'Reception Venue'}</strong><span>{formData.reception_time || 'Afternoon Party'}</span></div>
                                </div>
                                {formData.program && formData.program.length > 0 && (
                                    <div className="mock-section" style={{ background: 'rgba(255,255,255,0.95)' }}>
                                        <div className="mock-section-title" style={{ color: '#0f172a' }}>
                                            <i className="fas fa-list-ol" style={{ color: '#1fa09b' }} /><span>Program Timeline</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {formData.program.slice(0, 4).map((p, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#475569' }}>
                                                    <span style={{ fontWeight: 600 }}>{p.title || `Part ${i + 1}`}</span>
                                                    <span style={{ color: '#94a3b8' }}>{p.time || ''}</span>
                                                </div>
                                            ))}
                                            {formData.program.length > 4 && (
                                                <span style={{ fontSize: '0.68rem', color: '#1fa09b', fontStyle: 'italic' }}>
                                                    +{formData.program.length - 4} more parts
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {formData.dress_code && (
                                    <div className="mock-section" style={{ background: 'rgba(255,255,255,0.95)' }}>
                                        <div className="mock-section-title" style={{ color: '#0f172a' }}>
                                            <i className="fas fa-tshirt" style={{ color: '#1fa09b' }} /><span>Dress Code</span>
                                        </div>
                                        <p style={{ fontSize: '0.78rem', color: '#334155', margin: '0 0 0.4rem' }}>{formData.dress_code}</p>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {(formData.dress_code_colors || []).map((c, i) => (
                                                <span key={i} style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: c, display: 'inline-block', border: '1px solid rgba(0,0,0,0.1)' }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {formData.story_part2 && (
                                    <div className="mock-section" style={{ background: 'rgba(255,255,255,0.95)' }}>
                                        <div className="mock-section-title" style={{ color: '#0f172a' }}>
                                            <i className="fas fa-heart" style={{ color: '#1fa09b' }} /><span>Our Story</span>
                                        </div>
                                        <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>{formData.story_part2.slice(0, 100)}…</p>
                                    </div>
                                )}
                                <div style={{ padding: '0 0.85rem 1rem' }}>
                                    <button type="button" className="mock-rsvp-btn" style={{ background: '#0f172a', color: '#fff' }}>
                                        <i className="fas fa-envelope-open-text" style={{ color: '#1fa09b', marginRight: 6 }} />RSVP Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientCreateWedding;
