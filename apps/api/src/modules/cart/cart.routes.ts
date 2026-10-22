import { Router } from 'express';
import { createRequireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import type { AuthService } from '../auth/auth.service.js';
import { createCartController } from './cart.controller.js';
import { addCartItemSchema, cartItemParamsSchema, updateCartItemSchema } from './cart.schemas.js';
import type { CartService } from './cart.service.js';

export interface CartRouterDependencies {
  authService: AuthService;
  cartService: CartService;
}

export function createCartRouter({ authService, cartService }: CartRouterDependencies): Router {
  const router = Router();
  const requireAuth = createRequireAuth(authService);
  const controller = createCartController(cartService);

  router.use(requireAuth);
  router.get('/', controller.get);
  router.delete('/', controller.clear);
  router.post('/items', validate(addCartItemSchema), controller.addItem);
  router.patch(
    '/items/:itemId',
    validate(cartItemParamsSchema, 'params'),
    validate(updateCartItemSchema),
    controller.updateItem,
  );
  router.delete('/items/:itemId', validate(cartItemParamsSchema, 'params'), controller.removeItem);

  return router;
}
