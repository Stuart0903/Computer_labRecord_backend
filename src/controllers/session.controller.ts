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