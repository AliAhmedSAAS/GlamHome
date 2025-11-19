import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

export default function BeauticianCTA() {
  const [, navigate] = useLocation();
  const benefits = [
    "Set your own schedule and prices",
    "Access to premium clientele in Dubai",
    "Secure payment processing with quick payouts",
    "Marketing and booking platform included",
  ];

  return (
    <section className="py-24 px-6 lg:px-8 bg-primary text-primary-foreground">
      <div className="max-w-5xl mx-auto">
        <Card className="bg-primary-foreground/10 backdrop-blur-sm border-primary-foreground/20">
          <div className="p-6 md:p-12">
            <div className="text-center mb-12">
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-primary-foreground">
                Join Our Network of Elite Beauticians
              </h2>
              <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
                Build your business with Dubai's premier luxury beauty service platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-primary-foreground/90" data-testid={`text-benefit-${index}`}>
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button
                size="lg"
                variant="outline"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 border-0 h-12 px-8"
                data-testid="button-apply-now"
                onClick={() => navigate('/become-beautician')}
              >
                Apply to Join Now
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
