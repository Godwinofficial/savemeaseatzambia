import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import './AddWedding.css';

const AddWedding = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID if in edit mode
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    // Initial State
    const initialFormState = {
        bride_name: "", bride_image: "", bride_description: "",
        groom_name: "", groom_image: "", groom_description: "",
        date: "", location: "",
        venue_name: "", venue_address: "", venue_description: "",
        story_part1: "", story_highlight: "", story_part2: "",
        ceremony_date: "", ceremony_time: "", ceremony_venue: "",
        reception_date: "", reception_time: "", reception_venue: "", reception_address: "",
        rsvp_deadline: "",
        dress_code: "", dress_code_desc: "",
        map_location: "", // Will be auto-generated
        slider_images: [], bridesmaids: [], groomsmen: [], gifts: [], gallery_images: []
    };

    const [formData, setFormData] = useState(initialFormState);
    const [addressQuery, setAddressQuery] = useState(""); // For map search
    const [searchResults, setSearchResults] = useState([]);

    // Fetch Data if Editing
    useEffect(() => {
        if (isEditMode) {
            fetchWeddingData();
        }
    }, [id]);

    const fetchWeddingData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('weddings')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                // Ensure JSON fields are arrays (backward compatibility)
                setFormData({
                    ...data,
                    rsvp_deadline: data.rsvp_deadline || "",
                    slider_images: typeof data.slider_images === 'string' ? JSON.parse(data.slider_images) : data.slider_images || [],
                    bridesmaids: typeof data.bridesmaids === 'string' ? JSON.parse(data.bridesmaids) : data.bridesmaids || [],
                    groomsmen: typeof data.groomsmen === 'string' ? JSON.parse(data.groomsmen) : data.groomsmen || [],
                    gifts: typeof data.gifts === 'string' ? JSON.parse(data.gifts) : data.gifts || [],
                    gallery_images: typeof data.gallery_images === 'string' ? JSON.parse(data.gallery_images) : data.gallery_images || []
                });
            }
        } catch (error) {
            console.error("Error fetching wedding:", error);
            alert("Could not load wedding details.");
            navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    // Steps Configuration
    const steps = [
        { label: "The Couple", icon: "fa-heart" },
        { label: "Date & Venue", icon: "fa-calendar-alt" },
        { label: "Our Story", icon: "fa-book-open" },
        { label: "Party & Visuals", icon: "fa-images" }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- MAP & ADDRESS SEARCH ---
    const handleAddressSearch = async () => {
        if (!addressQuery) return;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            alert("Error searching address");
        }
    };

    const selectAddress = (result) => {
        // Auto-generate Google Maps Embed Link
        const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(result.display_name)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

        setFormData(prev => ({
            ...prev,
            venue_address: result.display_name, // Auto-fill address text
            map_location: embedUrl
        }));
        setSearchResults([]); // Clear results
        setAddressQuery(""); // Clear query
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

            if (uploadError) {
                if (uploadError.message.includes("row-level security")) {
                    alert("Supabase Security Error: You need to run the policies in SUPABASE_SETUP.sql to allow uploads.");
                }
                throw uploadError;
            }

            const { data } = supabase.storage.from('wedding-uploads').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const ImageUpload = ({ label, value, onUpload, path = "misc" }) => {
        const handleFileChange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = await uploadImage(file, path);
                if (url) onUpload(url);
            }
        };

        return (
            <div className="form-group">
                <label className="form-label">{label}</label>
                <div className="image-upload-wrapper" onClick={() => document.getElementById(`file-${label}`).click()}>
                    <input type="file" id={`file-${label}`} onChange={handleFileChange} accept="image/*" />
                    {value ? (
                        <div className="image-preview">
                            <img src={value} alt="Preview" />
                            <button className="remove-image" onClick={(e) => { e.stopPropagation(); onUpload(""); }} type="button"><i className="fas fa-times"></i></button>
                        </div>
                    ) : (
                        <div className="upload-placeholder">
                            {uploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
                            <span>{uploading ? "Uploading..." : "Click to Upload Photo"}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const addItem = (field, initialItem) => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], initialItem] }));
    };
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
            // If creating new, generate slug. If editing, keep existing slug.
            let slug = formData.slug;
            if (!slug) {
                const slugBase = `${formData.groom_name}-${formData.bride_name}-${formData.date}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                slug = `${slugBase}-${Date.now()}`;
            }

            const payload = { ...formData, slug };

            let error;
            if (isEditMode) {
                const { error: updateError } = await supabase.from('weddings').update(payload).eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('weddings').insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            alert(isEditMode ? 'Wedding Updated Successfully!' : 'Wedding Website Created Successfully!');
            if (isEditMode) navigate('/admin'); else navigate(`/w/${slug}`);

        } catch (error) {
            alert('Error saving wedding: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER STEPS ---
    const renderStep1 = () => (
        <div className="form-section">
            <h2 className="section-title">The Happy Couple</h2>
            <div className="grid-2">
                <div>
                    <h3>The Bride</h3>
                    <div className="form-group"><label className="form-label">Name</label><input className="form-input" name="bride_name" value={formData.bride_name} onChange={handleChange} /></div>
                    <ImageUpload label="Bride's Photo" value={formData.bride_image} onUpload={(url) => setFormData(p => ({ ...p, bride_image: url }))} path="couples" />
                    <div className="form-group"><label className="form-label">Bio</label><textarea className="form-textarea" name="bride_description" value={formData.bride_description} onChange={handleChange} /></div>
                </div>
                <div>
                    <h3>The Groom</h3>
                    <div className="form-group"><label className="form-label">Name</label><input className="form-input" name="groom_name" value={formData.groom_name} onChange={handleChange} /></div>
                    <ImageUpload label="Groom's Photo" value={formData.groom_image} onUpload={(url) => setFormData(p => ({ ...p, groom_image: url }))} path="couples" />
                    <div className="form-group"><label className="form-label">Bio</label><textarea className="form-textarea" name="groom_description" value={formData.groom_description} onChange={handleChange} /></div>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="form-section">
            <h2 className="section-title">Date & Locaton</h2>
            <div className="grid-2">
                <div className="form-group">
                    <label className="form-label">Main Wedding Date</label>
                    <input type="date" className="form-input" name="date" value={formData.date} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Display Location (City/Country)</label>
                    <input className="form-input" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. New York, NY" />
                </div>
                <div className="form-group">
                    <label className="form-label">RSVP Deadline</label>
                    <input type="date" className="form-input" name="rsvp_deadline" value={formData.rsvp_deadline} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Dress Code</label>
                    <input type="text" className="form-input" name="dress_code" value={formData.dress_code} onChange={handleChange} placeholder="e.g. Formal, Cocktail Attire" />
                </div>
            </div>

            <div className="form-group" style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <label className="form-label" style={{ color: '#166534' }}>Find Venue & Generate Map</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input className="form-input" value={addressQuery} onChange={(e) => setAddressQuery(e.target.value)} placeholder="Search Venue Address (e.g. The Plaza Hotel, NY)..." />
                    <button className="btn btn-primary" onClick={handleAddressSearch} type="button">Search</button>
                </div>
                {searchResults.length > 0 && (
                    <ul style={{ background: 'white', border: '1px solid #ddd', marginTop: '10px', padding: '0', listStyle: 'none', maxHeight: '200px', overflowY: 'auto' }}>
                        {searchResults.map((result, idx) => (
                            <li key={idx} onClick={() => selectAddress(result)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                                {result.display_name}
                            </li>
                        ))}
                    </ul>
                )}
                {formData.map_location && (
                    <div style={{ marginTop: '15px' }}>
                        <p style={{ fontSize: '0.8rem', color: 'green' }}>✓ Map Linked: <a href={formData.map_location} target="_blank">{formData.venue_address}</a></p>
                    </div>
                )}
            </div>

            <h3>Ceremony</h3>
            <div className="grid-2">
                <div className="form-group"><label className="form-label">Venue Name</label><input className="form-input" name="ceremony_venue" value={formData.ceremony_venue} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" name="ceremony_date" value={formData.ceremony_date} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Time</label><input type="time" className="form-input" name="ceremony_time" value={formData.ceremony_time} onChange={handleChange} /></div>
            </div>

            <h3>Reception</h3>
            <div className="grid-2">
                <div className="form-group"><label className="form-label">Venue Name</label><input className="form-input" name="reception_venue" value={formData.reception_venue} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" name="reception_date" value={formData.reception_date} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Time</label><input type="time" className="form-input" name="reception_time" value={formData.reception_time} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Address</label><input className="form-input" name="reception_address" value={formData.reception_address} onChange={handleChange} /></div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="form-section">
            <h2 className="section-title">Our Story</h2>
            <div className="form-group"><label className="form-label">How We Met</label><textarea className="form-textarea" name="story_part1" value={formData.story_part1} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Highlight Quote</label><input className="form-input" name="story_highlight" value={formData.story_highlight} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">The Proposal</label><textarea className="form-textarea" name="story_part2" value={formData.story_part2} onChange={handleChange} /></div>
        </div>
    );

    const renderStep4 = () => (
        <div className="form-section">
            <h2 className="section-title">Visuals & Party</h2>
            <h3>Bridesmaids</h3>
            {formData.bridesmaids.map((item, idx) => (
                <div key={idx} className="array-item grid-2">
                    <button className="remove-item-btn" onClick={() => removeItem('bridesmaids', idx)} type="button"><i className="fas fa-trash"></i></button>
                    <div><input className="form-input" placeholder="Name" value={item.name} onChange={(e) => updateItem('bridesmaids', idx, 'name', e.target.value)} /><input className="form-input" placeholder="Role" value={item.role} onChange={(e) => updateItem('bridesmaids', idx, 'role', e.target.value)} style={{ marginTop: 5 }} /></div>
                    <div><ImageUpload label="Photo" value={item.photo} onUpload={(url) => updateItem('bridesmaids', idx, 'photo', url)} path="party" /></div>
                </div>
            ))}
            <button className="add-item-btn" onClick={() => addItem('bridesmaids', { name: "", role: "", photo: "" })} type="button">+ Add Bridesmaid</button>

            <h3 style={{ marginTop: '30px' }}>Groomsmen</h3>
            {formData.groomsmen.map((item, idx) => (
                <div key={idx} className="array-item grid-2">
                    <button className="remove-item-btn" onClick={() => removeItem('groomsmen', idx)} type="button"><i className="fas fa-trash"></i></button>
                    <div><input className="form-input" placeholder="Name" value={item.name} onChange={(e) => updateItem('groomsmen', idx, 'name', e.target.value)} /><input className="form-input" placeholder="Role" value={item.role} onChange={(e) => updateItem('groomsmen', idx, 'role', e.target.value)} style={{ marginTop: 5 }} /></div>
                    <div><ImageUpload label="Photo" value={item.photo} onUpload={(url) => updateItem('groomsmen', idx, 'photo', url)} path="party" /></div>
                </div>
            ))}
            <button className="add-item-btn" onClick={() => addItem('groomsmen', { name: "", role: "", photo: "" })} type="button">+ Add Groomsman</button>

            <h3 style={{ marginTop: '30px' }}>Gallery / Slider</h3>
            <div className="grid-2">
                {formData.slider_images.map((img, idx) => (
                    <div key={idx} className="image-upload-wrapper">
                        <img src={img} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                        <button className="remove-image" onClick={() => { const n = [...formData.slider_images]; n.splice(idx, 1); setFormData(p => ({ ...p, slider_images: n })); }} type="button"><i className="fas fa-trash"></i></button>
                    </div>
                ))}
                <ImageUpload label="New Slider Image" value="" onUpload={(url) => setFormData(p => ({ ...p, slider_images: [...p.slider_images, url] }))} path="hero" />
            </div>
        </div>
    );

    return (
        <div className="add-wedding-container">
            <div className="add-wedding-header">
                <h1>{isEditMode ? 'Edit Wedding Details' : 'Create Your Wedding Site'}</h1>
                <p>Manage your wedding details below.</p>
            </div>
            <div className="form-steps">
                {steps.map((step, idx) => (
                    <div key={idx} className={`step ${currentStep === idx ? 'active' : ''} ${currentStep > idx ? 'completed' : ''}`} onClick={() => setCurrentStep(idx)}>
                        <div className="step-number">{currentStep > idx ? <i className="fas fa-check"></i> : idx + 1}</div>
                        <span className="step-label">{step.label}</span>
                    </div>
                ))}
            </div>
            <div className="form-content">
                {currentStep === 0 && renderStep1()}
                {currentStep === 1 && renderStep2()}
                {currentStep === 2 && renderStep3()}
                {currentStep === 3 && renderStep4()}
            </div>
            <div className="form-actions">
                <button className="btn btn-secondary" disabled={currentStep === 0} onClick={() => setCurrentStep(p => p - 1)} type="button">Previous</button>
                {currentStep < steps.length - 1 ? (
                    <button className="btn btn-primary" onClick={() => setCurrentStep(p => p + 1)} type="button">Next Step</button>
                ) : (
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} type="button">{loading ? <i className="fas fa-spinner fa-spin"></i> : (isEditMode ? "Update Wedding" : "Launch Site")}</button>
                )}
            </div>
        </div>
    );
};

export default AddWedding;
