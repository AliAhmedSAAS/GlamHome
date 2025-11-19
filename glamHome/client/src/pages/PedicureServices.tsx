import { Link } from "wouter";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Sparkles, Home, Heart } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function PedicureServices() {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Pedicure Services",
      "provider": {
        "@type": "LocalBusiness",
        "@id": "https://www.kosmospace.com/#business",
        "name": "Kosmospace"
      },
      "areaServed": {
        "@type": "City",
        "name": "Dubai"
      },
      "description": "Professional home pedicure services in Dubai. Expert foot care including classic pedicures, spa pedicures, and luxury foot treatments delivered to your location.",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "AED",
        "lowPrice": "120",
        "highPrice": "300"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(s => {
        if (s.textContent?.includes('"serviceType": "Pedicure Services"')) {
          s.remove();
        }
      });
    };
  }, []);

  return (
    <div className="min-h-screen">
      <SEOHead 
        title="Pedicure Dubai | Home Pedicure Services | Spa & Luxury Foot Care | Kosmospace"
        description="Book professional pedicure services at home in Dubai. Expert foot care including classic pedicures, spa pedicures, gel pedicures, and luxury treatments. Available across all Dubai areas. د.إ 120-300."
        keywords="pedicure Dubai, home pedicure Dubai, spa pedicure, mobile pedicure, pedicure at home, Dubai foot care, luxury pedicure, gel pedicure Dubai, nail salon Dubai"
      />
      <Header />
      
      <main>
        <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <Heart className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Luxury Foot Care</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-6">
                Pedicure Services Dubai
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Indulge in relaxing, professional pedicure services in the comfort of your Dubai home
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/find-beauticians">
                  <Button size="lg" className="gap-2" data-testid="button-book-pedicure">
                    <Home className="w-5 h-5" />
                    Book Home Pedicure
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="hover-elevate">
                <CardContent className="p-6 text-center">
                  <Home className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Home Service</h3>
                  <p className="text-sm text-muted-foreground">
                    Relax at home while our experts care for your feet
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Spa-Quality</h3>
                  <p className="text-sm text-muted-foreground">
                    Professional treatments with premium products and tools
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-6 text-center">
                  <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Relaxing Experience</h3>
                  <p className="text-sm text-muted-foreground">
                    Extended foot massages and luxury pampering
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif font-bold mb-8">
              Professional Pedicure Services at Your Location
            </h2>

            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Treat your feet to the pampering they deserve with professional pedicure services delivered to your home in Dubai. Our certified foot care specialists bring everything needed for a complete spa-quality pedicure experience, allowing you to relax in comfort while receiving exceptional care.
              </p>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Our Pedicure Treatments
              </h3>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Classic Pedicure (د.إ 120-160):</strong> Nail care, cuticle treatment, exfoliation, and polish</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Spa Pedicure (د.إ 180-220):</strong> Deep exfoliation, hydrating mask, extended massage, and premium polish</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Gel Pedicure (د.إ 160-220):</strong> Long-lasting gel polish application for chip-free results</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Luxury Pedicure (د.إ 250-300):</strong> Premium spa treatment with paraffin wax, aromatherapy, and extended relaxation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Medical Pedicure:</strong> Specialized care for foot concerns including calluses and ingrown nails</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>French Pedicure:</strong> Classic French tips for an elegant, timeless look</span>
                </li>
              </ul>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Complete Pedicure Process
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Every pedicure session includes a comprehensive foot care routine:
              </p>
              
              <ol className="space-y-3 mb-8 list-decimal list-inside">
                <li className="text-muted-foreground">Warm foot soak with aromatic salts to soften skin and relax feet</li>
                <li className="text-muted-foreground">Nail trimming and professional shaping</li>
                <li className="text-muted-foreground">Gentle cuticle care and treatment</li>
                <li className="text-muted-foreground">Exfoliation to remove dead skin and calluses</li>
                <li className="text-muted-foreground">Hydrating foot mask application</li>
                <li className="text-muted-foreground">Extended relaxing foot and calf massage</li>
                <li className="text-muted-foreground">Perfect polish application (regular or gel)</li>
                <li className="text-muted-foreground">Moisturizing treatment for soft, smooth feet</li>
              </ol>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Benefits of Home Pedicure Services
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Home pedicures offer ultimate convenience and hygiene. Our specialists bring their own sanitized equipment, premium products, and portable foot spas. You can enjoy your treatment while catching up on work, watching your favorite show, or simply relaxing. No need to drive through traffic or sit in busy salon waiting areas.
              </p>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Professional Foot Care Specialists
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                All our pedicure specialists are certified professionals trained in proper foot care techniques, hygiene standards, and customer service. They understand foot health and can provide expert advice on maintaining healthy, beautiful feet. View their profiles, portfolios, and client reviews to find your perfect match.
              </p>

              <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 my-8">
                <h4 className="font-semibold mb-2 text-lg">💅 Combo Packages Available</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Save with our popular combination packages:
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Mani-Pedi Combo:</strong> Complete nail care for hands and feet (from د.إ 220)</li>
                  <li>• <strong>Monthly Maintenance Package:</strong> Regular monthly sessions with special rates</li>
                  <li>• <strong>Bridal Packages:</strong> Pre-wedding pampering with trial sessions</li>
                </ul>
              </div>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Service Coverage
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We serve all areas of Dubai including Dubai Marina, JBR, Downtown, Business Bay, Palm Jumeirah, Jumeirah, Arabian Ranches, Dubai Hills, and surrounding areas. Book easily online and enjoy professional foot care wherever you are.
              </p>
            </div>

            <div className="mt-12 text-center">
              <Link href="/find-beauticians">
                <Button size="lg" className="gap-2" data-testid="button-browse-specialists">
                  Browse Pedicure Specialists
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
