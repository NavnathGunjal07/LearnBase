import express from "express";
import jwt from "jsonwebtoken";
import passport from "../config/passport";

const router = express.Router();

// Google Auth Route
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google Auth Callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth?error=google_failed",
  }),
  (req: any, res) => {
    console.log("✅ Google Auth Callback reached");
    // Generate JWT
    const token = jwt.sign(
      { userId: req.user.id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // Redirect to frontend with token
    // In production, better to set a cookie or use a temporary code exchange
    // For this MVP, we'll redirect with a query param
    const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

    console.log(`🔄 Redirecting to: ${frontendOrigin}/auth`);
    res.redirect(`${frontendOrigin}/auth?token=${token}&userId=${req.user.id}`);
  }
);

// Google One Tap / ID Token Login
router.post("/google/onetap", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "No token provided" });
  }

  try {
    // Verify ID Token with Google
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );
    const payload = await verifyRes.json();

    if (payload.error || !payload.email) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Check payload.aud matches CLIENT_ID if stricter security needed,
    // but we can trust Google's response for email.

    // Find or Create User
    const { email, name, sub: googleId, picture } = payload;

    // We need prisma here
    const prisma = require("../config/prisma").default;

    // Try to find user by email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Check if we need to create
      // We might want to use the same logic as Passport strategy, but keep it simple here
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0], // Fallback name
          googleId,
          profilePicture: picture,
          onboardingStep: "ASK_INTERESTS", // Start onboarding
        },
      });
    }

    // Generate JWT (Same as callback)
    const jwtToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // Return the redirect URL that frontend should navigate to
    // Or just return the token directly?
    // Frontend `GoogleOneTap.tsx` handles the response.
    // If we return { redirectUrl: ... }, it redirects.
    // If we return { token: ... }, it can store it.
    // Consistency with callback: redirect to /auth?token=...

    const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
    const redirectUrl = `${frontendOrigin}/auth?token=${jwtToken}&userId=${user.id}`;

    return res.json({ redirectUrl });
  } catch (error) {
    console.error("One Tap Verification Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
