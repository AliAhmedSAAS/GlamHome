import {
  users,
  beauticians,
  services,
  bookings,
  reviews,
  customerPreferences,
  offers,
  whatsappMessages,
  platformSettings,
  blogPosts,
  blogGenerationJobs,
  type User,
  type UpsertUser,
  type Beautician,
  type InsertBeautician,
  type Service,
  type InsertService,
  type Booking,
  type InsertBooking,
  type Review,
  type InsertReview,
  type CustomerPreferences,
  type InsertCustomerPreferences,
  type Offer,
  type InsertOffer,
  type WhatsappMessage,
  type InsertWhatsappMessage,
  type PlatformSettings,
  type InsertPlatformSettings,
  type BlogPost,
  type InsertBlogPost,
  type BlogGenerationJob,
  type InsertBlogGenerationJob,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string, phone?: string): Promise<User | undefined>;
  
  // Beautician operations
  createBeautician(beautician: InsertBeautician): Promise<Beautician>;
  getBeautician(id: string): Promise<Beautician | undefined>;
  getBeauticianByUserId(userId: string): Promise<Beautician | undefined>;
  getAllBeauticians(): Promise<Beautician[]>;
  updateBeautician(id: string, data: Partial<InsertBeautician>): Promise<Beautician | undefined>;
  
  // Admin beautician operations
  getPendingBeauticians(): Promise<Beautician[]>;
  approveBeautician(id: string): Promise<Beautician | undefined>;
  rejectBeautician(id: string): Promise<void>;
  
  // Service operations
  createService(service: InsertService): Promise<Service>;
  getServicesByBeauticianId(beauticianId: string): Promise<Service[]>;
  updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<void>;
  
  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByCustomerId(customerId: string): Promise<Booking[]>;
  getBookingsByBeauticianId(beauticianId: string): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;
  updateBookingPaymentIntent(id: string, paymentIntentId: string): Promise<Booking | undefined>;
  cancelBooking(id: string): Promise<Booking | undefined>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByBeauticianId(beauticianId: string): Promise<Review[]>;
  getReviewByBookingId(bookingId: string): Promise<Review | undefined>;
  getService(id: string): Promise<Service | undefined>;
  
  // Analytics operations
  getAllCustomers(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  getAllServices(): Promise<Service[]>;
  getAllReviews(): Promise<Review[]>;
  getAllCustomerPreferences(): Promise<CustomerPreferences[]>;
  
  // Customer preferences operations
  getCustomerPreferences(customerId: string): Promise<CustomerPreferences | undefined>;
  createCustomerPreferences(prefs: InsertCustomerPreferences): Promise<CustomerPreferences>;
  updateCustomerPreferences(customerId: string, prefs: Partial<InsertCustomerPreferences>): Promise<CustomerPreferences | undefined>;
  
  // Offer operations
  createOffer(offer: InsertOffer): Promise<Offer>;
  getOffer(id: string): Promise<Offer | undefined>;
  getOffersByCustomerId(customerId: string): Promise<Offer[]>;
  updateOfferStatus(id: string, status: string): Promise<Offer | undefined>;
  
  // WhatsApp message operations
  createWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage>;
  getWhatsappMessagesByCustomerId(customerId: string): Promise<WhatsappMessage[]>;
  
  // Platform settings operations
  getPlatformSettings(): Promise<PlatformSettings>;
  updatePlatformSettings(data: Partial<InsertPlatformSettings>): Promise<PlatformSettings>;
  updateBeauticianCommission(beauticianId: string, commissionPercentage: number | null): Promise<Beautician | undefined>;
  
  // Blog operations
  getAllBlogPosts(): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  publishBlogPost(id: string): Promise<BlogPost | undefined>;
  unpublishBlogPost(id: string): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<void>;
  
  // Blog generation jobs
  createBlogGenerationJob(job: InsertBlogGenerationJob): Promise<BlogGenerationJob>;
  getAllBlogGenerationJobs(): Promise<BlogGenerationJob[]>;
  getBlogGenerationJob(id: string): Promise<BlogGenerationJob | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First try to update by email if user exists
    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);
    
    if (existingByEmail.length > 0) {
      // Update existing user
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.email, userData.email))
        .returning();
      return user;
    }
    
    // Otherwise insert new user
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string, phone?: string): Promise<User | undefined> {
    const updateData: any = { role, updatedAt: new Date() };
    if (phone) {
      updateData.phone = phone;
    }
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Beautician operations
  async createBeautician(beauticianData: InsertBeautician): Promise<Beautician> {
    const [beautician] = await db
      .insert(beauticians)
      .values(beauticianData)
      .returning();
    return beautician;
  }

  async getBeautician(id: string): Promise<Beautician | undefined> {
    const [beautician] = await db
      .select()
      .from(beauticians)
      .where(eq(beauticians.id, id));
    return beautician;
  }

  async getBeauticianByUserId(userId: string): Promise<Beautician | undefined> {
    const [beautician] = await db
      .select()
      .from(beauticians)
      .where(eq(beauticians.userId, userId));
    return beautician;
  }

  async getAllBeauticians(): Promise<Beautician[]> {
    return await db
      .select()
      .from(beauticians)
      .where(eq(beauticians.isApproved, true))
      .orderBy(desc(beauticians.rating));
  }

  async updateBeautician(id: string, data: Partial<InsertBeautician>): Promise<Beautician | undefined> {
    const [beautician] = await db
      .update(beauticians)
      .set(data)
      .where(eq(beauticians.id, id))
      .returning();
    return beautician;
  }

  // Admin beautician operations
  async getPendingBeauticians(): Promise<Beautician[]> {
    return await db
      .select()
      .from(beauticians)
      .where(eq(beauticians.isApproved, false))
      .orderBy(desc(beauticians.createdAt));
  }

  async approveBeautician(id: string): Promise<Beautician | undefined> {
    const [beautician] = await db
      .update(beauticians)
      .set({ isApproved: true })
      .where(eq(beauticians.id, id))
      .returning();
    return beautician;
  }

  async rejectBeautician(id: string): Promise<void> {
    await db.delete(beauticians).where(eq(beauticians.id, id));
  }

  // Service operations
  async createService(serviceData: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(serviceData)
      .returning();
    return service;
  }

  async getServicesByBeauticianId(beauticianId: string): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.beauticianId, beauticianId));
  }

  async updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db
      .update(services)
      .set(data)
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Booking operations
  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(bookingData)
      .returning();
    return booking;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));
    return booking;
  }

  async getBookingsByCustomerId(customerId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.customerId, customerId))
      .orderBy(desc(bookings.scheduledDate));
  }

  async getBookingsByBeauticianId(beauticianId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.beauticianId, beauticianId))
      .orderBy(desc(bookings.scheduledDate));
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.createdAt));
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async updateBookingPaymentIntent(id: string, paymentIntentId: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ stripePaymentIntentId: paymentIntentId })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async cancelBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ status: 'cancelled' })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  // Review operations
  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(reviewData)
      .returning();
    
    // Update beautician rating
    const beauticianReviews = await this.getReviewsByBeauticianId(reviewData.beauticianId);
    const avgRating = beauticianReviews.reduce((sum, r) => sum + r.rating, 0) / beauticianReviews.length;
    
    await db
      .update(beauticians)
      .set({
        rating: avgRating.toFixed(2),
        reviewCount: beauticianReviews.length,
      })
      .where(eq(beauticians.id, reviewData.beauticianId));
    
    return review;
  }

  async getReviewsByBeauticianId(beauticianId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.beauticianId, beauticianId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewByBookingId(bookingId: string): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.bookingId, bookingId));
    return review;
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, id));
    return service;
  }

  // Analytics operations
  async getAllCustomers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, 'customer'));
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users);
  }

  async getAllServices(): Promise<Service[]> {
    return await db
      .select()
      .from(services);
  }

  async getAllReviews(): Promise<Review[]> {
    return await db
      .select()
      .from(reviews);
  }

  async getAllCustomerPreferences(): Promise<CustomerPreferences[]> {
    return await db
      .select()
      .from(customerPreferences);
  }

  // Customer preferences operations
  async getCustomerPreferences(customerId: string): Promise<CustomerPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(customerPreferences)
      .where(eq(customerPreferences.customerId, customerId));
    return prefs;
  }

  async createCustomerPreferences(prefsData: InsertCustomerPreferences): Promise<CustomerPreferences> {
    const [prefs] = await db
      .insert(customerPreferences)
      .values(prefsData)
      .returning();
    return prefs;
  }

  async updateCustomerPreferences(
    customerId: string, 
    prefsData: Partial<InsertCustomerPreferences>
  ): Promise<CustomerPreferences | undefined> {
    const [prefs] = await db
      .update(customerPreferences)
      .set({ ...prefsData, updatedAt: new Date() })
      .where(eq(customerPreferences.customerId, customerId))
      .returning();
    return prefs;
  }

  // Offer operations
  async createOffer(offerData: InsertOffer): Promise<Offer> {
    const [offer] = await db
      .insert(offers)
      .values(offerData)
      .returning();
    return offer;
  }

  async getOffer(id: string): Promise<Offer | undefined> {
    const [offer] = await db
      .select()
      .from(offers)
      .where(eq(offers.id, id));
    return offer;
  }

  async getOffersByCustomerId(customerId: string): Promise<Offer[]> {
    return await db
      .select()
      .from(offers)
      .where(eq(offers.customerId, customerId))
      .orderBy(desc(offers.createdAt));
  }

  async updateOfferStatus(id: string, status: string): Promise<Offer | undefined> {
    const updateData: any = { status };
    if (status === 'sent') {
      updateData.sentAt = new Date();
    } else if (status === 'clicked') {
      updateData.clickedAt = new Date();
    } else if (status === 'booked') {
      updateData.bookedAt = new Date();
    }

    const [offer] = await db
      .update(offers)
      .set(updateData)
      .where(eq(offers.id, id))
      .returning();
    return offer;
  }

  // WhatsApp message operations
  async createWhatsappMessage(messageData: InsertWhatsappMessage): Promise<WhatsappMessage> {
    const updateData: any = { ...messageData };
    
    // Set sentAt if not already set
    if (!messageData.sentAt && messageData.providerMessageId) {
      updateData.sentAt = new Date();
      updateData.status = 'sent';
    }

    const [message] = await db
      .insert(whatsappMessages)
      .values(updateData)
      .returning();
    return message;
  }

  async getWhatsappMessagesByCustomerId(customerId: string): Promise<WhatsappMessage[]> {
    return await db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.customerId, customerId))
      .orderBy(desc(whatsappMessages.createdAt));
  }

  // Platform settings operations
  async getPlatformSettings(): Promise<PlatformSettings> {
    const [settings] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, 'default'));
    
    // If no settings exist, create default with 50% commission
    if (!settings) {
      const [newSettings] = await db
        .insert(platformSettings)
        .values({ id: 'default', globalCommissionPercentage: 50 })
        .returning();
      return newSettings;
    }
    
    return settings;
  }

  async updatePlatformSettings(data: Partial<InsertPlatformSettings>): Promise<PlatformSettings> {
    const [settings] = await db
      .update(platformSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(platformSettings.id, 'default'))
      .returning();
    
    if (!settings) {
      throw new Error('Platform settings not found');
    }
    
    return settings;
  }

  async updateBeauticianCommission(beauticianId: string, commissionPercentage: number | null): Promise<Beautician | undefined> {
    const [beautician] = await db
      .update(beauticians)
      .set({ commissionPercentage })
      .where(eq(beauticians.id, beauticianId))
      .returning();
    
    return beautician;
  }

  // Blog operations
  async getAllBlogPosts(): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true))
      .orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)));
    return post;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db
      .insert(blogPosts)
      .values(post)
      .returning();
    return newPost;
  }

  async publishBlogPost(id: string): Promise<BlogPost | undefined> {
    const [post] = await db
      .update(blogPosts)
      .set({ isPublished: true, publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return post;
  }

  async unpublishBlogPost(id: string): Promise<BlogPost | undefined> {
    const [post] = await db
      .update(blogPosts)
      .set({ isPublished: false, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return post;
  }

  async deleteBlogPost(id: string): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  // Blog generation jobs
  async createBlogGenerationJob(job: InsertBlogGenerationJob): Promise<BlogGenerationJob> {
    const [newJob] = await db
      .insert(blogGenerationJobs)
      .values(job)
      .returning();
    return newJob;
  }

  async getAllBlogGenerationJobs(): Promise<BlogGenerationJob[]> {
    return await db
      .select()
      .from(blogGenerationJobs)
      .orderBy(desc(blogGenerationJobs.createdAt));
  }

  async getBlogGenerationJob(id: string): Promise<BlogGenerationJob | undefined> {
    const [job] = await db
      .select()
      .from(blogGenerationJobs)
      .where(eq(blogGenerationJobs.id, id));
    return job;
  }
}

export const storage = new DatabaseStorage();
