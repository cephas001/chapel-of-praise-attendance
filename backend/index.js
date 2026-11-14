require("dotenv").config();
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const compression = require("compression");

// Import the modular routers
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const eventRoutes = require("./routes/events");
const attendanceRoutes = require("./routes/attendance");
const zoneRoutes = require("./routes/zones");
const rosterRoutes = require("./routes/roster");
const messageRoutes = require("./routes/messages")

const app = express();

// The app is deployed behind a single reverse proxy (Render/Fly/nginx). Trust
// exactly one hop so req.ip is the client address, not the proxy's, which is
// what the login limiter keys on. Set TRUST_PROXY=0 when running directly
// exposed without a proxy.
app.set("trust proxy", process.env.TRUST_PROXY === "0" ? false : 1);

// Express generates ETags globally by default. Disable that so ETags are only
// issued for the explicitly cacheable read-only endpoints below.
app.set("etag", false);

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  maxAge: 86400, // Cache CORS preflight responses for 24 hours.
};

const compressionFilter = (req, res) => {
  const contentType = res.getHeader("Content-Type");

  // Never compress SSE. Compression buffers the stream and breaks live updates.
  if (
    req.path === "/api/messages/stream" ||
    (typeof contentType === "string" &&
      contentType.includes("text/event-stream")) ||
    (req.headers.accept && req.headers.accept.includes("text/event-stream"))
  ) {
    return false;
  }

  return compression.filter(req, res);
};

const READ_ONLY_CACHE_MAX_AGE = 30;
const READ_ONLY_CACHE_PATHS = [
  /^\/api\/events\/active\/?$/i,
  /^\/api\/roster\/[^/]+\/my-duty\/?$/i,
];
const NO_CACHE_PATHS = [
  /^\/api\/events\/[^/]+\/status\/?$/i,
  /^\/api\/messages\/my-inbox\/?$/i,
  /^\/api\/messages\/unread-count\/?$/i,
  // The admin roster is mutated by publish and must never be served stale.
  /^\/api\/roster\/[^/]+\/?$/i,
];

const readOnlyCache = (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();

  const path = req.path;

  // Dynamic status and inbox data must never be cached.
  if (NO_CACHE_PATHS.some((pattern) => pattern.test(path))) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return next();
  }

  if (!READ_ONLY_CACHE_PATHS.some((pattern) => pattern.test(path))) {
    return next();
  }

  const originalSend = res.send;

  res.send = function sendWithCacheHeaders(body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      res.setHeader(
        "Cache-Control",
        `private, max-age=${READ_ONLY_CACHE_MAX_AGE}`,
      );
      // Never reuse a private API response across different sessions on the
      // same device.
      res.vary("Authorization");

      if (
        !res.getHeader("ETag") &&
        (typeof body === "string" || Buffer.isBuffer(body))
      ) {
        const hash = crypto.createHash("sha1").update(body).digest("base64");
        res.setHeader("ETag", `"${hash}"`);
      }
    } else {
      res.setHeader("Cache-Control", "no-store");
    }

    return originalSend.call(this, body);
  };

  next();
};

app.use(cors(corsOptions));
app.use(compression({ filter: compressionFilter }));
app.use(express.json());
app.use(readOnlyCache);

// ==========================================
// MOUNT ROUTES
// ==========================================
app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/roster", rosterRoutes);
app.use("/api/messages", messageRoutes)

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
