import type { DatabaseClient } from '../connection/index.js';
import { newId } from '../../../shared/utils/crypto.js';
import { isUniqueConstraintError } from './repository.utils.js';

interface CartRow {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CartItemRecord {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartRecord {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: CartItemRecord[];
}

export interface CartRepository {
  findByUserId(userId: string): Promise<CartRecord | undefined>;
  getOrCreate(userId: string): Promise<CartRecord>;
  findItem(cartId: string, itemId: string): Promise<CartItemRecord | undefined>;
  findItemByProduct(cartId: string, productId: string): Promise<CartItemRecord | undefined>;
  addItem(cartId: string, productId: string, quantity: number): Promise<CartItemRecord>;
  updateItemQuantity(cartId: string, itemId: string, quantity: number): Promise<CartItemRecord>;
  removeItem(cartId: string, itemId: string): Promise<boolean>;
  clear(cartId: string): Promise<void>;
}

function mapCart(row: CartRow, items: CartItemRecord[]): CartRecord {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items,
  };
}

function mapCartItem(row: CartItemRow): CartItemRecord {
  return {
    id: row.id,
    cartId: row.cart_id,
    productId: row.product_id,
    quantity: row.quantity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteCartRepository implements CartRepository {
  constructor(private readonly db: DatabaseClient) {}

  private async listItems(cartId: string): Promise<CartItemRecord[]> {
    const rows = await this.db.all<CartItemRow>(
      'SELECT * FROM cart_items WHERE cart_id = ? ORDER BY created_at ASC',
      [cartId],
    );
    return rows.map(mapCartItem);
  }

  async findByUserId(userId: string): Promise<CartRecord | undefined> {
    const row = await this.db.get<CartRow>('SELECT * FROM carts WHERE user_id = ?', [userId]);
    if (!row) return undefined;
    return mapCart(row, await this.listItems(row.id));
  }

  async getOrCreate(userId: string): Promise<CartRecord> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    const id = newId();
    const timestamp = new Date().toISOString();
    try {
      await this.db.run(
        'INSERT INTO carts (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [id, userId, timestamp, timestamp],
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const raced = await this.findByUserId(userId);
        if (raced) return raced;
      }
      throw error;
    }

    const created = await this.findByUserId(userId);
    if (!created) throw new Error('Cart was not persisted');
    return created;
  }

  async findItem(cartId: string, itemId: string): Promise<CartItemRecord | undefined> {
    const row = await this.db.get<CartItemRow>(
      'SELECT * FROM cart_items WHERE cart_id = ? AND id = ?',
      [cartId, itemId],
    );
    return row ? mapCartItem(row) : undefined;
  }

  async findItemByProduct(cartId: string, productId: string): Promise<CartItemRecord | undefined> {
    const row = await this.db.get<CartItemRow>(
      'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, productId],
    );
    return row ? mapCartItem(row) : undefined;
  }

  async addItem(cartId: string, productId: string, quantity: number): Promise<CartItemRecord> {
    const id = newId();
    await this.db.run(
      `INSERT INTO cart_items (id, cart_id, product_id, quantity, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, cartId, productId, quantity, new Date().toISOString()],
    );
    await this.db.run('UPDATE carts SET updated_at = ? WHERE id = ?', [
      new Date().toISOString(),
      cartId,
    ]);
    const item = await this.findItem(cartId, id);
    if (!item) throw new Error('Cart item was not persisted');
    return item;
  }

  async updateItemQuantity(
    cartId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartItemRecord> {
    await this.db.run(
      'UPDATE cart_items SET quantity = ?, updated_at = ? WHERE cart_id = ? AND id = ?',
      [quantity, new Date().toISOString(), cartId, itemId],
    );
    await this.db.run('UPDATE carts SET updated_at = ? WHERE id = ?', [
      new Date().toISOString(),
      cartId,
    ]);
    const item = await this.findItem(cartId, itemId);
    if (!item) throw new Error('Cart item was not persisted');
    return item;
  }

  async removeItem(cartId: string, itemId: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM cart_items WHERE cart_id = ? AND id = ?', [
      cartId,
      itemId,
    ]);
    if (result.changes > 0) {
      await this.db.run('UPDATE carts SET updated_at = ? WHERE id = ?', [
        new Date().toISOString(),
        cartId,
      ]);
    }
    return result.changes === 1;
  }

  async clear(cartId: string): Promise<void> {
    await this.db.run('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    await this.db.run('UPDATE carts SET updated_at = ? WHERE id = ?', [
      new Date().toISOString(),
      cartId,
    ]);
  }
}
