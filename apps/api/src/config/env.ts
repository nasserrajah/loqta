import { join } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';
import { findApiRoot } from './paths.js';

// Support running from the repository root as well as from apps/api.
loadDotenv();
loadDotenv({ path: join(findApiRoot(), '.env') });

const booleanFromEnv = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:5173')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),
    APP_URL: z.string().url().default('http://localhost:5173'),
    DATABASE_PATH: z.string().min(1).default('./data/loqta.db'),
    SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
    PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
    RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10_000).default(20),
    TRUST_PROXY: booleanFromEnv,
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production' && value.CORS_ORIGINS.includes('*')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGINS'],
        message: 'Wildcard CORS origins are not allowed in production',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return parsed.data;
}

export const env: Env = loadEnv();
