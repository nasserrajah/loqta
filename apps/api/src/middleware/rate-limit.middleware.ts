import { rateLimit } from 'express-rate-limit';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export function createSensitiveRateLimiter(max: number): ReturnType<typeof rateLimit> {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES_MS,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many attempts. Try again later.',
      },
    },
  });
}
