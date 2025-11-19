import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What beauty services does Kosmospace offer in Dubai?",
    answer: "Kosmospace offers premium home beauty services including manicures, pedicures, eyelash extensions, professional makeup, bridal makeup, hair styling, keratin treatments, and spa services. All services are delivered by certified beauticians in the comfort of your home across Dubai."
  },
  {
    question: "How do I book a beautician through Kosmospace?",
    answer: "Booking is simple! Browse our verified beauticians on the platform, select your desired service, choose a convenient time slot, and confirm your booking. You can book online 24/7 through our website. Payment is processed securely through our platform."
  },
  {
    question: "What areas in Dubai does Kosmospace serve?",
    answer: "Kosmospace provides beauty services across all major areas in Dubai including Dubai Marina, JBR, Downtown Dubai, Business Bay, Jumeirah, Palm Jumeirah, Arabian Ranches, Dubai Hills, and more. Check the beautician's service areas when booking to ensure coverage in your location."
  },
  {
    question: "Are Kosmospace beauticians certified and experienced?",
    answer: "Yes, all beauticians on Kosmospace are thoroughly vetted, certified professionals with verified experience. We conduct background checks and verify qualifications before approving beauticians on our platform. You can view each beautician's experience, specialties, and customer reviews before booking."
  },
  {
    question: "How much do home beauty services cost in Dubai?",
    answer: "Prices vary by service and beautician expertise. Manicures typically start from د.إ 100, pedicures from د.إ 120, lash extensions from د.إ 200, and makeup services from د.إ 250. Bridal packages range from د.إ 800 to د.إ 2000. Each beautician lists their prices on their profile for full transparency."
  },
  {
    question: "Can I book same-day beauty services?",
    answer: "Yes! Many of our beauticians offer same-day bookings subject to availability. Use our search filters to find beauticians with immediate availability. For guaranteed booking, we recommend scheduling 24-48 hours in advance, especially for weekend appointments."
  },
  {
    question: "What payment methods does Kosmospace accept?",
    answer: "We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure Stripe payment gateway. Payment is processed when you confirm your booking online."
  },
  {
    question: "Is there a cancellation policy?",
    answer: "Yes, you can cancel up to 24 hours before your appointment for a full refund. Cancellations within 24 hours may incur a cancellation fee. Please refer to our cancellation policy during checkout for full details."
  },
  {
    question: "Do beauticians bring their own supplies and equipment?",
    answer: "Yes, all our beauticians come fully equipped with professional-grade products, tools, and equipment needed for your service. They use premium brands and maintain the highest hygiene standards."
  },
  {
    question: "Can I book bridal makeup and beauty services?",
    answer: "Absolutely! We have specialized bridal makeup artists and beauty experts offering comprehensive bridal packages including trial makeup, wedding day makeup, hair styling, mehndi, and pre-wedding beauty treatments. Book early to secure your preferred date."
  },
  {
    question: "How does Kosmospace ensure quality and safety?",
    answer: "Quality and safety are our top priorities. All beauticians undergo background checks and qualification verification. We monitor customer reviews and ratings, and maintain strict hygiene and safety standards. You can review ratings and feedback from previous customers before booking."
  },
  {
    question: "Can I request specific beauticians?",
    answer: "Yes! Browse beautician profiles to see their specialties, experience, customer reviews, and availability. You can book your preferred beautician directly. Save your favorites for easy rebooking."
  }
];

export default function FAQ() {
  useEffect(() => {
    // Add FAQ Schema markup for Google rich snippets
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    const existingSchema = document.querySelector('#faq-schema');
    if (existingSchema) {
      existingSchema.remove();
    }

    const script = document.createElement('script');
    script.id = 'faq-schema';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const schemaElement = document.querySelector('#faq-schema');
      if (schemaElement) {
        schemaElement.remove();
      }
    };
  }, []);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about booking luxury beauty services at home in Dubai
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-card border rounded-lg px-6"
              data-testid={`faq-item-${index}`}
            >
              <AccordionTrigger 
                className="text-left hover:no-underline py-6"
                data-testid={`faq-question-${index}`}
              >
                <span className="font-semibold text-base">
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent 
                className="text-muted-foreground pb-6 pt-2"
                data-testid={`faq-answer-${index}`}
              >
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Still have questions?
          </p>
          <p className="text-sm text-muted-foreground">
            Contact us at{" "}
            <a 
              href="mailto:support@kosmospace.com" 
              className="text-primary hover:underline"
            >
              support@kosmospace.com
            </a>
            {" "}or via WhatsApp for immediate assistance.
          </p>
        </div>
      </div>
    </section>
  );
}
