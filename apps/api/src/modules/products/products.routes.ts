import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware.js';
import { createProductsController } from './products.controller.js';
import { productListQuerySchema } from './product.schemas.js';
import type { ProductsService } from './products.service.js';

const slugParamsSchema = z.object({ slug: z.string().min(1).max(80) });

export function createProductsRouter(productsService: ProductsService): Router {
  const router = Router();
  const controller = createProductsController(productsService);

  router.get('/', validate(productListQuerySchema, 'query'), controller.list);
  router.get('/:slug', validate(slugParamsSchema, 'params'), controller.getBySlug);

  return router;
}
