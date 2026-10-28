import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as sessionService from '../services/session.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createError } from '../middleware/error.js';
import { AuthenticatedRequest } from '../types/index.js';
import { CLASSES, SECTIONS } from '../types/index.js';

const createSessionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  class: z.number().int().refine((c) => CLASSES.includes(c as typeof CLASSES[number]), {
    message: 'Class must be 6, 7, 8, 9, or 10',
  }),
  section: z.string().refine((s) => SECTIONS.includes(s as typeof SECTIONS[number]), {
    message: 'Section must be A, B, C, or D',
  }),
  topic: z.string().min(1, 'Topic is required'),
  activity: z.string().optional(),
  learned: z.string().optional(),
  materialsRequired: z.string().optional(),
});

// Edit schema — all fields optional, but at least one must be present.
// Class and section are intentionally NOT editable here.
const updateSessionSchema = z.object({
  date: z.string().min(1, 'Date is required').optional(),
  topic: z.string().min(1, 'Topic is required').optional(),
  activity: z.string().optional(),
  learned: z.string().nullable().optional(),
  materialsRequired: z.string().nullable().optional(),
}).refine((obj) => Object.keys(obj).length > 0, {
  message: 'At least one field must be provided',
});

export const listSessions = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const classFilter = req.query.class ? Number(req.query.class) : undefined;
  const sectionFilter = req.query.section ? String(req.query.section) : undefined;

  const sessions = await sessionService.listSessions({
    class: classFilter,
    section: sectionFilter,
  });

  res.json(sessions);
});

export const createSession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsed = createSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Validation failed', parsed.error.flatten().fieldErrors);
  }

  const teacherReq = req as AuthenticatedRequest;

  const session = await sessionService.createSession({
    ...parsed.data,
    teacherId: teacherReq.teacher.id,
  });

  res.status(201).json(session);
});

export const getSession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const id = String(req.params.id);
  const session = await sessionService.getSession(id);
  res.json(session);
});

export const deleteSession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const id = String(req.params.id);
  const result = await sessionService.deleteSession(id);
  res.json(result);
});

export const updateSession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const id = String(req.params.id);
  const parsed = updateSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Validation failed', parsed.error.flatten().fieldErrors);
  }
  const session = await sessionService.updateSession(id, parsed.data);
  res.json(session);
});

/**
 * GET /sessions/with-stats
 * Returns sessions with per-session stats + total count for pagination.
 * Query: class, section, search, limit (default 50), offset (default 0).
 *
 * NOTE: This route must be declared BEFORE the GET /:id route in
 * session.routes.ts, otherwise "with-stats" would be interpreted as an
 * :id parameter.
 */
export const listSessionsWithStats = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const result = await sessionService.listSessionsWithStats({
    class: req.query.class ? Number(req.query.class) : undefined,
    section: req.query.section ? String(req.query.section) : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : 50,
    offset: req.query.offset ? Number(req.query.offset) : 0,
  });
  res.json(result);
});