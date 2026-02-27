import { Quote } from "lucide-react";

const quotes = [
  {
    text: "Watching Katy grow into such a wonderful little person has been the greatest joy of my life. She brings sunshine into every room and I'm so proud to be her dad.",
    name: "John Smith",
    role: "Katy's Dad",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
  },
  {
    text: "My sweet Katy, you are my everything. Your laughter is the most beautiful sound in the world. Happy birthday to our little princess — may all your dreams come true!",
    name: "Sarah Smith",
    role: "Katy's Mom",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
  },
];

const ParentQuotes = () => (
  <section className="py-20 bg-card">
    <div className="container mx-auto px-6">
      <h2 className="font-script text-5xl text-primary text-center mb-2">Parent's Words</h2>
      <div className="w-16 h-1 bg-accent mx-auto mb-12 rounded-full" />
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {quotes.map((q, i) => (
          <div key={i} className="bg-background rounded-2xl p-8 shadow-md relative">
            <Quote className="text-primary/20 absolute top-4 right-4" size={40} />
            <div className="flex items-center gap-4 mb-6">
              <img
                src={q.image}
                alt={q.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary"
              />
              <div>
                <p className="font-bold">{q.name}</p>
                <p className="text-sm text-muted-foreground">{q.role}</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed italic">"{q.text}"</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ParentQuotes;
