import type { Request, Response } from 'express';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendCreated, sendData, sendNoContent } from '../../shared/http/response.js';
import { getAuth } from '../../middleware/auth.middleware.js';
import { extractSessionToken } from '../../middleware/auth.middleware.js';
import type { AuthService, SessionContext } from './auth.service.js';
import type { UsersService } from '../users/users.service.js';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from './auth.schemas.js';
import { clearSessionCookie, setSessionCookie } from './auth.cookies.js';
import type { AuthResponseDto, AuthSessionResult } from './auth.dto.js';

export interface AuthControllerDependencies {
  authService: AuthService;
  usersService: UsersService;
  env: Env;
}

function sessionContext(req: Request): SessionContext {
  return {
    userAgent: req.get('user-agent') ?? null,
    ipAddress: req.ip ?? null,
  };
}

function toAuthResponse(result: AuthSessionResult): AuthResponseDto {
  return { user: result.user, session: { expiresAt: result.expiresAt } };
}

export function createAuthController({
  authService,
  usersService,
  env,
}: AuthControllerDependencies) {
  const secureCookie = env.NODE_ENV === 'production';

  return {
    register: asyncHandler(async (req: Request, res: Response) => {
      const input = req.validated.body as RegisterInput;
      const result = await authService.register(input, sessionContext(req));
      setSessionCookie(res, result.token, result.expiresAt, secureCookie);
      sendCreated(res, toAuthResponse(result));
    }),

    login: asyncHandler(async (req: Request, res: Response) => {
      const input = req.validated.body as LoginInput;
      const result = await authService.login(input, sessionContext(req));
      setSessionCookie(res, result.token, result.expiresAt, secureCookie);
      sendData(res, toAuthResponse(result));
    }),

    logout: asyncHandler(async (req: Request, res: Response) => {
      await authService.logout(extractSessionToken(req));
      clearSessionCookie(res, secureCookie);
      sendNoContent(res);
    }),

    me: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      sendData(res, await usersService.getById(auth.user.id));
    }),

    listSessions: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      sendData(res, await authService.listSessions(auth.user.id, auth.sessionId));
    }),

    revokeSession: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      const { id } = req.validated.params as { id: string };
      const result = await authService.revokeSession(auth.user.id, id, auth.sessionId);
      if (result.revokedCurrent) {
        clearSessionCookie(res, secureCookie);
      }
      sendNoContent(res);
    }),

    forgotPassword: asyncHandler(async (req: Request, res: Response) => {
      const input = req.validated.body as ForgotPasswordInput;
      const result = await authService.forgotPassword(input.email);
      sendData(
        res,
        {
          message: 'If an account exists for this email, a reset link has been sent.',
          ...(result.resetToken ? { resetToken: result.resetToken } : {}),
        },
        202,
      );
    }),

    resetPassword: asyncHandler(async (req: Request, res: Response) => {
      const input = req.validated.body as ResetPasswordInput;
      await authService.resetPassword(input.token, input.newPassword);
      clearSessionCookie(res, secureCookie);
      sendData(res, { message: 'Password has been reset. Sign in with your new password.' });
    }),
  };
}
