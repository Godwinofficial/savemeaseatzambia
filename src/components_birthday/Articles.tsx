import { ArrowRight } from "lucide-react";

const articles = [
  {
    image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=300&fit=crop",
    title: "How to Plan the Perfect Birthday Party",
    excerpt: "Planning a birthday party can be stressful but with these tips, you'll create an unforgettable celebration for your little one.",
  },
  {
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop",
    title: "Top 10 Party Games for Kids",
    excerpt: "Keep the little ones entertained with these fun and exciting party games that will have everyone laughing and playing.",
  },
  {
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=300&fit=crop",
    title: "Best Birthday Cake Ideas for Children",
    excerpt: "From unicorn cakes to dinosaur designs, discover the most creative birthday cake ideas that kids absolutely love.",
  },
];

const Articles = () => (
  <section className="py-20">
    <div className="container mx-auto px-6">
      <h2 className="font-script text-5xl text-primary text-center mb-2">Latest Articles</h2>
      <div className="w-16 h-1 bg-accent mx-auto mb-12 rounded-full" />
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {articles.map((a, i) => (
          <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-md group cursor-pointer">
            <div className="overflow-hidden">
              <img
                src={a.image}
                alt={a.title}
                className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{a.title}</h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{a.excerpt}</p>
              <a href="#" className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:gap-2 transition-all">
                Learn more <ArrowRight size={14} />
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-10">
        <button className="border-2 border-primary text-primary px-8 py-2 rounded-full font-semibold hover:bg-primary hover:text-primary-foreground transition-colors">
          More Articles
        </button>
      </div>
    </div>
  </section>
);

export default Articles;
