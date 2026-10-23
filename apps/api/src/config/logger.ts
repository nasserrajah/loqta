import { pino } from 'pino';

// Read env vars directly from process.env to avoid importing env.ts (which
// depends on node:fs via paths.ts). Workers exposes process.env when built
// with nodejs_compat_v2, so this works in both runtimes.
const level = (process.env.LOG_LEVEL as string | undefined) ?? 'info';
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level,
  redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
  ...(isDevelopment
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
});