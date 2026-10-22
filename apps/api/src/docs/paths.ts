import { errorResponses } from './schemas/index.js';

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const auth = [{ cookieAuth: [] }, { bearerAuth: [] }];

const dataResponse = (schema: unknown, description = 'Success') => ({
  description,
  content: {
    'application/json': {
      schema: { type: 'object', required: ['data'], properties: { data: schema } },
    },
  },
});

const paginatedResponse = (schema: unknown, description = 'Success') => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: { type: 'array', items: schema },
          meta: ref('PaginationMeta'),
        },
      },
    },
  },
});

const jsonBody = (schema: unknown) => ({
  required: true,
  content: { 'application/json': { schema } },
});

const idParam = (name = 'id') => ({
  name,
  in: 'path',
  required: true,
  schema: { type: 'string' },
});

const pageParam = {
  name: 'page',
  in: 'query',
  schema: { type: 'integer', minimum: 1, default: 1 },
};

const pageSizeParam = {
  name: 'pageSize',
  in: 'query',
  schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
};

const productQueryParameters = [
  pageParam,
  pageSizeParam,
  { name: 'search', in: 'query', schema: { type: 'string' } },
  { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Category id or slug' },
  { name: 'brand', in: 'query', schema: { type: 'string' }, description: 'Brand id or slug' },
  { name: 'minPrice', in: 'query', schema: { type: 'number', minimum: 0 } },
  { name: 'maxPrice', in: 'query', schema: { type: 'number', minimum: 0 } },
  { name: 'inStock', in: 'query', schema: { type: 'boolean' } },
  { name: 'featured', in: 'query', schema: { type: 'boolean' } },
  {
    name: 'sort',
    in: 'query',
    schema: {
      type: 'string',
      enum: ['newest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'name_desc'],
      default: 'newest',
    },
  },
];

const orderStatusParam = {
  name: 'status',
  in: 'query',
  schema: {
    type: 'string',
    enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
  },
};

export const paths = {
  '/health': {
    get: {
      tags: ['System'],
      summary: 'Health check',
      responses: {
        '200': dataResponse(ref('HealthStatus')),
      },
    },
  },

  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a customer account',
      requestBody: jsonBody(ref('RegisterRequest')),
      responses: {
        '201': dataResponse(ref('AuthResponse'), 'Account created and session established'),
        '400': errorResponses.BadRequest,
        '409': errorResponses.Conflict,
        '429': errorResponses.TooManyRequests,
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Log in and establish a session',
      requestBody: jsonBody(ref('LoginRequest')),
      responses: {
        '200': dataResponse(ref('AuthResponse')),
        '400': errorResponses.BadRequest,
        '401': errorResponses.Unauthorized,
        '429': errorResponses.TooManyRequests,
      },
    },
  },
  '/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Log out and clear the session cookie',
      responses: { '204': { description: 'Session removed' } },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Get the current authenticated user',
      security: auth,
      responses: {
        '200': dataResponse(ref('User')),
        '401': errorResponses.Unauthorized,
      },
    },
  },
  '/auth/sessions': {
    get: {
      tags: ['Auth'],
      summary: 'List active sessions for the current user',
      security: auth,
      responses: {
        '200': dataResponse({ type: 'array', items: ref('Session') }),
        '401': errorResponses.Unauthorized,
      },
    },
  },
  '/auth/sessions/{id}': {
    delete: {
      tags: ['Auth'],
      summary: 'Revoke one of the current user sessions',
      security: auth,
      parameters: [idParam()],
      responses: {
        '204': { description: 'Session revoked' },
        '401': errorResponses.Unauthorized,
        '404': errorResponses.NotFound,
      },
    },
  },
  '/auth/forgot-password': {
    post: {
      tags: ['Auth'],
      summary: 'Request a password reset link',
      description:
        'Always returns 202 to avoid account enumeration. In development/test the reset token is included in the response because no email provider is configured.',
      requestBody: jsonBody(ref('ForgotPasswordRequest')),
      responses: {
        '202': dataResponse(ref('ForgotPasswordResult'), 'Request accepted'),
        '400': errorResponses.BadRequest,
        '429': errorResponses.TooManyRequests,
      },
    },
  },
  '/auth/reset-password': {
    post: {
      tags: ['Auth'],
      summary: 'Reset a password using a single-use token',
      requestBody: jsonBody(ref('ResetPasswordRequest')),
      responses: {
        '200': dataResponse(ref('Message')),
        '400': errorResponses.BadRequest,
        '429': errorResponses.TooManyRequests,
      },
    },
  },

  '/users/me': {
    get: {
      tags: ['Users'],
      summary: 'Get the current profile',
      security: auth,
      responses: {
        '200': dataResponse(ref('User')),
        '401': errorResponses.Unauthorized,
      },
    },
    patch: {
      tags: ['Users'],
      summary: 'Update the current profile',
      security: auth,
      requestBody: jsonBody(ref('UpdateProfileRequest')),
      responses: {
        '200': dataResponse(ref('User')),
        '400': errorResponses.BadRequest,
        '401': errorResponses.Unauthorized,
      },
    },
  },
  '/users/me/password': {
    put: {
      tags: ['Users'],
      summary: 'Change the current password',
      description: 'Revokes every other session after a successful change.',
      security: auth,
      requestBody: jsonBody(ref('ChangePasswordRequest')),
      responses: {
        '200': dataResponse(ref('Message')),
        '400': errorResponses.BadRequest,
        '401': errorResponses.Unauthorized,
      },
    },
  },

  '/categories': {
    get: {
      tags: ['Catalog'],
      summary: 'List active categories with product counts',
      responses: {
        '200': dataResponse({ type: 'array', items: ref('Category') }),
      },
    },
  },
  '/categories/{slug}': {
    get: {
      tags: ['Catalog'],
      summary: 'Get a category by slug',
      parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        '200': dataResponse(ref('Category')),
        '404': errorResponses.NotFound,
      },
    },
  },
  '/brands': {
    get: {
      tags: ['Catalog'],
      summary: 'List active brands with product counts',
      responses: {
        '200': dataResponse({ type: 'array', items: ref('Brand') }),
      },
    },
  },
  '/brands/{slug}': {
    get: {
      tags: ['Catalog'],
      summary: 'Get a brand by slug',
      parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        '200': dataResponse(ref('Brand')),
        '404': errorResponses.NotFound,
      },
    },
  },
  '/products': {
    get: {
      tags: ['Catalog'],
      summary: 'Search, filter, sort, and paginate active products',
      parameters: productQueryParameters,
      responses: {
        '200': paginatedResponse(ref('Product')),
        '400': errorResponses.BadRequest,
      },
    },
  },
  '/products/{slug}': {
    get: {
      tags: ['Catalog'],
      summary: 'Get an active product by slug',
      parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        '200': dataResponse(ref('Product')),
        '404': errorResponses.NotFound,
      },
    },
  },

  '/favorites': {
    get: {
      tags: ['Favorites'],
      summary: 'List favorite products',
      security: auth,
      parameters: [pageParam, pageSizeParam],
      responses: {
        '200': paginatedResponse(ref('Product')),
        '401': errorResponses.Unauthorized,
      },
    },
  },
  '/favorites/{productId}': {
    post: {
      tags: ['Favorites'],
      summary: 'Add a product to favorites (idempotent)',
      security: auth,
      parameters: [idParam('productId')],
      responses: {
        '201': dataResponse(ref('FavoriteState')),
        '401': errorResponses.Unauthorized,
        '404': errorResponses.NotFound,
      },
    },
    delete: {
      tags: ['Favorites'],
      summary: 'Remove a product from favorites (idempotent)',
      security: auth,
      parameters: [idParam('productId')],
      responses: {
        '204': { description: 'Removed' },
        '401': errorResponses.Unauthorized,
      },
    },
  },

  '/cart': {
    get: {
      tags: ['Cart'],
      summary: 'Get the current cart with server-calculated totals',
      security: auth,
      responses: {
        '200': dataResponse(ref('Cart')),
        '401': errorResponses.Unauthorized,
      },
    },
    delete: {
      tags: ['Cart'],
      summary: 'Remove every cart item',
      security: auth,
      responses: {
        '204': { description: 'Cart cleared' },
        '401': errorResponses.Unauthorized,
      },
    },
  },
  '/cart/items': {
    post: {
      tags: ['Cart'],
      summary: 'Add a product or increase its quantity',
      security: auth,
      requestBody: jsonBody(ref('AddCartItemRequest')),
      responses: {
        '200': dataResponse(ref('Cart')),
        '400': errorResponses.BadRequest,
        '401': errorResponses.Unauthorized,
        '404': errorResponses.NotFound,
        '409': errorResponses.Conflict,
      },
    },
  },
  '/cart/items/{itemId}': {
    patch: {
      tags: ['Cart'],
      summary: 'Set a cart item quantity',
      security: auth,
      parameters: [idParam('itemId')],
      requestBody: jsonBody(ref('UpdateCartItemRequest')),
      responses: {
        '200': dataResponse(ref('Cart')),
        '400': errorResponses.BadRequest,
        '401': errorResponses.Unauthorized,
        '404': errorResponses.NotFound,
        '409': errorResponses.Conflict,
      },
    },
    delete: {
      tags: ['Cart'],
      summary: 'Remove one cart item',
      security: auth,
      parameters: [idParam('itemId')],
      responses: {
        '200': dataResponse(ref('Cart')),
        '401': errorResponses.Unauthorized,
        '404': errorResponses.NotFound,
      },
    },
  },

  '/orders': {
    post: {
      tags: ['Orders'],
      summary: 'Create an order from the current cart',
      description:
        'Prices, shipping, tax, and totals are calculated on the server. Stock is reserved atomically and the cart is cleared.',
      security: auth,
      requestBody: jsonBody(ref('CreateOrderRequest')),
      responses: {
        '201': dataResponse(ref('Order')),
        '400': errorResponses.BadRequest,
        '401': errorResponses.Unauthorized,
        '409': errorResponses.Conflict,
      },
    },
    get: {
      tags: ['Orders'],
      summary: 'List the current user orders',
      security: auth,
      parameters: [pageParam, pageSizeParam, orderStatusParam],
      responses: {
        '200': paginatedResponse(ref('Order')),
        '401': errorResponses.Unauthorized,
      },
    },
  },
  '/orders/{id}': {
    get: {
      tags: ['Orders'],
      summary: 'Get one of the current user orders',
      security: auth,
      parameters: [idParam()],
      responses: {
        '200': dataResponse(ref('Order')),
        '401': errorResponses.Unauthorized,
        '404': errorResponses.NotFound,
      },
    },
  },
  '/orders/{id}/cancel': {
    post: {
      tags: ['Orders'],
      summary: 'Cancel a pending order and restore stock',
      security: auth,
      parameters: [idParam()],
      responses: {
        '200': dataResponse(ref('Order')),
        '401': errorResponses.Unauthorized,
        '404': errorResponses.NotFound,
        '409': errorResponses.Conflict,
      },
    },
  },

  '/admin/stats': {
    get: {
      tags: ['Admin'],
      summary: 'Dashboard statistics',
      security: auth,
      responses: {
        '200': dataResponse(ref('DashboardStats')),
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
      },
    },
  },
  '/admin/users': {
    get: {
      tags: ['Admin'],
      summary: 'List users',
      security: auth,
      parameters: [
        pageParam,
        pageSizeParam,
        { name: 'search', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        '200': paginatedResponse(ref('User')),
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
      },
    },
  },
  '/admin/users/{id}/role': {
    patch: {
      tags: ['Admin'],
      summary: 'Change a user role',
      description: 'Administrators cannot change their own role.',
      security: auth,
      parameters: [idParam()],
      requestBody: jsonBody(ref('UpdateUserRoleRequest')),
      responses: {
        '200': dataResponse(ref('User')),
        '400': errorResponses.BadRequest,
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
        '404': errorResponses.NotFound,
        '409': errorResponses.Conflict,
      },
    },
  },
  '/admin/categories': {
    get: {
      tags: ['Admin'],
      summary: 'List all categories, including inactive ones',
      security: auth,
      responses: {
        '200': dataResponse({ type: 'array', items: ref('Category') }),
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
      },
    },
    post: {
      tags: ['Admin'],
      summary: 'Create a category',
      security: auth,
      requestBody: jsonBody(ref('CreateCategoryRequest')),
      responses: {
        '201': dataResponse(ref('Category')),
        '400': errorResponses.BadRequest,
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
        '409': errorResponses.Conflict,
      },
    },
  },
  '/admin/categories/{id}': {
    patch: {
      tags: ['Admin'],
      summary: 'Update a category',
      security: auth,
      parameters: [idParam()],
      requestBody: jsonBody(ref('UpdateCategoryRequest')),
      responses: {
        '200': dataResponse(ref('Category')),
        '400': errorResponses.BadRequest,
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
        '404': errorResponses.NotFound,
        '409': errorResponses.Conflict,
      },
    },
    delete: {
      tags: ['Admin'],
      summary: 'Delete an empty category',
      security: auth,
      parameters: [idParam()],
      responses: {
        '204': { description: 'Deleted' },
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
        '404': errorResponses.NotFound,
        '409': errorResponses.Conflict,
      },
    },
  },
  '/admin/brands': {
    get: {
      tags: ['Admin'],
      summary: 'List all brands, including inactive ones',
      security: auth,
      responses: {
        '200': dataResponse({ type: 'array', items: ref('Brand') }),
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
      },
    },
    post: {
      tags: ['Admin'],
      summary: 'Create a brand',
      security: auth,
      requestBody: jsonBody(ref('CreateBrandRequest')),
      responses: {
        '201': dataResponse(ref('Brand')),
        '400': errorResponses.BadRequest,
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
        '409': errorResponses.Conflict,
      },
    },
  },
  '/admin/brands/{id}': {
    patch: {
      tags: ['Admin'],
      summary: 'Update a brand',
      security: auth,
      parameters: [idParam()],
      requestBody: jsonBody(ref('UpdateBrandRequest')),
      responses: {
        '200': dataResponse(ref('Brand')),
        '400': errorResponses.BadRequest,
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
        '404': errorResponses.NotFound,
        '409': errorResponses.Conflict,
      },
    },
    delete: {
      tags: ['Admin'],
      summary: 'Delete an empty brand',
      security: auth,
      parameters: [idParam()],
      responses: {
        '204': { description: 'Deleted' },
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
        '404': errorResponses.NotFound,
        '409': errorResponses.Conflict,
      },
    },
  },
  '/admin/products': {
    get: {
      tags: ['Admin'],
      summary: 'List products including inactive ones',
      security: auth,
      parameters: productQueryParameters,
      responses: {
        '200': paginatedResponse(ref('Product')),
        '400': errorResponses.BadRequest,
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
      },
    },
    post: {
      tags: ['Admin'],
      summary: 'Create a product',
      security: auth,
      requestBody: jsonBody(ref('CreateProductRequest')),
      responses: {
        '201': dataResponse(ref('Product')),
        '400': errorResponses.BadRequest,
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
        '404': errorResponses.NotFound,
        '409': errorResponses.Conflict,
      },
    },
  },
  '/admin/products/{id}': {
    get: {
      tags: ['Admin'],
      summary: 'Get a product by id, including inactive products',
      security: auth,
      parameters: [idParam()],
      responses: {
        '200': dataResponse(ref('Product')),
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
        '404': errorResponses.NotFound,
      },
    },
    patch: {
      tags: ['Admin'],
      summary: 'Update a product',
      security: auth,
      parameters: [idParam()],
      requestBody: jsonBody(ref('UpdateProductRequest')),
      responses: {
        '200': dataResponse(ref('Product')),
        '400': errorResponses.BadRequest,
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
        '404': errorResponses.NotFound,
        '409': errorResponses.Conflict,
      },
    },
    delete: {
      tags: ['Admin'],
      summary: 'Deactivate a product',
      description: 'Products are soft-deleted to preserve order history.',
      security: auth,
      parameters: [idParam()],
      responses: {
        '204': { description: 'Product deactivated' },
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
        '404': errorResponses.NotFound,
      },
    },
  },
  '/admin/orders': {
    get: {
      tags: ['Admin'],
      summary: 'List all orders',
      security: auth,
      parameters: [
        pageParam,
        pageSizeParam,
        orderStatusParam,
        { name: 'userId', in: 'query', schema: { type: 'string' } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        '200': paginatedResponse(ref('Order')),
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
      },
    },
  },
  '/admin/orders/{id}': {
    get: {
      tags: ['Admin'],
      summary: 'Get any order by id',
      security: auth,
      parameters: [idParam()],
      responses: {
        '200': dataResponse(ref('Order')),
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
        '404': errorResponses.NotFound,
      },
    },
  },
  '/admin/orders/{id}/status': {
    patch: {
      tags: ['Admin'],
      summary: 'Advance or cancel an order',
      description:
        'Allowed transitions: pending→paid/cancelled, paid→processing/cancelled, processing→shipped/cancelled, shipped→delivered. Cancellation restores stock.',
      security: auth,
      parameters: [idParam()],
      requestBody: jsonBody(ref('UpdateOrderStatusRequest')),
      responses: {
        '200': dataResponse(ref('Order')),
        '400': errorResponses.BadRequest,
        '401': errorResponses.Unauthorized,
        '403': errorResponses.Forbidden,
        '404': errorResponses.NotFound,
        '409': errorResponses.Conflict,
      },
    },
  },
} as const;
