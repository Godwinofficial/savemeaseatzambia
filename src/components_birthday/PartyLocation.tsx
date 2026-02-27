interface Event {
  venue_name?: string;
  venue_address?: string;
  map_embed?: string;
}

const PartyLocation = ({ event }: { event: Event | null }) => {
  const venueAddress = event?.venue_address || "";

  // Prefer the stored embed URL (set by admin via Leaflet), fall back to address-based URL
  const mapsEmbedUrl =
    event?.map_embed ||
    (venueAddress
      ? `https://maps.google.com/maps?q=${encodeURIComponent(venueAddress)}&output=embed`
      : null);

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-6">

        {/* Section header — matches all other sections */}
        <h2 className="font-script text-5xl text-primary text-center mb-2">Party Location</h2>
        <div className="w-16 h-1 bg-accent mx-auto mb-10 rounded-full" />

        {/* Google Maps embed */}
        <div style={{ maxWidth: 800, margin: "0 auto", borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.30)", border: "1px solid var(--border, hsl(217, 33%, 22%))" }}>
          {mapsEmbedUrl ? (
            <iframe
              src={mapsEmbedUrl}
              width="100%"
              height="420"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Party Location Map"
            />
          ) : (
            <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--card, hsl(222, 47%, 15%))", color: "var(--muted-foreground, hsl(215, 20%, 65%))", fontSize: "0.95rem" }}>
              Venue details coming soon
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default PartyLocation;