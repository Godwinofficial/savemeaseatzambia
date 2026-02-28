import { useState, useRef, useEffect } from "react";
import { CheckCircle, XCircle, Loader, Download } from "lucide-react";
import ConfettiDecorations from "./ConfettiDecorations";
import { supabase } from "../supabaseClient";

interface Event {
  id?: string;
  child_name?: string;
  date?: string;
  time?: string;
  venue_name?: string;
  venue_address?: string;
}

// Load html2canvas from CDN once
const loadHtml2Canvas = (): Promise<any> =>
  new Promise((resolve) => {
    if ((window as any).html2canvas) return resolve((window as any).html2canvas);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.onload = () => resolve((window as any).html2canvas);
    document.head.appendChild(s);
  });

const RSVPFooter = ({ event }: { event: Event | null }) => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", attending: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Pre-load html2canvas
  useEffect(() => { loadHtml2Canvas(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.attending) {
      setErrorMsg("Please fill in all fields.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const { error } = await supabase.from("birthday_rsvps").insert([
        {
          event_id: event?.id ?? null,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          attending: form.attending === "yes",
        },
      ]);

      if (error) throw error;

      setSubmittedName(form.name.trim());
      setStatus("success");
      setForm({ name: "", phone: "", email: "", attending: "" });
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `${event?.child_name || "Birthday"}_Invitation.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const dateLabel = event?.date
    ? new Date(event.date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    })
    : "";

  const timeLabel = event?.time
    ? new Date(`1970-01-01T${event.time}:00`).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit",
    })
    : "";

  return (
    <section
      className="relative py-20 overflow-hidden"
      style={{ background: "var(--background, hsl(222, 47%, 11%))" }}
    >
      <ConfettiDecorations />

      <div className="container mx-auto px-6 relative z-10" style={{ maxWidth: 560 }}>

        {/* Section header */}
        <div className="text-center mb-10">
          <h2 className="font-script text-5xl text-primary text-center mb-2">Rsvp</h2>
          <div className="w-16 h-1 bg-accent mx-auto mb-4 rounded-full" />
          <p className="text-muted-foreground text-sm">
            We can't wait to celebrate with you. Let us know if you're coming.
          </p>
        </div>

        {/* ── SUCCESS STATE ── */}
        {status === "success" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>

            {/* Confirmation message */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#10b981", marginBottom: 4 }}>
              <CheckCircle size={22} />
              <span style={{ fontWeight: 700, fontSize: "1rem" }}>RSVP confirmed for {submittedName}!</span>
            </div>
            {/* ── DOWNLOADABLE CARD ── */}
            <div
              ref={cardRef}
              style={{
                width: "100%",
                maxWidth: 480,
                background: "linear-gradient(145deg, #111111 0%, #000000 100%)",
                borderRadius: 20,
                padding: "40px 36px",
                textAlign: "center",
                boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                border: "2px solid var(--primary, #FFD700)",
                position: "relative",
                overflow: "hidden",
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {/* Decorative corner dots */}
              {[
                { top: 16, left: 16 }, { top: 16, right: 16 },
                { bottom: 16, left: 16 }, { bottom: 16, right: 16 },
              ].map((pos, i) => (
                <div key={i} style={{
                  position: "absolute", width: 10, height: 10,
                  borderRadius: "50%", background: "#FFD700", ...pos,
                }} />
              ))}

              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: i % 2 === 0 ? "#FFD700" : "var(--muted, #222222)",
                  }} />
                ))}
              </div>

              {/* You're invited */}
              <p style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--muted-foreground, hsl(215, 20%, 65%))", marginBottom: 8 }}>
                You are cordially invited to
              </p>

              {/* Child name */}
              <p style={{ fontFamily: "'Sacramento', cursive", fontSize: "3.4rem", color: "var(--primary, #FFD700)", lineHeight: 1, margin: "0 0 4px" }}>
                {event?.child_name || "Katy"}'s
              </p>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--foreground, hsl(210, 40%, 98%))", margin: "0 0 24px", lineHeight: 1.1 }}>
                Birthday Celebration
              </h2>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: "#333333" }} />
                <span style={{ fontSize: "1rem", color: "#FFD700" }}>✦</span>
                <div style={{ flex: 1, height: 1, background: "#333333" }} />
              </div>

              {/* Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {dateLabel && (
                  <div style={{ fontSize: "0.88rem", color: "var(--foreground, hsl(210, 40%, 98%))", fontWeight: 700 }}>
                    {dateLabel}
                  </div>
                )}
                {timeLabel && (
                  <div style={{ fontSize: "0.88rem", color: "var(--foreground, hsl(210, 40%, 98%))", fontWeight: 700 }}>
                    {timeLabel}
                  </div>
                )}
                {event?.venue_name && (
                  <div style={{ fontSize: "0.88rem", color: "var(--foreground, hsl(210, 40%, 98%))", fontWeight: 700 }}>
                    {event.venue_name}
                  </div>
                )}
                {event?.venue_address && (
                  <div style={{ fontSize: "0.78rem", color: "var(--muted-foreground, hsl(215, 20%, 65%))" }}>
                    {event.venue_address}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: "#333333" }} />
                <span style={{ fontSize: "1rem", color: "#FFD700" }}>✦</span>
                <div style={{ flex: 1, height: 1, background: "#333333" }} />
              </div>

              {/* RSVP badge */}
              <div style={{
                background: "var(--primary, #FFD700)", color: "var(--primary-foreground, #000000)",
                borderRadius: 9999, padding: "10px 24px",
                display: "inline-block", fontWeight: 700, fontSize: "0.82rem",
                letterSpacing: "0.06em", marginBottom: 12,
              }}>
                RSVP Confirmed
              </div>

              <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground, hsl(215, 20%, 65%))", margin: 0 }}>
                See you there, <strong style={{ color: "var(--primary, #FFD700)" }}>{submittedName}</strong>!
              </p>

              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: i % 2 === 0 ? "var(--muted, #222222)" : "#FFD700",
                  }} />
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  background: "var(--primary, #FFD700)", color: "var(--primary-foreground, #000000)",
                  border: "none", borderRadius: 9999,
                  padding: "12px 28px", fontWeight: 700, fontSize: "0.9rem",
                  cursor: downloading ? "not-allowed" : "pointer",
                  opacity: downloading ? 0.75 : 1,
                  display: "flex", alignItems: "center", gap: 8,
                  boxShadow: "0 6px 20px rgba(255,215,0,0.3)",
                }}
              >
                {downloading
                  ? <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating…</>
                  : <><Download size={16} /> Download Card</>
                }
              </button>
              <button
                onClick={() => { setStatus("idle"); setSubmittedName(""); }}
                style={{
                  background: "transparent", color: "var(--muted-foreground, hsl(215, 20%, 65%))",
                  border: "1.5px solid var(--border, hsl(217, 33%, 22%))", borderRadius: 9999,
                  padding: "12px 24px", fontWeight: 700, fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Submit Another RSVP
              </button>
            </div>
          </div>
        ) : (
          /* ── FORM ── */
          <form
            onSubmit={handleSubmit}
            className="bg-card rounded-2xl shadow-md border border-border"
            style={{ padding: "36px 32px", display: "flex", flexDirection: "column", gap: 20 }}
          >
            {/* Full Name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text" name="name" value={form.name}
                onChange={handleChange} placeholder="e.g. Mwaka Banda"
                style={inputStyle} autoComplete="off"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="tel" name="phone" value={form.phone}
                onChange={handleChange} placeholder="e.g. +260 97 000 0000"
                style={inputStyle} autoComplete="off"
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>
                Email Address{" "}
                <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--muted-foreground, hsl(215, 20%, 65%))" }}>
                  (optional)
                </span>
              </label>
              <input
                type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="e.g. mwaka@email.com"
                style={inputStyle} autoComplete="off"
              />
            </div>

            {/* Attendance */}
            <div>
              <label style={labelStyle}>Will you be attending?</label>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                {[
                  { value: "yes", label: "Yes, I'll be there" },
                  { value: "no", label: "Sorry, I can't make it" },
                ].map(({ value, label }) => {
                  const selected = form.attending === value;
                  const color = value === "yes" ? "var(--primary, #d4af37)" : "var(--muted-foreground, hsl(215, 20%, 65%))";
                  return (
                    <label
                      key={value}
                      style={{
                        flex: 1, display: "flex", alignItems: "center",
                        justifyContent: "center", padding: "12px 10px",
                        border: `1.5px solid ${selected ? color : "var(--border, hsl(217, 33%, 22%))"}`,
                        borderRadius: 12, cursor: "pointer", fontSize: "0.83rem",
                        fontWeight: 700, color: selected ? color : "var(--muted-foreground, hsl(215, 20%, 65%))",
                        background: selected ? `${color}12` : "#fff",
                        transition: "all 0.18s", userSelect: "none" as const,
                      }}
                    >
                      <input
                        type="radio" name="attending" value={value}
                        checked={selected} onChange={handleChange}
                        style={{ display: "none" }}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Error */}
            {status === "error" && errorMsg && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                color: "#ef4444", fontSize: "0.84rem",
                background: "#fef2f2", padding: "10px 14px", borderRadius: 10,
              }}>
                <XCircle size={16} />{errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={status === "submitting"}
              style={{
                background: "var(--primary, #d4af37)", color: "var(--primary-foreground, hsl(222, 47%, 11%))",
                border: "none", borderRadius: 9999,
                padding: "14px 32px", fontWeight: 700, fontSize: "0.97rem",
                cursor: status === "submitting" ? "not-allowed" : "pointer",
                opacity: status === "submitting" ? 0.75 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 6px 20px hsla(340,65%,60%,0.30)",
                transition: "opacity 0.2s",
              }}
            >
              {status === "submitting"
                ? <><Loader size={17} style={{ animation: "spin 1s linear infinite" }} /> Submitting…</>
                : "Send My RSVP"
              }
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 60, borderTop: "1px solid var(--border, hsl(217, 33%, 22%))",
        paddingTop: 24, textAlign: "center", position: "relative", zIndex: 10,
      }}>
        <p style={{ fontFamily: "'Sacramento', cursive", fontSize: "2rem", color: "var(--primary, #d4af37)", margin: "0 0 4px" }}>
          {event?.child_name || ""}
        </p>
        <p style={{ fontSize: "0.76rem", color: "var(--muted-foreground, hsl(215, 20%, 65%))", margin: 0 }}>
          &copy; {new Date().getFullYear()}{" "}
          {event?.child_name ? `${event.child_name}'s Birthday` : "Birthday Celebration"}
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </section >
  );
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.78rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.08em",
  color: "var(--muted-foreground, hsl(215, 20%, 65%))", marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px",
  border: "1.5px solid var(--border, hsl(217, 33%, 22%))", borderRadius: 10,
  fontSize: "0.95rem", outline: "none", color: "var(--foreground, hsl(210, 40%, 98%))",
  background: "var(--card, hsl(222, 47%, 15%))", boxSizing: "border-box", transition: "border-color 0.2s",
};

export default RSVPFooter;