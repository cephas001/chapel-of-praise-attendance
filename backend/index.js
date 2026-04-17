require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Import the modular routers
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const eventRoutes = require("./routes/events");
const attendanceRoutes = require("./routes/attendance");
const zoneRoutes = require("./routes/zones");
const rosterRoutes = require("./routes/roster");
const notificationRoutes = require("./routes/notifications");

const app = express();

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// ==========================================
// MOUNT ROUTES
// ==========================================
app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/roster", rosterRoutes);
app.use("/api/notifications", notificationRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
