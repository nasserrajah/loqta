import type {
  CartRepository,
  OrderRepository,
  ProductRepository,
} from '../../infrastructure/database/repositories/index.js';
import {
  DEFAULT_CURRENCY,
  FREE_SHIPPING_THRESHOLD_CENTS,
  SHIPPING_FLAT_CENTS,
  TAX_RATE_PERCENT,
  type OrderStatus,
} from '../../shared/constants/index.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors/index.js';
import { newId } from '../../shared/utils/crypto.js';
import { nowIso } from '../../shared/utils/date.js';
import { buildPaginationMeta, type PaginationMeta } from '../../shared/utils/pagination.js';
import type { Product } from '../products/product.entity.js';
import { toOrderDto, type OrderDto } from './order.dto.js';
import type { CreateOrderInput } from './order.schemas.js';
import type { Order } from './order.entity.js';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export interface OrderListResultDto {
  items: OrderDto[];
  meta: PaginationMeta;
}

export class OrdersService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly carts: CartRepository,
    private readonly products: ProductRepository,
  ) {}

  private requireProduct(productsById: Map<string, Product>, productId: string): Product {
    const product = productsById.get(productId);
    if (!product || !product.isActive) {
      throw new ConflictError('A product in your cart is no longer available');
    }
    return product;
  }

  async createFromCart(userId: string, input: CreateOrderInput): Promise<OrderDto> {
    const cart = await this.carts.findByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestError('Cart is empty');
    }

    const products = await this.products.findByIds(
      cart.items.map((item) => item.productId),
      true,
    );
    const productsById = new Map(products.map((product) => [product.id, product]));

    let subtotalCents = 0;
    let currency: string | undefined;
    const timestamp = nowIso();
    const items = cart.items.map((cartItem) => {
      const product = this.requireProduct(productsById, cartItem.productId);
      if (product.stockQuantity < cartItem.quantity) {
        throw new ConflictError(
          `Only ${product.stockQuantity} unit(s) of ${product.name} are available`,
        );
      }

      if (currency !== undefined && currency !== product.currency) {
        throw new ConflictError('Cart contains products with different currencies');
      }
      currency = product.currency;
      const lineTotalCents = product.priceCents * cartItem.quantity;
      subtotalCents += lineTotalCents;

      return {
        id: newId(),
        productId: product.id,
        productName: product.name,
        unitPriceCents: product.priceCents,
        quantity: cartItem.quantity,
        lineTotalCents,
        createdAt: timestamp,
      };
    });

    const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS;
    const taxCents = Math.round((subtotalCents * TAX_RATE_PERCENT) / 100);
    const totalCents = subtotalCents + shippingCents + taxCents;

    const order: Order = await this.orders.create(
      {
        id: newId(),
        userId,
        status: 'pending',
        subtotalCents,
        shippingCents,
        taxCents,
        totalCents,
        currency: currency ?? DEFAULT_CURRENCY,
        shippingName: input.shippingName,
        shippingPhone: input.shippingPhone,
        shippingAddress: input.shippingAddress,
        notes: input.notes ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      items,
      cart.id,
    );

    return toOrderDto(order);
  }

  async listMine(
    userId: string,
    page: number,
    pageSize: number,
    status?: OrderStatus,
  ): Promise<OrderListResultDto> {
    const result = await this.orders.listByUser(userId, page, pageSize, status);
    return {
      items: result.items.map(toOrderDto),
      meta: buildPaginationMeta(result.total, page, pageSize),
    };
  }

  async getMine(userId: string, orderId: string): Promise<OrderDto> {
    const order = await this.orders.findByIdForUser(orderId, userId);
    if (!order) throw new NotFoundError('Order not found');
    return toOrderDto(order);
  }

  async cancelMine(userId: string, orderId: string): Promise<OrderDto> {
    const order = await this.orders.findByIdForUser(orderId, userId);
    if (!order) throw new NotFoundError('Order not found');
    if (order.status !== 'pending') {
      throw new ConflictError('Only pending orders can be cancelled');
    }

    const cancelled = await this.orders.cancel(orderId, nowIso(), 'pending');
    if (!cancelled) {
      throw new ConflictError('Only pending orders can be cancelled');
    }
    const updated = await this.orders.findById(orderId);
    if (!updated) throw new NotFoundError('Order not found');
    return toOrderDto(updated);
  }

  async listAdmin(options: {
    page: number;
    pageSize: number;
    status?: OrderStatus;
    userId?: string;
    search?: string;
  }): Promise<OrderListResultDto> {
    const result = await this.orders.listAll(options);
    return {
      items: result.items.map(toOrderDto),
      meta: buildPaginationMeta(result.total, options.page, options.pageSize),
    };
  }

  async getAdmin(orderId: string): Promise<OrderDto> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    return toOrderDto(order);
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<OrderDto> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (order.status === status) return toOrderDto(order);

    if (!ALLOWED_TRANSITIONS[order.status].includes(status)) {
      throw new ConflictError(`Cannot change order status from ${order.status} to ${status}`);
    }

    if (status === 'cancelled') {
      const cancelled = await this.orders.cancel(orderId, nowIso(), order.status);
      if (!cancelled) {
        throw new ConflictError('Order status changed; refresh and try again');
      }
    } else {
      const updated = await this.orders.updateStatus(orderId, status, nowIso(), order.status);
      if (!updated) {
        throw new ConflictError('Order status changed; refresh and try again');
      }
    }

    const updated = await this.orders.findById(orderId);
    if (!updated) throw new NotFoundError('Order not found');
    return toOrderDto(updated);
  }
}
