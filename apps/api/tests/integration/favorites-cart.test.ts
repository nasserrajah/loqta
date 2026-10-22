import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext, type TestContext } from '../helpers/test-app.js';
import { registerUser } from '../helpers/auth.js';

describe('favorites and cart', () => {
  let context: TestContext;
  let products: Array<{
    id: string;
    slug: string;
    priceCents: number;
    stockQuantity: number;
  }>;

  beforeAll(async () => {
    context = await createTestContext({ seed: true });
    const response = await request(context.app).get('/api/v1/products?pageSize=50');
    products = response.body.data;
  });

  afterAll(async () => {
    await context.close();
  });

  it('requires authentication for favorites and cart', async () => {
    expect((await request(context.app).get('/api/v1/favorites')).status).toBe(401);
    expect((await request(context.app).get('/api/v1/cart')).status).toBe(401);
  });

  it('adds, lists, deduplicates, and removes favorites', async () => {
    const { agent } = await registerUser(context.app);
    const product = products[0];
    if (!product) throw new Error('Seed products missing');

    const add = await agent.post(`/api/v1/favorites/${product.id}`);
    expect(add.status).toBe(201);
    expect(add.body.data.isFavorite).toBe(true);

    const duplicate = await agent.post(`/api/v1/favorites/${product.id}`);
    expect(duplicate.status).toBe(201);

    const list = await agent.get('/api/v1/favorites');
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].id).toBe(product.id);
    expect(list.body.meta.total).toBe(1);

    const remove = await agent.delete(`/api/v1/favorites/${product.id}`);
    expect(remove.status).toBe(204);

    const after = await agent.get('/api/v1/favorites');
    expect(after.body.data).toHaveLength(0);

    const unknown = await agent.post('/api/v1/favorites/does-not-exist');
    expect(unknown.status).toBe(404);
  });

  it('maintains cart quantities and server-side totals', async () => {
    const { agent } = await registerUser(context.app);
    const first = products.find((product) => product.slug === 'iphone-15-pro');
    const second = products.find((product) => product.slug === 'airpods-pro-2nd-generation');
    if (!first || !second) throw new Error('Seed products missing');

    const empty = await agent.get('/api/v1/cart');
    expect(empty.status).toBe(200);
    expect(empty.body.data.items).toHaveLength(0);
    expect(empty.body.data.subtotalCents).toBe(0);

    const add = await agent.post('/api/v1/cart/items').send({ productId: first.id, quantity: 2 });
    expect(add.status).toBe(200);
    expect(add.body.data.items).toHaveLength(1);
    expect(add.body.data.itemCount).toBe(2);
    expect(add.body.data.subtotalCents).toBe(first.priceCents * 2);
    const firstItemId = add.body.data.items[0].id as string;

    const sameProduct = await agent
      .post('/api/v1/cart/items')
      .send({ productId: first.id, quantity: 1 });
    expect(sameProduct.body.data.items).toHaveLength(1);
    expect(sameProduct.body.data.items[0].quantity).toBe(3);
    expect(sameProduct.body.data.subtotalCents).toBe(first.priceCents * 3);

    const secondProduct = await agent
      .post('/api/v1/cart/items')
      .send({ productId: second.id, quantity: 1 });
    expect(secondProduct.body.data.items).toHaveLength(2);
    expect(secondProduct.body.data.itemCount).toBe(4);
    expect(secondProduct.body.data.subtotalCents).toBe(first.priceCents * 3 + second.priceCents);

    const update = await agent.patch(`/api/v1/cart/items/${firstItemId}`).send({ quantity: 1 });
    expect(update.status).toBe(200);
    expect(update.body.data.itemCount).toBe(2);
    expect(update.body.data.subtotalCents).toBe(first.priceCents + second.priceCents);

    const remove = await agent.delete(`/api/v1/cart/items/${firstItemId}`);
    expect(remove.status).toBe(200);
    expect(remove.body.data.items).toHaveLength(1);
    expect(remove.body.data.subtotalCents).toBe(second.priceCents);

    const clear = await agent.delete('/api/v1/cart');
    expect(clear.status).toBe(204);

    const cleared = await agent.get('/api/v1/cart');
    expect(cleared.body.data.items).toHaveLength(0);
  });

  it('rejects invalid quantities, missing products, and stock overflows', async () => {
    const { agent } = await registerUser(context.app);
    const product = products.find((item) => item.slug === 'z6-ii-mirrorless-camera');
    if (!product) throw new Error('Seed product missing');

    const invalidQuantity = await agent
      .post('/api/v1/cart/items')
      .send({ productId: product.id, quantity: 0 });
    expect(invalidQuantity.status).toBe(400);

    const tooMany = await agent
      .post('/api/v1/cart/items')
      .send({ productId: product.id, quantity: 99 });
    expect(tooMany.status).toBe(409);

    const missing = await agent
      .post('/api/v1/cart/items')
      .send({ productId: 'does-not-exist', quantity: 1 });
    expect(missing.status).toBe(404);
  });
});
