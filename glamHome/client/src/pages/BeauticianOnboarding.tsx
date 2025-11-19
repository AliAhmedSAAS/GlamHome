import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";

const SERVICES = [
  { id: "makeup", label: "Makeup" },
  { id: "lashes", label: "Lash Extensions" },
  { id: "manicure", label: "Manicure" },
  { id: "pedicure", label: "Pedicure" },
  { id: "nails", label: "Nail Art" },
];

const LOCATIONS = [
  "Dubai Marina",
  "Downtown Dubai",
  "Jumeirah",
  "Palm Jumeirah",
  "Business Bay",
  "JBR",
  "Arabian Ranches",
];

export default function BeauticianOnboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    fullName: "",
    email: "",
    phone: "",
    
    // Step 2: Professional Details
    services: [] as string[],
    experience: "",
    bio: "",
    
    // Step 3: Business Setup
    serviceAreas: [] as string[],
    startingPrice: "",
    availability: "flexible",
  });

  // Pre-fill user data if logged in (optional - not required)
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim(),
        email: (user as any).email || '',
      }));
    }
  }, [user]);

  const onboardMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/beauticians/onboard", {
        method: "POST",
        body: JSON.stringify({
          // User registration data
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          // Beautician data
          bio: formData.bio,
          experience: formData.experience,
          startingPrice: parseInt(formData.startingPrice),
          availability: formData.availability,
          serviceAreas: formData.serviceAreas,
          services: formData.services,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit application");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you within 24 hours.",
      });
      setTimeout(() => {
        navigate("/");
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const totalSteps = 3;

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1) {
      if (!formData.fullName || !formData.email || !formData.phone) {
        toast({
          title: "Required Fields",
          description: "Please fill in all personal information fields.",
          variant: "destructive",
        });
        return;
      }
    } else if (currentStep === 2) {
      if (formData.services.length === 0 || !formData.experience) {
        toast({
          title: "Required Fields",
          description: "Please select at least one service and your experience level.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (formData.serviceAreas.length === 0 || !formData.startingPrice) {
      toast({
        title: "Required Fields",
        description: "Please select at least one service area and set your starting price.",
        variant: "destructive",
      });
      return;
    }

    onboardMutation.mutate();
  };


  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const toggleLocation = (location: string) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.includes(location)
        ? prev.serviceAreas.filter(l => l !== location)
        : [...prev.serviceAreas, location]
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold">
                Become a Beautician
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join Dubai's premier luxury beauty platform. Simple process, flexible schedule, premium clients.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all ${
                      step < currentStep
                        ? "bg-primary border-primary text-primary-foreground"
                        : step === currentStep
                        ? "border-primary text-primary font-semibold"
                        : "border-muted text-muted-foreground"
                    }`}
                    data-testid={`step-indicator-${step}`}
                  >
                    {step < currentStep ? <Check className="h-5 w-5" /> : step}
                  </div>
                  {step < totalSteps && (
                    <div
                      className={`h-0.5 w-12 sm:w-16 ${
                        step < currentStep ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <span className={`text-sm ${currentStep === 1 ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                Personal
              </span>
              <span className={`text-sm ${currentStep === 2 ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                Professional
              </span>
              <span className={`text-sm ${currentStep === 3 ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                Business
              </span>
            </div>
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && "Personal Information"}
                {currentStep === 2 && "Professional Details"}
                {currentStep === 3 && "Business Setup"}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Tell us about yourself"}
                {currentStep === 2 && "What services do you offer?"}
                {currentStep === 3 && "Where and when do you work?"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="Sarah Al-Mansouri"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      data-testid="input-full-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="sarah@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+971 50 123 4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      data-testid="input-phone"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Professional Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Services You Offer *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {SERVICES.map((service) => (
                        <div key={service.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={service.id}
                            checked={formData.services.includes(service.id)}
                            onCheckedChange={() => toggleService(service.id)}
                            data-testid={`checkbox-service-${service.id}`}
                          />
                          <Label
                            htmlFor={service.id}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {service.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="experience">Years of Experience *</Label>
                    <Select value={formData.experience} onValueChange={(v) => setFormData({ ...formData, experience: v })}>
                      <SelectTrigger data-testid="select-experience">
                        <SelectValue placeholder="Select your experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2">1-2 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bio">About You (Optional)</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell clients about your expertise, certifications, and what makes you special..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="min-h-24"
                      data-testid="textarea-bio"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Business Setup */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Service Areas *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {LOCATIONS.map((location) => (
                        <div key={location} className="flex items-center space-x-2">
                          <Checkbox
                            id={location}
                            checked={formData.serviceAreas.includes(location)}
                            onCheckedChange={() => toggleLocation(location)}
                            data-testid={`checkbox-location-${location.toLowerCase().replace(/\s+/g, '-')}`}
                          />
                          <Label
                            htmlFor={location}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {location}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="startingPrice">Starting Price (AED) *</Label>
                    <Input
                      id="startingPrice"
                      type="number"
                      placeholder="150"
                      value={formData.startingPrice}
                      onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                      data-testid="input-starting-price"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Your minimum service price (can be adjusted later)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="availability">Availability</Label>
                    <Select value={formData.availability} onValueChange={(v) => setFormData({ ...formData, availability: v })}>
                      <SelectTrigger data-testid="select-availability">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flexible">Flexible Schedule</SelectItem>
                        <SelectItem value="mornings">Mornings Only</SelectItem>
                        <SelectItem value="afternoons">Afternoons Only</SelectItem>
                        <SelectItem value="evenings">Evenings Only</SelectItem>
                        <SelectItem value="weekends">Weekends Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                    data-testid="button-back"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
                {currentStep < totalSteps ? (
                  <Button
                    onClick={handleNext}
                    className="flex-1"
                    data-testid="button-next"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    className="flex-1"
                    disabled={onboardMutation.isPending}
                    data-testid="button-submit"
                  >
                    {onboardMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-center">
            <div className="p-4" data-testid="trust-indicator-simple">
              <div className="font-semibold text-lg mb-1">Simple Setup</div>
              <p className="text-sm text-muted-foreground">Just 3 easy steps to get started</p>
            </div>
            <div className="p-4" data-testid="trust-indicator-flexible">
              <div className="font-semibold text-lg mb-1">Flexible Hours</div>
              <p className="text-sm text-muted-foreground">Work on your own schedule</p>
            </div>
            <div className="p-4" data-testid="trust-indicator-premium">
              <div className="font-semibold text-lg mb-1">Premium Clients</div>
              <p className="text-sm text-muted-foreground">Serve Dubai's finest clientele</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
