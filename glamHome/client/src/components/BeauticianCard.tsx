import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin } from "lucide-react";

interface BeauticianCardProps {
  name: string;
  image: string;
  specialties: string[];
  rating: number;
  bookingCount: number;
  startingPrice: string;
  location: string;
}

export default function BeauticianCard({
  name,
  image,
  specialties,
  rating,
  bookingCount,
  startingPrice,
  location,
}: BeauticianCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1" data-testid="text-beautician-name">
              {name}
            </h3>
            <div className="flex items-center gap-1 mb-2">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-medium" data-testid="text-beautician-rating">
                {rating}
              </span>
              <span className="text-sm text-muted-foreground">
                ({bookingCount} bookings)
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span data-testid="text-location">{location}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {specialties.map((specialty) => (
            <Badge key={specialty} variant="secondary" className="text-xs">
              {specialty}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Starting from</p>
            <p className="font-semibold text-lg" data-testid="text-starting-price">
              {startingPrice}
            </p>
          </div>
          <Button data-testid="button-view-profile">
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
