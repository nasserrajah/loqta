import type { DatabaseClient } from '../connection/index.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/index.js';
import type { Brand, BrandWithProductCount } from '../../../modules/brands/brand.entity.js';
import { isUniqueConstraintError, toBoolean } from './repository.utils.js';

interface BrandRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface BrandInput {
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  isActive: boolean;
}

export interface BrandRepository {
  list(includeInactive: boolean): Promise<BrandWithProductCount[]>;
  findById(id: string): Promise<Brand | undefined>;
  findBySlug(slug: string, includeInactive?: boolean): Promise<Brand | undefined>;
  existsBySlug(slug: string, excludeId?: string): Promise<boolean>;
  create(id: string, input: BrandInput): Promise<Brand>;
  update(id: string, input: BrandInput): Promise<Brand>;
  delete(id: string): Promise<void>;
  countProducts(brandId: string): Promise<number>;
  count(): Promise<number>;
}

function mapBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: row.logo_url,
    websiteUrl: row.website_url,
    isActive: toBoolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteBrandRepository implements BrandRepository {
  constructor(private readonly db: DatabaseClient) {}

  async list(includeInactive: boolean): Promise<BrandWithProductCount[]> {
    const where = includeInactive ? '' : 'WHERE b.is_active = 1';
    const rows = await this.db.all<BrandRow>(
      `SELECT b.*, COUNT(p.id) AS product_count
       FROM brands b
       LEFT JOIN products p ON p.brand_id = b.id AND p.is_active = 1
       ${where}
       GROUP BY b.id
       ORDER BY b.name ASC`,
    );
    return rows.map((row) => ({ ...mapBrand(row), productCount: row.product_count ?? 0 }));
  }

  async findById(id: string): Promise<Brand | undefined> {
    const row = await this.db.get<BrandRow>('SELECT * FROM brands WHERE id = ?', [id]);
    return row ? mapBrand(row) : undefined;
  }

  async findBySlug(slug: string, includeInactive = false): Promise<Brand | undefined> {
    const row = await this.db.get<BrandRow>(
      `SELECT * FROM brands WHERE slug = ? ${includeInactive ? '' : 'AND is_active = 1'}`,
      [slug],
    );
    return row ? mapBrand(row) : undefined;
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const row = excludeId
      ? await this.db.get<{ id: string }>('SELECT id FROM brands WHERE slug = ? AND id != ?', [
          slug,
          excludeId,
        ])
      : await this.db.get<{ id: string }>('SELECT id FROM brands WHERE slug = ?', [slug]);
    return Boolean(row);
  }

  async create(id: string, input: BrandInput): Promise<Brand> {
    try {
      await this.db.run(
        `INSERT INTO brands (id, name, slug, description, logo_url, website_url, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.name,
          input.slug,
          input.description,
          input.logoUrl,
          input.websiteUrl,
          input.isActive ? 1 : 0,
        ],
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError('A brand with this slug already exists');
      }
      throw error;
    }

    const brand = await this.findById(id);
    if (!brand) throw new Error('Brand was not persisted');
    return brand;
  }

  async update(id: string, input: BrandInput): Promise<Brand> {
    try {
      await this.db.run(
        `UPDATE brands
         SET name = ?, slug = ?, description = ?, logo_url = ?, website_url = ?, is_active = ?, updated_at = ?
         WHERE id = ?`,
        [
          input.name,
          input.slug,
          input.description,
          input.logoUrl,
          input.websiteUrl,
          input.isActive ? 1 : 0,
          new Date().toISOString(),
          id,
        ],
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError('A brand with this slug already exists');
      }
      throw error;
    }

    const brand = await this.findById(id);
    if (!brand) throw new NotFoundError('Brand not found');
    return brand;
  }

  async delete(id: string): Promise<void> {
    await this.db.run('DELETE FROM brands WHERE id = ?', [id]);
  }

  async countProducts(brandId: string): Promise<number> {
    const row = await this.db.get<{ total: number }>(
      'SELECT COUNT(*) AS total FROM products WHERE brand_id = ?',
      [brandId],
    );
    return row?.total ?? 0;
  }

  async count(): Promise<number> {
    const row = await this.db.get<{ total: number }>('SELECT COUNT(*) AS total FROM brands');
    return row?.total ?? 0;
  }
}
