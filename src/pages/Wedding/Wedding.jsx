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

// Helper to parse JSON arrays safely
const parseArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

const WeddingTemplate = () => {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    partner_name: '',
    phone: '',
    partner_phone: '',
    email: '',
    partner_email: '',
    guests: '1',
    attendance: '',
    message: ''
  });
  const [showAdmissionCard, setShowAdmissionCard] = useState(false);
  const [submittedRSVP, setSubmittedRSVP] = useState(null);
  const [cdnLoaded, setCdnLoaded] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isOverlayClosing, setIsOverlayClosing] = useState(false);
  const [notApproved, setNotApproved] = useState(false);

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
    music_url: "",
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
      const isCouple = dataToSubmit.guests === '2' || dataToSubmit.guests?.includes('2') || !!dataToSubmit.partner_name;
      const guestsCount = parseInt(dataToSubmit.guests) || (isCouple ? 2 : 1);

      // ── Compute next seat number ──────────────────────────────
      let nextSeat = 1;
      try {
        const { data: seatData } = await supabase
          .from('rsvps')
          .select('seat_number, seat_number_end')
          .eq('wedding_id', weddingData.id)
          .not('seat_number', 'is', null)
          .order('seat_number_end', { ascending: false })
          .limit(1);

        if (seatData && seatData.length > 0) {
          const maxEnd = seatData[0].seat_number_end ?? seatData[0].seat_number ?? 0;
          nextSeat = maxEnd + 1;
        }
      } catch (_) {
        // seat_number column may not exist yet — will assign null gracefully
        nextSeat = null;
      }

      const seatNumber = nextSeat;
      const seatNumberEnd = nextSeat !== null ? (nextSeat + guestsCount - 1) : null;
      // ─────────────────────────────────────────────────────────

      const basePayload = {
        wedding_id: weddingData.id,
        name: dataToSubmit.name,
        email: dataToSubmit.email,
        phone: dataToSubmit.phone,
        attending: dataToSubmit.attendance,
        guests_count: guestsCount,
        status: 'pending',
        ...(seatNumber !== null && { seat_number: seatNumber, seat_number_end: seatNumberEnd })
      };

      let insertPayload = {
        ...basePayload,
        partner_name: isCouple ? (dataToSubmit.partner_name || null) : null,
        partner_phone: isCouple ? (dataToSubmit.partner_phone || null) : null,
        partner_email: isCouple ? (dataToSubmit.partner_email || null) : null
      };

      let { data, error } = await supabase.from('rsvps').insert([insertPayload]).select();

      // Graceful fallback if database column does not yet exist
      if (error && (error.message?.includes('partner_') || error.code === 'PGRST204')) {
        const fallbackPayload = {
          ...basePayload,
          name: isCouple && dataToSubmit.partner_name ? `${dataToSubmit.name} & ${dataToSubmit.partner_name}` : dataToSubmit.name
        };
        const fallbackRes = await supabase.from('rsvps').insert([fallbackPayload]).select();
        error = fallbackRes.error;
        data = fallbackRes.data;
      }

      if (error) throw error;

      const record = (data && data.length > 0) ? data[0] : {
        id: `local-${Date.now()}`,
        ...insertPayload
      };

      setSubmittedRSVP({
        ...record,
        name: dataToSubmit.name,
        partner_name: isCouple ? (dataToSubmit.partner_name || record.partner_name || '') : '',
        partner_phone: isCouple ? (dataToSubmit.partner_phone || record.partner_phone || '') : '',
        partner_email: isCouple ? (dataToSubmit.partner_email || record.partner_email || '') : '',
        email: dataToSubmit.email,
        phone: dataToSubmit.phone,
        attending: dataToSubmit.attendance,
        guests_count: guestsCount,
        seat_number: seatNumber ?? record.seat_number ?? null,
        seat_number_end: seatNumberEnd ?? record.seat_number_end ?? null
      });
      setShowAdmissionCard(true);

      setFormData({
        name: '',
        partner_name: '',
        phone: '',
        partner_phone: '',
        email: '',
        partner_email: '',
        guests: '1',
        attendance: '',
        message: ''
      });
    } catch (err) {
      console.error("Full RSVP Error:", err);
      const isCouple = dataToSubmit.guests === '2' || dataToSubmit.guests?.includes('2') || !!dataToSubmit.partner_name;
      // Fallback
      setSubmittedRSVP({
        id: `local-${Date.now()}`,
        name: dataToSubmit.name,
        partner_name: isCouple ? dataToSubmit.partner_name : '',
        partner_phone: isCouple ? dataToSubmit.partner_phone : '',
        partner_email: isCouple ? dataToSubmit.partner_email : '',
        email: dataToSubmit.email,
        phone: dataToSubmit.phone,
        attending: dataToSubmit.attendance,
        guests_count: parseInt(dataToSubmit.guests) || (isCouple ? 2 : 1),
        seat_number: null,
        seat_number_end: null
      });
      setShowAdmissionCard(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
    const isThemePreview = new URLSearchParams(window.location.search).get('theme_preview') === 'true';

    if (isPreview && !isThemePreview) {
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
              slug: dbData.slug,
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
              sliderImages: parseArray(dbData.slider_images),
              bridesmaids: parseArray(dbData.bridesmaids),
              groomsmen: parseArray(dbData.groomsmen),
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
              reception_title: dbData.reception_title || (() => {
                const found = parseArray(dbData.theme_colors).find(c => typeof c === 'string' && c.startsWith("RECEPTION_TITLE:"));
                return found ? found.substring("RECEPTION_TITLE:".length) : "RECEPTION";
              })(),
              reception_subtitle: dbData.reception_subtitle || (() => {
                const found = parseArray(dbData.theme_colors).find(c => typeof c === 'string' && c.startsWith("RECEPTION_SUBTITLE:"));
                return found ? found.substring("RECEPTION_SUBTITLE:".length) : "Party";
              })(),
              show_gallery_titles: dbData.show_gallery_titles !== undefined ? dbData.show_gallery_titles : (() => {
                const found = parseArray(dbData.theme_colors).find(c => typeof c === 'string' && c.startsWith("SHOW_GALLERY_TITLES:"));
                return found ? found.substring("SHOW_GALLERY_TITLES:".length) !== 'false' : true;
              })(),
              dressCode: dbData.dress_code,
              dressCodeDescription: dbData.dress_code_desc,
              theme_colors: parseArray(dbData.theme_colors).filter(c => typeof c === 'string' && !c.startsWith("DRESS_CODE_COLOR:") && !c.startsWith("MUSIC_URL:")),
              dress_code_colors: parseArray(dbData.dress_code_colors),
              music_url: (() => {
                if (dbData.music_url !== undefined && dbData.music_url !== null) {
                  return dbData.music_url;
                }
                const parsedTheme = parseArray(dbData.theme_colors);
                const found = parsedTheme.find(c => typeof c === 'string' && c.startsWith("MUSIC_URL:"));
                return found ? found.substring("MUSIC_URL:".length) : "";
              })(),
              extra_card_text: dbData.extra_card_text || (dbData.venue_description?.startsWith("EXTRA_CARD_TEXT:") ? dbData.venue_description.replace("EXTRA_CARD_TEXT:", "") : ""),
              gifts: parseArray(dbData.gifts),
              galleryImages: parseArray(dbData.gallery_images),
              mapLocation: dbData.map_location,
              rsvpDeadline: dbData.rsvp_deadline,
              coverImage: dbData.cover_image,
              hero_video_url: dbData.hero_video_url || null,
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
            slug: dbData.slug,
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
            sliderImages: parseArray(dbData.slider_images),
            bridesmaids: parseArray(dbData.bridesmaids),
            groomsmen: parseArray(dbData.groomsmen),
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
            reception_title: dbData.reception_title || (() => {
              const found = parseArray(dbData.theme_colors).find(c => typeof c === 'string' && c.startsWith("RECEPTION_TITLE:"));
              return found ? found.substring("RECEPTION_TITLE:".length) : "RECEPTION";
            })(),
            reception_subtitle: dbData.reception_subtitle || (() => {
              const found = parseArray(dbData.theme_colors).find(c => typeof c === 'string' && c.startsWith("RECEPTION_SUBTITLE:"));
              return found ? found.substring("RECEPTION_SUBTITLE:".length) : "Party";
            })(),
            show_gallery_titles: dbData.show_gallery_titles !== undefined ? dbData.show_gallery_titles : (() => {
              const found = parseArray(dbData.theme_colors).find(c => typeof c === 'string' && c.startsWith("SHOW_GALLERY_TITLES:"));
              return found ? found.substring("SHOW_GALLERY_TITLES:".length) !== 'false' : true;
            })(),
            dressCode: dbData.dress_code,
            dressCodeDescription: dbData.dress_code_desc,
            theme_colors: parseArray(dbData.theme_colors).filter(c => typeof c === 'string' && !c.startsWith("DRESS_CODE_COLOR:") && !c.startsWith("MUSIC_URL:")),
            dress_code_colors: parseArray(dbData.dress_code_colors),
            music_url: (() => {
              if (dbData.music_url !== undefined && dbData.music_url !== null) {
                return dbData.music_url;
              }
              const parsedTheme = parseArray(dbData.theme_colors);
              const found = parsedTheme.find(c => typeof c === 'string' && c.startsWith("MUSIC_URL:"));
              return found ? found.substring("MUSIC_URL:".length) : "";
            })(),
            extra_card_text: dbData.extra_card_text || (dbData.venue_description?.startsWith("EXTRA_CARD_TEXT:") ? dbData.venue_description.replace("EXTRA_CARD_TEXT:", "") : ""),
            gifts: parseArray(dbData.gifts),
            galleryImages: parseArray(dbData.gallery_images),
            mapLocation: dbData.map_location,
            rsvpDeadline: dbData.rsvp_deadline,
            coverImage: dbData.cover_image,
            hero_video_url: dbData.hero_video_url || null,
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

            // Status gate: block non-active events from public view (unless in theme preview mode)
            if (!isThemePreview && (dbData.status === 'pending' || (dbData.status && dbData.status !== 'active' && dbData.status !== 'approved'))) {
              setNotApproved(true);
              setLoading(false);
              return;
            }

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
              slug: dbData.slug,
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
              sliderImages: parseArray(dbData.slider_images),
              bridesmaids: parseArray(dbData.bridesmaids),
              groomsmen: parseArray(dbData.groomsmen),
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
              reception_title: dbData.reception_title || (() => {
                const found = parseArray(dbData.theme_colors).find(c => typeof c === 'string' && c.startsWith("RECEPTION_TITLE:"));
                return found ? found.substring("RECEPTION_TITLE:".length) : "RECEPTION";
              })(),
              reception_subtitle: dbData.reception_subtitle || (() => {
                const found = parseArray(dbData.theme_colors).find(c => typeof c === 'string' && c.startsWith("RECEPTION_SUBTITLE:"));
                return found ? found.substring("RECEPTION_SUBTITLE:".length) : "Party";
              })(),
              show_gallery_titles: dbData.show_gallery_titles !== undefined ? dbData.show_gallery_titles : (() => {
                const found = parseArray(dbData.theme_colors).find(c => typeof c === 'string' && c.startsWith("SHOW_GALLERY_TITLES:"));
                return found ? found.substring("SHOW_GALLERY_TITLES:".length) !== 'false' : true;
              })(),
              dressCode: dbData.dress_code,
              dressCodeDescription: dbData.dress_code_desc,
              theme_colors: parseArray(dbData.theme_colors).filter(c => typeof c === 'string' && !c.startsWith("DRESS_CODE_COLOR:") && !c.startsWith("MUSIC_URL:")),
              dress_code_colors: parseArray(dbData.dress_code_colors),
              music_url: (() => {
                if (dbData.music_url !== undefined && dbData.music_url !== null) {
                  return dbData.music_url;
                }
                const parsedTheme = parseArray(dbData.theme_colors);
                const found = parsedTheme.find(c => typeof c === 'string' && c.startsWith("MUSIC_URL:"));
                return found ? found.substring("MUSIC_URL:".length) : "";
              })(),
              extra_card_text: dbData.extra_card_text || (dbData.venue_description?.startsWith("EXTRA_CARD_TEXT:") ? dbData.venue_description.replace("EXTRA_CARD_TEXT:", "") : ""),
              gifts: parseArray(dbData.gifts),
              galleryImages: parseArray(dbData.gallery_images),
              mapLocation: dbData.map_location,
              rsvpDeadline: dbData.rsvp_deadline,
              coverImage: dbData.cover_image,
              hero_video_url: dbData.hero_video_url || null,
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

  // Status gate: show "Not Available Yet" for pending events
  if (notApproved) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f0fdfc 100%)',
        fontFamily: "'Outfit', 'Segoe UI', system-ui, sans-serif",
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: 440,
          textAlign: 'center',
          background: '#fff',
          borderRadius: '20px',
          padding: '3rem 2rem',
          boxShadow: '0 8px 32px rgba(15,23,42,0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#fff7ed', color: '#f59e0b',
            fontSize: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <i className="fas fa-clock" />
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
            Not Available Yet
          </h1>
          <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.55, margin: '0 0 1.5rem' }}>
            This invitation is not available yet. The host is still setting things up — please check back later.
          </p>
          <a href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'linear-gradient(135deg, #1fa09b, #0d9488)', color: '#fff',
            padding: '0.6rem 1.25rem', borderRadius: '10px',
            fontSize: '0.88rem', fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(31,160,155,0.3)'
          }}>
            <i className="fas fa-home" /> Go Home
          </a>
        </div>
      </div>
    );
  }

  const queryTemplateId = new URLSearchParams(window.location.search).get('template');
  const templateId = queryTemplateId || weddingData.template_id?.toString() || '1';

  let templateContent = null;

  if (templateId === '2' || templateId === 'tropical-elegance') {
    templateContent = (
      <TropicalElegance
        weddingData={weddingData}
        handleRSVPSubmitFromParent={handleRSVPSubmit}
        parentIsSubmitting={isSubmitting}
        parentShowAdmissionCard={showAdmissionCard}
        parentSubmittedRSVP={submittedRSVP}
      />
    );
  } else if (templateId === '3' || templateId === 'golden-romance') {
    templateContent = (
      <GoldenRomance
        weddingData={weddingData}
        handleRSVPSubmitFromParent={handleRSVPSubmit}
        parentIsSubmitting={isSubmitting}
        parentShowAdmissionCard={showAdmissionCard}
        parentSubmittedRSVP={submittedRSVP}
      />
    );
  } else if (templateId === '7' || templateId === 'botanical-olive') {
    templateContent = (
      <BotanicalOlive
        weddingData={weddingData}
        handleRSVPSubmitFromParent={handleRSVPSubmit}
        parentIsSubmitting={isSubmitting}
        parentShowAdmissionCard={showAdmissionCard}
        parentSubmittedRSVP={submittedRSVP}
      />
    );
  } else if (templateId === '8' || templateId === 'terracotta-earth') {
    templateContent = (
      <TerracottaEarth
        weddingData={weddingData}
        handleRSVPSubmitFromParent={handleRSVPSubmit}
        parentIsSubmitting={isSubmitting}
        parentShowAdmissionCard={showAdmissionCard}
        parentSubmittedRSVP={submittedRSVP}
      />
    );
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
          onStartClose={() => setIsOverlayClosing(true)}
        />
      )}
      {(!showOverlay || isOverlayClosing) && templateContent}
    </>
  );
};

export default WeddingTemplate;