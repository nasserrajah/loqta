import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createTestContext, type TestContext } from '../helpers/test-app.js';

describe('HTTP server startup', () => {
  let server: Server;
  let baseUrl: string;
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestContext();
    server = context.app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const address = server.address();
    if (address === null || typeof address === 'string') {
      throw new Error('Expected the server to bind to an ephemeral TCP port');
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await context.close();
  });

  it('binds a port and serves the health endpoint over HTTP', async () => {
    const response = await fetch(`${baseUrl}/api/v1/health`);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { status: string } };
    expect(body.data.status).toBe('ok');
  });
});
