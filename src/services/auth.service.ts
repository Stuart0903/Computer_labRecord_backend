import prisma from '../lib/prisma.js';
import { comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { createError } from '../middleware/error.js';
import { hashPassword} from '../utils/password.js';

export async function login(username: string, password: string) {
  const teacher = await prisma.teacher.findUnique({ where: { username } });

  if (!teacher) {
    throw createError(401, 'Invalid username or password');
  }

  const isMatch = await comparePassword(password, teacher.passwordHash);
  if (!isMatch) {
    throw createError(401, 'Invalid username or password');
  }

  const token = signToken(teacher.id, teacher.username);

  return {
    token,
    teacher: {
      id: teacher.id,
      username: teacher.username,
      name: teacher.name,
    },
  };
}

export async function getMe(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, username: true, name: true, activeSessionId: true },
  });

  if (!teacher) {
    throw createError(404, 'Teacher not found');
  }

  return teacher;
}

/**
 * Clear the teacher's activeSessionId. Called when the teacher clicks
 * "End Session" on the frontend. The session itself is NOT deleted —
 * it remains in the database and is still visible on /sessions and /records.
 * Only the teacher's "I'm currently working on this session" flag is cleared.
 *
 * Returns the updated teacher (with activeSessionId: null) so the frontend
 * can update its state.
 */
export async function endActiveSession(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) throw createError(404, 'Teacher not found');

  return prisma.teacher.update({
    where: { id: teacherId },
    data: { activeSessionId: null },
    select: { id: true, username: true, name: true, activeSessionId: true },
  });
}

export async function changePassword(teacherId: string, currentPassword: string, newPassword: string) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) throw createError(404, 'Teacher not found');

  const isMatch = await comparePassword(currentPassword, teacher.passwordHash);
  if (!isMatch) {
    throw createError(401, 'Current password is incorrect');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.teacher.update({
    where: { id: teacherId },
    data: { passwordHash },
  });

  return { success: true };
}