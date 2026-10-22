import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendCreated, sendNoContent, sendPaginated } from '../../shared/http/response.js';
import { getAuth } from '../../middleware/auth.middleware.js';
import type { FavoritesService } from './favorites.service.js';
import type { FavoriteProductParams } from './favorite.schemas.js';

export function createFavoritesController(favoritesService: FavoritesService) {
  return {
    list: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      const query = req.validated.query as { page: number; pageSize: number };
      const result = await favoritesService.list(auth.user.id, query.page, query.pageSize);
      sendPaginated(res, result.items, result.meta);
    }),

    add: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      const { productId } = req.validated.params as FavoriteProductParams;
      sendCreated(res, await favoritesService.add(auth.user.id, productId));
    }),

    remove: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      const { productId } = req.validated.params as FavoriteProductParams;
      await favoritesService.remove(auth.user.id, productId);
      sendNoContent(res);
    }),
  };
}
