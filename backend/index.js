require("dotenv").config();
const express = require("express");
const cors = require("cors");

// 1. Import BOTH the Prisma Client and the new Postgres Adapter
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 2. Initialize the adapter using your Supabase URL from the .env file
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const app = express();
const prisma = new PrismaClient({ adapter });

// Middleware
app.use(cors()); // Allows your Nuxt frontend to talk to this backend
app.use(express.json()); // Allows Express to read JSON body data

// ==========================================
// AUTH: LOGIN
// ==========================================
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Find the user
    const user = await prisma.user.findUnique({ where: { username } });

    // If user doesn't exist or account is deactivated
    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 2. Check the password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 3. Generate the Digital Badge (JWT)
    // We embed their ID and Role inside the token. It expires in 7 days.
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // 4. Send it back to the phone
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
// 1. GET ACTIVE EVENTS
// ==========================================
app.get("/api/events/active", async (req, res) => {
  try {
    // Fetch events that are currently accepting scans or in the syncing phase
    const activeEvents = await prisma.event.findMany({
      where: {
        status: {
          in: ["SIGN_IN_ACTIVE", "SIGN_OUT_ACTIVE", "SYNCING_PHASE"],
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
        date: true,
      },
    });
    res.json(activeEvents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// ==========================================
// 1b. GET ALL EVENTS (For Admin Dashboard)
// ==========================================
app.get("/api/events", async (req, res) => {
  try {
    // Fetch all events, ordered by newest first
    const events = await prisma.event.findMany({
      orderBy: { date: "desc" },
    });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch all events" });
  }
});

// ==========================================
// CREATE NEW EVENT
// ==========================================
app.post("/api/events", async (req, res) => {
  const { name, date, created_by_id } = req.body;

  try {
    const newEvent = await prisma.event.create({
      data: {
        name: name,
        date: new Date(date),
        status: "UPCOMING", // Starts out locked
        created_by_id: created_by_id,
      },
    });
    res.status(201).json({ message: "Event created", event: newEvent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// ==========================================
// 2. SUBMIT A SCAN (The Offline Sync Route)
// ==========================================
app.post("/api/attendance/scan", async (req, res) => {
  const { event_id, matric_number, scan_type, usher_id, scanned_at } = req.body;

  try {
    // NEW LOGIC: Enforce the "Must Sign In First" Rule
    if (scan_type === "SIGN_OUT") {
      const existingSignIn = await prisma.attendanceRecord.findFirst({
        where: {
          event_id: event_id,
          matric_number: matric_number,
          scan_type: "SIGN_IN",
        },
      });

      // If they didn't sign in, reject the sign-out with a 403 Forbidden status
      if (!existingSignIn) {
        return res.status(403).json({
          error: "Rule Violation",
          message: `Student ${matric_number} cannot sign out because they never signed in.`,
        });
      }
    }

    // STEP A: The Upsert (Ensure the student exists)
    await prisma.student.upsert({
      where: { matric_number: matric_number },
      update: {},
      create: { matric_number: matric_number },
    });

    // STEP B: Record the Attendance
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
// TEST HELPER: Create Dummy Data
// ==========================================
app.post("/api/test-setup", async (req, res) => {
  try {
    // Hash the password "password123" before saving it to the database
    const hashedPassword = await bcrypt.hash("password123", 10);

    const admin = await prisma.user.create({
      data: {
        username: "super_admin_1",
        password_hash: hashedPassword, // Use the real hash now!
        role: "SUPER_ADMIN",
      },
    });

    const event = await prisma.event.create({
      data: {
        name: "Sunday Service",
        date: new Date(),
        status: "SIGN_IN_ACTIVE",
        created_by_id: admin.id,
      },
    });

    res.json({
      message: "Dummy data created!",
      usher_id: admin.id,
      event_id: event.id,
    });
  } catch (error) {
    res.status(500).json({
      error: "Setup failed. If you already ran this, the user already exists!",
    });
  }
});

// ==========================================
// 3. GET EVENT STATUS (For Usher Polling)
// ==========================================
app.get("/api/events/:id/status", async (req, res) => {
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
// 4. UPDATE EVENT STATUS (For Super Admin)
// ==========================================
app.patch("/api/events/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // e.g., 'SYNCING_PHASE' or 'SIGN_OUT_ACTIVE'

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
});

// ==========================================
// 5. EXPORT ATTENDANCE AS CSV
// ==========================================
app.get("/api/events/:id/export", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch all records for this specific event
    // We 'include' the student data so we can see their names if they exist
    const records = await prisma.attendanceRecord.findMany({
      where: { event_id: id },
      include: {
        student: true,
        usher: { select: { username: true } }, // Just get the usher's name, not their password hash!
      },
      orderBy: { scanned_at: "asc" }, // Sort chronologically
    });

    if (records.length === 0) {
      return res
        .status(404)
        .send("No attendance records found for this event.");
    }

    // 2. Build the CSV Header
    let csvData =
      "Matric Number,First Name,Last Name,Department,Level,Scan Type,Scanned At,Synced At,Scanned By (Usher)\n";

    // 3. Loop through the records and build the CSV rows
    records.forEach((record) => {
      // If student names don't exist yet, fallback to empty strings
      const fName = record.student.first_name || "";
      const lName = record.student.last_name || "";
      const dept = record.student.department || "";
      const level = record.student.level || "";

      // Format timestamps for Excel readability
      const scannedTime = new Date(record.scanned_at).toLocaleString();
      const syncedTime = new Date(record.synced_at).toLocaleString();

      // Ensure commas inside data don't break the CSV format by wrapping strings in quotes
      csvData += `"${record.matric_number}","${fName}","${lName}","${dept}","${level}","${record.scan_type}","${scannedTime}","${syncedTime}","${record.usher.username}"\n`;
    });

    // 4. Send the file to the browser
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
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
