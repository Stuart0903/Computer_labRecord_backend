import prisma from '../lib/prisma';
import { createError } from '../middleware/error.js';
import { Prisma } from '../../generated/prisma/index.js';

export async function listRecords(filters: {
  sessionId?: string;
  studentId?: string;
  class?: number;
  section?: string;
  taskStatus?: string;
  verified?: string;
  attendance?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
}) {
  const where: Prisma.LabRecordWhereInput = {};

  if (filters.sessionId) where.sessionId = filters.sessionId;
  if (filters.studentId) where.studentId = filters.studentId;
  if (filters.taskStatus) where.taskStatus = filters.taskStatus;
  if (filters.verified) where.verified = filters.verified;
  if (filters.attendance) where.attendance = filters.attendance;

  const sessionFilter: Prisma.LabSessionWhereInput = {};
  if (filters.class) sessionFilter.class = filters.class;
  if (filters.section) sessionFilter.section = filters.section;
  if (filters.dateFrom || filters.dateTo) {
    sessionFilter.date = {};
    if (filters.dateFrom) sessionFilter.date.gte = new Date(filters.dateFrom);
    if (filters.dateTo) sessionFilter.date.lte = new Date(filters.dateTo);
  }
  if (Object.keys(sessionFilter).length > 0) {
    where.session = sessionFilter;
  }

  if (filters.search) {
    where.OR = [
      { student: { name: { contains: filters.search, mode: 'insensitive' } } },
      { studentId: { contains: filters.search, mode: 'insensitive' } },
      { remarks: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const limit = filters.limit || 200;

  return prisma.labRecord.findMany({
    where,
    include: {
      student: { select: { studentId: true, name: true, class: true, section: true, rollNo: true } },
      session: { select: { id: true, date: true, topic: true, activity: true, learned: true, materialsRequired: true, class: true, section: true } },
    },
    orderBy: [
      { session: { date: 'desc' } },
      { rollNo: 'asc' },
    ],
    take: limit,
  });
}

export async function updateRecord(
  id: string,
  data: {
    taskStatus?: string;
    materialsBrought?: Record<string, boolean>;
    remarks?: string | null;
    verified?: string;
    attendance?: string;
    marks?: number | null;
    maxMarks?: number | null;
  }
) {
  const record = await prisma.labRecord.findUnique({ where: { id } });
  if (!record) throw createError(404, 'Record not found');

  return prisma.labRecord.update({
    where: { id },
    data: {
      ...(data.taskStatus !== undefined && { taskStatus: data.taskStatus }),
      ...(data.materialsBrought !== undefined && { materialsBrought: data.materialsBrought as any }),
      ...(data.remarks !== undefined && { remarks: data.remarks }),
      ...(data.verified !== undefined && { verified: data.verified }),
      ...(data.attendance !== undefined && { attendance: data.attendance }),
      ...(data.marks !== undefined && { marks: data.marks }),
      ...(data.maxMarks !== undefined && { maxMarks: data.maxMarks }),
    },
  });
}

export async function bulkUpdateByIds(
  ids: string[],
  data: {
    taskStatus?: string;
    verified?: string;
    attendance?: string;
  }
) {
  const updateData: Prisma.LabRecordUpdateManyMutationInput = {};
  if (data.taskStatus !== undefined) updateData.taskStatus = data.taskStatus;
  if (data.verified !== undefined) updateData.verified = data.verified;
  if (data.attendance !== undefined) updateData.attendance = data.attendance;

  const result = await prisma.labRecord.updateMany({
    where: { id: { in: ids } },
    data: updateData,
  });

  return { updated: result.count };
}

export async function bulkUpdateBySession(
  sessionId: string,
  data: {
    taskStatus?: string;
    verified?: string;
    attendance?: string;
  }
) {
  const session = await prisma.labSession.findUnique({ where: { id: sessionId } });
  if (!session) throw createError(404, 'Session not found');

  const updateData: Prisma.LabRecordUpdateManyMutationInput = {};
  if (data.taskStatus !== undefined) updateData.taskStatus = data.taskStatus;
  if (data.verified !== undefined) updateData.verified = data.verified;
  if (data.attendance !== undefined) updateData.attendance = data.attendance;

  const result = await prisma.labRecord.updateMany({
    where: { sessionId },
    data: updateData,
  });

  return { updated: result.count };
}