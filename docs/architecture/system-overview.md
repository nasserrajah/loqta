# System Overview

Loqta is an npm-workspaces monorepo. Phase 1 contains only the backend (`apps/api`) and an
empty shared contracts package (`packages/shared`). A React frontend will be added later as
`apps/web` without changing the API.

Request flow (enforced from Phase 3 onward):

`Route -> Middleware -> Controller -> Service -> Repository -> Database`

- Routes wire HTTP endpoints to controllers and middleware.
- Controllers translate HTTP to service calls and back; no business logic.
- Services hold business rules and never touch Express objects.
- Repositories own SQL and sit behind interfaces so SQLite can be swapped for Cloudflare D1.

All endpoints live under `/api/v1`. Success responses use `{ "data": ... }`; errors use
`{ "error": { "code", "message", "details?" } }`.

Implemented in Phase 1: Express app factory, env validation (Zod), Pino request/error logging,
Helmet, environment-specific CORS, JSON body parsing, centralized 404/error handling,
`GET /api/v1/health`, real-HTTP server startup tests, a clean production build, and CI.

The health endpoint is intentionally public and does not touch the database. When the database is
introduced in Phase 2, a separate readiness check can report connectivity without changing the
liveness contract.
