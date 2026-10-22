import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Database from 'better-sqlite3';
import type { DatabaseClient, DatabaseRunResult, SqlValue } from './database-client.js';

class ScopedSqliteClient implements DatabaseClient {
  constructor(private readonly owner: SqliteDatabaseClient) {}

  all<T>(sql: string, params: readonly SqlValue[] = []): Promise<T[]> {
    return Promise.resolve(this.owner.allSync<T>(sql, params));
  }

  get<T>(sql: string, params: readonly SqlValue[] = []): Promise<T | undefined> {
    return Promise.resolve(this.owner.getSync<T>(sql, params));
  }

  run(sql: string, params: readonly SqlValue[] = []): Promise<DatabaseRunResult> {
    return Promise.resolve(this.owner.runSync(sql, params));
  }

  exec(sql: string): Promise<void> {
    this.owner.execSync(sql);
    return Promise.resolve();
  }

  transaction<T>(callback: (tx: DatabaseClient) => Promise<T>): Promise<T> {
    // Nested transactions join the transaction already opened by the owner.
    return callback(this);
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}

/**
 * Local SQLite adapter. It serializes every operation through a promise queue so
 * a transaction holds exclusive access until its callback settles. This keeps the
 * async contract deterministic while the underlying driver remains synchronous.
 */
export class SqliteDatabaseClient implements DatabaseClient {
  private readonly db: Database.Database;
  private readonly scoped: ScopedSqliteClient;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(databasePath: string) {
    const isMemory = databasePath === ':memory:';
    const resolvedPath = isMemory ? databasePath : resolve(databasePath);

    if (!isMemory) {
      mkdirSync(dirname(resolvedPath), { recursive: true });
    }

    this.db = new Database(resolvedPath);
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('busy_timeout = 5000');
    if (!isMemory) {
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = FULL');
    }

    this.scoped = new ScopedSqliteClient(this);
  }

  private enqueue<T>(operation: () => T | Promise<T>): Promise<T> {
    const result = this.queue.then(operation, operation);
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  allSync<T>(sql: string, params: readonly SqlValue[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  getSync<T>(sql: string, params: readonly SqlValue[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  runSync(sql: string, params: readonly SqlValue[] = []): DatabaseRunResult {
    const result = this.db.prepare(sql).run(...params);
    return {
      changes: result.changes,
      lastInsertRowid:
        typeof result.lastInsertRowid === 'bigint'
          ? result.lastInsertRowid.toString()
          : result.lastInsertRowid,
    };
  }

  execSync(sql: string): void {
    this.db.exec(sql);
  }

  all<T>(sql: string, params: readonly SqlValue[] = []): Promise<T[]> {
    return this.enqueue(() => this.allSync<T>(sql, params));
  }

  get<T>(sql: string, params: readonly SqlValue[] = []): Promise<T | undefined> {
    return this.enqueue(() => this.getSync<T>(sql, params));
  }

  run(sql: string, params: readonly SqlValue[] = []): Promise<DatabaseRunResult> {
    return this.enqueue(() => this.runSync(sql, params));
  }

  exec(sql: string): Promise<void> {
    return this.enqueue(() => this.execSync(sql));
  }

  transaction<T>(callback: (tx: DatabaseClient) => Promise<T>): Promise<T> {
    return this.enqueue(async () => {
      this.db.exec('BEGIN IMMEDIATE');
      try {
        const result = await callback(this.scoped);
        this.db.exec('COMMIT');
        return result;
      } catch (error) {
        try {
          this.db.exec('ROLLBACK');
        } catch {
          // The original error is more useful than a rollback failure.
        }
        throw error;
      }
    });
  }

  close(): Promise<void> {
    return this.enqueue(() => {
      this.db.close();
    });
  }
}

export function createSqliteDatabase(databasePath: string): DatabaseClient {
  return new SqliteDatabaseClient(databasePath);
}
