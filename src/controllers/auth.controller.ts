import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createError } from '../middleware/error.js';
import { env } from '../config/env.js';
import { AuthenticatedRequest } from '../types/index.js';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getCookieOptions() {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  } as const;
}

function setTokenCookie(res: Response, token: string) {
  res.cookie(env.COOKIE_NAME, token, {
    ...getCookieOptions(),
    maxAge: SEVEN_DAYS_MS,
  });
}

export const login = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Validation failed', parsed.error.flatten().fieldErrors);
  }

  const { username, password } = parsed.data;
  const result = await authService.login(username, password);

  setTokenCookie(res, result.token);
  res.json({ teacher: result.teacher });
});

export const logout = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  res.clearCookie(env.COOKIE_NAME, getCookieOptions());
  res.json({ success: true });
});

export const me = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const teacherReq = req as AuthenticatedRequest;
  const teacher = await authService.getMe(teacherReq.teacher.id);
  res.json(teacher);
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const changePassword = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Validation failed', parsed.error.flatten().fieldErrors);
  }

  const teacherReq = req as AuthenticatedRequest;
  const { currentPassword, newPassword } = parsed.data;

  await authService.changePassword(teacherReq.teacher.id, currentPassword, newPassword);
  res.json({ success: true });
});