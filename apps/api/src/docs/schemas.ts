const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const money = { type: 'string', example: '99.99' };

export const securitySchemes = {
  cookieAuth: {
    type: 'apiKey',
    in: 'cookie',
    name: 'loqta_session',
    description: 'HttpOnly session cookie set by /auth/register or /auth/login.',
  },
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    description: 'Session token for API clients. The same token is stored in the cookie.',
  },
} as const;

export const schemas = {
  Error: {
    type: 'object',
    required: ['error'],
    properties: {
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', example: 'NOT_FOUND' },
          message: { type: 'string', example: 'Resource not found' },
          details: {},
          requestId: { type: 'string', format: 'uuid' },
        },
      },
    },
  },
  PaginationMeta: {
    type: 'object',
    required: ['page', 'pageSize', 'total', 'totalPages', 'hasNextPage', 'hasPreviousPage'],
    properties: {
      page: { type: 'integer', example: 1 },
      pageSize: { type: 'integer', example: 20 },
      total: { type: 'integer', example: 27 },
      totalPages: { type: 'integer', example: 2 },
      hasNextPage: { type: 'boolean' },
      hasPreviousPage: { type: 'boolean' },
    },
  },
  HealthStatus: {
    type: 'object',
    required: ['status', 'uptimeSeconds', 'timestamp'],
    properties: {
      status: { type: 'string', enum: ['ok'] },
      uptimeSeconds: { type: 'integer' },
      timestamp: { type: 'string', format: 'date-time' },
    },
  },
  User: {
    type: 'object',
    required: ['id', 'email', 'fullName', 'role', 'createdAt', 'updatedAt'],
    properties: {
      id: { type: 'string', example: 'seed-user-demo' },
      email: { type: 'string', format: 'email' },
      fullName: { type: 'string' },
      phone: { type: 'string', nullable: true },
      role: { type: 'string', enum: ['User', 'Admin'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  AuthResponse: {
    type: 'object',
    required: ['user', 'session'],
    properties: {
      user: ref('User'),
      session: {
        type: 'object',
        required: ['expiresAt'],
        properties: { expiresAt: { type: 'string', format: 'date-time' } },
      },
    },
  },
  Session: {
    type: 'object',
    required: ['id', 'createdAt', 'lastUsedAt', 'expiresAt', 'current'],
    properties: {
      id: { type: 'string' },
      userAgent: { type: 'string', nullable: true },
      ipAddress: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      lastUsedAt: { type: 'string', format: 'date-time' },
      expiresAt: { type: 'string', format: 'date-time' },
      current: { type: 'boolean' },
    },
  },
  Category: {
    type: 'object',
    required: ['id', 'name', 'slug', 'isActive', 'sortOrder'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string', nullable: true },
      imageUrl: { type: 'string', nullable: true },
      isActive: { type: 'boolean' },
      sortOrder: { type: 'integer' },
      productCount: { type: 'integer' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  Brand: {
    type: 'object',
    required: ['id', 'name', 'slug', 'isActive'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string', nullable: true },
      logoUrl: { type: 'string', nullable: true },
      websiteUrl: { type: 'string', nullable: true },
      isActive: { type: 'boolean' },
      productCount: { type: 'integer' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ProductImage: {
    type: 'object',
    required: ['id', 'url', 'sortOrder', 'isPrimary'],
    properties: {
      id: { type: 'string' },
      url: { type: 'string', format: 'uri' },
      altText: { type: 'string', nullable: true },
      sortOrder: { type: 'integer' },
      isPrimary: { type: 'boolean' },
    },
  },
  ProductRelation: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      slug: { type: 'string' },
    },
  },
  Product: {
    type: 'object',
    required: [
      'id',
      'name',
      'slug',
      'priceCents',
      'price',
      'currency',
      'stockQuantity',
      'inStock',
      'isActive',
      'isFeatured',
      'images',
    ],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string' },
      specifications: {
        type: 'object',
        additionalProperties: { type: 'string' },
      },
      priceCents: { type: 'integer', example: 99900 },
      price: money,
      currency: { type: 'string', example: 'USD' },
      stockQuantity: { type: 'integer' },
      inStock: { type: 'boolean' },
      sku: { type: 'string', nullable: true },
      isActive: { type: 'boolean' },
      isFeatured: { type: 'boolean' },
      category: ref('ProductRelation'),
      brand: { ...ref('ProductRelation'), nullable: true },
      images: { type: 'array', items: ref('ProductImage') },
      primaryImageUrl: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  FavoriteState: {
    type: 'object',
    required: ['productId', 'isFavorite'],
    properties: {
      productId: { type: 'string' },
      isFavorite: { type: 'boolean', enum: [true] },
    },
  },
  CartItem: {
    type: 'object',
    required: ['id', 'product', 'quantity', 'unitPriceCents', 'lineTotalCents', 'available'],
    properties: {
      id: { type: 'string' },
      product: ref('Product'),
      quantity: { type: 'integer' },
      unitPriceCents: { type: 'integer' },
      unitPrice: money,
      lineTotalCents: { type: 'integer' },
      lineTotal: money,
      available: { type: 'boolean' },
    },
  },
  Cart: {
    type: 'object',
    required: ['id', 'items', 'itemCount', 'subtotalCents', 'subtotal', 'currency'],
    properties: {
      id: { type: 'string' },
      items: { type: 'array', items: ref('CartItem') },
      itemCount: { type: 'integer' },
      subtotalCents: { type: 'integer' },
      subtotal: money,
      currency: { type: 'string' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  OrderItem: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      productId: { type: 'string' },
      productName: { type: 'string' },
      unitPriceCents: { type: 'integer' },
      unitPrice: money,
      quantity: { type: 'integer' },
      lineTotalCents: { type: 'integer' },
      lineTotal: money,
    },
  },
  Order: {
    type: 'object',
    required: [
      'id',
      'userId',
      'status',
      'subtotalCents',
      'shippingCents',
      'taxCents',
      'totalCents',
      'items',
    ],
    properties: {
      id: { type: 'string' },
      userId: { type: 'string' },
      status: {
        type: 'string',
        enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
      },
      subtotalCents: { type: 'integer' },
      subtotal: money,
      shippingCents: { type: 'integer' },
      shipping: money,
      taxCents: { type: 'integer' },
      tax: money,
      totalCents: { type: 'integer' },
      total: money,
      currency: { type: 'string' },
      shippingDetails: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
        },
      },
      notes: { type: 'string', nullable: true },
      items: { type: 'array', items: ref('OrderItem') },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      userEmail: { type: 'string', format: 'email' },
    },
  },
  Message: {
    type: 'object',
    properties: { message: { type: 'string' } },
  },
  ForgotPasswordResult: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      resetToken: {
        type: 'string',
        description: 'Development/test only. Never returned in production.',
      },
    },
  },
  DashboardStats: {
    type: 'object',
    properties: {
      users: { type: 'object', properties: { total: { type: 'integer' } } },
      products: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          active: { type: 'integer' },
          lowStock: { type: 'integer' },
        },
      },
      categories: { type: 'object', properties: { total: { type: 'integer' } } },
      brands: { type: 'object', properties: { total: { type: 'integer' } } },
      orders: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          byStatus: {
            type: 'object',
            additionalProperties: { type: 'integer' },
          },
        },
      },
      revenueCents: { type: 'integer' },
      revenue: money,
    },
  },
  RegisterRequest: {
    type: 'object',
    required: ['email', 'password', 'fullName'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8, maxLength: 72 },
      fullName: { type: 'string', minLength: 2, maxLength: 100 },
      phone: { type: 'string', nullable: true },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
    },
  },
  ForgotPasswordRequest: {
    type: 'object',
    required: ['email'],
    properties: { email: { type: 'string', format: 'email' } },
  },
  ResetPasswordRequest: {
    type: 'object',
    required: ['token', 'newPassword'],
    properties: {
      token: { type: 'string' },
      newPassword: { type: 'string', minLength: 8, maxLength: 72 },
    },
  },
  UpdateProfileRequest: {
    type: 'object',
    properties: {
      fullName: { type: 'string', minLength: 2, maxLength: 100 },
      phone: { type: 'string', nullable: true },
    },
    description: 'At least one field is required.',
  },
  ChangePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: { type: 'string' },
      newPassword: { type: 'string', minLength: 8, maxLength: 72 },
    },
  },
  CreateCategoryRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100 },
      slug: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
      description: { type: 'string', nullable: true },
      imageUrl: { type: 'string', format: 'uri', nullable: true },
      isActive: { type: 'boolean', default: true },
      sortOrder: { type: 'integer', default: 0 },
    },
  },
  UpdateCategoryRequest: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string', nullable: true },
      imageUrl: { type: 'string', format: 'uri', nullable: true },
      isActive: { type: 'boolean' },
      sortOrder: { type: 'integer' },
    },
  },
  CreateBrandRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100 },
      slug: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
      description: { type: 'string', nullable: true },
      logoUrl: { type: 'string', format: 'uri', nullable: true },
      websiteUrl: { type: 'string', format: 'uri', nullable: true },
      isActive: { type: 'boolean', default: true },
    },
  },
  UpdateBrandRequest: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string', nullable: true },
      logoUrl: { type: 'string', format: 'uri', nullable: true },
      websiteUrl: { type: 'string', format: 'uri', nullable: true },
      isActive: { type: 'boolean' },
    },
  },
  ProductImageInput: {
    type: 'object',
    required: ['url'],
    properties: {
      url: { type: 'string', format: 'uri' },
      altText: { type: 'string', nullable: true },
      sortOrder: { type: 'integer' },
      isPrimary: { type: 'boolean' },
    },
  },
  CreateProductRequest: {
    type: 'object',
    required: ['categoryId', 'name', 'price', 'stockQuantity'],
    properties: {
      categoryId: { type: 'string' },
      brandId: { type: 'string', nullable: true },
      name: { type: 'string', minLength: 2, maxLength: 200 },
      slug: { type: 'string' },
      description: { type: 'string' },
      specifications: {
        type: 'object',
        additionalProperties: { type: 'string' },
      },
      price: { type: 'number', minimum: 0, example: 999.99 },
      currency: { type: 'string', minLength: 3, maxLength: 3, default: 'USD' },
      stockQuantity: { type: 'integer', minimum: 0 },
      sku: { type: 'string', nullable: true },
      isActive: { type: 'boolean', default: true },
      isFeatured: { type: 'boolean', default: false },
      images: { type: 'array', items: ref('ProductImageInput'), maxItems: 10 },
    },
  },
  UpdateProductRequest: {
    type: 'object',
    description: 'Any subset of product fields. Images replace the existing set.',
    properties: {
      categoryId: { type: 'string' },
      brandId: { type: 'string', nullable: true },
      name: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string' },
      specifications: { type: 'object', additionalProperties: { type: 'string' } },
      price: { type: 'number', minimum: 0 },
      currency: { type: 'string' },
      stockQuantity: { type: 'integer', minimum: 0 },
      sku: { type: 'string', nullable: true },
      isActive: { type: 'boolean' },
      isFeatured: { type: 'boolean' },
      images: { type: 'array', items: ref('ProductImageInput'), maxItems: 10 },
    },
  },
  AddCartItemRequest: {
    type: 'object',
    required: ['productId', 'quantity'],
    properties: {
      productId: { type: 'string' },
      quantity: { type: 'integer', minimum: 1, maximum: 99 },
    },
  },
  UpdateCartItemRequest: {
    type: 'object',
    required: ['quantity'],
    properties: { quantity: { type: 'integer', minimum: 1, maximum: 99 } },
  },
  CreateOrderRequest: {
    type: 'object',
    required: ['shippingName', 'shippingPhone', 'shippingAddress'],
    properties: {
      shippingName: { type: 'string', minLength: 2, maxLength: 100 },
      shippingPhone: { type: 'string', minLength: 6, maxLength: 30 },
      shippingAddress: { type: 'string', minLength: 10, maxLength: 500 },
      notes: { type: 'string', nullable: true, maxLength: 500 },
    },
  },
  UpdateOrderStatusRequest: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
      },
    },
  },
  UpdateUserRoleRequest: {
    type: 'object',
    required: ['role'],
    properties: { role: { type: 'string', enum: ['User', 'Admin'] } },
  },
} as const;

export const errorResponses = {
  BadRequest: {
    description: 'Validation failed or the request is invalid',
    content: { 'application/json': { schema: ref('Error') } },
  },
  Unauthorized: {
    description: 'Authentication required or the session is invalid',
    content: { 'application/json': { schema: ref('Error') } },
  },
  Forbidden: {
    description: 'Insufficient permissions',
    content: { 'application/json': { schema: ref('Error') } },
  },
  NotFound: {
    description: 'Resource not found',
    content: { 'application/json': { schema: ref('Error') } },
  },
  Conflict: {
    description: 'The request conflicts with current state',
    content: { 'application/json': { schema: ref('Error') } },
  },
  TooManyRequests: {
    description: 'Rate limit exceeded',
    content: { 'application/json': { schema: ref('Error') } },
  },
} as const;
