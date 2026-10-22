import { env } from '../../apps/api/src/config/env.js';
import { logger } from '../../apps/api/src/config/logger.js';
import { resolveFromApiRoot } from '../../apps/api/src/config/paths.js';
import { createSqliteDatabase } from '../../apps/api/src/infrastructure/database/connection/index.js';
import { runMigrations } from '../../apps/api/src/infrastructure/database/migrations/index.js';
import { seedDemoData } from '../../apps/api/src/infrastructure/database/seed.js';
import { BcryptPasswordHasher } from '../../apps/api/src/infrastructure/security/index.js';

const db = createSqliteDatabase(resolveFromApiRoot(env.DATABASE_PATH));

try {
  await runMigrations(db);
  const result = await seedDemoData(db, new BcryptPasswordHasher(env.BCRYPT_ROUNDS));
  logger.info({ result }, 'Demo data is ready');
  logger.info('Admin login: admin@loqta.dev / Admin123!');
  logger.info('Customer login: user@loqta.dev / User123!');
} catch (error) {
  logger.error({ err: error }, 'Database seed failed');
  process.exitCode = 1;
} finally {
  await db.close();
}
