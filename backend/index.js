require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const app = express();
const prisma = new PrismaClient({ adapter });

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000", // e.g., https://chapel-scanner.vercel.app
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// 1. Verify the user is logged in via their JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  // Check headers first. If not there, check URL query (for the CSV export link)
  const token = (authHeader && authHeader.split(" ")[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }
    req.user = decodedUser;
    next();
  });
};

// 2. Verify the user is specifically a SUPER_ADMIN
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res
      .status(403)
      .json({ error: "Forbidden. Super Admin access required." });
  }
  next();
};

// ==========================================
// AUTH: LOGIN (PUBLIC)
// ==========================================
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } });

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
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

// ==========================================
// CREATE NEW USER (SUPER ADMIN ONLY)
// ==========================================
app.post(
  "/api/users",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    const { username, password, role } = req.body;

    try {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUser) {
        return res.status(400).json({ message: "Username is already taken." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          username: username,
          password_hash: hashedPassword,
          role: role || "USHER",
        },
      });

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create user" });
    }
  },
);

// ==========================================
// 1. GET ACTIVE EVENTS (ALL AUTHENTICATED USERS)
// ==========================================
app.get("/api/events/active", authenticateToken, async (req, res) => {
  try {
    const activeEvents = await prisma.event.findMany({
      where: {
        status: {
          in: ["SIGN_IN_ACTIVE", "SIGN_OUT_ACTIVE", "SYNCING_PHASE"],
        },
      },
      select: { id: true, name: true, status: true, date: true },
    });
    res.json(activeEvents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// ==========================================
// 1b. GET ALL EVENTS (SUPER ADMIN ONLY)
// ==========================================
app.get(
  "/api/events",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const events = await prisma.event.findMany({
        where: { status: { not: "ARCHIVED" } },
        orderBy: { date: "desc" },
      });
      res.json(events);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch all events" });
    }
  },
);

// ==========================================
// CREATE NEW EVENT (SUPER ADMIN ONLY)
// ==========================================
app.post(
  "/api/events",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    const { name, date, created_by_id } = req.body;

    try {
      const newEvent = await prisma.event.create({
        data: {
          name: name,
          date: new Date(date),
          status: "UPCOMING",
          created_by_id: created_by_id,
        },
      });
      res.status(201).json({ message: "Event created", event: newEvent });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create event" });
    }
  },
);

// ==========================================
// DELETE EVENT (SUPER ADMIN ONLY)
// ==========================================
app.delete(
  "/api/events/:id",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    const { id } = req.params;

    try {
      await prisma.event.delete({
        where: { id: id },
      });
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({
        message:
          "Failed to delete event. It may have existing attendance records.",
      });
    }
  },
);

// ==========================================
// 2. SUBMIT A SCAN (ALL AUTHENTICATED USERS)
// ==========================================
app.post("/api/attendance/scan", authenticateToken, async (req, res) => {
  const { event_id, matric_number, scan_type, usher_id, scanned_at } = req.body;

  try {
    if (scan_type === "SIGN_OUT") {
      const existingSignIn = await prisma.attendanceRecord.findFirst({
        where: {
          event_id: event_id,
          matric_number: matric_number,
          scan_type: "SIGN_IN",
        },
      });

      if (!existingSignIn) {
        return res.status(403).json({
          error: "Rule Violation",
          message: `Student ${matric_number} cannot sign out because they never signed in.`,
        });
      }
    }

    await prisma.student.upsert({
      where: { matric_number: matric_number },
      update: {},
      create: { matric_number: matric_number },
    });

    const newRecord = await prisma.attendanceRecord.create({
      data: {
        event_id,
        matric_number,
        scan_type,
        usher_id,
        scanned_at: new Date(scanned_at),
      },
    });

    res
      .status(201)
      .json({ message: "Scan recorded successfully", record: newRecord });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Duplicate Scan",
        message: `This student has already recorded a ${scan_type} for this event.`,
      });
    }
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error during scan processing" });
  }
});

// ==========================================
// 3. GET EVENT STATUS (ALL AUTHENTICATED USERS)
// ==========================================
app.get("/api/events/:id/status", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const event = await prisma.event.findUnique({
      where: { id: id },
      select: { status: true },
    });

    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json({ status: event.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

// ==========================================
// 4. UPDATE EVENT STATUS (SUPER ADMIN ONLY)
// ==========================================
app.patch(
  "/api/events/:id/status",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
      const updatedEvent = await prisma.event.update({
        where: { id: id },
        data: { status: status },
      });
      res.json({
        message: `Event transitioned to ${status}`,
        event: updatedEvent,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update event status" });
    }
  },
);

// ==========================================
// 5. EXPORT ATTENDANCE AS CSV (SUPER ADMIN ONLY)
// ==========================================
app.get(
  "/api/events/:id/export",
  // authenticateToken,
  // requireSuperAdmin,
  async (req, res) => {
    const { id } = req.params;

    try {
      const records = await prisma.attendanceRecord.findMany({
        where: { event_id: id },
        include: {
          student: true,
          usher: { select: { username: true } },
        },
        orderBy: { scanned_at: "asc" },
      });

      if (records.length === 0) {
        return res
          .status(404)
          .send("No attendance records found for this event.");
      }

      let csvData =
        "Matric Number,First Name,Last Name,Department,Level,Scan Type,Scanned At,Synced At,Scanned By (Usher)\n";

      records.forEach((record) => {
        const fName = record.student.first_name || "";
        const lName = record.student.last_name || "";
        const dept = record.student.department || "";
        const level = record.student.level || "";
        const scannedTime = new Date(record.scanned_at).toLocaleString();
        const syncedTime = new Date(record.synced_at).toLocaleString();

        csvData += `"${record.matric_number}","${fName}","${lName}","${dept}","${level}","${record.scan_type}","${scannedTime}","${syncedTime}","${record.usher.username}"\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=attendance_report_${id}.csv`,
      );
      res.status(200).send(csvData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  },
);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
