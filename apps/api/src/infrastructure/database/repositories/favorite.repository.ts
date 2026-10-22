import type { DatabaseClient } from '../connection/index.js';

export interface FavoriteRepository {
  listProductIds(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ productIds: string[]; total: number }>;
  add(userId: string, productId: string): Promise<void>;
  remove(userId: string, productId: string): Promise<boolean>;
  exists(userId: string, productId: string): Promise<boolean>;
  count(userId: string): Promise<number>;
}

export class SqliteFavoriteRepository implements FavoriteRepository {
  constructor(private readonly db: DatabaseClient) {}

  async listProductIds(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ productIds: string[]; total: number }> {
    const totalRow = await this.db.get<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM favorites f
       JOIN products p ON p.id = f.product_id AND p.is_active = 1
       JOIN categories c ON c.id = p.category_id AND c.is_active = 1
       WHERE f.user_id = ?`,
      [userId],
    );
    const rows = await this.db.all<{ product_id: string }>(
      `SELECT f.product_id
       FROM favorites f
       JOIN products p ON p.id = f.product_id AND p.is_active = 1
       JOIN categories c ON c.id = p.category_id AND c.is_active = 1
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, pageSize, (page - 1) * pageSize],
    );

    return { productIds: rows.map((row) => row.product_id), total: totalRow?.total ?? 0 };
  }

  async add(userId: string, productId: string): Promise<void> {
    await this.db.run(
      `INSERT INTO favorites (user_id, product_id) VALUES (?, ?)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [userId, productId],
    );
  }

  async remove(userId: string, productId: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM favorites WHERE user_id = ? AND product_id = ?', [
      userId,
      productId,
    ]);
    return result.changes === 1;
  }

  async exists(userId: string, productId: string): Promise<boolean> {
    const row = await this.db.get<{ user_id: string }>(
      'SELECT user_id FROM favorites WHERE user_id = ? AND product_id = ?',
      [userId, productId],
    );
    return Boolean(row);
  }

  async count(userId: string): Promise<number> {
    const row = await this.db.get<{ total: number }>(
      'SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?',
      [userId],
    );
    return row?.total ?? 0;
  }
}
