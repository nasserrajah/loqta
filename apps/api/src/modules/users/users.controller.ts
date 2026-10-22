import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendData } from '../../shared/http/response.js';
import { getAuth } from '../../middleware/auth.middleware.js';
import type { UsersService } from './users.service.js';
import type { ChangePasswordInput, UpdateProfileInput } from './user.schemas.js';

export function createUsersController(usersService: UsersService) {
  return {
    getMe: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      sendData(res, await usersService.getById(auth.user.id));
    }),

    updateMe: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      const input = req.validated.body as UpdateProfileInput;
      sendData(res, await usersService.updateProfile(auth.user.id, input));
    }),

    changePassword: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      const input = req.validated.body as ChangePasswordInput;
      await usersService.changePassword(auth.user.id, auth.sessionId, input);
      sendData(res, { message: 'Password changed successfully' });
    }),
  };
}
