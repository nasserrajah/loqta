import type {
  BrandRepository,
  CategoryRepository,
  ProductRepository,
} from '../../infrastructure/database/repositories/index.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
import { newId } from '../../shared/utils/crypto.js';
import { buildPaginationMeta, type PaginationMeta } from '../../shared/utils/pagination.js';
import { slugify } from '../../shared/utils/slug.js';
import { toCents } from '../../shared/utils/money.js';
import { toProductDto, type ProductDto } from './product.dto.js';
import type { ProductInput } from './product.entity.js';
import {
  normalizeImages,
  productCurrency,
  productListFilters,
  type CreateProductInput,
  type ProductListQuery,
  type UpdateProductInput,
} from './product.schemas.js';

export interface ProductListResultDto {
  items: ProductDto[];
  meta: PaginationMeta;
}

export class ProductsService {
  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
    private readonly brands: BrandRepository,
  ) {}

  private async requireCategory(categoryId: string): Promise<void> {
    const category = await this.categories.findById(categoryId);
    if (!category) throw new NotFoundError('Category not found');
  }

  private async requireBrand(brandId: string | null): Promise<void> {
    if (!brandId) return;
    const brand = await this.brands.findById(brandId);
    if (!brand) throw new NotFoundError('Brand not found');
  }

  private async list(
    query: ProductListQuery,
    includeInactive: boolean,
  ): Promise<ProductListResultDto> {
    const filters = productListFilters(query);
    const result = await this.products.list(filters, { includeInactive });
    return {
      items: result.items.map(toProductDto),
      meta: buildPaginationMeta(result.total, filters.page, filters.pageSize),
    };
  }

  listPublic(query: ProductListQuery): Promise<ProductListResultDto> {
    return this.list(query, false);
  }

  listAdmin(query: ProductListQuery): Promise<ProductListResultDto> {
    return this.list(query, true);
  }

  async getBySlug(slug: string): Promise<ProductDto> {
    const product = await this.products.findBySlug(slug);
    if (!product) throw new NotFoundError('Product not found');
    return toProductDto(product);
  }

  async getById(id: string): Promise<ProductDto> {
    const product = await this.products.findById(id);
    if (!product) throw new NotFoundError('Product not found');
    return toProductDto(product);
  }

  async create(input: CreateProductInput): Promise<ProductDto> {
    await this.requireCategory(input.categoryId);
    await this.requireBrand(input.brandId ?? null);

    const slug = input.slug ?? slugify(input.name);
    if (await this.products.existsBySlug(slug)) {
      throw new ConflictError('A product with this slug already exists');
    }

    const productInput: ProductInput = {
      categoryId: input.categoryId,
      brandId: input.brandId ?? null,
      name: input.name,
      slug,
      description: input.description ?? '',
      specifications: input.specifications ?? {},
      priceCents: toCents(input.price),
      currency: productCurrency(input.currency),
      stockQuantity: input.stockQuantity,
      sku: input.sku ?? null,
      isActive: input.isActive ?? true,
      isFeatured: input.isFeatured ?? false,
      images: normalizeImages(input.images),
    };

    return toProductDto(await this.products.create(newId(), productInput));
  }

  async update(id: string, input: UpdateProductInput): Promise<ProductDto> {
    const existing = await this.products.findById(id);
    if (!existing) throw new NotFoundError('Product not found');

    const categoryId = input.categoryId ?? existing.categoryId;
    await this.requireCategory(categoryId);

    const brandId = input.brandId === undefined ? existing.brandId : input.brandId;
    await this.requireBrand(brandId);

    const slug = input.slug ?? existing.slug;
    if (await this.products.existsBySlug(slug, id)) {
      throw new ConflictError('A product with this slug already exists');
    }

    const existingImages = existing.images.map((image) => ({
      url: image.url,
      altText: image.altText,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    }));

    const productInput: ProductInput = {
      categoryId,
      brandId,
      name: input.name ?? existing.name,
      slug,
      description: input.description ?? existing.description,
      specifications: input.specifications ?? existing.specifications,
      priceCents: input.price === undefined ? existing.priceCents : toCents(input.price),
      currency: productCurrency(input.currency ?? existing.currency),
      stockQuantity: input.stockQuantity ?? existing.stockQuantity,
      sku: input.sku === undefined ? existing.sku : input.sku,
      isActive: input.isActive ?? existing.isActive,
      isFeatured: input.isFeatured ?? existing.isFeatured,
      images: normalizeImages(input.images, existingImages),
    };

    return toProductDto(await this.products.update(id, productInput));
  }

  async deactivate(id: string): Promise<void> {
    const existing = await this.products.findById(id);
    if (!existing) throw new NotFoundError('Product not found');
    await this.products.deactivate(id);
  }
}
