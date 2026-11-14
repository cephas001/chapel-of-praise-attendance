// Small in-memory rate limiter for sensitive endpoints. The app runs as a
// single Node process, so a local map is sufficient here. If the backend is
// ever scaled horizontally, replace this with a shared store (Redis, etc.).
const createRateLimiter = ({
  windowMs,
  max,
  keyGenerator,
  message = "Too many requests. Please wait and try again.",
  // When true, a request is only counted once the response fails with one of
  // failureStatuses. Successful requests neither increment nor trip the limit.
  countFailuresOnly = false,
  failureStatuses = [401],
}) => {
  const hits = new Map();

  const cleanupTimer = setInterval(() => {
    const now = Date.now();

    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, Math.max(windowMs, 60_000));

  // Do not keep the Node process alive just for cleanup.
  if (typeof cleanupTimer.unref === "function") cleanupTimer.unref();

  const recordHit = (key) => {
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    entry.count += 1;
  };

  return (req, res, next) => {
    const key = keyGenerator ? keyGenerator(req) : req.ip;

    if (!key) return next();

    const now = Date.now();
    const entry = hits.get(key);

    // An expired entry is treated as absent, so a new window starts cleanly.
    if (entry && entry.resetAt > now && entry.count >= max) {
      const retryAfter = Math.max(
        1,
        Math.ceil((entry.resetAt - now) / 1000),
      );

      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: message,
        retryAfter,
      });
    }

    if (countFailuresOnly) {
      res.on("finish", () => {
        if (failureStatuses.includes(res.statusCode)) {
          recordHit(key);
          return;
        }

        // A successful login proves the caller knows the credentials, so give
        // them a clean slate instead of leaving them one typo from a lockout.
        if (res.statusCode >= 200 && res.statusCode < 300) {
          hits.delete(key);
        }
      });

      return next();
    }

    recordHit(key);
    next();
  };
};

module.exports = { createRateLimiter };
