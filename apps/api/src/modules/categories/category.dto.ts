import type { Category, CategoryWithProductCount } from './category.entity.js';

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

export function toCategoryDto(category: Category | CategoryWithProductCount): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    ...('productCount' in category ? { productCount: category.productCount } : {}),
  };
}
