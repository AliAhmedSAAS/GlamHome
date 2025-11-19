import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, Star, SlidersHorizontal, X, Loader2 } from "lucide-react";
import profile1 from "@assets/generated_images/Beautician_profile_one_9fa3b2a4.png";
import profile2 from "@assets/generated_images/Beautician_profile_two_08398f98.png";
import profile3 from "@assets/generated_images/Beautician_profile_three_da0a3188.png";

const profileImages = [profile1, profile2, profile3];

interface BeauticianData {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  experience: string;
  startingPrice: number;
  availability: string;
  rating: string;
  reviewCount: number;
  isApproved: boolean;
  serviceAreas: string[];
  createdAt: Date;
}

export default function FindBeauticians() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [priceRange, setPriceRange] = useState([100, 500]);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("rating");

  // Fetch beauticians from API
  const { data: beauticiansData, isLoading } = useQuery<BeauticianData[]>({
    queryKey: ["/api/beauticians"],
  });

  // Apply URL parameters on component load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locationParam = params.get('location');
    const serviceParam = params.get('service');

    if (locationParam) {
      setSearchQuery(locationParam);
    }
    if (serviceParam) {
      setSelectedService(serviceParam);
    }
  }, [location]);

  const handleViewProfile = (beauticianId: string) => {
    window.location.href = `/beauticians/${beauticianId}`;
  };

  // Helper function to format availability
  const formatAvailability = (availabilityJson: string): string => {
    try {
      const availability = JSON.parse(availabilityJson);
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayAbbreviations = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      const availableDays = days.filter(day => availability[day] === true);
      
      if (availableDays.length === 0) {
        return "Availability not set";
      }
      
      if (availableDays.length === 7) {
        return "Available 7 days a week";
      }
      
      const availableDayNames = availableDays.map(day => {
        const index = days.indexOf(day);
        return dayAbbreviations[index];
      });
      
      return `Available: ${availableDayNames.join(', ')}`;
    } catch (error) {
      return "Availability not set";
    }
  };

  // Map API data to display format
  const beauticians = (beauticiansData || []).map((b, index) => ({
    id: b.id,
    name: b.name,
    image: profileImages[index % profileImages.length],
    specialties: ["Beauty Services"],
    rating: parseFloat(b.rating) || 0,
    reviewCount: b.reviewCount,
    startingPrice: b.startingPrice,
    location: b.serviceAreas[0] || "Dubai",
    yearsExperience: b.experience === '1-2' ? 2 : b.experience === '3-5' ? 4 : b.experience === '6-10' ? 8 : 10,
    availability: b.availability,
  }));

  const filteredBeauticians = beauticians
    .filter((beautician) => {
      const matchesSearch = beautician.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        beautician.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesService = selectedService === "all" || 
        beautician.specialties.some(s => s.toLowerCase().includes(selectedService.toLowerCase()));
      const matchesLocation = selectedLocation === "all" || beautician.location === selectedLocation;
      const matchesPrice = beautician.startingPrice >= priceRange[0] && beautician.startingPrice <= priceRange[1];
      const matchesRating = beautician.rating >= minRating;

      return matchesSearch && matchesService && matchesLocation && matchesPrice && matchesRating;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "price-low":
          return a.startingPrice - b.startingPrice;
        case "price-high":
          return b.startingPrice - a.startingPrice;
        case "reviews":
          return b.reviewCount - a.reviewCount;
        default:
          return 0;
      }
    });

  const clearFilters = () => {
    setSelectedService("all");
    setSelectedLocation("all");
    setPriceRange([100, 400]);
    setMinRating(0);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-card border-b py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Find Your Perfect Beautician
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Browse Dubai's finest certified beauty professionals for luxury home services
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 md:h-12"
                    data-testid="input-search-beauticians"
                  />
                </div>
                <Button
                  variant="outline"
                  className="h-11 md:h-12 sm:w-auto"
                  onClick={() => setShowFilters(!showFilters)}
                  data-testid="button-toggle-filters"
                >
                  <SlidersHorizontal className="h-5 w-5 mr-2" />
                  Filters
                  {showFilters && <X className="h-4 w-4 ml-2" />}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Filters & Results */}
        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <aside className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-lg">Filters</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        data-testid="button-clear-filters"
                      >
                        Clear All
                      </Button>
                    </div>

                    <div className="space-y-6">
                      {/* Service Type */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Service Type</label>
                        <Select value={selectedService} onValueChange={setSelectedService}>
                          <SelectTrigger data-testid="select-service-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Services</SelectItem>
                            <SelectItem value="makeup">Makeup</SelectItem>
                            <SelectItem value="lashes">Lash Extensions</SelectItem>
                            <SelectItem value="manicure">Manicure</SelectItem>
                            <SelectItem value="pedicure">Pedicure</SelectItem>
                            <SelectItem value="nails">Nails</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Location */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Location</label>
                        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                          <SelectTrigger data-testid="select-location-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            <SelectItem value="Dubai Marina">Dubai Marina</SelectItem>
                            <SelectItem value="Downtown Dubai">Downtown Dubai</SelectItem>
                            <SelectItem value="Jumeirah">Jumeirah</SelectItem>
                            <SelectItem value="Palm Jumeirah">Palm Jumeirah</SelectItem>
                            <SelectItem value="Business Bay">Business Bay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Price Range */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Price Range: د.إ {priceRange[0]} - {priceRange[1]}
                        </label>
                        <Slider
                          min={100}
                          max={400}
                          step={10}
                          value={priceRange}
                          onValueChange={setPriceRange}
                          className="mt-4"
                          data-testid="slider-price-range"
                        />
                      </div>

                      {/* Minimum Rating */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                        <Select value={minRating.toString()} onValueChange={(v) => setMinRating(Number(v))}>
                          <SelectTrigger data-testid="select-rating-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">All Ratings</SelectItem>
                            <SelectItem value="4">4+ Stars</SelectItem>
                            <SelectItem value="4.5">4.5+ Stars</SelectItem>
                            <SelectItem value="4.8">4.8+ Stars</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </aside>

              {/* Beauticians Grid */}
              <div className="lg:col-span-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-muted-foreground" data-testid="text-results-count">
                        {filteredBeauticians.length} beautician{filteredBeauticians.length !== 1 ? 's' : ''} found
                      </p>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-48" data-testid="select-sort">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating">Highest Rated</SelectItem>
                          <SelectItem value="price-low">Price: Low to High</SelectItem>
                          <SelectItem value="price-high">Price: High to Low</SelectItem>
                          <SelectItem value="reviews">Most Reviews</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredBeauticians.map((beautician) => (
                        <Card key={beautician.id} className="hover-elevate transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="flex gap-4 mb-4">
                              <Avatar className="h-20 w-20">
                                <AvatarImage src={beautician.image} alt={beautician.name} />
                                <AvatarFallback>{beautician.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1" data-testid={`text-beautician-name-${beautician.id}`}>
                                  {beautician.name}
                                </h3>
                                <div className="flex items-center gap-1 mb-2">
                                  <Star className="h-4 w-4 fill-primary text-primary" />
                                  <span className="font-medium">{beautician.rating}</span>
                                  <span className="text-sm text-muted-foreground">
                                    ({beautician.reviewCount} reviews)
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  {beautician.location}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                              {beautician.specialties.map((specialty, idx) => (
                                <Badge key={idx} variant="secondary" data-testid={`badge-specialty-${beautician.id}-${idx}`}>
                                  {specialty}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                              <div>
                                <p className="text-sm text-muted-foreground">Starting from</p>
                                <p className="font-semibold text-lg">د.إ {beautician.startingPrice}</p>
                              </div>
                              <Button 
                                onClick={() => handleViewProfile(beautician.id)}
                                data-testid={`button-view-profile-${beautician.id}`}
                              >
                                View Profile
                              </Button>
                            </div>

                            <p className="text-sm text-primary mt-3" data-testid={`text-availability-${beautician.id}`}>
                              {formatAvailability(beautician.availability)}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {filteredBeauticians.length === 0 && (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <p className="text-muted-foreground text-lg mb-4">
                            No beauticians found matching your criteria
                          </p>
                          <Button onClick={clearFilters} variant="outline" data-testid="button-clear-filters-empty">
                            Clear Filters
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
