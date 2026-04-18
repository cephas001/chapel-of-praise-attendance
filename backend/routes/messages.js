const express = require("express");
const prisma = require("../prismaClient");
const { authenticateToken, requireSuperAdmin } = require("../middleware/auth");

const router = express.Router();

// Store active SSE connections in memory.
// We use a Map where Key = user_id, Value = Array of response objects (in case they have multiple tabs open)
const connectedClients = new Map();

// ==========================================
// 1. OPEN SSE STREAM (The Live Connection)
// ==========================================
router.get("/stream", authenticateToken, (req, res) => {
  // Set headers to keep the connection open and prevent caching
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders(); // Establish the connection immediately

  const userId = req.user.id;

  // Add this client to our tracking map
  if (!connectedClients.has(userId)) {
    connectedClients.set(userId, []);
  }
  connectedClients.get(userId).push(res);

  // Send an initial heartbeat to confirm connection
  res.write(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`);

  // Keep connection alive with a comment ping every 30 seconds (prevents Render from dropping idle pipes)
  const pingInterval = setInterval(() => {
    res.write(": ping\n\n");
  }, 30000);

  // Cleanup when the user closes the app/tab
  req.on("close", () => {
    clearInterval(pingInterval);
    const userConnections = connectedClients.get(userId) || [];
    const activeConnections = userConnections.filter(
      (client) => client !== res,
    );

    if (activeConnections.length === 0) {
      connectedClients.delete(userId);
    } else {
      connectedClients.set(userId, activeConnections);
    }
  });
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
      const { title, body, targetUserIds } = req.body;
      let usersToReceive = [];

      if (targetUserIds && targetUserIds.length > 0) {
        // Specific users
        usersToReceive = await prisma.user.findMany({
          where: { id: { in: targetUserIds } },
        });
      } else {
        // Broadcast to ALL users
        usersToReceive = await prisma.user.findMany();
      }

      // 1. Save a copy of the message to the database for EVERY targeted user's Inbox
      const messageData = usersToReceive.map((u) => ({
        user_id: u.id,
        title,
        body,
        is_read: false,
      }));

      await prisma.message.createMany({ data: messageData });

      // 2. Instantly push the live alert down the SSE pipe for anyone currently online
      usersToReceive.forEach((user) => {
        const activeConnections = connectedClients.get(user.id);
        if (activeConnections) {
          const payload = JSON.stringify({ type: "NEW_MESSAGE", title, body });
          activeConnections.forEach((client) => {
            client.write(`data: ${payload}\n\n`);
          });
        }
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

// Get my messages
router.get("/my-inbox", authenticateToken, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: "desc" },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inbox." });
  }
});

// Mark as read
router.patch("/:messageId/read", authenticateToken, async (req, res) => {
  try {
    await prisma.message.update({
      where: { id: req.params.messageId },
      data: { is_read: true },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update message." });
  }
});

// Delete message
router.delete("/:messageId", authenticateToken, async (req, res) => {
  try {
    await prisma.message.delete({
      where: { id: req.params.messageId },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete message." });
  }
});

module.exports = router;
