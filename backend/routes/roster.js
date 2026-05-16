const express = require("express");
const prisma = require("../prismaClient");
const { authenticateToken, requireSuperAdmin } = require("../middleware/auth");

const router = express.Router();

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
      const {
        availableUserIds,
        activeZoneIds,
        lowTrafficZoneIds,
        scanningOnly,
      } = req.body;

      // 1. Fetch Users & Sort by least active first
      const users = await prisma.user.findMany({
        where: { id: { in: availableUserIds } },
        include: { _count: { select: { assignments: true } } },
      });
      users.sort((a, b) => a._count.assignments - b._count.assignments);

      let ushers = users.filter((u) => u.unit === "USHER");
      let others = users.filter((u) => u.unit !== "USHER");

      // 2. Fetch Active Zones
      const zones = await prisma.zone.findMany({
        where: { id: { in: activeZoneIds } },
        orderBy: [{ prefix: "asc" }, { name: "asc" }],
      });

      let highTraffic = zones.filter((z) => !lowTrafficZoneIds.includes(z.id));
      let lowTraffic = zones.filter((z) => lowTrafficZoneIds.includes(z.id));

      const proposedAssignments = [];
      const warnings = [];

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
      const { assignments } = req.body;

      await prisma.$transaction([
        prisma.assignment.deleteMany({ where: { event_id: eventId } }),
        prisma.assignment.createMany({
          data: assignments.map((a) => ({
            user_id: a.user_id,
            event_id: a.event_id,
            zone_name: a.zone_name,
            task_type: a.task_type,
            is_primary: a.is_primary,
          })),
        }),
      ]);

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
// GET ENTIRE ROSTER FOR SUPER ADMIN
// ==========================================
router.get("/:eventId", authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const assignments = await prisma.assignment.findMany({
      where: { event_id: eventId },
      include: { user: true }, // Crucial: Includes the user data for the Review UI
      orderBy: [{ task_type: "asc" }, { is_primary: "desc" }],
    });
    res.json(assignments);
  } catch (error) {
    console.error("Fetch Roster Error:", error);
    res.status(500).json({ error: "Failed to fetch roster." });
  }
});

module.exports = router;
