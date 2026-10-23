import { join } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { findApiRoot } from './paths.js';
import { loadEnv, type Env } from './env.schema.js';

// Node-only env loader. This module must NOT be imported from any code path
// that runs inside Cloudflare Workers. Workers code should import directly
// from './env.schema.js' and pass the bindings to loadEnv().
//
// Support running from the repository root as well as from apps/api.
loadDotenv();
loadDotenv({ path: join(findApiRoot(), '.env') });

export type { Env };
export { loadEnv };

export const env: Env = loadEnv();