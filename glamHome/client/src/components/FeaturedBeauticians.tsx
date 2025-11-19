import BeauticianCard from "./BeauticianCard";
import { Button } from "@/components/ui/button";
import profile1 from "@assets/generated_images/Beautician_profile_one_9fa3b2a4.png";
import profile2 from "@assets/generated_images/Beautician_profile_two_08398f98.png";
import profile3 from "@assets/generated_images/Beautician_profile_three_da0a3188.png";

export default function FeaturedBeauticians() {
  const beauticians = [
    {
      name: "Sarah Al-Mansouri",
      image: profile1,
      specialties: ["Makeup", "Lashes"],
      rating: 4.9,
      bookingCount: 287,
      startingPrice: "د.إ 200",
      location: "Dubai Marina",
    },
    {
      name: "Layla Hassan",
      image: profile2,
      specialties: ["Nails", "Manicure"],
      rating: 4.8,
      bookingCount: 342,
      startingPrice: "د.إ 150",
      location: "Downtown Dubai",
    },
    {
      name: "Amira Khan",
      image: profile3,
      specialties: ["Makeup", "Pedicure"],
      rating: 5.0,
      bookingCount: 198,
      startingPrice: "د.إ 180",
      location: "Jumeirah",
    },
  ];

  return (
    <section className="py-24 px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Featured Beauticians
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover Dubai's most talented and trusted beauty professionals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {beauticians.map((beautician, index) => (
            <BeauticianCard key={index} {...beautician} />
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="outline" data-testid="button-view-all-beauticians">
            View All Beauticians
          </Button>
        </div>
      </div>
    </section>
  );
}
