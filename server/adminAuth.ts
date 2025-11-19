import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import type { Express } from "express";
import { storage } from "./storage";

export function setupAdminAuth(app: Express) {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const users = await storage.getAllUsers();
          const user = users.find(u => u.email === email);

          if (!user) {
            console.log(`Admin login failed: User not found for email ${email}`);
            return done(null, false, { message: "Invalid email or password" });
          }

          if (user.role !== "admin") {
            console.log(`Admin login failed: User ${email} is not an admin (role: ${user.role})`);
            return done(null, false, { message: "Admin access required" });
          }

          if (!user.passwordHash) {
            console.log(`Admin login failed: No password set for admin user ${email}`);
            return done(null, false, { message: "Invalid email or password" });
          }

          const isValidPassword = await bcrypt.compare(password, user.passwordHash);

          if (!isValidPassword) {
            console.log(`Admin login failed: Invalid password for ${email}`);
            return done(null, false, { message: "Invalid email or password" });
          }

          console.log(`Admin login successful: ${email}`);
          // Mark as local admin user
          return done(null, { ...user, isLocalAdmin: true });
        } catch (error) {
          console.error("Error during admin authentication:", error);
          return done(error);
        }
      }
    )
  );

  // Note: Do NOT override passport.serializeUser/deserializeUser here
  // They are already set up in replitAuth.ts and will handle both OIDC and local users
  // Also do NOT call app.use(passport.initialize()) or app.use(passport.session()) again
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}
