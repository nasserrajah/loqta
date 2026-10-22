import type { DatabaseClient } from '../connection/index.js';
import type { OrderStatus } from '../../../shared/constants/index.js';
import { ConflictError } from '../../../shared/errors/index.js';
import type { Order, OrderItem } from '../../../modules/orders/order.entity.js';

interface OrderRow {
  id: string;
  user_id: string;
  status: OrderStatus;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
  created_at: string;
}

export interface CreateOrderInput {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemInput {
  id: string;
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  createdAt: string;
}

export interface ListOrdersOptions {
  page: number;
  pageSize: number;
  status?: OrderStatus;
  userId?: string;
  search?: string;
}

export interface OrderRepository {
  create(
    order: CreateOrderInput,
    items: CreateOrderItemInput[],
    cartId?: string | null,
  ): Promise<Order>;
  findById(id: string): Promise<Order | undefined>;
  findByIdForUser(id: string, userId: string): Promise<Order | undefined>;
  listByUser(
    userId: string,
    page: number,
    pageSize: number,
    status?: OrderStatus,
  ): Promise<{ items: Order[]; total: number }>;
  listAll(options: ListOrdersOptions): Promise<{ items: Order[]; total: number }>;
  updateStatus(
    id: string,
    status: OrderStatus,
    updatedAt: string,
    expectedStatus?: OrderStatus,
  ): Promise<boolean>;
  cancel(id: string, updatedAt: string, expectedStatus?: OrderStatus): Promise<boolean>;
  count(): Promise<number>;
  countByStatus(status: OrderStatus): Promise<number>;
  sumRevenue(): Promise<number>;
}

function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    unitPriceCents: row.unit_price_cents,
    quantity: row.quantity,
    lineTotalCents: row.line_total_cents,
    createdAt: row.created_at,
  };
}

function mapOrder(row: OrderRow, items: OrderItem[]): Order {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    taxCents: row.tax_cents,
    totalCents: row.total_cents,
    currency: row.currency,
    shippingName: row.shipping_name,
    shippingPhone: row.shipping_phone,
    shippingAddress: row.shipping_address,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items,
    userEmail: row.user_email,
  };
}

const ORDER_SELECT = `SELECT o.*, u.email AS user_email
  FROM orders o
  JOIN users u ON u.id = o.user_id`;

export class SqliteOrderRepository implements OrderRepository {
  constructor(private readonly db: DatabaseClient) {}

  private async attachItems(orders: Order[]): Promise<Order[]> {
    if (orders.length === 0) return orders;
    const placeholders = orders.map(() => '?').join(', ');
    const rows = await this.db.all<OrderItemRow>(
      `SELECT * FROM order_items
       WHERE order_id IN (${placeholders})
       ORDER BY created_at ASC`,
      orders.map((order) => order.id),
    );

    const byOrder = new Map<string, OrderItem[]>();
    for (const row of rows) {
      const item = mapOrderItem(row);
      const existing = byOrder.get(item.orderId) ?? [];
      existing.push(item);
      byOrder.set(item.orderId, existing);
    }

    return orders.map((order) => ({ ...order, items: byOrder.get(order.id) ?? [] }));
  }

  async create(
    order: CreateOrderInput,
    items: CreateOrderItemInput[],
    cartId: string | null = null,
  ): Promise<Order> {
    await this.db.transaction(async (tx) => {
      // Reserve stock first. Any shortage throws and rolls the whole transaction back.
      for (const item of items) {
        const result = await tx.run(
          `UPDATE products
           SET stock_quantity = stock_quantity - ?, updated_at = ?
           WHERE id = ? AND is_active = 1 AND stock_quantity >= ?`,
          [item.quantity, order.createdAt, item.productId, item.quantity],
        );
        if (result.changes !== 1) {
          throw new ConflictError(
            `Product ${item.productName} is no longer available in the requested quantity`,
          );
        }
      }

      await tx.run(
        `INSERT INTO orders
          (id, user_id, status, subtotal_cents, shipping_cents, tax_cents, total_cents, currency,
           shipping_name, shipping_phone, shipping_address, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          order.userId,
          order.status,
          order.subtotalCents,
          order.shippingCents,
          order.taxCents,
          order.totalCents,
          order.currency,
          order.shippingName,
          order.shippingPhone,
          order.shippingAddress,
          order.notes,
          order.createdAt,
          order.updatedAt,
        ],
      );

      for (const item of items) {
        await tx.run(
          `INSERT INTO order_items
            (id, order_id, product_id, product_name, unit_price_cents, quantity, line_total_cents, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            order.id,
            item.productId,
            item.productName,
            item.unitPriceCents,
            item.quantity,
            item.lineTotalCents,
            item.createdAt,
          ],
        );
      }

      if (cartId) {
        await tx.run('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
        await tx.run('UPDATE carts SET updated_at = ? WHERE id = ?', [order.createdAt, cartId]);
      }
    });

    const created = await this.findById(order.id);
    if (!created) throw new Error('Order was not persisted');
    return created;
  }

