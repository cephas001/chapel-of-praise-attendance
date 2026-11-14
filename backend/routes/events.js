const express = require("express");
const { randomInt } = require("crypto");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");
const prisma = require("../prismaClient");
const { authenticateToken, requireSuperAdmin } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/rateLimit");
const { broadcastToAll } = require("../sseHub");

const router = express.Router();

// The lifecycle is intentionally forward-moving. Corrections are still
// possible inside the active phases, but completed/archived events cannot be
// silently reopened.
const EVENT_STATUS_TRANSITIONS = {
  UPCOMING: ["SIGN_IN_ACTIVE", "ARCHIVED"],
  SIGN_IN_ACTIVE: ["SYNCING_PHASE", "SIGN_OUT_ACTIVE", "ARCHIVED"],
  SYNCING_PHASE: ["SIGN_IN_ACTIVE", "SIGN_OUT_ACTIVE", "ARCHIVED"],
  SIGN_OUT_ACTIVE: [
    "SIGN_IN_ACTIVE",
    "SYNCING_PHASE",
    "COMPLETED",
    "ARCHIVED",
  ],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

const UNLOCKABLE_EVENT_STATUSES = new Set([
  "SIGN_IN_ACTIVE",
  "SYNCING_PHASE",
  "SIGN_OUT_ACTIVE",
]);

const unlockLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 12,
  keyGenerator: (req) => `unlock:${req.user.id}:${req.params.id}`,
  message: "Too many unlock attempts. Please wait and try again.",
});

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
  const { name, date } = req.body || {};
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const eventDate = new Date(date);

  if (!trimmedName) {
    return res.status(400).json({ error: "Event name is required." });
  }

  if (Number.isNaN(eventDate.getTime())) {
    return res.status(400).json({ error: "A valid event date is required." });
  }

  try {
    const pinAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const generatePin = () =>
      Array.from(
        { length: 6 },
        () => pinAlphabet[randomInt(pinAlphabet.length)],
      ).join("");

    const newEvent = await prisma.event.create({
      data: {
        name: trimmedName,
        date: eventDate,
        status: "UPCOMING",
        // Attribute the event to the authenticated admin, not a client field.
        created_by_id: req.user.id,
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
    const nextStatus =
      typeof req.body?.status === "string"
        ? req.body.status.trim().toUpperCase()
        : "";

    if (!nextStatus) {
      return res.status(400).json({ error: "A target status is required." });
    }

    try {
      const currentEvent = await prisma.event.findUnique({
        where: { id: req.params.id },
        select: { id: true, status: true },
      });

      if (!currentEvent) {
        return res.status(404).json({ error: "Event not found." });
      }

      if (currentEvent.status === nextStatus) {
        const current = await prisma.event.findUnique({
          where: { id: req.params.id },
        });
        return res.json({
          message: `Event is already ${nextStatus}`,
          event: current,
        });
      }

      const allowedTransitions =
        EVENT_STATUS_TRANSITIONS[currentEvent.status] || [];

      if (!allowedTransitions.includes(nextStatus)) {
        return res.status(409).json({
          error: `Cannot move an event from ${currentEvent.status} to ${nextStatus}.`,
        });
      }

      // Guard the update with the status we just read so two admins cannot
      // race the same event into two different phases.
      const updateResult = await prisma.event.updateMany({
        where: { id: req.params.id, status: currentEvent.status },
        data: { status: nextStatus },
      });

      if (updateResult.count === 0) {
        return res.status(409).json({
          error: "The event changed while this request was being processed.",
        });
      }

      const updatedEvent = await prisma.event.findUnique({
        where: { id: req.params.id },
      });

      if (!updatedEvent) {
        return res.status(404).json({ error: "Event not found." });
      }

      // Tell every connected scanner/admin immediately so clients do not need
      // to poll the status endpoint to notice a phase transition.
      broadcastToAll({
        type: "EVENT_STATUS",
        event_id: updatedEvent.id,
        event_name: updatedEvent.name,
        status: updatedEvent.status,
        updated_at: new Date().toISOString(),
      });

      res.json({
        message: `Event transitioned to ${nextStatus}`,
        event: updatedEvent,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update event status" });
    }
  },
);

const ATTENDANCE_CSV_BATCH_SIZE = 500;
const ATTENDANCE_CSV_HEADER =
  "Matric Number,First Name,Last Name,Department,Level,Scan Type,Scanned At,Synced At,Scanned By (Usher)\n";

const escapeCsvValue = (value) => {
  const stringValue = value == null ? "" : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const formatAttendanceCsvRow = (record) =>
  [
    record.matric_number,
    record.student?.first_name || "",
    record.student?.last_name || "",
    record.student?.department || "",
    record.student?.level ?? "",
    record.scan_type,
    new Date(record.scanned_at).toLocaleString(),
    new Date(record.synced_at).toLocaleString(),
    record.usher?.email || "",
  ]
    .map(escapeCsvValue)
    .join(",") + "\n";

// Pull rows in cursor batches so the export never holds the full event in RAM.
const attendanceCsvGenerator = async function* (eventId) {
  yield ATTENDANCE_CSV_HEADER;

  let cursor = null;

  while (true) {
    const batch = await prisma.attendanceRecord.findMany({
      where: { event_id: eventId },
      include: { student: true, usher: { select: { email: true } } },
      orderBy: [{ scanned_at: "asc" }, { id: "asc" }],
      take: ATTENDANCE_CSV_BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    if (batch.length === 0) break;

    for (const record of batch) {
      yield formatAttendanceCsvRow(record);
    }

    if (batch.length < ATTENDANCE_CSV_BATCH_SIZE) break;

    cursor = batch[batch.length - 1].id;
  }
};

// GET /api/events/:id/export
router.get("/:id/export", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const eventId = req.params.id;
    const recordCount = await prisma.attendanceRecord.count({
      where: { event_id: eventId },
    });

    if (recordCount === 0) {
      return res
        .status(404)
        .send("No attendance records found for this event.");
    }

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance_report_${eventId}.csv`,
    );
    res.status(200);

    // Streams each cursor batch to the client as it is read, honouring the
    // response's backpressure instead of building the whole CSV in memory.
    await pipeline(
      Readable.from(attendanceCsvGenerator(eventId), { objectMode: false }),
      res,
    );
  } catch (error) {
    console.error(error);

    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate report" });
    } else if (!res.destroyed) {
      res.destroy(error);
    }
  }
});

// POST /api/events/:id/unlock
router.post("/:id/unlock", authenticateToken, unlockLimiter, async (req, res) => {
  try {
    const submittedPin =
      typeof req.body?.pin === "string"
        ? req.body.pin.trim().toUpperCase()
        : "";

    if (!submittedPin) {
      return res.status(400).json({ error: "An access PIN is required." });
    }

    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true, unlock_pin: true },
    });

    if (
      !event ||
      !UNLOCKABLE_EVENT_STATUSES.has(event.status) ||
      event.unlock_pin !== submittedPin
    ) {
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
      const [totalSignIns, totalSignOuts, recentScans, ushers, scanCounts] =
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

          // 1. Fetch the ushers
          prisma.user.findMany({
            where: { role: "USHER" },
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              last_active: true,
            },
          }),

          // 2. Group all scans for this event by usher AND scan type
          prisma.attendanceRecord.groupBy({
            by: ["usher_id", "scan_type"],
            where: { event_id: eventId },
            _count: { _all: true },
          }),
        ]);

      const throughput = Math.round(recentScans / 5); // Average scans per minute

      // 3. Index the grouped counts once so the roster merge is O(n) instead
      // of running a linear find() for every usher.
      const scanCountsByUsherAndType = new Map(
        scanCounts.map((count) => [
          `${count.usher_id}:${count.scan_type}`,
          count._count._all,
        ]),
      );

      // 4. Merge the grouped counts into the roster array
      const roster = ushers
        .map((u) => {
          const signIns =
            scanCountsByUsherAndType.get(`${u.id}:SIGN_IN`) || 0;
          const signOuts =
            scanCountsByUsherAndType.get(`${u.id}:SIGN_OUT`) || 0;
          const totalScans = signIns + signOuts;

          return {
            id: u.id,
            signIns,
            signOuts,
            totalScans,
            isOnline: u.last_active >= activeThreshold,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
          };
        })
        .sort((a, b) => b.totalScans - a.totalScans); // Sort Highest Scanners first by default

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
