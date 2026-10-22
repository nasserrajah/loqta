import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext, type TestContext } from '../helpers/test-app.js';

describe('sensitive auth rate limiting', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestContext({ env: { RATE_LIMIT_MAX: '2' } });
  });

  afterAll(async () => {
    await context.close();
  });

  it('returns 429 after repeated failed login attempts', async () => {
    const credentials = { email: 'missing@example.test', password: 'WrongPassword123!' };

    const first = await request(context.app).post('/api/v1/auth/login').send(credentials);
    const second = await request(context.app).post('/api/v1/auth/login').send(credentials);
    const third = await request(context.app).post('/api/v1/auth/login').send(credentials);

    expect(first.status).toBe(401);
    expect(second.status).toBe(401);
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe('RATE_LIMITED');
  });
});
