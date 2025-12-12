import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma";

// Serialize user to session
passport.serializeUser((user: any, done: any) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:8080/auth/google/callback",
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: any
      ) => {
        try {
          console.log(
            `🔍 Passport Strategy: Verifying user ${profile.emails?.[0]?.value}`
          );
          // Check if user exists
          const email = profile.emails?.[0].value;
          if (!email) {
            console.error("❌ No email found in Google profile");
            return done(new Error("No email found in Google profile"), false);
          }

          let user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log("🆕 Creating new user from Google Auth");
            // Create new user
            user = await prisma.user.create({
              data: {
                email,
                name: profile.displayName,
                passwordHash: "google-auth", // Placeholder
                onboardingStep: "ASK_INTERESTS", // Skip password/name steps for Google Auth
                // If we had a googleId field we'd save it, but email is unique enough for now
              },
            });
          } else {
            console.log("✅ Existing user found");
            // If user exists but hasn't completed onboarding, update name if missing
            if (!user.hasCompletedOnboarding && user.name === "Temporary") {
              await prisma.user.update({
                where: { id: user.id },
                data: { name: profile.displayName },
              });
            }
          }

          return done(null, user);
        } catch (error) {
          console.error("❌ Passport verify error:", error);
          return done(error, false);
        }
      }
    )
  );
} else {
  console.warn(
    "⚠️ Google Auth credentials not found in environment variables. Google Auth will be disabled."
  );
}

export default passport;
