// import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate, useParams } from 'react-router-dom';
// import './AddWedding.css';

// const AddWedding = () => {
//     const navigate = useNavigate();
//     const { id } = useParams(); // Get ID if in edit mode
//     const isEditMode = !!id;

//     const [loading, setLoading] = useState(false);
//     const [uploading, setUploading] = useState(false);
//     const [currentStep, setCurrentStep] = useState(0);

//     // Initial State
//     const initialFormState = {
//         cover_image: "",
//         bride_name: "", bride_image: "", bride_description: "",
//         groom_name: "", groom_image: "", groom_description: "",
//         date: "", location: "",
//         venue_name: "", venue_address: "", venue_description: "",
//         story_part1: "", story_highlight: "", story_part2: "",
//         ceremony_date: "", ceremony_time: "", ceremony_venue: "",
//         reception_date: "", reception_time: "", reception_venue: "", reception_address: "",
//         rsvp_deadline: "",
//         dress_code: "", dress_code_desc: "",

//         map_location: "", // Will be auto-generated
//         slider_images: [], bridesmaids: [], groomsmen: [], gifts: [], gallery_images: [],
//         allowed_guests: ["1", "2"] // Default
//     };

//     const [formData, setFormData] = useState(initialFormState);
//     const [addressQuery, setAddressQuery] = useState(""); // For map search
//     const [searchResults, setSearchResults] = useState([]);

//     // Fetch Data if Editing
//     useEffect(() => {
//         if (isEditMode) {
//             fetchWeddingData();
//         }
//     }, [id]);

//     const fetchWeddingData = async () => {
//         setLoading(true);
//         try {
//             const { data, error } = await supabase
//                 .from('weddings')
//                 .select('*')
//                 .eq('id', id)
//                 .single();

//             if (error) throw error;
//             if (data) {
//                 // Ensure JSON fields are arrays (backward compatibility)
//                 setFormData({
//                     ...data,
//                     rsvp_deadline: data.rsvp_deadline || "",
//                     slider_images: typeof data.slider_images === 'string' ? JSON.parse(data.slider_images) : data.slider_images || [],
//                     bridesmaids: typeof data.bridesmaids === 'string' ? JSON.parse(data.bridesmaids) : data.bridesmaids || [],
//                     groomsmen: typeof data.groomsmen === 'string' ? JSON.parse(data.groomsmen) : data.groomsmen || [],
//                     gifts: typeof data.gifts === 'string' ? JSON.parse(data.gifts) : data.gifts || [],
//                     gallery_images: typeof data.gallery_images === 'string' ? JSON.parse(data.gallery_images) : data.gallery_images || [],
//                     allowed_guests: typeof data.allowed_guests === 'string' ? JSON.parse(data.allowed_guests) : data.allowed_guests || ["1", "2"]
//                 });
//             }
//         } catch (error) {
//             console.error("Error fetching wedding:", error);
//             alert("Could not load wedding details.");
//             navigate('/admin');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Steps Configuration
//     const steps = [
//         { label: "The Couple", icon: "fa-heart", description: "Basic details" },
//         { label: "Date & Venue", icon: "fa-calendar-alt", description: "Event information" },
//         { label: "Our Story", icon: "fa-book-open", description: "Love story" },
//         { label: "Party & Visuals", icon: "fa-images", description: "Photos & party" }
//     ];

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData(prev => ({ ...prev, [name]: value }));
//     };

//     const [leafletLoaded, setLeafletLoaded] = useState(false);
//     const [isSearching, setIsSearching] = useState(false);
//     const [mapInstance, setMapInstance] = useState(null);
//     const [markerInstance, setMarkerInstance] = useState(null);

//     // --- LEAFLET & SEARCH LOGIC ---

//     // 1. Load Leaflet Resources
//     useEffect(() => {
//         if (!document.getElementById('leaflet-css')) {
//             const link = document.createElement('link');
//             link.id = 'leaflet-css';
//             link.rel = 'stylesheet';
//             link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
//             document.head.appendChild(link);
//         }

//         if (!window.L) {
//             const script = document.createElement('script');
//             script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
//             script.async = true;
//             script.onload = () => setLeafletLoaded(true);
//             document.body.appendChild(script);
//         } else {
//             setLeafletLoaded(true);
//         }
//     }, []);

//     // 2. Initialize Map when ready
//     useEffect(() => {
//         if (leafletLoaded && !mapInstance && document.getElementById('leaflet-map-container')) {
//             const L = window.L;
//             // Default center: Lusaka
//             const initialLat = -15.3875;
//             const initialLng = 28.3228;

//             const map = L.map('leaflet-map-container').setView([initialLat, initialLng], 13);

//             L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//                 attribution: '&copy; OpenStreetMap contributors'
//             }).addTo(map);

//             // Add draggable marker
//             const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

//             marker.on('dragend', function (e) {
//                 const { lat, lng } = marker.getLatLng();
//                 updateLocationFromLatLng(lat, lng);
//             });

//             // Map click to move marker
//             map.on('click', function (e) {
//                 marker.setLatLng(e.latlng);
//                 updateLocationFromLatLng(e.latlng.lat, e.latlng.lng);
//             });

//             setMapInstance(map);
//             setMarkerInstance(marker);

//             // Fix map size invalidation after render
//             setTimeout(() => {
//                 map.invalidateSize();
//             }, 100);
//         }
//     }, [leafletLoaded, currentStep]);

//     // 3. Debounced Search Effect
//     useEffect(() => {
//         const timer = setTimeout(async () => {
//             if (addressQuery.length > 2) {
//                 setIsSearching(true);
//                 try {
//                     // Using 'addressdetails=1' to get more info
//                     const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&addressdetails=1&limit=5`);
//                     const data = await response.json();
//                     setSearchResults(data);
//                 } catch (error) {
//                     console.error("Search error", error);
//                 } finally {
//                     setIsSearching(false);
//                 }
//             } else {
//                 setSearchResults([]);
//             }
//         }, 500); // 500ms debounce

//         return () => clearTimeout(timer);
//     }, [addressQuery]);

//     const updateLocationFromLatLng = (lat, lng) => {
//         // Construct standard generic embed URL or Google Maps link
//         const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
//         setFormData(prev => ({
//             ...prev,
//             map_location: embedUrl
//         }));
//     };

//     const selectAddress = (result) => {
//         const lat = parseFloat(result.lat);
//         const lon = parseFloat(result.lon);

//         if (mapInstance && markerInstance) {
//             mapInstance.setView([lat, lon], 16);
//             markerInstance.setLatLng([lat, lon]);
//         }

//         updateLocationFromLatLng(lat, lon);

//         setFormData(prev => ({
//             ...prev,
//             venue_address: result.display_name
//         }));

//         setSearchResults([]);
//         setAddressQuery(result.display_name.split(',')[0]); // Set concise name to input
//     };

//     // Kept for backward compatibility if any button calls it directly (though UI removed it)
//     const handleAddressSearch = () => { /* no-op in new live search */ };

//     const uploadImage = async (file, path) => {
//         if (!file) return null;
//         try {
//             setUploading(true);
//             const fileExt = file.name.split('.').pop();
//             const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
//             const filePath = `${path}/${fileName}`;

//             const { error: uploadError } = await supabase.storage
//                 .from('wedding-uploads')
//                 .upload(filePath, file);

//             if (uploadError) {
//                 if (uploadError.message.includes("row-level security")) {
//                     alert("Supabase Security Error: You need to run the policies in SUPABASE_SETUP.sql to allow uploads.");
//                 }
//                 throw uploadError;
//             }

//             const { data } = supabase.storage.from('wedding-uploads').getPublicUrl(filePath);
//             return data.publicUrl;
//         } catch (error) {
//             console.error('Error uploading image:', error);
//             return null;
//         } finally {
//             setUploading(false);
//         }
//     };

//     const ImageUpload = ({ label, value, onUpload, path = "misc", id }) => {
//         const inputId = id || `file-${label.replace(/\s+/g, '_')}`;

//         const handleFileChange = async (e) => {
//             const file = e.target.files[0];
//             if (file) {
//                 const url = await uploadImage(file, path);
//                 if (url) onUpload(url);
//             }
//         };

//         return (
//             <div className="form-group">
//                 <label className="form-label">{label}</label>
//                 <div className="image-upload-wrapper" onClick={() => document.getElementById(inputId).click()}>
//                     <input type="file" id={inputId} onChange={handleFileChange} accept="image/*" />
//                     {value ? (
//                         <div className="image-preview">
//                             <img src={value} alt="Preview" />
//                             <button className="remove-image" onClick={(e) => { e.stopPropagation(); onUpload(""); }} type="button"><i className="fas fa-times"></i></button>
//                         </div>
//                     ) : (
//                         <div className="upload-placeholder">
//                             {uploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
//                             <span>{uploading ? "Uploading..." : "Click to Upload Photo"}</span>
//                         </div>
//                     )}
//                 </div>
//             </div>
//         );
//     };

//     const addItem = (field, initialItem) => {
//         setFormData(prev => ({ ...prev, [field]: [...prev[field], initialItem] }));
//     };
//     const updateItem = (field, index, key, value) => {
//         const newArray = [...formData[field]]; newArray[index][key] = value;
//         setFormData(prev => ({ ...prev, [field]: newArray }));
//     };
//     const removeItem = (field, index) => {
//         const newArray = [...formData[field]]; newArray.splice(index, 1);
//         setFormData(prev => ({ ...prev, [field]: newArray }));
//     };

//     const handleSubmit = async () => {
//         setLoading(true);
//         try {
//             // If creating new, generate slug. If editing, keep existing slug.
//             let slug = formData.slug;
//             if (!slug) {
//                 const slugBase = `${formData.groom_name}-${formData.bride_name}-${formData.date}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
//                 slug = `${slugBase}-${Date.now()}`;
//             }

//             const payload = { ...formData, slug };
//             console.log("Submitting Payload:", payload); // DEBUG: Log payload

//             let error;
//             if (isEditMode) {
//                 const { error: updateError } = await supabase.from('weddings').update(payload).eq('id', id);
//                 error = updateError;
//             } else {
//                 const { error: insertError } = await supabase.from('weddings').insert([payload]);
//                 error = insertError;
//             }

//             if (error) throw error;

//             alert(isEditMode ? 'Wedding Updated Successfully!' : 'Wedding Website Created Successfully!');
//             if (isEditMode) navigate('/admin'); else navigate(`/w/${slug}`);

