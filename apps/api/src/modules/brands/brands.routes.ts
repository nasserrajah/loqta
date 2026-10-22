import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware.js';
import { createBrandsController } from './brands.controller.js';
import type { BrandsService } from './brands.service.js';

const slugParamsSchema = z.object({ slug: z.string().min(1).max(80) });

export function createBrandsRouter(brandsService: BrandsService): Router {
  const router = Router();
  const controller = createBrandsController(brandsService);

  router.get('/', controller.list);
  router.get('/:slug', validate(slugParamsSchema, 'params'), controller.getBySlug);

  return router;
}
