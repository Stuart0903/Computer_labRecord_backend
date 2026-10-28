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
        // Default to 'Not Completed' so the teacher must explicitly mark
        // each student's task status when marking attendance.
        taskStatus: 'Not Completed',
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

/**
 * Update an existing session. Only allows editing date / topic / activity /
 * learned / materialsRequired. Class and section are NOT editable —
 * changing them would orphan records (the records' studentIds belong to
 * the original class-section's students, not the new one). If you really
 * need to change class/section, delete this session and create a new one.
 *
 * Note: editing `materialsRequired` does NOT retroactively update the
 * `materialsBrought` JSON on existing records. New materials added via
 * edit will be treated as "unknown" (undefined, shown as "—") on existing
 * records until the teacher manually toggles them on the records page.
 * Removed materials will simply disappear from the table. This is
 * intentional — we don't want to silently reset student attendance flags.
 */
export async function updateSession(
  id: string,
  data: {
    date?: string;
    topic?: string;
    activity?: string;
    learned?: string | null;
    materialsRequired?: string | null;
  }
) {
  const session = await prisma.labSession.findUnique({ where: { id } });
  if (!session) throw createError(404, 'Session not found');

  const updateData: Prisma.LabSessionUpdateInput = {};
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.topic !== undefined) updateData.topic = data.topic;
  if (data.activity !== undefined) updateData.activity = data.activity;
  if (data.learned !== undefined) updateData.learned = data.learned;
  if (data.materialsRequired !== undefined) updateData.materialsRequired = data.materialsRequired;

  return prisma.labSession.update({
    where: { id },
    data: updateData,
    include: {
      teacher: { select: { id: true, name: true, username: true } },
      _count: { select: { labRecords: true } },
    },
  });
}

/**
 * List sessions with per-session stats (studentCount, presentCount,
 * verifiedCount, completedCount) and optional pagination + search.
 *
 * Used by the /sessions (Manage Sessions) frontend page.
 * The lightweight /sessions endpoint (without stats) is still used by
 * the /records filter dropdown where stats aren't needed.
 */
export async function listSessionsWithStats(filters: {
  class?: number;
  section?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  sessions: Array<{
    id: string;
    date: Date;
    class: number;
    section: string;
    topic: string;
    activity: string;
    learned: string | null;
    materialsRequired: string | null;
    teacher: { id: string; name: string; username: string };
    studentCount: number;
    presentCount: number;
    verifiedCount: number;
    completedCount: number;
  }>;
  total: number;
}> {
  const where: Prisma.LabSessionWhereInput = {};
  if (filters.class) where.class = filters.class;
  if (filters.section) where.section = filters.section;
  if (filters.search) {
    where.OR = [
      { topic: { contains: filters.search, mode: 'insensitive' } },
      { activity: { contains: filters.search, mode: 'insensitive' } },
      { learned: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const [sessions, total] = await Promise.all([
    prisma.labSession.findMany({
      where,
      include: {
        teacher: { select: { id: true, name: true, username: true } },
        labRecords: {
          select: {
            attendance: true,
            verified: true,
            taskStatus: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.labSession.count({ where }),
  ]);

  return {
    total,
    sessions: sessions.map((s) => ({
      id: s.id,
      date: s.date,
      class: s.class,
      section: s.section,
      topic: s.topic,
      activity: s.activity,
      learned: s.learned,
      materialsRequired: s.materialsRequired,
      teacher: s.teacher,
      studentCount: s.labRecords.length,
      presentCount: s.labRecords.filter((r) => r.attendance === 'Present').length,
      verifiedCount: s.labRecords.filter((r) => r.verified === 'Verified').length,
      completedCount: s.labRecords.filter((r) => r.taskStatus === 'Completed').length,
    })),
  };
}