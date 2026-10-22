# System Overview

Loqta is an npm-workspaces monorepo. It contains the backend (`apps/api`) and a placeholder shared
contracts package (`packages/shared`). A React frontend can be added later as `apps/web` without
changing the API.

## Request flow

```text
Route -> Middleware -> Controller -> Service -> Repository -> Database
```

- Routes wire HTTP endpoints to middleware and controllers.
- Controllers translate HTTP to service calls and back; they contain no business logic.
- Services hold business rules and never import Express.
- Repositories own SQL and sit behind interfaces, so SQLite can be replaced by Cloudflare D1 later.
- The composition root (`apps/api/src/infrastructure/container.ts`) builds repositories, services,
  hashers, and the email sender once per process.

## Implemented capabilities

- **Database.** SQLite with SQL migrations, foreign keys, checks, indexes, WAL mode, and a
  transaction-safe async client. `database/migrations/0001_initial.sql` is D1-compatible.
- **Identity.** Registration, login, logout, current profile, password change, password reset,
  session listing/revocation, and `User`/`Admin` roles.
- **Catalog.** Categories, brands, products, images, specifications, search, filters, sorting,
  pagination, featured products, and soft deletion.
- **Commerce.** Favorites, a persistent cart with current prices, server-side totals and stock
  checks, checkout, and cancellation with atomic stock changes.
- **Administration.** Dashboard statistics, user role management, category/brand/product CRUD,
  order listing and status transitions.
- **Documentation.** OpenAPI 3, Swagger UI, and a checked-in Markdown API guide.
- **Quality.** Unit and integration tests, seed and migration CLIs, CI, lint/format/typecheck/build.

## Database access

`DatabaseClient` is deliberately asynchronous:

```ts
interface DatabaseClient {
  all<T>(sql: string, params?: readonly SqlValue[]): Promise<T[]>;
  get<T>(sql: string, params?: readonly SqlValue[]): Promise<T | undefined>;
  run(sql: string, params?: readonly SqlValue[]): Promise<DatabaseRunResult>;
  exec(sql: string): Promise<void>;
  transaction<T>(callback: (tx: DatabaseClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
```

The local adapter serializes operations through a promise queue and uses `BEGIN IMMEDIATE` for
transactions. A D1 adapter can implement the same interface without changes to services or
repositories. Repositories are the only place that knows SQL.

## Money and stock

Prices and totals are integer cents. Clients never send prices or totals. Checkout reads current
product rows, recalculates shipping and tax, then reserves stock and writes the order in one
transaction. The cart is cleared in the same transaction. Cancellation restores stock in another
transaction. This prevents overselling and partial orders.

## Authentication model

- Passwords are hashed with bcrypt (`bcryptjs`).
- Sessions are opaque 32-byte random tokens. Only SHA-256 hashes are stored in `sessions`.
- Browsers get an HttpOnly `SameSite=Lax` cookie; API clients can use a Bearer token.
- Sessions expire after `SESSION_TTL_DAYS`. Expired or orphaned sessions are deleted on access.
- Password reset tokens are random, hashed, single-use, expiring, and consumed atomically.
- Admins are checked against the current database role on every request, so promotions and
  demotions take effect immediately.

## Errors and observability

All endpoints share `{ "error": { "code", "message", "details?", "requestId?" } }`. SQL and stack
traces are logged but never returned. Pino redacts authorization, cookie, and `Set-Cookie` headers;
each request receives an `x-request-id`.

The liveness endpoint (`GET /api/v1/health`) intentionally does not touch the database. A readiness
probe can be added later without changing that contract.

## Deployment shape

The default deployment is a single Node process with a persistent SQLite file. TLS terminates at a
trusted reverse proxy, `TRUST_PROXY=true` is set, `CORS_ORIGINS` lists the real frontend, and
`NODE_ENV=production` enables `Secure` cookies. See `docs/deployment.md`.

For multiple instances, move rate limiting to a shared store and replace SQLite with D1 (or another
shared database). The repository interfaces are the seam for that change.
