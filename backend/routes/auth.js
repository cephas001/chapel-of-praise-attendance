const express = require("express");
const bcrypt = require("bcrypt");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");

const router = express.Router();

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
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

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
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "No token provided" });
  }

  try {
    // 1. Verify the Google token using Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    const googleEmail = decodedToken.email;

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
