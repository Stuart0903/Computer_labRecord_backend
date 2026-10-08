import { Request } from 'express';

export interface TeacherPayload {
  id: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  teacher: TeacherPayload;
}

export const TASK_STATUSES = ['Completed', 'Partially Completed', 'Not Completed', 'Not Done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const VERIFIED_STATUSES = ['Verified', 'Pending'] as const;
export type VerifiedStatus = (typeof VERIFIED_STATUSES)[number];

export const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Bunk', 'Forgot Book'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const CLASSES = [6, 7, 8, 9, 10] as const;
export type ClassNumber = (typeof CLASSES)[number];

export const SECTIONS = ['A', 'B', 'C', 'D'] as const;
export type Section = (typeof SECTIONS)[number];