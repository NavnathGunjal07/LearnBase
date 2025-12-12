import express from "express";
import passport from "../config/passport";
import jwt from "jsonwebtoken";

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

export default router;
