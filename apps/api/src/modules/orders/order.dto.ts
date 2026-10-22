import { formatMoney } from '../../shared/utils/money.js';
import type { Order, OrderItem } from './order.entity.js';

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  unitPriceCents: number;
  unitPrice: string;
  quantity: number;
  lineTotalCents: number;
  lineTotal: string;
}

export interface OrderDto {
  id: string;
  userId: string;
  status: Order['status'];
  subtotalCents: number;
  subtotal: string;
  shippingCents: number;
  shipping: string;
  taxCents: number;
  tax: string;
  totalCents: number;
  total: string;
  currency: string;
  shippingDetails: {
    fullName: string;
    phone: string;
    address: string;
  };
  notes: string | null;
  items: OrderItemDto[];
  createdAt: string;
  updatedAt: string;
  userEmail?: string;
}

function toOrderItemDto(item: OrderItem): OrderItemDto {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    unitPriceCents: item.unitPriceCents,
    unitPrice: formatMoney(item.unitPriceCents),
    quantity: item.quantity,
    lineTotalCents: item.lineTotalCents,
    lineTotal: formatMoney(item.lineTotalCents),
  };
}

export function toOrderDto(order: Order): OrderDto {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    subtotalCents: order.subtotalCents,
    subtotal: formatMoney(order.subtotalCents),
    shippingCents: order.shippingCents,
    shipping: formatMoney(order.shippingCents),
    taxCents: order.taxCents,
    tax: formatMoney(order.taxCents),
    totalCents: order.totalCents,
    total: formatMoney(order.totalCents),
    currency: order.currency,
    shippingDetails: {
      fullName: order.shippingName,
      phone: order.shippingPhone,
      address: order.shippingAddress,
    },
    notes: order.notes,
    items: order.items.map(toOrderItemDto),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    ...(order.userEmail ? { userEmail: order.userEmail } : {}),
  };
}
