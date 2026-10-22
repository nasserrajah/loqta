import { z } from 'zod';
import { PAGINATION_DEFAULT_PAGE_SIZE, PAGINATION_MAX_PAGE_SIZE } from '../constants/index.js';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION_MAX_PAGE_SIZE)
    .default(PAGINATION_DEFAULT_PAGE_SIZE),
});
