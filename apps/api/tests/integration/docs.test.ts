import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext, type TestContext } from '../helpers/test-app.js';

interface OpenApiDocument {
  openapi: string;
  paths: Record<string, Record<string, unknown>>;
  components: {
    schemas: Record<string, unknown>;
    securitySchemes: Record<string, unknown>;
  };
}

describe('OpenAPI documentation', () => {
  let context: TestContext;
  let document: OpenApiDocument;

  beforeAll(async () => {
    context = await createTestContext();
    const response = await request(context.app).get('/api/v1/openapi.json');
    expect(response.status).toBe(200);
    document = response.body as OpenApiDocument;
  });

  afterAll(async () => {
    await context.close();
  });

  it('serves an OpenAPI 3 document with all modules documented', () => {
    expect(document.openapi).toBe('3.0.3');
    expect(Object.keys(document.components.securitySchemes)).toEqual(['cookieAuth', 'bearerAuth']);

    for (const path of [
      '/health',
      '/auth/register',
      '/auth/login',
      '/auth/logout',
      '/auth/me',
      '/auth/sessions',
      '/auth/sessions/{id}',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/users/me',
      '/users/me/password',
      '/categories',
      '/categories/{slug}',
      '/brands',
      '/brands/{slug}',
      '/products',
      '/products/{slug}',
      '/favorites',
      '/favorites/{productId}',
      '/cart',
      '/cart/items',
      '/cart/items/{itemId}',
      '/orders',
      '/orders/{id}',
      '/orders/{id}/cancel',
      '/admin/stats',
      '/admin/users',
      '/admin/users/{id}/role',
      '/admin/categories',
      '/admin/categories/{id}',
      '/admin/brands',
      '/admin/brands/{id}',
      '/admin/products',
      '/admin/products/{id}',
      '/admin/orders',
      '/admin/orders/{id}',
      '/admin/orders/{id}/status',
    ]) {
      expect(document.paths[path], `missing ${path}`).toBeDefined();
    }
  });

  it('has no dangling schema references', () => {
    const serialized = JSON.stringify(document);
    const references = new Set(
      [...serialized.matchAll(/#\/components\/schemas\/([A-Za-z0-9_]+)/g)].map(
        (match) => match[1] as string,
      ),
    );

    for (const name of references) {
      expect(document.components.schemas[name], `missing schema ${name}`).toBeDefined();
    }
  });

  it('serves Swagger UI with a documentation-only CSP relaxation', async () => {
    const response = await request(context.app).get('/api/v1/docs');
    expect(response.status).toBe(200);
    expect(response.type).toMatch(/html/);
    expect(response.text).toContain('swagger-ui');
    expect(response.headers['content-security-policy']).toContain("'unsafe-inline'");
  });
});
