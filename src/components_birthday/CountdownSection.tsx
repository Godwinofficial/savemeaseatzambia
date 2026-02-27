import { useEffect, useState } from "react";
import { CalendarDays, Clock, Building, MapPin } from "lucide-react";
import ConfettiDecorations from "./ConfettiDecorations";

interface Event {
  date?: string;
  time?: string;
  venue_name?: string;
  venue_address?: string;
  child_name?: string;
}

const CountdownSection = ({ event }: { event: Event | null }) => {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isPast, setIsPast] = useState(false);

  // Fix stale closure: calculate targetDate INSIDE the effect
  useEffect(() => {
    const buildTarget = () => {
      if (!event?.date) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      // Pad time to HH:MM:SS if needed
      const t = event.time ? (event.time.length === 5 ? `${event.time}:00` : event.time) : "10:00:00";
      return new Date(`${event.date}T${t}`);
    };

    const tick = () => {
      const target = buildTarget();
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setIsPast(true);
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setIsPast(false);
        setTime({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        });
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [event?.date, event?.time]);

  const dateLabel = event?.date
    ? new Date(event.date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    })
    : "Date to be announced";

  const timeLabel = event?.time
    ? new Date(`1970-01-01T${event.time}:00`).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit",
    })
    : "Time to be announced";

  const venueName = event?.venue_name || "Venue to be announced";
  const venueAddress = event?.venue_address || "";
  const childName = event?.child_name || "the birthday child";

  const cards = [
    {
      title: "Date",
      icon: CalendarDays,
      items: [{ icon: CalendarDays, text: dateLabel }],
    },
    {
      title: "Time & Venue",
      icon: Clock,
      items: [
        { icon: Clock, text: timeLabel },
        { icon: Building, text: venueName },
        ...(venueAddress ? [{ icon: MapPin, text: venueAddress }] : []),
      ],
    },
  ];

  // Google Maps embed URL from address
  const mapsEmbedUrl = venueAddress
    ? `https://maps.google.com/maps?q=${encodeURIComponent(venueAddress)}&output=embed`
    : null;

  return (
    <section className="relative py-20 overflow-hidden">
      <ConfettiDecorations />
      <div className="container mx-auto px-6 relative z-10">
        <h2 className="font-script text-5xl text-primary text-center mb-2">You Are Invited</h2>
        <div className="w-16 h-1 bg-accent mx-auto mb-10 rounded-full" />

        {/* Countdown or "Party Time!" */}
        {isPast ? (
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{
              fontFamily: "'Sacramento', cursive",
              fontSize: "3rem",
              color: "var(--primary, hsl(43, 74%, 49%))",
            }}>
              Happy Birthday, {childName}!
            </span>
          </div>
        ) : (
          <div className="flex justify-center gap-4 md:gap-8 mb-16">
            {Object.entries(time).map(([label, value]) => (
              <div key={label} className="text-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-3xl md:text-4xl font-extrabold shadow-lg">
                  {String(value).padStart(2, "0")}
                </div>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Info Cards */}
        <div className="grid gap-6 mb-12 md:grid-cols-2 max-w-2xl mx-auto">
          {cards.map((card) => (
            <div key={card.title} className="bg-card rounded-2xl p-8 shadow-md text-center">
              <card.icon className="mx-auto text-primary mb-4" size={32} />
              <h3 className="font-bold text-lg mb-4">{card.title}</h3>
              <ul className="space-y-3">
                {card.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <item.icon size={14} className="text-accent" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CountdownSection;
