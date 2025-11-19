import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, CheckCircle, XCircle, Clock, User, MapPin, DollarSign, MessageCircle, Send, TrendingUp, TrendingDown, Users, Activity, Award, Settings } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [analyticsDateRange, setAnalyticsDateRange] = useState("30");
  const [globalCommission, setGlobalCommission] = useState<number>(50);
  const [editingCommission, setEditingCommission] = useState<{ beauticianId: string; currentRate: number | null } | null>(null);
  const [commissionInput, setCommissionInput] = useState<string>("");
  const [adminUser, setAdminUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  
  // Blog generation state
  const [articleCount, setArticleCount] = useState<number>(2);
  const [focusKeywords, setFocusKeywords] = useState<string>("");

  // Check admin authentication
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await fetch('/api/admin/check', {
          credentials: 'include',
        });

        if (!response.ok) {
          setLocation('/admin/login');
          return;
        }

        const data = await response.json();
        if (data.role !== 'admin') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin dashboard.",
            variant: "destructive",
          });
          setTimeout(() => {
            setLocation('/admin/login');
          }, 1500);
          return;
        }

        setAdminUser(data);
      } catch (error) {
        console.error('Admin auth check failed:', error);
        setLocation('/admin/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAdminAuth();
  }, [toast, setLocation]);

  // Fetch pending beauticians
  const { data: pendingBeauticians = [], isLoading: loadingBeauticians } = useQuery<any[]>({
    queryKey: ['/api/admin/beauticians/pending'],
    enabled: !authLoading && adminUser?.role === 'admin',
  });

  // Fetch all bookings
  const { data: bookings = [], isLoading: loadingBookings } = useQuery<any[]>({
    queryKey: ['/api/admin/bookings'],
    enabled: !authLoading && adminUser?.role === 'admin',
  });

  // Approve beautician mutation
  const approveBeauticianMutation = useMutation({
    mutationFn: async (beauticianId: string) => {
      const response = await fetch(`/api/admin/beauticians/${beauticianId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to approve beautician');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/beauticians/pending'] });
      toast({ title: "Success", description: "Beautician approved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve beautician", variant: "destructive" });
    },
  });

  // Reject beautician mutation
  const rejectBeauticianMutation = useMutation({
    mutationFn: async (beauticianId: string) => {
      const response = await fetch(`/api/admin/beauticians/${beauticianId}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to reject beautician');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/beauticians/pending'] });
      toast({ title: "Success", description: "Beautician application rejected" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject beautician", variant: "destructive" });
    },
  });

  // Update booking status mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update booking');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      toast({ title: "Success", description: "Booking status updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update booking", variant: "destructive" });
    },
  });

  // Fetch all customers
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: !authLoading && adminUser?.role === 'admin',
  });

  // Send offer to customer mutation
  const sendOfferMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const res = await apiRequest('POST', '/api/offers/send', { customerId });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Offer sent successfully to customer" });
      setSelectedCustomer("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to send offer", 
        variant: "destructive" 
      });
    },
  });

  // Trigger automated offers mutation
  const triggerAutomatedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/offers/trigger-automated', {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Success", 
        description: `Automated offers processed: ${data.sent} sent, ${data.failed} failed` 
      });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to trigger automated offers", 
        variant: "destructive" 
      });
    },
  });

  // Fetch platform settings
  const { data: platformSettings } = useQuery<{ 
    globalCommissionPercentage: number;
    facebookUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    linkedinUrl?: string;
  }>({
    queryKey: ['/api/admin/settings'],
    enabled: !authLoading && adminUser?.role === 'admin',
  });

  // Update state when platform settings are fetched
  useEffect(() => {
    if (platformSettings) {
      if (platformSettings.globalCommissionPercentage !== undefined) {
        setGlobalCommission(platformSettings.globalCommissionPercentage);
      }
      if (platformSettings.facebookUrl) setFacebookUrl(platformSettings.facebookUrl);
      if (platformSettings.instagramUrl) setInstagramUrl(platformSettings.instagramUrl);
      if (platformSettings.twitterUrl) setTwitterUrl(platformSettings.twitterUrl);
      if (platformSettings.linkedinUrl) setLinkedinUrl(platformSettings.linkedinUrl);
    }
  }, [platformSettings]);

  // Update platform settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (globalCommissionPercentage: number) => {
      const res = await apiRequest('PUT', '/api/admin/settings', { globalCommissionPercentage });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({ title: "Success", description: "Global commission rate updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    },
  });

  // Update social media URLs mutation
  const updateSocialMediaMutation = useMutation({
    mutationFn: async (urls: { facebookUrl?: string; instagramUrl?: string; twitterUrl?: string; linkedinUrl?: string }) => {
      const res = await apiRequest('PUT', '/api/admin/settings', urls);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/social-media'] });
      toast({ title: "Success", description: "Social media URLs updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update social media URLs", variant: "destructive" });
    },
  });

  // Update beautician commission mutation
  const updateBeauticianCommissionMutation = useMutation({
    mutationFn: async ({ beauticianId, commissionPercentage }: { beauticianId: string; commissionPercentage: number | null }) => {
      const res = await apiRequest('PATCH', `/api/admin/beauticians/${beauticianId}/commission`, { commissionPercentage });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/beauticians/pending'] });
      toast({ 
        title: "Success", 
        description: editingCommission?.currentRate === null && commissionInput 
          ? "Custom commission rate set successfully"
          : commissionInput 
          ? "Commission rate updated successfully" 
          : "Using global commission rate"
      });
      setEditingCommission(null);
      setCommissionInput("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update commission", variant: "destructive" });
    },
  });

  // Analytics queries
  const { data: overviewMetrics, isLoading: loadingOverview } = useQuery({
    queryKey: ['/api/admin/analytics/overview', analyticsDateRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/overview?days=${analyticsDateRange}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch overview metrics');
      return res.json();
    },
    enabled: !authLoading && adminUser?.role === 'admin',
  });

  const { data: customerMetrics, isLoading: loadingCustomers } = useQuery({
    queryKey: ['/api/admin/analytics/customers', analyticsDateRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/customers?days=${analyticsDateRange}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch customer metrics');
      return res.json();
    },
    enabled: !authLoading && adminUser?.role === 'admin',
  });

  const { data: beauticianMetrics, isLoading: loadingBeauticianMetrics } = useQuery({
    queryKey: ['/api/admin/analytics/beauticians', analyticsDateRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/beauticians?days=${analyticsDateRange}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch beautician metrics');
      return res.json();
    },
    enabled: !authLoading && adminUser?.role === 'admin',
  });

  const { data: retentionMetrics, isLoading: loadingRetention } = useQuery({
    queryKey: ['/api/admin/analytics/retention', analyticsDateRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/retention?days=${analyticsDateRange}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch retention metrics');
      return res.json();
    },
    enabled: !authLoading && adminUser?.role === 'admin',
  });

  // Blog generation queries
  const { data: blogPosts = [], refetch: refetchBlogPosts } = useQuery<any[]>({
    queryKey: ['/api/blog'],
    enabled: !authLoading && adminUser?.role === 'admin',
  });

  const { data: blogJobs = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/blog/jobs'],
    enabled: !authLoading && adminUser?.role === 'admin',
  });

  // Generate blog articles mutation
  const generateBlogMutation = useMutation({
    mutationFn: async () => {
      const keywords = focusKeywords.split(',').map(k => k.trim()).filter(k => k);
      const res = await apiRequest('POST', '/api/admin/blog/generate', {
        articleCount,
        focusKeywords: keywords,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Generation Started",
        description: `Generating ${articleCount} articles. This may take a few minutes.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/jobs'] });
      setFocusKeywords("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start blog generation. Make sure your OPENAI_API_KEY is set.",
        variant: "destructive",
      });
    },
  });

  // Publish blog post mutation
  const publishBlogMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiRequest('PUT', `/api/admin/blog/${postId}/publish`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Article published successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to publish article", variant: "destructive" });
    },
  });

  // Delete blog post mutation
  const deleteBlogMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiRequest('DELETE', `/api/admin/blog/${postId}`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Article deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete article", variant: "destructive" });
    },
  });

  if (authLoading || !adminUser || adminUser?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage beautician applications and bookings
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="beauticians" className="space-y-6">
            <TabsList className="grid w-full max-w-4xl grid-cols-6">
              <TabsTrigger value="analytics" data-testid="tab-analytics">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="beauticians" data-testid="tab-beauticians">
                Applications ({pendingBeauticians.length})
              </TabsTrigger>
              <TabsTrigger value="bookings" data-testid="tab-bookings">
                Bookings ({bookings.length})
              </TabsTrigger>
              <TabsTrigger value="content" data-testid="tab-content">
                Content
              </TabsTrigger>
              <TabsTrigger value="notifications" data-testid="tab-notifications">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              {/* Date Range Filter */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold mb-1">Business Analytics</h2>
                  <p className="text-sm text-muted-foreground">Comprehensive insights and performance metrics</p>
                </div>
                <Select value={analyticsDateRange} onValueChange={setAnalyticsDateRange}>
                  <SelectTrigger className="w-48" data-testid="select-analytics-daterange">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="180">Last 180 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Overview KPI Cards */}
              {loadingOverview ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="h-20 animate-pulse bg-muted rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : overviewMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card data-testid="card-total-revenue">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="text-total-revenue">
                        د.إ {overviewMetrics.totalRevenue?.toLocaleString() || '0'}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        {overviewMetrics.revenueGrowth >= 0 ? (
                          <>
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">+{overviewMetrics.revenueGrowth}%</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3 text-red-500" />
                            <span className="text-red-500">{overviewMetrics.revenueGrowth}%</span>
                          </>
                        )}
                        <span>from previous period</span>
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-active-customers">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="text-active-customers">
                        {overviewMetrics.activeCustomers?.toLocaleString() || '0'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Customers with bookings
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-total-bookings">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="text-total-bookings">
                        {overviewMetrics.totalBookings?.toLocaleString() || '0'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Completed appointments
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-retention-rate">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="text-retention-rate">
                        {overviewMetrics.customerRetentionRate?.toFixed(1) || '0'}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Customer retention
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-conversion-rate">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="text-conversion-rate">
                        {overviewMetrics.conversionRate?.toFixed(1) || '0'}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Visitor to booking
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-avg-booking-value">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="text-avg-booking-value">
                        د.إ {overviewMetrics.averageBookingValue?.toFixed(0) || '0'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Per transaction
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Customer Analytics Section */}
              <Card data-testid="card-customer-analytics">
                <CardHeader>
                  <CardTitle>Customer Analytics</CardTitle>
                  <CardDescription>Growth trends and customer segmentation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {loadingCustomers ? (
                    <div className="h-80 flex items-center justify-center">
                      <p className="text-muted-foreground">Loading customer analytics...</p>
                    </div>
                  ) : customerMetrics && (
                    <>
                      {/* Customer Growth Chart */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Customer Growth Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={customerMetrics.newCustomersTrend || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="count" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              name="New Customers"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Customer Segmentation and Top Customers */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Pie Chart */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Customer Segments</h3>
                          {customerMetrics.customerSegments && (
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'VIP', value: customerMetrics.customerSegments.vip || 0 },
                                    { name: 'Active', value: customerMetrics.customerSegments.active || 0 },
                                    { name: 'At Risk', value: customerMetrics.customerSegments.atRisk || 0 },
                                    { name: 'Dormant', value: customerMetrics.customerSegments.dormant || 0 },
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"].map((color, index) => (
                                    <Cell key={`cell-${index}`} fill={color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </div>

                        {/* Top Customers Table */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Top 5 Customers</h3>
                          <div className="space-y-3">
                            {customerMetrics.topCustomers?.slice(0, 5).map((customer: any, idx: number) => (
                              <div 
                                key={customer.id} 
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                data-testid={`row-top-customer-${idx}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium" data-testid={`text-customer-name-${idx}`}>
                                      {customer.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {customer.bookingCount} bookings
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold" data-testid={`text-customer-spent-${idx}`}>
                                    د.إ {customer.totalSpent?.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Total spent</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Beautician Performance Section */}
              <Card data-testid="card-beautician-performance">
                <CardHeader>
                  <CardTitle>Beautician Performance</CardTitle>
                  <CardDescription>Revenue and service quality metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {loadingBeauticianMetrics ? (
                    <div className="h-80 flex items-center justify-center">
                      <p className="text-muted-foreground">Loading beautician metrics...</p>
                    </div>
                  ) : beauticianMetrics && (
                    <>
                      {/* Revenue Comparison Bar Chart */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Revenue by Beautician (Top 10)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={beauticianMetrics.revenueByBeautician?.slice(0, 10) || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue (AED)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Performance Leaderboard Table */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Performance Leaderboard</h3>
                        <div className="space-y-3">
                          {beauticianMetrics.performanceLeaderboard?.slice(0, 10).map((beautician: any, idx: number) => (
                            <div 
                              key={beautician.id} 
                              className="grid grid-cols-5 gap-4 items-center p-4 bg-muted/50 rounded-lg"
                              data-testid={`row-beautician-performance-${idx}`}
                            >
                              <div className="flex items-center gap-3 col-span-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="font-medium" data-testid={`text-beautician-name-${idx}`}>
                                    {beautician.name}
                                  </p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Award className="h-3 w-3" />
                                    {beautician.averageRating?.toFixed(1) || 'N/A'} rating
                                  </div>
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="font-semibold" data-testid={`text-beautician-revenue-${idx}`}>
                                  د.إ {beautician.totalRevenue?.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">Revenue</p>
                              </div>
                              <div className="text-center">
                                <p className="font-semibold">{beautician.bookingCount}</p>
                                <p className="text-xs text-muted-foreground">Bookings</p>
                              </div>
                              <div className="text-center">
                                <p className="font-semibold">{beautician.completionRate?.toFixed(0)}%</p>
                                <p className="text-xs text-muted-foreground">Completion</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Retention Metrics Section */}
              <Card data-testid="card-retention-metrics">
                <CardHeader>
                  <CardTitle>Customer Retention & Loyalty</CardTitle>
                  <CardDescription>Long-term customer engagement metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {loadingRetention ? (
                    <div className="h-80 flex items-center justify-center">
                      <p className="text-muted-foreground">Loading retention metrics...</p>
                    </div>
                  ) : retentionMetrics && (
                    <>
                      {/* Retention Metrics Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card data-testid="card-repeat-booking-rate">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Repeat Booking Rate</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold" data-testid="text-repeat-booking-rate">
                              {retentionMetrics.repeatBookingRate?.toFixed(1) || '0'}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Customers who book again
                            </p>
                          </CardContent>
                        </Card>

                        <Card data-testid="card-avg-days-between">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Avg Days Between Bookings</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold" data-testid="text-avg-days-between">
                              {retentionMetrics.averageDaysBetweenBookings?.toFixed(0) || '0'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Average booking interval
                            </p>
                          </CardContent>
                        </Card>

                        <Card data-testid="card-churn-rate">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold" data-testid="text-churn-rate">
                              {retentionMetrics.churnRate?.toFixed(1) || '0'}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Inactive customers
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* At-Risk Customers Table */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">At-Risk Customers</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Customers who haven't booked recently and may need re-engagement
                        </p>
                        <div className="space-y-2">
                          {retentionMetrics.atRiskCustomers?.slice(0, 10).map((customer: any, idx: number) => (
                            <div 
                              key={customer.id} 
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              data-testid={`row-at-risk-customer-${idx}`}
                            >
                              <div>
                                <p className="font-medium" data-testid={`text-at-risk-name-${idx}`}>
                                  {customer.name}
                                </p>
                                <p className="text-sm text-muted-foreground">{customer.email}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium" data-testid={`text-days-since-booking-${idx}`}>
                                  {customer.daysSinceLastBooking} days
                                </p>
                                <p className="text-xs text-muted-foreground">Since last booking</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Beautician Applications Tab */}
            <TabsContent value="beauticians" className="space-y-4">
              {loadingBeauticians ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">Loading applications...</p>
                  </CardContent>
                </Card>
              ) : pendingBeauticians.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No pending applications</p>
                  </CardContent>
                </Card>
              ) : (
                pendingBeauticians.map((beautician: any) => (
                  <Card key={beautician.id} data-testid={`card-beautician-${beautician.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                              <User className="h-8 w-8" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-xl mb-1">Beautician Application</CardTitle>
                            <CardDescription>
                              Submitted {format(new Date(beautician.createdAt), 'PPP')}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="secondary">Pending Review</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Experience</p>
                          <p className="font-medium">{beautician.experience} years</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Starting Price</p>
                          <p className="font-medium">د.إ {beautician.startingPrice}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Availability</p>
                          <p className="font-medium capitalize">{beautician.availability}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Service Areas</p>
                          <div className="flex flex-wrap gap-1">
                            {beautician.serviceAreas.map((area: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">{area}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {beautician.bio && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Bio</p>
                          <p className="text-sm">{beautician.bio}</p>
                        </div>
                      )}

                      {/* Commission Settings */}
                      <div className="bg-muted/50 rounded-md p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold mb-1">Commission Rate</p>
                            <p className="text-sm text-muted-foreground">
                              {beautician.commissionPercentage !== null ? (
                                <>Custom: {beautician.commissionPercentage}%</>
                              ) : (
                                <>Using global rate: {globalCommission}%</>
                              )}
                            </p>
                          </div>
                          <Dialog 
                            open={editingCommission?.beauticianId === beautician.id} 
                            onOpenChange={(open) => {
                              if (!open) {
                                setEditingCommission(null);
                                setCommissionInput("");
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCommission({
                                    beauticianId: beautician.id,
                                    currentRate: beautician.commissionPercentage,
                                  });
                                  setCommissionInput(beautician.commissionPercentage?.toString() || "");
                                }}
                                data-testid={`button-edit-commission-${beautician.id}`}
                              >
                                <Settings className="h-3 w-3 mr-2" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Set Commission Rate</DialogTitle>
                                <DialogDescription>
                                  Set a custom commission rate for this beautician. Leave empty to use the global rate ({globalCommission}%).
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label htmlFor="commission-input">Commission Percentage (0-100)</Label>
                                  <div className="relative">
                                    <Input
                                      id="commission-input"
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="1"
                                      value={commissionInput}
                                      onChange={(e) => setCommissionInput(e.target.value)}
                                      placeholder={`Leave empty for global rate (${globalCommission}%)`}
                                      className="pr-12"
                                      data-testid="input-commission"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                      %
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-3">
                                  <Button
                                    onClick={() => {
                                      const value = commissionInput.trim() === "" 
                                        ? null 
                                        : parseFloat(commissionInput);
                                      
                                      if (value !== null && (value < 0 || value > 100)) {
                                        toast({
                                          title: "Invalid Value",
                                          description: "Commission must be between 0 and 100",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      
                                      updateBeauticianCommissionMutation.mutate({
                                        beauticianId: beautician.id,
                                        commissionPercentage: value,
                                      });
                                    }}
                                    disabled={updateBeauticianCommissionMutation.isPending}
                                    className="flex-1"
                                    data-testid="button-save-beautician-commission"
                                  >
                                    {updateBeauticianCommissionMutation.isPending ? "Saving..." : "Save"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setEditingCommission(null);
                                      setCommissionInput("");
                                    }}
                                    disabled={updateBeauticianCommissionMutation.isPending}
                                    data-testid="button-cancel-commission"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          onClick={() => approveBeauticianMutation.mutate(beautician.id)}
                          disabled={approveBeauticianMutation.isPending}
                          className="flex-1"
                          data-testid={`button-approve-${beautician.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {approveBeauticianMutation.isPending ? "Approving..." : "Approve"}
                        </Button>
                        <Button
                          onClick={() => rejectBeauticianMutation.mutate(beautician.id)}
                          disabled={rejectBeauticianMutation.isPending}
                          variant="destructive"
                          className="flex-1"
                          data-testid={`button-reject-${beautician.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {rejectBeauticianMutation.isPending ? "Rejecting..." : "Reject"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-4">
              {loadingBookings ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">Loading bookings...</p>
                  </CardContent>
                </Card>
              ) : bookings.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No bookings found</p>
                  </CardContent>
                </Card>
              ) : (
                bookings.map((booking: any) => (
                  <Card key={booking.id} data-testid={`card-booking-${booking.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl mb-1">Booking #{booking.id.slice(0, 8)}</CardTitle>
                          <CardDescription>
                            Created {format(new Date(booking.createdAt), 'PPP')}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={
                            booking.status === 'confirmed' ? 'default' : 
                            booking.status === 'completed' ? 'secondary' :
                            booking.status === 'cancelled' ? 'destructive' : 
                            'outline'
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Scheduled Date</p>
                            <p className="font-medium">{format(new Date(booking.scheduledDate), 'PPP p')}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="font-medium">{booking.location}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="font-medium">د.إ {booking.totalAmount}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Platform Fee</p>
                            <p className="font-medium">د.إ {booking.platformFee}</p>
                          </div>
                        </div>
                      </div>

                      {booking.status === 'pending' && (
                        <div className="flex gap-3 pt-4 border-t">
                          <Button
                            onClick={() => updateBookingMutation.mutate({ bookingId: booking.id, status: 'confirmed' })}
                            disabled={updateBookingMutation.isPending}
                            className="flex-1"
                            data-testid={`button-confirm-${booking.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Confirm
                          </Button>
                          <Button
                            onClick={() => updateBookingMutation.mutate({ bookingId: booking.id, status: 'cancelled' })}
                            disabled={updateBookingMutation.isPending}
                            variant="destructive"
                            className="flex-1"
                            data-testid={`button-cancel-${booking.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Content Studio Tab */}
            <TabsContent value="content" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-1">Content Studio</h2>
                <p className="text-sm text-muted-foreground">Generate AI-powered beauty trend articles for your blog</p>
              </div>

              {/* Blog Generation Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Generate New Articles</CardTitle>
                  <CardDescription>
                    Create multiple SEO-optimized beauty trend articles using AI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Number of Articles
                      </label>
                      <div className="flex gap-4">
                        {[2, 4, 6].map((count) => (
                          <Button
                            key={count}
                            type="button"
                            variant={articleCount === count ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setArticleCount(count)}
                            data-testid={`button-article-count-${count}`}
                          >
                            {count} Articles
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Focus Keywords (Optional)
                      </label>
                      <Input
                        value={focusKeywords}
                        onChange={(e) => setFocusKeywords(e.target.value)}
                        placeholder="e.g., Dubai beauty, luxury manicure, bridal makeup"
                        data-testid="input-focus-keywords"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Separate multiple keywords with commas
                      </p>
                    </div>

                    <Button 
                      className="w-full"
                      onClick={() => generateBlogMutation.mutate()}
                      disabled={generateBlogMutation.isPending}
                      data-testid="button-generate-articles"
                    >
                      {generateBlogMutation.isPending ? "Generating..." : "Generate Articles"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Generation Jobs */}
              {blogJobs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Generation Jobs</CardTitle>
                    <CardDescription>Track your article generation progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {blogJobs.slice(0, 5).map((job: any) => (
                        <div key={job.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{job.articleCount} Articles</div>
                            <div className="text-sm text-muted-foreground">
                              {job.status === 'completed' ? 'Completed' : job.status === 'generating' ? `Generating... ${job.progress}%` : job.status === 'failed' ? 'Failed' : 'Queued'}
                            </div>
                          </div>
                          {job.status === 'generating' && (
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all" style={{ width: `${job.progress}%` }} />
                            </div>
                          )}
                          {job.status === 'completed' && (
                            <Badge variant="default">Done</Badge>
                          )}
                          {job.status === 'failed' && (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generated Articles List */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Articles</CardTitle>
                  <CardDescription>
                    Manage your blog content and publish when ready
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {blogPosts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>No articles yet. Generate some to get started!</p>
                      </div>
                    ) : (
                      blogPosts.map((post: any) => (
                        <div key={post.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          {post.coverImage && (
                            <img 
                              src={post.coverImage} 
                              alt={post.title}
                              className="w-32 h-24 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{post.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{post.excerpt}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline">{post.category}</Badge>
                              <span>{post.readTime} min read</span>
                              {post.isPublished && <Badge>Published</Badge>}
                              {!post.isPublished && <Badge variant="secondary">Draft</Badge>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {!post.isPublished && (
                              <Button
                                size="sm"
                                onClick={() => publishBlogMutation.mutate(post.id)}
                                disabled={publishBlogMutation.isPending}
                              >
                                Publish
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteBlogMutation.mutate(post.id)}
                              disabled={deleteBlogMutation.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* WhatsApp Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <CardTitle>WhatsApp Offer Management</CardTitle>
                  </div>
                  <CardDescription>
                    Send personalized beauty offers to customers via WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Manual Offer Sending */}
                  <div className="space-y-4 pb-6 border-b">
                    <h3 className="text-lg font-semibold">Send Offer to Customer</h3>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.length === 0 ? (
                              <SelectItem value="none" disabled>No customers found</SelectItem>
                            ) : (
                              customers.map((customer: any) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.firstName} {customer.lastName} ({customer.email})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={() => selectedCustomer && sendOfferMutation.mutate(selectedCustomer)}
                        disabled={!selectedCustomer || sendOfferMutation.isPending}
                        data-testid="button-send-offer"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {sendOfferMutation.isPending ? "Sending..." : "Send Offer"}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Analyzes customer's booking history and sends a personalized offer based on their preferences
                    </p>
                  </div>

                  {/* Automated Offer Trigger */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Trigger Automated Offers</h3>
                    <div>
                      <Button
                        onClick={() => triggerAutomatedMutation.mutate()}
                        disabled={triggerAutomatedMutation.isPending}
                        variant="secondary"
                        className="w-full"
                        data-testid="button-trigger-automated"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {triggerAutomatedMutation.isPending ? "Processing..." : "Run Automated Offer Generation"}
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        Processes all eligible customers and sends personalized offers based on their booking patterns
                      </p>
                    </div>
                  </div>

                  {/* Scheduler Info */}
                  <div className="bg-muted/50 rounded-md p-4 space-y-2">
                    <h4 className="font-semibold text-sm">Automated Schedule</h4>
                    <p className="text-sm text-muted-foreground">
                      The system automatically sends offers twice daily:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>10:00 AM Dubai time (daily offers)</li>
                      <li>2:00 PM Dubai time (afternoon reminders)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                  <CardDescription>
                    Configure global platform commission rates and other settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Global Commission Rate */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="global-commission" className="text-base font-semibold">
                        Global Commission Rate
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Default commission percentage applied to all beauticians unless they have a custom rate set.
                        This is the percentage of each booking that Kosmospace keeps as platform commission.
                      </p>
                    </div>

                    <div className="flex items-end gap-4">
                      <div className="flex-1 max-w-xs">
                        <Label htmlFor="global-commission" className="text-sm mb-2 block">
                          Commission Percentage
                        </Label>
                        <div className="relative">
                          <Input
                            id="global-commission"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={globalCommission}
                            onChange={(e) => setGlobalCommission(parseFloat(e.target.value) || 0)}
                            className="pr-12"
                            data-testid="input-global-commission"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          if (globalCommission >= 0 && globalCommission <= 100) {
                            updateSettingsMutation.mutate(globalCommission);
                          } else {
                            toast({
                              title: "Invalid Value",
                              description: "Commission must be between 0 and 100",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={updateSettingsMutation.isPending}
                        data-testid="button-save-commission"
                      >
                        {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>

                    {/* Commission Preview */}
                    <div className="bg-muted/50 rounded-md p-4 space-y-2">
                      <h4 className="font-semibold text-sm">Commission Preview</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Booking Amount</p>
                          <p className="font-semibold">د.إ 1,000</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Platform Commission ({globalCommission}%)</p>
                          <p className="font-semibold text-primary">د.إ {((1000 * globalCommission) / 100).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Beautician Earnings</p>
                          <p className="font-semibold">د.إ {(1000 - (1000 * globalCommission) / 100).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="border-t pt-4 space-y-2">
                    <h4 className="font-semibold text-sm">How Commission Works</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Global commission applies to all beauticians by default</li>
                      <li>Individual beauticians can have custom commission rates set in the Applications tab</li>
                      <li>Custom rates override the global commission for specific beauticians</li>
                      <li>Changes take effect immediately for new bookings</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Social Media Links</CardTitle>
                  <CardDescription>
                    Manage social media URLs displayed in the website footer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook-url">Facebook URL</Label>
                      <Input
                        id="facebook-url"
                        type="url"
                        placeholder="https://facebook.com/kosmospace"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        data-testid="input-facebook-url"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram-url">Instagram URL</Label>
                      <Input
                        id="instagram-url"
                        type="url"
                        placeholder="https://instagram.com/kosmospace"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        data-testid="input-instagram-url"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter-url">Twitter (X) URL</Label>
                      <Input
                        id="twitter-url"
                        type="url"
                        placeholder="https://twitter.com/kosmospace"
                        value={twitterUrl}
                        onChange={(e) => setTwitterUrl(e.target.value)}
                        data-testid="input-twitter-url"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin-url">LinkedIn URL</Label>
                      <Input
                        id="linkedin-url"
                        type="url"
                        placeholder="https://linkedin.com/company/kosmospace"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        data-testid="input-linkedin-url"
                      />
                    </div>

                    <Button
                      onClick={() => {
                        updateSocialMediaMutation.mutate({
                          facebookUrl,
                          instagramUrl,
                          twitterUrl,
                          linkedinUrl,
                        });
                      }}
                      disabled={updateSocialMediaMutation.isPending}
                      data-testid="button-save-social-media"
                    >
                      {updateSocialMediaMutation.isPending ? "Saving..." : "Save Social Media Links"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
