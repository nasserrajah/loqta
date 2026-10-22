import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext, type TestContext } from '../helpers/test-app.js';

describe('GET /api/v1/health', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestContext();
  });

  afterAll(async () => {
    await context.close();
  });

  it('returns 200 with an ok status', async () => {
    const res = await request(context.app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(typeof res.body.data.timestamp).toBe('string');
  });

  it('keeps the strict CSP outside the documentation route', async () => {
    const res = await request(context.app).get('/api/v1/health');
    const csp = res.headers['content-security-policy'] as string;
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("'unsafe-inline'");
  });

  it('returns a consistent 404 error for unknown routes', async () => {
    const res = await request(context.app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for malformed JSON bodies', async () => {
    const res = await request(context.app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});
