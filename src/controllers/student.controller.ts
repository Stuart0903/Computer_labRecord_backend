import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as studentService from '../services/student.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createError } from '../middleware/error.js';
import { CLASSES, SECTIONS } from '../types/index.js';
import multer from 'multer';
import xlsx from 'xlsx';

const createStudentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  class: z.number().int().refine((c) => CLASSES.includes(c as typeof CLASSES[number]), {
    message: 'Class must be 6, 7, 8, 9, or 10',
  }),
  section: z.string().refine((s) => SECTIONS.includes(s as typeof SECTIONS[number]), {
    message: 'Section must be A, B, C, or D',
  }),
  rollNo: z.number().int().min(1).max(99),
  notes: z.string().optional(),
});

const updateStudentSchema = z.object({
  name: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
});
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const listStudents = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const classFilter = req.query.class ? Number(req.query.class) : undefined;
  const sectionFilter = req.query.section ? String(req.query.section) : undefined;
  const search = req.query.search ? String(req.query.search) : undefined;

  const students = await studentService.listStudents({
    class: classFilter,
    section: sectionFilter,
    search,
  });

  res.json(students);
});

export const createStudent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsed = createStudentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Validation failed', parsed.error.flatten().fieldErrors);
  }

  const student = await studentService.createStudent(parsed.data);
  res.status(201).json(student);
});

export const updateStudent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const id = String(req.params.id);

  const parsed = updateStudentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Validation failed', parsed.error.flatten().fieldErrors);
  }

  const sanitizedData = {
    ...parsed.data,
    notes: parsed.data.notes ?? undefined,
  };

  const student = await studentService.updateStudent(id, sanitizedData);
  res.json(student);
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const id = String(req.params.id);
  const result = await studentService.deleteStudent(id);
  res.json(result);
});

export const uploadStudents = [
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    if (!req.file) {
      throw createError(400, 'No file uploaded');
    }

    const mode = req.body.mode === 'replace' ? 'replace' : 'append';

    // Parse the file (CSV or XLSX)
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json<Record<string, unknown>>(worksheet);

    if (jsonData.length === 0) {
      throw createError(400, 'File is empty or has no valid rows');
    }

    const rows: Array<{ name: string; class: number; section: string; rollNo: number; notes?: string }> = [];
    const parseErrors: string[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const name = String(row['Student Name'] || row['Name'] || '').trim();
      const cls = Number(row['Class'] || 0);
      const section = String(row['Section'] || '').trim().toUpperCase();
      const rollNo = Number(row['Roll No'] || row['Roll'] || row['RollNo'] || 0);
      const notes = row['Notes'] ? String(row['Notes']).trim() : undefined;

      if (!name || !CLASSES.includes(cls as typeof CLASSES[number]) || !SECTIONS.includes(section as typeof SECTIONS[number]) || rollNo < 1) {
        parseErrors.push(`Row ${i + 2}: Invalid data (name="${name}", class=${cls}, section="${section}", rollNo=${rollNo})`);
        continue;
      }

      rows.push({ name, class: cls, section, rollNo, notes });
    }

    if (rows.length === 0) {
      throw createError(400, 'No valid rows found in file', { parseErrors });
    }

    const result = await studentService.bulkImportStudents(rows, mode);

    res.json({
      ...result,
      parseErrors,
    });
  }),
];