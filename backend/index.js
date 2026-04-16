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
    const { username, password, role, first_name, last_name } = req.body;

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
          username: username.toLowerCase(), // Enforce lowercase at DB level too
          password_hash: hashedPassword,
          role: role || "USHER",
          first_name: first_name || null, // NEW
          last_name: last_name || null, // NEW
        },
      });

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
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
      const generatePin = () =>
        Math.random().toString(36).substring(2, 8).toUpperCase();

      const newEvent = await prisma.event.create({
        data: {
          name: name,
          date: new Date(date),
          status: "UPCOMING",
          created_by_id: created_by_id,
          unlock_pin: generatePin(),
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

// ==========================================
// CHECK USERNAME AVAILABILITY (SUPER ADMIN ONLY)
// ==========================================
app.get(
  "/api/users/check",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    const { username } = req.query;

    if (!username) {
      return res.json({ available: false });
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      // If existingUser is null, it's available (true). If an object exists, it's taken (false).
      res.json({ available: !existingUser });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ error: "Failed to check username" });
    }
  },
);

// ==========================================
// GET PAGINATED, SEARCHABLE, SORTABLE USERS
// ==========================================
app.get(
  "/api/users",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const search = req.query.search || "";
      const sort = req.query.sort || "desc"; // Default to newest first

      // Build the query object dynamically
      const whereClause = search
        ? {
            OR: [
              { username: { contains: search, mode: "insensitive" } },
              { first_name: { contains: search, mode: "insensitive" } },
              { last_name: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      // Build the sort object dynamically
      let orderByClause;
      if (sort === "asc") orderByClause = { username: "asc" };
      else if (sort === "desc_alpha") orderByClause = { username: "desc" };
      else orderByClause = { created_at: "desc" }; // 'desc' default

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          skip,
          take: limit,
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            role: true,
            created_at: true,
          },
          orderBy: orderByClause,
        }),
        prisma.user.count({ where: whereClause }),
      ]);

      res.json({
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  },
);

// ==========================================
// UPDATE USER ROLE / DETAILS
// ==========================================
app.patch(
  "/api/users/:id",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      // Only allow updating specific fields
      const { role, first_name, last_name } = req.body;

      // Prevent updating the super admin if you want that protection
      if (req.user.id === req.params.id && role && role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "You cannot demote yourself." });
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          ...(role && { role }),
          ...(first_name !== undefined && { first_name }),
          ...(last_name !== undefined && { last_name }),
        },
        select: {
          id: true,
          username: true,
          first_name: true,
          last_name: true,
          role: true,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  },
);

// ==========================================
// DELETE USER
// ==========================================
app.delete(
  "/api/users/:id",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      if (req.user.id === req.params.id) {
        return res
          .status(403)
          .json({ error: "You cannot delete your own account." });
      }

      await prisma.user.delete({
        where: { id: req.params.id },
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  },
);

// ==========================================
// UNLOCK EVENT FOR USHER
// ==========================================
app.post("/api/events/:id/unlock", authenticateToken, async (req, res) => {
  try {
    const { pin } = req.body;
    const eventId = req.params.id;
    const userId = req.user.id;

    // Verify the event and PIN
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event || event.unlock_pin !== pin.trim().toUpperCase()) {
      return res.status(403).json({ error: "Invalid Access PIN or QR Code." });
    }

    // Grant access
    await prisma.eventAccess.upsert({
      where: { user_id_event_id: { user_id: userId, event_id: eventId } },
      update: {}, // Do nothing if it already exists
      create: { user_id: userId, event_id: eventId },
    });

    res.json({ message: "Event unlocked successfully!" });
  } catch (error) {
    console.error("Error unlocking event:", error);
    res.status(500).json({ error: "Failed to unlock event." });
  }
});

// ==========================================
// CHECK IF EVENT IS UNLOCKED
// ==========================================
app.get("/api/events/:id/check-access", authenticateToken, async (req, res) => {
  try {
    const access = await prisma.eventAccess.findUnique({
      where: {
        user_id_event_id: { user_id: req.user.id, event_id: req.params.id },
      },
    });

    // Super Admins automatically bypass the lock, Ushers require the access record
    if (req.user.role === "SUPER_ADMIN" || access) {
      return res.json({ unlocked: true });
    }
    res.json({ unlocked: false });
  } catch (error) {
    res.status(500).json({ error: "Access check failed." });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
