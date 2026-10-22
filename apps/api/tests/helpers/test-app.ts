import type { Express } from 'express';
import { createApp } from '../../src/app.js';
import { loadEnv, type Env } from '../../src/config/env.js';
import { createContainer, type Container } from '../../src/infrastructure/container.js';
import {
  createSqliteDatabase,
  type DatabaseClient,
} from '../../src/infrastructure/database/connection/index.js';
import { runMigrations } from '../../src/infrastructure/database/migrations/index.js';
import { seedDemoData } from '../../src/infrastructure/database/seed.js';

export interface TestContext {
  app: Express;
  db: DatabaseClient;
  container: Container;
  env: Env;
  close: () => Promise<void>;
}

export function testEnv(overrides: NodeJS.ProcessEnv = {}): Env {
  return loadEnv({
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    DATABASE_PATH: ':memory:',
    BCRYPT_ROUNDS: '4',
    RATE_LIMIT_MAX: '1000',
    CORS_ORIGINS: 'http://localhost:5173',
    ...overrides,
  });
}

export async function createTestContext(
  options: { seed?: boolean; env?: NodeJS.ProcessEnv } = {},
): Promise<TestContext> {
  const db = createSqliteDatabase(':memory:');
  await runMigrations(db);
  const env = testEnv(options.env);
  const container = createContainer({ db, env });
  if (options.seed) {
    await seedDemoData(db, container.passwordHasher);
  }
  const app = createApp(container);

  return {
    app,
    db,
    container,
    env,
    close: () => db.close(),
  };
}
