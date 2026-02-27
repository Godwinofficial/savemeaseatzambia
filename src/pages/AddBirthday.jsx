import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './AddWedding.css'; // reuse same base styles

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
        slug: '',
        gallery_images: [],
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
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&addressdetails=1&limit=6`
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

    const ImageUpload = ({ label, field, path = 'birthday' }) => (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <div
                className="image-upload-wrapper"
                onClick={() => document.getElementById(`file-${field}`).click()}
            >
                <input
                    type="file"
                    id={`file-${field}`}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                        const url = await uploadImage(e.target.files[0], path);
                        if (url) setForm((p) => ({ ...p, [field]: url }));
                    }}
                />
                {form[field] ? (
                    <div className="image-preview" style={{ position: 'relative' }}>
                        <img src={form[field]} alt="preview" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }} />
                        <button
                            className="remove-image"
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setForm((p) => ({ ...p, [field]: '' })); }}
                        >
                            <i className="fas fa-times" />
                        </button>
                    </div>
                ) : (
                    <div className="upload-placeholder">
                        {uploading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-cloud-upload-alt" />}
                        <span>{uploading ? 'Uploading…' : 'Click to Upload Photo'}</span>
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
        <>
            {/* Header – reuse admin styling */}
            <header className="admin-header" style={{ background: 'linear-gradient(135deg,#ff6b9d,#c44569)' }}>
                <div className="header-container">
                    <div className="header-main">
                        <div className="brand">
                            <Link to="/admin">
                                <img src="/imgs/logo1.png" alt="SaveMeASeat" className="logo-img" />
                            </Link>
                        </div>
                        <div className="desktop-nav" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <Link to="/admin" className="nav-btn outline" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
                                <i className="fas fa-arrow-left" /> Dashboard
                            </Link>
                            {form.slug && (
                                <a
                                    href={`/b/${form.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="nav-btn primary"
                                    style={{ textDecoration: 'none', fontSize: '0.85rem', background: '#1a1a1a', color: '#c44569' }}
                                >
                                    <i className="fas fa-eye" /> Preview
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="add-wedding-container" style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px 80px' }}>
                {/* Title */}
                <div className="page-title-card" style={{ background: 'linear-gradient(135deg,#1a1a1a0f8,#ffe8f3)', borderRadius: 16, padding: '28px 32px', marginBottom: 32, border: '1px solid #ffc2dd' }}>
                    <h1 style={{ color: '#c44569', fontSize: '1.8rem', margin: 0 }}>
                        <i className={`fas ${isEditMode ? 'fa-edit' : 'fa-birthday-cake'}`} style={{ marginRight: 10 }} />
                        {isEditMode ? 'Edit Birthday Event' : 'Create Birthday Website'}
                    </h1>
                    <p style={{ color: '#9b5a72', margin: '8px 0 0', fontSize: '0.9rem' }}>
                        Fill in the details below. The birthday invitation page will be live at{' '}
                        <code style={{ background: '#ffd6ea', padding: '2px 6px', borderRadius: 6 }}>/b/[slug]</code>
                    </p>
                </div>

                {loading && !isEditMode ? (
                    <div style={{ textAlign: 'center', padding: 80 }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 32, color: '#c44569' }} /></div>
                ) : (
                    <div className="form-content-card" style={{ borderRadius: 16, padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #eee', background: '#1a1a1a' }}>

                        {/* ── Basic Info ── */}
                        <h2 className="section-title" style={{ color: '#c44569', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className="fas fa-star" /> Birthday Details
                        </h2>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Birthday Child's Name *</label>
                                <input className="form-input" name="child_name" value={form.child_name} onChange={handleChange} placeholder="e.g. Katy" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Age <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#aaa' }}>(number only — suffix added automatically)</span></label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <input
                                        type="number"
                                        className="form-input"
                                        name="age"
                                        value={form.age}
                                        onChange={handleChange}
                                        placeholder="e.g. 21"
                                        min="1"
                                        max="120"
                                        style={{ flex: 1 }}
                                    />
                                    {form.age && !isNaN(parseInt(form.age)) && (
                                        <span style={{
                                            background: 'linear-gradient(135deg,#ff6b9d,#c44569)',
                                            color: '#1a1a1a', borderRadius: 9999,
                                            padding: '6px 16px', fontWeight: 800,
                                            fontSize: '1rem', whiteSpace: 'nowrap', flexShrink: 0,
                                        }}>
                                            {getOrdinal(form.age)} Birthday
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Party Date *</label>
                                <input type="date" className="form-input" name="date" value={form.date} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Party Time</label>
                                <input type="time" className="form-input" name="time" value={form.time} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">RSVP Deadline</label>
                                <input type="date" className="form-input" name="rsvp_deadline" value={form.rsvp_deadline} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Theme / Dress Code</label>
                                <input className="form-input" name="theme" value={form.theme} onChange={handleChange} placeholder="e.g. Princess 👑" />
                            </div>
                        </div>

                        {/* ── Venue ── */}
                        <h2 className="section-title" style={{ color: '#c44569', marginTop: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className="fas fa-map-marker-alt" /> Venue
                        </h2>

                        {/* Search box with autocomplete */}
                        <div className="form-group" style={{ position: 'relative' }}>
                            <label className="form-label">Search Location</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="form-input"
                                    value={addressQuery}
                                    onChange={e => { setAddressQuery(e.target.value); setShowResults(true); }}
                                    placeholder="e.g. Roma Park, Lusaka"
                                    autoComplete="off"
                                    style={{ paddingRight: 40 }}
                                />
                                {isSearching && (
                                    <i className="fas fa-spinner fa-spin" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#c44569' }} />
                                )}
                            </div>
                            {/* Autocomplete dropdown */}
                            {showResults && searchResults.length > 0 && (
                                <ul style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                                    background: '#1a1a1a', border: '1px solid #e5e7eb', borderRadius: 10,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', listStyle: 'none',
                                    margin: '4px 0 0', padding: 0, maxHeight: 260, overflowY: 'auto',
                                }}>
                                    {searchResults.map((r, i) => (
                                        <li
                                            key={i}
                                            onClick={() => selectAddress(r)}
                                            style={{
                                                padding: '10px 14px', cursor: 'pointer', fontSize: '0.88rem',
                                                borderBottom: i < searchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                                                display: 'flex', alignItems: 'flex-start', gap: 8,
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fef0f5'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#1a1a1a'}
                                        >
                                            <i className="fas fa-map-pin" style={{ color: '#c44569', marginTop: 2, flexShrink: 0 }} />
                                            <span style={{ lineHeight: 1.4, color: '#374151' }}>{r.display_name}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Leaflet map */}
                        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 16, height: 280 }}>
                            {leafletLoaded ? (
                                <div id="bd-map-container" style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', color: '#9ca3af', fontSize: '0.9rem' }}>
                                    <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} /> Loading map…
                                </div>
                            )}
                        </div>

                        {/* Manual venue name / address override */}
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Venue Name</label>
                                <input className="form-input" name="venue_name" value={form.venue_name} onChange={handleChange} placeholder="e.g. Roma Park" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Full Address</label>
                                <input className="form-input" name="venue_address" value={form.venue_address} onChange={handleChange} placeholder="Auto-filled from map" />
                            </div>
                        </div>

                        {/* ── Custom Message ── */}
                        <h2 className="section-title" style={{ color: '#c44569', marginTop: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className="fas fa-heart" /> Invitation Message
                        </h2>
                        <div className="form-group">
                            <label className="form-label">Message to Guests</label>
                            <textarea
                                className="form-input"
                                name="message"
                                value={form.message}
                                onChange={handleChange}
                                rows={3}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        {/* ── Images ── */}
                        <h2 className="section-title" style={{ color: '#c44569', marginTop: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className="fas fa-images" /> Photos
                        </h2>
                        <div className="grid-2">
                            <ImageUpload label="Cover / Share Image" field="cover_image" path="birthday/covers" />
                            <ImageUpload label="Hero / Profile Photo" field="hero_image" path="birthday/heroes" />
                        </div>

                        {/* Gallery */}
                        <div className="form-group" style={{ marginTop: 16 }}>
                            <label className="form-label">Gallery Photos</label>
                            <div className="grid-2">
                                {form.gallery_images.map((img, idx) => (
                                    <div key={idx} style={{ position: 'relative' }}>
                                        <img src={img} alt="" style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 10 }} />
                                        <button
                                            type="button"
                                            className="remove-image"
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
                                <div
                                    className="image-upload-wrapper"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => document.getElementById('gallery-add').click()}
                                >
                                    <input
                                        type="file"
                                        id="gallery-add"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const url = await uploadImage(e.target.files[0], 'birthday/gallery');
                                            if (url) setForm((p) => ({ ...p, gallery_images: [...p.gallery_images, url] }));
                                        }}
                                    />
                                    <div className="upload-placeholder">
                                        <i className="fas fa-plus" />
                                        <span>Add Photo</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── URL Slug ── */}
                        <h2 className="section-title" style={{ color: '#c44569', marginTop: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className="fas fa-link" /> URL / Slug
                        </h2>
                        <div className="form-group">
                            <label className="form-label">Custom Slug (leave blank to auto-generate)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ color: '#888', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>/b/</span>
                                <input
                                    className="form-input"
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
                                    style={{ fontSize: '0.82rem', color: '#c44569', marginTop: 4, display: 'inline-block' }}
                                >
                                    <i className="fas fa-external-link-alt" style={{ marginRight: 4 }} />
                                    Preview: /b/{form.slug}
                                </a>
                            )}
                        </div>

                        {/* ── Actions ── */}
                        <div className="form-actions" style={{ marginTop: 40, borderTop: '1px solid #eee', paddingTop: 28 }}>
                            <Link to="/admin" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                                <i className="fas fa-times" /> Cancel
                            </Link>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={loading || uploading}
                                style={{ background: 'linear-gradient(135deg,#ff6b9d,#c44569)', border: 'none' }}
                            >
                                {loading ? (
                                    <><i className="fas fa-spinner fa-spin" /> Saving…</>
                                ) : (
                                    <><i className={`fas ${isEditMode ? 'fa-save' : 'fa-birthday-cake'}`} /> {isEditMode ? 'Update Event' : 'Create Birthday Site'}</>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AddBirthday;
