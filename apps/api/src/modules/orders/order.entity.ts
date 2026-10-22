import type { OrderStatus } from '../../shared/constants/index.js';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  createdAt: string;
}

export interface Order {
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
  items: OrderItem[];
  userEmail?: string;
}

export interface ShippingDetails {
  fullName: string;
  phone: string;
  address: string;
  notes?: string;
}
