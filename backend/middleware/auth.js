// middleware/auth.js
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");

// Re-checking the user on every request would add a database round-trip to
// every scan. A short cache keeps deactivation/demotion responsive without
// putting the database on the hot path for every individual scan.
const USER_STATE_CACHE_TTL_MS = 15_000;
const userStateCache = new Map();

const cacheCleanupTimer = setInterval(() => {
  const now = Date.now();

  for (const [userId, entry] of userStateCache) {
    if (entry.expiresAt <= now) userStateCache.delete(userId);
  }
}, 60_000);

if (typeof cacheCleanupTimer.unref === "function") {
  cacheCleanupTimer.unref();
}

const invalidateUserAuthCache = (userId) => {
  userStateCache.delete(userId);
};

const getUserState = async (userId) => {
  const now = Date.now();
  const cached = userStateCache.get(userId);

  if (cached && cached.expiresAt > now) return cached;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { is_active: true, role: true },
  });

  const state = {
    isActive: Boolean(user?.is_active),
    role: user?.role ?? null,
    expiresAt: now + USER_STATE_CACHE_TTL_MS,
  };

  userStateCache.set(userId, state);
  return state;
};

const getHeaderToken = (req) => {
  const authHeader = req.headers["authorization"];

  if (typeof authHeader !== "string") return null;

  const [scheme, token] = authHeader.split(" ");

  if (!token || scheme.toLowerCase() !== "bearer") return null;

  return token;
};

const verifyAndLoadUser = (token, req, res, next) => {
  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedUser) => {
    if (err) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    if (!decodedUser || typeof decodedUser.id !== "string") {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    try {
      const state = await getUserState(decodedUser.id);

      if (!state.isActive) {
        invalidateUserAuthCache(decodedUser.id);
        return res
          .status(401)
          .json({ error: "This account is no longer active." });
      }

      // Use the current database role instead of the role frozen into the JWT.
      req.user = {
        ...decodedUser,
        role: state.role ?? decodedUser.role,
      };

      next();
    } catch (error) {
      console.error("Authentication state lookup failed:", error);
      return res
        .status(503)
        .json({ error: "Authentication is temporarily unavailable." });
    }
  });
};

const authenticateToken = (req, res, next) => {
  const token = getHeaderToken(req);

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  verifyAndLoadUser(token, req, res, next);
};

// EventSource cannot send custom Authorization headers. Only the SSE stream
// route may authenticate with a query-string token.
//
// SECURITY NOTE: a query-string token can be captured by reverse-proxy access
// logs, analytics or browser history. It is accepted on this route only (never
// by authenticateToken), and connection URLs are same-origin. A stronger
// design is a short-lived, stream-scoped ticket minted over an authenticated
// POST, but that requires an extra endpoint and client round-trip, so it is
// deferred until the deployment can demonstrate a concrete leak.
const authenticateStreamToken = (req, res, next) => {
  const token = getHeaderToken(req) || req.query.token;

  if (!token || typeof token !== "string") {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  verifyAndLoadUser(token, req, res, next);
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res
      .status(403)
      .json({ error: "Forbidden. Super Admin access required." });
  }
  next();
};

module.exports = {
  authenticateToken,
  authenticateStreamToken,
  requireSuperAdmin,
  invalidateUserAuthCache,
};
