import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[${new Date().toISOString()}] ${statusCode} ${message}`);

  if (env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const response: Record<string, unknown> = {
    error: message,
  };

  if (err.details !== undefined) {
    response.details = err.details;
  }

  if (env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

export function createError(statusCode: number, message: string, details?: unknown): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}