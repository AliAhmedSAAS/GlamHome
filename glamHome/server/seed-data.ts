import { db } from "./db";
import { users, beauticians, services, bookings, reviews, customerPreferences } from "@shared/schema";
import bcrypt from "bcrypt";

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // 1. Create Users
    console.log("Creating users...");
    
    const customerUsers = await db.insert(users).values([
      {
        email: "fatima.alhashimi@email.com",
        firstName: "Fatima",
        lastName: "Al-Hashimi",
        phone: "+971501234567",
        role: "customer",
      },
      {
        email: "noura.ahmed@email.com",
        firstName: "Noura",
        lastName: "Ahmed",
        phone: "+971501234568",
        role: "customer",
      },
      {
        email: "maryam.almansouri@email.com",
        firstName: "Maryam",
        lastName: "Al-Mansouri",
        phone: "+971501234569",
        role: "customer",
      },
    ]).returning();

    const beauticianUsers = await db.insert(users).values([
      {
        email: "sarah.almansouri@beautician.com",
        firstName: "Sarah",
        lastName: "Al-Mansouri",
        phone: "+971505551234",
        role: "beautician",
        profileImageUrl: "/api/placeholder/200/200",
      },
      {
        email: "layla.hassan@beautician.com",
        firstName: "Layla",
        lastName: "Hassan",
        phone: "+971505551235",
        role: "beautician",
        profileImageUrl: "/api/placeholder/200/200",
      },
      {
        email: "amira.khan@beautician.com",
        firstName: "Amira",
        lastName: "Khan",
        phone: "+971505551236",
        role: "beautician",
        profileImageUrl: "/api/placeholder/200/200",
      },
      {
        email: "zara.malik@beautician.com",
        firstName: "Zara",
        lastName: "Malik",
        phone: "+971505551237",
        role: "beautician",
        profileImageUrl: "/api/placeholder/200/200",
      },
      {
        email: "rania.abdullah@beautician.com",
        firstName: "Rania",
        lastName: "Abdullah",
        phone: "+971505551238",
        role: "beautician",
        profileImageUrl: "/api/placeholder/200/200",
      },
    ]).returning();

    // Admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      email: "admin@kosmospace.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      passwordHash: adminPassword,
    });

    console.log(`✅ Created ${customerUsers.length} customers, ${beauticianUsers.length} beauticians, and 1 admin`);

    // 2. Create Beautician Profiles
    console.log("Creating beautician profiles...");
    
    const beauticianProfiles = await db.insert(beauticians).values([
      {
        userId: beauticianUsers[0].id,
        bio: "Certified makeup artist with 8+ years of experience specializing in bridal and evening makeup. Trained at the Dubai Beauty Academy.",
        experience: "6-10",
        startingPrice: 200,
        rating: "4.9",
        reviewCount: 287,
        isApproved: true,
        serviceAreas: ["Dubai Marina", "JBR", "Palm Jumeirah"],
      },
      {
        userId: beauticianUsers[1].id,
        bio: "Expert nail technician offering luxury manicures and pedicures. Certified in gel, acrylic, and nail art designs.",
        experience: "6-10",
        startingPrice: 150,
        rating: "4.8",
        reviewCount: 342,
        isApproved: true,
        serviceAreas: ["Downtown Dubai", "Business Bay", "DIFC"],
      },
      {
        userId: beauticianUsers[2].id,
        bio: "Professional makeup artist and pedicure specialist. Perfect for special occasions and regular pampering sessions.",
        experience: "3-5",
        startingPrice: 180,
        rating: "5.0",
        reviewCount: 198,
        isApproved: true,
        serviceAreas: ["Jumeirah", "Al Wasl", "Umm Suqeim"],
      },
      {
        userId: beauticianUsers[3].id,
        bio: "Lash extension specialist with Russian volume technique certification. Creating stunning, natural-looking lashes.",
        experience: "3-5",
        startingPrice: 250,
        rating: "4.9",
        reviewCount: 156,
        isApproved: true,
        serviceAreas: ["Arabian Ranches", "Dubai Hills", "Motor City"],
      },
      {
        userId: beauticianUsers[4].id,
        bio: "All-round beauty expert offering makeup, nails, and lash services. Mobile salon experience across Dubai.",
        experience: "10+",
        startingPrice: 220,
        rating: "4.7",
        reviewCount: 423,
        isApproved: true,
        serviceAreas: ["Mirdif", "Festival City", "Dubai Silicon Oasis"],
      },
    ]).returning();

    console.log(`✅ Created ${beauticianProfiles.length} beautician profiles`);

    // 3. Create Services
    console.log("Creating services...");
    
    const allServices = await db.insert(services).values([
      // Sarah's services
      { beauticianId: beauticianProfiles[0].id, name: "makeup", price: 300, duration: 90 },
      { beauticianId: beauticianProfiles[0].id, name: "lashes", price: 400, duration: 120 },
      { beauticianId: beauticianProfiles[0].id, name: "bridal-makeup", price: 1200, duration: 180 },
      
      // Layla's services
      { beauticianId: beauticianProfiles[1].id, name: "manicure", price: 150, duration: 60 },
      { beauticianId: beauticianProfiles[1].id, name: "pedicure", price: 180, duration: 75 },
      { beauticianId: beauticianProfiles[1].id, name: "nails", price: 250, duration: 90 },
      
      // Amira's services
      { beauticianId: beauticianProfiles[2].id, name: "makeup", price: 250, duration: 75 },
      { beauticianId: beauticianProfiles[2].id, name: "pedicure", price: 200, duration: 80 },
      
      // Zara's services
      { beauticianId: beauticianProfiles[3].id, name: "lashes", price: 350, duration: 150 },
      { beauticianId: beauticianProfiles[3].id, name: "nails", price: 180, duration: 60 },
      
      // Rania's services
      { beauticianId: beauticianProfiles[4].id, name: "makeup", price: 280, duration: 90 },
      { beauticianId: beauticianProfiles[4].id, name: "manicure", price: 160, duration: 60 },
      { beauticianId: beauticianProfiles[4].id, name: "pedicure", price: 190, duration: 75 },
      { beauticianId: beauticianProfiles[4].id, name: "lashes", price: 380, duration: 140 },
    ]).returning();

    console.log(`✅ Created ${allServices.length} services`);

    // 4. Create Bookings
    console.log("Creating bookings...");
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);

    await db.insert(bookings).values([
      {
        customerId: customerUsers[0].id,
        beauticianId: beauticianProfiles[0].id,
        serviceId: allServices[0].id,
        scheduledDate: tomorrow,
        location: "Dubai Marina - Marina Heights Tower",
        status: "confirmed",
        totalAmount: 300,
        platformFee: 45, // 15% commission
        beauticianEarnings: 255,
      },
      {
        customerId: customerUsers[1].id,
        beauticianId: beauticianProfiles[1].id,
        serviceId: allServices[3].id,
        scheduledDate: nextWeek,
        location: "Downtown Dubai - Burj Khalifa Residences",
        status: "pending",
        totalAmount: 150,
        platformFee: 23,
        beauticianEarnings: 127,
      },
      {
        customerId: customerUsers[2].id,
        beauticianId: beauticianProfiles[2].id,
        serviceId: allServices[6].id,
        scheduledDate: lastWeek,
        location: "Jumeirah - Beach Road Villa",
        status: "completed",
        totalAmount: 250,
        platformFee: 38,
        beauticianEarnings: 212,
      },
    ]).returning();

    console.log("✅ Created 3 bookings");

    // 5. Create Reviews
    console.log("Creating reviews...");
    
    await db.insert(reviews).values([
      {
        customerId: customerUsers[0].id,
        beauticianId: beauticianProfiles[0].id,
        rating: 5,
        comment: "Amazing makeup! Sarah is so talented and professional. My wedding makeup was absolutely perfect and lasted all day. Highly recommend!",
      },
      {
        customerId: customerUsers[1].id,
        beauticianId: beauticianProfiles[1].id,
        rating: 5,
        comment: "Best manicure I've had in Dubai! Layla is very skilled and the quality is salon-level. Will definitely book again.",
      },
      {
        customerId: customerUsers[2].id,
        beauticianId: beauticianProfiles[2].id,
        rating: 5,
        comment: "Amira is wonderful! Professional, friendly, and my makeup looked stunning. Perfect for my event.",
      },
      {
        customerId: customerUsers[0].id,
        beauticianId: beauticianProfiles[3].id,
        rating: 5,
        comment: "The lash extensions are gorgeous! Zara is so gentle and precise. My lashes look natural and beautiful.",
      },
      {
        customerId: customerUsers[1].id,
        beauticianId: beauticianProfiles[4].id,
        rating: 4,
        comment: "Great service! Rania is experienced and did a fantastic job. Very convenient having her come to my home.",
      },
    ]);

    console.log("✅ Created 5 reviews");

    // 6. Create Customer Preferences
    console.log("Creating customer preferences...");
    
    await db.insert(customerPreferences).values([
      {
        customerId: customerUsers[0].id,
        whatsappOptIn: true,
        whatsappNumber: customerUsers[0].phone,
        preferredContactTime: "morning",
        receiveOffers: true,
        receiveReminders: true,
      },
      {
        customerId: customerUsers[1].id,
        whatsappOptIn: true,
        whatsappNumber: customerUsers[1].phone,
        preferredContactTime: "afternoon",
        receiveOffers: true,
        receiveReminders: true,
      },
      {
        customerId: customerUsers[2].id,
        whatsappOptIn: true,
        whatsappNumber: customerUsers[2].phone,
        preferredContactTime: "evening",
        receiveOffers: false,
        receiveReminders: true,
      },
    ]);

    console.log("✅ Created customer preferences");

    console.log("\n🎉 Database seeding completed successfully!\n");
    console.log("Summary:");
    console.log(`- Users: ${customerUsers.length + beauticianUsers.length + 1} (${customerUsers.length} customers, ${beauticianUsers.length} beauticians, 1 admin)`);
    console.log(`- Beautician Profiles: ${beauticianProfiles.length}`);
    console.log(`- Services: ${allServices.length}`);
    console.log(`- Bookings: 3`);
    console.log(`- Reviews: 5`);
    console.log(`- Customer Preferences: 3`);
    console.log("\nAdmin credentials:");
    console.log("Email: admin@kosmospace.com");
    console.log("Password: admin123");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log("\n✅ Seeding process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seeding process failed:", error);
    process.exit(1);
  });

