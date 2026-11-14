const express = require("express");
const prisma = require("../prismaClient");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const MAX_SYNC_BATCH_SIZE = 100;
const VALID_SCAN_TYPES = new Set(["SIGN_IN", "SIGN_OUT"]);
const ACTIVE_SCAN_STATUSES = new Set(["SIGN_IN_ACTIVE", "SIGN_OUT_ACTIVE"]);
// ARCHIVED is deliberately absent: archived events are immutable, while
// COMPLETED stays here so devices can still upload late offline scans.
const SYNCABLE_EVENT_STATUSES = new Set([
  "SIGN_IN_ACTIVE",
  "SYNCING_PHASE",
  "SIGN_OUT_ACTIVE",
  "COMPLETED",
]);
const SCAN_TYPE_BY_EVENT_STATUS = {
  SIGN_IN_ACTIVE: "SIGN_IN",
  SIGN_OUT_ACTIVE: "SIGN_OUT",
};

// Composite key used to track which students already have a sign-in for an event.
const signInKey = (event_id, matric_number) =>
  JSON.stringify([event_id, matric_number]);

const normalizeMatric = (value) => String(value).trim().toUpperCase();

const normalizeScanDate = (value) => {
  if (typeof value !== "string" && typeof value !== "number") return null;

  const scannedAt = new Date(value);
  return Number.isNaN(scannedAt.getTime()) ? null : scannedAt;
};

const isValidSingleScan = ({
  event_id,
  matric_number,
  scan_type,
  scanned_at,
}) => {
  if (!event_id || !matric_number) return false;
  if (!VALID_SCAN_TYPES.has(scan_type)) return false;
  return Boolean(normalizeScanDate(scanned_at));
};

const isValidSyncScan = (scan) => {
  if (!scan || typeof scan !== "object") return false;
  if (typeof scan.id !== "string" || scan.id.trim() === "") return false;
  if (typeof scan.event_id !== "string" || scan.event_id.trim() === "") {
    return false;
  }
  if (
    typeof scan.matric_number !== "string" ||
    scan.matric_number.trim() === ""
  ) {
    return false;
  }
  if (!VALID_SCAN_TYPES.has(scan.scan_type)) return false;
  return Boolean(normalizeScanDate(scan.scanned_at));
};

