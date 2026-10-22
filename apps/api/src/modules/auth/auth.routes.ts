import { Router } from 'express';
import { z } from 'zod';
import type { Env } from '../../config/env.js';
import { createRequireAuth } from '../../middleware/auth.middleware.js';
import { createSensitiveRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import type { UsersService } from '../users/users.service.js';
import { createAuthController } from './auth.controller.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schemas.js';
import type { AuthService } from './auth.service.js';

const sessionParamsSchema = z.object({
  id: z.string().min(1).max(64),
});

export interface AuthRouterDependencies {
  authService: AuthService;
  usersService: UsersService;
  env: Env;
}

export function createAuthRouter(dependencies: AuthRouterDependencies): Router {
  const router = Router();
  const controller = createAuthController(dependencies);
  const requireAuth = createRequireAuth(dependencies.authService);
  const sensitiveLimiter = createSensitiveRateLimiter(dependencies.env.RATE_LIMIT_MAX);

  router.post('/register', sensitiveLimiter, validate(registerSchema), controller.register);
  router.post('/login', sensitiveLimiter, validate(loginSchema), controller.login);
  router.post('/logout', controller.logout);
  router.get('/me', requireAuth, controller.me);
  router.get('/sessions', requireAuth, controller.listSessions);
  router.delete(
    '/sessions/:id',
    requireAuth,
    validate(sessionParamsSchema, 'params'),
    controller.revokeSession,
  );
  router.post(
    '/forgot-password',
    sensitiveLimiter,
    validate(forgotPasswordSchema),
    controller.forgotPassword,
  );
  router.post(
    '/reset-password',
    sensitiveLimiter,
    validate(resetPasswordSchema),
    controller.resetPassword,
  );

  return router;
}
