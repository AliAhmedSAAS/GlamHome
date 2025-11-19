import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - integrated with Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: text("phone"),
  role: text("role"), // 'customer', 'beautician', or 'admin'
  passwordHash: text("password_hash"), // Optional - for admin local auth
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const beauticians = pgTable("beauticians", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bio: text("bio"),
  experience: text("experience").notNull(), // '1-2', '3-5', '6-10', '10+'
  startingPrice: integer("starting_price").notNull(),
  availability: text("availability").notNull().default('flexible'),
  rating: decimal("rating", { precision: 3, scale: 2 }).default('0'),
  reviewCount: integer("review_count").notNull().default(0),
  isApproved: boolean("is_approved").notNull().default(false),
  serviceAreas: text("service_areas").array().notNull(), // ['Dubai Marina', 'Jumeirah', ...]
  commissionPercentage: integer("commission_percentage"), // Optional override, if null uses global commission
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  beauticianId: varchar("beautician_id").notNull().references(() => beauticians.id),
  name: text("name").notNull(), // 'makeup', 'lashes', 'manicure', 'pedicure', 'nails'
  price: integer("price").notNull(),
  duration: integer("duration").notNull(), // minutes
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  beauticianId: varchar("beautician_id").notNull().references(() => beauticians.id),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'confirmed', 'completed', 'cancelled'
  totalAmount: integer("total_amount").notNull(),
  platformFee: integer("platform_fee").notNull(), // commission for Kosmospace
  beauticianEarnings: integer("beautician_earnings").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  beauticianId: varchar("beautician_id").notNull().references(() => beauticians.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Customer notification preferences
export const customerPreferences = pgTable("customer_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().unique().references(() => users.id),
  whatsappOptIn: boolean("whatsapp_opt_in").notNull().default(true),
  whatsappNumber: text("whatsapp_number"),
  preferredContactTime: text("preferred_contact_time").default('morning'), // 'morning', 'afternoon', 'evening'
  receiveOffers: boolean("receive_offers").notNull().default(true),
  receiveReminders: boolean("receive_reminders").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Automated offers sent to customers
export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  beauticianId: varchar("beautician_id").notNull().references(() => beauticians.id),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  offerType: text("offer_type").notNull(), // 'interval_reminder', 'loyalty_discount', 'comeback'
  discountPercent: integer("discount_percent").default(0),
  originalPrice: integer("original_price").notNull(),
  discountedPrice: integer("discounted_price").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'sent', 'delivered', 'read', 'clicked', 'booked', 'expired'
  sentAt: timestamp("sent_at"),
  expiresAt: timestamp("expires_at").notNull(),
  clickedAt: timestamp("clicked_at"),
  bookedAt: timestamp("booked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// WhatsApp message log
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  offerId: varchar("offer_id").references(() => offers.id),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  phoneNumber: text("phone_number").notNull(),
  provider: text("provider").notNull(), // 'ultramessage', 'twilio'
  messageType: text("message_type").notNull(), // 'offer', 'reminder', 'confirmation'
  messageBody: text("message_body").notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'sent', 'delivered', 'failed', 'read'
  providerMessageId: text("provider_message_id"),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Blog posts for content marketing and SEO
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: varchar("slug").unique().notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  author: varchar("author").default('Kosmospace Team'),
  category: text("category").notNull(), // 'guides', 'tips', 'trends', 'beauty-101'
  tags: text("tags").array().default([]),
  isPublished: boolean("is_published").notNull().default(false),
  readTime: integer("read_time").notNull(), // estimated minutes to read
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  focusKeywords: text("focus_keywords").array().default([]),
  generatedBy: text("generated_by"), // 'ai' or 'manual'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  publishedAt: timestamp("published_at"),
});

// AI blog generation jobs tracking
export const blogGenerationJobs = pgTable("blog_generation_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  articleCount: integer("article_count").notNull(), // 2, 4, or 6
  focusKeywords: text("focus_keywords").array().default([]),
  status: text("status").notNull().default('queued'), // 'queued', 'generating', 'completed', 'failed'
  progress: integer("progress").notNull().default(0), // 0-100
  generatedArticleIds: text("generated_article_ids").array().default([]),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Platform settings for global configurations
export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default('default'), // Single row configuration
  globalCommissionPercentage: integer("global_commission_percentage").notNull().default(50),
  facebookUrl: text("facebook_url").default('https://facebook.com'),
  instagramUrl: text("instagram_url").default('https://instagram.com'),
  twitterUrl: text("twitter_url").default('https://twitter.com'),
  linkedinUrl: text("linkedin_url").default('https://linkedin.com'),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert Schemas
export const insertBeauticianSchema = createInsertSchema(beauticians).omit({
  id: true,
  rating: true,
  reviewCount: true,
  isApproved: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
}).refine((data) => data.price > 0, {
  message: "Price must be greater than 0",
  path: ["price"],
}).refine((data) => data.duration > 0, {
  message: "Duration must be greater than 0",
  path: ["duration"],
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerPreferencesSchema = createInsertSchema(customerPreferences).omit({
  id: true,
  updatedAt: true,
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  status: true,
  sentAt: true,
  clickedAt: true,
  bookedAt: true,
  createdAt: true,
});

export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({
  id: true,
  status: true,
  sentAt: true,
  deliveredAt: true,
  readAt: true,
  createdAt: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export const insertBlogGenerationJobSchema = createInsertSchema(blogGenerationJobs).omit({
  id: true,
  status: true,
  progress: true,
  generatedArticleIds: true,
  errorMessage: true,
  createdAt: true,
  completedAt: true,
});

export const insertPlatformSettingsSchema = createInsertSchema(platformSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertBeautician = z.infer<typeof insertBeauticianSchema>;
export type Beautician = typeof beauticians.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertCustomerPreferences = z.infer<typeof insertCustomerPreferencesSchema>;
export type CustomerPreferences = typeof customerPreferences.$inferSelect;

export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;

export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

export type InsertBlogGenerationJob = z.infer<typeof insertBlogGenerationJobSchema>;
export type BlogGenerationJob = typeof blogGenerationJobs.$inferSelect;

export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;
export type PlatformSettings = typeof platformSettings.$inferSelect;