//         } catch (error) {
//             alert('Error saving wedding: ' + error.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // --- RENDER STEPS ---
//     const renderStep1 = () => (
//         <div className="form-section">
//             <h2 className="section-title">The Happy Couple</h2>

//             <div style={{ marginBottom: '30px' }}>
//                 <ImageUpload label="Cover Image (Preview for shared links)" value={formData.cover_image} onUpload={(url) => setFormData(p => ({ ...p, cover_image: url }))} path="covers" />
//             </div>

//             <div className="grid-2">
//                 <div>
//                     <h3 className="section-subtitle"><i className="fas fa-female"></i> The Bride</h3>
//                     <div className="form-group"><label className="form-label">Name</label><input className="form-input" name="bride_name" value={formData.bride_name} onChange={handleChange} /></div>
//                     <ImageUpload label="Bride's Photo" value={formData.bride_image} onUpload={(url) => setFormData(p => ({ ...p, bride_image: url }))} path="couples" />
//                     <div className="form-group"><label className="form-label">Bio</label><textarea className="form-textarea" name="bride_description" value={formData.bride_description} onChange={handleChange} /></div>
//                 </div>
//                 <div>
//                     <h3 className="section-subtitle"><i className="fas fa-male"></i> The Groom</h3>
//                     <div className="form-group"><label className="form-label">Name</label><input className="form-input" name="groom_name" value={formData.groom_name} onChange={handleChange} /></div>
//                     <ImageUpload label="Groom's Photo" value={formData.groom_image} onUpload={(url) => setFormData(p => ({ ...p, groom_image: url }))} path="couples" />
//                     <div className="form-group"><label className="form-label">Bio</label><textarea className="form-textarea" name="groom_description" value={formData.groom_description} onChange={handleChange} /></div>
//                 </div>
//             </div>
//         </div>
//     );

//     const renderStep2 = () => (
//         <div className="form-section">
//             <h2 className="section-title">Date & Locaton</h2>
//             <div className="grid-2">
//                 <div className="form-group">
//                     <label className="form-label">Main Wedding Date</label>
//                     <input type="date" className="form-input" name="date" value={formData.date} onChange={handleChange} />
//                 </div>
//                 <div className="form-group">
//                     <label className="form-label">Display Location (City/Country)</label>
//                     <input className="form-input" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. New York, NY" />
//                 </div>
//                 <div className="form-group">
//                     <label className="form-label">RSVP Deadline</label>
//                     <input type="date" className="form-input" name="rsvp_deadline" value={formData.rsvp_deadline} onChange={handleChange} />
//                 </div>
//                 <div className="form-group">
//                     <label className="form-label">Dress Code</label>
//                     <input type="text" className="form-input" name="dress_code" value={formData.dress_code} onChange={handleChange} placeholder="e.g. Formal, Cocktail Attire" />
//                 </div>
//             </div>

//             <div className="form-group">
//                 <label className="form-label">Guest Count Options (Comma separated)</label>
//                 <input
//                     className="form-input"
//                     value={Array.isArray(formData.allowed_guests) ? formData.allowed_guests.join(", ") : formData.allowed_guests}
//                     onChange={(e) => setFormData({ ...formData, allowed_guests: e.target.value.split(',').map(s => s.trim()) })}
//                     placeholder="e.g. 1, 2 (Couple), 3, 4+"
//                 />
//             </div>

//             <div className="form-group" style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
//                 <label className="form-label" style={{ color: '#166534', fontWeight: 'bold' }}>Find Venue & Select Location</label>
//                 <p style={{ fontSize: '0.9rem', color: '#166534', marginBottom: '15px' }}>
//                     Type to search specific venues (e.g. "Twangale Park"). Select from the list or drag the pin on the map.
//                 </p>

//                 <div style={{ position: 'relative' }}>
//                     <input
//                         className="form-input"
//                         value={addressQuery}
//                         onChange={(e) => setAddressQuery(e.target.value)}
//                         placeholder="Start typing venue name..."
//                         style={{ marginBottom: '10px' }}
//                     />
//                     {isSearching && <div style={{ position: 'absolute', right: '10px', top: '10px', color: '#888' }}><i className="fas fa-spinner fa-spin"></i></div>}

//                     {searchResults.length > 0 && (
//                         <ul style={{
//                             position: 'absolute',
//                             top: '100%',
//                             left: 0,
//                             width: '100%',
//                             background: 'white',
//                             border: '1px solid #ddd',
//                             borderRadius: '0 0 8px 8px',
//                             listStyle: 'none',
//                             padding: 0,
//                             margin: '-10px 0 0 0',
//                             maxHeight: '250px',
//                             overflowY: 'auto',
//                             zIndex: 1000,
//                             boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
//                         }}>
//                             {searchResults.map((result, idx) => (
//                                 <li
//                                     key={idx}
//                                     onClick={() => selectAddress(result)}
//                                     style={{
//                                         padding: '12px 15px',
//                                         cursor: 'pointer',
//                                         borderBottom: '1px solid #eee',
//                                         fontSize: '0.9rem',
//                                         transition: 'background 0.2s'
//                                     }}
//                                     onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
//                                     onMouseLeave={(e) => e.target.style.background = 'white'}
//                                 >
//                                     <strong>{result.name ? result.name : result.display_name.split(',')[0]}</strong>
//                                     <br />
//                                     <span style={{ fontSize: '0.8rem', color: '#666' }}>{result.display_name}</span>
//                                 </li>
//                             ))}
//                         </ul>
//                     )}
//                 </div>

//                 <div
//                     id="leaflet-map-container"
//                     style={{ width: '100%', height: '400px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #ddd', zIndex: 1 }}
//                 ></div>

//                 <div style={{ marginTop: '15px' }}>
//                     <label className="form-label" style={{ fontSize: '0.9rem' }}>Generated Location URL</label>
//                     <input
//                         className="form-input"
//                         name="map_location"
//                         value={formData.map_location}
//                         onChange={handleChange}
//                         placeholder="Google Maps Embed URL will appear here..."
//                     />
//                     {formData.map_location && (
//                         <p style={{ fontSize: '0.8rem', color: 'green', marginTop: '5px' }}>
//                             ✓ Location set! <a href={formData.map_location} target="_blank" rel="noopener noreferrer">Test Link</a>
//                         </p>
//                     )}
//                 </div>
//             </div>

//             <h3>Ceremony</h3>
//             <div className="grid-2">
//                 <div className="form-group"><label className="form-label">Venue Name</label><input className="form-input" name="ceremony_venue" value={formData.ceremony_venue} onChange={handleChange} /></div>
//                 <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" name="ceremony_date" value={formData.ceremony_date} onChange={handleChange} /></div>
//                 <div className="form-group"><label className="form-label">Time</label><input type="time" className="form-input" name="ceremony_time" value={formData.ceremony_time} onChange={handleChange} /></div>
//             </div>

//             <h3>Reception</h3>
//             <div className="grid-2">
//                 <div className="form-group"><label className="form-label">Venue Name</label><input className="form-input" name="reception_venue" value={formData.reception_venue} onChange={handleChange} /></div>
//                 <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" name="reception_date" value={formData.reception_date} onChange={handleChange} /></div>
//                 <div className="form-group"><label className="form-label">Time</label><input type="time" className="form-input" name="reception_time" value={formData.reception_time} onChange={handleChange} /></div>
//                 <div className="form-group"><label className="form-label">Address</label><input className="form-input" name="reception_address" value={formData.reception_address} onChange={handleChange} /></div>
//             </div>
//         </div>
//     );

//     const renderStep3 = () => (
//         <div className="form-section">
//             <h2 className="section-title">Our Story</h2>
//             <div className="form-group"><label className="form-label">How We Met</label><textarea className="form-textarea" name="story_part1" value={formData.story_part1} onChange={handleChange} /></div>
//             <div className="form-group"><label className="form-label">Highlight Quote</label><input className="form-input" name="story_highlight" value={formData.story_highlight} onChange={handleChange} /></div>
//             <div className="form-group"><label className="form-label">The Proposal</label><textarea className="form-textarea" name="story_part2" value={formData.story_part2} onChange={handleChange} /></div>
//         </div>
//     );

//     const renderStep4 = () => (
//         <div className="form-section">
//             <h2 className="section-title">Visuals & Party</h2>
//             <h3>Bridesmaids</h3>
//             {formData.bridesmaids.map((item, idx) => (
//                 <div key={idx} className="array-item grid-2">
//                     <button className="remove-item-btn" onClick={() => removeItem('bridesmaids', idx)} type="button"><i className="fas fa-trash"></i></button>
//                     <div><input className="form-input" placeholder="Name" value={item.name} onChange={(e) => updateItem('bridesmaids', idx, 'name', e.target.value)} /><input className="form-input" placeholder="Role" value={item.role} onChange={(e) => updateItem('bridesmaids', idx, 'role', e.target.value)} style={{ marginTop: 5 }} /></div>
//                     <div><ImageUpload label="Photo" id={`bridesmaid-photo-${idx}`} value={item.photo} onUpload={(url) => updateItem('bridesmaids', idx, 'photo', url)} path="party" /></div>
//                 </div>
//             ))}
//             <button className="add-item-btn" onClick={() => addItem('bridesmaids', { name: "", role: "", photo: "" })} type="button">+ Add Bridesmaid</button>

//             <h3 style={{ marginTop: '30px' }}>Groomsmen</h3>
//             {formData.groomsmen.map((item, idx) => (
//                 <div key={idx} className="array-item grid-2">
//                     <button className="remove-item-btn" onClick={() => removeItem('groomsmen', idx)} type="button"><i className="fas fa-trash"></i></button>
//                     <div><input className="form-input" placeholder="Name" value={item.name} onChange={(e) => updateItem('groomsmen', idx, 'name', e.target.value)} /><input className="form-input" placeholder="Role" value={item.role} onChange={(e) => updateItem('groomsmen', idx, 'role', e.target.value)} style={{ marginTop: 5 }} /></div>
//                     <div><ImageUpload label="Photo" id={`groomsman-photo-${idx}`} value={item.photo} onUpload={(url) => updateItem('groomsmen', idx, 'photo', url)} path="party" /></div>
//                 </div>
//             ))}
//             <button className="add-item-btn" onClick={() => addItem('groomsmen', { name: "", role: "", photo: "" })} type="button">+ Add Groomsman</button>

