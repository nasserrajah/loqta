import type { D1Database } from '@cloudflare/workers-types';

import type { DatabaseClient, DatabaseRunResult, SqlValue } from './database-client.js';

/**
 * Cloudflare D1 adapter. D1 exposes an async API similar to better-sqlite3,
 * so this class is a thin translation layer between D1's result shapes and
 * the DatabaseClient contract shared with the local SQLite adapter.
 *
 * Reference: https://developers.cloudflare.com/d1/worker-api/prepared-statements/
 */
export class D1DatabaseClient implements DatabaseClient {
  constructor(private readonly db: D1Database) {}

  async all<T>(sql: string, params: readonly SqlValue[] = []): Promise<T[]> {
    const { results } = await this.db.prepare(sql).bind(...params).all<T>();
    return results ?? [];
  }

  async get<T>(sql: string, params: readonly SqlValue[] = []): Promise<T | undefined> {
    const row = await this.db.prepare(sql).bind(...params).first<T>();
    return row ?? undefined;
  }

  async run(sql: string, params: readonly SqlValue[] = []): Promise<DatabaseRunResult> {
    const result = await this.db.prepare(sql).bind(...params).run();
    const changes = result.meta.changes ?? 0;
    const lastId = result.meta.last_row_id;
    return {
      changes,
      lastInsertRowid: lastId === undefined ? undefined : lastId,
    };
  }

  async exec(sql: string): Promise<void> {
    await this.db.exec(sql);
  }

  async transaction<T>(callback: (tx: DatabaseClient) => Promise<T>): Promise<T> {
    // D1 does not support interactive transactions across multiple round-trips.
    // Atomic multi-statement operations must use db.batch() or a single
    // multi-statement SQL string via exec(). We approximate the contract by
    // running the callback against the same client; callers that require strict
    // atomicity should be migrated to batch() in a future iteration.
    return callback(this);
  }

  async close(): Promise<void> {
    // D1 connections are managed by the Workers runtime; nothing to close.
  }
}

export function createD1Database(db: D1Database): DatabaseClient {
  return new D1DatabaseClient(db);
}