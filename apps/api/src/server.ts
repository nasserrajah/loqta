import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info(`Loqta API listening on port ${env.PORT} (${env.NODE_ENV})`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(
      `Port ${env.PORT} is already in use. Stop the process using it or set PORT in apps/api/.env.`,
    );
  } else {
    logger.error({ err: error }, 'HTTP server failed');
  }

  // A server that never started cannot serve requests; fail with a non-zero exit code.
  process.exitCode = 1;
  setTimeout(() => process.exit(1), 100).unref();
});

let isShuttingDown = false;

function shutdown(signal: string): void {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received, shutting down`);
  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out; forcing exit');
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  server.close((error) => {
    clearTimeout(forceExitTimer);
    if (error) {
      logger.error({ err: error }, 'HTTP server failed to close');
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
