import type {
  BrandRepository,
  CategoryRepository,
  OrderRepository,
  ProductRepository,
  UserRepository,
} from '../../infrastructure/database/repositories/index.js';
import { ORDER_STATUSES, type UserRole } from '../../shared/constants/index.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors/index.js';
import { formatMoney } from '../../shared/utils/money.js';
import { buildPaginationMeta, type PaginationMeta } from '../../shared/utils/pagination.js';
import { toUserDto, type UserDto } from '../users/user.dto.js';

export interface DashboardStatsDto {
  users: { total: number };
  products: { total: number; active: number; lowStock: number };
  categories: { total: number };
  brands: { total: number };
  orders: {
    total: number;
    byStatus: Record<string, number>;
  };
  revenueCents: number;
  revenue: string;
}

export interface AdminUserListResult {
  items: UserDto[];
  meta: PaginationMeta;
}

const LOW_STOCK_THRESHOLD = 5;

export class AdminService {
  constructor(
    private readonly users: UserRepository,
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
    private readonly brands: BrandRepository,
    private readonly orders: OrderRepository,
  ) {}

  async stats(): Promise<DashboardStatsDto> {
    const [
      userCount,
      productCount,
      activeProductCount,
      lowStockCount,
      categoryCount,
      brandCount,
      orderCount,
      revenueCents,
    ] = await Promise.all([
      this.users.count(),
      this.products.count(false),
      this.products.count(true),
      this.products.countLowStock(LOW_STOCK_THRESHOLD),
      this.categories.count(),
      this.brands.count(),
      this.orders.count(),
      this.orders.sumRevenue(),
    ]);

    const statusCounts = await Promise.all(
      ORDER_STATUSES.map(async (status) => ({
        status,
        count: await this.orders.countByStatus(status),
      })),
    );

    return {
      users: { total: userCount },
      products: {
        total: productCount,
        active: activeProductCount,
        lowStock: lowStockCount,
      },
      categories: { total: categoryCount },
      brands: { total: brandCount },
      orders: {
        total: orderCount,
        byStatus: Object.fromEntries(statusCounts.map((entry) => [entry.status, entry.count])),
      },
      revenueCents,
      revenue: formatMoney(revenueCents),
    };
  }

  async listUsers(page: number, pageSize: number, search?: string): Promise<AdminUserListResult> {
    const result = await this.users.list({ page, pageSize, search });
    return {
      items: result.items.map(toUserDto),
      meta: buildPaginationMeta(result.total, page, pageSize),
    };
  }

  async updateUserRole(
    targetUserId: string,
    role: UserRole,
    actorUserId: string,
  ): Promise<UserDto> {
    if (targetUserId === actorUserId) {
      throw new BadRequestError('You cannot change your own role');
    }

    const target = await this.users.findById(targetUserId);
    if (!target) throw new NotFoundError('User not found');

    if (target.role === 'Admin' && role === 'User') {
      const adminCount = await this.users.countAdmins();
      if (adminCount <= 1) {
        throw new ConflictError('Cannot demote the last administrator');
      }
    }

    const updated = await this.users.updateRole(targetUserId, role);
    if (!updated) throw new NotFoundError('User not found');
    return toUserDto(updated);
  }
}
