import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendCreated, sendData, sendNoContent } from '../../shared/http/response.js';
import type { BrandsService } from './brands.service.js';
import type { CreateBrandInput, UpdateBrandInput } from './brand.schemas.js';

export function createBrandsController(brandsService: BrandsService) {
  return {
    list: asyncHandler(async (_req: Request, res: Response) => {
      sendData(res, await brandsService.list());
    }),

    adminList: asyncHandler(async (_req: Request, res: Response) => {
      sendData(res, await brandsService.list(true));
    }),

    getBySlug: asyncHandler(async (req: Request, res: Response) => {
      const { slug } = req.validated.params as { slug: string };
      sendData(res, await brandsService.getBySlug(slug));
    }),

    create: asyncHandler(async (req: Request, res: Response) => {
      const input = req.validated.body as CreateBrandInput;
      sendCreated(res, await brandsService.create(input));
    }),

    update: asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.validated.params as { id: string };
      const input = req.validated.body as UpdateBrandInput;
      sendData(res, await brandsService.update(id, input));
    }),

    remove: asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.validated.params as { id: string };
      await brandsService.delete(id);
      sendNoContent(res);
    }),
  };
}