//             <h3 style={{ marginTop: '30px' }}>Gifts & Contributions</h3>
//             <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>Add payment identifiers for cash gifts or links to registries.</p>
//             {formData.gifts.map((item, idx) => (
//                 <div key={idx} className="array-item" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                         <h4 style={{ margin: 0 }}>Option #{idx + 1}</h4>
//                         <button className="remove-item-btn" onClick={() => removeItem('gifts', idx)} type="button" style={{ position: 'static' }}><i className="fas fa-trash"></i> Remove</button>
//                     </div>

//                     <div className="grid-2">
//                         <div className="form-group">
//                             <label className="form-label">Type</label>
//                             <select className="form-input" value={item.giftType} onChange={(e) => updateItem('gifts', idx, 'giftType', e.target.value)}>
//                                 <option value="Mobile Money">Mobile Money</option>
//                                 <option value="Bank Transfer">Bank Transfer</option>
//                                 <option value="Cash at Event">Cash at Event</option>
//                                 <option value="Gift Registry">Gift Registry / URL</option>
//                                 <option value="Other">Other</option>
//                             </select>
//                         </div>
//                         <div className="form-group">
//                             <label className="form-label">Provider / Bank Name</label>
//                             <input className="form-input" placeholder="e.g. MTN, FNB, Amazon" value={item.provider} onChange={(e) => updateItem('gifts', idx, 'provider', e.target.value)} />
//                         </div>
//                     </div>

//                     {(item.giftType === 'Mobile Money' || item.giftType === 'Bank Transfer' || item.giftType === 'Other') && (
//                         <div className="grid-2">
//                             <div className="form-group">
//                                 <label className="form-label">Account Name</label>
//                                 <input className="form-input" placeholder="Account Holder Name" value={item.accountName} onChange={(e) => updateItem('gifts', idx, 'accountName', e.target.value)} />
//                             </div>
//                             <div className="form-group">
//                                 <label className="form-label">Account / Phone Number</label>
//                                 <input className="form-input" placeholder="Number" value={item.accountNumber} onChange={(e) => updateItem('gifts', idx, 'accountNumber', e.target.value)} />
//                             </div>
//                         </div>
//                     )}

//                     <div className="grid-2">
//                         <div className="form-group">
//                             <label className="form-label">Instructions (Optional)</label>
//                             <input className="form-input" placeholder="e.g. Please use ref: Wedding" value={item.instructions} onChange={(e) => updateItem('gifts', idx, 'instructions', e.target.value)} />
//                         </div>
//                         <div className="form-group">
//                             <label className="form-label">Link / URL (Optional)</label>
//                             <input className="form-input" placeholder="https://..." value={item.url} onChange={(e) => updateItem('gifts', idx, 'url', e.target.value)} />
//                         </div>
//                     </div>
//                 </div>
//             ))}
//             <button className="add-item-btn" onClick={() => addItem('gifts', { giftType: "Mobile Money", provider: "", accountName: "", accountNumber: "", instructions: "", url: "" })} type="button">+ Add Gift Option</button>

//             <h3 style={{ marginTop: '30px' }}>Gallery / Slider</h3>
//             <div className="grid-2">
//                 {formData.slider_images.map((img, idx) => (
//                     <div key={idx} className="image-upload-wrapper">
//                         <img src={img} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
//                         <button className="remove-image" onClick={() => { const n = [...formData.slider_images]; n.splice(idx, 1); setFormData(p => ({ ...p, slider_images: n })); }} type="button"><i className="fas fa-trash"></i></button>
//                     </div>
//                 ))}
//                 <ImageUpload label="New Slider Image" value="" onUpload={(url) => setFormData(p => ({ ...p, slider_images: [...p.slider_images, url] }))} path="hero" />
//             </div>

//             <h3 style={{ marginTop: '30px' }}>Photo Gallery</h3>
//             <div className="grid-2">
//                 {formData.gallery_images.map((img, idx) => (
//                     <div key={idx} className="image-upload-wrapper">
//                         <img src={img} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
//                         <button className="remove-image" onClick={() => { const n = [...formData.gallery_images]; n.splice(idx, 1); setFormData(p => ({ ...p, gallery_images: n })); }} type="button"><i className="fas fa-trash"></i></button>
//                     </div>
//                 ))}
//                 <ImageUpload label="New Gallery Photo" value="" onUpload={(url) => setFormData(p => ({ ...p, gallery_images: [...p.gallery_images, url] }))} path="gallery" />
//             </div>
//         </div>
//     );

//     return (
//         <>
//             {/* Admin Header */}
//             <header className="admin-header">
//                 <div className="admin-header-content">
//                     <div className="admin-logo">
//                         <div className="admin-logo-icon">
//                             <i className="fas fa-heart"></i>
//                         </div>
//                         <div className="admin-logo-text">
//                             <h1>SaveMeASeat</h1>
//                             <p>Wedding Admin Panel</p>
//                         </div>
//                     </div>
//                     <nav className="admin-nav">
//                         <button className="admin-nav-btn secondary" onClick={() => navigate('/admin')}>
//                             <i className="fas fa-th-large"></i> Dashboard
//                         </button>
//                         <button className="admin-nav-btn primary" onClick={() => window.open('/w/' + formData.slug, '_blank')}>
//                             <i className="fas fa-eye"></i> Preview
//                         </button>
//                     </nav>
//                 </div>
//             </header>

//             <div className="add-wedding-container">
//                 {/* Page Title Card */}
//                 <div className="page-title-card">
//                     <div className="page-title-content">
//                         <h1>
//                             <i className={isEditMode ? "fas fa-edit" : "fas fa-plus-circle"}></i>
//                             {isEditMode ? 'Edit Wedding Details' : 'Create Wedding Website'}
//                         </h1>
//                         <p>
//                             {isEditMode
//                                 ? 'Update your wedding information and manage all the details for your special day.'
//                                 : 'Set up your beautiful wedding website in just a few steps. Add your story, photos, and all the details your guests need.'}
//                         </p>
//                     </div>
//                 </div>

//                 {/* Progress Steps */}
//                 <div className="progress-section">
//                     <div className="form-steps">
//                         {steps.map((step, idx) => (
//                             <div
//                                 key={idx}
//                                 className={`step ${currentStep === idx ? 'active' : ''} ${currentStep > idx ? 'completed' : ''}`}
//                                 onClick={() => setCurrentStep(idx)}
//                             >
//                                 <div className="step-number">
//                                     {currentStep > idx ? <i className="fas fa-check"></i> : <i className={`fas ${step.icon}`}></i>}
//                                 </div>
//                                 <div className="step-info">
//                                     <span className="step-label">{step.label}</span>
//                                     <span className="step-description">{step.description}</span>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Form Content */}
//                 <div className="form-content-card">
//                     <div className="form-content">
//                         {currentStep === 0 && renderStep1()}
//                         {currentStep === 1 && renderStep2()}
//                         {currentStep === 2 && renderStep3()}
//                         {currentStep === 3 && renderStep4()}
//                     </div>
//                 </div>

//                 {/* Form Actions */}
//                 <div className="form-actions">
//                     <button
//                         className="btn btn-secondary"
//                         disabled={currentStep === 0}
//                         onClick={() => setCurrentStep(p => p - 1)}
//                         type="button"
//                     >
//                         <i className="fas fa-arrow-left"></i> Previous Step
//                     </button>
//                     {currentStep < steps.length - 1 ? (
//                         <button
//                             className="btn btn-primary"
//                             onClick={() => setCurrentStep(p => p + 1)}
//                             type="button"
//                         >
//                             Next Step <i className="fas fa-arrow-right"></i>
//                         </button>
//                     ) : (
//                         <button
//                             className="btn btn-primary"
//                             onClick={handleSubmit}
//                             disabled={loading}
//                             type="button"
//                         >
//                             {loading ? (
//                                 <><i className="fas fa-spinner fa-spin"></i> Saving...</>
//                             ) : (
//                                 <><i className="fas fa-rocket"></i> {isEditMode ? "Update Wedding" : "Launch Website"}</>
//                             )}
//                         </button>
//                     )}
//                 </div>
//             </div>
//         </>
//     );
// };

// export default AddWedding;



import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import './AddWedding.css';

