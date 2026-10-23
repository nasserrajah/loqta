import type { Logger } from 'pino';

/**
 * Workers-compatible logger. Pino depends on Node.js symbols and streams that
 * are unavailable in Cloudflare Workers, so we emit structured JSON to console
 * instead. Workers Logs captures console output automatically.
 *
 * Reference: https://github.com/pinojs/pino/issues/2079
 */
const level = (process.env.LOG_LEVEL as string | undefined) ?? 'info';

function emit(levelName: string, args: unknown[]): void {
  const line = JSON.stringify({
    level: levelName,
    time: new Date().toISOString(),
    msg: args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '),
  });
  // eslint-disable-next-line no-console
  console.log(line);
}

export const logger = {
  info: (...args: unknown[]) => emit('info', args),
  error: (...args: unknown[]) => emit('error', args),
  warn: (...args: unknown[]) => emit('warn', args),
  debug: (...args: unknown[]) => emit('debug', args),
  trace: (...args: unknown[]) => emit('trace', args),
  fatal: (...args: unknown[]) => emit('fatal', args),
  child: () => logger,
} as unknown as Logger;