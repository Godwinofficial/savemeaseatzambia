import { CalendarDays } from "lucide-react";
import ConfettiDecorations from "./ConfettiDecorations";

interface Event {
  child_name?: string;
  age?: string;
  date?: string;
  time?: string;
  hero_image?: string;
  message?: string;
  hero_greeting?: string;
  hero_text?: string;
}

const SimpleGlitters = () => {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none", zIndex: 5 }}>
      {/* Hanging Strings */}
      {Array.from({ length: 35 }).map((_, i) => {
        const left = Math.random() * 100;
        // Calculate a curve: shorter in the center (50%), longer at the edges (0% and 100%)
        const distanceFromCenter = Math.abs(left - 50) / 50;
        const curveHeight = Math.pow(distanceFromCenter, 2) * 35; // 0% in center, 35% on edges
        const height = 8 + curveHeight + Math.random() * 10; // 8-18% center, 43-53% edges

        const delay = Math.random() * 3;
        const duration = 2 + Math.random() * 3;
        const starSize = 2 + Math.random() * 2;

        return (
          <div
            key={`hang-${i}`}
            className="glitter-line"
            style={{
              left: `${left}%`,
              height: `${height}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          >
            <div
              className="glitter-star-end"
              style={{
                width: starSize,
                height: starSize,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          </div>
        );
      })}

      {/* Scattered Dust */}
      {Array.from({ length: 45 }).map((_, i) => {
        const left = Math.random() * 100;
        const distanceFromCenter = Math.abs(left - 50) / 50;
        // Dust starts lower in the center, but can go higher on the edges
        const minTop = 60 - Math.pow(distanceFromCenter, 1.5) * 40; // 60% in middle, 20% at edges
        const maxTop = 95;
        const top = minTop + Math.random() * (maxTop - minTop);

        const delay = Math.random() * 4;
        const duration = 2 + Math.random() * 3;
        const starSize = 1.5 + Math.random() * 2.5;

        return (
          <div
            key={`dust-${i}`}
            className="glitter-dust"
            style={{
              position: "absolute",
              top: `${top}%`,
              left: `${left}%`,
              width: starSize,
              height: starSize,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
};

const HeroSection = ({ event }: { event: Event | null }) => {
  const name = event?.child_name || "Katy";
  const ageValue = event?.age ? parseInt(event.age) : 6;
  const displayAge = ageValue - 1;
  const dateLabel = event?.date
    ? new Date(event.date + "T00:00:00").toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "24 January 2021";
  const heroImg =
    event?.hero_image ||
    "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600&h=600&fit=crop";
  const heroGreeting = event?.hero_greeting || "Shhhhh!!!";

  return (
    <>
      <section
        className="bd-hero-section"
        style={{
          position: "relative",
          minHeight: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "clamp(124px, 15vw, 164px)",
          paddingBottom: "80px",
          overflowX: "hidden",
          background: "linear-gradient(135deg, #111111 0%, #000000 100%)",
        }}
      >
        <SimpleGlitters />

        <div className="bd-hero-inner" style={{ position: "relative", zIndex: 10 }}>
          {/* Left: Text */}
          <div className="bd-hero-text">
            {/* <p
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--muted-foreground, hsl(215, 20%, 65%))",
                marginBottom: "12px",
              }}
            >
              You are invited to
            </p> */}

            <div style={{ marginBottom: "20px" }}>
              <span
                style={{
                  fontFamily: "'Sacramento', cursive",
                  fontSize: "clamp(3rem, 6vw, 4.5rem)",
                  lineHeight: 1,
                  color: "var(--primary, #f4d05c)",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                {heroGreeting}
              </span>
              <h1
                style={{
                  fontFamily: "'Sacramento', cursive",
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  fontWeight: 400,
                  color: "var(--foreground, hsl(210, 40%, 98%))",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {event?.hero_text || `${name} is ${displayAge} Again`}
              </h1>
            </div>

            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "var(--primary, #f4d05c)",
                color: "var(--primary-foreground, #000000)",
                border: "none",
                borderRadius: "9999px",
                padding: "12px 28px",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(244, 208, 92, 0.35)",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
              }
            >
              <CalendarDays size={20} />
              {dateLabel}
            </button>
          </div>

          {/* Right: Blob image */}
          <div className="bd-hero-image">
            <div
              className="blob-shape"
              style={{
                width: "clamp(260px, 38vw, 420px)",
                height: "clamp(260px, 38vw, 420px)",
                overflow: "hidden",
                boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
              }}
            >
              <img
                src={heroImg}
                alt={`${name}'s birthday`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </section >

      <style>{`
        .bd-hero-inner {
          display: flex; flex-direction: row; align-items: center;
          gap: 64px; max-width: 1100px; width: 100%;
          margin: 0 auto; padding: 0 32px;
        }
        .bd-hero-text  { flex: 1; text-align: left; }
        .bd-hero-image { flex: 1; display: flex; justify-content: flex-end; }

        @media (max-width: 767px) {
          .bd-hero-section { margin-top: 26px !important; padding-top: 68px !important; }
          .bd-hero-inner {
            flex-direction: column; align-items: center;
            gap: 36px; padding: 0 20px;
          }
          .bd-hero-text  { text-align: center; }
          .bd-hero-image { justify-content: center; }
        }

        .glitter-line {
          position: absolute;
          top: 0;
          width: 1px;
          border-left: 1px dashed rgba(244, 208, 92, 0.4);
          animation: bd-glitter-fade ease-in-out infinite alternate;
          -webkit-transform: translate3d(0,0,0);
        }

        .glitter-star-end {
          position: absolute;
          bottom: -1px;
          left: -1px;
          background-color: #f4d05c;
          border-radius: 50%;
          box-shadow: 0 0 6px 1px #f4d05c, 0 0 10px 2px rgba(244, 208, 92, 0.5);
          animation: bd-glitter-star-pulse ease-in-out infinite alternate;
          -webkit-transform: translate3d(0,0,0);
        }

        .glitter-dust {
          position: absolute;
          background-color: #f4d05c;
          border-radius: 50%;
          box-shadow: 0 0 6px 1px #f4d05c, 0 0 10px 2px rgba(244, 208, 92, 0.5);
          animation: bd-glitter-dust-pulse ease-in-out infinite alternate;
          -webkit-transform: translate3d(0,0,0);
        }

        @keyframes bd-glitter-fade {
          0% { opacity: 0.2; }
          100% { opacity: 1; }
        }

        @keyframes bd-glitter-star-pulse {
          0% { opacity: 0.5; transform: scale(0.6) translate3d(0,0,0); }
          100% { opacity: 1; transform: scale(1.4) translate3d(0,0,0); }
        }

        @keyframes bd-glitter-dust-pulse {
          0% { opacity: 0.2; transform: scale(0.5) translate3d(0,0,0); }
          100% { opacity: 1; transform: scale(1.5) translate3d(0,0,0); }
        }
      `}</style>
    </>
  );
};

function getOrdinal(n: string | number): string {
  const num = parseInt(String(n), 10);
  if (isNaN(num)) return String(n);
  const s = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default HeroSection;