import type { ProductDto } from '../products/product.dto.js';

export interface CartItemDto {
  id: string;
  product: ProductDto;
  quantity: number;
  unitPriceCents: number;
  unitPrice: string;
  lineTotalCents: number;
  lineTotal: string;
  available: boolean;
}

export interface CartDto {
  id: string;
  items: CartItemDto[];
  itemCount: number;
  subtotalCents: number;
  subtotal: string;
  currency: string;
  updatedAt: string;
}
