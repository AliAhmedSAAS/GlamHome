import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, DollarSign, Star, MessageSquare, Sparkles, Bell, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CustomerDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);

  // WhatsApp preferences state
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [receiveOffers, setReceiveOffers] = useState(true);
  const [receiveReminders, setReceiveReminders] = useState(true);
  const [preferredContactTime, setPreferredContactTime] = useState("morning");

  // Redirect if not authenticated or not a customer
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [authLoading, isAuthenticated]);

  // Fetch customer's bookings
  const { data: bookings = [], isLoading: loadingBookings } = useQuery<any[]>({
    queryKey: ['/api/bookings/customer'],
    enabled: isAuthenticated,
  });

  // Fetch notification preferences
  const { data: preferences, isLoading: loadingPreferences } = useQuery<any>({
    queryKey: ['/api/notifications/preferences'],
    enabled: isAuthenticated,
  });

  // Update state when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setWhatsappNumber(preferences.whatsappNumber || "");
      setWhatsappOptIn(preferences.whatsappOptIn ?? true);
      setReceiveOffers(preferences.receiveOffers ?? true);
      setReceiveReminders(preferences.receiveReminders ?? true);
      setPreferredContactTime(preferences.preferredContactTime || "morning");
    }
  }, [preferences]);

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiRequest('PATCH', `/api/bookings/${bookingId}/cancel`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/customer'] });
      toast({ title: "Success", description: "Booking cancelled successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to cancel booking", variant: "destructive" });
    },
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (data: { bookingId: string; rating: number; comment: string }) => {
      const res = await apiRequest('POST', '/api/reviews', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/customer'] });
      toast({ title: "Success", description: "Review submitted successfully" });
      setSelectedBooking(null);
      setReviewText("");
      setRating(5);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit review", variant: "destructive" });
    },
  });

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PUT', '/api/notifications/preferences', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/preferences'] });
      toast({ title: "Success", description: "Notification preferences saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save preferences", variant: "destructive" });
    },
  });

  const handleSavePreferences = () => {
    savePreferencesMutation.mutate({
      whatsappNumber,
      whatsappOptIn,
      receiveOffers,
      receiveReminders,
      preferredContactTime,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      confirmed: "default",
      completed: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const handleCancelBooking = (bookingId: string) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      cancelBookingMutation.mutate(bookingId);
    }
  };

  const handleSubmitReview = () => {
    if (!selectedBooking) return;
    submitReviewMutation.mutate({
      bookingId: selectedBooking.id,
      rating,
      comment: reviewText,
    });
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b => 
    (b.status === 'pending' || b.status === 'confirmed') && new Date(b.scheduledDate) > new Date()
  );
  const pastBookings = bookings.filter(b => 
    b.status === 'completed' || (new Date(b.scheduledDate) < new Date() && b.status !== 'cancelled')
  );
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold mb-2" data-testid="heading-dashboard">
              My Bookings
            </h1>
            <p className="text-muted-foreground">
              Manage your beauty service appointments
            </p>
          </div>

          {loadingBookings ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : bookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">You haven't made any bookings yet.</p>
                <Button onClick={() => setLocation('/find-beauticians')} data-testid="button-find-beauticians">
                  Find Beauticians
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="upcoming" data-testid="tab-upcoming">
                  Upcoming ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="past" data-testid="tab-past">
                  Past ({pastBookings.length})
                </TabsTrigger>
                <TabsTrigger value="cancelled" data-testid="tab-cancelled">
                  Cancelled ({cancelledBookings.length})
                </TabsTrigger>
                <TabsTrigger value="notifications" data-testid="tab-notifications">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4 mt-6">
                {upcomingBookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No upcoming bookings</p>
                    </CardContent>
                  </Card>
                ) : (
                  upcomingBookings.map((booking) => (
                    <Card key={booking.id} data-testid={`booking-card-${booking.id}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl mb-2" data-testid={`booking-beautician-${booking.id}`}>
                              {booking.beauticianName}
                            </CardTitle>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold" data-testid={`booking-amount-${booking.id}`}>
                              د.إ {booking.totalAmount}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Sparkles className="w-4 h-4" />
                          <span data-testid={`booking-service-${booking.id}`}>{booking.serviceName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(booking.scheduledDate), 'MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{format(new Date(booking.scheduledDate), 'h:mm a')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.location}</span>
                        </div>
                        {booking.status === 'pending' && (
                          <div className="pt-4">
                            <Button
                              variant="destructive"
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancelBookingMutation.isPending}
                              data-testid={`button-cancel-${booking.id}`}
                            >
                              Cancel Booking
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4 mt-6">
                {pastBookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No past bookings</p>
                    </CardContent>
                  </Card>
                ) : (
                  pastBookings.map((booking) => (
                    <Card key={booking.id} data-testid={`booking-card-${booking.id}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl mb-2">{booking.beauticianName}</CardTitle>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">د.إ {booking.totalAmount}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Sparkles className="w-4 h-4" />
                          <span>{booking.serviceName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(booking.scheduledDate), 'MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{format(new Date(booking.scheduledDate), 'h:mm a')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.location}</span>
                        </div>
                        {!booking.hasReview && booking.status === 'completed' && (
                          <Dialog open={selectedBooking?.id === booking.id} onOpenChange={(open) => !open && setSelectedBooking(null)}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="default" 
                                onClick={() => setSelectedBooking(booking)}
                                data-testid={`button-review-${booking.id}`}
                                className="mt-4"
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Leave a Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Review Your Experience</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <label className="text-sm font-medium mb-2 block">Rating</label>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((value) => (
                                      <button
                                        key={value}
                                        type="button"
                                        onClick={() => setRating(value)}
                                        className="hover-elevate active-elevate-2"
                                        data-testid={`button-rating-${value}`}
                                      >
                                        <Star
                                          className={`w-8 h-8 ${
                                            value <= rating ? "fill-primary text-primary" : "text-muted-foreground"
                                          }`}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">Your Review</label>
                                  <Textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    placeholder="Share your experience..."
                                    rows={4}
                                    data-testid="textarea-review"
                                  />
                                </div>
                                <Button
                                  onClick={handleSubmitReview}
                                  disabled={submitReviewMutation.isPending}
                                  className="w-full"
                                  data-testid="button-submit-review"
                                >
                                  Submit Review
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {booking.hasReview && (
                          <div className="pt-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <MessageSquare className="w-4 h-4" />
                            <span>You reviewed this service</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="space-y-4 mt-6">
                {cancelledBookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No cancelled bookings</p>
                    </CardContent>
                  </Card>
                ) : (
                  cancelledBookings.map((booking) => (
                    <Card key={booking.id} data-testid={`booking-card-${booking.id}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl mb-2">{booking.beauticianName}</CardTitle>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold line-through text-muted-foreground">
                              د.إ {booking.totalAmount}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Sparkles className="w-4 h-4" />
                          <span>{booking.serviceName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(booking.scheduledDate), 'MMMM d, yyyy')}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="notifications" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-primary" />
                      <CardTitle>WhatsApp Notifications</CardTitle>
                    </div>
                    <CardDescription>
                      Get personalized beauty offers and service reminders via WhatsApp
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {loadingPreferences ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp-number">WhatsApp Number</Label>
                          <Input
                            id="whatsapp-number"
                            type="tel"
                            placeholder="+971 50 123 4567"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            data-testid="input-whatsapp-number"
                          />
                          <p className="text-sm text-muted-foreground">
                            Include country code (e.g., +971 for UAE)
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="whatsapp-opt-in">Enable WhatsApp Notifications</Label>
                              <p className="text-sm text-muted-foreground">
                                Receive messages on WhatsApp
                              </p>
                            </div>
                            <Switch
                              id="whatsapp-opt-in"
                              checked={whatsappOptIn}
                              onCheckedChange={setWhatsappOptIn}
                              data-testid="switch-whatsapp-opt-in"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="receive-offers">Special Offers</Label>
                              <p className="text-sm text-muted-foreground">
                                Get personalized discounts and exclusive deals
                              </p>
                            </div>
                            <Switch
                              id="receive-offers"
                              checked={receiveOffers}
                              onCheckedChange={setReceiveOffers}
                              disabled={!whatsappOptIn}
                              data-testid="switch-receive-offers"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="receive-reminders">Service Reminders</Label>
                              <p className="text-sm text-muted-foreground">
                                Get reminders when it's time for your next beauty session
                              </p>
                            </div>
                            <Switch
                              id="receive-reminders"
                              checked={receiveReminders}
                              onCheckedChange={setReceiveReminders}
                              disabled={!whatsappOptIn}
                              data-testid="switch-receive-reminders"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contact-time">Preferred Contact Time</Label>
                          <Select
                            value={preferredContactTime}
                            onValueChange={setPreferredContactTime}
                            disabled={!whatsappOptIn}
                          >
                            <SelectTrigger id="contact-time" data-testid="select-contact-time">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                              <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                              <SelectItem value="evening">Evening (5 PM - 9 PM)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">
                            We'll try to send messages during your preferred time
                          </p>
                        </div>

                        <div className="pt-4 border-t">
                          <Button
                            onClick={handleSavePreferences}
                            disabled={savePreferencesMutation.isPending}
                            className="w-full"
                            data-testid="button-save-preferences"
                          >
                            {savePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
