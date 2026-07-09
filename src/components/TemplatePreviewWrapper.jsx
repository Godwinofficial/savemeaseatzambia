import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import InvitationOverlay from './InvitationOverlay';

const TemplatePreviewWrapper = ({ children, slug }) => {
  const [weddingData, setWeddingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);

  // Helper to format date safely
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
  };

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        let query = supabase.from('weddings').select('*');
        if (slug) {
          query = query.eq('slug', slug);
        } else {
          query = query.order('created_at', { ascending: false }).limit(1);
        }

        const { data, error } = await query;
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
            allowedGuests: dbData.allowed_guests || [],
            otherEvents: dbData.other_events || [],
            tagline: dbData.tagline || "We are getting married"
          });
        }
      } catch (err) {
        console.error("Preview Wrapper Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8f9fa' }}>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.2rem', color: '#333', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#C16E5A' }}></i>
        Loading template...
      </div>
    </div>;
  }

  // Clone the child element and pass the dynamically fetched weddingData to it
  return (
    <>
      {showOverlay && (
        <InvitationOverlay
          weddingData={weddingData}
          onEnter={() => setShowOverlay(false)}
        />
      )}
      {React.cloneElement(children, { weddingData })}
    </>
  );
};

export default TemplatePreviewWrapper;
