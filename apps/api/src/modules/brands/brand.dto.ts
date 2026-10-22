import type { Brand, BrandWithProductCount } from './brand.entity.js';

export interface BrandDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

export function toBrandDto(brand: Brand | BrandWithProductCount): BrandDto {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    description: brand.description,
    logoUrl: brand.logoUrl,
    websiteUrl: brand.websiteUrl,
    isActive: brand.isActive,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
    ...('productCount' in brand ? { productCount: brand.productCount } : {}),
  };
}
