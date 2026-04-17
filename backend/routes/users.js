const express = require("express");
const bcrypt = require("bcrypt");
const prisma = require("../prismaClient");
const { authenticateToken, requireSuperAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/users
router.get("/", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const sort = req.query.sort || "desc";

    const whereClause = search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { first_name: { contains: search, mode: "insensitive" } },
            { last_name: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    let orderByClause;
    if (sort === "asc") orderByClause = { username: "asc" };
    else if (sort === "desc_alpha") orderByClause = { username: "desc" };
    else orderByClause = { created_at: "desc" };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          first_name: true,
          last_name: true,
          role: true,
          unit: true,
          created_at: true,
        },
        orderBy: orderByClause,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.json({
      users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /api/users
router.post("/", authenticateToken, requireSuperAdmin, async (req, res) => {
  const { username, password, role, first_name, last_name, unit } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser)
      return res.status(400).json({ message: "Username is already taken." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        password_hash: hashedPassword,
        role: role || "USHER",
        unit: unit || "USHER",
        first_name: first_name || null,
        last_name: last_name || null,
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
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

// GET /api/users/check
router.get("/check", authenticateToken, requireSuperAdmin, async (req, res) => {
  const { username } = req.query;
  if (!username) return res.json({ available: false });

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    res.json({ available: !existingUser });
  } catch (error) {
    console.error("Error checking username:", error);
    res.status(500).json({ error: "Failed to check username" });
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
    const { role, first_name, last_name, unit } = req.body;
    if (req.user.id === req.params.id && role && role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "You cannot demote yourself." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(role && { role }),
        ...(unit && { unit }),
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

module.exports = router;
