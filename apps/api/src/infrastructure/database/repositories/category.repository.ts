import type { DatabaseClient } from '../connection/index.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/index.js';
import type {
  Category,
  CategoryWithProductCount,
} from '../../../modules/categories/category.entity.js';
import { isUniqueConstraintError, toBoolean } from './repository.utils.js';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface CategoryRepository {
  list(includeInactive: boolean): Promise<CategoryWithProductCount[]>;
  findById(id: string): Promise<Category | undefined>;
  findBySlug(slug: string, includeInactive?: boolean): Promise<Category | undefined>;
  existsBySlug(slug: string, excludeId?: string): Promise<boolean>;
  create(id: string, input: CategoryInput): Promise<Category>;
  update(id: string, input: CategoryInput): Promise<Category>;
  delete(id: string): Promise<void>;
  countProducts(categoryId: string): Promise<number>;
  count(): Promise<number>;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    isActive: toBoolean(row.is_active),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCategoryWithCount(row: CategoryRow): CategoryWithProductCount {
  return { ...mapCategory(row), productCount: row.product_count ?? 0 };
}

export class SqliteCategoryRepository implements CategoryRepository {
  constructor(private readonly db: DatabaseClient) {}

  async list(includeInactive: boolean): Promise<CategoryWithProductCount[]> {
    const where = includeInactive ? '' : 'WHERE c.is_active = 1';
    const rows = await this.db.all<CategoryRow>(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
       ${where}
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.name ASC`,
    );
    return rows.map(mapCategoryWithCount);
  }

  async findById(id: string): Promise<Category | undefined> {
    const row = await this.db.get<CategoryRow>('SELECT * FROM categories WHERE id = ?', [id]);
    return row ? mapCategory(row) : undefined;
  }

  async findBySlug(slug: string, includeInactive = false): Promise<Category | undefined> {
    const row = await this.db.get<CategoryRow>(
      `SELECT * FROM categories WHERE slug = ? ${includeInactive ? '' : 'AND is_active = 1'}`,
      [slug],
    );
    return row ? mapCategory(row) : undefined;
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const row = excludeId
      ? await this.db.get<{ id: string }>('SELECT id FROM categories WHERE slug = ? AND id != ?', [
          slug,
          excludeId,
        ])
      : await this.db.get<{ id: string }>('SELECT id FROM categories WHERE slug = ?', [slug]);
    return Boolean(row);
  }

  async create(id: string, input: CategoryInput): Promise<Category> {
    try {
      await this.db.run(
        `INSERT INTO categories (id, name, slug, description, image_url, is_active, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.name,
          input.slug,
          input.description,
          input.imageUrl,
          input.isActive ? 1 : 0,
          input.sortOrder,
        ],
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError('A category with this slug already exists');
      }
      throw error;
    }

    const category = await this.findById(id);
    if (!category) throw new Error('Category was not persisted');
    return category;
  }

  async update(id: string, input: CategoryInput): Promise<Category> {
    try {
      await this.db.run(
        `UPDATE categories
         SET name = ?, slug = ?, description = ?, image_url = ?, is_active = ?, sort_order = ?, updated_at = ?
         WHERE id = ?`,
        [
          input.name,
          input.slug,
          input.description,
          input.imageUrl,
          input.isActive ? 1 : 0,
          input.sortOrder,
          new Date().toISOString(),
          id,
        ],
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError('A category with this slug already exists');
      }
      throw error;
    }

    const category = await this.findById(id);
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  async delete(id: string): Promise<void> {
    await this.db.run('DELETE FROM categories WHERE id = ?', [id]);
  }

  async countProducts(categoryId: string): Promise<number> {
    const row = await this.db.get<{ total: number }>(
      'SELECT COUNT(*) AS total FROM products WHERE category_id = ?',
      [categoryId],
    );
    return row?.total ?? 0;
  }

  async count(): Promise<number> {
    const row = await this.db.get<{ total: number }>('SELECT COUNT(*) AS total FROM categories');
    return row?.total ?? 0;
  }
}
