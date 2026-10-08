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
    select: { id: true, username: true, name: true },
  });

  if (!teacher) {
    throw createError(404, 'Teacher not found');
  }

  return teacher;
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