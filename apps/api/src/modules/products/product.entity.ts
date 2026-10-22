export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProductRelation {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  categoryId: string;
  brandId: string | null;
  name: string;
  slug: string;
  description: string;
  specifications: Record<string, string>;
  priceCents: number;
  currency: string;
  stockQuantity: number;
  sku: string | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  category: ProductRelation;
  brand: ProductRelation | null;
  images: ProductImage[];
  primaryImageUrl: string | null;
}

export interface ProductListFilters {
  search?: string;
  category?: string;
  brand?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  inStock?: boolean;
  featured?: boolean;
  sort: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
  page: number;
  pageSize: number;
}

export interface ProductInput {
  categoryId: string;
  brandId: string | null;
  name: string;
  slug: string;
  description: string;
  specifications: Record<string, string>;
  priceCents: number;
  currency: string;
  stockQuantity: number;
  sku: string | null;
  isActive: boolean;
  isFeatured: boolean;
  images: Array<{
    url: string;
    altText: string | null;
    sortOrder: number;
    isPrimary: boolean;
  }>;
}
