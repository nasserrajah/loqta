import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import { resolveFromApiRoot } from '../../../config/paths.js';
import { createSqliteDatabase } from '../connection/index.js';
import { runMigrations } from './runner.js';

const db = createSqliteDatabase(resolveFromApiRoot(env.DATABASE_PATH));

try {
  const applied = await runMigrations(db);
  if (applied.length === 0) {
    logger.info('Database schema is up to date');
  } else {
    logger.info({ applied }, `Applied ${applied.length} migration(s)`);
  }
} catch (error) {
  logger.error({ err: error }, 'Database migration failed');
  process.exitCode = 1;
} finally {
  await db.close();
}
