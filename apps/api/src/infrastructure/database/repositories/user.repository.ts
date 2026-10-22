import type { UserRole } from '../../../shared/constants/index.js';
import type { DatabaseClient } from '../connection/index.js';
import { ConflictError } from '../../../shared/errors/index.js';
import type { User } from '../../../modules/users/user.entity.js';
import { isUniqueConstraintError, toBoolean } from './repository.utils.js';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string | null;
  role?: UserRole;
}

export interface UpdateUserProfileInput {
  fullName: string;
  phone: string | null;
}

export interface ListUsersOptions {
  page: number;
  pageSize: number;
  search?: string;
}

export interface UserRepository {
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  create(input: CreateUserInput): Promise<User>;
  updateProfile(id: string, input: UpdateUserProfileInput): Promise<User | undefined>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
  updateRole(id: string, role: UserRole): Promise<User | undefined>;
  list(options: ListUsersOptions): Promise<{ items: User[]; total: number }>;
  count(): Promise<number>;
  countAdmins(): Promise<number>;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    isActive: toBoolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(id: string): Promise<User | undefined> {
    const row = await this.db.get<UserRow>('SELECT * FROM users WHERE id = ?', [id]);
    return row ? mapUser(row) : undefined;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const row = await this.db.get<UserRow>('SELECT * FROM users WHERE email = ? COLLATE NOCASE', [
      email,
    ]);
    return row ? mapUser(row) : undefined;
  }

  async create(input: CreateUserInput): Promise<User> {
    try {
      await this.db.run(
        `INSERT INTO users (id, email, password_hash, full_name, phone, role)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          input.id,
          input.email,
          input.passwordHash,
          input.fullName,
          input.phone ?? null,
          input.role ?? 'User',
        ],
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError('An account with this email already exists');
      }
      throw error;
    }

    const user = await this.findById(input.id);
    if (!user) throw new Error('User was not persisted');
    return user;
  }

  async updateProfile(id: string, input: UpdateUserProfileInput): Promise<User | undefined> {
    await this.db.run(
      `UPDATE users
       SET full_name = ?, phone = ?, updated_at = ?
       WHERE id = ?`,
      [input.fullName, input.phone, new Date().toISOString(), id],
    );
    return this.findById(id);
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [
      passwordHash,
      new Date().toISOString(),
      id,
    ]);
  }

  async updateRole(id: string, role: UserRole): Promise<User | undefined> {
    await this.db.run('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', [
      role,
      new Date().toISOString(),
      id,
    ]);
    return this.findById(id);
  }

  async list(options: ListUsersOptions): Promise<{ items: User[]; total: number }> {
    const parameters: string[] = [];
    let where = '';
    if (options.search) {
      where = 'WHERE (LOWER(email) LIKE ? OR LOWER(full_name) LIKE ?)';
      const pattern = `%${options.search.toLowerCase()}%`;
      parameters.push(pattern, pattern);
    }

    const totalRow = await this.db.get<{ total: number }>(
      `SELECT COUNT(*) AS total FROM users ${where}`,
      parameters,
    );
    const rows = await this.db.all<UserRow>(
      `SELECT * FROM users ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...parameters, options.pageSize, (options.page - 1) * options.pageSize],
    );

    return { items: rows.map(mapUser), total: totalRow?.total ?? 0 };
  }

  async count(): Promise<number> {
    const row = await this.db.get<{ total: number }>('SELECT COUNT(*) AS total FROM users');
    return row?.total ?? 0;
  }

  async countAdmins(): Promise<number> {
    const row = await this.db.get<{ total: number }>(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'Admin' AND is_active = 1",
    );
    return row?.total ?? 0;
  }
}
