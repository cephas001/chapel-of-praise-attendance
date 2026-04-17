const express = require("express");
const prisma = require("../prismaClient");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// POST /api/attendance/scan
router.post("/scan", authenticateToken, async (req, res) => {
  const { event_id, matric_number, scan_type, usher_id, scanned_at } = req.body;

  try {
    if (scan_type === "SIGN_OUT") {
      const existingSignIn = await prisma.attendanceRecord.findFirst({
        where: { event_id, matric_number, scan_type: "SIGN_IN" },
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

module.exports = router;
