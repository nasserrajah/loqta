import { Router } from 'express';
import { z } from 'zod';
import { createRequireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import type { AuthService } from '../auth/auth.service.js';
import { createCategorySchema, updateCategorySchema } from '../categories/category.schemas.js';
import { createBrandSchema, updateBrandSchema } from '../brands/brand.schemas.js';
import {
  createProductSchema,
  productListQuerySchema,
  updateProductSchema,
} from '../products/product.schemas.js';
import {
  adminOrderListQuerySchema,
  orderIdParamsSchema,
  updateOrderStatusSchema,
} from '../orders/order.schemas.js';
import { createAdminController } from './admin.controller.js';
import type { AdminControllerDependencies } from './admin.controller.js';
import {
  adminUserParamsSchema,
  adminUsersQuerySchema,
  updateUserRoleSchema,
} from './admin.schemas.js';

const idParamsSchema = z.object({ id: z.string().min(1).max(64) });

export interface AdminRouterDependencies extends AdminControllerDependencies {
  authService: AuthService;
}

export function createAdminRouter(dependencies: AdminRouterDependencies): Router {
  const router = Router();
  const requireAuth = createRequireAuth(dependencies.authService);
  const controller = createAdminController(dependencies);

  router.use(requireAuth, requireRole('Admin'));

  router.get('/stats', controller.stats);

  router.get('/users', validate(adminUsersQuerySchema, 'query'), controller.listUsers);
  router.patch(
    '/users/:id/role',
    validate(adminUserParamsSchema, 'params'),
    validate(updateUserRoleSchema),
    controller.updateUserRole,
  );

  router.get('/categories', controller.listCategories);
  router.post('/categories', validate(createCategorySchema), controller.createCategory);
  router.patch(
    '/categories/:id',
    validate(idParamsSchema, 'params'),
    validate(updateCategorySchema),
    controller.updateCategory,
  );
  router.delete('/categories/:id', validate(idParamsSchema, 'params'), controller.removeCategory);

  router.get('/brands', controller.listBrands);
  router.post('/brands', validate(createBrandSchema), controller.createBrand);
  router.patch(
    '/brands/:id',
    validate(idParamsSchema, 'params'),
    validate(updateBrandSchema),
    controller.updateBrand,
  );
  router.delete('/brands/:id', validate(idParamsSchema, 'params'), controller.removeBrand);

  router.get('/products', validate(productListQuerySchema, 'query'), controller.listProducts);
  router.get('/products/:id', validate(idParamsSchema, 'params'), controller.getProduct);
  router.post('/products', validate(createProductSchema), controller.createProduct);
  router.patch(
    '/products/:id',
    validate(idParamsSchema, 'params'),
    validate(updateProductSchema),
    controller.updateProduct,
  );
  router.delete('/products/:id', validate(idParamsSchema, 'params'), controller.removeProduct);

  router.get('/orders', validate(adminOrderListQuerySchema, 'query'), controller.listOrders);
  router.get('/orders/:id', validate(orderIdParamsSchema, 'params'), controller.getOrder);
  router.patch(
    '/orders/:id/status',
    validate(orderIdParamsSchema, 'params'),
    validate(updateOrderStatusSchema),
    controller.updateOrderStatus,
  );

  return router;
}
