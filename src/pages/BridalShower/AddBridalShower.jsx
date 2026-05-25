import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import '../Wedding/AddWedding.css'; // Reusing the same styling for consistency

const AddBridalShower = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const initialFormState = {
        bride_name: "",
        date: "",
        time: "",
        venue_name: "",
        venue_address: "",
        map_location: "",
        rsvp_deadline: "",
        dress_code: "",
        registry_items: [],
        gallery_images: [],
    };

    const [formData, setFormData] = useState(initialFormState);
    const [addressQuery, setAddressQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);
    const [markerInstance, setMarkerInstance] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (isEditMode) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bridal_showers')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    ...data,
                    registry_items: typeof data.registry_items === 'string' ? JSON.parse(data.registry_items) : data.registry_items || [],
                    gallery_images: typeof data.gallery_images === 'string' ? JSON.parse(data.gallery_images) : data.gallery_images || [],
                });
            }
        } catch (error) {
            console.error("Error fetching bridal shower:", error);
            alert("Could not load details.");
            navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { label: "Basic Info", icon: "fa-female", description: "Bride & Date" },
        { label: "Location", icon: "fa-map-marker-alt", description: "Venue & Map" },
        { label: "Registry", icon: "fa-gift", description: "Gifts & Payment" },
        { label: "Gallery", icon: "fa-images", description: "Photos slider" }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- LEAFLET & SEARCH LOGIC ---
    useEffect(() => {
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
    }, []);

    useEffect(() => {
        if (leafletLoaded && !mapInstance && document.getElementById('leaflet-map-container')) {
            const L = window.L;
            const initialLat = -15.3875;
            const initialLng = 28.3228;

            const map = L.map('leaflet-map-container').setView([initialLat, initialLng], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

            marker.on('dragend', function () {
                const { lat, lng } = marker.getLatLng();
                updateLocationFromLatLng(lat, lng);
            });

            map.on('click', function (e) {
                marker.setLatLng(e.latlng);
                updateLocationFromLatLng(e.latlng.lat, e.latlng.lng);
            });

            setMapInstance(map);
            setMarkerInstance(marker);

            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
    }, [leafletLoaded, currentStep]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (addressQuery.length > 2) {
                setIsSearching(true);
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery + ', Zambia')}&addressdetails=1&limit=10&countrycodes=zm`);
                    const data = await response.json();
                    setSearchResults(data);
                } catch (error) {
                    console.error("Search error", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [addressQuery]);

    const updateLocationFromLatLng = (lat, lng) => {
        const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
        setFormData(prev => ({
            ...prev,
            map_location: embedUrl
        }));
    };

    const selectAddress = (result) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        if (mapInstance && markerInstance) {
            mapInstance.setView([lat, lon], 16);
            markerInstance.setLatLng([lat, lon]);
        }

        updateLocationFromLatLng(lat, lon);

        setFormData(prev => ({
            ...prev,
            venue_address: result.display_name
        }));

        setSearchResults([]);
        setAddressQuery(result.display_name.split(',')[0]);
    };

    const uploadImage = async (file, path) => {
        if (!file) return null;
        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${path}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('wedding-uploads')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('wedding-uploads').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const ImageUpload = ({ label, value, onUpload, path = "bridal", id, multiple = false }) => {
        const inputId = id || `file-${label.replace(/\s+/g, '_')}`;

        const handleFileChange = async (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                if (multiple) {
                    // Upload all and pass array
                    const urls = await Promise.all(files.map(file => uploadImage(file, path)));
                    const validUrls = urls.filter(u => u);
                    if (validUrls.length > 0) onUpload(validUrls);
                } else {
                    // Upload one and pass string
                    const url = await uploadImage(files[0], path);
                    if (url) onUpload(url);
                }
            }
        };

        return (
            <div className="form-group">
                <label className="form-label">{label}</label>
                <div className="image-upload-wrapper" onClick={() => document.getElementById(inputId).click()}>
                    <input type="file" id={inputId} onChange={handleFileChange} accept="image/*" multiple={multiple} style={{ display: 'none' }} />
                    {value && !multiple ? (
                        <div className="image-preview">
                            <img src={value} alt="Preview" />
                            <button className="remove-image" onClick={(e) => { e.stopPropagation(); onUpload(""); }} type="button"><i className="fas fa-times"></i></button>
                        </div>
                    ) : (
                        <div className="upload-placeholder">
                            {uploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
                            <span>{uploading ? "Uploading..." : `Click to Upload Photo${multiple ? 's' : ''}`}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const addItem = (field, initialItem) => setFormData(prev => ({ ...prev, [field]: [...prev[field], initialItem] }));
    const updateItem = (field, index, key, value) => {
        const newArray = [...formData[field]]; newArray[index][key] = value;
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };
    const removeItem = (field, index) => {
        const newArray = [...formData[field]]; newArray.splice(index, 1);
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            let slug = formData.slug;
            if (!slug) {
                const slugBase = `${formData.bride_name}-bridal-shower`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                slug = `${slugBase}-${Date.now()}`;
            }

            const payload = { ...formData, slug };

            let error;
            if (isEditMode) {
                const { error: updateError } = await supabase.from('bridal_showers').update(payload).eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('bridal_showers').insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            alert(isEditMode ? 'Bridal Shower Updated Successfully!' : 'Bridal Shower Created Successfully!');
            if (isEditMode) navigate('/admin'); else navigate(`/bridal-shower/${slug}`);

        } catch (error) {
            alert('Error saving bridal shower: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="form-section">
            <h2 className="section-title">Bride & Date</h2>
            <div className="grid-2">
                <div className="form-group"><label className="form-label">Bride's First Name</label><input className="form-input" name="bride_name" value={formData.bride_name} onChange={handleChange} placeholder="e.g. Sarah" /></div>
                <div className="form-group"><label className="form-label">RSVP Deadline</label><input type="date" className="form-input" name="rsvp_deadline" value={formData.rsvp_deadline} onChange={handleChange} /></div>
            </div>
            <div className="grid-2">
                <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" name="date" value={formData.date} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Time</label><input type="time" className="form-input" name="time" value={formData.time} onChange={handleChange} /></div>
            </div>
            <div className="form-group"><label className="form-label">Dress Code</label><input className="form-input" name="dress_code" value={formData.dress_code} onChange={handleChange} placeholder="e.g. All White, Floral, etc." /></div>
        </div>
    );

    const renderStep2 = () => (
        <div className="form-section">
            <h2 className="section-title">Location & Map</h2>
            <div className="grid-2">
                <div className="form-group"><label className="form-label">Venue Name</label><input className="form-input" name="venue_name" value={formData.venue_name} onChange={handleChange} placeholder="e.g. The Garden Estate" /></div>
            </div>
            <div className="form-group" style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <label className="form-label" style={{ color: '#166534', fontWeight: 'bold' }}>Find Venue on Map</label>
                <div style={{ position: 'relative' }}>
                    <input className="form-input" value={addressQuery} onChange={(e) => setAddressQuery(e.target.value)} placeholder="Search venue or street name (e.g. Gypso Events)..." style={{ marginBottom: '10px' }} />
                    {isSearching && <div style={{ position: 'absolute', right: '10px', top: '10px', color: '#888' }}><i className="fas fa-spinner fa-spin"></i></div>}
                    {searchResults.length > 0 && (
                        <ul style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'white', border: '1px solid #ddd', zIndex: 1000 }}>
                            {searchResults.map((result, idx) => (
                                <li key={idx} onClick={() => selectAddress(result)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                                    <strong>{result.name ? result.name : result.display_name.split(',')[0]}</strong><br />
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>{result.display_name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div id="leaflet-map-container" style={{ width: '100%', height: '300px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #ddd', zIndex: 1 }}></div>
                <div className="form-group">
                    <label className="form-label">Venue Address (Selected)</label>
                    <input className="form-input" name="venue_address" value={formData.venue_address} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Map Location URL (Auto-generated)</label>
                    <input className="form-input" name="map_location" value={formData.map_location} onChange={handleChange} placeholder="Google Maps Embed URL" />
                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
                        <i className="fas fa-info-circle"></i> <strong>Can't find the venue?</strong> Search for a nearby area (e.g. "Lusaka") and <strong>drag the red pin</strong> on the map above to the exact spot. The URL will update automatically.
                    </p>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="form-section">
            <h2 className="section-title">Registry / Gifts</h2>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>Add payment options like Bank Transfer or Mobile Money.</p>
            {formData.registry_items.map((item, idx) => (
                <div key={idx} className="array-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h4 style={{ margin: 0, marginBottom: 10 }}>Option #{idx + 1}</h4>
                        <button className="remove-item-btn" onClick={() => removeItem('registry_items', idx)} type="button" style={{ position: 'static' }}><i className="fas fa-trash"></i></button>
                    </div>
                    <div className="grid-2">
                        <div className="form-group"><label className="form-label">Type</label>
                            <select className="form-input" value={item.type} onChange={(e) => updateItem('registry_items', idx, 'type', e.target.value)}>
                                <option value="Mobile Money">Mobile Money</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                        </div>
                        <div className="form-group"><label className="form-label">Bank/Provider Name</label><input className="form-input" placeholder="e.g. MTN, FNB" value={item.provider} onChange={(e) => updateItem('registry_items', idx, 'provider', e.target.value)} /></div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group"><label className="form-label">Account Name</label><input className="form-input" value={item.accountName} onChange={(e) => updateItem('registry_items', idx, 'accountName', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Account/Phone No.</label><input className="form-input" value={item.accountNumber} onChange={(e) => updateItem('registry_items', idx, 'accountNumber', e.target.value)} /></div>
                    </div>
                </div>
            ))}
            <button className="add-item-btn" onClick={() => addItem('registry_items', { type: "Mobile Money", provider: "", accountName: "", accountNumber: "" })} type="button">+ Add Payment Method</button>
        </div>
    );

    const renderStep4 = () => (
        <div className="form-section">
            <h2 className="section-title">Photo Gallery Slider</h2>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>Upload images for the Memories slider (minimum 3 recommended).</p>
            <div className="grid-2">
                {formData.gallery_images.map((img, idx) => (
                    <div key={idx} className="image-upload-wrapper">
                        <img src={img} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                        <button className="remove-image" onClick={() => { const n = [...formData.gallery_images]; n.splice(idx, 1); setFormData(p => ({ ...p, gallery_images: n })); }} type="button"><i className="fas fa-trash"></i></button>
                    </div>
                ))}
                <ImageUpload label="Add Slider Photo(s)" value="" onUpload={(urls) => setFormData(p => ({ ...p, gallery_images: [...p.gallery_images, ...urls] }))} path="bridal" multiple={true} />
            </div>
        </div>
    );

    return (
        <div className="admin-page">
            {/* Forced Clean Light-Mode Styles Overrides */}
            <style>{`
                html, body, #root, .admin-page, .add-bridal-shower-container, .form-content-card {
                    background-color: #fdfbf7 !important;
                    background: #fdfbf7 !important;
                    color: #1b2424 !important;
                }

                .admin-header {
                    background: rgba(253, 251, 247, 0.9) !important;
                    backdrop-filter: blur(16px) !important;
                    -webkit-backdrop-filter: blur(16px) !important;
                    border-bottom: 1px solid #e9e4d9 !important;
                }

                .form-content-card, .page-title-card, .progress-section {
                    background: #ffffff !important;
                    border: 1px solid #e9e4d9 !important;
                    box-shadow: 0 4px 15px rgba(45, 58, 58, 0.04) !important;
                }

                 .step.active .step-number {
                    background: #ea8612 !important;
                    color: #ffffff !important;
                    border-color: #ea8612 !important;
                }

                .step.active .step-label {
                    color: #ea8612 !important;
                }

                .step.completed .step-number {
                    background: var(--success) !important;
                    color: #ffffff !important;
                    border-color: var(--success) !important;
                }

                .step-number {
                    background: #f5f2eb !important;
                    border: 1.5px solid #e9e4d9 !important;
                    color: var(--text-muted) !important;
                }

                .form-input, .form-textarea, .form-select {
                    background: #f5f2eb !important;
                    border: 1.5px solid #e9e4d9 !important;
                    color: #1b2424 !important;
                }

                .form-input:focus, .form-textarea:focus, .form-select:focus {
                    border-color: #ea8612 !important;
                    background: #ffffff !important;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #f7901b 0%, #ea8612 100%) !important;
                    color: #ffffff !important;
                    border: none !important;
                }

                .btn-secondary {
                    background: #f5f2eb !important;
                    border: 1px solid #e9e4d9 !important;
                    color: #1b2424 !important;
                }
            `}</style>
            <header className="admin-header">
                <div className="admin-header-content">
                    <div className="admin-logo">
                        <div className="admin-logo-icon"><i className="fas fa-female"></i></div>
                        <div className="admin-logo-text"><h1>SaveMeASeat</h1><p>Bridal Shower Admin</p></div>
                    </div>
                    <nav className="admin-nav">
                        <button className="admin-nav-btn secondary" onClick={() => navigate('/admin')}><i className="fas fa-th-large"></i> Dashboard</button>
                        <button className="admin-nav-btn primary" onClick={() => window.open(`/bridal-shower/${formData.slug}`, '_blank')}><i className="fas fa-eye"></i> Preview</button>
                    </nav>
                </div>
            </header>

            <div className="add-bridal-shower-container">
                <div className="page-title-card">
                    <div className="page-title-content">
                        <h1><i className={isEditMode ? "fas fa-edit" : "fas fa-plus-circle"}></i>{isEditMode ? 'Edit Bridal Shower' : 'Create Bridal Shower'}</h1>
                        <p>Set up a beautiful bridal shower page for the bride-to-be.</p>
                    </div>
                </div>

                <div className="progress-section">
                    <div className="form-steps">
                        {steps.map((step, idx) => (
                            <div key={idx} className={`step ${currentStep === idx ? 'active' : ''} ${currentStep > idx ? 'completed' : ''}`} onClick={() => setCurrentStep(idx)}>
                                <div className="step-number">{currentStep > idx ? <i className="fas fa-check"></i> : <i className={`fas ${step.icon}`}></i>}</div>
                                <div className="step-info"><span className="step-label">{step.label}</span><span className="step-description">{step.description}</span></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="form-content-card">
                    <div className="form-content">
                        {currentStep === 0 && renderStep1()}
                        {currentStep === 1 && renderStep2()}
                        {currentStep === 2 && renderStep3()}
                        {currentStep === 3 && renderStep4()}
                    </div>
                </div>

                <div className="form-actions">
                    <button className="btn btn-secondary" disabled={currentStep === 0} onClick={() => setCurrentStep(p => p - 1)} type="button"><i className="fas fa-arrow-left"></i> Previous</button>
                    {currentStep < steps.length - 1 ? (
                        <button className="btn btn-primary" onClick={() => setCurrentStep(p => p + 1)} type="button">Next <i className="fas fa-arrow-right"></i></button>
                    ) : (
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} type="button">
                            {loading ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-rocket"></i> {isEditMode ? "Update" : "Publish"}</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddBridalShower;
