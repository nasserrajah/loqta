import { createClient, type Client } from '@libsql/client';
import type { DatabaseClient, DatabaseRunResult, SqlValue } from './database-client.js';

export class TursoDatabaseClient implements DatabaseClient {
  private client: Client;

  constructor(url: string, authToken: string) {
    this.client = createClient({ url, authToken });
  }

  async all<T>(sql: string, params: readonly SqlValue[] = []): Promise<T[]> {
    const result = await this.client.execute({ sql, args: [...params] });
    return result.rows as T[];
  }

  async get<T>(sql: string, params: readonly SqlValue[] = []): Promise<T | undefined> {
    const result = await this.client.execute({ sql, args: [...params] });
    return result.rows[0] as T | undefined;
  }

  async run(sql: string, params: readonly SqlValue[] = []): Promise<DatabaseRunResult> {
    const result = await this.client.execute({ sql, args: [...params] });
    return {
      changes: result.rowsAffected,
      lastInsertRowid: Number(result.lastInsertRowid),
    };
  }

  async exec(sql: string): Promise<void> {
    // Turso's HTTP client does not support executing multiple statements in a
    // single execute() call. Split the SQL text into individual statements and
    // run them sequentially. This is sufficient for our migrations, which are
    // plain CREATE TABLE / CREATE INDEX statements.
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--') && s !== 'PRAGMA foreign_keys = ON');

    for (const statement of statements) {
      await this.client.execute(statement);
    }
  }

  async transaction<T>(callback: (tx: DatabaseClient) => Promise<T>): Promise<T> {
    return callback(this);
  }

  async close(): Promise<void> {
    this.client.close();
  }
}

export function createTursoDatabase(url: string, authToken: string): DatabaseClient {
  return new TursoDatabaseClient(url, authToken);
}