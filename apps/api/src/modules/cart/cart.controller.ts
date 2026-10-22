import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendData, sendNoContent } from '../../shared/http/response.js';
import { getAuth } from '../../middleware/auth.middleware.js';
import type { CartService } from './cart.service.js';
import type { AddCartItemInput, UpdateCartItemInput } from './cart.schemas.js';

export function createCartController(cartService: CartService) {
  return {
    get: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      sendData(res, await cartService.getCart(auth.user.id));
    }),

    addItem: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      const input = req.validated.body as AddCartItemInput;
      sendData(res, await cartService.addItem(auth.user.id, input.productId, input.quantity));
    }),

    updateItem: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      const { itemId } = req.validated.params as { itemId: string };
      const input = req.validated.body as UpdateCartItemInput;
      sendData(res, await cartService.updateItem(auth.user.id, itemId, input.quantity));
    }),

    removeItem: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      const { itemId } = req.validated.params as { itemId: string };
      sendData(res, await cartService.removeItem(auth.user.id, itemId));
    }),

    clear: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      await cartService.clear(auth.user.id);
      sendNoContent(res);
    }),
  };
}
