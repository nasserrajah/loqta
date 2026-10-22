# ADR 0003: Separate production build config and real HTTP startup test

Status: Accepted

## Context

`apps/api/tsconfig.json` includes `src`, `tests`, and `vitest.config.ts` so that typechecking covers
the test suite. Using the same config for `tsc` builds emitted test files and the Vitest config into
`apps/api/dist`, which is unnecessary production output.

Phase 1 also requires a server-startup test. Testing `createApp()` through Supertest exercises the
application but does not prove that the process can bind a port and answer real HTTP requests.

## Decision

1. Add `apps/api/tsconfig.build.json`. It extends the main config and limits the production build to
   `src/`. The build script uses it; `typecheck` still uses `tsconfig.json` and therefore still
   checks tests.
2. Add `scripts/clean.mjs` and make the root `build` script clean `apps/api/dist` first. This keeps
   stale files from previous builds out of the output.
3. Add `tests/integration/server.test.ts`, which starts the Express app on an ephemeral loopback
   port, performs a real `fetch` against `/api/v1/health`, and closes the server afterwards.

## Consequences

- `apps/api/dist/src/server.js` remains the compiled entry point, so `npm start` is unchanged.
- Build output contains only production source files.
- Server startup and shutdown are covered automatically, without touching the development database
  (none exists yet) or requiring a fixed port.
- One additional config file and one script exist outside the original tree; both are build tooling,
  not application layers, and the runtime folder structure is unchanged.