  async cancel(id: string, updatedAt: string, expectedStatus?: OrderStatus): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const current = await tx.get<{ status: OrderStatus }>(
        'SELECT status FROM orders WHERE id = ?',
        [id],
      );
      if (!current || current.status === 'cancelled') return false;
      if (expectedStatus && current.status !== expectedStatus) return false;

      const items = await tx.all<{ product_id: string; quantity: number }>(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [id],
      );

      for (const item of items) {
        await tx.run(
          'UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = ? WHERE id = ?',
          [item.quantity, updatedAt, item.product_id],
        );
      }

      const result = await tx.run(
        'UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND status = ?',
        ['cancelled', updatedAt, id, current.status],
      );
      if (result.changes !== 1) {
        throw new ConflictError('Order status changed; refresh and try again');
      }
      return true;
    });
  }

  async findById(id: string): Promise<Order | undefined> {
    const row = await this.db.get<OrderRow>(`${ORDER_SELECT} WHERE o.id = ?`, [id]);
    if (!row) return undefined;
    const [order] = await this.attachItems([mapOrder(row, [])]);
    return order;
  }

  async findByIdForUser(id: string, userId: string): Promise<Order | undefined> {
    const row = await this.db.get<OrderRow>(`${ORDER_SELECT} WHERE o.id = ? AND o.user_id = ?`, [
      id,
      userId,
    ]);
    if (!row) return undefined;
    const [order] = await this.attachItems([mapOrder(row, [])]);
    return order;
  }

  private buildWhere(options: Omit<ListOrdersOptions, 'page' | 'pageSize'>): {
    where: string;
    parameters: Array<string | number>;
  } {
    const clauses: string[] = [];
    const parameters: Array<string | number> = [];

    if (options.userId) {
      clauses.push('o.user_id = ?');
      parameters.push(options.userId);
    }
    if (options.status) {
      clauses.push('o.status = ?');
      parameters.push(options.status);
    }
    if (options.search) {
      const pattern = `%${options.search.toLowerCase()}%`;
      clauses.push('(LOWER(o.id) LIKE ? OR LOWER(u.email) LIKE ?)');
      parameters.push(pattern, pattern);
    }

    return {
      where: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      parameters,
    };
  }

  async listByUser(
    userId: string,
    page: number,
    pageSize: number,
    status?: OrderStatus,
  ): Promise<{ items: Order[]; total: number }> {
    return this.listAll({ userId, page, pageSize, status });
  }

  async listAll(options: ListOrdersOptions): Promise<{ items: Order[]; total: number }> {
    const { where, parameters } = this.buildWhere(options);
    const totalRow = await this.db.get<{ total: number }>(
      `SELECT COUNT(*) AS total FROM orders o JOIN users u ON u.id = o.user_id ${where}`,
      parameters,
    );
    const rows = await this.db.all<OrderRow>(
      `${ORDER_SELECT}
       ${where}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...parameters, options.pageSize, (options.page - 1) * options.pageSize],
    );

    return {
      items: await this.attachItems(rows.map((row) => mapOrder(row, []))),
      total: totalRow?.total ?? 0,
    };
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    updatedAt: string,
    expectedStatus?: OrderStatus,
  ): Promise<boolean> {
    const result = await this.db.run(
      `UPDATE orders SET status = ?, updated_at = ?
       WHERE id = ?${expectedStatus ? ' AND status = ?' : ''}`,
      expectedStatus ? [status, updatedAt, id, expectedStatus] : [status, updatedAt, id],
    );
    return result.changes === 1;
  }

  async count(): Promise<number> {
    const row = await this.db.get<{ total: number }>('SELECT COUNT(*) AS total FROM orders');
    return row?.total ?? 0;
  }

  async countByStatus(status: OrderStatus): Promise<number> {
    const row = await this.db.get<{ total: number }>(
      'SELECT COUNT(*) AS total FROM orders WHERE status = ?',
      [status],
    );
    return row?.total ?? 0;
  }

  async sumRevenue(): Promise<number> {
    const row = await this.db.get<{ total: number | null }>(
      `SELECT SUM(total_cents) AS total FROM orders
       WHERE status IN ('paid', 'processing', 'shipped', 'delivered')`,
    );
    return row?.total ?? 0;
  }
}
