import { Router } from 'express';
import { createRequireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import type { AuthService } from '../auth/auth.service.js';
import { createUsersController } from './users.controller.js';
import { changePasswordSchema, updateProfileSchema } from './user.schemas.js';
import type { UsersService } from './users.service.js';

export interface UsersRouterDependencies {
  authService: AuthService;
  usersService: UsersService;
}

export function createUsersRouter({ authService, usersService }: UsersRouterDependencies): Router {
  const router = Router();
  const requireAuth = createRequireAuth(authService);
  const controller = createUsersController(usersService);

  router.get('/me', requireAuth, controller.getMe);
  router.patch('/me', requireAuth, validate(updateProfileSchema), controller.updateMe);
  router.put(
    '/me/password',
    requireAuth,
    validate(changePasswordSchema),
    controller.changePassword,
  );

  return router;
}