// POST /api/attendance/scan
router.post("/scan", authenticateToken, async (req, res) => {
  const body = req.body || {};
  const event_id =
    typeof body.event_id === "string" ? body.event_id.trim() : "";
  const matric_number =
    typeof body.matric_number === "string"
      ? normalizeMatric(body.matric_number)
      : "";
  const scan_type = body.scan_type;
  const scannedAt = normalizeScanDate(body.scanned_at);

  // Never trust a client-provided usher_id; attribution comes from the JWT.
  const usher_id = req.user.id;

  if (
    !isValidSingleScan({
      event_id,
      matric_number,
      scan_type,
      scanned_at: body.scanned_at,
    })
  ) {
    return res.status(400).json({
      error: "Bad Request",
      message: "A valid event, matric number, scan type and time are required.",
    });
  }

  try {
    const [event, access] = await Promise.all([
      prisma.event.findUnique({
        where: { id: event_id },
        select: { id: true, status: true },
      }),
      req.user.role === "SUPER_ADMIN"
        ? Promise.resolve(true)
        : prisma.eventAccess.findUnique({
            where: {
              user_id_event_id: { user_id: usher_id, event_id },
            },
          }),
    ]);

    if (!event) {
      return res.status(404).json({
        error: "Event not found",
        message: "This event no longer exists.",
      });
    }

    if (req.user.role !== "SUPER_ADMIN" && !access) {
      return res.status(403).json({
        error: "Event locked",
        message: "Unlock this event before scanning.",
      });
    }

    if (!ACTIVE_SCAN_STATUSES.has(event.status)) {
      return res.status(409).json({
        error: "Scanning closed",
        message: "This event is not currently accepting scans.",
      });
    }

    const expectedScanType = SCAN_TYPE_BY_EVENT_STATUS[event.status];

    if (expectedScanType && scan_type !== expectedScanType) {
      return res.status(409).json({
        error: "Wrong scan phase",
        message:
          event.status === "SIGN_IN_ACTIVE"
            ? "Only sign-ins are accepted during the sign-in phase."
            : "Only sign-outs are accepted during the sign-out phase.",
      });
    }

    if (scan_type === "SIGN_OUT") {
      const existingSignIn = await prisma.attendanceRecord.findFirst({
        where: { event_id, matric_number, scan_type: "SIGN_IN" },
        select: { id: true },
      });

      if (!existingSignIn) {
        return res.status(403).json({
          error: "Rule Violation",
          message: `Student ${matric_number} cannot sign out because they never signed in.`,
        });
      }
    }

    await prisma.student.upsert({
      where: { matric_number },
      update: {},
      create: { matric_number },
    });

    const newRecord = await prisma.attendanceRecord.create({
      data: {
        event_id,
        matric_number,
        scan_type,
        usher_id,
        scanned_at: scannedAt,
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

// POST /api/attendance/sync
router.post("/sync", authenticateToken, async (req, res) => {
  const incomingScans = Array.isArray(req.body) ? req.body : req.body?.scans;

  if (!Array.isArray(incomingScans) || incomingScans.length === 0) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Provide a non-empty array of scans in the request body.",
    });
  }

  if (incomingScans.length > MAX_SYNC_BATCH_SIZE) {
    return res.status(400).json({
      error: "Batch Too Large",
      message: `A sync batch may contain at most ${MAX_SYNC_BATCH_SIZE} scans.`,
    });
  }

  // Every input item gets a result, in the same order, keyed by its client ID.
  const results = incomingScans.map((scan) => ({
    id: scan && scan.id !== undefined ? scan.id : null,
    status: "rejected",
  }));

  const candidates = [];
  incomingScans.forEach((scan, index) => {
    if (!isValidSyncScan(scan)) {
      results[index].reason = "Invalid scan payload.";
      return;
    }

    candidates.push({
      index,
      event_id: scan.event_id.trim(),
      matric_number: normalizeMatric(scan.matric_number),
      scan_type: scan.scan_type,
      scanned_at: normalizeScanDate(scan.scanned_at),
    });
  });

  if (candidates.length === 0) {
    return res.status(200).json(results);
  }

  // Process in chronological order so an earlier sign-in can satisfy a later
  // sign-out even when the client uploads its queue out of order. The sort is
  // stable, so identical timestamps keep the client's original order.
  candidates.sort((a, b) => a.scanned_at - b.scanned_at);

  try {
    const usher_id = req.user.id;

    await prisma.$transaction(
      async (tx) => {
        const eventIds = [...new Set(candidates.map((scan) => scan.event_id))];
        const existingEvents = await tx.event.findMany({
          where: { id: { in: eventIds } },
          select: { id: true, status: true },
        });

        const eventStatusById = new Map(
          existingEvents.map((event) => [event.id, event.status]),
        );

        const syncableEventIds = new Set(
          existingEvents
            .filter((event) => SYNCABLE_EVENT_STATUSES.has(event.status))
            .map((event) => event.id),
        );

        // Super admins bypass the PIN gate, matching the live scan endpoint.
        // Every other usher must have unlocked the event before queued scans
        // can be committed.
        let accessibleEventIds = syncableEventIds;

        if (req.user.role !== "SUPER_ADMIN" && syncableEventIds.size > 0) {
          const accessRows = await tx.eventAccess.findMany({
            where: {
              user_id: usher_id,
              event_id: { in: [...syncableEventIds] },
            },
            select: { event_id: true },
          });

          accessibleEventIds = new Set(
            accessRows.map((access) => access.event_id),
          );
        }

        const writableScans = candidates.filter((scan) => {
          if (!eventStatusById.has(scan.event_id)) {
            results[scan.index].reason = "Event not found.";
            return false;
          }

          if (eventStatusById.get(scan.event_id) === "ARCHIVED") {
            results[scan.index].reason =
              "This event is archived and no longer accepts scans.";
            return false;
          }

          if (!syncableEventIds.has(scan.event_id)) {
            results[scan.index].reason =
              "This event is no longer accepting scans.";
            return false;
          }

          if (!accessibleEventIds.has(scan.event_id)) {
            results[scan.index].reason =
              "Event is locked. Unlock it before syncing scans.";
            return false;
          }

          return true;
        });

        if (writableScans.length === 0) return;

        // Batch-create all students referenced by this sync in one write.
        const matricNumbers = [
          ...new Set(writableScans.map((scan) => scan.matric_number)),
        ];
        await tx.student.createMany({
          data: matricNumbers.map((matric_number) => ({ matric_number })),
          skipDuplicates: true,
        });

        // Seed the sign-in lookup with committed records in one query. Accepted
        // sign-ins from this batch are added as we process it chronologically.
        const signInKeys = new Set();
        const signOutPairs = new Map();
        for (const scan of writableScans) {
          if (scan.scan_type !== "SIGN_OUT") continue;
          signOutPairs.set(signInKey(scan.event_id, scan.matric_number), {
            event_id: scan.event_id,
            matric_number: scan.matric_number,
          });
        }

        if (signOutPairs.size > 0) {
          const existingSignIns = await tx.attendanceRecord.findMany({
            where: {
              scan_type: "SIGN_IN",
              OR: [...signOutPairs.values()],
            },
            select: { event_id: true, matric_number: true },
          });

          for (const record of existingSignIns) {
            signInKeys.add(signInKey(record.event_id, record.matric_number));
          }
        }

        for (const scan of writableScans) {
          const key = signInKey(scan.event_id, scan.matric_number);

          // Same rule as the single-scan endpoint: a sign-out requires a
          // sign-in that was recorded before it, including earlier in this batch.
          if (scan.scan_type === "SIGN_OUT" && !signInKeys.has(key)) {
            results[scan.index].reason =
              "Sign-out requires a previously recorded sign-in.";
            continue;
          }

          // skipDuplicates makes the composite unique constraint reject
          // duplicates without raising P2002 or aborting the transaction.
          const { count } = await tx.attendanceRecord.createMany({
            data: [
              {
                event_id: scan.event_id,
                matric_number: scan.matric_number,
                scan_type: scan.scan_type,
                usher_id,
                scanned_at: scan.scanned_at,
              },
            ],
            skipDuplicates: true,
          });

          // count === 0 means the row already exists. Treat it as accepted so
          // a retry after a lost response is idempotent instead of parking an
          // already-saved scan in the rejection list.
          results[scan.index].status = "accepted";
          delete results[scan.index].reason;

          if (count === 0) {
            results[scan.index].duplicate = true;
          }

          if (scan.scan_type === "SIGN_IN") {
            signInKeys.add(key);
          }
        }
      },
      { maxWait: 5000, timeout: 30000 },
    );

    return res.status(200).json(results);
  } catch (error) {
    console.error("Attendance sync failed:", error);
    return res.status(500).json({
      error: "Internal server error during sync processing",
    });
  }
});

module.exports = router;
