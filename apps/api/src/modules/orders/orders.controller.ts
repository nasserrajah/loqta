import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendCreated, sendData, sendPaginated } from '../../shared/http/response.js';
import { getAuth } from '../../middleware/auth.middleware.js';
import type { OrdersService } from './orders.service.js';
import type {
  AdminOrderListQuery,
  CreateOrderInput,
  OrderListQuery,
  UpdateOrderStatusInput,
} from './order.schemas.js';

export function createOrdersController(ordersService: OrdersService) {
  return {
    create: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      const input = req.validated.body as CreateOrderInput;
      sendCreated(res, await ordersService.createFromCart(auth.user.id, input));
    }),

    listMine: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      const query = req.validated.query as OrderListQuery;
      const result = await ordersService.listMine(
        auth.user.id,
        query.page,
        query.pageSize,
        query.status,
      );
      sendPaginated(res, result.items, result.meta);
    }),

    getMine: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      const { id } = req.validated.params as { id: string };
      sendData(res, await ordersService.getMine(auth.user.id, id));
    }),

    cancelMine: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      const { id } = req.validated.params as { id: string };
      sendData(res, await ordersService.cancelMine(auth.user.id, id));
    }),

    listAdmin: asyncHandler(async (req: Request, res: Response) => {
      const query = req.validated.query as AdminOrderListQuery;
      const result = await ordersService.listAdmin({
        page: query.page,
        pageSize: query.pageSize,
        status: query.status,
        userId: query.userId,
        search: query.search,
      });
      sendPaginated(res, result.items, result.meta);
    }),

    getAdmin: asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.validated.params as { id: string };
      sendData(res, await ordersService.getAdmin(id));
    }),

    updateStatus: asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.validated.params as { id: string };
      const input = req.validated.body as UpdateOrderStatusInput;
      sendData(res, await ordersService.updateStatus(id, input.status));
    }),
  };
}
