interface Event {
  child_name?: string;
  age?: string;
  message?: string;
}

const BirthdayQueen = ({ event }: { event: Event | null }) => {
  const name = event?.child_name || "Katy";
  const ageValue = event?.age ? parseInt(event.age) : 6;
  const displayAge = ageValue - 1;
  const message =
    event?.message ||
    "We'd love for you to join us in celebrating!";
  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-6 text-center max-w-2xl">
        <h2 className="font-script text-5xl text-primary mb-2">The Birthday</h2>
        <div className="w-16 h-1 bg-accent mx-auto mb-8 rounded-full" />
        <p className="text-muted-foreground leading-relaxed mb-8 italic">{message}</p>
        {/* <div
          style={{
            display: "inline-block",
            background: "#f4d05c",
            color: "#000000",
            borderRadius: 9999,
            padding: "10px 28px",
            fontWeight: 700,
            fontSize: "1rem",
            letterSpacing: "0.04em",
          }}
        >
          Celebrating {name}'s {ordinal(ageValue)} Birthday
        </div> */}
      </div>
    </section>
  );
};

export default BirthdayQueen;
