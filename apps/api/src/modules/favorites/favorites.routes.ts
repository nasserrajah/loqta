import { Router } from 'express';
import { createRequireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { paginationQuerySchema } from '../../shared/http/pagination.schema.js';
import type { AuthService } from '../auth/auth.service.js';
import { createFavoritesController } from './favorites.controller.js';
import { favoriteProductParamsSchema } from './favorite.schemas.js';
import type { FavoritesService } from './favorites.service.js';

export interface FavoritesRouterDependencies {
  authService: AuthService;
  favoritesService: FavoritesService;
}

export function createFavoritesRouter({
  authService,
  favoritesService,
}: FavoritesRouterDependencies): Router {
  const router = Router();
  const requireAuth = createRequireAuth(authService);
  const controller = createFavoritesController(favoritesService);

  router.use(requireAuth);
  router.get('/', validate(paginationQuerySchema, 'query'), controller.list);
  router.post('/:productId', validate(favoriteProductParamsSchema, 'params'), controller.add);
  router.delete('/:productId', validate(favoriteProductParamsSchema, 'params'), controller.remove);

  return router;
}
