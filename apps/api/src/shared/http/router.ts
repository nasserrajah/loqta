import { Router } from 'express';
import type { Container } from '../../infrastructure/container.js';
import { healthRouter } from './health.routes.js';
import { docsRouter } from './docs.routes.js';
import { createAuthRouter } from '../../modules/auth/auth.routes.js';
import { createUsersRouter } from '../../modules/users/users.routes.js';
import { createCategoriesRouter } from '../../modules/categories/categories.routes.js';
import { createBrandsRouter } from '../../modules/brands/brands.routes.js';
import { createProductsRouter } from '../../modules/products/products.routes.js';
import { createFavoritesRouter } from '../../modules/favorites/favorites.routes.js';
import { createCartRouter } from '../../modules/cart/cart.routes.js';
import { createOrdersRouter } from '../../modules/orders/orders.routes.js';
import { createAdminRouter } from '../../modules/admin/admin.routes.js';

export function createApiRouter(container: Container): Router {
  const router = Router();
  const { auth, users, categories, brands, products, favorites, cart, orders, admin } =
    container.services;

  router.use(healthRouter);
  router.use(docsRouter);

  router.use(
    '/auth',
    createAuthRouter({
      authService: auth,
      usersService: users,
      env: container.env,
    }),
  );

  router.use('/users', createUsersRouter({ authService: auth, usersService: users }));

  router.use('/categories', createCategoriesRouter(categories));
  router.use('/brands', createBrandsRouter(brands));
  router.use('/products', createProductsRouter(products));

  router.use(
    '/favorites',
    createFavoritesRouter({ authService: auth, favoritesService: favorites }),
  );
  router.use('/cart', createCartRouter({ authService: auth, cartService: cart }));
  router.use('/orders', createOrdersRouter({ authService: auth, ordersService: orders }));

  router.use(
    '/admin',
    createAdminRouter({
      authService: auth,
      adminService: admin,
      categoriesService: categories,
      brandsService: brands,
      productsService: products,
      ordersService: orders,
    }),
  );

  return router;
}
