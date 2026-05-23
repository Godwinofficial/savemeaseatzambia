import { motion } from "framer-motion";

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
    <section className="py-20 bg-card overflow-hidden">
      <div className="container mx-auto px-6 text-center max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-script text-5xl text-primary mb-2">The Birthday</h2>
          <div className="w-16 h-1 bg-accent mx-auto mb-8 rounded-full" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-muted-foreground leading-relaxed mb-8 italic"
        >
          {message}
        </motion.p>
      </div>
    </section>
  );
};

export default BirthdayQueen;
