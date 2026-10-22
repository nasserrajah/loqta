import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createSqliteDatabase,
  type DatabaseClient,
} from '../../src/infrastructure/database/connection/index.js';
import { runMigrations } from '../../src/infrastructure/database/migrations/index.js';
import { seedDemoData } from '../../src/infrastructure/database/seed.js';
import { BcryptPasswordHasher } from '../../src/infrastructure/security/index.js';

describe('database migrations and demo seed', () => {
  let db: DatabaseClient;
  const hasher = new BcryptPasswordHasher(4);

  beforeAll(() => {
    db = createSqliteDatabase(':memory:');
  });

  afterAll(async () => {
    await db.close();
  });

  it('runs migrations once and records schema versions', async () => {
    const first = await runMigrations(db);
    expect(first).toContain('0001_initial.sql');

    const second = await runMigrations(db);
    expect(second).toHaveLength(0);

    const tables = await db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    const names = tables.map((table) => table.name);
    for (const expected of [
      'users',
      'sessions',
      'categories',
      'brands',
      'products',
      'product_images',
      'favorites',
      'carts',
      'cart_items',
      'orders',
      'order_items',
    ]) {
      expect(names).toContain(expected);
    }
  });

  it('seeds demo data idempotently', async () => {
    await seedDemoData(db, hasher);
    const firstCounts = await counts(db);
    expect(firstCounts).toEqual({
      users: 2,
      categories: 9,
      brands: 14,
      products: 27,
      images: 54,
    });

    await seedDemoData(db, hasher);
    expect(await counts(db)).toEqual(firstCounts);
  });
});

async function counts(db: DatabaseClient) {
  const row = await db.get<{
    users: number;
    categories: number;
    brands: number;
    products: number;
    images: number;
  }>(`SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM categories) AS categories,
      (SELECT COUNT(*) FROM brands) AS brands,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM product_images) AS images`);
  if (!row) throw new Error('Count query returned no row');
  return row;
}
