import { Router } from 'express';
import { createRequireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import type { AuthService } from '../auth/auth.service.js';
import { createOrdersController } from './orders.controller.js';
import { createOrderSchema, orderIdParamsSchema, orderListQuerySchema } from './order.schemas.js';
import type { OrdersService } from './orders.service.js';

export interface OrdersRouterDependencies {
  authService: AuthService;
  ordersService: OrdersService;
}

export function createOrdersRouter({
  authService,
  ordersService,
}: OrdersRouterDependencies): Router {
  const router = Router();
  const requireAuth = createRequireAuth(authService);
  const controller = createOrdersController(ordersService);

  router.use(requireAuth);
  router.post('/', validate(createOrderSchema), controller.create);
  router.get('/', validate(orderListQuerySchema, 'query'), controller.listMine);
  router.get('/:id', validate(orderIdParamsSchema, 'params'), controller.getMine);
  router.post('/:id/cancel', validate(orderIdParamsSchema, 'params'), controller.cancelMine);

  return router;
}
