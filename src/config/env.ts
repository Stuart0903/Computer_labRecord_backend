// backend/src/config/env.ts
import { z } from "zod";
import dotenv from 'dotenv';

dotenv.config();


const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_NAME: z.string().default('token'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FIRST_TEACHER_USERNAME: z.string().default('admin'),
  FIRST_TEACHER_PASSWORD: z.string().default('changeme'),
  FIRST_TEACHER_NAME: z.string().default('Administrator'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();