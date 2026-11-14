const express = require("express");
const prisma = require("../prismaClient");
const { authenticateToken, requireSuperAdmin } = require("../middleware/auth");

const router = express.Router();

const MAX_ROSTER_SIZE = 500;
const VALID_TASK_TYPES = new Set(["SCANNER", "ARRANGER"]);

// Ushers may read the roster of a live event so they know their post. Rosters
// for upcoming, completed or archived events remain Super Admin only because
// they may contain unpublished staffing decisions.
const USHER_READABLE_EVENT_STATUSES = new Set([
  "SIGN_IN_ACTIVE",
  "SYNCING_PHASE",
  "SIGN_OUT_ACTIVE",
]);

const normalizeIdList = (value) => {
  if (!Array.isArray(value)) return null;

  const ids = value
    .filter((id) => typeof id === "string" && id.trim() !== "")
    .map((id) => id.trim());

  return [...new Set(ids)];
};

// ==========================================
// GENERATE ROSTER ALGORITHM
// ==========================================
router.post(
  "/:eventId/generate",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const body = req.body || {};
      const availableUserIds = normalizeIdList(body.availableUserIds);
      const activeZoneIds = normalizeIdList(body.activeZoneIds);
      const lowTrafficZoneIds = normalizeIdList(body.lowTrafficZoneIds ?? []);
      const scanningOnly = body.scanningOnly === true;
      const warnings = [];

      if (!availableUserIds || !activeZoneIds || !lowTrafficZoneIds) {
        return res.status(400).json({
          error:
            "availableUserIds, activeZoneIds and lowTrafficZoneIds must be arrays of IDs.",
        });
      }

      if (availableUserIds.length === 0) {
        return res.status(400).json({
          error: "Select at least one available team member.",
        });
      }

      if (activeZoneIds.length === 0) {
        return res.status(400).json({
          error: "Select at least one active zone.",
        });
      }

      if (
        availableUserIds.length > MAX_ROSTER_SIZE ||
        activeZoneIds.length > MAX_ROSTER_SIZE
      ) {
        return res.status(400).json({
          error: `A roster may contain at most ${MAX_ROSTER_SIZE} people or zones.`,
        });
      }

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, status: true },
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found." });
      }

      if (event.status === "ARCHIVED") {
        return res.status(409).json({
          error: "An archived event cannot receive a new roster.",
        });
      }

      // 1. Fetch Users & Sort by least active first
      const requestedUsers = await prisma.user.findMany({
        where: { id: { in: availableUserIds } },
        include: { _count: { select: { assignments: true } } },
      });
      const users = requestedUsers.filter((user) => user.is_active);

      if (users.length !== availableUserIds.length) {
        warnings.push(
          `${availableUserIds.length - users.length} selected team member(s) were unavailable or inactive and were not assigned.`,
        );
      }

      if (users.length === 0) {
        return res.status(400).json({
          error: "None of the selected team members are active.",
        });
      }

      users.sort((a, b) => a._count.assignments - b._count.assignments);

      const ushers = users.filter((u) => u.unit === "USHER");
      const others = users.filter((u) => u.unit !== "USHER");

      // 2. Fetch Active Zones
      const zones = await prisma.zone.findMany({
        where: { id: { in: activeZoneIds } },
        orderBy: [{ prefix: "asc" }, { name: "asc" }],
      });

      if (zones.length === 0) {
        return res.status(400).json({
          error: "None of the selected zones exist.",
        });
      }

      if (zones.length !== activeZoneIds.length) {
        warnings.push(
          "Some selected zones no longer exist and were ignored.",
        );
      }

      const lowTrafficSet = new Set(
        lowTrafficZoneIds.filter((id) => activeZoneIds.includes(id)),
      );

      let highTraffic = zones.filter((z) => !lowTrafficSet.has(z.id));
      let lowTraffic = zones.filter((z) => lowTrafficSet.has(z.id));

      const proposedAssignments = [];

      // ==========================================
      // PRE-LOOP: CHOIR & MEDIA SPECIAL ASSIGNMENT
      // ==========================================
      const choirMediaZone = zones.find((z) => z.prefix === "CHOIR_MEDIA");

      if (choirMediaZone) {
        const choirMemberIndex = others.findIndex((u) => u.unit === "CHOIR");
        let dedicatedScanner = null;

        if (choirMemberIndex !== -1) {
          dedicatedScanner = others.splice(choirMemberIndex, 1)[0];
        } else if (others.length > 0) {
          dedicatedScanner = others.shift();
          warnings.push(
            "Notice: No Choir unit members available. A different unit member was assigned specifically to scan Choir & Media.",
          );
        } else if (ushers.length > 0) {
          dedicatedScanner = ushers.shift();
          warnings.push(
            "Notice: Severe personnel shortage. An Usher was pulled to specifically scan Choir & Media.",
          );
        }

        if (dedicatedScanner) {
          proposedAssignments.push({
            user_id: dedicatedScanner.id,
            event_id: eventId,
            user: dedicatedScanner,
            zone_name: choirMediaZone.name,
            task_type: "SCANNER",
            is_primary: true,
          });

          highTraffic = highTraffic.filter((z) => z.id !== choirMediaZone.id);
          lowTraffic = lowTraffic.filter((z) => z.id !== choirMediaZone.id);
        } else {
          warnings.push(
            "Critical: Could not assign anyone to Choir & Media. Total personnel exhausted.",
          );
        }
      }

      // ==========================================
      // THE DYNAMIC BALANCER (Vertical Column Logic)
      // ==========================================
      const arrangerZones = zones.filter(
        (z) => z.prefix !== "CHOIR_MEDIA" && z.prefix !== "USHERS",
      );

      let dedicatedArrangers = [];
      let scanningUshers = [];
      let scannerPool = [];

      // HELPER: Parse "A1", "B10" into Row ('A') and Col (1)
      const parseZone = (name) => {
        const match = name.match(/^([a-zA-Z_]+?)(\d+)$/);
        if (match) return { row: match[1], col: parseInt(match[2], 10) };
        return { row: name, col: name }; // Fallback for custom names (e.g., "GALLERY")
      };

      // 1. Group all zones by their vertical column
      const columnsMap = new Map();
      arrangerZones.forEach((z) => {
        const parsed = parseZone(z.name);
        if (!columnsMap.has(parsed.col)) columnsMap.set(parsed.col, []);
        columnsMap.get(parsed.col).push({ ...z, ...parsed });
      });

      // 2. Sort columns numerically and separate into Front (A/B) and Back (C+)
      const processedCols = [];
      let totalFronts = 0;
      let totalBacks = 0;

      const sortedColKeys = Array.from(columnsMap.keys()).sort((a, b) => {
        const numA = parseInt(a),
          numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return String(a).localeCompare(String(b));
      });

      sortedColKeys.forEach((colKey) => {
        const zonesInCol = columnsMap.get(colKey);
        // Sort vertically: A -> Z
        zonesInCol.sort((a, b) => a.row.localeCompare(b.row));

        const front = zonesInCol.filter((z) => z.row === "A" || z.row === "B");
        const back = zonesInCol.filter((z) => z.row !== "A" && z.row !== "B");

        processedCols.push({ col: colKey, front, back, all: zonesInCol });
        if (front.length > 0) totalFronts++;
        if (back.length > 0) totalBacks++;
      });

      if (scanningOnly) {
        scanningUshers = ushers;
        scannerPool = [...others, ...scanningUshers];
      } else {
        // Ideal scenario: Every column gets 1 Front Arranger + 1 Back Arranger
        const idealArrangers = totalFronts + totalBacks;
        const minScannersNeeded = Math.ceil(highTraffic.length / 2);
        const totalAvailable = ushers.length + others.length;

        // Cap allowed arrangers so we don't assign more than we have tasks for
        let allowedArrangers = Math.min(idealArrangers, ushers.length);

        // Protect the scanners!
        if (totalAvailable - allowedArrangers < minScannersNeeded) {
          allowedArrangers = Math.max(
            0,
            ushers.length - (minScannersNeeded - others.length),
          );
        }

        dedicatedArrangers = ushers.slice(0, allowedArrangers);
        scanningUshers = ushers.slice(allowedArrangers);
        scannerPool = [...others, ...scanningUshers];

        if (dedicatedArrangers.length === 0 && arrangerZones.length > 0) {
          warnings.push(
            "Warning: Personnel so low that 0 ushers could be spared for arranging.",
          );
        }
      }

      const minScannersNeededCheck = Math.ceil(highTraffic.length / 2);
      if (
        scannerPool.length < minScannersNeededCheck &&
        highTraffic.length > 0
      ) {
        warnings.push(
          "Critical: Extreme personnel shortage. Scanners have been assigned more than 2 high-traffic columns.",
        );
      }

      // ==========================================
      // LOOP 1: ARRANGER ASSIGNMENTS (Vertical Distribution)
      // ==========================================
      if (dedicatedArrangers.length > 0) {
        const arrangerTasks = [];

        if (dedicatedArrangers.length >= processedCols.length) {
          // Normal/Good Staffing: We have at least 1 person per column.
          // Decide how many columns get the luxury of a Front/Back split.
          let splitBudget = dedicatedArrangers.length - processedCols.length;

          processedCols.forEach((colData) => {
            if (
              colData.front.length > 0 &&
              colData.back.length > 0 &&
              splitBudget > 0
            ) {
              // We have the budget to split this column!
              arrangerTasks.push(colData.front);
              arrangerTasks.push(colData.back);
              splitBudget--;
            } else {
              // Shortage: One person takes the whole column
              arrangerTasks.push(colData.all);
            }
          });
        } else {
          // SEVERE Shortage: We have fewer arrangers than columns.
          // We must group adjacent columns together.
          const numArrangers = dedicatedArrangers.length;
          for (let i = 0; i < numArrangers; i++) {
            let start = Math.floor((i * processedCols.length) / numArrangers);
            let end = Math.floor(
              ((i + 1) * processedCols.length) / numArrangers,
            );
            let taskZones = [];
            for (let j = start; j < end; j++) {
              taskZones.push(...processedCols[j].all);
            }
            arrangerTasks.push(taskZones);
          }
        }

        // Assign the generated tasks to the dedicated arrangers
        arrangerTasks.forEach((taskZones, index) => {
          if (taskZones.length === 0) return;

          const user = dedicatedArrangers[index];
          let zoneLabel = "";

          if (taskZones.length === 1) {
            zoneLabel = taskZones[0].name; // e.g., "A1"
          } else {
            // Check if this task spans multiple columns (Severe Shortage)
            const uniqueCols = [...new Set(taskZones.map((z) => z.col))];
            if (uniqueCols.length > 1) {
              zoneLabel = `Columns ${Math.min(...uniqueCols)} to ${Math.max(...uniqueCols)}`;
            } else {
              // Single column, multiple rows (Normal) -> e.g., "A1 to B1" or "C1 to F1"
              taskZones.sort((a, b) => a.row.localeCompare(b.row));
              zoneLabel = `${taskZones[0].name} to ${taskZones[taskZones.length - 1].name}`;
            }
          }

          proposedAssignments.push({
            user_id: user.id,
            event_id: eventId,
            user: user,
            zone_name: zoneLabel,
            task_type: "ARRANGER",
            is_primary: true,
          });
        });
      }

      // ==========================================
      // LOOP 2: HIGH-TRAFFIC SCANNERS
      // ==========================================
      let scannerIndex = 0;
      const assignedHighTrafficUsers = [];
      const currentEventWorkload = new Map();

      highTraffic.forEach((zone) => {
        if (scannerPool.length === 0) return;

        const user = scannerPool[scannerIndex % scannerPool.length];

        proposedAssignments.push({
          user_id: user.id,
          event_id: eventId,
          user: user,
          zone_name: zone.name,
          task_type: "SCANNER",
          is_primary: true,
        });

        if (!assignedHighTrafficUsers.some((u) => u.id === user.id)) {
          assignedHighTrafficUsers.push(user);
        }

        const currentCount = currentEventWorkload.get(user.id) || 0;
        currentEventWorkload.set(user.id, currentCount + 1);

        scannerIndex++;
      });

      // ==========================================
      // LOOP 3: LOW-TRAFFIC (SECONDARY) SCANNERS
      // ==========================================
      assignedHighTrafficUsers.sort((a, b) => {
        const countA = currentEventWorkload.get(a.id) || 0;
        const countB = currentEventWorkload.get(b.id) || 0;
        return countA - countB;
      });

      let secondaryIndex = 0;
      lowTraffic.forEach((zone) => {
        if (assignedHighTrafficUsers.length === 0) return;

        const user =
          assignedHighTrafficUsers[
            secondaryIndex % assignedHighTrafficUsers.length
          ];
        proposedAssignments.push({
          user_id: user.id,
          event_id: eventId,
          user: user,
          zone_name: zone.name,
          task_type: "SCANNER",
          is_primary: false,
        });
        secondaryIndex++;
      });

      res.json({
        success: true,
        warnings,
        proposedAssignments,
      });
    } catch (error) {
      console.error("Algorithm Error:", error);
      res.status(500).json({ error: "Failed to run generation algorithm" });
    }
  },
);

