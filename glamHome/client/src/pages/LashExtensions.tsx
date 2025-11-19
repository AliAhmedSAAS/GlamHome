import { Link } from "wouter";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Sparkles, Eye, Clock } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function LashExtensions() {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Eyelash Extension Services",
      "provider": {
        "@type": "LocalBusiness",
        "@id": "https://www.kosmospace.com/#business",
        "name": "Kosmospace"
      },
      "areaServed": {
        "@type": "City",
        "name": "Dubai"
      },
      "description": "Professional eyelash extension services in Dubai. Expert lash technicians providing classic, volume, and hybrid lash extensions at your location.",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "AED",
        "lowPrice": "200",
        "highPrice": "500"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(s => {
        if (s.textContent?.includes('"serviceType": "Eyelash Extension Services"')) {
          s.remove();
        }
      });
    };
  }, []);

  return (
    <div className="min-h-screen">
      <SEOHead 
        title="Lash Extensions Dubai | Eyelash Extensions | Volume & Classic Lashes | Kosmospace"
        description="Book professional eyelash extension services in Dubai. Expert lash technicians for classic, volume, hybrid, and mega volume lash extensions. Home service available across Dubai Marina, JBR, Downtown. د.إ 200-500."
        keywords="lash extensions Dubai, eyelash extensions Dubai, volume lashes Dubai, classic lashes, hybrid lashes, lash artist Dubai, home lash extensions, mobile lash technician Dubai"
      />
      <Header />
      
      <main>
        <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Certified Lash Artists</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-6">
                Lash Extensions Dubai
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Wake up to gorgeous lashes every day with professional eyelash extensions applied at your location
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/find-beauticians">
                  <Button size="lg" className="gap-2" data-testid="button-book-lashes">
                    <Eye className="w-5 h-5" />
                    Book Lash Extensions
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="hover-elevate">
                <CardContent className="p-6 text-center">
                  <Eye className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Expert Application</h3>
                  <p className="text-sm text-muted-foreground">
                    Certified lash technicians with years of experience
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Premium Lashes</h3>
                  <p className="text-sm text-muted-foreground">
                    High-quality synthetic mink and silk lashes
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-6 text-center">
                  <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Long-Lasting</h3>
                  <p className="text-sm text-muted-foreground">
                    Lasts 4-6 weeks with proper care and fills
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif font-bold mb-8">
              Professional Lash Extensions in Dubai
            </h2>

            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Transform your look with stunning eyelash extensions applied by certified lash artists in the comfort of your Dubai home. Say goodbye to mascara and hello to effortlessly beautiful lashes that last for weeks. Kosmospace connects you with skilled professionals who specialize in creating customized lash looks that enhance your natural beauty.
              </p>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Lash Extension Styles & Pricing
              </h3>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Classic Lash Extensions (د.إ 200-300):</strong> One extension per natural lash for a natural, mascara-like effect</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Volume Lashes (د.إ 300-400):</strong> Multiple lightweight extensions per lash for fuller, dramatic volume</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Hybrid Lashes (د.إ 280-380):</strong> Perfect blend of classic and volume techniques for textured fullness</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Mega Volume (د.إ 400-500):</strong> Ultra-dramatic, fluffy lashes with maximum volume</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Lash Fills (د.إ 120-250):</strong> Maintain your gorgeous lashes with regular 2-3 week touch-ups</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Lash Removal (د.إ 50-80):</strong> Safe, professional removal when you're ready for a break</span>
                </li>
              </ul>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                The Lash Extension Process
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Your lash extension appointment includes:
              </p>
              
              <ol className="space-y-3 mb-8 list-decimal list-inside">
                <li className="text-muted-foreground">Consultation to discuss your desired look, length, and curl preference</li>
                <li className="text-muted-foreground">Eye examination to ensure suitability and check natural lash health</li>
                <li className="text-muted-foreground">Professional cleansing of the eye area</li>
                <li className="text-muted-foreground">Precise application of individual lash extensions (1.5-3 hours depending on style)</li>
                <li className="text-muted-foreground">Quality check to ensure symmetry and proper application</li>
                <li className="text-muted-foreground">Aftercare instructions for maximum longevity</li>
              </ol>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Why Choose Home Lash Extension Services?
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Lash extensions typically take 1.5-3 hours to apply, making home service incredibly convenient. You can relax on your own couch, listen to music, or even nap while our artists work their magic. No fighting Dubai traffic or salon parking hassles. Our technicians bring professional-grade adhesives, premium lashes, and all necessary equipment to create a comfortable, private experience in your home.
              </p>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Certified Lash Technicians
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                All our lash artists are certified and trained in proper application techniques, safety, and hygiene. They use only premium synthetic mink or silk lashes and medical-grade, formaldehyde-free adhesives. Each technician's profile showcases their work, specialties, and client reviews, helping you find the perfect artist for your desired style.
              </p>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Lash Care & Maintenance
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                With proper care, your lash extensions can last 4-6 weeks. We recommend fills every 2-3 weeks to maintain fullness as your natural lashes shed. Our technicians provide detailed aftercare instructions including:
              </p>

              <ul className="space-y-2 mb-6 list-disc list-inside text-muted-foreground">
                <li>Avoiding water and steam for the first 24 hours</li>
                <li>Using oil-free makeup removers and cleansers</li>
                <li>Gentle cleansing with lash-safe products</li>
                <li>Brushing lashes daily with a clean spoolie</li>
                <li>Avoiding mascara (you won't need it!)</li>
              </ul>

              <div className="bg-accent/10 p-6 rounded-lg border my-8">
                <h4 className="font-semibold mb-2 text-lg">👁️ First-Time Special Offers</h4>
                <p className="text-sm text-muted-foreground">
                  Many of our lash artists offer special introductory pricing for first-time clients. Check their profiles for current promotions and package deals that include complimentary lash serum or discounted fill appointments.
                </p>
              </div>

              <h3 className="text-2xl font-serif font-semibold mt-8 mb-4">
                Service Coverage
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our lash artists serve all Dubai areas including Dubai Marina, JBR, Downtown Dubai, Business Bay, Palm Jumeirah, Jumeirah, Arabian Ranches, Dubai Hills, and more. Book online and enjoy beautiful lashes without leaving home.
              </p>
            </div>

            <div className="mt-12 text-center">
              <Link href="/find-beauticians">
                <Button size="lg" className="gap-2" data-testid="button-find-artist">
                  Find Your Lash Artist
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
