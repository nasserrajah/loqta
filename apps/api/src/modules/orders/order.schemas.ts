import { z } from 'zod';
import { ORDER_STATUSES } from '../../shared/constants/index.js';
import { paginationQuerySchema } from '../../shared/http/pagination.schema.js';

export const createOrderSchema = z
  .object({
    shippingName: z.string().trim().min(2).max(100),
    shippingPhone: z
      .string()
      .trim()
      .min(6)
      .max(30)
      .regex(/^[0-9+\-() ]+$/, 'Phone contains invalid characters'),
    shippingAddress: z.string().trim().min(10).max(500),
    notes: z.string().trim().max(500).nullable().optional(),
  })
  .strict();

export const orderListQuerySchema = paginationQuerySchema
  .extend({
    status: z.enum(ORDER_STATUSES).optional(),
  })
  .strict();

export const adminOrderListQuerySchema = orderListQuerySchema
  .extend({
    userId: z.string().min(1).max(64).optional(),
    search: z.string().trim().max(120).optional(),
  })
  .strict();

export const orderIdParamsSchema = z.object({
  id: z.string().min(1).max(64),
});

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(ORDER_STATUSES),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
