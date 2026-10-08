import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.js';
import { env } from '../config/env.js';
import { AuthenticatedRequest } from '../types/index.js';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[env.COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const payload: JwtPayload | null = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  (req as AuthenticatedRequest).teacher = { id: payload.teacherId, username: payload.username };
  next();
}