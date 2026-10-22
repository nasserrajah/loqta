export type SqlValue = string | number | null | Uint8Array;

export interface DatabaseRunResult {
  changes: number;
  lastInsertRowid?: number | string;
}

/**
 * Async database contract shared by the local SQLite adapter and the future
 * Cloudflare D1 adapter. Repositories depend only on this interface.
 */
export interface DatabaseClient {
  all<T>(sql: string, params?: readonly SqlValue[]): Promise<T[]>;
  get<T>(sql: string, params?: readonly SqlValue[]): Promise<T | undefined>;
  run(sql: string, params?: readonly SqlValue[]): Promise<DatabaseRunResult>;
  exec(sql: string): Promise<void>;
  transaction<T>(callback: (tx: DatabaseClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
