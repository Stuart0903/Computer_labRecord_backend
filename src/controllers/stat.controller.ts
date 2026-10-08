import { Request, Response, NextFunction } from 'express';
import * as statsService from "../services/stat.service.js"
import { asyncHandler } from '../utils/asyncHandler.js';

export const getStats = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const classFilter = req.query.class ? Number(req.query.class) : undefined;
  const sectionFilter = req.query.section ? String(req.query.section) : undefined;

  const stats = await statsService.getDashboardStats({
    class: classFilter,
    section: sectionFilter,
  });

  res.json(stats);
});

export const getRecentSessions = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 10;
  const sessions = await statsService.getRecentSessions(limit);
  res.json(sessions);
});