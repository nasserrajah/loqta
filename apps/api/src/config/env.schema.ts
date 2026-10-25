import { z } from 'zod';

const booleanFromEnv = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

export const envSchema = z
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
    // Resend — used to send transactional emails (password reset, etc.)
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(3).default('Loqta <onboarding@resend.dev>'),
    // Turso Database Variables (Optional for local SQLite, required for Render production)
    TURSO_DATABASE_URL: z.string().url().optional(),
    TURSO_AUTH_TOKEN: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    // Note: Disabled temporarily to allow "*" during initial Render deployment.
    // Re-enable this when the frontend domain is finalized.
    /*
    if (value.NODE_ENV === 'production' && value.CORS_ORIGINS.includes('*')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGINS'],
        message: 'Wildcard CORS origins are not allowed in production',
      });
    }
    */
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