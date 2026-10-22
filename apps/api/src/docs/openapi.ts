import { paths } from './paths.js';
import { schemas, securitySchemes } from './schemas.js';

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Loqta API',
    version: '0.1.0',
    description:
      'Backend for Loqta, a demo electronics store. All endpoints are under /api/v1. Errors share one envelope: { error: { code, message, details?, requestId? } }. Amounts are stored as integer minor units and also exposed as decimal strings.',
  },
  servers: [{ url: '/api/v1', description: 'Versioned API base path' }],
  tags: [
    { name: 'System', description: 'Health and diagnostics' },
    { name: 'Auth', description: 'Registration, login, sessions, password reset' },
    { name: 'Users', description: 'Current user profile' },
    { name: 'Catalog', description: 'Categories, brands, products' },
    { name: 'Favorites', description: 'Authenticated favorites' },
    { name: 'Cart', description: 'Authenticated cart and server-side totals' },
    { name: 'Orders', description: 'Authenticated orders' },
    { name: 'Admin', description: 'Administrator-only management endpoints' },
  ],
  components: {
    securitySchemes,
    schemas,
  },
  paths,
} as const;
