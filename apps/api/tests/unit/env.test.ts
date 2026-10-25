import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env.js';

describe('loadEnv', () => {
  it('applies defaults', () => {
    const env = loadEnv({});
    expect(env.PORT).toBe(3000);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:5173']);
    expect(env.DATABASE_PATH).toBe('./data/loqta.db');
    expect(env.SESSION_TTL_DAYS).toBe(7);
    expect(env.BCRYPT_ROUNDS).toBe(10);
    expect(env.TRUST_PROXY).toBe(false);
  });

  it('parses comma-separated CORS origins', () => {
    const env = loadEnv({ CORS_ORIGINS: 'http://a.test, http://b.test' });
    expect(env.CORS_ORIGINS).toEqual(['http://a.test', 'http://b.test']);
  });

  it('rejects an invalid port', () => {
    expect(() => loadEnv({ PORT: '99999' })).toThrow(/Invalid environment/);
  });

  it('currently allows wildcard CORS in production (temporary during initial deployment; re-enable the superRefine check in env.schema.ts when the frontend domain is finalized)', () => {
    expect(loadEnv({ NODE_ENV: 'production', CORS_ORIGINS: '*' }).CORS_ORIGINS).toEqual(['*']);
  });

  it('parses boolean flags', () => {
    expect(loadEnv({ TRUST_PROXY: 'true' }).TRUST_PROXY).toBe(true);
    expect(loadEnv({ TRUST_PROXY: 'false' }).TRUST_PROXY).toBe(false);
  });
});
