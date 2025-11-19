import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";

const reviews = [
  { name: "Fatima Al-Hashimi", location: "Dubai Marina", rating: 5, text: "The lash extensions are absolutely stunning! The beautician came right to my villa and the service was so professional. My lashes lasted 6 weeks and looked natural and beautiful. Perfect for busy moms like me!", image: "" },
  { name: "Noura Ahmed", location: "Downtown Dubai", rating: 5, text: "I was preparing for my sister's wedding and booked makeup and hair. The artist understood exactly what I wanted - elegant but not too much. Everyone asked who did my makeup! Will definitely book again for my own wedding.", image: "" },
  { name: "Maryam Al-Mansouri", location: "Jumeirah", rating: 5, text: "As a working professional, I don't have time to go to salons. This service is a blessing! The manicure quality is salon-level but I can do it during lunch break at home. The beautician is always on time and very respectful.", image: "" },
  { name: "Layla Hassan", location: "Palm Jumeirah", rating: 5, text: "I tried the pedicure service for my mother-in-law and she absolutely loved it! The beautician was so gentle and kind. Now we book monthly sessions together. It's become our special bonding time.", image: "" },
  { name: "Aisha Al-Mazrouei", location: "Arabian Ranches", rating: 5, text: "The makeup artist made me feel like a queen! She used high-quality products and took time to understand my skin tone and preferences. I felt confident and beautiful at my event. Highly recommend!", image: "" },
  { name: "Hessa Mohammed", location: "Business Bay", rating: 5, text: "I was skeptical about home services but this exceeded all my expectations. The hygiene standards are excellent, all tools were sanitized, and the results are amazing. My nails have never looked better!", image: "" },
  { name: "Shamma Al-Ketbi", location: "JBR", rating: 5, text: "Perfect service for those of us who value privacy and comfort. The beautician is professional, discreet, and talented. My lash extensions look so natural that people think they're real!", image: "" },
  { name: "Sara Abdullah", location: "Dubai Hills", rating: 5, text: "I booked the full package - manicure, pedicure, and makeup for my graduation. My mother was with me and we both got pampered together at home. The experience was wonderful and stress-free.", image: "" },
  { name: "Amira Al-Nuaimi", location: "Mirdif", rating: 5, text: "The beautician who came to my home was so skilled and friendly. She gave me tips on nail care and recommended products that actually work. It feels like having a personal beauty consultant!", image: "" },
  { name: "Mariam Khalifa", location: "Discovery Gardens", rating: 5, text: "As a new mother, going to salons is impossible. This service is a lifesaver! I can get my nails done while my baby naps. The beautician is understanding and works around my schedule.", image: "" },
  { name: "Latifa Al-Sharqi", location: "Al Barsha", rating: 5, text: "I've tried many makeup artists in Dubai and this is by far the best experience. The artist listened to what I wanted and delivered perfection. My skin looked flawless and the makeup lasted all night.", image: "" },
  { name: "Hanan Salem", location: "Motor City", rating: 5, text: "The pedicure was so relaxing and thorough. She took care of every detail and my feet feel amazing. I appreciated that she brought all professional equipment. Will be a regular customer!", image: "" },
  { name: "Alia Al-Shamsi", location: "Dubai Sports City", rating: 5, text: "I was nervous about getting lash extensions but the beautician explained everything and made me feel comfortable. The results are gorgeous! My eyes look so much bigger and I wake up feeling beautiful.", image: "" },
  { name: "Salama Rashid", location: "Emirates Hills", rating: 5, text: "Exceptional service! The beautician arrived on time with all equipment, was very professional, and the quality is exactly like high-end salons. The convenience of home service is unbeatable.", image: "" },
  { name: "Maitha Al-Falasi", location: "Jumeirah Lake Towers", rating: 5, text: "I book monthly manicures for myself and my daughters. It's become our girls' day tradition. The beautician is patient with my young daughters and makes it fun for them too!", image: "" },
  { name: "Shamsa Hamad", location: "Green Community", rating: 5, text: "The makeup for my engagement party was absolutely stunning. Everyone complimented my look and asked for the artist's contact. She understood exactly the elegant look I wanted.", image: "" },
  { name: "Mozah Al-Mansoori", location: "Dubai Marina", rating: 5, text: "I love that I can book same-day appointments! Last minute event preparation is no longer stressful. The service is reliable, professional, and the results are always perfect.", image: "" },
  { name: "Reem Abdullah", location: "Al Sufouh", rating: 5, text: "The lash extensions transformed my look! I don't need mascara anymore and I wake up ready. The beautician was gentle and precise. Highly recommend to all my friends!", image: "" },
  { name: "Mahra Saeed", location: "Jumeirah Village Circle", rating: 5, text: "Best pedicure I've ever had! She used luxury products and the massage was so relaxing. My feet are soft and the polish application is perfect. Already booked my next appointment.", image: "" },
  { name: "Hessa Khalfan", location: "Dubai Silicon Oasis", rating: 5, text: "As someone who wears abaya daily, I appreciate the privacy of home service. The beautician respects our culture and values. The manicure quality is excellent and long-lasting.", image: "" },
  { name: "Ayesha Majid", location: "International City", rating: 5, text: "The makeup artist is truly talented! She enhanced my natural features without making me look overdone. Perfect for a professional working woman who wants to look polished.", image: "" },
  { name: "Sheikha Al-Maktoum", location: "Nad Al Sheba", rating: 5, text: "I hosted a small gathering and booked the beautician for myself and three friends. We all got manicures together - it was like having a spa party at home! Everyone loved it.", image: "" },
  { name: "Rawdha Hamdan", location: "Jumeirah Park", rating: 5, text: "The professionalism is outstanding. Clean tools, quality products, and skilled techniques. My gel manicure lasted 3 weeks without chipping. This is now my go-to beauty service!", image: "" },
  { name: "Moza Ali", location: "The Springs", rating: 5, text: "I was preparing for family photos and needed everything perfect. The makeup artist created a flawless, camera-ready look that photographed beautifully. My husband couldn't stop complimenting!", image: "" },
];

