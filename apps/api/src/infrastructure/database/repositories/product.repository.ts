import type { DatabaseClient } from '../connection/index.js';
import { ConflictError } from '../../../shared/errors/index.js';
import type {
  Product,
  ProductImage,
  ProductInput,
  ProductListFilters,
  ProductRelation,
} from '../../../modules/products/product.entity.js';
import { newId } from '../../../shared/utils/crypto.js';
import { escapeLikePattern } from '../../../shared/utils/money.js';
import { isUniqueConstraintError, toBoolean } from './repository.utils.js';

interface ProductRow {
  id: string;
  category_id: string;
  brand_id: string | null;
  name: string;
  slug: string;
  description: string;
  specifications: string;
  price_cents: number;
  currency: string;
  stock_quantity: number;
  sku: string | null;
  is_active: number;
  is_featured: number;
  created_at: string;
  updated_at: string;
  category_name: string;
  category_slug: string;
  brand_name: string | null;
  brand_slug: string | null;
}

interface ProductImageRow {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: number;
  created_at: string;
}

export interface ProductListResult {
  items: Product[];
  total: number;
}

export interface ListProductsOptions {
  includeInactive?: boolean;
}

export interface ProductRepository {
  list(filters: ProductListFilters, options?: ListProductsOptions): Promise<ProductListResult>;
  findById(id: string, includeInactive?: boolean): Promise<Product | undefined>;
  findBySlug(slug: string, includeInactive?: boolean): Promise<Product | undefined>;
  findByIds(ids: string[], includeInactive?: boolean): Promise<Product[]>;
  existsBySlug(slug: string, excludeId?: string): Promise<boolean>;
  create(id: string, input: ProductInput): Promise<Product>;
  update(id: string, input: ProductInput): Promise<Product>;
  deactivate(id: string): Promise<void>;
  count(activeOnly?: boolean): Promise<number>;
  countLowStock(threshold: number): Promise<number>;
}

const SORT_CLAUSES: Record<ProductListFilters['sort'], string> = {
  newest: 'p.created_at DESC, p.id DESC',
  oldest: 'p.created_at ASC, p.id ASC',
  price_asc: 'p.price_cents ASC, p.id ASC',
  price_desc: 'p.price_cents DESC, p.id DESC',
  name_asc: 'LOWER(p.name) ASC, p.id ASC',
  name_desc: 'LOWER(p.name) DESC, p.id DESC',
};

function parseSpecifications(value: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).map(([key, item]) => [key, String(item)]));
  } catch {
    return {};
  }
}

function mapRelation(id: string, name: string, slug: string): ProductRelation {
  return { id, name, slug };
}

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    brandId: row.brand_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    specifications: parseSpecifications(row.specifications),
    priceCents: row.price_cents,
    currency: row.currency,
    stockQuantity: row.stock_quantity,
    sku: row.sku,
    isActive: toBoolean(row.is_active),
    isFeatured: toBoolean(row.is_featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: mapRelation(row.category_id, row.category_name, row.category_slug),
    brand:
      row.brand_id && row.brand_name && row.brand_slug
        ? mapRelation(row.brand_id, row.brand_name, row.brand_slug)
        : null,
    images: [],
    primaryImageUrl: null,
  };
}

function mapImage(row: ProductImageRow): ProductImage {
  return {
    id: row.id,
    productId: row.product_id,
    url: row.url,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    isPrimary: toBoolean(row.is_primary),
    createdAt: row.created_at,
  };
}

export class SqliteProductRepository implements ProductRepository {
  constructor(private readonly db: DatabaseClient) {}

  private async attachImages(products: Product[]): Promise<Product[]> {
    if (products.length === 0) return products;

    const placeholders = products.map(() => '?').join(', ');
    const rows = await this.db.all<ProductImageRow>(
      `SELECT * FROM product_images
       WHERE product_id IN (${placeholders})
       ORDER BY sort_order ASC, created_at ASC`,
      products.map((product) => product.id),
    );

    const imagesByProduct = new Map<string, ProductImage[]>();
    for (const row of rows) {
      const image = mapImage(row);
      const existing = imagesByProduct.get(image.productId) ?? [];
      existing.push(image);
      imagesByProduct.set(image.productId, existing);
    }

    return products.map((product) => {
      const images = imagesByProduct.get(product.id) ?? [];
      const primary = images.find((image) => image.isPrimary) ?? images[0];
      return { ...product, images, primaryImageUrl: primary?.url ?? null };
    });
  }

  private buildFilters(
    filters: ProductListFilters,
    includeInactive: boolean,
  ): { where: string; parameters: Array<string | number> } {
    const clauses: string[] = [];
    const parameters: Array<string | number> = [];

    if (!includeInactive) {
      clauses.push('p.is_active = 1', 'c.is_active = 1');
    }
    if (filters.search) {
      const pattern = `%${escapeLikePattern(filters.search.toLowerCase())}%`;
      clauses.push(
        `(LOWER(p.name) LIKE ? ESCAPE '\\' OR LOWER(p.description) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(p.sku, '')) LIKE ? ESCAPE '\\')`,
      );
      parameters.push(pattern, pattern, pattern);
    }
    if (filters.category) {
      clauses.push('(c.slug = ? OR c.id = ?)');
      parameters.push(filters.category, filters.category);
    }
    if (filters.brand) {
      clauses.push('(b.slug = ? OR b.id = ?)');
      parameters.push(filters.brand, filters.brand);
    }
    if (filters.minPriceCents !== undefined) {
      clauses.push('p.price_cents >= ?');
      parameters.push(filters.minPriceCents);
    }
    if (filters.maxPriceCents !== undefined) {
      clauses.push('p.price_cents <= ?');
      parameters.push(filters.maxPriceCents);
    }
    if (filters.inStock) {
      clauses.push('p.stock_quantity > 0');
    }
    if (filters.featured !== undefined) {
      clauses.push('p.is_featured = ?');
      parameters.push(filters.featured ? 1 : 0);
    }

    return {
      where: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      parameters,
    };
  }

