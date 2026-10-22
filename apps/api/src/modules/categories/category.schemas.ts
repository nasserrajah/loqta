import { z } from 'zod';

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain lowercase letters, numbers, and dashes');

export const createCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: slugSchema.optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    imageUrl: z.string().url().max(500).nullable().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
  })
  .strict();

export const updateCategorySchema = createCategorySchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one category field must be provided',
  });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
