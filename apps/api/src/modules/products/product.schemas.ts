import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/http/pagination.schema.js';
import { DEFAULT_CURRENCY } from '../../shared/constants/index.js';
import { toCents } from '../../shared/utils/money.js';

const booleanQuery = z.enum(['true', 'false']).transform((value) => value === 'true');

const priceSchema = z.coerce
  .number()
  .min(0)
  .max(10_000_000)
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
    message: 'Price can have at most two decimal places',
  });

export const productListQuerySchema = paginationQuerySchema
  .extend({
    search: z.string().trim().max(100).optional(),
    category: z.string().trim().max(80).optional(),
    brand: z.string().trim().max(80).optional(),
    minPrice: priceSchema.optional(),
    maxPrice: priceSchema.optional(),
    inStock: booleanQuery.optional(),
    featured: booleanQuery.optional(),
    sort: z
      .enum(['newest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'name_desc'])
      .default('newest'),
  })
  .strict()
  .refine(
    (data) =>
      data.minPrice === undefined || data.maxPrice === undefined || data.minPrice <= data.maxPrice,
    { message: 'minPrice cannot be greater than maxPrice', path: ['minPrice'] },
  );

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain lowercase letters, numbers, and dashes');

const imageSchema = z
  .object({
    url: z.string().url().max(500),
    altText: z.string().trim().max(200).nullable().optional(),
    sortOrder: z.number().int().min(0).max(100).optional(),
    isPrimary: z.boolean().optional(),
  })
  .strict();

const specificationsSchema = z
  .record(z.string().trim().min(1).max(80), z.string().trim().max(500))
  .refine((value) => Object.keys(value).length <= 30, {
    message: 'At most 30 specifications are allowed',
  });

export const createProductSchema = z
  .object({
    categoryId: z.string().min(1).max(64),
    brandId: z.string().min(1).max(64).nullable().optional(),
    name: z.string().trim().min(2).max(200),
    slug: slugSchema.optional(),
    description: z.string().trim().max(10_000).optional(),
    specifications: specificationsSchema.optional(),
    price: priceSchema,
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toUpperCase())
      .optional(),
    stockQuantity: z.number().int().min(0).max(1_000_000),
    sku: z
      .string()
      .trim()
      .min(2)
      .max(64)
      .regex(/^[A-Za-z0-9._-]+$/, 'SKU contains invalid characters')
      .nullable()
      .optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    images: z.array(imageSchema).max(10).optional(),
  })
  .strict();

export const updateProductSchema = createProductSchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one product field must be provided',
  });

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export function productListFilters(input: ProductListQuery) {
  return {
    search: input.search,
    category: input.category,
    brand: input.brand,
    minPriceCents: input.minPrice === undefined ? undefined : toCents(input.minPrice),
    maxPriceCents: input.maxPrice === undefined ? undefined : toCents(input.maxPrice),
    inStock: input.inStock,
    featured: input.featured,
    sort: input.sort,
    page: input.page,
    pageSize: input.pageSize,
  };
}

export function normalizeImages(
  images:
    | Array<{
        url: string;
        altText?: string | null;
        sortOrder?: number;
        isPrimary?: boolean;
      }>
    | undefined,
  fallback: CreateProductInput['images'] = [],
) {
  const selected = images ?? fallback;
  const normalized = selected.map((image, index) => ({
    url: image.url,
    altText: image.altText ?? null,
    sortOrder: image.sortOrder ?? index,
    isPrimary: image.isPrimary ?? false,
  }));

  const primaryIndex = normalized.findIndex((image) => image.isPrimary);
  return normalized.map((image, index) => ({
    ...image,
    isPrimary: primaryIndex === -1 ? index === 0 : index === primaryIndex,
  }));
}

export const productCurrency = (currency?: string) => currency ?? DEFAULT_CURRENCY;
