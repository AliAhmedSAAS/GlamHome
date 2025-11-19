import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, MapPin, Check, ChevronsUpDown } from "lucide-react";
import heroImage from "@assets/generated_images/Hero_makeup_service_Dubai_2d4fb52b.png";
import { DUBAI_AREAS } from "@shared/dubaiAreas";
import { cn } from "@/lib/utils";

export default function HeroSection() {
  const [, navigate] = useLocation();
  const [location, setLocation] = useState("");
  const [service, setService] = useState("");
  const [openLocationCombobox, setOpenLocationCombobox] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (service) params.set('service', service);
    
    navigate(`/find-beauticians${params.toString() ? '?' + params.toString() : ''}`);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center py-24">
        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
          Luxury Beauty Services
          <span className="block mt-2">At Your Doorstep</span>
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto">
          Experience premium manicures, pedicures, lash extensions, and makeup artistry in the comfort of your Dubai home
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            size="lg"
            variant="default"
            className="text-base h-12 px-8"
            onClick={() => navigate('/find-beauticians')}
            data-testid="button-book-now"
          >
            Book Now
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base h-12 px-8 bg-background/20 backdrop-blur-sm border-white/30 text-white hover:bg-background/30"
            onClick={() => navigate('/become-beautician')}
            data-testid="button-become-beautician-hero"
          >
            Become a Beautician
          </Button>
        </div>

        <div className="bg-background/95 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-2xl max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Popover open={openLocationCombobox} onOpenChange={setOpenLocationCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openLocationCombobox}
                    className="w-full justify-start h-11 md:h-12 pl-10 font-normal"
                    data-testid="button-select-location-hero"
                  >
                    <MapPin className="absolute left-3 h-5 w-5 text-muted-foreground" />
                    {location || "Dubai location"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start" side="top">
                  <Command>
                    <CommandInput 
                      placeholder="Search Dubai areas..." 
                      data-testid="input-search-location-hero"
                    />
                    <CommandList>
                      <CommandEmpty>No area found.</CommandEmpty>
                      <CommandGroup>
                        {DUBAI_AREAS.map((area) => (
                          <CommandItem
                            key={area}
                            value={area}
                            onSelect={(currentValue) => {
                              setLocation(currentValue === location ? "" : currentValue);
                              setOpenLocationCombobox(false);
                            }}
                            data-testid={`option-location-hero-${area.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                location === area ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {area}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1">
              <Select value={service} onValueChange={setService}>
                <SelectTrigger className="h-11 md:h-12" data-testid="select-service-trigger">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manicure">Manicure</SelectItem>
                  <SelectItem value="pedicure">Pedicure</SelectItem>
                  <SelectItem value="lashes">Lash Extensions</SelectItem>
                  <SelectItem value="makeup">Makeup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              size="lg" 
              className="h-11 md:h-12 px-6 md:px-8" 
              onClick={handleSearch}
              data-testid="button-search"
            >
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
