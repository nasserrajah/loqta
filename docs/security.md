# Security Review

This document describes the security properties of the Phase 7 backend and the limits that remain.
It is a review of the implementation, not a claim that the demo is ready for high-risk production
use without the operational work listed at the end.

## Authentication

- Passwords are hashed with bcrypt through `bcryptjs`. The default cost is 10; tests use 4. The
  maximum accepted password length is 72 bytes, matching bcrypt's effective input limit.
- Login and password-reset request responses are generic. A failed login does not reveal whether the
  email exists.
- Sessions are 32-byte random opaque tokens. Only SHA-256 hashes are stored in the database, so a
  database leak does not yield usable session tokens.
- The browser receives the token in an HttpOnly, `SameSite=Lax`, `Path=/` cookie. In production the
  cookie is also `Secure`. The same token can be sent as a Bearer token by non-browser clients.
- Sessions have a fixed expiry (`SESSION_TTL_DAYS`, default 7). Expired rows are removed when
  encountered. Logout deletes the current session; password reset deletes all sessions; password
  change deletes all other sessions.
- Password-reset tokens are random, hashed at rest, expiring, and single-use. Consumption uses a
  conditional update (`WHERE used_at IS NULL`) so two concurrent requests cannot both succeed.
- Registration always creates a `User`; the public API cannot self-assign `Admin`.

## Authorization

- `requireAuth` resolves the token, checks expiry, loads the current user, and rejects inactive
  users. It does not trust a role embedded in a token, so promotions and demotions apply on the next
  request.
- `requireRole('Admin')` guards the entire `/admin` router. Admin category, brand, product, and order
  operations reuse the same services as the public side only where the business rules are identical.
- Ownership is checked in the service layer for cart, favorites, orders, and session revocation.
  Requesting another user's order or session returns `404`/`403` rather than leaking its existence.
- An admin cannot change their own role, and the last active admin cannot be demoted.
- Users can cancel only their own `pending` orders. Status transitions are validated by a fixed map.

## Input, output, and data integrity

- Every body, query, and route parameter is validated with Zod. Unknown body fields are rejected by
  `.strict()` schemas, which prevents mass assignment of fields such as `role`, `isActive`, or
  `priceCents` on customer endpoints.
- SQL is parameterized. Dynamic ordering uses a fixed enum/allow-list, never string concatenation of
  user input. `LIKE` searches escape `%`, `_`, and `\`.
- Prices and totals are integer cents computed on the server. Clients cannot submit prices, shipping,
  tax, or order totals.
- Checkout and cancellation use database transactions with conditional stock updates. A failed line
  rolls back the whole order, and cancellation restocks exactly once.
- Product deletion is a soft delete. Categories and brands cannot be deleted while any product still
  references them, preserving historical orders.
- Error responses use a stable envelope and never include SQL, stack traces, or driver messages.
  Unexpected errors are logged with the request id and returned as `500 INTERNAL_ERROR`.
- 404 and validation responses include the request id, which helps support without exposing internals.

## Transport, browser, and abuse controls

- Helmet sets security headers on every response. The global Content Security Policy is strict:
  `default-src 'self'`, `script-src 'self'`, `style-src 'self'`, `img-src 'self' data:`,
  `object-src 'none'`, and `frame-ancestors 'self'`. Swagger UI needs inline bootstrap code, so the
  policy is relaxed only on `/api/v1/docs`.
- CORS is an explicit origin allow-list with credentials enabled. Production configuration rejects
  `*`.
- Sensitive auth endpoints (register, login, forgot/reset password) are rate-limited. By default 20
  failed requests per IP per 15 minutes count against the limit; successful requests do not.
- Request logs redact `authorization`, `cookie`, and `set-cookie` values. The app does not log request
  bodies.
- JSON request bodies are limited to 1 MB. Invalid JSON returns `400 INVALID_JSON`.

## Secrets and configuration

- All configuration is validated at startup by Zod. Invalid values stop the process instead of
  running with an unsafe fallback.
- Real secrets belong in the environment or an untracked `apps/api/.env`. Only `.env.example` is
  committed.
- `TRUST_PROXY` is `false` by default. It must be enabled only when a single trusted proxy sets
  `X-Forwarded-For`; otherwise clients could spoof their IP and bypass rate limits.
- Production uses `NODE_ENV=production`, which enables `Secure` cookies and JSON-only logging.

## Known limitations

These are acceptable for the demo but must be addressed before handling real payments or personal
data at scale:

1. **Rate limiting is in-memory and per process.** Multiple instances each keep their own counters.
   Use a shared store such as Redis, or enforce authentication limits at the edge.
2. **The email sender is a console logger.** In production the reset link is written to the server
   log, and the API never returns the token. Integrate a real transactional email provider before
   relying on password reset.
3. **No email verification, MFA, CAPTCHA, or account lockout.** Add them for a public consumer site.
   Successful registrations and password-reset requests do not count toward the failed-attempt
   limiter, so add a separate quota or CAPTCHA to prevent account and email abuse.
4. **CSRF relies on `SameSite=Lax` and JSON/form constraints.** If the frontend and API are deployed
   on different sites, review the cookie policy and add an explicit CSRF token if needed.
5. **No audit trail for admin actions.** Product/order/role changes are not recorded in an
   append-only log.
6. **No payment integration or webhook verification.** Orders are created as `pending`; moving them
   to `paid` is an admin action in this demo.
7. **SQLite is a single-writer database.** Run one Node process against one database file. For
   horizontal scaling, implement the D1 adapter behind `DatabaseClient` or use another shared
   database.
8. **The health endpoint is liveness only.** It does not prove that the database is reachable.
9. **Dependency scanning is point-in-time.** CI runs `npm audit --audit-level=high`; keep dependencies
   current and review advisories.
10. **Swagger UI is public.** It reveals the API shape, not secrets. Block `/api/v1/docs` at the
    proxy if the documentation should not be public.

## Pre-production checklist

- [ ] Serve the API only over HTTPS; `Secure` cookies require it.
- [ ] Set strong, unique production values for every environment variable.
- [ ] Replace the console email sender and test reset delivery end to end.
- [ ] Set `CORS_ORIGINS` to the exact production frontend origin(s).
- [ ] Set `TRUST_PROXY=true` only behind a trusted proxy and verify the client IP.
- [ ] Move rate limiting to a shared store or the edge.
- [ ] Create the first admin deliberately; do not ship seeded demo credentials.
- [ ] Restrict filesystem permissions on the database and backups.
- [ ] Add uptime, error-rate, and database-size monitoring.
- [ ] Test backup and restore, not only backup creation.
- [ ] Review the CSP and cookie settings after the frontend's asset origins are known.
