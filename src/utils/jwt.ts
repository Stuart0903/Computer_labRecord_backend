import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayload {
  teacherId: string;
  username: string;
}

export function signToken(teacherId: string, username: string): string {
  return jwt.sign({ teacherId, username }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}