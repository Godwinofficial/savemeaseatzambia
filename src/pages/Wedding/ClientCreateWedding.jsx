import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Link, useSearchParams, useParams } from 'react-router-dom';
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
    { id: 2, name: 'Golden Romance', badge: 'Luxury', desc: 'Warm champagne gold with royal candlelight vibes.', bg: 'linear-gradient(135deg, #2a2012 0%, #45341c 100%)', accent: '#e6ca85', textColor: '#fffaf0', ornament: '✦' },
    { id: 3, name: 'Tropical Elegance', badge: 'Vibrant', desc: 'Deep emerald greens with lush botanical accents.', bg: 'linear-gradient(135deg, #0b221a 0%, #13392d 100%)', accent: '#34d399', textColor: '#ecfdf5', ornament: '🌿' },
    { id: 7, name: 'Botanical Olive', badge: 'Minimal', desc: 'Earthy olive tones and clean organic minimalism.', bg: 'linear-gradient(135deg, #252e24 0%, #3e4a3b 100%)', accent: '#a3b18a', textColor: '#f4f6f0', ornament: '❀' },
    { id: 8, name: 'Terracotta Earth', badge: 'Warm', desc: 'Warm terracotta and desert rose for romantic events.', bg: 'linear-gradient(135deg, #3d1f19 0%, #68362d 100%)', accent: '#f87171', textColor: '#fff5f5', ornament: '✧' }
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
    theme_colors: ['#000000', '#ffffff', '#ffffff', '#000000'],
    music_url: '',
    hero_video_url: '',
    slider_images: [],
    gallery_images: [],
    bridesmaids: [{ name: '', role: '', photo: '' }],
    groomsmen: [{ name: '', role: '', photo: '' }],
    gifts: [{ giftType: '', provider: '', accountName: '', accountNumber: '', instructions: '', url: '' }],
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
                    bridesmaids: Array.isArray(data.bridesmaids) && data.bridesmaids.length > 0 ? data.bridesmaids : [{ name: '', role: 'Bridesmaid', photo: '' }],
                    groomsmen: Array.isArray(data.groomsmen) && data.groomsmen.length > 0 ? data.groomsmen : [{ name: '', role: 'Groomsman', photo: '' }],
                    gifts: Array.isArray(data.gifts) && data.gifts.length > 0 ? data.gifts : [{ giftType: 'Mobile Money', provider: 'Airtel Money', accountName: '', accountNumber: '', instructions: '', url: '' }],
                    allowed_guests: data.allowed_guests || ['1', '2'],
                    slider_images: Array.isArray(data.slider_images) ? data.slider_images : [],
                    gallery_images: Array.isArray(data.gallery_images) ? data.gallery_images : [],
                    dress_code_colors: Array.isArray(data.dress_code_colors) ? data.dress_code_colors : [],
                    theme_colors: Array.isArray(data.theme_colors) && data.theme_colors.length > 0 ? data.theme_colors : ['#000000', '#ffffff', '#ffffff', '#000000'],
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
        setFormData(prev => {
            const prevBio = getAutoBio(personType, prev[name]);
            const newBio = getAutoBio(personType, value);
            const shouldUpdate = !prev[bioKey] || prev[bioKey] === prevBio;
            return { ...prev, [name]: value, [bioKey]: shouldUpdate ? newBio : prev[bioKey] };
        });
    };

    // ── Image upload helper ──────────────────────────────────────────────────
    const uploadImage = async (file, path, uploadId) => {
        if (!file) return null;
        setUploadingImage(true);
        setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }));
        try {
            const ext = file.name.split('.').pop();
            const filePath = `${path}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
            const interval = setInterval(() => {
                setUploadProgress(prev => { const c = prev[uploadId] || 0; return c < 90 ? { ...prev, [uploadId]: c + 10 } : prev; });
            }, 100);
            const { error } = await supabase.storage.from('wedding-uploads').upload(filePath, file);
            clearInterval(interval);
            if (error) { const url = URL.createObjectURL(file); return url; }
            const { data } = supabase.storage.from('wedding-uploads').getPublicUrl(filePath);
            setUploadProgress(prev => ({ ...prev, [uploadId]: 100 }));
            setTimeout(() => setUploadProgress(prev => { const n = { ...prev }; delete n[uploadId]; return n; }), 600);
            return data.publicUrl;
        } catch { return URL.createObjectURL(file); }
        finally { setUploadingImage(false); }
    };

    const ImageUpload = ({ label, value, onUpload, path = 'misc', id, multiple = false }) => {
        const uid = id || `upload-${Date.now()}`;
        const prog = uploadProgress[uid] || 0;
        const handleChange = async (e) => {
            const files = Array.from(e.target.files);
            if (!files.length) return;
            if (multiple) {
                const urls = (await Promise.all(files.filter(f => f.size < 5 * 1024 * 1024).map(f => uploadImage(f, path, `${uid}-${Math.random().toString(36).slice(2, 6)}`)))).filter(Boolean);
                if (urls.length) onUpload(urls);
            } else {
                if (files[0].size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
                const url = await uploadImage(files[0], path, uid);
                if (url) onUpload(url);
            }
        };
        return (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
                {label && <label className="studio-label"><span>{label}</span></label>}
                <div
                    className="studio-upload-box"
                    onClick={() => document.getElementById(uid)?.click()}
                    style={{ minHeight: value && !multiple ? '0' : undefined }}
                >
                    <input type="file" id={uid} accept="image/*" multiple={multiple} onChange={handleChange} style={{ display: 'none' }} />
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
                            {prog > 0 ? <i className="fas fa-spinner fa-spin" style={{ color: '#1fa09b' }} /> : <i className="fas fa-cloud-upload-alt" style={{ color: '#1fa09b' }} />}
                            <div className="upload-prompt" style={{ marginLeft: '0.75rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.85rem' }}>{prog > 0 ? `Uploading ${prog}%...` : multiple ? 'Click to add photos' : 'Click to upload'}</h4>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Max 5MB · JPG / PNG / WEBP</p>
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
        setFormData(prev => ({ ...prev, [name]: value, ...(name === 'date' ? { ceremony_date: value, reception_date: value } : {}) }));
    };

    const canProceed = (stepIdx) => {
        if (isEditMode) return true;
        if (stepIdx === 0) return (formData.groom_name?.trim() || '') !== '' && (formData.bride_name?.trim() || '') !== '';
        if (stepIdx === 1) return (formData.date || '') !== '' && (formData.ceremony_venue?.trim() || '') !== '';
        return true;
    };

    const handleSaveCurrentChanges = async (finish = false) => {
        if (!currentUser) {
            setShowAuthModal(true);
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

            const { data: updated, error: updateErr } = await supabase
                .from('weddings')
                .update(updatePayload)
                .eq('slug', editSlug)
                .eq('user_id', currentUser.id)
                .select()
                .single();

            if (updateErr) throw updateErr;

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
        if (!currentUser) { setShowAuthModal(true); }
        else { saveDraftToDatabase(currentUser, formData); }
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
            navigate('/my-events');
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
                onSignIn={() => setShowAuthModal(true)}
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
                        { label: 'Party & Photos', icon: 'fa-images' },
                        { label: 'Style & Music', icon: 'fa-palette' },
                        { label: 'Preview & Launch', icon: 'fa-paper-plane' },
                    ].map((step, idx) => (
                        <button
                            key={idx} type="button"
                            className={`studio-step-btn ${currentStep === idx ? 'active' : ''} ${currentStep > idx ? 'completed' : ''}`}
                            onClick={() => isEditMode ? setCurrentStep(idx) : (idx === 0 ? setCurrentStep(0) : canProceed(Math.min(idx - 1, 1)) && setCurrentStep(idx))}
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
                                    <div className="studio-input-wrap" style={{ marginBottom: '1rem' }}>
                                        <i className="fas fa-user input-icon-left" style={{ color: '#1fa09b' }} />
                                        <input type="text" name="groom_name" value={formData.groom_name} onChange={handlePersonNameChange} placeholder="e.g. Chanda Banda" className="studio-input" />
                                    </div>
                                    <ImageUpload label="Groom's Photo" value={formData.groom_image} onUpload={url => setFormData(p => ({ ...p, groom_image: url }))} path="couples" id="groom-photo-upload" />
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
                                    <div className="studio-input-wrap" style={{ marginBottom: '1rem' }}>
                                        <i className="fas fa-user input-icon-left" style={{ color: '#ec4899' }} />
                                        <input type="text" name="bride_name" value={formData.bride_name} onChange={handlePersonNameChange} placeholder="e.g. Mutale Mwila" className="studio-input" />
                                    </div>
                                    <ImageUpload label="Bride's Photo" value={formData.bride_image} onUpload={url => setFormData(p => ({ ...p, bride_image: url }))} path="couples" id="bride-photo-upload" />
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
                                        <input type="date" name="date" value={formData.date} onChange={handleChange} className="studio-input" required />
                                    </div>
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
                            <div className="studio-section-subhead" style={{ marginTop: '1.5rem' }}><i className="fas fa-church" style={{ color: '#1fa09b' }} /><span>Ceremony Details</span></div>
                            <div className="form-row-2">
                                <div>
                                    <label className="studio-label">Ceremony Venue *</label>
                                    <div className="studio-input-wrap">
                                        <i className="fas fa-landmark input-icon-left" style={{ color: '#1fa09b' }} />
                                        <input type="text" name="ceremony_venue" value={formData.ceremony_venue} onChange={handleChange} placeholder="e.g. Cathedral of the Holy Cross" className="studio-input" required />
                                    </div>
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
                        STEP 4 — Party & Photos
                    ══════════════════════════════════════════════════════ */}
                    {currentStep === 3 && (
                        <div>
                            <div className="form-step-header">
                                <span className="step-badge"><i className="fas fa-images" /> Step 4 of 6 • Party & Photos</span>
                                <h2>Wedding Party, Gallery & Gifts</h2>
                                <p>Add bridesmaids, groomsmen, gallery photos, and gift/payment options.</p>
                            </div>

                            {/* Bridesmaids */}
                            <div className="studio-section-subhead"><i className="fas fa-female" style={{ color: '#ec4899' }} /><span>Bridesmaids</span></div>
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
                                <i className="fas fa-plus" /> Add Bridesmaid
                            </button>

                            {/* Groomsmen */}
                            <div className="studio-section-subhead"><i className="fas fa-male" style={{ color: '#1fa09b' }} /><span>Groomsmen</span></div>
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
                                <i className="fas fa-plus" /> Add Groomsman
                            </button>

                            {/* Gifts */}
                            <div className="studio-section-subhead"><i className="fas fa-gift" style={{ color: '#1fa09b' }} /><span>Gifts & Contributions</span></div>
                            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>Add payment identifiers for cash gifts or links to gift registries.</p>
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
                                            <input type="text" className="studio-input" value={gift.provider} onChange={e => updateItem('gifts', i, 'provider', e.target.value)} placeholder="e.g. MTN, FNB" />
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
                            <button type="button" className="studio-btn studio-btn-outline" onClick={() => addItem('gifts', { giftType: 'Mobile Money', provider: '', accountName: '', accountNumber: '', instructions: '', url: '' })} style={{ marginBottom: '1.5rem' }}>
                                <i className="fas fa-plus" /> Add Gift Option
                            </button>

                            {/* Gallery / Slider */}
                            <div className="studio-section-subhead"><i className="fas fa-images" style={{ color: '#1fa09b' }} /><span>Photo Gallery</span></div>
                            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>Upload photos for the invitation gallery and image slider.</p>
                            <div className="form-row-2">
                                <ImageUpload label="Add Slider / Hero Images (multiple)" value="" onUpload={urls => setFormData(p => ({ ...p, slider_images: [...(p.slider_images || []), ...urls] }))} path="hero" id="slider-upload" multiple />
                                <ImageUpload label="Add Gallery Photos (multiple)" value="" onUpload={urls => setFormData(p => ({ ...p, gallery_images: [...(p.gallery_images || []), ...urls] }))} path="gallery" id="gallery-upload" multiple />
                            </div>
                            {(formData.gallery_images || []).length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
                                    {formData.gallery_images.map((img, i) => (
                                        <div key={i} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1', background: '#f1f5f9' }}>
                                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button type="button" onClick={() => setFormData(p => { const arr = [...(p.gallery_images || [])]; arr.splice(i, 1); return { ...p, gallery_images: arr }; })} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(239,68,68,0.85)', border: 'none', color: '#fff', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>✕</button>
                                        </div>
                                    ))}
                                </div>
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
                                        <div key={tpl.id} className={`template-card-item ${isSelected ? 'selected' : ''}`} onClick={() => setFormData(p => ({ ...p, template_id: tpl.id }))}>
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

                            {/* Theme Colors */}
                            <div style={{ marginTop: '2rem' }}>
                                <label className="studio-label">Theme Accent Colors</label>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>Colors control: 1st = Accent/Buttons, 2nd = Background, 3rd = Cards, 4th = Text</p>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {(formData.theme_colors || []).map((color, idx) => (
                                        <div key={idx} style={{ textAlign: 'center' }}>
                                            <input type="color" value={color} onChange={e => setFormData(prev => { const arr = [...prev.theme_colors]; arr[idx] = e.target.value; return { ...prev, theme_colors: arr }; })} style={{ width: 44, height: 44, border: 'none', borderRadius: '50%', cursor: 'pointer', padding: 0, background: 'none' }} title={['Accent', 'Background', 'Card', 'Text'][idx] || `Color ${idx + 1}`} />
                                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>{['Accent', 'BG', 'Card', 'Text'][idx] || `#${idx + 1}`}</div>
                                        </div>
                                    ))}
                                </div>
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

                            <div className="publish-card-summary">
                                <div className="summary-couple-header">
                                    {formData.cover_image ? <img src={formData.cover_image} alt="Couple" className="summary-avatar" /> : <div className="summary-avatar-placeholder"><i className="fas fa-heart" /></div>}
                                    <div>
                                        <h3 className="summary-couple-names">{formData.groom_name} & {formData.bride_name}</h3>
                                        <div className="summary-meta-badge">Template: <strong>{activeTemplate.name}</strong></div>
                                    </div>
                                </div>
                                <div className="summary-grid-details">
                                    <div className="summary-detail-item"><i className="fas fa-calendar" style={{ color: '#1fa09b' }} /><span>{formData.date ? new Date(formData.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Date not set'}</span></div>
                                    <div className="summary-detail-item"><i className="fas fa-church" style={{ color: '#1fa09b' }} /><span>{formData.ceremony_venue || 'Ceremony venue'}</span></div>
                                    <div className="summary-detail-item"><i className="fas fa-hotel" style={{ color: '#1fa09b' }} /><span>{formData.reception_venue || 'Reception venue'}</span></div>
                                    <div className="summary-detail-item"><i className="fas fa-tshirt" style={{ color: '#1fa09b' }} /><span>{formData.dress_code || 'Formal Attire'}</span></div>
                                    <div className="summary-detail-item"><i className="fas fa-users" style={{ color: '#1fa09b' }} /><span>{(formData.bridesmaids || []).length} bridesmaids · {(formData.groomsmen || []).length} groomsmen</span></div>
                                    <div className="summary-detail-item"><i className="fas fa-images" style={{ color: '#1fa09b' }} /><span>{(formData.gallery_images || []).length} gallery photos</span></div>
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
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#78350f' }}>You'll be asked to log in when you click Launch — your draft is safe and will not be lost.</p>
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

                    {/* Footer navigation */}
                    <div className="studio-footer-actions">
                        <button type="button" className="studio-btn studio-btn-outline" disabled={currentStep === 0} onClick={() => setCurrentStep(p => p - 1)}>
                            <i className="fas fa-arrow-left" /> Back
                        </button>
                        {currentStep < 5 ? (
                            <button type="button" className="studio-btn studio-btn-primary" disabled={currentStep <= 1 && !canProceed(currentStep)} onClick={() => setCurrentStep(p => p + 1)}>
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
                                <div className="mock-hero" style={{ backgroundImage: formData.cover_image ? `url(${formData.cover_image})` : 'none' }}>
                                    <div className="mock-hero-overlay" style={{ background: activeTemplate.bg, opacity: formData.cover_image ? 0.75 : 1 }} />
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
                                        <i className="fas fa-church" style={{ color: '#1fa09b' }} /><span>Ceremony & Reception</span>
                                    </div>
                                    <div className="mock-venue-item"><strong>{formData.ceremony_venue || 'Ceremony Venue'}</strong><span>{formData.ceremony_time || 'Morning Service'}</span></div>
                                    <div className="mock-venue-item"><strong>{formData.reception_venue || 'Reception Venue'}</strong><span>{formData.reception_time || 'Afternoon Party'}</span></div>
                                </div>
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
