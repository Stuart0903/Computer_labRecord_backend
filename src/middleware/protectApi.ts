import { Request, Response, NextFunction } from 'express';
import { requireAuth } from './auth.js';

/** Routes that must stay public (no session cookie required). */
function isPublicApiRoute(req: Request): boolean {
  const method = req.method.toUpperCase();
  const path = req.path;

  if (method === 'POST' && path === '/auth/login') return true;
  if (method === 'POST' && path === '/auth/logout') return true;
  if (method === 'POST' && path === '/parent/lookup') return true;

  return false;
}

/**
 * Applies auth to all /api routes except login, logout, and parent lookup.
 * Mount on the main API router before route modules.
 */
export function protectApiRoutes(req: Request, res: Response, next: NextFunction): void {
  if (isPublicApiRoute(req)) {
    next();
    return;
  }
  requireAuth(req, res, next);
}
