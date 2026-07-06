import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import DefaultElegance from '../../templates/wedding/DefaultElegance';
import TropicalElegance from '../../templates/wedding/TropicalElegance';
import GoldenRomance from '../../templates/wedding/GoldenRomance';
import BotanicalOlive from '../../templates/wedding/BotanicalOlive';
import TerracottaEarth from '../../templates/wedding/TerracottaEarth';
import InvitationOverlay from '../../components/InvitationOverlay';

// Helper to format date safely
const formatDate = (dateString) => {
  if (!dateString) return "";
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, options);
};

// Helper to format time safely
const formatTime = (timeString) => {
  if (!timeString) return "";
  if (timeString.includes('M')) return timeString;

  const parts = timeString.split(':');
  const hours = parts[0];
  const minutes = parts[1];

  if (!hours || !minutes) return timeString;

  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedH = h % 12 || 12;
  return `${formattedH}:${minutes} ${ampm}`;
};

const WeddingTemplate = () => {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    guests: '1',
    attendance: '',
    message: ''
  });
  const [showAdmissionCard, setShowAdmissionCard] = useState(false);
  const [submittedRSVP, setSubmittedRSVP] = useState(null);
  const [cdnLoaded, setCdnLoaded] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // Initial Mock Data (Fallback)
  const initialWeddingData = {
    couple: {
      bride: { name: "", image: "", description: "" },
      groom: { name: "", image: "", description: "" }
    },
    date: "",
    rawDate: "",
    location: "",
    venue: { name: "", address: "", description: "" },
    story: { part1: "", highlight: "", part2: "" },
    sliderImages: [],
    bridesmaids: [],
    groomsmen: [],
    ceremony: { date: "", time: "", venue: "" },
    reception: { date: "", time: "", venue: "", address: "" },
    dressCode: "",
    dressCodeDescription: "",
    theme_colors: [],
    dress_code_colors: [],
    gifts: [],
    galleryImages: [],
    mapLocation: "",
    rsvpDeadline: "",
    allowedGuests: ["1"],
    otherEvents: [],
    tagline: ""
  };

  const [weddingData, setWeddingData] = useState(initialWeddingData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRSVPSubmit = async (e, childFormData) => {
    if (e) e.preventDefault();
    if (!weddingData.id) {
      alert("Wedding ID missing. Please refresh.");
      return;
    }
    const dataToSubmit = childFormData || formData;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('rsvps').insert([{
        wedding_id: weddingData.id,
        name: dataToSubmit.name,
        email: dataToSubmit.email,
        phone: dataToSubmit.phone,
        attending: dataToSubmit.attendance,
        guests_count: parseInt(dataToSubmit.guests) || 1,
        status: 'pending'
      }]).select();

      if (error) throw error;

      if (data && data.length > 0) {
        setSubmittedRSVP(data[0]);
        setShowAdmissionCard(true);
      }

      setFormData({ name: '', email: '', phone: '', guests: '1', attendance: '', message: '' });
    } catch (err) {
      console.error("Full RSVP Error:", err);
      alert("Error sending RSVP: " + (err.message || err.error_description || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';

    if (isPreview) {
      const loadPreviewData = () => {
        try {
          const raw = localStorage.getItem('savemeaseat_preview_data');
          if (raw) {
            const dbData = JSON.parse(raw);
            let finalName = dbData.venue_name || dbData.reception_venue || dbData.ceremony_venue || "";
            let finalAddress = dbData.venue_address || dbData.reception_address || "";
            if (!finalName && dbData.location) {
              if (dbData.location.includes(',')) {
                const parts = dbData.location.split(',');
                finalName = parts[0].trim();
                if (!finalAddress) finalAddress = dbData.location.trim();
              } else {
                finalName = dbData.location;
              }
            }

            setWeddingData({
              id: dbData.id,
              couple: {
                bride: { name: dbData.bride_name, image: dbData.bride_image, description: dbData.bride_description },
                groom: { name: dbData.groom_name, image: dbData.groom_image, description: dbData.groom_description }
              },
              date: formatDate(dbData.date),
              rawDate: dbData.date,
              location: dbData.location,
              venue: {
                name: finalName || "",
                address: finalAddress || dbData.location || "",
                description: dbData.venue_description || ""
              },
              story: {
                part1: dbData.story_part1,
                highlight: dbData.story_highlight,
                part2: dbData.story_part2
              },
              sliderImages: dbData.slider_images || [],
              bridesmaids: dbData.bridesmaids || [],
              groomsmen: dbData.groomsmen || [],
              ceremony: {
                date: formatDate(dbData.ceremony_date),
                rawDate: dbData.ceremony_date,
                time: formatTime(dbData.ceremony_time),
                venue: dbData.ceremony_venue
              },
              reception: {
                date: formatDate(dbData.reception_date),
                rawDate: dbData.reception_date,
                time: formatTime(dbData.reception_time),
                venue: dbData.reception_venue,
                address: dbData.reception_address
              },
              dressCode: dbData.dress_code,
              dressCodeDescription: dbData.dress_code_desc,
              theme_colors: Array.isArray(dbData.theme_colors) ? dbData.theme_colors : [],
              dress_code_colors: Array.isArray(dbData.dress_code_colors) ? dbData.dress_code_colors : [],
              gifts: dbData.gifts || [],
              galleryImages: dbData.gallery_images || [],
              mapLocation: dbData.map_location,
              rsvpDeadline: dbData.rsvp_deadline,
              coverImage: dbData.cover_image,
              tagline: dbData.tagline || "We are getting married",
              template_id: dbData.template_id || 1,
              allowedGuests: (() => {
                const raw = dbData.allowed_guests;
                if (!raw) return ["1"];
                try {
                  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                  if (parsed) return [parsed.toString()];
                } catch (e) {
                  if (typeof raw === 'string' && raw.includes(',')) {
                    return raw.split(',').map(s => s.trim()).filter(s => s);
                  }
                  if (raw) return [raw.toString()];
                }
                return ["1"];
              })(),
              otherEvents: (() => {
                const raw = dbData.other_events;
                if (!raw) return [];
                try {
                  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                  return Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                  return [];
                }
              })()
            });
            setDataFetched(true);
          }
        } catch (err) {
          console.error("Error loading preview data:", err);
        } finally {
          setLoading(false);
        }
      };

      loadPreviewData();

      const handleMessage = (event) => {
        if (event.data && event.data.type === 'PREVIEW_UPDATE') {
          const dbData = event.data.data;
          let finalName = dbData.venue_name || dbData.reception_venue || dbData.ceremony_venue || "";
          let finalAddress = dbData.venue_address || dbData.reception_address || "";
          if (!finalName && dbData.location) {
            if (dbData.location.includes(',')) {
              const parts = dbData.location.split(',');
              finalName = parts[0].trim();
              if (!finalAddress) finalAddress = dbData.location.trim();
            } else {
              finalName = dbData.location;
            }
          }

          setWeddingData({
            id: dbData.id,
            couple: {
              bride: { name: dbData.bride_name, image: dbData.bride_image, description: dbData.bride_description },
              groom: { name: dbData.groom_name, image: dbData.groom_image, description: dbData.groom_description }
            },
            date: formatDate(dbData.date),
            rawDate: dbData.date,
            location: dbData.location,
            venue: {
              name: finalName || "",
              address: finalAddress || dbData.location || "",
              description: dbData.venue_description || ""
            },
            story: {
              part1: dbData.story_part1,
              highlight: dbData.story_highlight,
              part2: dbData.story_part2
            },
            sliderImages: dbData.slider_images || [],
            bridesmaids: dbData.bridesmaids || [],
            groomsmen: dbData.groomsmen || [],
            ceremony: {
              date: formatDate(dbData.ceremony_date),
              rawDate: dbData.ceremony_date,
              time: formatTime(dbData.ceremony_time),
              venue: dbData.ceremony_venue
            },
            reception: {
              date: formatDate(dbData.reception_date),
              rawDate: dbData.reception_date,
              time: formatTime(dbData.reception_time),
              venue: dbData.reception_venue,
              address: dbData.reception_address
            },
            dressCode: dbData.dress_code,
            dressCodeDescription: dbData.dress_code_desc,
            theme_colors: Array.isArray(dbData.theme_colors) ? dbData.theme_colors : [],
            dress_code_colors: Array.isArray(dbData.dress_code_colors) ? dbData.dress_code_colors : [],
            gifts: dbData.gifts || [],
            galleryImages: dbData.gallery_images || [],
            mapLocation: dbData.map_location,
            rsvpDeadline: dbData.rsvp_deadline,
            coverImage: dbData.cover_image,
            tagline: dbData.tagline || "We are getting married",
            template_id: dbData.template_id || 1,
            allowedGuests: (() => {
              const raw = dbData.allowed_guests;
              if (!raw) return ["1"];
              try {
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                if (parsed) return [parsed.toString()];
              } catch (e) {
                if (typeof raw === 'string' && raw.includes(',')) {
                  return raw.split(',').map(s => s.trim()).filter(s => s);
                }
                if (raw) return [raw.toString()];
              }
              return ["1"];
            })(),
            otherEvents: (() => {
              const raw = dbData.other_events;
              if (!raw) return [];
              try {
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                return Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                return [];
              }
            })()
          });
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    } else {
      const fetchWeddingData = async () => {
        try {
          const { data, error } = await supabase
            .from('weddings')
            .select('*')
            .eq('slug', slug);

          if (error) throw error;

          if (data && data.length > 0) {
            const dbData = data[0];
            
            let finalName = dbData.venue_name || dbData.reception_venue || dbData.ceremony_venue || "";
            let finalAddress = dbData.venue_address || dbData.reception_address || "";
            if (!finalName && dbData.location) {
              if (dbData.location.includes(',')) {
                const parts = dbData.location.split(',');
                finalName = parts[0].trim();
                if (!finalAddress) finalAddress = dbData.location.trim();
              } else {
                finalName = dbData.location;
              }
            }

            setWeddingData({
              id: dbData.id,
              couple: {
                bride: { name: dbData.bride_name, image: dbData.bride_image, description: dbData.bride_description },
                groom: { name: dbData.groom_name, image: dbData.groom_image, description: dbData.groom_description }
              },
              date: formatDate(dbData.date),
              rawDate: dbData.date,
              location: dbData.location,
              venue: {
                name: finalName || "",
                address: finalAddress || dbData.location || "",
                description: dbData.venue_description || ""
              },
              story: {
                part1: dbData.story_part1,
                highlight: dbData.story_highlight,
                part2: dbData.story_part2
              },
              sliderImages: dbData.slider_images || [],
              bridesmaids: dbData.bridesmaids || [],
              groomsmen: dbData.groomsmen || [],
              ceremony: {
                date: formatDate(dbData.ceremony_date),
                rawDate: dbData.ceremony_date,
                time: formatTime(dbData.ceremony_time),
                venue: dbData.ceremony_venue
              },
              reception: {
                date: formatDate(dbData.reception_date),
                rawDate: dbData.reception_date,
                time: formatTime(dbData.reception_time),
                venue: dbData.reception_venue,
                address: dbData.reception_address
              },
              dressCode: dbData.dress_code,
              dressCodeDescription: dbData.dress_code_desc,
              theme_colors: Array.isArray(dbData.theme_colors) ? dbData.theme_colors : [],
              dress_code_colors: Array.isArray(dbData.dress_code_colors) ? dbData.dress_code_colors : [],
              gifts: dbData.gifts || [],
              galleryImages: dbData.gallery_images || [],
              mapLocation: dbData.map_location,
              rsvpDeadline: dbData.rsvp_deadline,
              coverImage: dbData.cover_image,
              tagline: dbData.tagline || "We are getting married",
              template_id: dbData.template_id || 1,
              allowedGuests: (() => {
                const raw = dbData.allowed_guests;
                if (!raw) return ["1"];
                try {
                  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                  if (parsed) return [parsed.toString()];
                } catch (e) {
                  if (typeof raw === 'string' && raw.includes(',')) {
                    return raw.split(',').map(s => s.trim()).filter(s => s);
                  }
                  if (raw) return [raw.toString()];
                }
                return ["1"];
              })(),
              otherEvents: (() => {
                const raw = dbData.other_events;
                if (!raw) return [];
                try {
                  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                  return Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                  return [];
                }
              })()
            });
            setDataFetched(true);
          }
        } catch (err) {
          console.error("Error fetching wedding data:", err);
        } finally {
          setLoading(false);
        }
      };

      if (slug) {
        fetchWeddingData();
      }
    }
    window.scrollTo(0, 0);
  }, [slug]);

  // Load Tailwind CDN
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

  // Sync default guests count
  useEffect(() => {
    if (dataFetched && weddingData.allowedGuests.length > 0) {
      setFormData(prev => ({
        ...prev,
        guests: weddingData.allowedGuests[0]
      }));
    }
  }, [dataFetched, weddingData.allowedGuests]);

  if (loading) {
    return (
      <div className="page-loader" id="pageLoader" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#fff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999
      }}>
        <div className="spinner-minimal" style={{
          width: '40px',
          height: '40px',
          border: '2px solid rgba(0,0,0,0.1)',
          borderTopColor: '#000',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const queryTemplateId = new URLSearchParams(window.location.search).get('template');
  const templateId = queryTemplateId || weddingData.template_id?.toString() || '1';

  let templateContent = null;

  if (templateId === '2' || templateId === 'tropical-elegance') {
    templateContent = <TropicalElegance weddingData={weddingData} />;
  } else if (templateId === '3' || templateId === 'golden-romance') {
    templateContent = <GoldenRomance weddingData={weddingData} />;
  } else if (templateId === '7' || templateId === 'botanical-olive') {
    templateContent = <BotanicalOlive weddingData={weddingData} />;
  } else if (templateId === '8' || templateId === 'terracotta-earth') {
    templateContent = <TerracottaEarth weddingData={weddingData} />;
  } else {
    templateContent = (
      <DefaultElegance 
        weddingData={weddingData} 
        handleRSVPSubmitFromParent={handleRSVPSubmit}
        parentIsSubmitting={isSubmitting}
        parentShowAdmissionCard={showAdmissionCard}
        parentSubmittedRSVP={submittedRSVP}
      />
    );
  }

  return (
    <>
      {showOverlay && (
        <InvitationOverlay 
          weddingData={weddingData} 
          onEnter={() => setShowOverlay(false)} 
        />
      )}
      {templateContent}
    </>
  );
};

export default WeddingTemplate;