const AddWedding = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);

    const initialFormState = {
        cover_image: "",
        bride_name: "", bride_image: "", bride_description: "",
        groom_name: "", groom_image: "", groom_description: "",
        date: "", location: "",
        venue_name: "", venue_address: "", venue_description: "",
        story_part1: "", story_highlight: "", story_part2: "",
        ceremony_date: "", ceremony_time: "", ceremony_venue: "",
        reception_date: "", reception_time: "", reception_venue: "", reception_address: "",
        rsvp_deadline: "",
        dress_code: "", dress_code_desc: "",
        map_location: "",
        tagline: "We are getting married",
        slider_images: [], bridesmaids: [], groomsmen: [], gifts: [], gallery_images: [], other_events: [],
        allowed_guests: ["1", "2"]
    };

    const [formData, setFormData] = useState(initialFormState);
    const [addressQuery, setAddressQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);
    const [markerInstance, setMarkerInstance] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});

    useEffect(() => {
        window.scrollTo(0, 0);
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
                setFormData({
                    ...data,
                    rsvp_deadline: data.rsvp_deadline || "",
                    tagline: data.tagline || "We are getting married",
                    slider_images: typeof data.slider_images === 'string' ? JSON.parse(data.slider_images) : data.slider_images || [],
                    bridesmaids: typeof data.bridesmaids === 'string' ? JSON.parse(data.bridesmaids) : data.bridesmaids || [],
                    groomsmen: typeof data.groomsmen === 'string' ? JSON.parse(data.groomsmen) : data.groomsmen || [],
                    gifts: typeof data.gifts === 'string' ? JSON.parse(data.gifts) : data.gifts || [],
                    gallery_images: typeof data.gallery_images === 'string' ? JSON.parse(data.gallery_images) : data.gallery_images || [],
                    other_events: typeof data.other_events === 'string' ? JSON.parse(data.other_events) : data.other_events || [],
                    allowed_guests: typeof data.allowed_guests === 'string' ? JSON.parse(data.allowed_guests) : data.allowed_guests || ["1", "2"]
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

    const steps = [
        { label: "Couple Details", icon: "fa-heart", description: "Basic information" },
        { label: "Event Info", icon: "fa-calendar-alt", description: "Date & venue" },
        { label: "Our Story", icon: "fa-book-open", description: "Love journey" },
        { label: "Party & Photos", icon: "fa-images", description: "Visuals & team" }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
        if (leafletLoaded && !mapInstance && document.getElementById('leaflet-map-container') && isMapOpen) {
            const L = window.L;
            const initialLat = -15.3875;
            const initialLng = 28.3228;

            const map = L.map('leaflet-map-container').setView([initialLat, initialLng], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

            marker.on('dragend', function (e) {
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
    }, [leafletLoaded, isMapOpen]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (addressQuery.length > 2) {
                setIsSearching(true);
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&addressdetails=1&limit=5`);
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

    const uploadImage = async (file, path, id) => {
        if (!file) return null;
        try {
            setUploading(true);
            setUploadProgress(prev => ({ ...prev, [id]: 0 }));

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${path}/${fileName}`;

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    const current = prev[id] || 0;
                    if (current < 90) {
                        return { ...prev, [id]: current + 10 };
                    }
                    clearInterval(progressInterval);
                    return prev;
                });
            }, 100);

            const { error: uploadError } = await supabase.storage
                .from('wedding-uploads')
                .upload(filePath, file);

            clearInterval(progressInterval);
            setUploadProgress(prev => ({ ...prev, [id]: 100 }));

            if (uploadError) {
                if (uploadError.message.includes("row-level security")) {
                    alert("Supabase Security Error: You need to run the policies in SUPABASE_SETUP.sql to allow uploads.");
                }
                throw uploadError;
            }

            const { data } = supabase.storage.from('wedding-uploads').getPublicUrl(filePath);

            setTimeout(() => {
                setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[id];
                    return newProgress;
                });
            }, 500);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[id];
                return newProgress;
            });
            return null;
        } finally {
            setUploading(false);
        }
    };

    const ImageUpload = ({ label, value, onUpload, path = "misc", id, className = "" }) => {
        const uploadId = id || `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const progress = uploadProgress[uploadId] || 0;

        const handleFileChange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    alert("File size should be less than 5MB");
                    return;
                }
                const url = await uploadImage(file, path, uploadId);
                if (url) onUpload(url);
            }
        };

        return (
            <div className={`form-group ${className}`}>
                <label className="form-label">{label}</label>
                <div className={`image-upload-wrapper ${progress > 0 ? 'uploading' : ''}`} onClick={() => document.getElementById(uploadId).click()}>
                    <input type="file" id={uploadId} onChange={handleFileChange} accept="image/*" />
                    {value ? (
                        <div className="image-preview">
                            <img src={value} alt="Preview" />
                            <div className="image-overlay">
                                <button className="replace-image" type="button">
                                    <i className="fas fa-sync-alt"></i>
                                    <span>Replace</span>
                                </button>
                                <button className="remove-image" onClick={(e) => { e.stopPropagation(); onUpload(""); }} type="button">
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="upload-placeholder">
                            <div className="upload-icon">
                                {progress > 0 ? (
                                    <div className="upload-progress">
                                        <div className="progress-circle">
                                            <span>{progress}%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <i className="fas fa-cloud-upload-alt"></i>
                                )}
                            </div>
                            <div className="upload-text">
                                <span className="upload-title">Upload Photo</span>
                                <span className="upload-subtitle">Click to browse or drag & drop</span>
                                <span className="upload-info">PNG, JPG up to 5MB</span>
                            </div>
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
        const newArray = [...formData[field]];
        newArray[index] = { ...newArray[index], [key]: value };
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };

    const removeItem = (field, index) => {
        const newArray = [...formData[field]];
        newArray.splice(index, 1);
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            let slug = formData.slug;
            if (!slug) {
                const slugBase = `${formData.groom_name}-${formData.bride_name}-${formData.date}`
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
                slug = `${slugBase}-${Date.now()}`;
            }

            const payload = { ...formData, slug };

            // Sanitize empty dates/times to NULL to prevent SQL errors
            const nullableFields = [
                'date', 'rsvp_deadline',
                'ceremony_date', 'ceremony_time',
                'reception_date', 'reception_time'
            ];

            nullableFields.forEach(field => {
                if (payload[field] === "") {
                    payload[field] = null;
                }
            });

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
            navigate(isEditMode ? '/admin' : `/w/${slug}`);

        } catch (error) {
            alert('Error saving wedding: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="form-section">
            <div className="section-header">
                <h2 className="section-title">
                    <i className="fas fa-heart"></i>
                    The Happy Couple
                </h2>
                <p className="section-description">Tell us about the bride and groom. Add beautiful photos that capture your personality.</p>
            </div>

            <div className="cover-upload-section">
                <ImageUpload
                    label="Cover Image"
                    value={formData.cover_image}
                    onUpload={(url) => setFormData(p => ({ ...p, cover_image: url }))}
                    path="covers"
                    id="cover-upload"
                    className="cover-upload"
                />
                <p className="upload-hint">This image will be used for social media previews and shared links</p>
            </div>

            <div className="couple-grid">
                <div className="person-card bride">
                    <div className="person-header">
                        <div className="person-icon">
                            <i className="fas fa-female"></i>
                        </div>
                        <h3 className="person-title">The Bride</h3>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div className="input-with-icon">
                            <i className="fas fa-user"></i>
                            <input className="form-input" name="bride_name" value={formData.bride_name} onChange={handleChange} placeholder="Enter bride's full name" />
                        </div>
                    </div>
                    <ImageUpload
                        label="Bride's Photo"
                        value={formData.bride_image}
                        onUpload={(url) => setFormData(p => ({ ...p, bride_image: url }))}
                        path="couples"
                        id="bride-upload"
                    />
                    <div className="form-group">
                        <label className="form-label">
                            <i className="fas fa-quote-left"></i> Bio & Description
                        </label>
                        <textarea className="form-textarea" name="bride_description" value={formData.bride_description} onChange={handleChange} placeholder="Share her story, personality, and interests..." />
                    </div>
                </div>

                <div className="person-card groom">
                    <div className="person-header">
                        <div className="person-icon">
                            <i className="fas fa-male"></i>
                        </div>
                        <h3 className="person-title">The Groom</h3>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div className="input-with-icon">
                            <i className="fas fa-user"></i>
                            <input className="form-input" name="groom_name" value={formData.groom_name} onChange={handleChange} placeholder="Enter groom's full name" />
                        </div>
                    </div>
                    <ImageUpload
                        label="Groom's Photo"
                        value={formData.groom_image}
                        onUpload={(url) => setFormData(p => ({ ...p, groom_image: url }))}
                        path="couples"
                        id="groom-upload"
                    />
                    <div className="form-group">
                        <label className="form-label">
                            <i className="fas fa-quote-left"></i> Bio & Description
                        </label>
                        <textarea className="form-textarea" name="groom_description" value={formData.groom_description} onChange={handleChange} placeholder="Share his story, personality, and interests..." />
                    </div>
                </div>
            </div>

            <div className="section-header" style={{ marginTop: '30px' }}>
                <h3 className="section-subtitle">
                    <i className="fas fa-heading"></i>
                    Page Tagline
                </h3>
            </div>

            <div className="form-group">
                <label className="form-label">
                    <i className="fas fa-tag"></i> Headline Text
                </label>
                <input
                    className="form-input"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleChange}
                    placeholder="e.g. We are getting married, Kitchen Party, etc."
                />
                <small style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>Text shown below names on the main page (Default: "We are getting married")</small>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="form-section">
            <div className="section-header">
                <h2 className="section-title">
                    <i className="fas fa-calendar-alt"></i>
                    Event Details
                </h2>
                <p className="section-description">Set the dates, times, and locations for your special day.</p>
            </div>

            <div className="event-basics">
                <div className="event-card">
                    <div className="event-card-header">
                        <i className="fas fa-star"></i>
                        <h3>Main Event Details</h3>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">
                                <i className="fas fa-calendar-day"></i> Wedding Date
                            </label>
                            <div className="input-group-with-reset">
                                <input type="date" className="form-input" name="date" value={formData.date || ''} onChange={handleChange} />
                                <button type="button" className="btn-reset-input" onClick={() => setFormData({ ...formData, date: '' })} title="Clear Date">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                <i className="fas fa-map-marker-alt"></i> Location
                            </label>
                            <input className="form-input" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., New York, NY" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                <i className="fas fa-clock"></i> RSVP Deadline
                            </label>
                            <div className="input-group-with-reset">
                                <input type="date" className="form-input" name="rsvp_deadline" value={formData.rsvp_deadline || ''} onChange={handleChange} />
                                <button type="button" className="btn-reset-input" onClick={() => setFormData({ ...formData, rsvp_deadline: '' })} title="Clear Date">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                <i className="fas fa-tshirt"></i> Dress Code
                            </label>
                            <input type="text" className="form-input" name="dress_code" value={formData.dress_code} onChange={handleChange} placeholder="e.g., Formal, Cocktail Attire" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                <i className="fas fa-users"></i> Maximum Guests Per RSVP
                            </label>
                            <select
                                className="form-input"
                                value={formData.allowed_guests && formData.allowed_guests.includes("2") ? "2" : "1"}
                                onChange={(e) => {
                                    const max = e.target.value;
                                    setFormData(prev => ({
                                        ...prev,
                                        allowed_guests: max === "2" ? ["1", "2"] : ["1"]
                                    }));
                                }}
                            >
                                <option value="1">Strictly 1 Guest</option>
                                <option value="2">Allow Plus One (Up to 2 Guests)</option>
                            </select>
                            <small style={{ color: 'var(--gray)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>Controls if guests can bring a plus one</small>
                        </div>
                    </div>
                </div>
            </div>

            <div className="map-section">
                <div className="map-header">
                    <h3>
                        <i className="fas fa-map-marked-alt"></i>
                        Venue Location
                    </h3>
                    <button
                        type="button"
                        className="btn-map-toggle"
                        onClick={() => setIsMapOpen(!isMapOpen)}
                    >
                        <i className={`fas fa-chevron-${isMapOpen ? 'up' : 'down'}`}></i>
                        {isMapOpen ? 'Hide Map' : 'Show Map'}
                    </button>
                </div>

                {isMapOpen && (
                    <div className="map-container">
                        <div className="map-search">
                            <div className="search-input-wrapper">
                                <i className="fas fa-search"></i>
                                <input
                                    className="search-input"
                                    value={addressQuery}
                                    onChange={(e) => setAddressQuery(e.target.value)}
                                    placeholder="Search venues (e.g., 'Twangale Park')..."
                                />
                                {isSearching && <i className="fas fa-spinner fa-spin search-spinner"></i>}
                            </div>

                            {searchResults.length > 0 && (
                                <div className="search-results">
                                    {searchResults.map((result, idx) => (
                                        <div
                                            key={idx}
                                            className="search-result"
                                            onClick={() => selectAddress(result)}
                                        >
                                            <div className="result-icon">
                                                <i className="fas fa-map-pin"></i>
                                            </div>
                                            <div className="result-info">
                                                <div className="result-name">{result.name || result.display_name.split(',')[0]}</div>
                                                <div className="result-address">{result.display_name}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div id="leaflet-map-container" className="leaflet-map"></div>

                        <div className="map-info">
                            <div className="form-group">
                                <label className="form-label">Generated Location URL</label>
                                <div className="url-display">
                                    <input
                                        className="form-input"
                                        name="map_location"
                                        value={formData.map_location}
                                        onChange={handleChange}
                                        placeholder="Map URL will appear here..."
                                    />
                                    {formData.map_location && (
                                        <button
                                            type="button"
                                            className="btn-test-link"
                                            onClick={() => window.open(formData.map_location, '_blank')}
                                        >
                                            <i className="fas fa-external-link-alt"></i>
                                            Test Link
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="map-hint">
                                <i className="fas fa-info-circle"></i>
                                <span>Drag the pin on the map or search for a venue above</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="ceremony-reception-grid">
                <div className="ceremony-card">
                    <div className="event-card-header">
                        <i className="fas fa-church"></i>
                        <h3>Ceremony Details</h3>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Venue Name</label>
                            <input className="form-input" name="ceremony_venue" value={formData.ceremony_venue} onChange={handleChange} placeholder="e.g., St. Mary's Church" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <div className="input-group-with-reset">
                                <input type="date" className="form-input" name="ceremony_date" value={formData.ceremony_date || ''} onChange={handleChange} />
                                <button type="button" className="btn-reset-input" onClick={() => setFormData({ ...formData, ceremony_date: '' })} title="Clear Date">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Time</label>
                            <div className="input-group-with-reset">
                                <input type="time" className="form-input" name="ceremony_time" value={formData.ceremony_time || ''} onChange={handleChange} />
                                <button type="button" className="btn-reset-input" onClick={() => setFormData({ ...formData, ceremony_time: '' })} title="Clear Time">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="reception-card">
                    <div className="event-card-header">
                        <i className="fas fa-glass-cheers"></i>
                        <h3>Reception Details</h3>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Venue Name</label>
                            <input className="form-input" name="reception_venue" value={formData.reception_venue} onChange={handleChange} placeholder="e.g., Grand Ballroom" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <div className="input-group-with-reset">
                                <input type="date" className="form-input" name="reception_date" value={formData.reception_date || ''} onChange={handleChange} />
                                <button type="button" className="btn-reset-input" onClick={() => setFormData({ ...formData, reception_date: '' })} title="Clear Date">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Time</label>
                            <div className="input-group-with-reset">
                                <input type="time" className="form-input" name="reception_time" value={formData.reception_time || ''} onChange={handleChange} />
                                <button type="button" className="btn-reset-input" onClick={() => setFormData({ ...formData, reception_time: '' })} title="Clear Time">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Address</label>
                            <input className="form-input" name="reception_address" value={formData.reception_address} onChange={handleChange} placeholder="Full address for reception venue" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="section-header" style={{ marginTop: '50px' }}>
                <h2 className="section-title">
                    <i className="fas fa-calendar-check"></i>
                    Other Events
                </h2>
                <p className="section-description">For events like Kitchen Parties, Chilanga Mulilo, or Birthday Parties.</p>
            </div>

            <div className="other-events-section">
                {formData.other_events.map((event, idx) => (
                    <div key={idx} className="event-card" style={{ marginBottom: '20px' }}>
                        <div className="event-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fas fa-glass-cheers"></i>
                                <h3>{event.name || `Event #${idx + 1}`}</h3>
                            </div>
                            <button className="btn-remove-member" onClick={() => removeItem('other_events', idx)} type="button">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Event Name</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. Kitchen Party"
                                    value={event.name}
                                    onChange={(e) => updateItem('other_events', idx, 'name', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date</label>
                                <div className="input-group-with-reset">
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={event.date || ''}
                                        onChange={(e) => updateItem('other_events', idx, 'date', e.target.value)}
                                    />
                                    <button type="button" className="btn-reset-input" onClick={() => updateItem('other_events', idx, 'date', '')} title="Clear Date">
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Time</label>
                                <div className="input-group-with-reset">
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={event.time || ''}
                                        onChange={(e) => updateItem('other_events', idx, 'time', e.target.value)}
                                    />
                                    <button type="button" className="btn-reset-input" onClick={() => updateItem('other_events', idx, 'time', '')} title="Clear Time">
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Venue Name</label>
                                <input
                                    className="form-input"
                                    placeholder="Venue Name"
                                    value={event.venue}
                                    onChange={(e) => updateItem('other_events', idx, 'venue', e.target.value)}
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Address</label>
                                <input
                                    className="form-input"
                                    placeholder="Full Address"
                                    value={event.address}
                                    onChange={(e) => updateItem('other_events', idx, 'address', e.target.value)}
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Dress Code</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. Traditional, Casual"
                                    value={event.dress_code}
                                    onChange={(e) => updateItem('other_events', idx, 'dress_code', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
                <button
                    className="btn-add-member"
                    onClick={() => addItem('other_events', { name: "", date: "", time: "", venue: "", address: "", dress_code: "" })}
                    type="button"
                    style={{ marginTop: '10px' }}
                >
                    <i className="fas fa-plus"></i>
                    Add Event
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="form-section">
            <div className="section-header">
                <h2 className="section-title">
                    <i className="fas fa-book-open"></i>
                    Our Love Story
                </h2>
                <p className="section-description">Share your journey together. This will make your wedding website personal and special.</p>
            </div>

            <div className="story-grid">
                <div className="story-card">
                    <div className="story-card-header">
                        <div className="story-icon">
                            <i className="fas fa-heart-circle-check"></i>
                        </div>
                        <h3>How We Met</h3>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Share your first meeting story</label>
                        <textarea
                            className="form-textarea"
                            name="story_part1"
                            value={formData.story_part1}
                            onChange={handleChange}
                            placeholder="Tell us about how you first met, what drew you to each other..."
                            rows="6"
                        />
                    </div>
                </div>

                <div className="highlight-card">
                    <div className="highlight-card-header">
                        <i className="fas fa-quote-right"></i>
                        <h3>Special Quote</h3>
                    </div>
                    <div className="form-group">
                        <label className="form-label">A quote that represents your love</label>
                        <input
                            className="form-input"
                            name="story_highlight"
                            value={formData.story_highlight}
                            onChange={handleChange}
                            placeholder="e.g., 'In you, I've found the love of my life and my closest, truest friend.'"
                        />
                    </div>
                </div>

                <div className="story-card">
                    <div className="story-card-header">
                        <div className="story-icon">
                            <i className="fas fa-ring"></i>
                        </div>
                        <h3>The Proposal</h3>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Share your proposal story</label>
                        <textarea
                            className="form-textarea"
                            name="story_part2"
                            value={formData.story_part2}
                            onChange={handleChange}
                            placeholder="How did the proposal happen? Where were you? How did you feel?"
                            rows="6"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="form-section">
            <div className="section-header">
                <h2 className="section-title">
                    <i className="fas fa-images"></i>
                    Photos & Wedding Party
                </h2>
                <p className="section-description">Add your wedding party, gift options, and beautiful photos.</p>
            </div>

            <div className="party-section">
                <div className="party-header">
                    <h3>
                        <i className="fas fa-users"></i>
                        Wedding Party
                    </h3>
                    <p className="party-description">Add bridesmaids and groomsmen with their roles and photos.</p>
                </div>

                <div className="party-grid">
                    <div className="bridesmaids-card">
                        <div className="party-card-header">
                            <div className="party-icon bride-icon">
                                <i className="fas fa-female"></i>
                            </div>
                            <h4>Bridesmaids</h4>
                        </div>
                        <div className="party-list">
                            {formData.bridesmaids.map((item, idx) => (
                                <div key={idx} className="party-member">
                                    <div className="member-actions">
                                        <button className="btn-remove-member" onClick={() => removeItem('bridesmaids', idx)}>
                                            <i className="fas fa-times"></i>
                                        </button>
                                        <span className="member-number">#{idx + 1}</span>
                                    </div>
                                    <div className="member-form">
                                        <div className="form-group">
                                            <label className="form-label">Name</label>
                                            <input
                                                className="form-input"
                                                placeholder="Full name"
                                                value={item.name}
                                                onChange={(e) => updateItem('bridesmaids', idx, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Role</label>
                                            <input
                                                className="form-input"
                                                placeholder="e.g., Maid of Honor, Bridesmaid"
                                                value={item.role}
                                                onChange={(e) => updateItem('bridesmaids', idx, 'role', e.target.value)}
                                            />
                                        </div>
                                        <ImageUpload
                                            label="Photo"
                                            id={`bridesmaid-${idx}`}
                                            value={item.photo}
                                            onUpload={(url) => updateItem('bridesmaids', idx, 'photo', url)}
                                            path="party"
                                            className="member-photo-upload"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="btn-add-member" onClick={() => addItem('bridesmaids', { name: "", role: "", photo: "" })}>
                            <i className="fas fa-plus"></i>
                            Add Bridesmaid
                        </button>
                    </div>

                    <div className="groomsmen-card">
                        <div className="party-card-header">
                            <div className="party-icon groom-icon">
                                <i className="fas fa-male"></i>
                            </div>
                            <h4>Groomsmen</h4>
                        </div>
                        <div className="party-list">
                            {formData.groomsmen.map((item, idx) => (
                                <div key={idx} className="party-member">
                                    <div className="member-actions">
                                        <button className="btn-remove-member" onClick={() => removeItem('groomsmen', idx)}>
                                            <i className="fas fa-times"></i>
                                        </button>
                                        <span className="member-number">#{idx + 1}</span>
                                    </div>
                                    <div className="member-form">
                                        <div className="form-group">
                                            <label className="form-label">Name</label>
                                            <input
                                                className="form-input"
                                                placeholder="Full name"
                                                value={item.name}
                                                onChange={(e) => updateItem('groomsmen', idx, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Role</label>
                                            <input
                                                className="form-input"
                                                placeholder="e.g., Best Man, Groomsman"
                                                value={item.role}
                                                onChange={(e) => updateItem('groomsmen', idx, 'role', e.target.value)}
                                            />
                                        </div>
                                        <ImageUpload
                                            label="Photo"
                                            id={`groomsman-${idx}`}
                                            value={item.photo}
                                            onUpload={(url) => updateItem('groomsmen', idx, 'photo', url)}
                                            path="party"
                                            className="member-photo-upload"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="btn-add-member" onClick={() => addItem('groomsmen', { name: "", role: "", photo: "" })}>
                            <i className="fas fa-plus"></i>
                            Add Groomsman
                        </button>
                    </div>
                </div>
            </div>

            <div className="gifts-section">
                <div className="section-header">
                    <h3>
                        <i className="fas fa-gift"></i>
                        Gift Options
                    </h3>
                    <p className="section-description">Add payment methods or registry links for wedding gifts.</p>
                </div>

                <div className="gifts-list">
                    {formData.gifts.map((item, idx) => (
                        <div key={idx} className="gift-card">
                            <div className="gift-card-header">
                                <div className="gift-number">
                                    <i className="fas fa-gift"></i>
                                    <span>Gift Option #{idx + 1}</span>
                                </div>
                                <button className="btn-remove-gift" onClick={() => removeItem('gifts', idx)}>
                                    <i className="fas fa-trash"></i>
                                    Remove
                                </button>
                            </div>
                            <div className="gift-form">
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Gift Type</label>
                                        <select
                                            className="form-select"
                                            value={item.giftType}
                                            onChange={(e) => updateItem('gifts', idx, 'giftType', e.target.value)}
                                        >
                                            <option value="Mobile Money">Mobile Money</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Cash at Event">Cash at Event</option>
                                            <option value="Gift Registry">Gift Registry</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Provider / Bank</label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g., MTN, FNB, Amazon"
                                            value={item.provider}
                                            onChange={(e) => updateItem('gifts', idx, 'provider', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {(item.giftType === 'Mobile Money' || item.giftType === 'Bank Transfer' || item.giftType === 'Other') && (
                                    <div className="grid-2">
                                        <div className="form-group">
                                            <label className="form-label">Account Name</label>
                                            <input
                                                className="form-input"
                                                placeholder="Account holder name"
                                                value={item.accountName}
                                                onChange={(e) => updateItem('gifts', idx, 'accountName', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Account Number</label>
                                            <input
                                                className="form-input"
                                                placeholder="Phone number or account number"
                                                value={item.accountNumber}
                                                onChange={(e) => updateItem('gifts', idx, 'accountNumber', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Special Instructions</label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g., Use reference: Smith Wedding"
                                            value={item.instructions}
                                            onChange={(e) => updateItem('gifts', idx, 'instructions', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Registry Link (Optional)</label>
                                        <input
                                            className="form-input"
                                            placeholder="https://..."
                                            value={item.url}
                                            onChange={(e) => updateItem('gifts', idx, 'url', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button className="btn-add-gift" onClick={() => addItem('gifts', { giftType: "Mobile Money", provider: "", accountName: "", accountNumber: "", instructions: "", url: "" })}>
                        <i className="fas fa-plus-circle"></i>
                        Add Gift Option
                    </button>
                </div>
            </div>

            <div className="gallery-section">
                <div className="gallery-header">
                    <h3>
                        <i className="fas fa-camera"></i>
                        Photo Gallery
                    </h3>
                    <p className="gallery-description">Add photos for your wedding website gallery.</p>
                </div>

                <div className="gallery-grid">
                    {formData.slider_images.map((img, idx) => (
                        <div key={idx} className="gallery-item">
                            <img src={img} alt={`Gallery ${idx + 1}`} />
                            <button className="btn-remove-gallery" onClick={() => {
                                const newArray = [...formData.slider_images];
                                newArray.splice(idx, 1);
                                setFormData(p => ({ ...p, slider_images: newArray }));
                            }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    ))}
                    <div className="gallery-upload-item">
                        <ImageUpload
                            label="Add Gallery Photo"
                            value=""
                            onUpload={(url) => setFormData(p => ({ ...p, slider_images: [...p.slider_images, url] }))}
                            path="gallery"
                            id="gallery-upload"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="add-wedding-page">
            {/* Mobile Sidebar Toggle */}
            <button className="mobile-sidebar-toggle" onClick={() => setShowSidebar(!showSidebar)}>
                <i className={`fas fa-${showSidebar ? 'times' : 'bars'}`}></i>
            </button>

            {/* Sidebar */}
            <aside className={`sidebar ${showSidebar ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-icon">
                            <i className="fas fa-heart"></i>
                        </div>
                        <div className="logo-text">
                            <h2>WeddingSuite</h2>
                            <p>Admin Panel</p>
                        </div>
                    </div>
                </div>

                <div className="sidebar-steps">
                    {steps.map((step, idx) => (
                        <div
                            key={idx}
                            className={`sidebar-step ${currentStep === idx ? 'active' : ''} ${currentStep > idx ? 'completed' : ''}`}
                            onClick={() => {
                                setCurrentStep(idx);
                                setShowSidebar(false);
                            }}
                        >
                            <div className="step-indicator">
                                <div className="step-number">
                                    {currentStep > idx ? <i className="fas fa-check"></i> : idx + 1}
                                </div>
                                <div className="step-line"></div>
                            </div>
                            <div className="step-content">
                                <div className="step-title">
                                    <i className={`fas ${step.icon}`}></i>
                                    {step.label}
                                </div>
                                <div className="step-desc">{step.description}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="sidebar-actions">
                    <button className="sidebar-btn dashboard" onClick={() => navigate('/admin')}>
                        <i className="fas fa-th-large"></i>
                        Dashboard
                    </button>
                    {formData.slug && (
                        <button className="sidebar-btn preview" onClick={() => window.open(`/w/${formData.slug}`, '_blank')}>
                            <i className="fas fa-eye"></i>
                            Preview Site
                        </button>
                    )}
                </div>

                <div className="sidebar-footer">
                    <div className="progress-info">
                        <div className="progress-label">Progress</div>
                        <div className="progress-value">{Math.round(((currentStep + 1) / steps.length) * 100)}%</div>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="main-header">
                    <div className="header-content">
                        <div className="header-title">
                            <h1>
                                <i className={isEditMode ? "fas fa-edit" : "fas fa-plus-circle"}></i>
                                {isEditMode ? 'Edit Wedding' : 'Create Wedding Website'}
                            </h1>
                            <p className="header-subtitle">
                                {isEditMode
                                    ? 'Update your wedding details and make them perfect'
                                    : 'Build your dream wedding website step by step'
                                }
                            </p>
                        </div>
                        <div className="header-stats">
                            <div className="stat">
                                <div className="stat-icon">
                                    <i className="fas fa-check-circle"></i>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value">{currentStep + 1}/{steps.length}</div>
                                    <div className="stat-label">Steps Completed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="content-wrapper">
                    <div className="steps-indicator-mobile">
                        <div className="steps-bar">
                            {steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`step-dot ${currentStep === idx ? 'active' : ''} ${currentStep > idx ? 'completed' : ''}`}
                                    onClick={() => setCurrentStep(idx)}
                                ></div>
                            ))}
                        </div>
                        <div className="step-name">
                            {steps[currentStep].label}
                            <span className="step-count">({currentStep + 1}/{steps.length})</span>
                        </div>
                    </div>

                    <div className="form-container">
                        {loading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Loading wedding details...</p>
                            </div>
                        ) : (
                            <>
                                {currentStep === 0 && renderStep1()}
                                {currentStep === 1 && renderStep2()}
                                {currentStep === 2 && renderStep3()}
                                {currentStep === 3 && renderStep4()}
                            </>
                        )}
                    </div>

                    <div className="form-footer">
                        <div className="footer-actions">
                            <button
                                className="btn btn-prev"
                                disabled={currentStep === 0}
                                onClick={() => { setCurrentStep(p => p - 1); window.scrollTo(0, 0); }}
                                type="button"
                            >
                                <i className="fas fa-chevron-left"></i>
                                Previous Step
                            </button>

                            <div className="step-progress">
                                <div className="progress-text">
                                    Step {currentStep + 1} of {steps.length}
                                </div>
                                <div className="progress-container">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {currentStep < steps.length - 1 ? (
                                <button
                                    className="btn btn-next"
                                    onClick={() => { setCurrentStep(p => p + 1); window.scrollTo(0, 0); }}
                                    type="button"
                                >
                                    Next Step
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            ) : (
                                <button
                                    className="btn btn-submit"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    type="button"
                                >
                                    {loading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-rocket"></i>
                                            {isEditMode ? "Update Wedding" : "Launch Website"}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Overlay for mobile sidebar */}
            {showSidebar && (
                <div className="sidebar-overlay" onClick={() => setShowSidebar(false)}></div>
            )}

            <style jsx>{`
                :root {
                    --primary: #8b5cf6;
                    --primary-light: #a78bfa;
                    --primary-dark: #7c3aed;
                    --secondary: #ec4899;
                    --accent: #f59e0b;
                    --success: #10b981;
                    --warning: #f59e0b;
                    --danger: #ef4444;
                    --dark: #1f2937;
                    --darker: #111827;
                    --light: #f9fafb;
                    --lighter: #f3f4f6;
                    --gray: #6b7280;
                    --gray-light: #9ca3af;
                    --white: #1a1a1afff;
                    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
                    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
                    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
                    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
                    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
                    --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.15);
                    --radius-sm: 0.5rem;
                    --radius-md: 0.75rem;
                    --radius-lg: 1rem;
                    --radius-xl: 1.25rem;
                    --radius-2xl: 1.5rem;
                    --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    min-height: 100vh;
                    color: var(--dark);
                }

                .add-wedding-page {
                    display: flex;
                    min-height: 100vh;
                    position: relative;
                }

                /* Sidebar Styles */
                .sidebar {
                    width: 320px;
                    background: linear-gradient(180deg, var(--darker) 0%, #1e293b 100%);
                    color: var(--white);
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    border-right: 1px solid rgba(255, 255, 255, 0.1);
                    position: fixed;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    z-index: 1000;
                    overflow-y: auto;
                    transform: translateX(0);
                    transition: transform 0.3s ease;
                }

                @media (max-width: 1024px) {
                    .sidebar {
                        transform: translateX(-100%);
                        width: 300px;
                    }

                    .sidebar.open {
                        transform: translateX(0);
                    }
                }

                .sidebar-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    z-index: 999;
                    display: none;
                }

                @media (max-width: 1024px) {
                    .sidebar-overlay {
                        display: block;
                    }
                }

                .mobile-sidebar-toggle {
                    position: fixed;
                    top: 1rem;
                    left: 1rem;
                    z-index: 1100;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: var(--radius-md);
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    cursor: pointer;
                    box-shadow: var(--shadow-lg);
                    display: none;
                }

                @media (max-width: 1024px) {
                    .mobile-sidebar-toggle {
                        display: flex;
                    }
                }

                .sidebar-header {
                    margin-bottom: 3rem;
                }

                .logo {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .logo-icon {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }

                .logo-text h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, var(--white), #e5e7eb);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    line-height: 1.2;
                }

                .logo-text p {
                    font-size: 0.875rem;
                    color: var(--gray-light);
                    margin-top: 0.25rem;
                }

                .sidebar-steps {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .sidebar-step {
                    display: flex;
                    gap: 1rem;
                    align-items: flex-start;
                    cursor: pointer;
                    padding: 0.75rem;
                    border-radius: var(--radius-md);
                    transition: var(--transition);
                    position: relative;
                }

                .sidebar-step:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .sidebar-step.active {
                    background: rgba(139, 92, 246, 0.2);
                    border-left: 3px solid var(--primary);
                }

                .step-indicator {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex-shrink: 0;
                }

                .step-number {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: var(--gray-light);
                    transition: var(--transition);
                }

                .sidebar-step.active .step-number {
                    background: var(--primary);
                    color: white;
                    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
                }

                .sidebar-step.completed .step-number {
                    background: var(--success);
                    color: white;
                }

                .step-line {
                    width: 2px;
                    height: 40px;
                    background: rgba(255, 255, 255, 0.1);
                    margin-top: 0.5rem;
                }

                .step-content {
                    flex: 1;
                }

                .step-title {
                    font-weight: 600;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.25rem;
                }

                .step-desc {
                    font-size: 0.875rem;
                    color: var(--gray-light);
                }

                .sidebar-actions {
                    margin-top: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .sidebar-btn {
                    padding: 0.875rem 1rem;
                    border-radius: var(--radius-md);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                    font-weight: 500;
                    cursor: pointer;
                    transition: var(--transition);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    text-align: left;
                }

                .sidebar-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateY(-2px);
                }

                .sidebar-btn.dashboard {
                    background: rgba(139, 92, 246, 0.2);
                    border-color: var(--primary);
                }

                .sidebar-btn.preview {
                    background: rgba(236, 72, 153, 0.2);
                    border-color: var(--secondary);
                }

                .sidebar-footer {
                    margin-top: 2rem;
                    padding-top: 2rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .progress-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.75rem;
                }

                .progress-label {
                    font-size: 0.875rem;
                    color: var(--gray-light);
                }

                .progress-value {
                    font-weight: 600;
                    color: var(--primary-light);
                }

                .progress-bar {
                    height: 6px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--primary), var(--secondary));
                    border-radius: 3px;
                    transition: width 0.3s ease;
                }

                /* Main Content */
                .main-content {
                    flex: 1;
                    margin-left: 320px;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                }

                @media (max-width: 1024px) {
                    .main-content {
                        margin-left: 0;
                    }
                }

                .main-header {
                    background: var(--white);
                    padding: 2rem 3rem;
                    border-bottom: 1px solid var(--lighter);
                    box-shadow: var(--shadow-sm);
                }

                .header-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-title h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--dark);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .header-title h1 i {
                    color: var(--primary);
                }

                .header-subtitle {
                    color: var(--gray);
                    margin-top: 0.5rem;
                    font-size: 1rem;
                }

                .header-stats {
                    display: flex;
                    gap: 1.5rem;
                }

                .stat {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    background: var(--lighter);
                    padding: 1rem 1.5rem;
                    border-radius: var(--radius-lg);
                }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.25rem;
                }

                .stat-info {
                    display: flex;
                    flex-direction: column;
                }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--dark);
                    line-height: 1;
                }

                .stat-label {
                    font-size: 0.875rem;
                    color: var(--gray);
                    margin-top: 0.25rem;
                }

                /* Content Wrapper */
                .content-wrapper {
                    flex: 1;
                    padding: 3rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    width: 100%;
                }

                @media (max-width: 768px) {
                    .content-wrapper {
                        padding: 1.5rem;
                    }

                    .main-header {
                        padding: 1.5rem;
                    }

                    .header-content {
                        flex-direction: column;
                        gap: 1.5rem;
                        align-items: flex-start;
                    }

                    .header-stats {
                        width: 100%;
                    }

                    .stat {
                        flex: 1;
                        justify-content: center;
                    }
                }

                /* Mobile Steps Indicator */
                .steps-indicator-mobile {
                    background: var(--white);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    box-shadow: var(--shadow-md);
                    display: none;
                }

                @media (max-width: 768px) {
                    .steps-indicator-mobile {
                        display: block;
                    }
                }

                .steps-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    position: relative;
                }

                .steps-bar::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: var(--lighter);
                    transform: translateY(-50%);
                    z-index: 1;
                }

                .step-dot {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--lighter);
                    position: relative;
                    z-index: 2;
                    cursor: pointer;
                    transition: var(--transition);
                }

                .step-dot.active {
                    background: var(--primary);
                    transform: scale(1.2);
                }

                .step-dot.completed {
                    background: var(--success);
                }

                .step-name {
                    font-weight: 600;
                    font-size: 1rem;
                    color: var(--dark);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .step-count {
                    font-weight: 500;
                    color: var(--gray);
                    font-size: 0.875rem;
                }

                /* Form Container */
                .form-container {
                    background: var(--white);
                    border-radius: var(--radius-xl);
                    padding: 3rem;
                    box-shadow: var(--shadow-lg);
                    margin-bottom: 2rem;
                }

                @media (max-width: 768px) {
                    .form-container {
                        padding: 1.5rem;
                    }
                }

                /* Section Styles */
                .form-section {
                    animation: fadeIn 0.4s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .section-header {
                    margin-bottom: 2.5rem;
                }

                .section-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--dark);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }

                .section-title i {
                    color: var(--primary);
                }

                .section-description {
                    color: var(--gray);
                    font-size: 1rem;
                    line-height: 1.6;
                    max-width: 600px;
                }

                /* Cover Upload */
                .cover-upload-section {
                    margin-bottom: 2.5rem;
                }

                .cover-upload .image-upload-wrapper {
                    height: 300px;
                }

                .upload-hint {
                    font-size: 0.875rem;
                    color: var(--gray);
                    margin-top: 0.5rem;
                    text-align: center;
                }

                /* Couple Grid */
                .couple-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }

                @media (max-width: 768px) {
                    .couple-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .person-card {
                    background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
                    border-radius: var(--radius-xl);
                    padding: 2rem;
                    border: 1px solid var(--lighter);
                }

                .person-card.bride {
                    border-top: 4px solid var(--secondary);
                }

                .person-card.groom {
                    border-top: 4px solid var(--primary);
                }

                .person-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .person-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    color: white;
                }

                .bride .person-icon {
                    background: linear-gradient(135deg, var(--secondary), #db2777);
                }

                .groom .person-icon {
                    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                }

                .person-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--dark);
                }

                /* Form Elements */
                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-label {
                    display: block;
                    font-weight: 600;
                    color: var(--dark);
                    margin-bottom: 0.5rem;
                    font-size: 0.875rem;
                }

                .form-label i {
                    margin-right: 0.5rem;
                    color: var(--primary);
                }

                .input-with-icon {
                    position: relative;
                }

                .input-with-icon i {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--gray);
                }

                .form-input, .form-textarea, .form-select {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    border: 1px solid var(--lighter);
                    border-radius: var(--radius-md);
                    font-size: 0.875rem;
                    background: var(--white);
                    color: var(--dark);
                    transition: var(--transition);
                }

                .input-with-icon .form-input {
                    padding-left: 3rem;
                }

                .form-input:hover, .form-textarea:hover, .form-select:hover {
                    border-color: var(--primary-light);
                }

                .form-input:focus, .form-textarea:focus, .form-select:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                }

                .form-textarea {
                    min-height: 120px;
                    resize: vertical;
                    line-height: 1.6;
                }

                /* Image Upload */
                .image-upload-wrapper {
                    border: 2px dashed var(--lighter);
                    border-radius: var(--radius-lg);
                    padding: 2rem;
                    cursor: pointer;
                    transition: var(--transition);
                    background: var(--white);
                    position: relative;
                    overflow: hidden;
                }

                .image-upload-wrapper:hover {
                    border-color: var(--primary);
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                }

                .image-upload-wrapper.uploading {
                    border-color: var(--primary);
                }

                .image-upload-wrapper input {
                    display: none;
                }

                .upload-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                }

                .upload-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--lighter), #e5e7eb);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    color: var(--primary);
                }

                .upload-text {
                    text-align: center;
                }

                .upload-title {
                    display: block;
                    font-weight: 600;
                    color: var(--dark);
                    margin-bottom: 0.25rem;
                }

                .upload-subtitle {
                    display: block;
                    font-size: 0.875rem;
                    color: var(--gray);
                    margin-bottom: 0.25rem;
                }

                .upload-info {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--gray-light);
                }

                .upload-progress {
                    position: relative;
                }

                .progress-circle {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: conic-gradient(var(--primary) ${uploadProgress => uploadProgress}%, var(--lighter) 0%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .progress-circle span {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--dark);
                }

                .image-preview {
                    position: relative;
                    width: 100%;
                    height: 200px;
                    border-radius: var(--radius-md);
                    overflow: hidden;
                }

                .image-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .image-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .image-preview:hover .image-overlay {
                    opacity: 1;
                }

                .replace-image, .remove-image {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: var(--radius-sm);
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: var(--transition);
                }

                .replace-image {
                    background: var(--white);
                    color: var(--dark);
                }

                .replace-image:hover {
                    background: var(--lighter);
                    transform: translateY(-2px);
                }

                .remove-image {
                    background: var(--danger);
                    color: white;
                }

                .remove-image:hover {
                    background: #dc2626;
                    transform: translateY(-2px);
                }

                /* Event Basics */
                .event-basics {
                    margin-bottom: 2.5rem;
                }

                .event-card {
                    background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
                    border-radius: var(--radius-xl);
                    padding: 2rem;
                    border: 1px solid var(--lighter);
                }

                .event-card-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .event-card-header i {
                    font-size: 1.5rem;
                    color: var(--primary);
                }

                .event-card-header h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--dark);
                }

                .grid-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }

                @media (max-width: 768px) {
                    .grid-2 {
                        grid-template-columns: 1fr;
                    }
                }

                /* Map Section */
                .map-section {
                    margin-bottom: 2.5rem;
                }

                .map-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .map-header h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--dark);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .btn-map-toggle {
                    padding: 0.5rem 1rem;
                    background: var(--lighter);
                    border: 1px solid var(--lighter);
                    border-radius: var(--radius-md);
                    color: var(--dark);
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: var(--transition);
                }

                .btn-map-toggle:hover {
                    background: var(--lighter);
                    border-color: var(--primary-light);
                }

                .map-container {
                    background: var(--white);
                    border: 1px solid var(--lighter);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    box-shadow: var(--shadow-md);
                }

                .map-search {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--lighter);
                }

                .search-input-wrapper {
                    position: relative;
                }

                .search-input-wrapper i {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--gray);
                }

                .search-input {
                    width: 100%;
                    padding: 0.875rem 1rem 0.875rem 3rem;
                    border: 1px solid var(--lighter);
                    border-radius: var(--radius-md);
                    font-size: 0.875rem;
                    background: var(--white);
                    color: var(--dark);
                    transition: var(--transition);
                }

                .search-input:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                }

                .search-spinner {
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                }

                .search-results {
                    margin-top: 1rem;
                    max-height: 200px;
                    overflow-y: auto;
                    border: 1px solid var(--lighter);
                    border-radius: var(--radius-md);
                }

                .search-result {
                    padding: 1rem;
                    border-bottom: 1px solid var(--lighter);
                    cursor: pointer;
                    transition: var(--transition);
                    display: flex;
                    gap: 1rem;
                }

                .search-result:last-child {
                    border-bottom: none;
                }

                .search-result:hover {
                    background: var(--lighter);
                }

                .result-icon {
                    width: 32px;
                    height: 32px;
                    background: var(--lighter);
                    border-radius: var(--radius-sm);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary);
                    flex-shrink: 0;
                }

                .result-info {
                    flex: 1;
                }

                .result-name {
                    font-weight: 500;
                    color: var(--dark);
                    margin-bottom: 0.25rem;
                }

                .result-address {
                    font-size: 0.75rem;
                    color: var(--gray);
                }

                .leaflet-map {
                    width: 100%;
                    height: 400px;
                }

                .map-info {
                    padding: 1.5rem;
                    border-top: 1px solid var(--lighter);
                }

                .url-display {
                    display: flex;
                    gap: 1rem;
                }

                .url-display .form-input {
                    flex: 1;
                }

                .btn-test-link {
                    padding: 0.875rem 1.5rem;
                    background: var(--success);
                    color: white;
                    border: none;
                    border-radius: var(--radius-md);
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: var(--transition);
                    white-space: nowrap;
                }

                .btn-test-link:hover {
                    background: #059669;
                    transform: translateY(-2px);
                }

                .map-hint {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                    font-size: 0.875rem;
                    color: var(--gray);
                }

                .map-hint i {
                    color: var(--primary);
                }

                /* Ceremony & Reception */
                .ceremony-reception-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }

                @media (max-width: 768px) {
                    .ceremony-reception-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .ceremony-card {
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    border: 1px solid #bae6fd;
                    border-radius: var(--radius-xl);
                    padding: 2rem;
                }

                .reception-card {
                    background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
                    border: 1px solid #fbcfe8;
                    border-radius: var(--radius-xl);
                    padding: 2rem;
                }

                /* Story Grid */
                .story-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }

                @media (max-width: 768px) {
                    .story-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .story-card {
                    background: var(--white);
                    border: 1px solid var(--lighter);
                    border-radius: var(--radius-xl);
                    padding: 2rem;
                }

                .highlight-card {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border: 1px solid #fbbf24;
                    border-radius: var(--radius-xl);
                    padding: 2rem;
                }

                .story-card-header, .highlight-card-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .story-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: var(--radius-md);
                    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.25rem;
                }

                .highlight-card-header i {
                    font-size: 2rem;
                    color: var(--warning);
                }

                /* Party Section */
                .party-section {
                    margin-bottom: 3rem;
                }

                .party-header {
                    margin-bottom: 2rem;
                }

                .party-header h3 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--dark);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }

                .party-description {
                    color: var(--gray);
                    font-size: 0.875rem;
                }

                .party-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }

                @media (max-width: 768px) {
                    .party-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .bridesmaids-card, .groomsmen-card {
                    background: var(--white);
                    border: 1px solid var(--lighter);
                    border-radius: var(--radius-xl);
                    padding: 2rem;
                }

                .bridesmaids-card {
                    border-top: 4px solid var(--secondary);
                }

                .groomsmen-card {
                    border-top: 4px solid var(--primary);
                }

                .party-card-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .party-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    color: white;
                }

                .bride-icon {
                    background: linear-gradient(135deg, var(--secondary), #db2777);
                }

                .groom-icon {
                    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                }

                .party-list {
                    margin-bottom: 1.5rem;
                }

                .party-member {
                    background: var(--lighter);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                    border: 1px solid var(--lighter);
                }

                .member-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .btn-remove-member {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--danger);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: var(--transition);
                }

                .btn-remove-member:hover {
                    transform: scale(1.1);
                }

                .member-number {
                    font-weight: 600;
                    color: var(--gray);
                    font-size: 0.875rem;
                }

                .member-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .member-photo-upload .image-upload-wrapper {
                    padding: 1rem;
                }

                .member-photo-upload .upload-placeholder {
                    padding: 0.5rem;
                }

                .btn-add-member {
                    width: 100%;
                    padding: 1rem;
                    background: var(--white);
                    border: 2px dashed var(--lighter);
                    border-radius: var(--radius-lg);
                    color: var(--gray);
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: var(--transition);
                }

                .btn-add-member:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                    background: var(--lighter);
                }

                /* Gifts Section */
                .gifts-section {
                    margin-bottom: 3rem;
                }

                .gifts-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .gift-card {
                    background: var(--white);
                    border: 1px solid var(--lighter);
                    border-radius: var(--radius-xl);
                    padding: 2rem;
                }

                .gift-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .gift-number {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-weight: 600;
                    color: var(--dark);
                }

                .gift-number i {
                    color: var(--primary);
                }

                .btn-remove-gift {
                    padding: 0.5rem 1rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid var(--danger);
                    border-radius: var(--radius-md);
                    color: var(--danger);
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: var(--transition);
                }

                .btn-remove-gift:hover {
                    background: var(--danger);
                    color: white;
                }

                .gift-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .btn-add-gift {
                    padding: 1rem;
                    background: var(--white);
                    border: 2px dashed var(--lighter);
                    border-radius: var(--radius-lg);
                    color: var(--gray);
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: var(--transition);
                }

                .btn-add-gift:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                    background: var(--lighter);
                }

                /* Gallery Section */
                .gallery-section {
                    margin-bottom: 2rem;
                }

                .gallery-header {
                    margin-bottom: 1.5rem;
                }

                .gallery-header h3 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--dark);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }

                .gallery-description {
                    color: var(--gray);
                    font-size: 0.875rem;
                }

                .gallery-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1rem;
                }

                @media (max-width: 768px) {
                    .gallery-grid {
                        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    }
                }

                .gallery-item {
                    position: relative;
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    aspect-ratio: 1;
                }

                .gallery-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .btn-remove-gallery {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(0, 0, 0, 0.5);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: var(--transition);
                }

                .btn-remove-gallery:hover {
                    background: rgba(0, 0, 0, 0.7);
                    transform: scale(1.1);
                }

                .gallery-upload-item .image-upload-wrapper {
                    height: 100%;
                    min-height: 200px;
                }

                /* Loading State */
                .loading-state {
                    padding: 4rem 0;
                    text-align: center;
                }

                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 3px solid var(--lighter);
                    border-top-color: var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Form Footer */
                .form-footer {
                    background: var(--white);
                    border-radius: var(--radius-xl);
                    padding: 2rem;
                    box-shadow: var(--shadow-lg);
                }

                .footer-actions {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 2rem;
                }

                @media (max-width: 768px) {
                    .footer-actions {
                        flex-direction: column;
                        gap: 1.5rem;
                    }
                }

                .step-progress {
                    flex: 1;
                    max-width: 400px;
                }

                .progress-text {
                    font-size: 0.875rem;
                    color: var(--gray);
                    margin-bottom: 0.5rem;
                    text-align: center;
                }

                .progress-container {
                    height: 8px;
                    background: var(--lighter);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .btn {
                    padding: 1rem 2rem;
                    border-radius: var(--radius-lg);
                    font-weight: 600;
                    cursor: pointer;
                    transition: var(--transition);
                    border: none;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .btn-prev {
                    background: var(--white);
                    color: var(--dark);
                    border: 2px solid var(--lighter);
                }

                .btn-prev:hover:not(:disabled) {
                    background: var(--lighter);
                    border-color: var(--gray);
                }

                .btn-prev:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .btn-next, .btn-submit {
                    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                    color: white;
                    box-shadow: var(--shadow-md);
                }

                .btn-next:hover, .btn-submit:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-lg);
                }

                .btn-submit {
                    background: linear-gradient(135deg, var(--success), #059669);
                }

                /* Responsive Adjustments */
                @media (max-width: 640px) {
                    .header-title h1 {
                        font-size: 1.5rem;
                    }

                    .section-title {
                        font-size: 1.5rem;
                    }

                    .btn {
                        padding: 0.875rem 1.5rem;
                        font-size: 0.875rem;
                    }

                    .url-display {
                        flex-direction: column;
                    }

                    .btn-test-link {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default AddWedding;