import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './AddBirthday.css';

// Auto-computes ordinal suffix: 1→1st, 2→2nd, 21→21st, 30→30th etc.
const getOrdinal = (n) => {
    const num = parseInt(n, 10);
    if (isNaN(num)) return String(n);
    const s = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (s[(v - 20) % 10] || s[v] || s[0]);
};

const AddBirthday = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [saved, setSaved] = useState(false);

    const initialForm = {
        child_name: '',
        logo_initials: '',
        hero_text: '',
        age: '',
        date: '',
        time: '',
        venue_name: '',
        venue_address: '',
        map_embed: '',
        theme: '',
        dress_code: '',
        cover_image: '',
        hero_image: '',
        rsvp_deadline: '',
        message: "We'd love for you to join us in celebrating!",
        hero_greeting: 'Shhhhh!!!',
        welcome_message: 'This is not just a party—it’s a secret waiting to unfold. We can’t wait to celebrate with you.',
        rsvp_message: 'Strictly by invitation and no children allowed.',
        extra_card_text: '',
        slug: '',
        gallery_images: [],
        template_id: 1,
        visual_mode: 'dark',
    };

    const [form, setForm] = useState(initialForm);

    // ── Map / search state ──
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);
    const [markerInstance, setMarkerInstance] = useState(null);
    const [addressQuery, setAddressQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (isEditMode) fetchEvent();
        // Load Leaflet CSS + JS once
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        if (!window.L) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true;
            script.onload = () => setLeafletLoaded(true);
            document.body.appendChild(script);
        } else {
            setLeafletLoaded(true);
        }
    }, [id]);

    const fetchEvent = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('birthday_events')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            if (data) {
                setForm({
                    ...initialForm,
                    ...data,
                    gallery_images:
                        typeof data.gallery_images === 'string'
                            ? JSON.parse(data.gallery_images)
                            : data.gallery_images || [],
                });
            }
        } catch (err) {
            alert('Could not load birthday event: ' + err.message);
            navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const generateSlug = (name, date) => {
        const base = `${name}-${date}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return `${base}-${Date.now()}`;
    };

    // ── Leaflet map init ──
    useEffect(() => {
        if (!leafletLoaded) return;
        const el = document.getElementById('bd-map-container');
        if (!el || mapInstance) return;
        const L = window.L;
        // Default center: Lusaka
        const map = L.map('bd-map-container').setView([-15.3875, 28.3228], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        const marker = L.marker([-15.3875, 28.3228], { draggable: true }).addTo(map);
        marker.on('dragend', () => {
            const { lat, lng } = marker.getLatLng();
            setForm(p => ({ ...p, map_embed: `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed` }));
        });
        map.on('click', (e) => {
            marker.setLatLng(e.latlng);
            setForm(p => ({ ...p, map_embed: `https://maps.google.com/maps?q=${e.latlng.lat},${e.latlng.lng}&z=15&output=embed` }));
        });
        setMapInstance(map);
        setMarkerInstance(marker);
        setTimeout(() => map.invalidateSize(), 150);
    }, [leafletLoaded]);

    // ── Nominatim debounced search ──
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (addressQuery.length < 3) { setSearchResults([]); return; }
            setIsSearching(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery + ', Zambia')}&addressdetails=1&limit=10&countrycodes=zm`
                );
                const data = await res.json();
                setSearchResults(data);
                setShowResults(true);
            } catch (e) {
                console.error('Nominatim error', e);
            } finally {
                setIsSearching(false);
            }
        }, 450);
        return () => clearTimeout(timer);
    }, [addressQuery]);

    const selectAddress = (result) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        if (mapInstance && markerInstance) {
            mapInstance.setView([lat, lon], 16);
            markerInstance.setLatLng([lat, lon]);
        }
        const shortName = result.display_name.split(',')[0];
        setForm(p => ({
            ...p,
            venue_name: p.venue_name || shortName,
            venue_address: result.display_name,
            map_embed: `https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed`,
        }));
        setAddressQuery(result.display_name);
        setSearchResults([]);
        setShowResults(false);
    };


    const uploadImage = async (file, path) => {
        if (!file) return null;
        try {
            setUploading(true);
            const ext = file.name.split('.').pop();
            const name = `${Math.random().toString(36).substring(2)}_${Date.now()}.${ext}`;
            const filePath = `${path}/${name}`;
            const { error } = await supabase.storage.from('wedding-uploads').upload(filePath, file);
            if (error) throw error;
            const { data } = supabase.storage.from('wedding-uploads').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (err) {
            alert('Upload failed: ' + err.message);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const ImageUpload = ({ label, field, path = 'birthday', multiple = false, onUpload }) => (
        <div className="bd-form-group">
            <label className="bd-form-label">{label}</label>
            <div
                className="bd-image-upload-wrapper"
                onClick={() => document.getElementById(`file-${field}`).click()}
            >
                <input
                    type="file"
                    id={`file-${field}`}
                    accept="image/*"
                    style={{ display: 'none' }}
                    multiple={multiple}
                    onChange={async (e) => {
                        const files = Array.from(e.target.files);
                        if (files.length > 0) {
                            if (multiple) {
                                const urls = await Promise.all(files.map(f => uploadImage(f, path)));
                                const validUrls = urls.filter(u => u);
                                if (validUrls.length > 0 && onUpload) onUpload(validUrls);
                            } else {
                                const url = await uploadImage(files[0], path);
                                if (url) {
                                    if (onUpload) onUpload(url);
                                    else setForm((p) => ({ ...p, [field]: url }));
                                }
                            }
                        }
                    }}
                />
                {form[field] && !multiple ? (
                    <div className="bd-image-preview" style={{ position: 'relative' }}>
                        <img src={form[field]} alt="preview" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }} />
                        <button
                            className="bd-remove-image"
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setForm((p) => ({ ...p, [field]: '' })); }}
                        >
                            <i className="fas fa-times" />
                        </button>
                    </div>
                ) : (
                    <div className="bd-upload-placeholder">
                        {uploading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-cloud-upload-alt" />}
                        <span>{uploading ? 'Uploading…' : `Click to Upload Photo${multiple ? 's' : ''}`}</span>
                    </div>
                )}
            </div>
        </div>
    );

    const handleSubmit = async () => {
        if (!form.child_name.trim()) return alert('Please enter the birthday child\'s name.');
        if (!form.date) return alert('Please select the party date.');

        setLoading(true);
        setSaved(false);
        try {
            const slug = form.slug || generateSlug(form.child_name, form.date);
            const payload = { ...form, slug, gallery_images: JSON.stringify(form.gallery_images) };

            let error;
            if (isEditMode) {
                ({ error } = await supabase.from('birthday_events').update(payload).eq('id', id));
            } else {
                ({ error } = await supabase.from('birthday_events').insert([payload]));
            }

            if (error) throw error;
            setSaved(true);
            alert(isEditMode ? 'Birthday event updated!' : 'Birthday website created! 🎉');
            navigate('/admin');
        } catch (err) {
            alert('Error saving event: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rr-page">
            <div className="phone-shell">
                {/* Header – reuse admin styling */}
                <header className="bd-admin-header" style={{ background: '#12121c', color: '#fff', padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: '#a3e635', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <i className="fas fa-arrow-left"></i> Dashboard
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{isEditMode ? 'Edit Birthday' : 'New Birthday'}</span>
                        {form.slug ? (
                            <a
                                href={`/b/${form.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#c5a059', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                                Preview
                            </a>
                        ) : (
                            <div style={{ width: 45 }}></div>
                        )}
                    </div>
                </header>

                <div className="scroll-area" style={{ background: '#f4f5f7' }}>
                    <div className="content-pad" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Title */}
                        <div className="bd-page-title-card" style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#12121c', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <i className={`fas ${isEditMode ? 'fa-edit' : 'fa-birthday-cake'}`} style={{ color: '#c5a059' }} />
                                {isEditMode ? 'Edit Birthday Event' : 'Create Birthday Website'}
                            </h1>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', margin: 0 }}>
                                Fill in the details below. The birthday invitation page will be live at{' '}
                                <code>/b/[slug]</code>
                            </p>
                        </div>

                        {loading && !isEditMode ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#c5a059' }} /></div>
                        ) : (
                            <div className="bd-form-content-card" style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

                                {/* ── Template Selection ── */}
                                <h2 className="bd-section-title" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#12121c', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <i className="fas fa-layer-group" style={{ color: '#c5a059' }} /> Choose Template
                                </h2>
                                <div className="bd-grid-2" style={{ marginBottom: 20 }}>
                                    <div
                                        className={`bd-template-option ${form.template_id === 1 ? 'active' : ''}`}
                                        onClick={() => setForm(p => ({ ...p, template_id: 1 }))}
                                    >
                                        <div style={{ height: 100, width: '100%', background: 'linear-gradient(45deg, #1a1a1a, #000)', borderRadius: 10, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ color: '#f4d05c', fontFamily: 'Sacramento', fontSize: '1.2rem' }}>Classic Gold</span>
                                        </div>
                                        <div style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.75rem' }}>Template 1 (Playful)</div>
                                    </div>

                                    <div
                                        className={`bd-template-option ${form.template_id === 2 ? 'active' : ''}`}
                                        onClick={() => setForm(p => ({ ...p, template_id: 2 }))}
                                    >
                                        <div style={{ height: 100, width: '100%', background: '#0a0a0a', borderRadius: 10, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <span style={{ color: '#f4d05c', fontFamily: 'Playfair Display', fontSize: '1rem', fontWeight: 700 }}>ROYAL NOIR</span>
                                        </div>
                                        <div style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.75rem' }}>Template 2 (Mature)</div>
                                    </div>
                                </div>

                                {/* ── Visual Mode ── */}
                                <h2 className="bd-section-title" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#12121c', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <i className="fas fa-palette" style={{ color: '#c5a059' }} /> Visual Mode (Default)
                                </h2>
                                <div className="bd-grid-2" style={{ marginBottom: 20 }}>
                                    <div
                                        className={`bd-template-option ${form.visual_mode === 'dark' ? 'active' : ''}`}
                                        onClick={() => setForm(p => ({ ...p, visual_mode: 'dark' }))}
                                    >
                                        <div style={{ height: 50, width: '100%', background: '#000', borderRadius: 10, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #333' }}>
                                            <i className="fas fa-moon" style={{ color: '#f4d05c' }} />
                                        </div>
                                        <div style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.75rem' }}>Dark Mode</div>
                                    </div>

                                    <div
                                        className={`bd-template-option ${form.visual_mode === 'light' ? 'active' : ''}`}
                                        onClick={() => setForm(p => ({ ...p, visual_mode: 'light' }))}
                                    >
                                        <div style={{ height: 50, width: '100%', background: '#fff', borderRadius: 10, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd' }}>
                                            <i className="fas fa-sun" style={{ color: '#c5a021' }} />
                                        </div>
                                        <div style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.75rem' }}>Light Mode</div>
                                    </div>
                                </div>

                                {/* ── Basic Info ── */}
                                <h2 className="bd-section-title" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#12121c', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <i className="fas fa-star" style={{ color: '#c5a059' }} /> Birthday Details
                                </h2>
                                <div className="bd-grid-2">
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">Birthday Child's Name *</label>
                                        <input className="bd-form-input" name="child_name" value={form.child_name} onChange={handleChange} placeholder="e.g. Katy" />
                                    </div>
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">Age <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#888' }}>(suffix added auto)</span></label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <input
                                                type="number"
                                                className="bd-form-input"
                                                name="age"
                                                value={form.age}
                                                onChange={handleChange}
                                                placeholder="e.g. 21"
                                                min="1"
                                                max="120"
                                                style={{ flex: 1 }}
                                            />
                                            {form.age && !isNaN(parseInt(form.age)) && (
                                                <span style={{ background: "#c5a059", color: "#fff", borderRadius: 9999, padding: "4px 10px", fontWeight: 800, fontSize: "0.75rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                                                    {getOrdinal(form.age)} Bday
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">Party Date *</label>
                                        <input type="date" className="bd-form-input" name="date" value={form.date} onChange={handleChange} />
                                    </div>
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">Party Time</label>
                                        <input type="time" className="bd-form-input" name="time" value={form.time} onChange={handleChange} />
                                    </div>
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">RSVP Deadline</label>
                                        <input type="date" className="bd-form-input" name="rsvp_deadline" value={form.rsvp_deadline} onChange={handleChange} />
                                    </div>
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">Theme</label>
                                        <input className="bd-form-input" name="theme" value={form.theme} onChange={handleChange} placeholder="e.g. Princess 👑" />
                                    </div>
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">Dress Code</label>
                                        <input className="bd-form-input" name="dress_code" value={form.dress_code} onChange={handleChange} placeholder="e.g. Smart Casual" />
                                    </div>
                                </div>

                                {/* ── Venue ── */}
                                <h2 className="bd-section-title" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#12121c', marginTop: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <i className="fas fa-map-marker-alt" style={{ color: '#c5a059' }} /> Venue
                                </h2>

                                {/* Search box with autocomplete */}
                                <div className="bd-form-group" style={{ position: 'relative' }}>
                                    <label className="bd-form-label">Search Location</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="bd-form-input"
                                            value={addressQuery}
                                            onChange={e => { setAddressQuery(e.target.value); setShowResults(true); }}
                                            placeholder="Search venue or street name (e.g. Gypso Events)..."
                                            autoComplete="off"
                                            style={{ paddingRight: 40 }}
                                        />
                                        {isSearching && (
                                            <i className="fas fa-spinner fa-spin" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#c5a059' }} />
                                        )}
                                    </div>
                                    {/* Autocomplete dropdown */}
                                    {showResults && searchResults.length > 0 && (
                                        <ul style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                                            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', listStyle: 'none',
                                            margin: '4px 0 0', padding: 0, maxHeight: 200, overflowY: 'auto',
                                        }}>
                                            {searchResults.map((r, i) => (
                                                <li
                                                    key={i}
                                                    onClick={() => selectAddress(r)}
                                                    style={{
                                                        padding: '8px 12px', cursor: 'pointer', fontSize: '0.8rem',
                                                        borderBottom: i < searchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                                                        display: 'flex', alignItems: 'flex-start', gap: 6,
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                                >
                                                    <i className="fas fa-map-pin" style={{ color: '#c5a059', marginTop: 2, flexShrink: 0 }} />
                                                    <span style={{ lineHeight: 1.4, color: '#374151' }}>{r.display_name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Leaflet map */}
                                <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 16, height: 240 }}>
                                    {leafletLoaded ? (
                                        <div id="bd-map-container" style={{ width: '100%', height: '100%' }} />
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', color: '#9ca3af', fontSize: '0.9rem' }}>
                                            <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} /> Loading map…
                                        </div>
                                    )}
                                </div>

                                {/* Manual venue name / address override */}
                                <div className="bd-grid-2">
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">Venue Name</label>
                                        <input className="bd-form-input" name="venue_name" value={form.venue_name} onChange={handleChange} placeholder="e.g. Roma Park" />
                                    </div>
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">Full Address</label>
                                        <input className="bd-form-input" name="venue_address" value={form.venue_address} onChange={handleChange} placeholder="Auto-filled from map" />
                                        <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '6px', margin: 0 }}>
                                            <i className="fas fa-info-circle"></i> <strong>Can't find the venue?</strong> Search nearby and <strong>drag the red pin</strong>.
                                        </p>
                                    </div>
                                </div>

                                {/* ── Custom Texts ── */}
                                <h2 className="bd-section-title" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#12121c', marginTop: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <i className="fas fa-heart" style={{ color: '#c5a059' }} /> Custom Texts
                                </h2>
                                <div className="bd-grid-2">
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">Website Logo / Initials</label>
                                        <input className="bd-form-input" name="logo_initials" value={form.logo_initials} onChange={handleChange} placeholder="e.g. Katy" />
                                    </div>
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">Hero Greeting (e.g. Shhhhh!!!)</label>
                                        <input className="bd-form-input" name="hero_greeting" value={form.hero_greeting} onChange={handleChange} />
                                    </div>
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">Hero Main Text</label>
                                        <input className="bd-form-input" name="hero_text" value={form.hero_text} onChange={handleChange} placeholder="Leave blank for auto generated text" />
                                    </div>
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">Message to Guests</label>
                                        <textarea
                                            className="bd-form-input"
                                            name="message"
                                            value={form.message}
                                            onChange={handleChange}
                                            rows={2}
                                            style={{ resize: 'vertical' }}
                                        />
                                    </div>
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">Secondary Message (Welcome/Secret)</label>
                                        <textarea
                                            className="bd-form-input"
                                            name="welcome_message"
                                            value={form.welcome_message}
                                            onChange={handleChange}
                                            rows={2}
                                            style={{ resize: 'vertical' }}
                                        />
                                    </div>
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">RSVP Policy</label>
                                        <input className="bd-form-input" name="rsvp_message" value={form.rsvp_message} onChange={handleChange} />
                                    </div>
                                    <div className="bd-form-group">
                                        <label className="bd-form-label">Extra Card Text</label>
                                        <input className="bd-form-input" name="extra_card_text" value={form.extra_card_text} onChange={handleChange} placeholder="e.g. Please bring a swimsuit and towel." />
                                    </div>
                                </div>

                                {/* ── Images ── */}
                                <h2 className="bd-section-title" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#12121c', marginTop: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <i className="fas fa-images" style={{ color: '#c5a059' }} /> Photos
                                </h2>
                                <div className="bd-grid-2">
                                    <ImageUpload label="Cover / Share Image" field="cover_image" path="birthday/covers" />
                                    <ImageUpload label="Hero / Profile Photo" field="hero_image" path="birthday/heroes" />
                                </div>

                                {/* Gallery */}
                                <div className="bd-form-group" style={{ marginTop: 16 }}>
                                    <label className="bd-form-label">Gallery Photos</label>
                                    <div className="bd-grid-2">
                                        {form.gallery_images.map((img, idx) => (
                                            <div key={idx} style={{ position: 'relative' }}>
                                                <img src={img} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 10 }} />
                                                <button
                                                    type="button"
                                                    className="bd-remove-image"
                                                    onClick={() => {
                                                        const n = [...form.gallery_images];
                                                        n.splice(idx, 1);
                                                        setForm((p) => ({ ...p, gallery_images: n }));
                                                    }}
                                                >
                                                    <i className="fas fa-trash" />
                                                </button>
                                            </div>
                                        ))}
                                        <ImageUpload
                                            label="Add Photo(s)"
                                            field="gallery_add"
                                            path="birthday/gallery"
                                            multiple={true}
                                            onUpload={(urls) => setForm(p => ({ ...p, gallery_images: [...p.gallery_images, ...urls] }))}
                                        />
                                    </div>
                                </div>

                                {/* ── URL Slug ── */}
                                <h2 className="bd-section-title" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#12121c', marginTop: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <i className="fas fa-link" style={{ color: '#c5a059' }} /> URL / Slug
                                </h2>
                                <div className="bd-form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="bd-form-label">Custom Slug (leave blank to auto-generate)</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: '#888', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>/b/</span>
                                        <input
                                            className="bd-form-input"
                                            name="slug"
                                            value={form.slug}
                                            onChange={handleChange}
                                            placeholder="katy-6th-birthday"
                                            style={{ flex: 1 }}
                                        />
                                    </div>
                                    {form.slug && (
                                        <a
                                            href={`/b/${form.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ fontSize: '0.75rem', color: '#c5a059', marginTop: 4, display: 'inline-block' }}
                                        >
                                            <i className="fas fa-external-link-alt" style={{ marginRight: 4 }} />
                                            Preview: /b/{form.slug}
                                        </a>
                                    )}
                                </div>

                                {/* ── Actions ── */}
                                <div className="bd-form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <Link to="/admin" className="bd-btn bd-btn-secondary" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="fas fa-times" style={{ marginRight: 6 }} /> Cancel
                                    </Link>
                                    <button
                                        type="button"
                                        className="bd-btn bd-btn-primary"
                                        onClick={handleSubmit}
                                        disabled={loading || uploading}
                                        style={{ flex: 1 }}
                                    >
                                        {loading ? (
                                            <><i className="fas fa-spinner fa-spin" /> Saving…</>
                                        ) : (
                                            <><i className={`fas ${isEditMode ? 'fa-save' : 'fa-birthday-cake'}`} style={{ marginRight: 6 }} /> {isEditMode ? 'Update Event' : 'Create Site'}</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

                .rr-page {
                    min-height: 100vh;
                    background: #d8dce3;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem 0;
                }

                .phone-shell {
                    width: 100%; max-width: 420px;
                    height: 90vh;
                    max-height: 860px;
                    min-height: 600px;
                    background: #f4f5f7;
                    border-radius: 44px;
                    overflow: hidden;
                    box-shadow: 0 32px 80px rgba(0,0,0,.22), 0 0 0 8px rgba(0,0,0,.07);
                    display: flex;
                    flex-direction: column;
                }

                .scroll-area {
                    flex: 1;
                    min-height: 0;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                }
                .scroll-area::-webkit-scrollbar { display: none; }

                .bd-form-group {
                    margin-bottom: 1rem;
                }

                .bd-form-label {
                    display: block;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #374151;
                    margin-bottom: 0.35rem;
                }

                .bd-form-input {
                    width: 100%;
                    padding: 0.65rem 0.85rem;
                    background: #f9fafb !important;
                    border: 1.5px solid #e5e7eb !important;
                    border-radius: 10px !important;
                    font-size: 0.85rem !important;
                    color: #111827 !important;
                    outline: none;
                    transition: all 0.2s;
                }

                .bd-form-input:focus {
                    border-color: #c5a059 !important;
                    background: #ffffff !important;
                }

                .bd-btn {
                    padding: 0.75rem;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .bd-btn-primary {
                    background: #c5a059;
                    color: #fff;
                }

                .bd-btn-secondary {
                    background: #fff;
                    color: #4b5563;
                    border: 1px solid #d1d5db;
                }

                .bd-image-upload-wrapper {
                    border: 2px dashed #d1d5db;
                    border-radius: 12px;
                    padding: 1.5rem;
                    text-align: center;
                    cursor: pointer;
                    background: #f9fafb;
                    transition: all 0.2s;
                }

                .bd-image-upload-wrapper:hover {
                    border-color: #c5a059;
                    background: #fcfbfa;
                }

                .bd-upload-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    color: #6b7280;
                }

                .bd-upload-placeholder i {
                    font-size: 1.5rem;
                    color: #c5a059;
                }

                .bd-template-option {
                    border: 2px solid #e5e7eb;
                    border-radius: 14px;
                    padding: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: #fff;
                }

                .bd-template-option.active {
                    border-color: #c5a059 !important;
                    background: #fcfbfa !important;
                }

                .bd-remove-image {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: rgba(0,0,0,0.6);
                    color: #fff;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .bd-grid-2 {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 0.75rem;
                }

                @media (max-width: 480px) {
                    .rr-page { padding: 0; align-items: stretch; }
                    .phone-shell { border-radius: 0; box-shadow: none; max-width: 100%; width: 100%; height: 100vh; max-height: 100vh; }
                }
            `}</style>
        </div>
    );
};

export default AddBirthday;
