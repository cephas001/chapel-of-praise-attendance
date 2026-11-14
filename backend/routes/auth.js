const express = require("express");
const bcrypt = require("bcrypt");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");
const { createRateLimiter } = require("../middleware/rateLimit");
const { invalidateUserAuthCache } = require("../middleware/auth");

const router = express.Router();

// Keyed by IP *and* email so one attacker cannot spray many accounts from a
// single address, and cannot lock a victim out from an unrelated address.
// Only failed password checks count toward the lockout; a successful login
// resets the pair's counter.
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  countFailuresOnly: true,
  failureStatuses: [401],
  keyGenerator: (req) => {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    // Require both parts so a malformed request cannot create a shared key.
    if (!email || !req.ip) return null;
    return `login:${req.ip}:${email}`;
  },
  message: "Too many login attempts. Please wait and try again.",
});

// Initialize Firebase Admin (Required to verify the token Google sends)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The replace(/\\n/g, '\n') fixes the escaped newline issue common in production deployments
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// ==========================================
// STANDARD EMAIL/PASSWORD LOGIN
// ==========================================
router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail || typeof password !== "string" || password === "") {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    invalidateUserAuthCache(user.id);

    res.json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        avatar_url: user.avatar_url,
        unit: user.unit,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

// ==========================================
// GOOGLE OAUTH TOKEN EXCHANGE
// ==========================================
router.post("/google", async (req, res) => {
  const { token } = req.body || {};

  if (!token) {
    return res.status(400).json({ error: "No token provided" });
  }

  try {
    // 1. Verify the Google token using Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    const googleEmail =
      typeof decodedToken.email === "string"
        ? decodedToken.email.trim().toLowerCase()
        : "";

    if (!googleEmail) {
      return res.status(401).json({ error: "Google account has no email." });
    }

    // 2. Check the COPAMS Database for the user
    const user = await prisma.user.findUnique({
      where: { email: googleEmail },
    });

    // 3. The "Closed Ecosystem" Bouncer
    if (!user || !user.is_active) {
      return res.status(403).json({
        message: "Access Denied: Your email is not registered in the system.",
      });
    }

    // 4. Success! Mint the exact same JWT as standard login
    const sessionToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    invalidateUserAuthCache(user.id);

    // 5. Return identical payload structure
    res.json({
      message: "Login successful",
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        avatar_url: user.avatar_url,
        unit: user.unit,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (error) {
    console.error("Google Auth error:", error);
    res.status(401).json({ error: "Invalid or expired Google token" });
  }
});

module.exports = router;
