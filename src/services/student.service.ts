import prisma from '../lib/prisma.js';
import { generateStudentId } from '../utils/studentId.js';
import { createError } from '../middleware/error.js';
import { Prisma } from '../../generated/prisma/index.js';

export async function listStudents(filters: {
  class?: number;
  section?: string;
  search?: string;
}) {
  const where: Prisma.StudentWhereInput = {};

  if (filters.class) where.class = filters.class;
  if (filters.section) where.section = filters.section;

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { studentId: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.student.findMany({
    where,
    orderBy: [{ class: 'asc' }, { section: 'asc' }, { rollNo: 'asc' }],
  });
}

export async function createStudent(data: {
  name: string;
  class: number;
  section: string;
  rollNo: number;
  notes?: string;
}) {
  const studentId = generateStudentId(data.class, data.section, data.rollNo);

  const existing = await prisma.student.findUnique({ where: { studentId } });
  if (existing) {
    throw createError(409, `Student with ID "${studentId}" already exists`);
  }

  return prisma.student.create({
    data: {
      studentId,
      name: data.name,
      class: data.class,
      section: data.section.toUpperCase(),
      rollNo: data.rollNo,
      notes: data.notes || null,
    },
  });
}

export async function updateStudent(id: string, data: { name?: string; notes?: string }) {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw createError(404, 'Student not found');

  return prisma.student.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });
}

export async function deleteStudent(id: string) {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw createError(404, 'Student not found');

  await prisma.student.delete({ where: { id } });
  return { success: true };
}

export async function bulkImportStudents(
  rows: Array<{ name: string; class: number; section: string; rollNo: number; notes?: string }>,
  mode: 'replace' | 'append'
) {
  if (mode === 'replace') {
    await prisma.student.deleteMany({});
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      const studentId = generateStudentId(row.class, row.section, row.rollNo);

      const existing = await prisma.student.findUnique({ where: { studentId } });

      if (existing) {
        await prisma.student.update({
          where: { studentId },
          data: { name: row.name, notes: row.notes || existing.notes },
        });
        updated++;
      } else {
        await prisma.student.create({
          data: {
            studentId,
            name: row.name,
            class: row.class,
            section: row.section.toUpperCase(),
            rollNo: row.rollNo,
            notes: row.notes || null,
          },
        });
        created++;
      }
    } catch (err) {
      errors.push(`Row ${i + 1}: ${(err as Error).message}`);
    }
  }

  const totalStudents = await prisma.student.count();

  return {
    totalStudents,
    created,
    updated,
    processed: rows.length,
    errors,
  };
}