import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/http/pagination.schema.js';

export const favoriteProductParamsSchema = z.object({
  productId: z.string().min(1).max(64),
});

export type FavoriteProductParams = z.infer<typeof favoriteProductParamsSchema>;
export type FavoritesListQuery = z.infer<typeof paginationQuerySchema>;
