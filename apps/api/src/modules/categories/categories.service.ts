import type { CategoryRepository } from '../../infrastructure/database/repositories/index.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
import { newId } from '../../shared/utils/crypto.js';
import { slugify } from '../../shared/utils/slug.js';
import { toCategoryDto, type CategoryDto } from './category.dto.js';
import type { CreateCategoryInput, UpdateCategoryInput } from './category.schemas.js';

export class CategoriesService {
  constructor(private readonly categories: CategoryRepository) {}

  async list(includeInactive = false): Promise<CategoryDto[]> {
    const categories = await this.categories.list(includeInactive);
    return categories.map(toCategoryDto);
  }

  async getBySlug(slug: string): Promise<CategoryDto> {
    const category = await this.categories.findBySlug(slug);
    if (!category) throw new NotFoundError('Category not found');
    return toCategoryDto(category);
  }

  async create(input: CreateCategoryInput): Promise<CategoryDto> {
    const slug = input.slug ?? slugify(input.name);
    if (await this.categories.existsBySlug(slug)) {
      throw new ConflictError('A category with this slug already exists');
    }

    const category = await this.categories.create(newId(), {
      name: input.name,
      slug,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    });
    return toCategoryDto(category);
  }

  async update(id: string, input: UpdateCategoryInput): Promise<CategoryDto> {
    const existing = await this.categories.findById(id);
    if (!existing) throw new NotFoundError('Category not found');

    const slug = input.slug ?? existing.slug;
    if (await this.categories.existsBySlug(slug, id)) {
      throw new ConflictError('A category with this slug already exists');
    }

    const category = await this.categories.update(id, {
      name: input.name ?? existing.name,
      slug,
      description: input.description === undefined ? existing.description : input.description,
      imageUrl: input.imageUrl === undefined ? existing.imageUrl : input.imageUrl,
      isActive: input.isActive ?? existing.isActive,
      sortOrder: input.sortOrder ?? existing.sortOrder,
    });
    return toCategoryDto(category);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.categories.findById(id);
    if (!existing) throw new NotFoundError('Category not found');

    const productCount = await this.categories.countProducts(id);
    if (productCount > 0) {
      throw new ConflictError('Cannot delete a category that still contains products');
    }

    await this.categories.delete(id);
  }
}
