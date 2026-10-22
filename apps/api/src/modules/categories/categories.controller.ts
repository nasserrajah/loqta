import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendCreated, sendData, sendNoContent } from '../../shared/http/response.js';
import type { CategoriesService } from './categories.service.js';
import type { CreateCategoryInput, UpdateCategoryInput } from './category.schemas.js';

export function createCategoriesController(categoriesService: CategoriesService) {
  return {
    list: asyncHandler(async (_req: Request, res: Response) => {
      sendData(res, await categoriesService.list());
    }),

    adminList: asyncHandler(async (_req: Request, res: Response) => {
      sendData(res, await categoriesService.list(true));
    }),

    getBySlug: asyncHandler(async (req: Request, res: Response) => {
      const { slug } = req.validated.params as { slug: string };
      sendData(res, await categoriesService.getBySlug(slug));
    }),

    create: asyncHandler(async (req: Request, res: Response) => {
      const input = req.validated.body as CreateCategoryInput;
      sendCreated(res, await categoriesService.create(input));
    }),

    update: asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.validated.params as { id: string };
      const input = req.validated.body as UpdateCategoryInput;
      sendData(res, await categoriesService.update(id, input));
    }),

    remove: asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.validated.params as { id: string };
      await categoriesService.delete(id);
      sendNoContent(res);
    }),
  };
}
