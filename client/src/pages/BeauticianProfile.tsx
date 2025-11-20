import React, { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useRoute } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MapPin, Star, DollarSign, Sparkles, ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DUBAI_AREAS } from "@shared/dubaiAreas";
import { cn } from "@/lib/utils";
import profile1 from "@assets/generated_images/Beautician_profile_one_9fa3b2a4.png";
import profile2 from "@assets/generated_images/Beautician_profile_two_08398f98.png";
import profile3 from "@assets/generated_images/Beautician_profile_three_da0a3188.png";

const profileImages = [profile1, profile2, profile3];

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const bookingSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  scheduledDate: z.date({ required_error: "Please select a date" }),
  scheduledTime: z.string().min(1, "Please select a time"),
  location: z.string().min(5, "Please enter your location"),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z.string().min(10, "Review must be at least 10 characters"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/customer/dashboard`,
      },
      redirect: 'if_required',
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Booking Confirmed!",
        description: "Your beauty service has been booked successfully.",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        data-testid="button-confirm-payment"
      >
        {isProcessing ? "Processing..." : "Confirm Payment"}
      </Button>
    </form>
  );
}

export default function BeauticianProfile() {
  const [, params] = useRoute('/beauticians/:id');
  const beauticianId = params?.id;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<'details' | 'payment'>('details');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  // Helper to get consistent image index from beautician ID
  const getImageIndex = (id: string | undefined) => {
    if (!id) return 0;
    // Sum character codes to get a consistent number
    const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return sum % profileImages.length;
  };

  // Fetch beautician profile with services
  const { data: beautician, isLoading } = useQuery<any>({
    queryKey: ['/api/beauticians', beauticianId],
    enabled: !!beauticianId,
  });

  // Fetch reviews for this beautician
  const { data: reviews = [] } = useQuery<any[]>({
    queryKey: ['/api/beauticians', beauticianId, 'reviews'],
    enabled: !!beauticianId,
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceId: "",
      location: "",
      notes: "",
    },
  });

  const reviewForm = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  // Restore pending booking data after authentication
  useEffect(() => {
    if (isAuthenticated && beautician) {
      const pendingBookingStr = localStorage.getItem('pendingBooking');
      if (pendingBookingStr) {
        try {
          const pendingBooking = JSON.parse(pendingBookingStr);
          
          // Only restore if it's for this beautician
          if (pendingBooking.beauticianId === beautician.id) {
            // Find the service
            const service = beautician.services?.find((s: any) => s.id === pendingBooking.serviceId);
            if (service) {
              setSelectedService(service);
              form.setValue('serviceId', pendingBooking.serviceId);
              form.setValue('scheduledDate', new Date(pendingBooking.scheduledDate));
              form.setValue('scheduledTime', pendingBooking.scheduledTime);
              form.setValue('location', pendingBooking.location);
              form.setValue('notes', pendingBooking.notes);
              
              // Open the booking dialog
              setIsBookingDialogOpen(true);
              
              // Clear the pending booking data
              localStorage.removeItem('pendingBooking');
              
              toast({
                title: "Welcome back!",
                description: "Your booking details have been restored. Please proceed to payment.",
                variant: "default",
              });
            }
          }
        } catch (error) {
          console.error('Error restoring pending booking:', error);
          localStorage.removeItem('pendingBooking');
        }
      }
    }
  }, [isAuthenticated, beautician, form, toast]);

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/bookings', data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setBookingStep('payment');
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create booking", variant: "destructive" });
    },
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const res = await apiRequest('POST', `/api/beauticians/${beauticianId}/reviews`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      setIsReviewDialogOpen(false);
      reviewForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/beauticians', beauticianId, 'reviews'] });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to submit review. Please try again.", 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    if (!isAuthenticated) {
      // Save booking data to localStorage before redirecting
      const pendingBooking = {
        beauticianId: beautician.id,
        serviceId: data.serviceId,
        scheduledDate: data.scheduledDate.toISOString(),
        scheduledTime: data.scheduledTime,
        location: data.location,
        notes: data.notes || '',
      };
      localStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
      
      toast({
        title: "Account Required",
        description: "Please create an account to book a service.",
        variant: "default",
      });
      setTimeout(() => {
        window.location.href = '/signup';
      }, 1500);
      return;
    }

    const selectedServiceData = beautician?.services?.find((s: any) => s.id === data.serviceId);
    if (!selectedServiceData) return;

    // Combine date and time
    const scheduledDateTime = new Date(data.scheduledDate);
    const [hours, minutes] = data.scheduledTime.split(':');
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

    createBookingMutation.mutate({
      beauticianId: beautician.id,
      serviceId: data.serviceId,
      scheduledDate: scheduledDateTime.toISOString(),
      location: data.location,
      notes: data.notes,
    });
  };

  const handlePaymentSuccess = () => {
    setIsBookingDialogOpen(false);
    setBookingStep('details');
    setClientSecret(null);
    form.reset();
    queryClient.invalidateQueries({ queryKey: ['/api/bookings/customer'] });
    setTimeout(() => {
      setLocation('/customer/dashboard');
    }, 2000);
  };

  const openBookingDialog = (service: any) => {
    setSelectedService(service);
    form.setValue('serviceId', service.id);
    setIsBookingDialogOpen(true);
  };

  const openReviewDialog = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to leave a review.",
        variant: "default",
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }
    setIsReviewDialogOpen(true);
  };

  const onSubmitReview = (data: ReviewFormData) => {
    createReviewMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!beautician) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Beautician not found</p>
              <Button onClick={() => setLocation('/find-beauticians')} className="mt-4">
                Back to Search
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setLocation('/find-beauticians')}
            className="mb-6"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>

          {/* Beautician Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex gap-6 flex-1">
                  <Avatar className="h-24 w-24 md:h-32 md:w-32 flex-shrink-0" data-testid="beautician-avatar">
                    <AvatarImage 
                      src={profileImages[getImageIndex(beauticianId)]} 
                      alt={beautician.userName} 
                    />
                    <AvatarFallback>{beautician.userName?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2" data-testid="beautician-name">
                      {beautician.userName}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-primary text-primary" />
                        <span className="font-semibold">{beautician.rating || '5.0'}</span>
                        <span className="text-muted-foreground">({beautician.reviewCount || 0} reviews)</span>
                      </div>
                      <Badge>{beautician.experience}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-4" data-testid="beautician-bio">
                      {beautician.bio}
                    </p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{beautician.serviceAreas?.join(', ')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-muted-foreground mb-1">Starting from</p>
                  <p className="text-3xl font-bold">د.إ {beautician.startingPrice}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <div className="mb-8">
            <h2 className="text-2xl font-serif font-bold mb-6">Services & Pricing</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {beautician.services?.map((service: any) => (
                <Card key={service.id} data-testid={`service-card-${service.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {service.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-semibold">د.إ {service.price}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration} minutes</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => openBookingDialog(service)}
                      className="w-full"
                      data-testid={`button-book-${service.id}`}
                    >
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-serif font-bold">Customer Reviews</h2>
              <Button 
                onClick={openReviewDialog}
                data-testid="button-leave-review"
              >
                Leave a Review
              </Button>
            </div>
            
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{review.customerName}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(review.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {bookingStep === 'details' ? 'Book Your Service' : 'Complete Payment'}
            </DialogTitle>
          </DialogHeader>

          {bookingStep === 'details' ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {selectedService && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold mb-2">{selectedService.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>د.إ {selectedService.price}</span>
                      <span>•</span>
                      <span>{selectedService.duration} minutes</span>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => {
                    const today = new Date().toISOString().split('T')[0];
                    const dateInputRef = useRef<HTMLInputElement>(null);
                    
                    const handleFieldClick = () => {
                      if (dateInputRef.current) {
                        dateInputRef.current.focus();
                        if (dateInputRef.current.showPicker) {
                          dateInputRef.current.showPicker();
                        } else {
                          dateInputRef.current.click();
                        }
                      }
                    };
                    
                    return (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <div 
                            className="relative cursor-pointer"
                            onClick={handleFieldClick}
                          >
                            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                            <Input
                              ref={dateInputRef}
                              type="date"
                              min={today}
                              value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                              onChange={(e) => {
                                const dateValue = e.target.value;
                                if (dateValue) {
                                  const selectedDate = new Date(dateValue + 'T00:00:00');
                                  field.onChange(selectedDate);
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFieldClick();
                              }}
                              className={`w-full pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-moz-calendar-picker-indicator]:hidden [&::-ms-calendar-picker-indicator]:hidden ${!field.value ? 'text-transparent' : ''}`}
                              data-testid="input-select-date"
                              required
                            />
                            {!field.value && (
                              <span className="absolute left-10 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none text-sm">
                                Select A Date
                              </span>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="scheduledTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-time">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 9).flatMap((hour) => [
                            <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                              {hour}:00 {hour < 12 ? 'AM' : 'PM'}
                            </SelectItem>,
                            <SelectItem key={`${hour}:30`} value={`${hour}:30`}>
                              {hour}:30 {hour < 12 ? 'AM' : 'PM'}
                            </SelectItem>
                          ])}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Location</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-location">
                            <SelectValue placeholder="Select your area in Dubai" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DUBAI_AREAS.map((area) => (
                            <SelectItem key={area} value={area}>
                              {area}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Any special requests or notes..."
                          rows={3}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createBookingMutation.isPending}
                  data-testid="button-proceed-payment"
                >
                  {createBookingMutation.isPending ? "Processing..." : "Proceed to Payment"}
                </Button>
              </form>
            </Form>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm onSuccess={handlePaymentSuccess} />
            </Elements>
          ) : (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
          </DialogHeader>

          <Form {...reviewForm}>
            <form onSubmit={reviewForm.handleSubmit(onSubmitReview)} className="space-y-6">
              <FormField
                control={reviewForm.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const starValue = i + 1;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => field.onChange(starValue)}
                              onMouseEnter={() => setHoveredRating(starValue)}
                              onMouseLeave={() => setHoveredRating(0)}
                              className="transition-transform hover:scale-110"
                              data-testid={`input-rating-${starValue}`}
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  starValue <= (hoveredRating || field.value)
                                    ? "fill-primary text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reviewForm.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Review</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Share your experience with this beautician..."
                        rows={4}
                        data-testid="textarea-review-comment"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createReviewMutation.isPending}
                data-testid="button-submit-review"
              >
                {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
