import type { Request, RequestHandler } from 'express';
import type { AuthService } from '../modules/auth/auth.service.js';
import { ForbiddenError, UnauthorizedError } from '../shared/errors/index.js';
import type { AuthContext } from '../shared/types/express.js';
import { SESSION_COOKIE_NAME, type UserRole } from '../shared/constants/index.js';
import { asyncHandler } from '../shared/http/async-handler.js';

export function extractSessionToken(req: Request): string | undefined {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice('Bearer '.length).trim();
    if (token.length > 0) return token;
  }

  const cookie = req.cookies?.[SESSION_COOKIE_NAME] as unknown;
  return typeof cookie === 'string' && cookie.length > 0 ? cookie : undefined;
}

export function getAuth(req: Request): AuthContext {
  if (!req.auth) {
    throw new UnauthorizedError();
  }
  return req.auth;
}

export function createRequireAuth(authService: AuthService): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const token = extractSessionToken(req);
    if (!token) {
      throw new UnauthorizedError();
    }

    req.auth = await authService.authenticate(token);
    next();
  });
}

export function requireRole(role: UserRole): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new UnauthorizedError());
      return;
    }
    if (req.auth.user.role !== role) {
      next(new ForbiddenError('Administrator access is required'));
      return;
    }
    next();
  };
}
