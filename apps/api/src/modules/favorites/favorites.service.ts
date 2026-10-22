import type {
  FavoriteRepository,
  ProductRepository,
} from '../../infrastructure/database/repositories/index.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { buildPaginationMeta, type PaginationMeta } from '../../shared/utils/pagination.js';
import { toProductDto, type ProductDto } from '../products/product.dto.js';

export interface FavoriteListResult {
  items: ProductDto[];
  meta: PaginationMeta;
}

export class FavoritesService {
  constructor(
    private readonly favorites: FavoriteRepository,
    private readonly products: ProductRepository,
  ) {}

  private async requireActiveProduct(productId: string): Promise<void> {
    const product = await this.products.findById(productId, false);
    if (!product) throw new NotFoundError('Product not found');
  }

  async list(userId: string, page: number, pageSize: number): Promise<FavoriteListResult> {
    const { productIds, total } = await this.favorites.listProductIds(userId, page, pageSize);
    const products = await this.products.findByIds(productIds, false);
    const byId = new Map(products.map((product) => [product.id, product]));
    const items = productIds
      .map((id) => byId.get(id))
      .filter((product): product is NonNullable<typeof product> => Boolean(product))
      .map(toProductDto);

    return { items, meta: buildPaginationMeta(total, page, pageSize) };
  }

  async add(userId: string, productId: string): Promise<{ productId: string; isFavorite: true }> {
    await this.requireActiveProduct(productId);
    await this.favorites.add(userId, productId);
    return { productId, isFavorite: true };
  }

  async remove(userId: string, productId: string): Promise<void> {
    await this.favorites.remove(userId, productId);
  }
}
