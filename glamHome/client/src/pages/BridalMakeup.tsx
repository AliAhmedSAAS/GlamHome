import { Link } from "wouter";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Sparkles, Calendar, Heart } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function BridalMakeup() {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Bridal Makeup Services",
      "provider": {
        "@type": "LocalBusiness",
        "@id": "https://www.kosmospace.com/#business",
        "name": "Kosmospace"
      },
      "areaServed": {
        "@type": "City",
        "name": "Dubai"
      },
      "description": "Professional bridal makeup services in Dubai. Expert makeup artists specializing in wedding makeup, trial sessions, and complete bridal beauty packages. Available across all Dubai areas including Dubai Marina, Downtown, and Palm Jumeirah.",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "AED",
        "lowPrice": "800",
        "highPrice": "2000",
        "offerCount": "50+"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(s => {
        if (s.textContent?.includes('"serviceType": "Bridal Makeup Services"')) {
          s.remove();
        }
      });
    };
  }, []);

  return (
    <div className="min-h-screen">
      <SEOHead 
        title="Bridal Makeup Dubai | Wedding Makeup Artists | د.إ 800-2000 | Kosmospace"
        description="Book professional bridal makeup artists in Dubai. Luxury wedding makeup services with trial sessions, airbrush makeup, and complete bridal packages. Available across Dubai Marina, Downtown, JBR, Palm Jumeirah. Certified makeup artists for your special day."
        keywords="bridal makeup Dubai, wedding makeup artist Dubai, bridal makeup artist, Dubai bridal makeup, wedding makeup services, bridal beauty Dubai, makeup trial Dubai, airbrush bridal makeup, luxury bridal makeup"
      />
      <Header />
      
      <main>
        <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Certified Bridal Makeup Artists</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-6">
                Bridal Makeup Dubai
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Look absolutely stunning on your special day with professional bridal makeup services delivered to your location anywhere in Dubai
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/find-beauticians">
                  <Button size="lg" className="gap-2" data-testid="button-book-now">
                    <Calendar className="w-5 h-5" />
                    Book Your Bridal Makeup
                  </Button>
                </Link>
                <Link href="/#faq">
                  <Button size="lg" variant="outline" data-testid="button-learn-more">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="hover-elevate">
                <CardContent className="p-6 text-center">
                  <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Trial Sessions</h3>
                  <p className="text-sm text-muted-foreground">
                    Perfect your look with complimentary makeup trials before your wedding day
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Premium Products</h3>
                  <p className="text-sm text-muted-foreground">
                    High-end luxury makeup brands for long-lasting, flawless results
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Flexible Timing</h3>
                  <p className="text-sm text-muted-foreground">
                    Early morning bookings available for your wedding day convenience
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif font-bold mb-8">
              Why Choose Kosmospace for Your Bridal Makeup?
            </h2>

            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Your wedding day is one of the most important days of your life, and you deserve to look and feel absolutely stunning. At Kosmospace, we connect you with Dubai's most talented and experienced bridal makeup artists who specialize in creating breathtaking bridal looks that photograph beautifully and last throughout your entire celebration.
              </p>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Complete Bridal Beauty Packages
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our bridal packages include everything you need to look flawless on your special day:
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Makeup Trial Session:</strong> Meet your artist beforehand to perfect your desired look and ensure you're completely happy</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Wedding Day Makeup:</strong> Full face makeup using premium products designed to last 12+ hours and look stunning in photos</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Airbrush Application:</strong> Optional HD airbrush makeup for an ultra-smooth, flawless finish that's perfect for photography</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Hair Styling:</strong> Professional bridal hairstyling to complement your makeup and complete your look</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Touch-Up Kit:</strong> Personal touch-up kit with lipstick and powder for your day</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Bridal Party Services:</strong> Special rates for bridesmaids, mothers, and wedding party members</span>
                </li>
              </ul>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Expert Makeup Artists with Bridal Specialization
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                All our bridal makeup artists are certified professionals with extensive experience in wedding makeup. They understand the unique requirements of bridal beauty - from creating looks that photograph beautifully to ensuring makeup stays fresh and flawless for 12+ hours. Whether you prefer a classic, elegant look or dramatic, glamorous makeup, our artists can bring your vision to life.
              </p>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Pricing & Packages
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our bridal makeup packages range from <strong>د.إ 800 to د.إ 2,000</strong> depending on the artist's experience level and package inclusions. All packages include:
              </p>
              
              <div className="bg-card p-6 rounded-lg border my-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">Essential Bridal Package - د.إ 800</h4>
                    <p className="text-sm text-muted-foreground">Wedding day makeup + basic hair styling</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Luxury Bridal Package - د.إ 1,200</h4>
                    <p className="text-sm text-muted-foreground">Trial + wedding day makeup + professional hair styling + touch-up kit</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Premium Bridal Package - د.إ 1,800-2,000</h4>
                    <p className="text-sm text-muted-foreground">Trial + airbrush wedding makeup + luxury hair styling + touch-up kit + bridal party discounts</p>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Coverage Across All Dubai Areas
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our bridal makeup artists serve all areas of Dubai including Dubai Marina, Downtown Dubai, Palm Jumeirah, JBR, Business Bay, Arabian Ranches, Dubai Hills, Jumeirah, and beyond. We'll come to your home, hotel, or venue at your preferred time - even early morning bookings for dawn weddings.
              </p>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                How to Book Your Bridal Makeup Artist
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Booking your bridal makeup with Kosmospace is simple:
              </p>
              
              <ol className="space-y-3 mb-8 list-decimal list-inside">
                <li className="text-muted-foreground">Browse our portfolio of bridal makeup artists and view their previous work</li>
                <li className="text-muted-foreground">Read reviews from real brides to find your perfect match</li>
                <li className="text-muted-foreground">Select your preferred package and book your trial session</li>
                <li className="text-muted-foreground">Meet your artist for the trial to finalize your look</li>
                <li className="text-muted-foreground">Confirm your wedding day booking and timing</li>
                <li className="text-muted-foreground">Relax and let our expert make you look stunning on your special day</li>
              </ol>

              <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 my-8">
                <h4 className="font-semibold mb-2 text-lg">💍 Book Early for Your Wedding Date</h4>
                <p className="text-sm text-muted-foreground">
                  Popular wedding dates and experienced bridal makeup artists book up quickly in Dubai, especially during peak wedding season (October-April). We recommend booking your bridal makeup artist at least 2-3 months in advance to ensure availability.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href="/find-beauticians">
                <Button size="lg" className="gap-2" data-testid="button-browse-artists">
                  <Sparkles className="w-5 h-5" />
                  Browse Bridal Makeup Artists
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