// ==========================================
// PUBLISH ROSTER TO DATABASE
// ==========================================
router.post(
  "/:eventId/publish",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const assignments = req.body?.assignments;

      if (!Array.isArray(assignments)) {
        return res
          .status(400)
          .json({ error: "Assignments must be an array." });
      }

      if (assignments.length > MAX_ROSTER_SIZE) {
        return res.status(400).json({
          error: `A roster may contain at most ${MAX_ROSTER_SIZE} assignments.`,
        });
      }

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, status: true },
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found." });
      }

      if (event.status === "ARCHIVED") {
        return res.status(409).json({
          error: "An archived event cannot receive a new roster.",
        });
      }

      const seenAssignments = new Set();
      const normalizedAssignments = [];

      for (const assignment of assignments) {
        const userId =
          typeof assignment?.user_id === "string"
            ? assignment.user_id.trim()
            : "";
        const zoneName =
          typeof assignment?.zone_name === "string"
            ? assignment.zone_name.trim()
            : "";
        const taskType =
          typeof assignment?.task_type === "string"
            ? assignment.task_type.trim().toUpperCase()
            : "";
        const isPrimary = assignment?.is_primary ?? true;

        if (!userId || !zoneName || !VALID_TASK_TYPES.has(taskType)) {
          return res.status(400).json({
            error:
              "Every assignment needs a valid user, zone and task type.",
          });
        }

        if (typeof isPrimary !== "boolean") {
          return res.status(400).json({
            error: "Assignment is_primary must be a boolean.",
          });
        }

        const assignmentKey = `${userId}:${zoneName}`;

        if (seenAssignments.has(assignmentKey)) {
          return res.status(400).json({
            error: "The same person cannot be assigned to the same zone twice.",
          });
        }

        seenAssignments.add(assignmentKey);

        normalizedAssignments.push({
          user_id: userId,
          // Always derive the event from the route, never from the payload.
          event_id: eventId,
          zone_name: zoneName,
          task_type: taskType,
          is_primary: isPrimary,
        });
      }

      if (normalizedAssignments.length > 0) {
        const userIds = [
          ...new Set(normalizedAssignments.map((a) => a.user_id)),
        ];
        const existingUsers = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true },
        });

        if (existingUsers.length !== userIds.length) {
          return res.status(400).json({
            error: "One or more selected users no longer exist.",
          });
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.assignment.deleteMany({ where: { event_id: eventId } });

        if (normalizedAssignments.length > 0) {
          await tx.assignment.createMany({ data: normalizedAssignments });
        }
      });

      res.json({ success: true, message: "Roster published successfully!" });
    } catch (error) {
      console.error("Publish Error:", error);
      res.status(500).json({ error: "Failed to publish roster to database." });
    }
  },
);

