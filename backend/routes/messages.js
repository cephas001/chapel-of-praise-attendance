const express = require("express");
const { randomUUID } = require("crypto");
const prisma = require("../prismaClient");
const {
  authenticateToken,
  authenticateStreamToken,
  requireSuperAdmin,
} = require("../middleware/auth");
const {
  registerClient,
  unregisterClient,
  sendToUser,
} = require("../sseHub");

const router = express.Router();

// ==========================================
// 1. OPEN SSE STREAM (The Live Connection)
// ==========================================
router.get("/stream", authenticateStreamToken, (req, res) => {
  // Set headers to keep the connection open and prevent caching
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders(); // Establish the connection immediately

  const userId = req.user.id;

  registerClient(userId, res);

  // Send an initial heartbeat to confirm connection
  res.write(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`);

  // Keep connection alive with a comment ping every 30 seconds (prevents Render from dropping idle pipes)
  const pingInterval = setInterval(() => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(": ping\n\n");
    }
  }, 30000);

  const cleanup = () => {
    clearInterval(pingInterval);
    unregisterClient(userId, res);
  };

  // Cleanup when the user closes the app/tab or the socket errors.
  req.on("close", cleanup);
  res.on("error", cleanup);
});

// ==========================================
// 2. BROADCAST MESSAGE (Super Admin Only)
// ==========================================
router.post(
  "/broadcast",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { title, body, targetUserIds } = req.body || {};

      if (
        typeof title !== "string" ||
        !title.trim() ||
        typeof body !== "string" ||
        !body.trim()
      ) {
        return res
          .status(400)
          .json({ error: "A message title and body are required." });
      }

      if (targetUserIds != null && !Array.isArray(targetUserIds)) {
        return res
          .status(400)
          .json({ error: "targetUserIds must be an array." });
      }

      const targetIds = Array.isArray(targetUserIds)
        ? targetUserIds.filter((id) => typeof id === "string" && id)
        : [];

      let usersToReceive = [];

      if (targetIds.length > 0) {
        // Specific users
        usersToReceive = await prisma.user.findMany({
          where: { id: { in: targetIds } },
          select: { id: true },
        });
      } else {
        // Broadcast to ALL users
        usersToReceive = await prisma.user.findMany({
          select: { id: true },
        });
      }

      // 1. Save a copy of the message to the database for EVERY targeted user's Inbox.
      // Generate the IDs/timestamp here so the SSE payload can contain the exact
      // message that was persisted without re-querying the inbox.
      const createdAt = new Date();
      const messageRows = usersToReceive.map((u) => ({
        id: randomUUID(),
        user_id: u.id,
        title,
        body,
        is_read: false,
        created_at: createdAt,
      }));

      await prisma.message.createMany({ data: messageRows });

      // 2. Instantly push the full message down the SSE pipe for anyone online.
      messageRows.forEach((message) => {
        sendToUser(message.user_id, {
          type: "NEW_MESSAGE",
          // Keep the flat fields for older clients.
          title: message.title,
          body: message.body,
          message: {
            ...message,
            created_at: message.created_at.toISOString(),
          },
        });
      });

      res.json({
        success: true,
        message: `Message dispatched to ${usersToReceive.length} inboxes.`,
      });
    } catch (error) {
      console.error("Broadcast Error:", error);
      res.status(500).json({ error: "Failed to broadcast message." });
    }
  },
);

// ==========================================
// 3. INBOX ROUTES (For the Frontend UI)
// ==========================================

const INBOX_DEFAULT_LIMIT = 20;
const INBOX_MAX_LIMIT = 100;

const parseNonNegativeInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

// Get my messages (limit/offset paginated)
router.get("/my-inbox", authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseNonNegativeInt(req.query.limit, INBOX_DEFAULT_LIMIT), 1),
      INBOX_MAX_LIMIT,
    );
    const offset = parseNonNegativeInt(req.query.offset, 0);
    const where = { user_id: req.user.id };

    const [messages, total, unreadCount] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        skip: offset,
        take: limit,
      }),
      prisma.message.count({ where }),
      prisma.message.count({ where: { ...where, is_read: false } }),
    ]);

    res.json({
      messages,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + messages.length < total,
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Inbox Error:", error);
    res.status(500).json({ error: "Failed to fetch inbox." });
  }
});

// Lightweight badge count: returns only the number of unread messages.
router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const unreadCount = await prisma.message.count({
      where: { user_id: req.user.id, is_read: false },
    });
    res.json({ unreadCount });
  } catch (error) {
    console.error("Unread Count Error:", error);
    res.status(500).json({ error: "Failed to fetch unread count." });
  }
});

// Mark as read
router.patch("/:messageId/read", authenticateToken, async (req, res) => {
  try {
    // Scope by user_id so one usher cannot mutate another usher's inbox.
    const result = await prisma.message.updateMany({
      where: { id: req.params.messageId, user_id: req.user.id },
      data: { is_read: true },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Message not found." });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Mark message read failed:", error);
    res.status(500).json({ error: "Failed to update message." });
  }
});

// Delete message
router.delete("/:messageId", authenticateToken, async (req, res) => {
  try {
    // Scope by user_id so one usher cannot delete another usher's inbox.
    const result = await prisma.message.deleteMany({
      where: { id: req.params.messageId, user_id: req.user.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Message not found." });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete message failed:", error);
    res.status(500).json({ error: "Failed to delete message." });
  }
});

module.exports = router;
