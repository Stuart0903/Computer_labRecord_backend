import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createError } from '../middleware/error.js';

const lookupSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
});

export const lookup = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsed = lookupSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Validation failed', parsed.error.flatten().fieldErrors);
  }

  const { studentId } = parsed.data;

  const student = await prisma.student.findUnique({
    where: { studentId },
    select: {
      studentId: true,
      name: true,
      class: true,
      section: true,
      rollNo: true,
    },
  });

  if (!student) {
    throw createError(404, 'Student not found');
  }

  const records = await prisma.labRecord.findMany({
    where: { studentId },
    include: {
      session: {
        select: {
          date: true,
          topic: true,
          activity: true,
          learned: true,
          materialsRequired: true,
        },
      },
    },
    orderBy: { session: { date: 'desc' } },
  });

  const formattedRecords = records.map((record) => ({
    date: record.session.date,
    topic: record.session.topic,
    activity: record.session.activity,
    learned: record.session.learned,
    materialsRequired: record.session.materialsRequired,
    attendance: record.attendance,
    taskStatus: record.taskStatus,
    materialsBrought: record.materialsBrought,
    remarks: record.remarks,
    verified: record.verified,
    marks: record.marks,
    maxMarks: record.maxMarks,
  }));

  res.json({
    student,
    records: formattedRecords,
  });
});