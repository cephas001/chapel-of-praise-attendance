const express = require("express");
const bcrypt = require("bcrypt");
const prisma = require("../prismaClient");
const { authenticateToken, requireSuperAdmin } = require("../middleware/auth");
const paginate = require("../middleware/paginate");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

const router = express.Router();

// ==========================================
// GET ALL USERS (Paginated Table View)
// ==========================================
// Apply the paginate middleware and set the default limit to 10
router.get(
  "/",
  authenticateToken,
  requireSuperAdmin,
  paginate(10),
  async (req, res) => {
    try {
      // Destructure the clean variables from our middleware
      const { limit, skip, search, sort } = req.pagination;

      // 1. Build Model-Specific Where Clause
      const whereClause = search
        ? {
            OR: [
              { username: { contains: search, mode: "insensitive" } },
              { first_name: { contains: search, mode: "insensitive" } },
              { last_name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      // 2. Build Model-Specific Order Clause
      let orderByClause;
      if (sort === "asc") orderByClause = { username: "asc" };
      else if (sort === "desc_alpha") orderByClause = { username: "desc" };
      else orderByClause = { created_at: "desc" };

      // 3. Execute Prisma Queries
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          skip,
          take: limit, // Use 'limit' directly instead of doing math here
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            role: true,
            unit: true,
            created_at: true,
            email: true,
            avatar_url: true,
          },
          orderBy: orderByClause,
        }),
        prisma.user.count({ where: whereClause }),
      ]);

      // 4. Send the standardized response using our middleware helper
      res.sendPaginated(users, total);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  },
);

// POST /api/users
router.post("/", authenticateToken, requireSuperAdmin, async (req, res) => {
  const { username, password, role, first_name, last_name, unit, email } =
    req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email is already taken." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username: username?.toLowerCase() || null,
        password_hash: hashedPassword,
        role: role || "USHER",
        unit: unit || "USHER",
        first_name: first_name || null,
        last_name: last_name || null,
        email: email.toLowerCase(),
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        unit: newUser.unit,
        email: newUser.email,
        avatar_url: null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

// ==========================================
// GET USER DIRECTORY (For Dropdowns & Selectors)
// ==========================================
router.get(
  "/directory",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      // No pagination, no counts. Just a lightning-fast pull of the exact fields needed.
      const directory = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          unit: true,
          email: true,
          avatar_url: true,
        },
        orderBy: {
          username: "asc",
        },
      });

      res.json(directory);
    } catch (error) {
      console.error("Error fetching user directory:", error);
      res.status(500).json({ error: "Failed to fetch user directory" });
    }
  },
);

// GET /api/users/check
router.get("/check", authenticateToken, requireSuperAdmin, async (req, res) => {
  const { field, value } = req.query;

  if (!field || !value) return res.json({ available: false });

  // Security: Only allow checking specific fields to prevent DB injection
  if (!["email", "username"].includes(field)) {
    return res.status(400).json({ error: "Invalid field provided" });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { [field]: value },
    });
    res.json({ available: !existingUser });
  } catch (error) {
    console.error(`Error checking ${field}:`, error);
    res.status(500).json({ error: `Failed to check ${field}` });
  }
});

// ==========================================
// USHER HEARTBEAT (SILENT PING)
// ==========================================
router.patch("/heartbeat", authenticateToken, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { last_active: new Date() },
    });
    res.json({ success: true });
  } catch (error) {
    // We intentionally don't console.error this to avoid log spam
    res.status(500).json({ error: "Heartbeat failed" });
  }
});

// PATCH /api/users/:id
router.patch("/:id", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { role, first_name, last_name, unit, username, email } = req.body;
    if (req.user.id === req.params.id && role && role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "You cannot demote yourself." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(role && { role }),
        ...(unit && { unit }),
        ...(username && { username: username.toLowerCase() }),
        ...(email && { email: email.toLowerCase() }),
        ...(first_name !== undefined && { first_name }),
        ...(last_name !== undefined && { last_name }),
      },
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        role: true,
        unit: true,
        email: true,
        avatar_url: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE /api/users/:id
router.delete(
  "/:id",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      if (req.user.id === req.params.id) {
        return res
          .status(403)
          .json({ error: "You cannot delete your own account." });
      }
      await prisma.user.delete({ where: { id: req.params.id } });
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  },
);

// POST /api/users/profile/avatar
// Uploads a new avatar to Supabase and updates the user's record
router.post(
  "/profile/avatar",
  authenticateToken,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
      }

      const userId = req.user.id;

      // 1. SWEEP: Find and delete the old avatar
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatar_url: true },
      });

      if (currentUser && currentUser.avatar_url) {
        // Extract just the filename from the end of the Supabase URL
        const oldFileName = currentUser.avatar_url.split("/").pop();

        // Delete the orphaned file from the bucket
        const { error: deleteError } = await supabase.storage
          .from("avatars")
          .remove([oldFileName]);

        if (deleteError) {
          console.warn(
            `Failed to delete old avatar for user ${userId}:`,
            deleteError,
          );
          // We don't throw here; we still want to allow the new upload even if the cleanup fails
        }
      }

      // 2. KEEP: Upload the new avatar
      const fileExt = req.file.originalname.split(".").pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false, // We don't need upsert anymore since filenames are strictly unique
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const avatarUrl = publicUrlData.publicUrl;

      // 3. Update Prisma
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatar_url: avatarUrl },
        select: { id: true, username: true, email: true, avatar_url: true },
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Avatar upload failed:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  },
);

// DELETE /api/users/profile/avatar
// Deletes the file from Supabase and nullifies the avatar_url in Prisma
router.delete("/profile/avatar", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Find the user's current avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar_url: true },
    });

    if (!currentUser || !currentUser.avatar_url) {
      return res.status(400).json({ error: "No profile picture to remove." });
    }

    // 2. Extract the filename from the Supabase URL
    const fileName = currentUser.avatar_url.split("/").pop();

    // 3. Delete the file from the Supabase bucket
    const { error: deleteError } = await supabase.storage
      .from("avatars")
      .remove([fileName]);

    if (deleteError) {
      console.error(
        `Failed to delete avatar from bucket for user ${userId}:`,
        deleteError,
      );
      // We log the error, but we will still proceed to clear the DB just in case
      // the file was already accidentally deleted from the bucket dashboard.
    }

    // 4. Update the database to remove the URL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar_url: null },
      select: { id: true, username: true, email: true, avatar_url: true },
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Avatar deletion failed:", error);
    res.status(500).json({ error: "Failed to remove profile picture" });
  }
});

// GET /api/users/profile/stats
// Fetches the lifetime scans for the logged-in usher
router.get("/profile/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Note: Adjust 'attendanceRecord' below to match your exact Prisma model name
    // for scans (it might be 'scan' or 'attendance')
    const totalScans = await prisma.attendanceRecord.count({
      where: { usher_id: userId },
    });

    res.json({ totalScans });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    res.status(500).json({ error: "Failed to load profile statistics" });
  }
});

// PATCH /api/users/profile/password
// Securely verifies the old password and hashes the new one
router.patch("/profile/password", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Both current and new passwords are required" });
    }

    // 1. Fetch the user to get their current hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // 2. Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password_hash,
    );
    if (!isValidPassword) {
      return res.status(403).json({ error: "Incorrect current password" });
    }

    // 3. Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update the database
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: hashedNewPassword },
    });

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Password change failed:", error);
    res.status(500).json({ error: "Failed to update password" });
  }
});

module.exports = router;
