// Load environment variables
import "dotenv/config";

import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../server/adminAuth";

const ADMIN_EMAIL = "nextceoai@gmail.com";
const ADMIN_PASSWORD = "Ali2009@";

async function fixAdminUser() {
  try {
    console.log("🔍 Checking admin user...");
    
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, ADMIN_EMAIL))
      .limit(1);

    if (existingUser) {
      console.log(`✅ User found: ${ADMIN_EMAIL}`);
      console.log(`   Current role: ${existingUser.role || "not set"}`);
      console.log(`   Has password: ${existingUser.passwordHash ? "yes" : "no"}`);

      // Update user to admin with password
      const passwordHash = await hashPassword(ADMIN_PASSWORD);
      
      const [updatedUser] = await db
        .update(users)
        .set({
          role: "admin",
          passwordHash: passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.email, ADMIN_EMAIL))
        .returning();

      console.log(`✅ Updated user to admin role`);
      console.log(`   New role: ${updatedUser.role}`);
      console.log(`   Password hash set: ${updatedUser.passwordHash ? "yes" : "no"}`);
    } else {
      console.log(`❌ User not found. Creating new admin user...`);
      
      const passwordHash = await hashPassword(ADMIN_PASSWORD);
      
      const [newUser] = await db
        .insert(users)
        .values({
          email: ADMIN_EMAIL,
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          passwordHash: passwordHash,
        })
        .returning();

      console.log(`✅ Created new admin user`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Role: ${newUser.role}`);
      console.log(`   ID: ${newUser.id}`);
    }

    console.log("\n✅ Admin user setup complete!");
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log("\n🔐 You can now login at /api/admin/login");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing admin user:", error);
    process.exit(1);
  }
}

fixAdminUser();