  async list(
    filters: ProductListFilters,
    options: ListProductsOptions = {},
  ): Promise<ProductListResult> {
    const includeInactive = options.includeInactive ?? false;
    const { where, parameters } = this.buildFilters(filters, includeInactive);

    const totalRow = await this.db.get<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
       ${where}`,
      parameters,
    );

    const rows = await this.db.all<ProductRow>(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
              b.name AS brand_name, b.slug AS brand_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
       ${where}
       ORDER BY ${SORT_CLAUSES[filters.sort]}
       LIMIT ? OFFSET ?`,
      [...parameters, filters.pageSize, (filters.page - 1) * filters.pageSize],
    );

    return {
      items: await this.attachImages(rows.map(mapProductRow)),
      total: totalRow?.total ?? 0,
    };
  }

  async findById(id: string, includeInactive = true): Promise<Product | undefined> {
    const row = await this.db.get<ProductRow>(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
              b.name AS brand_name, b.slug AS brand_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
       WHERE p.id = ? ${includeInactive ? '' : 'AND p.is_active = 1 AND c.is_active = 1'}`,
      [id],
    );
    if (!row) return undefined;
    const [product] = await this.attachImages([mapProductRow(row)]);
    return product;
  }

  async findBySlug(slug: string, includeInactive = false): Promise<Product | undefined> {
    const row = await this.db.get<ProductRow>(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
              b.name AS brand_name, b.slug AS brand_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
       WHERE p.slug = ? ${includeInactive ? '' : 'AND p.is_active = 1 AND c.is_active = 1'}`,
      [slug],
    );
    if (!row) return undefined;
    const [product] = await this.attachImages([mapProductRow(row)]);
    return product;
  }

  async findByIds(ids: string[], includeInactive = false): Promise<Product[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(', ');
    const rows = await this.db.all<ProductRow>(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
              b.name AS brand_name, b.slug AS brand_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
       WHERE p.id IN (${placeholders})
       ${includeInactive ? '' : 'AND p.is_active = 1 AND c.is_active = 1'}`,
      ids,
    );
    return this.attachImages(rows.map(mapProductRow));
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const row = excludeId
      ? await this.db.get<{ id: string }>('SELECT id FROM products WHERE slug = ? AND id != ?', [
          slug,
          excludeId,
        ])
      : await this.db.get<{ id: string }>('SELECT id FROM products WHERE slug = ?', [slug]);
    return Boolean(row);
  }

  private async insertImages(
    db: DatabaseClient,
    productId: string,
    images: ProductInput['images'],
  ): Promise<void> {
    for (const image of images) {
      await db.run(
        `INSERT INTO product_images (id, product_id, url, alt_text, sort_order, is_primary)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newId(), productId, image.url, image.altText, image.sortOrder, image.isPrimary ? 1 : 0],
      );
    }
  }

  async create(id: string, input: ProductInput): Promise<Product> {
    try {
      await this.db.transaction(async (tx) => {
        await tx.run(
          `INSERT INTO products
            (id, category_id, brand_id, name, slug, description, specifications, price_cents,
             currency, stock_quantity, sku, is_active, is_featured)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            input.categoryId,
            input.brandId,
            input.name,
            input.slug,
            input.description,
            JSON.stringify(input.specifications),
            input.priceCents,
            input.currency,
            input.stockQuantity,
            input.sku,
            input.isActive ? 1 : 0,
            input.isFeatured ? 1 : 0,
          ],
        );
        await this.insertImages(tx, id, input.images);
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError('A product with this slug or SKU already exists');
      }
      throw error;
    }

    const product = await this.findById(id);
    if (!product) throw new Error('Product was not persisted');
    return product;
  }

  async update(id: string, input: ProductInput): Promise<Product> {
    try {
      await this.db.transaction(async (tx) => {
        await tx.run(
          `UPDATE products
           SET category_id = ?, brand_id = ?, name = ?, slug = ?, description = ?,
               specifications = ?, price_cents = ?, currency = ?, stock_quantity = ?, sku = ?,
               is_active = ?, is_featured = ?, updated_at = ?
           WHERE id = ?`,
          [
            input.categoryId,
            input.brandId,
            input.name,
            input.slug,
            input.description,
            JSON.stringify(input.specifications),
            input.priceCents,
            input.currency,
            input.stockQuantity,
            input.sku,
            input.isActive ? 1 : 0,
            input.isFeatured ? 1 : 0,
            new Date().toISOString(),
            id,
          ],
        );
        await tx.run('DELETE FROM product_images WHERE product_id = ?', [id]);
        await this.insertImages(tx, id, input.images);
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError('A product with this slug or SKU already exists');
      }
      throw error;
    }

    const product = await this.findById(id);
    if (!product) throw new Error('Product was not persisted');
    return product;
  }

  async deactivate(id: string): Promise<void> {
    await this.db.run('UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?', [
      new Date().toISOString(),
      id,
    ]);
  }

  async count(activeOnly = true): Promise<number> {
    const row = await this.db.get<{ total: number }>(
      `SELECT COUNT(*) AS total FROM products ${activeOnly ? 'WHERE is_active = 1' : ''}`,
    );
    return row?.total ?? 0;
  }

  async countLowStock(threshold: number): Promise<number> {
    const row = await this.db.get<{ total: number }>(
      'SELECT COUNT(*) AS total FROM products WHERE is_active = 1 AND stock_quantity <= ?',
      [threshold],
    );
    return row?.total ?? 0;
  }
}