// ==========================================
// GET MY DUTY (For individual users)
// ==========================================
router.get("/:eventId/my-duty", authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    const assignments = await prisma.assignment.findMany({
      where: {
        event_id: eventId,
        user_id: req.user.id, // Only fetch for the logged-in user
      },
      orderBy: [
        { task_type: "asc" }, // Arrangers first, Scanners second
        { is_primary: "desc" }, // Primary (High Traffic) before Secondary
      ],
    });

    res.json(assignments);
  } catch (error) {
    console.error("My Duty Error:", error);
    res.status(500).json({ error: "Failed to fetch duty assignments" });
  }
});

// ==========================================
// GET ENTIRE ROSTER
// Super Admins may read any event. Authenticated ushers may read only the
// roster of an event that is currently live; writes stay Super Admin only.
// ==========================================
router.get("/:eventId", authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    if (req.user.role !== "SUPER_ADMIN") {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { status: true },
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found." });
      }

      if (!USHER_READABLE_EVENT_STATUSES.has(event.status)) {
        return res.status(403).json({
          error: "The roster is only available while this event is live.",
        });
      }
    }

    const assignments = await prisma.assignment.findMany({
      where: { event_id: eventId },
      select: {
        id: true,
        user_id: true,
        event_id: true,
        zone_name: true,
        task_type: true,
        is_primary: true,
        created_at: true,
        user: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            unit: true,
            avatar_url: true,
          },
        },
      },
      orderBy: [{ task_type: "asc" }, { is_primary: "desc" }],
    });

    res.json(assignments);
  } catch (error) {
    console.error("Fetch Roster Error:", error);
    res.status(500).json({ error: "Failed to fetch roster." });
  }
});

module.exports = router;
