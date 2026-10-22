import type { DatabaseClient } from '../connection/index.js';
import type { PasswordResetToken, Session } from '../../../modules/auth/session.entity.js';

interface SessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: string;
  last_used_at: string;
  created_at: string;
}

interface PasswordResetTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface CreateSessionInput {
  id: string;
  userId: string;
  tokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: string;
  lastUsedAt: string;
}

export interface SessionRepository {
  create(input: CreateSessionInput): Promise<Session>;
  findByTokenHash(tokenHash: string): Promise<Session | undefined>;
  findById(id: string): Promise<Session | undefined>;
  touch(id: string, lastUsedAt: string): Promise<void>;
  deleteById(id: string): Promise<void>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  deleteByUserId(userId: string, exceptSessionId?: string): Promise<void>;
  listByUserId(userId: string): Promise<Session[]>;
  deleteExpired(now: string): Promise<number>;
}

export interface CreatePasswordResetTokenInput {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
}

export interface PasswordResetRepository {
  create(input: CreatePasswordResetTokenInput): Promise<PasswordResetToken>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | undefined>;
  markUsed(id: string, usedAt: string): Promise<boolean>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(now: string): Promise<number>;
}

function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    expiresAt: row.expires_at,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
  };
}

function mapPasswordResetToken(row: PasswordResetTokenRow): PasswordResetToken {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
  };
}

export class SqliteSessionRepository implements SessionRepository {
  constructor(private readonly db: DatabaseClient) {}

  async create(input: CreateSessionInput): Promise<Session> {
    await this.db.run(
      `INSERT INTO sessions (id, user_id, token_hash, user_agent, ip_address, expires_at, last_used_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.userId,
        input.tokenHash,
        input.userAgent,
        input.ipAddress,
        input.expiresAt,
        input.lastUsedAt,
      ],
    );

    const session = await this.findById(input.id);
    if (!session) throw new Error('Session was not persisted');
    return session;
  }

  async findByTokenHash(tokenHash: string): Promise<Session | undefined> {
    const row = await this.db.get<SessionRow>('SELECT * FROM sessions WHERE token_hash = ?', [
      tokenHash,
    ]);
    return row ? mapSession(row) : undefined;
  }

  async findById(id: string): Promise<Session | undefined> {
    const row = await this.db.get<SessionRow>('SELECT * FROM sessions WHERE id = ?', [id]);
    return row ? mapSession(row) : undefined;
  }

  async touch(id: string, lastUsedAt: string): Promise<void> {
    await this.db.run('UPDATE sessions SET last_used_at = ? WHERE id = ?', [lastUsedAt, id]);
  }

  async deleteById(id: string): Promise<void> {
    await this.db.run('DELETE FROM sessions WHERE id = ?', [id]);
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.db.run('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
  }

  async deleteByUserId(userId: string, exceptSessionId?: string): Promise<void> {
    if (exceptSessionId) {
      await this.db.run('DELETE FROM sessions WHERE user_id = ? AND id != ?', [
        userId,
        exceptSessionId,
      ]);
      return;
    }
    await this.db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);
  }

  async listByUserId(userId: string): Promise<Session[]> {
    const rows = await this.db.all<SessionRow>(
      'SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
    );
    return rows.map(mapSession);
  }

  async deleteExpired(now: string): Promise<number> {
    const result = await this.db.run('DELETE FROM sessions WHERE expires_at <= ?', [now]);
    return result.changes;
  }
}

export class SqlitePasswordResetRepository implements PasswordResetRepository {
  constructor(private readonly db: DatabaseClient) {}

  async create(input: CreatePasswordResetTokenInput): Promise<PasswordResetToken> {
    await this.db.run(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, ?)`,
      [input.id, input.userId, input.tokenHash, input.expiresAt],
    );

    const token = await this.findByTokenHash(input.tokenHash);
    if (!token) throw new Error('Password reset token was not persisted');
    return token;
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | undefined> {
    const row = await this.db.get<PasswordResetTokenRow>(
      'SELECT * FROM password_reset_tokens WHERE token_hash = ?',
      [tokenHash],
    );
    return row ? mapPasswordResetToken(row) : undefined;
  }

  async markUsed(id: string, usedAt: string): Promise<boolean> {
    const result = await this.db.run(
      'UPDATE password_reset_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL',
      [usedAt, id],
    );
    return result.changes === 1;
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db.run('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
  }

  async deleteExpired(now: string): Promise<number> {
    const result = await this.db.run('DELETE FROM password_reset_tokens WHERE expires_at <= ?', [
      now,
    ]);
    return result.changes;
  }
}
