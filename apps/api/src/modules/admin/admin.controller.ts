import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendData, sendPaginated } from '../../shared/http/response.js';
import { getAuth } from '../../middleware/auth.middleware.js';
import type { AdminService } from './admin.service.js';
import type { AdminUsersQuery, UpdateUserRoleInput } from './admin.schemas.js';
import { createCategoriesController } from '../categories/categories.controller.js';
import type { CategoriesService } from '../categories/categories.service.js';
import { createBrandsController } from '../brands/brands.controller.js';
import type { BrandsService } from '../brands/brands.service.js';
import { createProductsController } from '../products/products.controller.js';
import type { ProductsService } from '../products/products.service.js';
import { createOrdersController } from '../orders/orders.controller.js';
import type { OrdersService } from '../orders/orders.service.js';

export interface AdminControllerDependencies {
  adminService: AdminService;
  categoriesService: CategoriesService;
  brandsService: BrandsService;
  productsService: ProductsService;
  ordersService: OrdersService;
}

export function createAdminController(dependencies: AdminControllerDependencies) {
  const { adminService } = dependencies;
  const categories = createCategoriesController(dependencies.categoriesService);
  const brands = createBrandsController(dependencies.brandsService);
  const products = createProductsController(dependencies.productsService);
  const orders = createOrdersController(dependencies.ordersService);

  return {
    stats: asyncHandler(async (_req: Request, res: Response) => {
      sendData(res, await adminService.stats());
    }),

    listUsers: asyncHandler(async (req: Request, res: Response) => {
      const query = req.validated.query as AdminUsersQuery;
      const result = await adminService.listUsers(query.page, query.pageSize, query.search);
      sendPaginated(res, result.items, result.meta);
    }),

    updateUserRole: asyncHandler(async (req: Request, res: Response) => {
      const auth = getAuth(req);
      const { id } = req.validated.params as { id: string };
      const input = req.validated.body as UpdateUserRoleInput;
      sendData(res, await adminService.updateUserRole(id, input.role, auth.user.id));
    }),

    listCategories: categories.adminList,
    createCategory: categories.create,
    updateCategory: categories.update,
    removeCategory: categories.remove,

    listBrands: brands.adminList,
    createBrand: brands.create,
    updateBrand: brands.update,
    removeBrand: brands.remove,

    listProducts: products.listAdmin,
    getProduct: products.getById,
    createProduct: products.create,
    updateProduct: products.update,
    removeProduct: products.remove,

    listOrders: orders.listAdmin,
    getOrder: orders.getAdmin,
    updateOrderStatus: orders.updateStatus,
  };
}
