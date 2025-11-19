import { Link } from "wouter";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Sparkles, Home, Clock } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function ManicureServices() {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Manicure Services",
      "provider": {
        "@type": "LocalBusiness",
        "@id": "https://www.kosmospace.com/#business",
        "name": "Kosmospace"
      },
      "areaServed": {
        "@type": "City",
        "name": "Dubai"
      },
      "description": "Professional home manicure services in Dubai. Expert nail technicians providing classic manicures, gel manicures, and luxury nail treatments in the comfort of your home.",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "AED",
        "lowPrice": "100",
        "highPrice": "250"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(s => {
        if (s.textContent?.includes('"serviceType": "Manicure Services"')) {
          s.remove();
        }
      });
    };
  }, []);

  return (
    <div className="min-h-screen">
      <SEOHead 
        title="Manicure Dubai | Home Manicure Services | Gel & Classic Nails | Kosmospace"
        description="Book professional manicure services at home in Dubai. Expert nail technicians for classic manicures, gel manicures, nail art, and luxury treatments. Available across Dubai Marina, JBR, Downtown. د.إ 100-250."
        keywords="manicure Dubai, home manicure Dubai, gel manicure Dubai, nail technician Dubai, mobile manicure, manicure at home, Dubai nail services, luxury manicure, nail art Dubai"
      />
      <Header />
      
      <main>
        <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Professional Nail Care</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-6">
                Manicure Services Dubai
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Premium manicure services delivered to your home, office, or hotel anywhere in Dubai
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/find-beauticians">
                  <Button size="lg" className="gap-2" data-testid="button-book-manicure">
                    <Home className="w-5 h-5" />
                    Book Home Manicure
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="hover-elevate">
                <CardContent className="p-6 text-center">
                  <Home className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">At Your Location</h3>
                  <p className="text-sm text-muted-foreground">
                    Enjoy salon-quality manicures in the comfort of your home
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Premium Products</h3>
                  <p className="text-sm text-muted-foreground">
                    High-quality polishes and treatments from leading brands
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-6 text-center">
                  <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Flexible Scheduling</h3>
                  <p className="text-sm text-muted-foreground">
                    Book at times that suit you, including evenings and weekends
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif font-bold mb-8">
              Professional Manicure Services at Your Doorstep
            </h2>

            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Transform your nails with professional manicure services delivered directly to your home in Dubai. Kosmospace connects you with certified nail technicians who bring salon-quality care and expertise to your location, saving you time while delivering exceptional results.
              </p>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Our Manicure Services
              </h3>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Classic Manicure (د.إ 100-150):</strong> Nail shaping, cuticle care, hand massage, and polish application</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Gel Manicure (د.إ 150-200):</strong> Long-lasting gel polish that stays chip-free for 2-3 weeks</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>French Manicure (د.إ 120-180):</strong> Timeless classic French tips with perfect white edges</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Luxury Manicure (د.إ 180-250):</strong> Premium treatment with exfoliation, hydrating mask, and extended massage</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Nail Art & Design:</strong> Custom designs, embellishments, and creative nail art</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Nail Repair & Strengthening:</strong> Treatments for damaged or weak nails</span>
                </li>
              </ul>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Why Choose Home Manicure Services?
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Home manicure services offer unmatched convenience and comfort. No more fighting Dubai traffic or waiting in salon queues. Our nail technicians come fully equipped with professional tools, premium polishes, and all necessary supplies. You can enjoy your manicure while relaxing at home, catching up on your favorite show, or even during your lunch break if you work from home.
              </p>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                What to Expect
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Every manicure session includes:
              </p>
              
              <ol className="space-y-3 mb-8 list-decimal list-inside">
                <li className="text-muted-foreground">Consultation to understand your preferences and nail health</li>
                <li className="text-muted-foreground">Professional nail shaping and filing to your desired length and shape</li>
                <li className="text-muted-foreground">Gentle cuticle care and treatment</li>
                <li className="text-muted-foreground">Relaxing hand massage with moisturizing lotion</li>
                <li className="text-muted-foreground">Expert polish application (or gel with UV lamp)</li>
                <li className="text-muted-foreground">Perfect finishing and quick-dry treatment</li>
              </ol>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Certified & Experienced Nail Technicians
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                All our nail technicians are certified professionals with years of experience. They undergo thorough vetting and bring their own sanitized, professional-grade equipment. You can view each technician's portfolio, read reviews from other clients, and choose the perfect match for your style and preferences.
              </p>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Service Areas
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We provide home manicure services across all Dubai areas including Dubai Marina, JBR, Downtown Dubai, Business Bay, Palm Jumeirah, Jumeirah, Arabian Ranches, Dubai Hills, and more. Check availability when booking to ensure your area is covered.
              </p>

              <div className="bg-accent/10 p-6 rounded-lg border my-8">
                <h4 className="font-semibold mb-2 text-lg">💅 Manicure & Pedicure Combo</h4>
                <p className="text-sm text-muted-foreground">
                  Save time and money with our popular manicure + pedicure combo packages. Get both services in one convenient session with special combo pricing starting from د.إ 220.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href="/find-beauticians">
                <Button size="lg" className="gap-2" data-testid="button-book-now">
                  Book Your Manicure Now
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
