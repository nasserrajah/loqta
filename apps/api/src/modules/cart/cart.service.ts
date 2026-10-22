import type {
  CartRecord,
  CartRepository,
  ProductRepository,
} from '../../infrastructure/database/repositories/index.js';
import { CART_MAX_QUANTITY, DEFAULT_CURRENCY } from '../../shared/constants/index.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
import { formatMoney } from '../../shared/utils/money.js';
import { toProductDto } from '../products/product.dto.js';
import type { Product } from '../products/product.entity.js';
import type { CartDto } from './cart.dto.js';

export class CartService {
  constructor(
    private readonly carts: CartRepository,
    private readonly products: ProductRepository,
  ) {}

  private async loadProducts(record: CartRecord): Promise<Map<string, Product>> {
    const products = await this.products.findByIds(
      record.items.map((item) => item.productId),
      true,
    );
    return new Map(products.map((product) => [product.id, product]));
  }

  private async toDto(record: CartRecord): Promise<CartDto> {
    const products = await this.loadProducts(record);
    let subtotalCents = 0;
    let itemCount = 0;
    let currency = DEFAULT_CURRENCY;

    const items = record.items.flatMap((item) => {
      const product = products.get(item.productId);
      if (!product) return [];

      const available = product.isActive && product.stockQuantity >= item.quantity;
      const lineTotalCents = product.priceCents * item.quantity;
      if (available) {
        subtotalCents += lineTotalCents;
        itemCount += item.quantity;
      }
      currency = product.currency;

      return [
        {
          id: item.id,
          product: toProductDto(product),
          quantity: item.quantity,
          unitPriceCents: product.priceCents,
          unitPrice: formatMoney(product.priceCents),
          lineTotalCents,
          lineTotal: formatMoney(lineTotalCents),
          available,
        },
      ];
    });

    return {
      id: record.id,
      items,
      itemCount,
      subtotalCents,
      subtotal: formatMoney(subtotalCents),
      currency,
      updatedAt: record.updatedAt,
    };
  }

  async getCart(userId: string): Promise<CartDto> {
    return this.toDto(await this.carts.getOrCreate(userId));
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<CartDto> {
    const product = await this.products.findById(productId, false);
    if (!product) throw new NotFoundError('Product not found');
    if (product.stockQuantity === 0) throw new ConflictError('Product is out of stock');

    const cart = await this.carts.getOrCreate(userId);
    const existing = await this.carts.findItemByProduct(cart.id, productId);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;

    if (nextQuantity > CART_MAX_QUANTITY) {
      throw new ConflictError(`Maximum quantity per item is ${CART_MAX_QUANTITY}`);
    }
    if (nextQuantity > product.stockQuantity) {
      throw new ConflictError(`Only ${product.stockQuantity} unit(s) are available`);
    }

    if (existing) {
      await this.carts.updateItemQuantity(cart.id, existing.id, nextQuantity);
    } else {
      await this.carts.addItem(cart.id, productId, quantity);
    }

    return this.toDto(await this.carts.getOrCreate(userId));
  }

  async updateItem(userId: string, itemId: string, quantity: number): Promise<CartDto> {
    const cart = await this.carts.getOrCreate(userId);
    const item = await this.carts.findItem(cart.id, itemId);
    if (!item) throw new NotFoundError('Cart item not found');

    const product = await this.products.findById(item.productId, false);
    if (!product) throw new NotFoundError('Product not found');
    if (product.stockQuantity < quantity) {
      throw new ConflictError(`Only ${product.stockQuantity} unit(s) are available`);
    }

    await this.carts.updateItemQuantity(cart.id, itemId, quantity);
    return this.toDto(await this.carts.getOrCreate(userId));
  }

  async removeItem(userId: string, itemId: string): Promise<CartDto> {
    const cart = await this.carts.getOrCreate(userId);
    const removed = await this.carts.removeItem(cart.id, itemId);
    if (!removed) throw new NotFoundError('Cart item not found');
    return this.toDto(await this.carts.getOrCreate(userId));
  }

  async clear(userId: string): Promise<void> {
    const cart = await this.carts.getOrCreate(userId);
    await this.carts.clear(cart.id);
  }
}
