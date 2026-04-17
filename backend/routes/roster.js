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
      const { availableUserIds, activeZoneIds, lowTrafficZoneIds } = req.body;

      // 1. Fetch Users & Sort by least active first
      const users = await prisma.user.findMany({
        where: { id: { in: availableUserIds } },
        include: { _count: { select: { assignments: true } } },
      });
      users.sort((a, b) => a._count.assignments - b._count.assignments);

      // Using let instead of const so we can safely extract people out of these pools
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
        // Find the first available choir member (they are already sorted by least active!)
        const choirMemberIndex = others.findIndex((u) => u.unit === "CHOIR");
        let dedicatedScanner = null;

        if (choirMemberIndex !== -1) {
          // Extract them completely from the 'others' pool
          dedicatedScanner = others.splice(choirMemberIndex, 1)[0];
        } else if (others.length > 0) {
          // Fallback: use any non-usher, but still isolate them
          dedicatedScanner = others.shift();
          warnings.push(
            "⚠️ Notice: No Choir unit members available. A different unit member was assigned specifically to scan Choir & Media.",
          );
        } else if (ushers.length > 0) {
          // Fallback: use an usher if literally no one else is available
          dedicatedScanner = ushers.shift();
          warnings.push(
            "⚠️ Notice: Severe personnel shortage. An Usher was pulled to specifically scan Choir & Media.",
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

          // Remove this zone from normal traffic queues so it isn't assigned twice
          highTraffic = highTraffic.filter((z) => z.id !== choirMediaZone.id);
          lowTraffic = lowTraffic.filter((z) => z.id !== choirMediaZone.id);
        } else {
          warnings.push(
            "⚠️ Critical: Could not assign anyone to Choir & Media. Total personnel exhausted.",
          );
        }
      }

      // ==========================================
      // THE DYNAMIC BALANCER
      // ==========================================
      // Filter out worker zones so Ushers aren't asked to arrange them
      const arrangerZones = zones.filter(
        (z) => z.prefix !== "CHOIR_MEDIA" && z.prefix !== "USHERS",
      );

      const IDEAL_COLS_PER_ARRANGER = 5;
      let targetArrangers = Math.ceil(
        arrangerZones.length / IDEAL_COLS_PER_ARRANGER,
      );
      const minScannersNeeded = Math.ceil(highTraffic.length / 2);
      const totalAvailable = ushers.length + others.length;

      let allowedArrangers = Math.min(targetArrangers, ushers.length);

      if (totalAvailable - allowedArrangers < minScannersNeeded) {
        allowedArrangers = Math.max(
          0,
          ushers.length - (minScannersNeeded - others.length),
        );
      }

      const dedicatedArrangers = ushers.slice(0, allowedArrangers);
      const scanningUshers = ushers.slice(allowedArrangers);
      const scannerPool = [...others, ...scanningUshers];

      if (scannerPool.length < minScannersNeeded && highTraffic.length > 0) {
        warnings.push(
          "⚠️ Critical: Extreme personnel shortage. Scanners have been assigned more than 2 high-traffic columns.",
        );
      }
      if (dedicatedArrangers.length === 0 && arrangerZones.length > 0) {
        warnings.push(
          "⚠️ Warning: Personnel so low that 0 ushers could be spared for arranging.",
        );
      }

      // ==========================================
      // LOOP 1: ARRANGER ASSIGNMENTS (Boundary-Aware Snapping)
      // ==========================================
      if (dedicatedArrangers.length > 0) {
        let startIndex = 0;
        const numChunks = dedicatedArrangers.length;

        for (let i = 0; i < numChunks; i++) {
          if (startIndex >= arrangerZones.length) break;

          let chunk;
          if (i === numChunks - 1) {
            chunk = arrangerZones.slice(startIndex);
          } else {
            const zonesLeft = arrangerZones.length - startIndex;
            const arrangersLeft = numChunks - i;
            const targetSize = Math.ceil(zonesLeft / arrangersLeft);

            let bestBreakIndex = startIndex + targetSize - 1;
            const snapRadius = Math.floor(targetSize / 2);

            for (let offset = 0; offset <= snapRadius; offset++) {
              let checkIdx = bestBreakIndex - offset;
              if (
                checkIdx > startIndex &&
                checkIdx < arrangerZones.length - 1 &&
                arrangerZones[checkIdx].prefix !==
                  arrangerZones[checkIdx + 1].prefix
              ) {
                bestBreakIndex = checkIdx;
                break;
              }
              checkIdx = bestBreakIndex + offset;
              if (
                checkIdx < arrangerZones.length - 1 &&
                arrangerZones[checkIdx].prefix !==
                  arrangerZones[checkIdx + 1].prefix
              ) {
                bestBreakIndex = checkIdx;
                break;
              }
            }

            chunk = arrangerZones.slice(startIndex, bestBreakIndex + 1);
            startIndex = bestBreakIndex + 1;
          }

          if (chunk.length === 0) continue;

          const zoneLabel =
            chunk.length > 1
              ? `${chunk[0].name} to ${chunk[chunk.length - 1].name}`
              : chunk[0].name;

          proposedAssignments.push({
            user_id: dedicatedArrangers[i].id,
            event_id: eventId,
            user: dedicatedArrangers[i],
            zone_name: `${zoneLabel}`,
            task_type: "ARRANGER",
            is_primary: true,
          });
        }
      }

      // ==========================================
      // LOOP 2: HIGH-TRAFFIC SCANNERS
      // ==========================================
      let scannerIndex = 0;
      const assignedHighTrafficUsers = [];
      const currentEventWorkload = new Map(); // NEW: Track how many primary columns each gets

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

        // Keep track of unique users
        if (!assignedHighTrafficUsers.some((u) => u.id === user.id)) {
          assignedHighTrafficUsers.push(user);
        }

        // Increment their workload counter
        const currentCount = currentEventWorkload.get(user.id) || 0;
        currentEventWorkload.set(user.id, currentCount + 1);

        scannerIndex++;
      });

      // ==========================================
      // LOOP 3: LOW-TRAFFIC (SECONDARY) SCANNERS
      // ==========================================
      // NEW: Sort the line! People with 1 high-traffic column go to the front.
      // People with 2 high-traffic columns are pushed to the back.
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
router.get(
  "/:eventId",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
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
  },
);

module.exports = router;
