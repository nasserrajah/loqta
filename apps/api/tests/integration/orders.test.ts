import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext, type TestContext } from '../helpers/test-app.js';
import { loginUser, registerUser } from '../helpers/auth.js';

type TestAgent = ReturnType<typeof request.agent>;

interface ProductSummary {
  id: string;
  slug: string;
  priceCents: number;
  stockQuantity: number;
}

const shippingDetails = {
  shippingName: 'Test Customer',
  shippingPhone: '+1 555 010 2000',
  shippingAddress: '123 Integration Test Street, Test City',
};

describe('orders and admin order management', () => {
  let context: TestContext;
  let admin: Awaited<ReturnType<typeof loginUser>>;
  let products: ProductSummary[];

  beforeAll(async () => {
    context = await createTestContext({ seed: true });
    admin = await loginUser(context.app, {
      email: 'admin@loqta.dev',
      password: 'Admin123!',
      fullName: 'Admin',
    });
    const response = await request(context.app).get('/api/v1/products?pageSize=50');
    products = response.body.data;
  });

  afterAll(async () => {
    await context.close();
  });

  function product(slug: string): ProductSummary {
    const found = products.find((item) => item.slug === slug);
    if (!found) throw new Error(`Seed product ${slug} missing`);
    return found;
  }

  async function addToCart(agent: TestAgent, productId: string, quantity: number) {
    const response = await agent.post('/api/v1/cart/items').send({ productId, quantity });
    expect(response.status).toBe(200);
  }

  it('creates an order from the cart with server-calculated totals and stock reservation', async () => {
    const { agent } = await registerUser(context.app);
    const iphone = product('iphone-15-pro');
    const airpods = product('airpods-pro-2nd-generation');

    await addToCart(agent, iphone.id, 1);
    await addToCart(agent, airpods.id, 1);

    const created = await agent.post('/api/v1/orders').send(shippingDetails);
    expect(created.status).toBe(201);
    const order = created.body.data as {
      id: string;
      subtotalCents: number;
      shippingCents: number;
      totalCents: number;
      status: string;
      items: Array<{ productId: string; quantity: number }>;
    };
    expect(order.status).toBe('pending');
    expect(order.subtotalCents).toBe(iphone.priceCents + airpods.priceCents);
    expect(order.shippingCents).toBe(0);
    expect(order.totalCents).toBe(iphone.priceCents + airpods.priceCents);
    expect(order.items).toHaveLength(2);

    const cart = await agent.get('/api/v1/cart');
    expect(cart.body.data.items).toHaveLength(0);

    const iphoneAfter = await request(context.app).get('/api/v1/products/iphone-15-pro');
    expect(iphoneAfter.body.data.stockQuantity).toBe(iphone.stockQuantity - 1);

    const list = await agent.get('/api/v1/orders');
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    const detail = await agent.get(`/api/v1/orders/${order.id}`);
    expect(detail.status).toBe(200);

    const other = await registerUser(context.app);
    const forbidden = await other.agent.get(`/api/v1/orders/${order.id}`);
    expect(forbidden.status).toBe(404);

    const cancelled = await agent.post(`/api/v1/orders/${order.id}/cancel`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe('cancelled');

    const restored = await request(context.app).get('/api/v1/products/iphone-15-pro');
    expect(restored.body.data.stockQuantity).toBe(iphone.stockQuantity);

    const cancelAgain = await agent.post(`/api/v1/orders/${order.id}/cancel`);
    expect(cancelAgain.status).toBe(409);
  });

  it('restores stock exactly once when cancellation requests race', async () => {
    const { agent } = await registerUser(context.app);
    const cable = product('20w-usb-c-cable-2-pack');
    await addToCart(agent, cable.id, 1);

    const created = await agent.post('/api/v1/orders').send(shippingDetails);
    expect(created.status).toBe(201);
    const orderId = created.body.data.id as string;

    const afterOrder = await request(context.app).get('/api/v1/products/20w-usb-c-cable-2-pack');
    expect(afterOrder.body.data.stockQuantity).toBe(cable.stockQuantity - 1);

    const attempts = await Promise.all([
      agent.post(`/api/v1/orders/${orderId}/cancel`),
      agent.post(`/api/v1/orders/${orderId}/cancel`),
    ]);
    expect(attempts.map((attempt) => attempt.status).sort()).toEqual([200, 409]);

    const afterCancel = await request(context.app).get('/api/v1/products/20w-usb-c-cable-2-pack');
    expect(afterCancel.body.data.stockQuantity).toBe(cable.stockQuantity);
  });

  it('applies flat shipping to small orders and rejects client-supplied totals', async () => {
    const { agent } = await registerUser(context.app);
    const cable = product('20w-usb-c-cable-2-pack');
    await addToCart(agent, cable.id, 1);

    const created = await agent.post('/api/v1/orders').send(shippingDetails);
    expect(created.status).toBe(201);
    expect(created.body.data.subtotalCents).toBe(cable.priceCents);
    expect(created.body.data.shippingCents).toBe(1500);
    expect(created.body.data.totalCents).toBe(cable.priceCents + 1500);

    const empty = await agent.post('/api/v1/orders').send(shippingDetails);
    expect(empty.status).toBe(400);
    expect(empty.body.error.message).toBe('Cart is empty');

    await addToCart(agent, cable.id, 1);
    const tampered = await agent
      .post('/api/v1/orders')
      .send({ ...shippingDetails, subtotalCents: 1, totalCents: 1 });
    expect(tampered.status).toBe(400);
    expect(tampered.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an order when stock changed after items were added', async () => {
    const { agent } = await registerUser(context.app);
    const nikon = product('z6-ii-mirrorless-camera');

    await addToCart(agent, nikon.id, nikon.stockQuantity);

    const reduceStock = await admin.agent
      .patch(`/api/v1/admin/products/${nikon.id}`)
      .send({ stockQuantity: 1 });
    expect(reduceStock.status).toBe(200);

    const order = await agent.post('/api/v1/orders').send(shippingDetails);
    expect(order.status).toBe(409);

    const restoreStock = await admin.agent
      .patch(`/api/v1/admin/products/${nikon.id}`)
      .send({ stockQuantity: nikon.stockQuantity });
    expect(restoreStock.status).toBe(200);
  });

  it('enforces admin order status transitions and admin cancellation restores stock', async () => {
    const first = await registerUser(context.app);
    const cable = product('20w-usb-c-cable-2-pack');
    await addToCart(first.agent, cable.id, 1);
    const created = await first.agent.post('/api/v1/orders').send(shippingDetails);
    const orderId = created.body.data.id as string;

    const paid = await admin.agent
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .send({ status: 'paid' });
    expect(paid.status).toBe(200);

    const invalidJump = await admin.agent
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .send({ status: 'shipped' });
    expect(invalidJump.status).toBe(409);

    for (const status of ['processing', 'shipped', 'delivered']) {
      const transition = await admin.agent
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .send({ status });
      expect(transition.status).toBe(200);
      expect(transition.body.data.status).toBe(status);
    }

    const terminalCancel = await admin.agent
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .send({ status: 'cancelled' });
    expect(terminalCancel.status).toBe(409);

    const second = await registerUser(context.app);
    await addToCart(second.agent, cable.id, 1);
    const secondOrder = await second.agent.post('/api/v1/orders').send(shippingDetails);
    const secondOrderId = secondOrder.body.data.id as string;
    const stockBefore = await request(context.app).get('/api/v1/products/20w-usb-c-cable-2-pack');

    const cancelled = await admin.agent
      .patch(`/api/v1/admin/orders/${secondOrderId}/status`)
      .send({ status: 'cancelled' });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe('cancelled');

    const stockAfter = await request(context.app).get('/api/v1/products/20w-usb-c-cable-2-pack');
    expect(stockAfter.body.data.stockQuantity).toBe(stockBefore.body.data.stockQuantity + 1);

    const list = await admin.agent.get('/api/v1/admin/orders?status=cancelled&pageSize=10');
    expect(list.status).toBe(200);
    expect(list.body.data.every((order: { status: string }) => order.status === 'cancelled')).toBe(
      true,
    );
  });
});
