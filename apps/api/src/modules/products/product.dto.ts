import { formatMoney } from '../../shared/utils/money.js';
import type { Product, ProductImage } from './product.entity.js';

export interface ProductImageDto {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  specifications: Record<string, string>;
  priceCents: number;
  price: string;
  currency: string;
  stockQuantity: number;
  inStock: boolean;
  sku: string | null;
  isActive: boolean;
  isFeatured: boolean;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string } | null;
  images: ProductImageDto[];
  primaryImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

function toImageDto(image: ProductImage): ProductImageDto {
  return {
    id: image.id,
    url: image.url,
    altText: image.altText,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
  };
}

export function toProductDto(product: Product): ProductDto {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    specifications: product.specifications,
    priceCents: product.priceCents,
    price: formatMoney(product.priceCents),
    currency: product.currency,
    stockQuantity: product.stockQuantity,
    inStock: product.stockQuantity > 0,
    sku: product.sku,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    category: product.category,
    brand: product.brand,
    images: product.images.map(toImageDto),
    primaryImageUrl: product.primaryImageUrl,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
