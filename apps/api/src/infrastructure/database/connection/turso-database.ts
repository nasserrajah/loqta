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
    await this.client.execute(sql);
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