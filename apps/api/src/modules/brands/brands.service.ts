import type { BrandRepository } from '../../infrastructure/database/repositories/index.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
import { newId } from '../../shared/utils/crypto.js';
import { slugify } from '../../shared/utils/slug.js';
import { toBrandDto, type BrandDto } from './brand.dto.js';
import type { CreateBrandInput, UpdateBrandInput } from './brand.schemas.js';

export class BrandsService {
  constructor(private readonly brands: BrandRepository) {}

  async list(includeInactive = false): Promise<BrandDto[]> {
    const brands = await this.brands.list(includeInactive);
    return brands.map(toBrandDto);
  }

  async getBySlug(slug: string): Promise<BrandDto> {
    const brand = await this.brands.findBySlug(slug);
    if (!brand) throw new NotFoundError('Brand not found');
    return toBrandDto(brand);
  }

  async create(input: CreateBrandInput): Promise<BrandDto> {
    const slug = input.slug ?? slugify(input.name);
    if (await this.brands.existsBySlug(slug)) {
      throw new ConflictError('A brand with this slug already exists');
    }

    const brand = await this.brands.create(newId(), {
      name: input.name,
      slug,
      description: input.description ?? null,
      logoUrl: input.logoUrl ?? null,
      websiteUrl: input.websiteUrl ?? null,
      isActive: input.isActive ?? true,
    });
    return toBrandDto(brand);
  }

  async update(id: string, input: UpdateBrandInput): Promise<BrandDto> {
    const existing = await this.brands.findById(id);
    if (!existing) throw new NotFoundError('Brand not found');

    const slug = input.slug ?? existing.slug;
    if (await this.brands.existsBySlug(slug, id)) {
      throw new ConflictError('A brand with this slug already exists');
    }

    const brand = await this.brands.update(id, {
      name: input.name ?? existing.name,
      slug,
      description: input.description === undefined ? existing.description : input.description,
      logoUrl: input.logoUrl === undefined ? existing.logoUrl : input.logoUrl,
      websiteUrl: input.websiteUrl === undefined ? existing.websiteUrl : input.websiteUrl,
      isActive: input.isActive ?? existing.isActive,
    });
    return toBrandDto(brand);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.brands.findById(id);
    if (!existing) throw new NotFoundError('Brand not found');

    const productCount = await this.brands.countProducts(id);
    if (productCount > 0) {
      throw new ConflictError('Cannot delete a brand that still has products');
    }

    await this.brands.delete(id);
  }
}
