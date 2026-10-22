import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware.js';
import { createCategoriesController } from './categories.controller.js';
import type { CategoriesService } from './categories.service.js';

const slugParamsSchema = z.object({ slug: z.string().min(1).max(80) });

export function createCategoriesRouter(categoriesService: CategoriesService): Router {
  const router = Router();
  const controller = createCategoriesController(categoriesService);

  router.get('/', controller.list);
  router.get('/:slug', validate(slugParamsSchema, 'params'), controller.getBySlug);

  return router;
}
