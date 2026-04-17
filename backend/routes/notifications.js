const express = require("express");
const webpush = require("web-push");
const prisma = require("../prismaClient");
const { authenticateToken, requireSuperAdmin } = require("../middleware/auth");

const router = express.Router();

// 1. Configure web-push with your generated keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

// ==========================================
// SAVE BROWSER SUBSCRIPTION (All logged-in users)
// ==========================================
router.post("/subscribe", authenticateToken, async (req, res) => {
  try {
    const subscription = req.body;

    // We use 'upsert' so if the browser endpoint already exists,
    // we just update it instead of crashing with a duplicate error.
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        user_id: req.user.id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        user_id: req.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ error: "Failed to save push subscription" });
  }
});

// ==========================================
// BROADCAST MESSAGE (SUPER ADMIN ONLY)
// ==========================================
router.post(
  "/broadcast",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { title, body, targetUserIds } = req.body;

      // If targetUserIds is provided, only send to them. Otherwise, fetch everyone.
      const whereClause =
        targetUserIds && targetUserIds.length > 0
          ? { user_id: { in: targetUserIds } }
          : {};

      const subscriptions = await prisma.pushSubscription.findMany({
        where: whereClause,
        include: { user: { select: { username: true } } },
      });

      if (subscriptions.length === 0) {
        return res
          .status(404)
          .json({ error: "No subscribed devices found for targets." });
      }

      // This is the raw data the Service Worker will read in the background
      const payload = JSON.stringify({
        title,
        body,
        data: {
          type: "admin_broadcast",
          timestamp: Date.now(),
        },
      });

      let successCount = 0;

      const sendPromises = subscriptions.map(async (sub) => {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };

        try {
          await webpush.sendNotification(pushSub, payload);
          successCount++;
        } catch (err) {
          // If the user revoked permission or cleared their cache, the push service returns 410 (Gone) or 404.
          // We automatically delete the dead endpoint from the database to keep it clean.
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          } else {
            console.error(`Failed to send to ${sub.user.username}:`, err);
          }
        }
      });

      await Promise.all(sendPromises);

      res.json({
        success: true,
        message: `Dispatched to ${successCount} devices.`,
      });
    } catch (error) {
      console.error("Broadcast error:", error);
      res.status(500).json({ error: "Failed to broadcast message" });
    }
  },
);

module.exports = router;
