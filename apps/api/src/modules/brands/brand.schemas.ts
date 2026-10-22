import { z } from 'zod';

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain lowercase letters, numbers, and dashes');

export const createBrandSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: slugSchema.optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    logoUrl: z.string().url().max(500).nullable().optional(),
    websiteUrl: z.string().url().max(500).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const updateBrandSchema = createBrandSchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one brand field must be provided',
  });

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
