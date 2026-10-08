import prisma from '../lib/prisma.js';
import { Prisma } from '../../generated/prisma/index.js';

export async function getDashboardStats(filters: { class?: number; section?: string }) {
  const studentWhere: Prisma.StudentWhereInput = {};
  if (filters.class) studentWhere.class = filters.class;
  if (filters.section) studentWhere.section = filters.section;

  const sessionWhere: Prisma.LabSessionWhereInput = {};
  if (filters.class) sessionWhere.class = filters.class;
  if (filters.section) sessionWhere.section = filters.section;

  const recordWhere: Prisma.LabRecordWhereInput = {};
  if (filters.class || filters.section) {
    const sessionFilter: Prisma.LabSessionWhereInput = {};
    if (filters.class) sessionFilter.class = filters.class;
    if (filters.section) sessionFilter.section = filters.section;
    recordWhere.session = sessionFilter;
  }

  const [
    totalStudents,
    totalSessions,
    totalRecords,
    completed,
    partial,
    notCompleted,
    notDone,
    verified,
    pending,
    present,
    absent,
    bunk,
    forgotBook,
  ] = await Promise.all([
    prisma.student.count({ where: studentWhere }),
    prisma.labSession.count({ where: sessionWhere }),
    prisma.labRecord.count({ where: recordWhere }),
    prisma.labRecord.count({ where: { ...recordWhere, taskStatus: 'Completed' } }),
    prisma.labRecord.count({ where: { ...recordWhere, taskStatus: 'Partially Completed' } }),
    prisma.labRecord.count({ where: { ...recordWhere, taskStatus: 'Not Completed' } }),
    prisma.labRecord.count({ where: { ...recordWhere, taskStatus: 'Not Done' } }),
    prisma.labRecord.count({ where: { ...recordWhere, verified: 'Verified' } }),
    prisma.labRecord.count({ where: { ...recordWhere, verified: 'Pending' } }),
    prisma.labRecord.count({ where: { ...recordWhere, attendance: 'Present' } }),
    prisma.labRecord.count({ where: { ...recordWhere, attendance: 'Absent' } }),
    prisma.labRecord.count({ where: { ...recordWhere, attendance: 'Bunk' } }),
    prisma.labRecord.count({ where: { ...recordWhere, attendance: 'Forgot Book' } }),
  ]);

  // Count records where any material was forgotten
  const allRecords = await prisma.labRecord.findMany({
    where: recordWhere,
    select: { materialsBrought: true },
  });
  let forgotMaterial = 0;
  for (const r of allRecords) {
    if (r.materialsBrought && typeof r.materialsBrought === 'object') {
      const mb = r.materialsBrought as Record<string, boolean>;
      if (Object.values(mb).some(v => v === false)) forgotMaterial++;
    }
  }

  const completionRate = totalRecords > 0 ? Math.round((completed / totalRecords) * 100) : 0;
  const attendanceRate = totalRecords > 0 ? Math.round((present / totalRecords) * 100) : 0;

  return {
    totalStudents,
    totalSessions,
    totalRecords,
    completed,
    partial,
    notCompleted,
    notDone,
    forgotMaterial,
    verified,
    pending,
    present,
    absent,
    bunk,
    forgotBook,
    completionRate,
    attendanceRate,
  };
}

export async function getRecentSessions(limit: number = 10) {
  const sessions = await prisma.labSession.findMany({
    take: limit,
    orderBy: { date: 'desc' },
    include: {
      teacher: { select: { id: true, name: true } },
      labRecords: true,
    },
  });

  return sessions.map((session) => {
    const studentCount = session.labRecords.length;
    const completed = session.labRecords.filter((r) => r.taskStatus === 'Completed').length;
    const present = session.labRecords.filter((r) => r.attendance === 'Present').length;
    const completionRate = studentCount > 0 ? Math.round((completed / studentCount) * 100) : 0;
    const attendanceRate = studentCount > 0 ? Math.round((present / studentCount) * 100) : 0;

    // Count students who forgot any material
    let forgotMaterial = 0;
    for (const r of session.labRecords) {
      if (r.materialsBrought && typeof r.materialsBrought === 'object') {
        const mb = r.materialsBrought as Record<string, boolean>;
        if (Object.values(mb).some(v => v === false)) forgotMaterial++;
      }
    }

    return {
      id: session.id,
      date: session.date,
      class: session.class,
      section: session.section,
      topic: session.topic,
      activity: session.activity,
      learned: session.learned,
      materialsRequired: session.materialsRequired,
      teacher: session.teacher,
      studentCount,
      completed,
      present,
      forgotMaterial,
      completionRate,
      attendanceRate,
    };
  });
}