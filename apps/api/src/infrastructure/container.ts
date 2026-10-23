import type { Logger } from 'pino';
import type { Env } from '../config/env.js';
import { ConsoleEmailSender, type EmailSender } from './email/index.js';
import { BcryptPasswordHasher, type PasswordHasher } from './security/index.js';
import {
  SqliteBrandRepository,
  SqliteCartRepository,
  SqliteCategoryRepository,
  SqliteFavoriteRepository,
  SqliteOrderRepository,
  SqlitePasswordResetRepository,
  SqliteProductRepository,
  SqliteSessionRepository,
  SqliteUserRepository,
  type BrandRepository,
  type CartRepository,
  type CategoryRepository,
  type FavoriteRepository,
  type OrderRepository,
  type PasswordResetRepository,
  type ProductRepository,
  type SessionRepository,
  type UserRepository,
} from './database/repositories/index.js';
import type { DatabaseClient } from './database/connection/index.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { UsersService } from '../modules/users/users.service.js';
import { CategoriesService } from '../modules/categories/categories.service.js';
import { BrandsService } from '../modules/brands/brands.service.js';
import { ProductsService } from '../modules/products/products.service.js';
import { FavoritesService } from '../modules/favorites/favorites.service.js';
import { CartService } from '../modules/cart/cart.service.js';
import { OrdersService } from '../modules/orders/orders.service.js';
import { AdminService } from '../modules/admin/admin.service.js';

export interface Repositories {
  users: UserRepository;
  sessions: SessionRepository;
  passwordResets: PasswordResetRepository;
  categories: CategoryRepository;
  brands: BrandRepository;
  products: ProductRepository;
  favorites: FavoriteRepository;
  carts: CartRepository;
  orders: OrderRepository;
}

export interface Services {
  auth: AuthService;
  users: UsersService;
  categories: CategoriesService;
  brands: BrandsService;
  products: ProductsService;
  favorites: FavoritesService;
  cart: CartService;
  orders: OrdersService;
  admin: AdminService;
}

export interface Container {
  env: Env;
  logger: Logger;
  db: DatabaseClient;
  passwordHasher: PasswordHasher;
  emailSender: EmailSender;
  repositories: Repositories;
  services: Services;
}

export interface CreateContainerOptions {
  db: DatabaseClient;
  env: Env;
  logger?: Logger;
}

/**
 * Minimal logger used when no logger is provided. The Node entrypoint injects
 * a pino logger; the Workers entrypoint injects a console-based logger.
 */
const fallbackLogger = {
  info: (...args: unknown[]) => console.info(...args),
  error: (...args: unknown[]) => console.error(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  debug: (...args: unknown[]) => console.debug(...args),
  trace: (...args: unknown[]) => console.trace(...args),
  fatal: (...args: unknown[]) => console.error(...args),
  child: () => fallbackLogger,
} as unknown as Logger;

/**
 * Composition root. Domain services receive interfaces, never the SQLite driver,
 * so a D1 adapter can replace the local database without touching the modules.
 */
export function createContainer({
  db,
  env,
  logger = fallbackLogger,
}: CreateContainerOptions): Container {
  const repositories: Repositories = {
    users: new SqliteUserRepository(db),
    sessions: new SqliteSessionRepository(db),
    passwordResets: new SqlitePasswordResetRepository(db),
    categories: new SqliteCategoryRepository(db),
    brands: new SqliteBrandRepository(db),
    products: new SqliteProductRepository(db),
    favorites: new SqliteFavoriteRepository(db),
    carts: new SqliteCartRepository(db),
    orders: new SqliteOrderRepository(db),
  };

  const passwordHasher = new BcryptPasswordHasher(env.BCRYPT_ROUNDS);
  const emailSender = new ConsoleEmailSender(logger);

  const auth = new AuthService(
    repositories.users,
    repositories.sessions,
    repositories.passwordResets,
    passwordHasher,
    emailSender,
    {
      sessionTtlDays: env.SESSION_TTL_DAYS,
      passwordResetTtlMinutes: env.PASSWORD_RESET_TTL_MINUTES,
      appUrl: env.APP_URL,
      exposeResetToken: env.NODE_ENV !== 'production',
    },
  );

  const users = new UsersService(repositories.users, repositories.sessions, passwordHasher);
  const categories = new CategoriesService(repositories.categories);
  const brands = new BrandsService(repositories.brands);
  const products = new ProductsService(
    repositories.products,
    repositories.categories,
    repositories.brands,
  );
  const favorites = new FavoritesService(repositories.favorites, repositories.products);
  const cart = new CartService(repositories.carts, repositories.products);
  const orders = new OrdersService(repositories.orders, repositories.carts, repositories.products);
  const admin = new AdminService(
    repositories.users,
    repositories.products,
    repositories.categories,
    repositories.brands,
    repositories.orders,
  );

  return {
    env,
    logger,
    db,
    passwordHasher,
    emailSender,
    repositories,
    services: { auth, users, categories, brands, products, favorites, cart, orders, admin },
  };
}