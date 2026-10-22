import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendCreated, sendData, sendNoContent, sendPaginated } from '../../shared/http/response.js';
import type { ProductsService } from './products.service.js';
import type {
  CreateProductInput,
  ProductListQuery,
  UpdateProductInput,
} from './product.schemas.js';

export function createProductsController(productsService: ProductsService) {
  return {
    list: asyncHandler(async (req: Request, res: Response) => {
      const result = await productsService.listPublic(req.validated.query as ProductListQuery);
      sendPaginated(res, result.items, result.meta);
    }),

    listAdmin: asyncHandler(async (req: Request, res: Response) => {
      const result = await productsService.listAdmin(req.validated.query as ProductListQuery);
      sendPaginated(res, result.items, result.meta);
    }),

    getBySlug: asyncHandler(async (req: Request, res: Response) => {
      const { slug } = req.validated.params as { slug: string };
      sendData(res, await productsService.getBySlug(slug));
    }),

    getById: asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.validated.params as { id: string };
      sendData(res, await productsService.getById(id));
    }),

    create: asyncHandler(async (req: Request, res: Response) => {
      const input = req.validated.body as CreateProductInput;
      sendCreated(res, await productsService.create(input));
    }),

    update: asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.validated.params as { id: string };
      const input = req.validated.body as UpdateProductInput;
      sendData(res, await productsService.update(id, input));
    }),

    remove: asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.validated.params as { id: string };
      await productsService.deactivate(id);
      sendNoContent(res);
    }),
  };
}