export default function ReviewsCarousel() {
  const [scrollPosition, setScrollPosition] = useState(0);
  
  const getReviewsPerPage = () => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  };
  
  const [reviewsPerPage, setReviewsPerPage] = useState(getReviewsPerPage());
  
  useEffect(() => {
    const handleResize = () => {
      setReviewsPerPage(getReviewsPerPage());
      setScrollPosition(0);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Continuous auto-scroll effect (right to left, Mac-style)
  useEffect(() => {
    const interval = setInterval(() => {
      setScrollPosition((prev) => {
        const totalPages = Math.ceil(reviews.length / reviewsPerPage);
        const nextPosition = prev + 1;
        // Loop back to start for infinite scrolling
        return nextPosition >= totalPages ? 0 : nextPosition;
      });
    }, 4000); // Scroll every 4 seconds

    return () => clearInterval(interval);
  }, [reviewsPerPage]);

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  return (
    <section className="py-24 px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Loved by Dubai Women
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us for their beauty needs
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-1000 ease-in-out gap-8"
              style={{
                transform: `translateX(-${scrollPosition * 100}%)`,
              }}
            >
              {Array.from({ length: totalPages }).map((_, pageIndex) => (
                <div
                  key={pageIndex}
                  className={`min-w-full grid gap-8 ${
                    reviewsPerPage === 1 ? 'grid-cols-1' :
                    reviewsPerPage === 2 ? 'grid-cols-2' :
                    'grid-cols-3'
                  }`}
                >
                  {reviews
                    .slice(pageIndex * reviewsPerPage, (pageIndex + 1) * reviewsPerPage)
                    .map((review, idx) => (
                      <Card key={`${pageIndex}-${idx}`} className="hover-elevate transition-all duration-300">
                        <CardContent className="p-6">
                          <Quote className="h-8 w-8 text-primary/20 mb-4" />
                          <div className="flex gap-1 mb-4">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                            ))}
                          </div>
                          <p className="text-foreground mb-6 leading-relaxed" data-testid={`text-review-${pageIndex}-${idx}`}>
                            "{review.text}"
                          </p>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {review.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm" data-testid={`text-reviewer-name-${pageIndex}-${idx}`}>
                                {review.name}
                              </p>
                              <p className="text-xs text-muted-foreground" data-testid={`text-reviewer-location-${pageIndex}-${idx}`}>
                                {review.location}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Minimal progress indicators */}
        <div className="flex justify-center gap-2 mt-12">
          {Array.from({ length: totalPages }).map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === scrollPosition ? "w-8 bg-primary" : "w-1.5 bg-muted"
              }`}
              data-testid={`indicator-reviews-${index}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
