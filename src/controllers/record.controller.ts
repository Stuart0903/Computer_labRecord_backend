import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as recordService from '../services/record.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createError } from '../middleware/error.js';
import { TASK_STATUSES, VERIFIED_STATUSES, ATTENDANCE_STATUSES } from '../types/index.js';

const updateRecordSchema = z.object({
  taskStatus: z.string().refine((s) => TASK_STATUSES.includes(s as typeof TASK_STATUSES[number]), {
    message: 'Invalid task status',
  }).optional(),
    materialsBrought: z.record(z.string(), z.boolean()).optional(),
  remarks: z.string().nullable().optional(),
  verified: z.string().refine((s) => VERIFIED_STATUSES.includes(s as typeof VERIFIED_STATUSES[number]), {
    message: 'Invalid verified status',
  }).optional(),
  attendance: z.string().refine((s) => ATTENDANCE_STATUSES.includes(s as typeof ATTENDANCE_STATUSES[number]), {
    message: 'Invalid attendance status',
  }).optional(),
  marks: z.number().int().min(0).nullable().optional(),
  maxMarks: z.number().int().min(1).nullable().optional(),
});

const bulkUpdateByIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one ID is required'),
  taskStatus: z.string().refine((s) => TASK_STATUSES.includes(s as typeof TASK_STATUSES[number]), {
    message: 'Invalid task status',
  }).optional(),
  verified: z.string().refine((s) => VERIFIED_STATUSES.includes(s as typeof VERIFIED_STATUSES[number]), {
    message: 'Invalid verified status',
  }).optional(),
  attendance: z.string().refine((s) => ATTENDANCE_STATUSES.includes(s as typeof ATTENDANCE_STATUSES[number]), {
    message: 'Invalid attendance status',
  }).optional(),
});

const bulkUpdateBySessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  taskStatus: z.string().refine((s) => TASK_STATUSES.includes(s as typeof TASK_STATUSES[number]), {
    message: 'Invalid task status',
  }).optional(),
  verified: z.string().refine((s) => VERIFIED_STATUSES.includes(s as typeof VERIFIED_STATUSES[number]), {
    message: 'Invalid verified status',
  }).optional(),
  attendance: z.string().refine((s) => ATTENDANCE_STATUSES.includes(s as typeof ATTENDANCE_STATUSES[number]), {
    message: 'Invalid attendance status',
  }).optional(),
});

export const listRecords = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const filters = {
    sessionId: req.query.sessionId ? String(req.query.sessionId) : undefined,
    studentId: req.query.studentId ? String(req.query.studentId) : undefined,
    class: req.query.class ? Number(req.query.class) : undefined,
    section: req.query.section ? String(req.query.section) : undefined,
    taskStatus: req.query.taskStatus ? String(req.query.taskStatus) : undefined,
    verified: req.query.verified ? String(req.query.verified) : undefined,
    attendance: req.query.attendance ? String(req.query.attendance) : undefined,
    dateFrom: req.query.dateFrom ? String(req.query.dateFrom) : undefined,
    dateTo: req.query.dateTo ? String(req.query.dateTo) : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  };

  const records = await recordService.listRecords(filters);
  res.json(records);
});

export const updateRecord = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const id = String(req.params.id);

  const parsed = updateRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Validation failed', parsed.error.flatten().fieldErrors);
  }

  const record = await recordService.updateRecord(id, parsed.data);
  res.json(record);
});

export const bulkUpdateByIds = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsed = bulkUpdateByIdsSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Validation failed', parsed.error.flatten().fieldErrors);
  }

  const result = await recordService.bulkUpdateByIds(parsed.data.ids, parsed.data);
  res.json(result);
});

export const bulkUpdateBySession = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsed = bulkUpdateBySessionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Validation failed', parsed.error.flatten().fieldErrors);
  }

  const { sessionId, ...data } = parsed.data;
  const result = await recordService.bulkUpdateBySession(sessionId, data);
  res.json(result);
});