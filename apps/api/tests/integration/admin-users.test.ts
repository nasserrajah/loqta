import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext, type TestContext } from '../helpers/test-app.js';
import { loginUser, registerUser } from '../helpers/auth.js';

describe('admin user management', () => {
  let context: TestContext;
  let admin: Awaited<ReturnType<typeof loginUser>>;

  beforeAll(async () => {
    context = await createTestContext({ seed: true });
    admin = await loginUser(context.app, {
      email: 'admin@loqta.dev',
      password: 'Admin123!',
      fullName: 'Admin',
    });
  });

  afterAll(async () => {
    await context.close();
  });

  it('lists and searches users', async () => {
    const list = await admin.agent.get('/api/v1/admin/users?pageSize=10');
    expect(list.status).toBe(200);
    expect(list.body.meta.total).toBeGreaterThanOrEqual(2);

    const search = await admin.agent.get('/api/v1/admin/users?search=admin%40loqta.dev');
    expect(search.status).toBe(200);
    expect(search.body.data).toHaveLength(1);
    expect(search.body.data[0].email).toBe('admin@loqta.dev');
  });

  it('promotes a user and immediately applies the new role', async () => {
    const customer = await registerUser(context.app);
    const forbidden = await customer.agent.get('/api/v1/admin/stats');
    expect(forbidden.status).toBe(403);

    const promote = await admin.agent
      .patch(`/api/v1/admin/users/${customer.response.body.data.user.id}/role`)
      .send({ role: 'Admin' });
    expect(promote.status).toBe(200);
    expect(promote.body.data.role).toBe('Admin');

    const allowed = await customer.agent.get('/api/v1/admin/stats');
    expect(allowed.status).toBe(200);
  });

  it('validates role changes and rejects self-modification', async () => {
    const customer = await registerUser(context.app);
    const customerId = customer.response.body.data.user.id as string;

    const invalid = await admin.agent
      .patch(`/api/v1/admin/users/${customerId}/role`)
      .send({ role: 'Owner' });
    expect(invalid.status).toBe(400);

    const missing = await admin.agent
      .patch('/api/v1/admin/users/does-not-exist/role')
      .send({ role: 'Admin' });
    expect(missing.status).toBe(404);

    const self = await admin.agent
      .patch(`/api/v1/admin/users/${admin.response.body.data.user.id}/role`)
      .send({ role: 'User' });
    expect(self.status).toBe(400);
    expect(self.body.error.message).toBe('You cannot change your own role');
  });
});
