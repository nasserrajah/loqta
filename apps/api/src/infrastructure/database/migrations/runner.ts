import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { DatabaseClient } from '../connection/index.js';
import { nowIso } from '../../../shared/utils/date.js';

export interface RunMigrationsOptions {
  migrationsDir?: string;
}

export function resolveMigrationsDir(startDirectory = process.cwd()): string {
  let current = resolve(startDirectory);

  for (;;) {
    const candidate = join(current, 'database', 'migrations');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(current);
    if (parent === current) {
      throw new Error(`Could not locate database/migrations from ${startDirectory}`);
    }
    current = parent;
  }
}

export async function runMigrations(
  db: DatabaseClient,
  options: RunMigrationsOptions = {},
): Promise<string[]> {
  const migrationsDir = options.migrationsDir ?? resolveMigrationsDir();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = await db.all<{ version: string }>('SELECT version FROM schema_migrations');
  const applied = new Set(appliedRows.map((row) => row.version));
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  const newlyApplied: string[] = [];

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await readFile(join(migrationsDir, file), 'utf8');
    await db.transaction(async (tx) => {
      await tx.exec(sql);
      await tx.run('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
        file,
        nowIso(),
      ]);
    });

    applied.add(file);
    newlyApplied.push(file);
  }

  return newlyApplied;
}
