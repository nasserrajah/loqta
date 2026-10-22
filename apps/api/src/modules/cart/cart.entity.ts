import type { Product, ProductImage, ProductRelation } from '../products/product.entity.js';

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

export interface Cart {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

export type { Product, ProductImage, ProductRelation };
