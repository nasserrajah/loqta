/**
 * TypeScript interfaces for the verified Loqta backend API responses.
 *
 * Source of truth: the live backend's OpenAPI documentation and its DTO
 * definitions (apps/api/src/**\/dto files). Do not invent fields here without
 * verifying against the API.
 */

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface BrandDto {
  id: string;
  name: string;
  slug: string;
}

export interface ProductImageDto {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

/** Product as returned by GET /products and /products/:slug */
export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Specifications are returned as an object (or occasionally JSON text). */
  specifications: Record<string, string>;
  priceCents: number;
  /** Formatted price string (e.g. "1299.00"), may be "0.00". */
  price: string;
  currency: string;
  stockQuantity: number;
  inStock: boolean;
  sku: string | null;
  isActive: boolean;
  isFeatured: boolean;
  category: { id: string; name: string; slug: string };
  brand: BrandDto | null;
  images: ProductImageDto[];
  primaryImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductListQuery {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
  page?: number;
  pageSize?: number;
}

export interface CartItemDto {
  id: string;
  product: ProductDto;
  quantity: number;
  unitPriceCents: number;
  unitPrice: string;
  lineTotalCents: number;
  lineTotal: string;
  available: boolean;
}

export interface CartDto {
  id: string;
  items: CartItemDto[];
  itemCount: number;
  subtotalCents: number;
  subtotal: string;
  currency: string;
  updatedAt: string;
}

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: 'User' | 'Admin';
  createdAt: string;
  updatedAt: string;
}

/** POST /auth/login | /auth/register */
export interface AuthResponse {
  user: UserDto;
  session: { expiresAt: string };
  token: string;
}

/** Standard envelope shapes used by the backend. */
export interface ApiEnvelope<T> {
  data: T;
}
export interface ApiPaginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** GET /categories (list endpoint returns a plain array of categories). */
export type CategoriesResponse = CategoryDto[];
