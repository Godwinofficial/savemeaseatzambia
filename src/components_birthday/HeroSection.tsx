import { CalendarDays } from "lucide-react";
import ConfettiDecorations from "./ConfettiDecorations";

interface Event {
  child_name?: string;
  age?: string;
  date?: string;
  time?: string;
  hero_image?: string;
  message?: string;
}

const HeroSection = ({ event }: { event: Event | null }) => {
  const name = event?.child_name || "Katy";
  const age = event?.age ? `${getOrdinal(event.age)} ` : "6th ";
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
          paddingTop: "clamp(70px, 12vw, 120px)",
          paddingBottom: "80px",
          overflowX: "hidden",
          background: "linear-gradient(135deg, #111111 0%, #000000 100%)",
        }}
      >
        <ConfettiDecorations />

        <div className="bd-hero-inner" style={{ position: "relative", zIndex: 10 }}>
          {/* Left: Text */}
          <div className="bd-hero-text">
            <p
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
            </p>

            <div style={{ marginBottom: "20px" }}>
              <span
                style={{
                  fontFamily: "'Sacramento', cursive",
                  fontSize: "clamp(4rem, 8vw, 6rem)",
                  lineHeight: 1,
                  color: "var(--primary, hsl(43, 74%, 49%))",
                  display: "block",
                }}
              >
                {name}'s
              </span>
              <h1
                style={{
                  fontSize: "clamp(2.8rem, 6vw, 4.5rem)",
                  fontWeight: 800,
                  color: "var(--foreground, hsl(210, 40%, 98%))",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {age}Birthday
              </h1>
            </div>

            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "var(--primary, hsl(43, 74%, 49%))",
                color: "var(--primary-foreground, hsl(222, 47%, 11%))",
                border: "none",
                borderRadius: "9999px",
                padding: "12px 28px",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 8px 24px hsla(43, 74%, 49%, 0.35)",
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
      </section>

      <style>{`
        .bd-hero-inner {
          display: flex; flex-direction: row; align-items: center;
          gap: 64px; max-width: 1100px; width: 100%;
          margin: 0 auto; padding: 0 32px;
        }
        .bd-hero-text  { flex: 1; text-align: left; }
        .bd-hero-image { flex: 1; display: flex; justify-content: flex-end; }

        @media (max-width: 767px) {
          .bd-hero-section { margin-top: 56px !important; padding-top: 24px !important; }
          .bd-hero-inner {
            flex-direction: column; align-items: center;
            gap: 36px; padding: 0 20px;
          }
          .bd-hero-text  { text-align: center; }
          .bd-hero-image { justify-content: center; }
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