import prisma from '../lib/prisma.js';
import { createError } from '../middleware/error.js';
import { Prisma } from "../../generated/prisma/index.js"

export async function listSessions(filters: { class?: number; section?: string }) {
  const where: Prisma.LabSessionWhereInput = {};

  if (filters.class) where.class = filters.class;
  if (filters.section) where.section = filters.section;

  return prisma.labSession.findMany({
    where,
    include: {
      teacher: { select: { id: true, name: true, username: true } },
      _count: { select: { labRecords: true } },
    },
    orderBy: { date: 'desc' },
  });
}

export async function createSession(data: {
  date: string;
  class: number;
  section: string;
  topic: string;
  activity?: string;
  learned?: string;
  materialsRequired?: string;
  teacherId: string;
}) {
  const session = await prisma.labSession.create({
    data: {
      date: new Date(data.date),
      class: data.class,
      section: data.section.toUpperCase(),
      topic: data.topic,
      activity: data.activity || '',
      learned: data.learned || null,
      materialsRequired: data.materialsRequired || null,
      teacherId: data.teacherId,
    },
  });

  const students = await prisma.student.findMany({
    where: { class: data.class, section: data.section.toUpperCase() },
    orderBy: { rollNo: 'asc' },
  });

  if (students.length > 0) {
    // Build materialsBrought object — all true by default
    let materialsBrought: Record<string, boolean> | null = null;
    if (data.materialsRequired) {
      const materials = data.materialsRequired.split(',').map(m => m.trim()).filter(m => m);
      if (materials.length > 0) {
        materialsBrought = {};
        for (const mat of materials) {
          materialsBrought[mat] = true;
        }
      }
    }

    await prisma.labRecord.createMany({
      data: students.map((student) => ({
        sessionId: session.id,
        studentId: student.studentId,
        rollNo: student.rollNo,
        taskStatus: 'Completed',
        attendance: 'Present',
        verified: 'Pending',
        materialsBrought: materialsBrought as any,
      })),
    });
  }

  return prisma.labSession.findUnique({
    where: { id: session.id },
    include: {
      labRecords: { orderBy: { rollNo: 'asc' } },
      teacher: { select: { id: true, name: true, username: true } },
    },
  });
}

export async function getSession(id: string) {
  const session = await prisma.labSession.findUnique({
    where: { id },
    include: {
      labRecords: {
        orderBy: { rollNo: 'asc' },
        include: {
          student: { select: { studentId: true, name: true, class: true, section: true, rollNo: true } },
        },
      },
      teacher: { select: { id: true, name: true, username: true } },
    },
  });

  if (!session) throw createError(404, 'Session not found');
  return session;
}

export async function deleteSession(id: string) {
  const session = await prisma.labSession.findUnique({ where: { id } });
  if (!session) throw createError(404, 'Session not found');

  await prisma.labSession.delete({ where: { id } });
  return { success: true };
}