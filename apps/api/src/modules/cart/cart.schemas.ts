import { z } from 'zod';
import { CART_MAX_QUANTITY } from '../../shared/constants/index.js';

export const addCartItemSchema = z
  .object({
    productId: z.string().min(1).max(64),
    quantity: z.number().int().min(1).max(CART_MAX_QUANTITY),
  })
  .strict();

export const updateCartItemSchema = z
  .object({
    quantity: z.number().int().min(1).max(CART_MAX_QUANTITY),
  })
  .strict();

export const cartItemParamsSchema = z.object({
  itemId: z.string().min(1).max(64),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
