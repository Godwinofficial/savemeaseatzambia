const dots = [
  { top: "10%", left: "5%", size: 12, color: "bg-primary" },
  { top: "20%", left: "90%", size: 8, color: "bg-secondary" },
  { top: "15%", left: "80%", size: 14, color: "bg-accent" },
  { top: "70%", left: "3%", size: 10, color: "bg-katy-gold" },
  { top: "80%", left: "92%", size: 8, color: "bg-primary" },
  { top: "50%", left: "95%", size: 6, color: "bg-katy-green" },
  { top: "30%", left: "2%", size: 10, color: "bg-secondary" },
];

const rects = [
  { top: "25%", left: "8%", w: 4, h: 16, color: "bg-accent", rotate: "rotate-45" },
  { top: "60%", left: "88%", w: 4, h: 14, color: "bg-primary", rotate: "-rotate-30" },
  { top: "40%", left: "4%", w: 3, h: 12, color: "bg-katy-gold", rotate: "rotate-12" },
  { top: "85%", left: "85%", w: 4, h: 14, color: "bg-secondary", rotate: "-rotate-45" },
];

const ConfettiDecorations = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {dots.map((d, i) => (
      <div
        key={`dot-${i}`}
        className={`confetti-dot ${d.color}`}
        style={{
          top: d.top,
          left: d.left,
          width: d.size,
          height: d.size,
          animationDelay: `${i * 0.8}s`,
        }}
      />
    ))}
    {rects.map((r, i) => (
      <div
        key={`rect-${i}`}
        className={`confetti-rect ${r.color} ${r.rotate} rounded-sm`}
        style={{
          top: r.top,
          left: r.left,
          width: r.w,
          height: r.h,
          animationDelay: `${i * 1.2}s`,
        }}
      />
    ))}
  </div>
);

export default ConfettiDecorations;