import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext, type TestContext } from '../helpers/test-app.js';
import { loginUser, registerUser } from '../helpers/auth.js';

describe('catalog and admin catalog management', () => {
  let context: TestContext;
  let admin: Awaited<ReturnType<typeof loginUser>>;
  let customer: Awaited<ReturnType<typeof registerUser>>;

  beforeAll(async () => {
    context = await createTestContext({ seed: true });
    admin = await loginUser(context.app, {
      email: 'admin@loqta.dev',
      password: 'Admin123!',
      fullName: 'Admin',
    });
    customer = await registerUser(context.app);
  });

  afterAll(async () => {
    await context.close();
  });

  it('lists seeded categories with product counts', async () => {
    const response = await request(context.app).get('/api/v1/categories');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(9);
    const smartphones = response.body.data.find(
      (category: { slug: string }) => category.slug === 'smartphones',
    );
    expect(smartphones.productCount).toBe(3);
  });

  it('lists products with pagination and metadata', async () => {
    const response = await request(context.app).get('/api/v1/products?pageSize=5');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(5);
    expect(response.body.meta.total).toBe(27);
    expect(response.body.meta.totalPages).toBe(6);
    expect(response.body.meta.hasNextPage).toBe(true);
    expect(response.body.data[0].images.length).toBeGreaterThan(0);
    expect(response.body.data[0].price).toMatch(/^\d+\.\d{2}$/);
  });

  it('searches, filters, and sorts products', async () => {
    const search = await request(context.app).get('/api/v1/products?search=macbook');
    expect(search.status).toBe(200);
    expect(search.body.meta.total).toBe(1);
    expect(search.body.data[0].slug).toBe('macbook-air-13-m3');

    const category = await request(context.app).get(
      '/api/v1/products?category=smartphones&pageSize=10',
    );
    expect(category.body.meta.total).toBe(3);

    const brand = await request(context.app).get('/api/v1/products?brand=apple&pageSize=10');
    expect(brand.body.meta.total).toBe(4);

    const priceRange = await request(context.app).get(
      '/api/v1/products?minPrice=1000&maxPrice=1300&pageSize=20',
    );
    expect(priceRange.body.meta.total).toBeGreaterThan(0);
    for (const product of priceRange.body.data) {
      expect(product.priceCents).toBeGreaterThanOrEqual(100_000);
      expect(product.priceCents).toBeLessThanOrEqual(130_000);
    }

    const sorted = await request(context.app).get('/api/v1/products?sort=price_asc&pageSize=5');
    const prices = sorted.body.data.map((product: { priceCents: number }) => product.priceCents);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    const featured = await request(context.app).get('/api/v1/products?featured=true&pageSize=20');
    expect(featured.body.meta.total).toBeGreaterThan(0);
    expect(featured.body.data.every((product: { isFeatured: boolean }) => product.isFeatured)).toBe(
      true,
    );

    const invalid = await request(context.app).get('/api/v1/products?sort=drop_table');
    expect(invalid.status).toBe(400);
  });

  it('returns product details and a 404 for unknown products', async () => {
    const detail = await request(context.app).get('/api/v1/products/iphone-15-pro');
    expect(detail.status).toBe(200);
    expect(detail.body.data.specifications.Storage).toBe('256GB');
    expect(detail.body.data.images).toHaveLength(2);
    expect(detail.body.data.brand.slug).toBe('apple');

    const missing = await request(context.app).get('/api/v1/products/not-a-product');
    expect(missing.status).toBe(404);
  });

  it('protects admin endpoints by authentication and role', async () => {
    const anonymous = await request(context.app).get('/api/v1/admin/stats');
    expect(anonymous.status).toBe(401);

    const forbidden = await customer.agent.get('/api/v1/admin/stats');
    expect(forbidden.status).toBe(403);

    const allowed = await admin.agent.get('/api/v1/admin/stats');
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.products.total).toBe(27);
    expect(allowed.body.data.categories.total).toBe(9);
    expect(allowed.body.data.orders.byStatus.pending).toBe(0);
  });

  it('creates, updates, and deactivates a product through the admin API', async () => {
    const category = await admin.agent
      .post('/api/v1/admin/categories')
      .send({ name: 'Test Audio Gear', description: 'Temporary test category' });
    expect(category.status).toBe(201);
    expect(category.body.data.slug).toBe('test-audio-gear');

    const brand = await admin.agent
      .post('/api/v1/admin/brands')
      .send({ name: 'Test Brand', websiteUrl: 'https://example.com' });
    expect(brand.status).toBe(201);

    const created = await admin.agent.post('/api/v1/admin/products').send({
      categoryId: category.body.data.id,
      brandId: brand.body.data.id,
      name: 'Test Wireless Speaker',
      price: 123.45,
      stockQuantity: 5,
      sku: 'TEST-SPK-1',
      description: 'A speaker used by integration tests.',
      specifications: { Color: 'Black', Power: '20W' },
      images: [
        { url: 'https://placehold.co/800x600?text=Speaker', altText: 'Speaker', isPrimary: true },
      ],
    });
    expect(created.status).toBe(201);
    expect(created.body.data.priceCents).toBe(12_345);
    expect(created.body.data.price).toBe('123.45');
    expect(created.body.data.images).toHaveLength(1);

    const productId = created.body.data.id as string;
    const publicDetail = await request(context.app).get('/api/v1/products/test-wireless-speaker');
    expect(publicDetail.status).toBe(200);

    const updated = await admin.agent.patch(`/api/v1/admin/products/${productId}`).send({
      price: 99.99,
      stockQuantity: 10,
      isFeatured: true,
      images: [
        {
          url: 'https://placehold.co/800x600?text=Speaker+2',
          altText: 'Speaker v2',
          isPrimary: true,
        },
        { url: 'https://placehold.co/800x600?text=Speaker+3', altText: 'Speaker v3' },
      ],
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.priceCents).toBe(9_999);
    expect(updated.body.data.stockQuantity).toBe(10);
    expect(updated.body.data.images).toHaveLength(2);

    const duplicate = await admin.agent.post('/api/v1/admin/products').send({
      categoryId: category.body.data.id,
      name: 'Duplicate Speaker',
      slug: 'test-wireless-speaker',
      price: 10,
      stockQuantity: 1,
    });
    expect(duplicate.status).toBe(409);

    const blockedCategoryDelete = await admin.agent.delete(
      `/api/v1/admin/categories/${category.body.data.id}`,
    );
    expect(blockedCategoryDelete.status).toBe(409);

    const removed = await admin.agent.delete(`/api/v1/admin/products/${productId}`);
    expect(removed.status).toBe(204);

    const hidden = await request(context.app).get('/api/v1/products/test-wireless-speaker');
    expect(hidden.status).toBe(404);

    const adminList = await admin.agent.get(
      '/api/v1/admin/products?search=Test%20Wireless%20Speaker',
    );
    expect(adminList.status).toBe(200);
    expect(adminList.body.meta.total).toBe(1);
    expect(adminList.body.data[0].isActive).toBe(false);
  });

  it('rejects invalid admin payloads and unknown categories', async () => {
    const invalid = await admin.agent.post('/api/v1/admin/products').send({
      categoryId: 'missing',
      name: 'X',
      price: -5,
      stockQuantity: -1,
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');

    const unknownCategory = await admin.agent.post('/api/v1/admin/products').send({
      categoryId: 'missing-category',
      name: 'Valid Name',
      price: 10,
      stockQuantity: 1,
    });
    expect(unknownCategory.status).toBe(404);
  });
});
