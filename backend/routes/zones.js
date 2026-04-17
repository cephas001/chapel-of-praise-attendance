const express = require("express");
const prisma = require("../prismaClient");
const { authenticateToken, requireSuperAdmin } = require("../middleware/auth");

const router = express.Router();

// ==========================================
// GET ALL ZONES (AUTO-SEEDS DEFAULTS IF EMPTY)
// ==========================================
router.get("/", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    let zones = await prisma.zone.findMany({
      orderBy: [{ prefix: "asc" }, { name: "asc" }],
    });

    // Smart Auto-Seeder: If the table is empty, generate Peter's exact chapel layout
    if (zones.length === 0) {
      const defaultZones = [];

      // Helper function to generate numbered columns
      const generatePrefix = (letter, max) => {
        for (let i = 1; i <= max; i++) {
          defaultZones.push({
            name: `${letter}${i}`,
            prefix: letter,
            is_default: true,
          });
        }
      };

      generatePrefix("A", 9); // A1 - A9
      generatePrefix("B", 9); // B1 - B9
      generatePrefix("C", 8); // C1 - C8
      generatePrefix("D", 8); // D1 - D8
      generatePrefix("E", 8); // E1 - E8
      generatePrefix("F", 8); // F1 - F8

      // Add special sections
      defaultZones.push({
        name: "CHOIR & MEDIA",
        prefix: "CHOIR_MEDIA",
        is_default: true,
      });
      defaultZones.push({ name: "USHERS", prefix: "USHERS", is_default: true });

      await prisma.zone.createMany({ data: defaultZones });

      // Re-fetch after seeding
      zones = await prisma.zone.findMany({
        orderBy: [{ prefix: "asc" }, { name: "asc" }],
      });
    }

    res.json(zones);
  } catch (error) {
    console.error("Error fetching zones:", error);
    res.status(500).json({ error: "Failed to fetch chapel layout" });
  }
});

// ==========================================
// CREATE A CUSTOM ZONE (For unexpected overflow)
// ==========================================
router.post("/", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { name, prefix } = req.body;
    const newZone = await prisma.zone.create({
      data: {
        name: name.toUpperCase(),
        prefix: prefix.toUpperCase(),
        is_default: false,
      },
    });
    res.status(201).json(newZone);
  } catch (error) {
    res.status(500).json({ error: "Failed to create custom zone" });
  }
});

module.exports = router;
