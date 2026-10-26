import rateLimit, { Options } from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate-limiting middleware for sensitive public endpoints.
 *
 * Two limiters are exported:
 *   - `loginRateLimiter`   → applied to POST /api/auth/login
 *   - `lookupRateLimiter`  → applied to POST /api/parent/lookup
 *
 * Both use IP as the key (good enough for a school computer lab where
 * a small set of public IPs share the network). For higher security
 * you could later swap in a Redis store (see comment at the bottom).
 *
 *  ⚠️ Note: behind a reverse proxy (nginx, Cloudflare, etc.) you MUST
 *  set `app.set('trust proxy', 1)` (or appropriate depth) in app.ts,
 *  otherwise req.ip will be the proxy IP and ALL traffic will share
 *  one bucket. The frontend dev server in this project proxies
 *  /api → backend, so trust proxy is already required.
 *
 *  ── IMPORTANT DESIGN CHOICE: skipSuccessfulRequests = true ──
 *  Both limiters ONLY count FAILED requests toward the budget.
 *  This means:
 *    • A user who logs in successfully and then browses the dashboard
 *      will NOT burn their rate-limit budget, even if the frontend
 *      accidentally re-fires /auth/login while they're already logged
 *      in (e.g. due to a 401 retry loop, a stale form resubmission, etc).
 *    • A parent who looks up the same child several times legitimately
 *      won't get blocked.
 *    • An attacker still has to spend one failed attempt per try, so
 *      brute-force / enumeration protection is preserved.
 */

interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

/**
 * Shared handler that responds with a 429 and the standard
 * `Retry-After` header (seconds). Keeps the response shape
 * consistent with the rest of the API: `{ error, retryAfterSec }`.
 */
function makeHandler(prefix: string) {
  return (req: Request, res: Response<any, Record<string, unknown>>, next: (err?: unknown) => void, options: Options) => {
    const retryAfterSec = Math.ceil(options.windowMs / 1000);
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(429).json({
      error: `${prefix} Too many attempts. Please try again after ${retryAfterSec} seconds.`,
      retryAfterSec,
      retryAfterMs: options.windowMs,
    });
  };
}

/**
 * Skip function for the login limiter: do NOT rate-limit a request
 * that is already authenticated (carries a valid JWT cookie). This
 * handles the case where a logged-in user accidentally hits
 * /api/auth/login again — we let it through without counting.
 *
 * (We don't need this for the lookup limiter because /lookup is
 * always public; there's no "already authenticated" case to skip.)
 */
import { verifyToken } from '../utils/jwt.js';
import { env } from '../config/env.js';

function isAlreadyAuthenticated(req: Request): boolean {
  // cookie-parser is attached in app.ts, so req.cookies is populated.
  const token = (req as any).cookies?.[env.COOKIE_NAME];
  if (!token) return false;
  return verifyToken(token) !== null;
}

/**
 * POST /api/auth/login
 *   - 5 FAILED attempts per 15 minutes per IP.
 *   - Successful logins do NOT count (skipSuccessfulRequests: true).
 *   - Requests that already carry a valid session cookie are skipped
 *     entirely (skip: isAlreadyAuthenticated) — so even if the frontend
 *     re-fires /auth/login while the user is logged in, it doesn't burn
 *     the budget.
 *   - This fixes the previous bug where browsing the dashboard would
 *     slowly exhaust the login budget and trigger a 429.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  skipSuccessfulRequests: true, // ← key fix: success doesn't count
  skip: (req) => isAlreadyAuthenticated(req), // ← key fix: skip if already logged in
  handler: makeHandler('Login:'),
});

/**
 * POST /api/parent/lookup
 *   - 10 FAILED attempts per 10 minutes per IP.
 *   - Successful lookups do NOT count (skipSuccessfulRequests: true).
 *     A parent legitimately looking up the same child several times
 *     will not be blocked. An attacker probing IDs will still spend
 *     one failed attempt per non-existent ID, so the 10-attempt
 *     budget still protects against enumeration.
 */
export const lookupRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  skipSuccessfulRequests: true, // ← key fix: success doesn't count
  handler: makeHandler('Lookup:'),
});

/**
 * Generic API limiter — applies to ALL /api/* routes when wired in app.ts.
 * Kept commented out in app.ts as it was originally; uncomment to enable
 * a global 100 req / 15 min ceiling across the whole API surface.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
});

/* ----------------------------------------------------------------------------
   OPTIONAL: switch to a Redis store for multi-instance deployments.
   Uninstall express-rate-limit's default in-memory store and use:

     import RedisStore from 'rate-limit-redis';
     import { createClient } from 'redis';

     const redisClient = createClient({ url: process.env.REDIS_URL });
     await redisClient.connect();

     const store = new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) });

   Then pass `store` into each rateLimit({ ... }) call above.
---------------------------------------------------------------------------- */
