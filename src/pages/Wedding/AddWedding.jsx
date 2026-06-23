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
//                 <ImageUpload label="Add Slider Image(s)" value="" onUpload={(urls) => setFormData(p => ({ ...p, slider_images: [...p.slider_images, ...urls] }))} path="hero" multiple={true} />
//             </div>

//             <h3 style={{ marginTop: '30px' }}>Photo Gallery</h3>
//             <div className="grid-2">
//                 {formData.gallery_images.map((img, idx) => (
//                     <div key={idx} className="image-upload-wrapper">
//                         <img src={img} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
//                         <button className="remove-image" onClick={() => { const n = [...formData.gallery_images]; n.splice(idx, 1); setFormData(p => ({ ...p, gallery_images: n })); }} type="button"><i className="fas fa-trash"></i></button>
//                     </div>
//                 ))}
//                 <ImageUpload label="Add Gallery Photo(s)" value="" onUpload={(urls) => setFormData(p => ({ ...p, gallery_images: [...p.gallery_images, ...urls] }))} path="gallery" multiple={true} />
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
import { supabase } from '../../supabaseClient';
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
        allowed_guests: ["1"],
        theme_colors: ['#A68A64', '#FAFAF9', '#E7E5E4', '#292524'],
        dress_code_colors: []
    };

    const [formData, setFormData] = useState(initialFormState);
    const [addressQuery, setAddressQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);
    const [markerInstance, setMarkerInstance] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});
    const [tempThemeColor, setTempThemeColor] = useState("#4f46e5");
    const [tempThemeHex, setTempThemeHex] = useState("");
    const [tempDressColor, setTempDressColor] = useState("#e11d48");
    const [tempDressHex, setTempDressHex] = useState("");
    const [editingThemeIdx, setEditingThemeIdx] = useState(null);
    const [editingDressIdx, setEditingDressIdx] = useState(null);

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
                    allowed_guests: typeof data.allowed_guests === 'string' ? JSON.parse(data.allowed_guests) : data.allowed_guests || ["1"],
                    theme_colors: (() => {
                        const raw = data.theme_colors;
                        if (!raw) return ['#A68A64', '#FAFAF9', '#E7E5E4', '#292524'];
                        try {
                            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                            return Array.isArray(parsed) && parsed.length > 0
                                ? parsed.filter(c => typeof c === 'string' && !c.startsWith("DRESS_CODE_COLOR:"))
                                : ['#A68A64', '#FAFAF9', '#E7E5E4', '#292524'];
                        } catch (e) {
                            return ['#A68A64', '#FAFAF9', '#E7E5E4', '#292524'];
                        }
                    })(),
                    dress_code_colors: (() => {
                        const raw = data.dress_code_colors;
                        if (raw) {
                            try {
                                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                            } catch (e) { }
                        }
                        // Fallback: check theme_colors for DRESS_CODE_COLOR: prefix
                        const rawTheme = data.theme_colors;
                        if (!rawTheme) return [];
                        try {
                            const parsed = typeof rawTheme === 'string' ? JSON.parse(rawTheme) : rawTheme;
                            if (Array.isArray(parsed)) {
                                return parsed
                                    .filter(c => typeof c === 'string' && c.startsWith("DRESS_CODE_COLOR:"))
                                    .map(c => c.substring("DRESS_CODE_COLOR:".length));
                            }
                        } catch (e) { }
                        return [];
                    })()
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

    const ImageUpload = ({ label, value, onUpload, path = "misc", id, className = "", multiple = false }) => {
        const uploadId = id || `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const progress = uploadProgress[uploadId] || 0;

        const handleFileChange = async (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                if (multiple) {
                    setUploading(true);
                    const urls = await Promise.all(files.map(async (file) => {
                        const subId = `${uploadId}-${Math.random().toString(36).substr(2, 5)}`;
                        if (file.size > 5 * 1024 * 1024) return null;
                        return await uploadImage(file, path, subId);
                    }));
                    const validUrls = urls.filter(u => u);
                    if (validUrls.length > 0) onUpload(validUrls);
                    setUploading(false);
                } else {
                    const file = files[0];
                    if (file.size > 5 * 1024 * 1024) {
                        alert("File size should be less than 5MB");
                        return;
                    }
                    const url = await uploadImage(file, path, uploadId);
                    if (url) onUpload(url);
                }
            }
        };

        return (
            <div className={`form-group ${className}`}>
                <label className="form-label">{label}</label>
                <div className={`image-upload-wrapper ${progress > 0 || uploading ? 'uploading' : ''}`} onClick={() => document.getElementById(uploadId).click()}>
                    <input type="file" id={uploadId} onChange={handleFileChange} accept="image/*" multiple={multiple} style={{ display: 'none' }} />
                    {value && !multiple ? (
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
                                {progress > 0 || uploading ? (
                                    <div className="upload-progress">
                                        <div className="progress-circle">
                                            <span>{progress || '...'}%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <i className="fas fa-cloud-upload-alt"></i>
                                )}
                            </div>
                            <div className="upload-text">
                                <span className="upload-title">{multiple ? "Upload Photos" : "Upload Photo"}</span>
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

            // Clean theme_colors of any prefix tags if saving normally
            payload.theme_colors = (payload.theme_colors || []).filter(c => typeof c === 'string' && !c.startsWith("DRESS_CODE_COLOR:"));

            let error;
            if (isEditMode) {
                const { error: updateError } = await supabase.from('weddings').update(payload).eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('weddings').insert([payload]);
                error = insertError;
            }

            if (error) {
                // If dress_code_colors column is missing in the database schema cache
                if (error.message && error.message.includes("dress_code_colors")) {
                    console.warn("dress_code_colors column is missing from weddings table, retrying save with fallback storage inside theme_colors.");
                    const retryPayload = { ...payload };
                    delete retryPayload.dress_code_colors;

                    // Fallback storage: Pack dress_code_colors inside theme_colors array
                    const dressCodePrefixes = (payload.dress_code_colors || []).map(c => `DRESS_CODE_COLOR:${c}`);
                    retryPayload.theme_colors = [
                        ...(payload.theme_colors || []).filter(c => typeof c === 'string' && !c.startsWith("DRESS_CODE_COLOR:")),
                        ...dressCodePrefixes
                    ];

                    let retryError;
                    if (isEditMode) {
                        const { error: updateError } = await supabase.from('weddings').update(retryPayload).eq('id', id);
                        retryError = updateError;
                    } else {
                        const { error: insertError } = await supabase.from('weddings').insert([retryPayload]);
                        retryError = insertError;
                    }

                    if (retryError) throw retryError;

                    alert((isEditMode ? 'Wedding Updated Successfully!' : 'Wedding Website Created Successfully!') +
                        '\n\n⚠️ NOTE: The "dress_code_colors" column is missing from your Supabase database. ' +
                        'We saved your dress code colors inside the theme colors as a fallback. To fully upgrade your schema, please run the SQL inside the "SUPABASE_DRESS_CODE_COLORS.sql" file.');
                    navigate(isEditMode ? '/admin' : `/w/${slug}`);
                    return;
                }
                throw error;
            }

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
                        {/* Wedding Website Theme Colors */}
                        <div className="form-group theme-colors-section" style={{ gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="form-label" style={{ fontWeight: '700', fontSize: '1rem', color: '#111827', margin: 0 }}>
                                    <i className="fas fa-palette" style={{ color: '#4f46e5', marginRight: '6px' }}></i> Wedding Website Theme Colors
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window.confirm("Are you sure you want to reset all theme colors to defaults?")) {
                                            setFormData(prev => ({
                                                ...prev,
                                                theme_colors: ['#A68A64', '#FAFAF9', '#E7E5E4', '#292524']
                                            }));
                                            setEditingThemeIdx(null);
                                        }
                                    }}
                                    style={{
                                        background: '#f3f4f6',
                                        color: '#374151',
                                        border: '1px solid #d1d5db',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                                    title="Reset theme colors to initial system defaults"
                                >
                                    <i className="fas fa-undo"></i> Reset to Defaults
                                </button>
                            </div>
                            <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '4px 0 12px 0' }}>
                                Customize the styling of your public invitation website. The colors you add will control the site design in order:
                                <strong style={{ color: '#374151' }}> 1st: Accent (Buttons/Icons), 2nd: Page Background, 3rd: Card/Container Background, 4th: Text Color</strong>.
                            </p>
                            <div className="color-swatches-wrapper" style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                                {formData.theme_colors && formData.theme_colors.map((color, idx) => {
                                    const labels = ["Accent", "Background", "Card Bg", "Text"];
                                    const label = labels[idx] || `Color ${idx + 1}`;
                                    const isEditingThis = editingThemeIdx === idx;
                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                position: 'relative',
                                                display: 'inline-block'
                                            }}
                                        >
                                            <div
                                                className="color-swatch-circle"
                                                style={{
                                                    width: '42px',
                                                    height: '42px',
                                                    borderRadius: '50%',
                                                    backgroundColor: color,
                                                    border: isEditingThis
                                                        ? '3px solid #4f46e5'
                                                        : (color.toLowerCase() === '#ffffff' || color.toLowerCase() === '#fff' ? '2px solid #ccc' : '1px solid rgba(0,0,0,0.15)'),
                                                    position: 'relative',
                                                    boxShadow: isEditingThis ? '0 0 0 3px rgba(79, 70, 229, 0.4)' : '0 4px 6px rgba(0,0,0,0.1)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s',
                                                    transform: isEditingThis ? 'scale(1.05)' : 'none'
                                                }}
                                                title={`Click to edit ${label}: ${color}`}
                                                onClick={() => {
                                                    setEditingThemeIdx(idx);
                                                    setTempThemeColor(color);
                                                    setTempThemeHex(color.replace('#', '').toUpperCase());
                                                }}
                                            >
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    color: color.toLowerCase() === '#ffffff' || color.toLowerCase() === '#fff' || color.toLowerCase() === '#fafaf9' ? '#374151' : '#ffffff',
                                                    fontWeight: '800',
                                                    textShadow: color.toLowerCase() === '#ffffff' || color.toLowerCase() === '#fff' || color.toLowerCase() === '#fafaf9' ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
                                                    pointerEvents: 'none'
                                                }}>
                                                    {label}
                                                </span>
                                            </div>

                                            {/* Delete Badge */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newColors = formData.theme_colors.filter((_, i) => i !== idx);
                                                    setFormData(prev => ({ ...prev, theme_colors: newColors }));
                                                    if (editingThemeIdx === idx) {
                                                        setEditingThemeIdx(null);
                                                        setTempThemeHex("");
                                                    }
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-4px',
                                                    right: '-4px',
                                                    width: '16px',
                                                    height: '16px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#ef4444',
                                                    border: '1px solid white',
                                                    color: 'white',
                                                    fontSize: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                                    padding: 0,
                                                    zIndex: 10
                                                }}
                                                title={`Delete ${label}`}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    );
                                })}

                                {/* Add Theme Color Control */}
                                <div className="add-color-control" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '0.5rem', padding: '4px 8px', background: '#fafafa' }}>
                                    <input
                                        type="color"
                                        value={tempThemeColor}
                                        onChange={(e) => {
                                            setTempThemeColor(e.target.value);
                                            setTempThemeHex(e.target.value.replace('#', '').toUpperCase());
                                        }}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            border: 'none',
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            padding: 0,
                                            background: 'transparent'
                                        }}
                                    />
                                    <span style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: '500' }}>#</span>
                                    <input
                                        type="text"
                                        placeholder="4F46E5"
                                        value={tempThemeHex}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setTempThemeHex(val);
                                            if (/^[0-9A-F]{6}$/i.test(val)) {
                                                setTempThemeColor(`#${val}`);
                                            } else if (/^#[0-9A-F]{6}$/i.test(val)) {
                                                setTempThemeColor(val);
                                            }
                                        }}
                                        style={{
                                            width: '70px',
                                            border: 'none',
                                            background: 'transparent',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            outline: 'none',
                                            color: '#111827'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            let finalColor = tempThemeColor;
                                            if (tempThemeHex) {
                                                let cleanHex = tempThemeHex.trim();
                                                if (!cleanHex.startsWith('#')) {
                                                    cleanHex = '#' + cleanHex;
                                                }
                                                if (/^#[0-9A-F]{6}$/i.test(cleanHex) || cleanHex.toLowerCase() === '#fff' || cleanHex.toLowerCase() === '#000') {
                                                    finalColor = cleanHex;
                                                } else {
                                                    alert("Please enter a valid hex color code (e.g. FFFFFF or #FFFFFF)");
                                                    return;
                                                }
                                            }

                                            if (editingThemeIdx !== null) {
                                                const updatedColors = [...formData.theme_colors];
                                                updatedColors[editingThemeIdx] = finalColor;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    theme_colors: updatedColors
                                                }));
                                                setEditingThemeIdx(null);
                                            } else {
                                                if (finalColor && (!formData.theme_colors || !formData.theme_colors.includes(finalColor))) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        theme_colors: [...(prev.theme_colors || []), finalColor]
                                                    }));
                                                }
                                            }
                                            setTempThemeHex("");
                                        }}
                                        style={{
                                            background: editingThemeIdx !== null ? '#10b981' : '#111827',
                                            color: '#ffffff',
                                            border: 'none',
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                        title={editingThemeIdx !== null ? "Save Changes" : "Add Color"}
                                    >
                                        <i className={editingThemeIdx !== null ? "fas fa-check" : "fas fa-plus"}></i>
                                    </button>
                                    {editingThemeIdx !== null && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingThemeIdx(null);
                                                setTempThemeHex("");
                                            }}
                                            style={{
                                                background: '#6b7280',
                                                color: '#ffffff',
                                                border: 'none',
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                            title="Cancel Edit"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Guest Dress Code Colors */}
                        <div className="form-group dress-code-colors-section" style={{ gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                            <label className="form-label" style={{ fontWeight: '700', fontSize: '1rem', color: '#111827' }}>
                                <i className="fas fa-tshirt" style={{ color: '#e11d48', marginRight: '6px' }}></i> Guest Dress Code Colors
                            </label>
                            <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '4px 0 12px 0' }}>
                                Specify the guest dress code color palette. These colors will be shown as beautiful color circles under the Dress Code details of the invitation.
                            </p>
                            <div className="color-swatches-wrapper" style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                                {formData.dress_code_colors && formData.dress_code_colors.map((color, idx) => {
                                    const isEditingThis = editingDressIdx === idx;
                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                position: 'relative',
                                                display: 'inline-block'
                                            }}
                                        >
                                            <div
                                                className="color-swatch-circle"
                                                style={{
                                                    width: '38px',
                                                    height: '38px',
                                                    borderRadius: '6px',
                                                    backgroundColor: color,
                                                    border: isEditingThis
                                                        ? '3px solid #4f46e5'
                                                        : (color.toLowerCase() === '#ffffff' || color.toLowerCase() === '#fff' ? '2px solid #ccc' : '1px solid rgba(0,0,0,0.15)'),
                                                    position: 'relative',
                                                    boxShadow: isEditingThis ? '0 0 0 3px rgba(79, 70, 229, 0.4)' : '0 4px 6px rgba(0,0,0,0.1)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s',
                                                    transform: isEditingThis ? 'scale(1.05)' : 'none'
                                                }}
                                                title={`Click to edit: ${color}`}
                                                onClick={() => {
                                                    setEditingDressIdx(idx);
                                                    setTempDressColor(color);
                                                    setTempDressHex(color.replace('#', '').toUpperCase());
                                                }}
                                            >
                                                <div className="remove-color-overlay" style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    borderRadius: '6px',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                                    display: 'none',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '12px'
                                                }}>
                                                    <i className="fas fa-edit"></i>
                                                </div>
                                            </div>

                                            {/* Delete Badge */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newColors = formData.dress_code_colors.filter((_, i) => i !== idx);
                                                    setFormData(prev => ({ ...prev, dress_code_colors: newColors }));
                                                    if (editingDressIdx === idx) {
                                                        setEditingDressIdx(null);
                                                        setTempDressHex("");
                                                    }
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-4px',
                                                    right: '-4px',
                                                    width: '16px',
                                                    height: '16px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#ef4444',
                                                    border: '1px solid white',
                                                    color: 'white',
                                                    fontSize: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                                    padding: 0,
                                                    zIndex: 10
                                                }}
                                                title="Delete Color"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    );
                                })}

                                {/* Add Dress Code Color Control */}
                                <div className="add-color-control" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '0.5rem', padding: '4px 8px', background: '#fafafa' }}>
                                    <input
                                        type="color"
                                        value={tempDressColor}
                                        onChange={(e) => {
                                            setTempDressColor(e.target.value);
                                            setTempDressHex(e.target.value.replace('#', '').toUpperCase());
                                        }}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            border: 'none',
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            padding: 0,
                                            background: 'transparent'
                                        }}
                                    />
                                    <span style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: '500' }}>#</span>
                                    <input
                                        type="text"
                                        placeholder="FFFFFF"
                                        value={tempDressHex}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setTempDressHex(val);
                                            if (/^[0-9A-F]{6}$/i.test(val)) {
                                                setTempDressColor(`#${val}`);
                                            } else if (/^#[0-9A-F]{6}$/i.test(val)) {
                                                setTempDressColor(val);
                                            }
                                        }}
                                        style={{
                                            width: '70px',
                                            border: 'none',
                                            background: 'transparent',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            outline: 'none',
                                            color: '#111827'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            let finalColor = tempDressColor;
                                            if (tempDressHex) {
                                                let cleanHex = tempDressHex.trim();
                                                if (!cleanHex.startsWith('#')) {
                                                    cleanHex = '#' + cleanHex;
                                                }
                                                if (/^#[0-9A-F]{6}$/i.test(cleanHex) || cleanHex.toLowerCase() === '#fff' || cleanHex.toLowerCase() === '#000') {
                                                    finalColor = cleanHex;
                                                } else {
                                                    alert("Please enter a valid hex color code (e.g. FFFFFF or #FFFFFF)");
                                                    return;
                                                }
                                            }

                                            if (editingDressIdx !== null) {
                                                const updatedColors = [...formData.dress_code_colors];
                                                updatedColors[editingDressIdx] = finalColor;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    dress_code_colors: updatedColors
                                                }));
                                                setEditingDressIdx(null);
                                            } else {
                                                if (finalColor && (!formData.dress_code_colors || !formData.dress_code_colors.includes(finalColor))) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        dress_code_colors: [...(prev.dress_code_colors || []), finalColor]
                                                    }));
                                                }
                                            }
                                            setTempDressHex("");
                                        }}
                                        style={{
                                            background: editingDressIdx !== null ? '#10b981' : '#111827',
                                            color: '#ffffff',
                                            border: 'none',
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                        title={editingDressIdx !== null ? "Save Changes" : "Add Color"}
                                    >
                                        <i className={editingDressIdx !== null ? "fas fa-check" : "fas fa-plus"}></i>
                                    </button>
                                    {editingDressIdx !== null && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingDressIdx(null);
                                                setTempDressHex("");
                                            }}
                                            style={{
                                                background: '#6b7280',
                                                color: '#ffffff',
                                                border: 'none',
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                            title="Cancel Edit"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
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
                                <option value="2">Allow Plus One (2 (Couple))</option>
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
                                    placeholder="Search venue or street name (e.g. Gypso Events)..."
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
                                <span><strong>Can't find the venue?</strong> Search for a nearby street or area (e.g. 'Lusaka') and then <strong>drag the red pin</strong> on the map above to the exact spot.</span>
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
        <div className="rr-page">
            <div className="phone-shell">
                <header className="bd-admin-header" style={{ background: '#12121c', color: '#fff', padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: '#a3e635', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <i className="fas fa-arrow-left"></i> Dashboard
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{isEditMode ? 'Edit Wedding' : 'New Wedding'}</span>
                        {formData.slug ? (
                            <a href={`/w/${formData.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#c5a059', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                                Preview
                            </a>
                        ) : (
                            <div style={{ width: 45 }}></div>
                        )}
                    </div>
                </header>

                <div className="scroll-area" style={{ background: '#f4f5f7' }}>
                    <div className="content-pad" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Page Title Card */}
                        <div className="page-title-card" style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#12121c', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <i className={isEditMode ? "fas fa-edit" : "fas fa-plus-circle"} style={{ color: '#c5a059' }}></i>
                                {isEditMode ? 'Edit Wedding Details' : 'Create Wedding Website'}
                            </h2>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', margin: 0 }}>
                                {isEditMode ? 'Update wedding details and info.' : 'Build your dream wedding website step by step.'}
                            </p>
                        </div>

                        {/* Stepper Indicator */}
                        <div className="progress-section" style={{ background: '#fff', borderRadius: '16px', padding: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div className="form-steps" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                                {steps.map((step, idx) => (
                                    <div key={idx} className={`step ${currentStep === idx ? 'active' : ''} ${currentStep > idx ? 'completed' : ''}`} onClick={() => setCurrentStep(idx)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, cursor: 'pointer' }}>
                                        <div className="step-number" style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', transition: 'all 0.2s' }}>
                                            {currentStep > idx ? <i className="fas fa-check"></i> : idx + 1}
                                        </div>
                                        <span className="step-label" style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: '4px', textAlign: 'center', display: 'block' }}>{step.label.split(' ')[0]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Form Container */}
                        <div className="form-container-card" style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '3rem' }}>
                                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#c5a059' }}></i>
                                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>Loading wedding details...</p>
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

                        {/* Actions */}
                        <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                            <button className="btn btn-secondary" disabled={currentStep === 0} onClick={() => { setCurrentStep(p => p - 1); window.scrollTo(0, 0); }} type="button" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                                <i className="fas fa-arrow-left"></i> Previous
                            </button>
                            {currentStep < steps.length - 1 ? (
                                <button className="btn btn-primary" onClick={() => { setCurrentStep(p => p + 1); window.scrollTo(0, 0); }} type="button" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, background: '#c5a059', color: '#fff', border: 'none', cursor: 'pointer' }}>
                                    Next <i className="fas fa-arrow-right"></i>
                                </button>
                            ) : (
                                <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} type="button" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, background: '#c5a059', color: '#fff', border: 'none', cursor: 'pointer' }}>
                                    {loading ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-rocket"></i> {isEditMode ? "Update" : "Publish"}</>}
                                </button>
                            )}
                        </div>
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

                .step-number {
                    background: #f3f4f6;
                    border: 1.5px solid #e5e7eb;
                    color: #9ca3af;
                }

                .step.active .step-number {
                    background: #c5a059 !important;
                    color: #ffffff !important;
                    border-color: #c5a059 !important;
                }

                .step.active .step-label {
                    color: #c5a059 !important;
                }

                .step.completed .step-number {
                    background: #10b981 !important;
                    color: #ffffff !important;
                    border-color: #10b981 !important;
                }

                /* Form Components */
                .form-group {
                    margin-bottom: 1rem;
                }

                .form-label {
                    display: block;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #374151;
                    margin-bottom: 0.35rem;
                }

                .form-input, .form-textarea, .form-select {
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

                .form-input:focus, .form-textarea:focus, .form-select:focus {
                    border-color: #c5a059 !important;
                    background: #ffffff !important;
                }

                .form-textarea {
                    min-height: 100px;
                    resize: vertical;
                }

                .grid-2, .couple-grid, .ceremony-reception-grid, .party-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 0.75rem;
                }

                /* Cards */
                .person-card, .event-card, .ceremony-card, .reception-card, .story-card, .highlight-card, .bridesmaids-card, .groomsmen-card, .gift-card {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 14px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                }

                .person-header, .event-card-header, .party-card-header, .gift-card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .person-icon, .event-card-header i, .party-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    color: #fff;
                    background: #c5a059;
                }

                .person-title, .event-card-header h3, .party-card-header h4, .gift-number {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #111827;
                    margin: 0;
                }

                /* Image Upload */
                .image-upload-wrapper {
                    border: 2px dashed #d1d5db;
                    border-radius: 12px;
                    padding: 1.5rem;
                    text-align: center;
                    cursor: pointer;
                    background: #f9fafb;
                    transition: all 0.2s;
                    position: relative;
                }

                .image-upload-wrapper:hover {
                    border-color: #c5a059;
                    background: #fcfbfa;
                }

                .upload-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    color: #6b7280;
                }

                .upload-placeholder i {
                    font-size: 1.5rem;
                    color: #c5a059;
                }

                .image-preview {
                    position: relative;
                    border-radius: 8px;
                    overflow: hidden;
                    width: 100%;
                }

                .image-preview img {
                    width: 100%;
                    height: 140px;
                    object-fit: cover;
                }

                .remove-image, .btn-remove-gallery {
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
                    font-size: 0.8rem;
                    z-index: 10;
                }

                .gallery-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 0.5rem;
                }

                .gallery-item {
                    position: relative;
                    border-radius: 8px;
                    overflow: hidden;
                    aspect-ratio: 1;
                }

                .gallery-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                /* Buttons */
                .btn-add-member, .btn-add-gift {
                    width: 100%;
                    padding: 0.65rem;
                    border: 2px dashed #d1d5db;
                    border-radius: 10px;
                    background: #fff;
                    color: #4b5563;
                    font-weight: 600;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.35rem;
                }

                .btn-add-member:hover, .btn-add-gift:hover {
                    border-color: #c5a059;
                    color: #c5a059;
                }

                .btn-remove-member, .btn-remove-gift {
                    background: none;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    font-size: 0.85rem;
                }

                .party-member {
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 0.85rem;
                    margin-bottom: 0.75rem;
                    background: #fff;
                }

                .member-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }

                .member-number {
                    font-size: 0.75rem;
                    color: #9ca3af;
                    fontWeight: 700;
                }

                /* Color swatches */
                .color-swatch-circle {
                    cursor: pointer;
                    position: relative;
                }

                @media (max-width: 480px) {
                    .rr-page { padding: 0; align-items: stretch; }
                    .phone-shell { border-radius: 0; box-shadow: none; max-width: 100%; width: 100%; height: 100vh; max-height: 100vh; }
                }
            `}</style>
        </div>
    );
};

export default AddWedding;