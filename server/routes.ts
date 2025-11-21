import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupAdminAuth } from "./adminAuth";
import passport from "passport";
import { insertBeauticianSchema, insertServiceSchema, insertBookingSchema, insertReviewSchema, insertCustomerPreferencesSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import Stripe from "stripe";
import { OfferService } from "./services/offers";
import { triggerManualOfferGeneration } from "./scheduler";
import { AnalyticsDashboardService } from "./services/analytics-dashboard";
import { subDays, startOfDay, endOfDay } from "date-fns";
import rateLimit from 'express-rate-limit';
import { generateBlogArticles } from "./services/blogGenerator";
import { hashPassword } from "./adminAuth";
import { emailService } from "./services/email";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint - for monitoring and load balancers
  app.get('/api/health', async (req, res) => {
    try {
      // Check database connectivity by trying to fetch users count
      const users = await storage.getAllUsers();
      const isDbHealthy = Array.isArray(users);
      
      if (!isDbHealthy) {
        throw new Error('Database health check failed');
      }
      
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        database: 'connected',
      });
    } catch (error: any) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        database: 'disconnected',
      });
    }
  });

  // Stripe webhook - must be BEFORE body parsing middleware
  // Stripe needs raw body for signature verification
  app.post('/api/stripe/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      return res.status(400).send('No signature provided');
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is required');
      }
      
      event = stripe.webhooks.constructEvent(
        req.rawBody as Buffer,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('Payment succeeded:', paymentIntent.id);

          // Extract booking ID from metadata
          const bookingId = paymentIntent.metadata?.bookingId;
          if (bookingId) {
            // Idempotency check: don't update if already confirmed or cancelled
            const currentBooking = await storage.getBooking(bookingId);
            if (currentBooking?.status === 'confirmed' || currentBooking?.status === 'cancelled' || currentBooking?.status === 'completed') {
              console.log(`Booking ${bookingId} already in final state: ${currentBooking.status}. Skipping update.`);
              break;
            }
            
            // Update booking status to confirmed
            await storage.updateBookingStatus(bookingId, 'confirmed');
            console.log(`Booking ${bookingId} confirmed via payment ${paymentIntent.id}`);
          } else {
            console.warn('No bookingId in payment intent metadata:', paymentIntent.id);
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('Payment failed:', paymentIntent.id);

          // Extract booking ID and mark as cancelled
          const bookingId = paymentIntent.metadata?.bookingId;
          if (bookingId) {
            // Idempotency check: don't update if already in final state
            const currentBooking = await storage.getBooking(bookingId);
            if (currentBooking?.status === 'confirmed' || currentBooking?.status === 'cancelled' || currentBooking?.status === 'completed') {
              console.log(`Booking ${bookingId} already in final state: ${currentBooking.status}. Skipping update.`);
              break;
            }
            
            await storage.updateBookingStatus(bookingId, 'cancelled');
            console.log(`Booking ${bookingId} cancelled due to payment failure`);
          }
          break;
        }

        case 'payment_intent.canceled': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('Payment cancelled:', paymentIntent.id);

          const bookingId = paymentIntent.metadata?.bookingId;
          if (bookingId) {
            // Idempotency check: don't update if already in final state
            const currentBooking = await storage.getBooking(bookingId);
            if (currentBooking?.status === 'confirmed' || currentBooking?.status === 'cancelled' || currentBooking?.status === 'completed') {
              console.log(`Booking ${bookingId} already in final state: ${currentBooking.status}. Skipping update.`);
              break;
            }
            
            await storage.updateBookingStatus(bookingId, 'cancelled');
            console.log(`Booking ${bookingId} cancelled`);
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error handling webhook event:', error);
      res.status(500).json({ message: 'Webhook handler error' });
    }
  });

  // Auth middleware
  await setupAuth(app);
  setupAdminAuth(app);

  // Admin middleware - checks if user has admin role
  // Supports both OIDC admin users and local admin users
  const isAdmin = async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user;
    
    // Check if local admin user (logged in via email/password)
    if (user?.isLocalAdmin && user?.role === 'admin') {
      return next();
    }

    // Check if OIDC admin user (logged in via Replit Auth)
    const userId = user?.claims?.sub;
    if (userId) {
      const dbUser = await storage.getUser(userId);
      if (dbUser?.role === 'admin') {
        return next();
      }
    }

    return res.status(403).json({ message: "Admin access required" });
  };

  // Admin Login Routes
  app.post('/api/admin/login', adminLoginLimiter, (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error("Admin login error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      
      if (!user) {
        console.log('[SECURITY] Admin login failed:', { email: req.body.username, timestamp: new Date(), ip: req.ip });
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error("Session creation error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }

        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Failed to save session" });
          }

          console.log('[SECURITY] Admin login successful:', { email: user.email, timestamp: new Date(), ip: req.ip });
          res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          });
        });
      });
    })(req, res, next);
  });

  app.post('/api/admin/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Failed to destroy session" });
        }

        res.json({ message: "Logged out successfully" });
      });
    });
  });

  app.get('/api/admin/check', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    
    // Check if user is a local admin (logged in via email/password)
    if (user?.isLocalAdmin && user?.role === 'admin') {
      return res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isLocalAdmin: true,
      });
    }

    // If not a local admin, return unauthorized
    res.status(401).json({ message: "Not authenticated" });
  });

  // Customer Signup Route
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Email, password, first name, and last name are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }

      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Check if user already exists
      const allUsers = await storage.getAllUsers();
      const existingUser = allUsers.find(u => u.email === email);
      
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      // Hash password
      const { hashPassword } = await import('./adminAuth');
      const passwordHash = await hashPassword(password);

      // Create user
      const user = await storage.upsertUser({
        email,
        firstName,
        lastName,
        phone: phone || null,
        role: 'customer',
        passwordHash,
      });

      // Auto-login the user by creating a session
      // Pass the full user object to match admin login format
      const userForSession = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isLocalAdmin: false,
      };

      // Ensure session exists before logging in
      if (!req.session) {
        console.error("No session object available");
        return res.status(500).json({ message: "Session not initialized" });
      }

      req.logIn(userForSession, (err) => {
        if (err) {
          console.error("Session creation error:", err);
          console.error("Error details:", err.message, err.stack);
          return res.status(500).json({ 
            message: "Failed to create session",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }

        console.log("User logged in successfully, saving session...");
        console.log("Session ID:", req.sessionID);
        console.log("User in session:", req.user);

        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            console.error("Error details:", err.message, err.stack);
            return res.status(500).json({ 
              message: "Failed to save session",
              error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
          }

          console.log("Session saved successfully");
          res.status(201).json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          });
        });
      });
    } catch (error: any) {
      console.error("Error during signup:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Customer Login Route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { emailOrPhone, password } = req.body;

      if (!emailOrPhone || !password) {
        return res.status(400).json({ message: "Email/phone and password are required" });
      }

      // Find user by email or phone number
      const allUsers = await storage.getAllUsers();
      const user = allUsers.find(u => 
        u.email === emailOrPhone || u.phone === emailOrPhone
      );

      if (!user) {
        return res.status(401).json({ message: "Invalid email/phone or password" });
      }

      // Check if user has a password (local auth)
      if (!user.passwordHash) {
        return res.status(401).json({ message: "Please use Replit OIDC to sign in with this account" });
      }

      // Verify password
      const bcrypt = await import('bcrypt');
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email/phone or password" });
      }

      // Create session
      // Pass the full user object to match admin login format
      const userForSession = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isLocalAdmin: false,
      };

      // Ensure session exists before logging in
      if (!req.session) {
        console.error("No session object available");
        return res.status(500).json({ message: "Session not initialized" });
      }

      req.logIn(userForSession, (err) => {
        if (err) {
          console.error("Session creation error:", err);
          console.error("Error details:", err.message, err.stack);
          return res.status(500).json({ 
            message: "Failed to create session",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }

        console.log("User logged in successfully, saving session...");
        console.log("Session ID:", req.sessionID);
        console.log("User in session:", req.user);

        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            console.error("Error details:", err.message, err.stack);
            return res.status(500).json({ 
              message: "Failed to save session",
              error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
          }

          console.log("Session saved successfully");
          res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          });
        });
      });
    } catch (error: any) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Customer Logout Route
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Failed to destroy session" });
        }

        res.json({ message: "Logged out successfully" });
      });
    });
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }

      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has a beautician profile
      let beauticianProfile = null;
      if (user.role === 'beautician') {
        beauticianProfile = await storage.getBeauticianByUserId(userId);
      }

      res.json({
        ...user,
        beauticianProfile,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all users (admin only) - for offer sending
  app.get('/api/users', isAdmin, async (req, res) => {
    try {
      const allCustomers = await storage.getAllCustomers();
      res.json(allCustomers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Set user role (customer or beautician)
  app.post('/api/auth/set-role', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      const { role, phone } = req.body;

      if (!role || !['customer', 'beautician'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'customer' or 'beautician'" });
      }

      const user = await storage.updateUserRole(userId, role, phone);
      res.json(user);
    } catch (error) {
      console.error("Error setting user role:", error);
      res.status(500).json({ message: "Failed to set user role" });
    }
  });

  // Beautician onboarding (sign-up process - no authentication required)
  app.post('/api/beauticians/onboard', async (req: any, res) => {
    console.log('Beautician onboarding endpoint hit - no auth required');
    try {
      const { fullName, email, phone, bio, experience, startingPrice, availability, serviceAreas, services } = req.body;
      
      // Validate required fields
      if (!fullName || !email || !phone) {
        return res.status(400).json({ message: "Full name, email, and phone are required" });
      }

      // Parse full name into first and last name
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create or get user account
      let user;
      try {
        user = await storage.upsertUser({
          email,
          firstName,
          lastName,
          phone,
          role: 'beautician',
        });
      } catch (error: any) {
        // Handle duplicate email error
        if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === '23505') {
          return res.status(400).json({ message: "An account with this email already exists. Please use a different email or log in." });
        }
        throw error;
      }

      // Check if beautician profile already exists
      const existingBeautician = await storage.getBeauticianByUserId(user.id);
      if (existingBeautician) {
        return res.status(400).json({ message: "You have already submitted an application. Please wait for approval." });
      }

      // Validate beautician data
      const validation = insertBeauticianSchema.safeParse({
        bio,
        experience,
        startingPrice: parseInt(startingPrice),
        availability,
        serviceAreas,
        userId: user.id,
      });

      if (!validation.success) {
        return res.status(400).json({
          message: fromZodError(validation.error).toString(),
        });
      }

      const beautician = await storage.createBeautician(validation.data);

      // Create services
      if (services && Array.isArray(services)) {
        for (const serviceName of services) {
          await storage.createService({
            beauticianId: beautician.id,
            name: serviceName,
            price: parseInt(startingPrice),
            duration: 60, // default 60 minutes
          });
        }
      }

      res.json({ beautician, user, message: "Application submitted successfully" });
    } catch (error: any) {
      console.error("Error onboarding beautician:", error);
      
      // Handle duplicate email error
      if (error.message?.includes('unique') || error.message?.includes('duplicate') || error.code === '23505') {
        return res.status(400).json({ message: "An account with this email already exists" });
      }
      
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  // Get all beauticians with user names
  app.get('/api/beauticians', async (req, res) => {
    try {
      const beauticians = await storage.getAllBeauticians();
      
      // Enrich with user names
      const enrichedBeauticians = await Promise.all(
        beauticians.map(async (beautician) => {
          const user = await storage.getUser(beautician.userId);
          return {
            ...beautician,
            name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          };
        })
      );
      
      res.json(enrichedBeauticians);
    } catch (error) {
      console.error("Error fetching beauticians:", error);
      res.status(500).json({ message: "Failed to fetch beauticians" });
    }
  });

  // Get beautician by ID with services and user info
  app.get('/api/beauticians/:id', async (req, res) => {
    try {
      const beautician = await storage.getBeautician(req.params.id);
      if (!beautician) {
        return res.status(404).json({ message: "Beautician not found" });
      }

      const services = await storage.getServicesByBeauticianId(beautician.id);
      const user = await storage.getUser(beautician.userId);
      
      res.json({ 
        ...beautician, 
        services,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      });
    } catch (error) {
      console.error("Error fetching beautician:", error);
      res.status(500).json({ message: "Failed to fetch beautician" });
    }
  });

  // Get customer bookings
  app.get('/api/bookings/customer', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      const bookings = await storage.getBookingsByCustomerId(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching customer bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get beautician bookings
  app.get('/api/bookings/beautician', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      const beautician = await storage.getBeauticianByUserId(userId);
      
      if (!beautician) {
        return res.status(404).json({ message: "Beautician profile not found" });
      }

      const bookings = await storage.getBookingsByBeauticianId(beautician.id);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching beautician bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Beautician service management routes
  // Get beautician's own services
  app.get('/api/beautician/services', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      const beautician = await storage.getBeauticianByUserId(userId);
      
      if (!beautician) {
        return res.status(404).json({ message: "Beautician profile not found" });
      }

      const services = await storage.getServicesByBeauticianId(beautician.id);
      res.json(services);
    } catch (error) {
      console.error("Error fetching beautician services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Create a new service
  app.post('/api/beautician/services', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      const beautician = await storage.getBeauticianByUserId(userId);
      
      if (!beautician) {
        return res.status(404).json({ message: "Beautician profile not found" });
      }

      // Validate price and duration are integers
      const price = Number(req.body.price);
      const duration = Number(req.body.duration);
      
      if (!Number.isInteger(price) || price <= 0) {
        return res.status(400).json({ message: "Price must be a positive integer" });
      }
      
      if (!Number.isInteger(duration) || duration <= 0) {
        return res.status(400).json({ message: "Duration must be a positive integer" });
      }

      const validationResult = insertServiceSchema.safeParse({
        beauticianId: beautician.id,
        name: req.body.name,
        price,
        duration
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid service data",
          errors: validationResult.error.errors 
        });
      }

      const service = await storage.createService(validationResult.data);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // Update a service
  app.patch('/api/beautician/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      const beautician = await storage.getBeauticianByUserId(userId);
      
      if (!beautician) {
        return res.status(404).json({ message: "Beautician profile not found" });
      }

      // Verify the service belongs to this beautician
      const services = await storage.getServicesByBeauticianId(beautician.id);
      const serviceExists = services.find(s => s.id === req.params.id);
      
      if (!serviceExists) {
        return res.status(403).json({ message: "You can only update your own services" });
      }

      // Validate and prepare update data
      const updateData: any = {};
      
      if (req.body.name !== undefined) {
        updateData.name = req.body.name;
      }
      
      if (req.body.price !== undefined) {
        const price = Number(req.body.price);
        if (!Number.isInteger(price) || price <= 0) {
          return res.status(400).json({ message: "Price must be a positive integer" });
        }
        updateData.price = price;
      }
      
      if (req.body.duration !== undefined) {
        const duration = Number(req.body.duration);
        if (!Number.isInteger(duration) || duration <= 0) {
          return res.status(400).json({ message: "Duration must be a positive integer" });
        }
        updateData.duration = duration;
      }

      const service = await storage.updateService(req.params.id, updateData);
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  // Delete a service
  app.delete('/api/beautician/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      const beautician = await storage.getBeauticianByUserId(userId);
      
      if (!beautician) {
        return res.status(404).json({ message: "Beautician profile not found" });
      }

      // Verify the service belongs to this beautician
      const services = await storage.getServicesByBeauticianId(beautician.id);
      const serviceExists = services.find(s => s.id === req.params.id);
      
      if (!serviceExists) {
        return res.status(403).json({ message: "You can only delete your own services" });
      }

      await storage.deleteService(req.params.id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Booking routes
  // Get all bookings - returns bookings based on user role
  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Admin users get all bookings
      if (user.role === 'admin') {
        const bookings = await storage.getAllBookings();
        return res.json(bookings);
      }

      // Beauticians get their own bookings
      if (user.role === 'beautician') {
        const beautician = await storage.getBeauticianByUserId(userId);
        if (!beautician) {
          return res.status(404).json({ message: "Beautician profile not found" });
        }
        const bookings = await storage.getBookingsByBeauticianId(beautician.id);
        return res.json(bookings);
      }

      // Customers get their own bookings
      const bookings = await storage.getBookingsByCustomerId(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Create a new booking
  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      const { beauticianId, serviceId, scheduledDate, location, notes } = req.body;

      // Get service details for pricing
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Calculate amounts (10% platform fee)
      const totalAmount = service.price;
      const platformFee = Math.round(totalAmount * 0.1);
      const beauticianEarnings = totalAmount - platformFee;

      // Create booking first to get booking ID
      const booking = await storage.createBooking({
        customerId: userId,
        beauticianId,
        serviceId,
        scheduledDate: new Date(scheduledDate),
        location,
        status: 'pending',
        totalAmount,
        platformFee,
        beauticianEarnings,
        stripePaymentIntentId: '', // Will update after creating payment intent
      });

      // Create Stripe payment intent with booking ID in metadata
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount * 100, // Convert AED to fils (cents)
        currency: "aed",
        metadata: {
          bookingId: booking.id.toString(),
          customerId: userId,
          beauticianId,
          serviceId,
        },
      });

      // Update booking with payment intent ID  
      await storage.updateBookingPaymentIntent(booking.id, paymentIntent.id);

      res.status(201).json({
        booking: { ...booking, stripePaymentIntentId: paymentIntent.id },
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Get customer bookings
  app.get('/api/bookings/customer', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      const bookingsData = await storage.getBookingsByCustomerId(userId);
      
      // Enrich bookings with related data
      const enrichedBookings = await Promise.all(
        bookingsData.map(async (booking) => {
          const service = await storage.getService(booking.serviceId);
          const beautician = await storage.getBeautician(booking.beauticianId);
          const user = beautician ? await storage.getUser(beautician.userId) : null;
          const review = await storage.getReviewByBookingId(booking.id);
          
          return {
            ...booking,
            serviceName: service?.name || 'Unknown Service',
            beauticianName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
            hasReview: !!review,
          };
        })
      );
      
      res.json(enrichedBookings);
    } catch (error) {
      console.error("Error fetching customer bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get beautician bookings
  app.get('/api/bookings/beautician', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      const beautician = await storage.getBeauticianByUserId(userId);
      
      if (!beautician) {
        return res.status(404).json({ message: "Beautician profile not found" });
      }

      const bookingsData = await storage.getBookingsByBeauticianId(beautician.id);
      
      // Enrich bookings with related data
      const enrichedBookings = await Promise.all(
        bookingsData.map(async (booking) => {
          const service = await storage.getService(booking.serviceId);
          const customer = await storage.getUser(booking.customerId);
          
          return {
            ...booking,
            serviceName: service?.name || 'Unknown Service',
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown',
          };
        })
      );
      
      res.json(enrichedBookings);
    } catch (error) {
      console.error("Error fetching beautician bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Cancel a booking
  app.patch('/api/bookings/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      const booking = await storage.getBooking(req.params.id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify user owns this booking
      if (booking.customerId !== userId) {
        return res.status(403).json({ message: "You can only cancel your own bookings" });
      }

      // Only allow cancellation of pending bookings
      if (booking.status !== 'pending') {
        return res.status(400).json({ message: "Only pending bookings can be cancelled" });
      }

      const cancelledBooking = await storage.cancelBooking(req.params.id);
      res.json(cancelledBooking);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Review routes
  // Create a review
  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      const { bookingId, rating, comment } = req.body;

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      // Verify booking exists and belongs to user
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.customerId !== userId) {
        return res.status(403).json({ message: "You can only review your own bookings" });
      }

      // Check if review already exists
      const existingReview = await storage.getReviewByBookingId(bookingId);
      if (existingReview) {
        return res.status(400).json({ message: "You have already reviewed this booking" });
      }

      // Create review
      const review = await storage.createReview({
        bookingId,
        customerId: userId,
        beauticianId: booking.beauticianId,
        rating,
        comment: comment || null,
      });

      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Get reviews for a beautician
  app.get('/api/beauticians/:id/reviews', async (req, res) => {
    try {
      const reviewsData = await storage.getReviewsByBeauticianId(req.params.id);
      
      // Enrich reviews with customer names
      const enrichedReviews = await Promise.all(
        reviewsData.map(async (review) => {
          const customer = await storage.getUser(review.customerId);
          return {
            ...review,
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Anonymous',
          };
        })
      );
      
      res.json(enrichedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Create a review for a beautician
  app.post('/api/beauticians/:id/reviews', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      const beauticianId = req.params.id;
      const { rating, comment } = req.body;

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      // Validate comment
      if (!comment || comment.trim().length < 10) {
        return res.status(400).json({ message: "Comment must be at least 10 characters" });
      }

      // Create review directly for beautician (without requiring booking)
      const review = await storage.createReview({
        customerId: userId,
        beauticianId,
        rating,
        comment: comment.trim(),
        bookingId: null,
      });

      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Get all bookings (admin only)
  app.get('/api/admin/bookings', isAdmin, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get pending beautician applications (admin only)
  app.get('/api/admin/beauticians/pending', isAdmin, async (req, res) => {
    try {
      const beauticians = await storage.getPendingBeauticians();
      res.json(beauticians);
    } catch (error) {
      console.error("Error fetching pending beauticians:", error);
      res.status(500).json({ message: "Failed to fetch pending beauticians" });
    }
  });

  // Approve beautician (admin only)
  app.post('/api/admin/beauticians/:id/approve', isAdmin, async (req, res) => {
    try {
      // Get beautician first
      const beautician = await storage.getBeautician(req.params.id);
      if (!beautician) {
        return res.status(404).json({ message: "Beautician not found" });
      }

      // Get user info
      const user = await storage.getUser(beautician.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate random password
      const generatePassword = () => {
        const length = 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
          password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
      };

      const plainPassword = generatePassword();
      const passwordHash = await hashPassword(plainPassword);

      // Update user with password
      await storage.updateUserPassword(beautician.userId, passwordHash);

      // Approve beautician
      const approvedBeautician = await storage.approveBeautician(req.params.id);
      if (!approvedBeautician) {
        return res.status(404).json({ message: "Failed to approve beautician" });
      }

      // Send email with credentials
      const emailResult = await emailService.sendBeauticianApprovalEmail(
        user.email!,
        user.firstName || 'Beautician',
        plainPassword
      );

      if (!emailResult.success) {
        // Log error but don't fail the approval
        console.error('Failed to send approval email:', emailResult.error);
        // You might want to store the password temporarily or send via WhatsApp as fallback
      }

      res.json({
        message: "Beautician approved successfully",
        beautician: approvedBeautician,
        emailSent: emailResult.success,
        emailError: emailResult.error,
      });
    } catch (error) {
      console.error("Error approving beautician:", error);
      res.status(500).json({ message: "Failed to approve beautician" });
    }
  });

  // Reject beautician (admin only)
  app.post('/api/admin/beauticians/:id/reject', isAdmin, async (req, res) => {
    try {
      await storage.rejectBeautician(req.params.id);
      res.json({ message: "Beautician application rejected" });
    } catch (error) {
      console.error("Error rejecting beautician:", error);
      res.status(500).json({ message: "Failed to reject beautician" });
    }
  });

  // Get platform settings (admin only)
  app.get('/api/admin/settings', isAdmin, async (req, res) => {
    try {
      const settings = await storage.getPlatformSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching platform settings:", error);
      res.status(500).json({ message: "Failed to fetch platform settings" });
    }
  });

  // Update platform settings (admin only)
  app.put('/api/admin/settings', isAdmin, async (req, res) => {
    try {
      const { globalCommissionPercentage, facebookUrl, instagramUrl, twitterUrl, linkedinUrl } = req.body;
      
      const updates: any = {};
      
      // Validate and add commission percentage if provided
      if (globalCommissionPercentage !== undefined && globalCommissionPercentage !== null) {
        if (typeof globalCommissionPercentage !== 'number' || globalCommissionPercentage < 0 || globalCommissionPercentage > 100) {
          return res.status(400).json({ message: "Commission percentage must be a number between 0 and 100" });
        }
        updates.globalCommissionPercentage = globalCommissionPercentage;
      }
      
      // Add social media URLs if provided
      if (facebookUrl !== undefined) updates.facebookUrl = facebookUrl;
      if (instagramUrl !== undefined) updates.instagramUrl = instagramUrl;
      if (twitterUrl !== undefined) updates.twitterUrl = twitterUrl;
      if (linkedinUrl !== undefined) updates.linkedinUrl = linkedinUrl;
      
      const settings = await storage.updatePlatformSettings(updates);
      res.json({ message: "Platform settings updated", settings });
    } catch (error) {
      console.error("Error updating platform settings:", error);
      res.status(500).json({ message: "Failed to update platform settings" });
    }
  });

  // Get social media URLs (public endpoint for footer)
  app.get('/api/settings/social-media', async (req, res) => {
    try {
      const settings = await storage.getPlatformSettings();
      res.json({
        facebookUrl: settings.facebookUrl,
        instagramUrl: settings.instagramUrl,
        twitterUrl: settings.twitterUrl,
        linkedinUrl: settings.linkedinUrl,
      });
    } catch (error) {
      console.error("Error fetching social media URLs:", error);
      res.status(500).json({ message: "Failed to fetch social media URLs" });
    }
  });

  // Update beautician commission (admin only)
  app.patch('/api/admin/beauticians/:id/commission', isAdmin, async (req, res) => {
    try {
      const { commissionPercentage } = req.body;
      
      // Validate commission percentage if provided
      if (commissionPercentage !== null && commissionPercentage !== undefined) {
        if (typeof commissionPercentage !== 'number' || commissionPercentage < 0 || commissionPercentage > 100) {
          return res.status(400).json({ message: "Commission percentage must be a number between 0 and 100" });
        }
      }
      
      const beautician = await storage.updateBeauticianCommission(req.params.id, commissionPercentage);
      
      if (!beautician) {
        return res.status(404).json({ message: "Beautician not found" });
      }
      
      res.json({ 
        message: commissionPercentage === null ? "Using global commission rate" : "Custom commission rate set", 
        beautician 
      });
    } catch (error) {
      console.error("Error updating beautician commission:", error);
      res.status(500).json({ message: "Failed to update beautician commission" });
    }
  });

  // Update booking status (admin only)
  app.patch('/api/admin/bookings/:id/status', isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }

      const booking = await storage.updateBookingStatus(req.params.id, status);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json({ message: "Booking status updated", booking });
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // WhatsApp Notification & Offer Endpoints

  // Get customer notification preferences
  app.get('/api/notifications/preferences', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      const prefs = await storage.getCustomerPreferences(userId);
      
      if (!prefs) {
        // Return default preferences if none exist
        const user = await storage.getUser(userId);
        return res.json({
          customerId: userId,
          whatsappNumber: user?.phone || null,
          whatsappOptIn: true,
          receiveOffers: true,
          receiveReminders: true,
          preferredContactTime: 'morning',
        });
      }
      
      res.json(prefs);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  // Update customer notification preferences
  app.put('/api/notifications/preferences', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      
      // Validate request body
      const parseResult = insertCustomerPreferencesSchema.safeParse({
        ...req.body,
        customerId: userId,
      });
      
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid preferences data",
          errors: fromZodError(parseResult.error).toString(),
        });
      }

      // Check if preferences exist
      const existing = await storage.getCustomerPreferences(userId);
      
      let prefs;
      if (existing) {
        // Update existing
        prefs = await storage.updateCustomerPreferences(userId, req.body);
      } else {
        // Create new
        prefs = await storage.createCustomerPreferences({
          ...req.body,
          customerId: userId,
        });
      }
      
      res.json(prefs);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Send personalized offer to a customer (admin only)
  app.post('/api/offers/send', isAdmin, async (req, res) => {
    try {
      const { customerId } = req.body;
      
      if (!customerId) {
        return res.status(400).json({ message: "Customer ID is required" });
      }

      const offerService = new OfferService(storage);
      const result = await offerService.generateAndSendOffer(customerId);
      
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error sending offer:", error);
      res.status(500).json({ message: "Failed to send offer" });
    }
  });

  // Trigger manual offer generation for all eligible customers (admin only)
  app.post('/api/offers/trigger-automated', isAdmin, async (req, res) => {
    try {
      const result = await triggerManualOfferGeneration();
      res.json({
        message: `Automated offer generation completed`,
        sent: result.sent,
        failed: result.failed,
      });
    } catch (error) {
      console.error("Error triggering automated offers:", error);
      res.status(500).json({ message: "Failed to trigger automated offers" });
    }
  });

  // Get customer offers
  app.get('/api/offers/customer', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OIDC users (with claims.sub) and local auth users (with id)
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "Invalid session" });
      }
      const offers = await storage.getOffersByCustomerId(userId);
      res.json(offers);
    } catch (error) {
      console.error("Error fetching customer offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  // Track offer click
  app.post('/api/offers/:id/click', isAuthenticated, async (req, res) => {
    try {
      const offer = await storage.updateOfferStatus(req.params.id, 'clicked');
      res.json(offer);
    } catch (error) {
      console.error("Error tracking offer click:", error);
      res.status(500).json({ message: "Failed to track offer click" });
    }
  });

  // Analytics routes (admin only)
  const analyticsService = new AnalyticsDashboardService(storage);

  // Get date range from query params or default to last 30 days
  const getDateRange = (req: any) => {
    const days = parseInt(req.query.days) || 30;
    const endDate = endOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, days));
    return { startDate, endDate };
  };

  // Get overview metrics
  app.get('/api/admin/analytics/overview', isAdmin, async (req: any, res) => {
    try {
      const dateRange = getDateRange(req);
      const metrics = await analyticsService.getOverviewMetrics(dateRange);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching overview metrics:", error);
      res.status(500).json({ message: "Failed to fetch overview metrics" });
    }
  });

  // Get customer analytics
  app.get('/api/admin/analytics/customers', isAdmin, async (req: any, res) => {
    try {
      const dateRange = getDateRange(req);
      const metrics = await analyticsService.getCustomerMetrics(dateRange);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching customer metrics:", error);
      res.status(500).json({ message: "Failed to fetch customer metrics" });
    }
  });

  // Get beautician analytics
  app.get('/api/admin/analytics/beauticians', isAdmin, async (req: any, res) => {
    try {
      const dateRange = getDateRange(req);
      const metrics = await analyticsService.getBeauticianMetrics(dateRange);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching beautician metrics:", error);
      res.status(500).json({ message: "Failed to fetch beautician metrics" });
    }
  });

  // Get retention analytics
  app.get('/api/admin/analytics/retention', isAdmin, async (req: any, res) => {
    try {
      const dateRange = getDateRange(req);
      const metrics = await analyticsService.getRetentionMetrics(dateRange);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching retention metrics:", error);
      res.status(500).json({ message: "Failed to fetch retention metrics" });
    }
  });

  // Ultramessage webhook (for delivery status)
  app.post('/api/webhooks/ultramessage', async (req, res) => {
    try {
      // Ultramessage sends delivery status updates
      console.log('Ultramessage webhook received:', req.body);
      // You can add logic here to update message status based on delivery reports
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing Ultramessage webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Blog routes
  app.get('/api/blog', async (req, res) => {
    try {
      const posts = await storage.getAllBlogPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get('/api/blog/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  // Admin blog generation routes
  app.post('/api/admin/blog/generate', isAdmin, async (req: any, res) => {
    try {
      const { articleCount, focusKeywords } = req.body;
      
      if (!articleCount || ![2, 4, 6].includes(articleCount)) {
        return res.status(400).json({ message: "Article count must be 2, 4, or 6" });
      }

      // Check for OpenAI API key before creating the job
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ 
          message: "OpenAI API key is not configured. Please add OPENAI_API_KEY to your Replit Secrets to enable blog generation." 
        });
      }

      const job = await storage.createBlogGenerationJob({
        requestedBy: req.user.id,
        articleCount,
        focusKeywords: focusKeywords || [],
      });

      generateBlogArticles(job.id, articleCount, focusKeywords || [])
        .catch(error => {
          console.error('Background blog generation failed:', error);
        });

      res.json(job);
    } catch (error) {
      console.error("Error creating blog generation job:", error);
      res.status(500).json({ message: "Failed to create blog generation job" });
    }
  });

  app.get('/api/admin/blog/jobs', isAdmin, async (req, res) => {
    try {
      const jobs = await storage.getAllBlogGenerationJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching blog generation jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get('/api/admin/blog/jobs/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const job = await storage.getBlogGenerationJob(id);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching blog generation job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.put('/api/admin/blog/:id/publish', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const post = await storage.publishBlogPost(id);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error publishing blog post:", error);
      res.status(500).json({ message: "Failed to publish blog post" });
    }
  });

  app.put('/api/admin/blog/:id/unpublish', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const post = await storage.unpublishBlogPost(id);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error unpublishing blog post:", error);
      res.status(500).json({ message: "Failed to unpublish blog post" });
    }
  });

  app.delete('/api/admin/blog/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBlogPost(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
