import { useEffect, useState } from "react";
import { CalendarDays, Clock, Building, MapPin, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import ConfettiDecorations from "./ConfettiDecorations";

interface Event {
  date?: string;
  time?: string;
  venue_name?: string;
  venue_address?: string;
  child_name?: string;
  dress_code?: string;
  theme?: string;
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
    ? (() => {
      const [h, m] = event.time.split(":");
      const hrs = parseInt(h, 10);
      const ampm = hrs >= 12 ? "PM" : "AM";
      const h12 = hrs % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    })()
    : "Time to be announced";

  const venueName = event?.venue_name || "Venue to be announced";
  const venueAddress = event?.venue_address || "";
  const childName = event?.child_name || "the birthday child";
  const dressCode = event?.dress_code || event?.theme || "To be announced";

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
    {
      title: "Dress Code",
      image: "/imgs/dress_code_clean.png",
      items: [{ icon: Sparkles, text: dressCode }],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <section className="relative py-20 overflow-hidden">
      <ConfettiDecorations />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-script text-5xl text-primary text-center mb-2">You Are Invited</h2>
          <div className="w-16 h-1 bg-accent mx-auto mb-10 rounded-full" />
        </motion.div>

        {/* Countdown or "Party Time!" */}
        {isPast ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <span className="font-script text-5xl text-primary">
              Happy Birthday, {childName}!
            </span>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex justify-center gap-4 md:gap-8 mb-16"
          >
            {Object.entries(time).map(([label, value]) => (
              <motion.div key={label} variants={itemVariants} className="text-center">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-foreground">
                  {label}
                </p>
                <div className="countdown-box w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 border-primary bg-card text-primary flex items-center justify-center text-3xl md:text-4xl font-extrabold shadow-lg">
                  {String(value).padStart(2, "0")}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Info Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 mb-12 md:grid-cols-2 max-w-2xl mx-auto"
        >
          {cards.map((card) => (
            <motion.div
              key={card.title}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-card rounded-2xl p-8 shadow-md text-center border border-border/50 hover:border-primary/50 transition-colors"
            >
              {('image' in card && card.image) ? (
                <img
                  src={card.image}
                  alt={card.title}
                  className="mx-auto mb-4 w-32 h-32 object-contain filter brightness-110 drop-shadow-xl rounded-xl"
                />
              ) : (
                card.icon && <card.icon className="mx-auto text-primary mb-4" size={32} />
              )}
              <h3 className="font-bold text-lg mb-4">{card.title}</h3>
              <ul className="space-y-3">
                {card.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <item.icon size={14} className="text-accent" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default CountdownSection;
