import { httpServerHandler } from 'cloudflare:node';
import type { D1Database, ExecutionContext, ExportedHandler } from '@cloudflare/workers-types';
import { createApp } from './app.worker.js';
import { loadEnv } from './config/env.schema.js';
import { logger } from './config/logger.worker.js';
import { createContainer } from './infrastructure/container.js';
import { createD1Database } from './infrastructure/database/connection/index.js';

interface WorkerEnv {
  DB: D1Database;
  NODE_ENV?: string;
  LOG_LEVEL?: string;
  APP_URL?: string;
  CORS_ORIGINS?: string;
  TRUST_PROXY?: string;
  SESSION_TTL_DAYS?: string;
  PASSWORD_RESET_TTL_MINUTES?: string;
  BCRYPT_ROUNDS?: string;
  RATE_LIMIT_MAX?: string;
}

// httpServerHandler requires a port to associate with the internal HTTP server.
// The value is not actually bound to a TCP port inside Workers; it is only used
// as an internal key, so any stable number works.
const WORKER_PORT = 3000;

let cachedHandler: ExportedHandler | undefined;

function buildHandler(env: WorkerEnv): ExportedHandler {
  const source: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: env.NODE_ENV ?? process.env.NODE_ENV,
    LOG_LEVEL: env.LOG_LEVEL ?? process.env.LOG_LEVEL,
    APP_URL: env.APP_URL ?? process.env.APP_URL,
    CORS_ORIGINS: env.CORS_ORIGINS ?? process.env.CORS_ORIGINS,
    TRUST_PROXY: env.TRUST_PROXY ?? process.env.TRUST_PROXY,
    SESSION_TTL_DAYS: env.SESSION_TTL_DAYS ?? process.env.SESSION_TTL_DAYS,
    PASSWORD_RESET_TTL_MINUTES:
      env.PASSWORD_RESET_TTL_MINUTES ?? process.env.PASSWORD_RESET_TTL_MINUTES,
    BCRYPT_ROUNDS: env.BCRYPT_ROUNDS ?? process.env.BCRYPT_ROUNDS,
    RATE_LIMIT_MAX: env.RATE_LIMIT_MAX ?? process.env.RATE_LIMIT_MAX,
  };

  const runtimeEnv = loadEnv(source);
  const db = createD1Database(env.DB);
  const container = createContainer({ db, env: runtimeEnv, logger });
  const app = createApp(container);

  // Register the Express listener first; httpServerHandler looks it up by port.
  app.listen(WORKER_PORT);

  return httpServerHandler({ port: WORKER_PORT });
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    if (!cachedHandler) {
      cachedHandler = buildHandler(env);
    }

    const fetchHandler = cachedHandler.fetch;
    if (!fetchHandler) {
      throw new Error('httpServerHandler did not provide a fetch handler');
    }

        return fetchHandler(request as unknown as Parameters<typeof fetchHandler>[0], env, ctx);
  },
} satisfies ExportedHandler<WorkerEnv>;