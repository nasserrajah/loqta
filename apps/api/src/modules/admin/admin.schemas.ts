import { z } from 'zod';
import { ROLES } from '../../shared/constants/index.js';
import { paginationQuerySchema } from '../../shared/http/pagination.schema.js';

export const adminUsersQuerySchema = paginationQuerySchema
  .extend({
    search: z.string().trim().max(120).optional(),
  })
  .strict();

export const adminUserParamsSchema = z.object({
  id: z.string().min(1).max(64),
});

export const updateUserRoleSchema = z
  .object({
    role: z.enum(ROLES),
  })
  .strict();

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
