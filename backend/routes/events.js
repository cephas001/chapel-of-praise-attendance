const express = require("express");
const prisma = require("../prismaClient");
const { authenticateToken, requireSuperAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/events/active
router.get("/active", authenticateToken, async (req, res) => {
  try {
    const activeEvents = await prisma.event.findMany({
      where: {
        status: { in: ["SIGN_IN_ACTIVE", "SIGN_OUT_ACTIVE", "SYNCING_PHASE"] },
      },
      select: { id: true, name: true, status: true, date: true },
    });
    res.json(activeEvents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET /api/events
router.get("/", authenticateToken, requireSuperAdmin, async (req, res) => {
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
});

// POST /api/events
router.post("/", authenticateToken, requireSuperAdmin, async (req, res) => {
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
});

// GET /api/events/:id/status
router.get("/:id/status", authenticateToken, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      select: { status: true },
    });
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json({ status: event.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

// PATCH /api/events/:id/status
router.patch(
  "/:id/status",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const updatedEvent = await prisma.event.update({
        where: { id: req.params.id },
        data: { status: req.body.status },
      });
      res.json({
        message: `Event transitioned to ${req.body.status}`,
        event: updatedEvent,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update event status" });
    }
  },
);

// GET /api/events/:id/export
router.get("/:id/export", async (req, res) => {
  try {
    const records = await prisma.attendanceRecord.findMany({
      where: { event_id: req.params.id },
      include: { student: true, usher: { select: { username: true } } },
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
      `attachment; filename=attendance_report_${req.params.id}.csv`,
    );
    res.status(200).send(csvData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// POST /api/events/:id/unlock
router.post("/:id/unlock", authenticateToken, async (req, res) => {
  try {
    const { pin } = req.body;
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
    });

    if (!event || event.unlock_pin !== pin.trim().toUpperCase()) {
      return res.status(403).json({ error: "Invalid Access PIN or QR Code." });
    }

    await prisma.eventAccess.upsert({
      where: {
        user_id_event_id: { user_id: req.user.id, event_id: req.params.id },
      },
      update: {},
      create: { user_id: req.user.id, event_id: req.params.id },
    });

    res.json({ message: "Event unlocked successfully!" });
  } catch (error) {
    console.error("Error unlocking event:", error);
    res.status(500).json({ error: "Failed to unlock event." });
  }
});

// GET /api/events/:id/check-access
router.get("/:id/check-access", authenticateToken, async (req, res) => {
  try {
    const access = await prisma.eventAccess.findUnique({
      where: {
        user_id_event_id: { user_id: req.user.id, event_id: req.params.id },
      },
    });

    if (req.user.role === "SUPER_ADMIN" || access) {
      return res.json({ unlocked: true });
    }
    res.json({ unlocked: false });
  } catch (error) {
    res.status(500).json({ error: "Access check failed." });
  }
});

// DELETE /api/events/:id
router.delete(
  "/:id",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      await prisma.event.delete({ where: { id: req.params.id } });
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
// GET LIVE ANALYTICS (SUPER ADMIN ONLY)
// ==========================================
router.get(
  "/:id/live-stats",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const eventId = req.params.id;
      // Calculate boundaries for live math
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      const activeThreshold = new Date(Date.now() - 60 * 1000); // 1 minute offline cutoff

      // Run all heavy queries in parallel
      const [totalSignIns, totalSignOuts, recentScans, ushers] =
        await Promise.all([
          prisma.attendanceRecord.count({
            where: { event_id: eventId, scan_type: "SIGN_IN" },
          }),
          prisma.attendanceRecord.count({
            where: { event_id: eventId, scan_type: "SIGN_OUT" },
          }),
          prisma.attendanceRecord.count({
            where: { event_id: eventId, scanned_at: { gte: fiveMinsAgo } },
          }),

          // Fetch ushers and count ONLY the scans they did for THIS specific event
          prisma.user.findMany({
            select: {
              id: true,
              username: true,
              last_active: true,
              _count: {
                select: { scans_recorded: { where: { event_id: eventId } } },
              },
            },
            orderBy: { scans_recorded: { _count: "desc" } }, // Highest scanners first
          }),
        ]);

      const throughput = Math.round(recentScans / 5); // Average scans per minute

      // Map the database output to a clean roster object
      const roster = ushers.map((u) => ({
        id: u.id,
        username: u.username,
        scans: u._count.scans_recorded,
        isOnline: u.last_active >= activeThreshold,
      }));

      res.json({
        totalSignIns,
        totalSignOuts,
        throughput,
        activeUshers: roster.filter((u) => u.isOnline).length,
        roster,
      });
    } catch (error) {
      console.error("Analytics Error:", error);
      res.status(500).json({ error: "Failed to fetch live stats" });
    }
  },
);

module.exports = router;
