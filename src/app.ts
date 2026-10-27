import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/error.js";
import routes from "./routes/index.js"

export const app = express();

// Trust proxy so req.ip reflects the real client IP when behind the
// Next.js dev proxy / nginx / any reverse proxy. Required for the
// IP-keyed rate limiters in middleware/rateLimit.ts to work correctly.
//
// `true` trusts ALL upstream proxies and reads the leftmost IP in
// X-Forwarded-For. This is the safest choice for Render/Vercel where
// the exact proxy chain depth isn't fixed.
app.set('trust proxy', true);

// 1. Security & Utility Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// 3. Rate Limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(limiter);


// API routes
app.use('/api', routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler (must be last)
app.use(errorHandler);


// 4. Health Check Route
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Server is healthy" });
});

// Debug route — shows what IP the backend sees. Useful for verifying
// that `trust proxy` is correctly reading the client IP from
// X-Forwarded-For. Safe to remove after testing.
app.get("/api/debug/ip", (req: Request, res: Response) => {
  res.json({
    ip: req.ip,
    ips: (req as any).ips,
    xForwardedFor: req.headers['x-forwarded-for'] || null,
    rawRemoteAddress: req.socket.remoteAddress,
  });
});
