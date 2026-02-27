const photos = [
  { src: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=400&fit=crop", caption: "Katy's Portrait" },
  { src: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=400&fit=crop", caption: "Dad and Friends" },
  { src: "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=400&h=400&fit=crop", caption: "Playing Games" },
  { src: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=400&fit=crop", caption: "Playing with Clown" },
  { src: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&h=400&fit=crop", caption: "Cut The Cake" },
  { src: "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=400&h=400&fit=crop", caption: "Friend Hugging" },
];

const Gallery = () => (
  <section className="py-20">
    <div className="container mx-auto px-6">
      <h2 className="font-script text-5xl text-primary text-center mb-2">Birthday Moments</h2>
      <div className="w-16 h-1 bg-accent mx-auto mb-12 rounded-full" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, i) => (
          <div key={i} className="group relative overflow-hidden rounded-2xl shadow-md cursor-pointer">
            <img
              src={photo.src}
              alt={photo.caption}
              className="w-full h-48 md:h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/40 transition-colors duration-300 flex items-end">
              <p className="text-primary-foreground font-semibold p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                {photo.caption}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Gallery;
