import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import showcase1 from "@assets/generated_images/Luxury_beauty_station_setup_24f173db.png";
import showcase2 from "@assets/generated_images/Elegant_manicured_hands_champagne_540bb83a.png";
import showcase3 from "@assets/generated_images/Makeup_application_Dubai_Marina_8fba9411.png";
import showcase4 from "@assets/generated_images/Luxury_pedicure_spa_setup_0168f6e6.png";
import showcase5 from "@assets/generated_images/Perfect_lash_extensions_closeup_007415de.png";

const showcaseItems = [
  {
    image: showcase1,
    title: "Premium Beauty Experience",
    description: "Luxury treatments in the comfort of your home",
  },
  {
    image: showcase2,
    title: "Flawless Manicures",
    description: "Perfectly polished nails with premium products",
  },
  {
    image: showcase3,
    title: "Expert Makeup Artistry",
    description: "Professional makeup for any occasion",
  },
  {
    image: showcase4,
    title: "Relaxing Pedicures",
    description: "Spa-quality foot care at your doorstep",
  },
  {
    image: showcase5,
    title: "Stunning Lash Extensions",
    description: "Beautiful, long-lasting lash transformations",
  },
];

export default function AnimatedShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % showcaseItems.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + showcaseItems.length) % showcaseItems.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % showcaseItems.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <section className="py-24 px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Experience Luxury Beauty
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the art of premium beauty services delivered to your door
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl">
            {showcaseItems.map((item, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  index === currentIndex
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
                  <h3
                    className="font-serif text-3xl md:text-4xl font-bold mb-2 transition-all duration-700"
                    style={{
                      transform: index === currentIndex ? "translateY(0)" : "translateY(20px)",
                      opacity: index === currentIndex ? 1 : 0,
                      transitionDelay: index === currentIndex ? "200ms" : "0ms",
                    }}
                    data-testid={`text-showcase-title-${index}`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-lg md:text-xl text-white/90 transition-all duration-700"
                    style={{
                      transform: index === currentIndex ? "translateY(0)" : "translateY(20px)",
                      opacity: index === currentIndex ? 1 : 0,
                      transitionDelay: index === currentIndex ? "400ms" : "0ms",
                    }}
                    data-testid={`text-showcase-description-${index}`}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90 border-border/50 h-10 w-10 md:h-12 md:w-12"
            onClick={goToPrevious}
            data-testid="button-showcase-prev"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90 border-border/50 h-10 w-10 md:h-12 md:w-12"
            onClick={goToNext}
            data-testid="button-showcase-next"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </Button>

          <div className="flex justify-center gap-3 mt-8">
            {showcaseItems.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "w-12 bg-primary" : "w-2 bg-muted hover-elevate"
                }`}
                data-testid={`button-showcase-dot-${index}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
