# Loqta | لُقطة

Demo e-commerce backend for electronics and technology products, built as a portfolio project.
The API is complete through Phase 7: database, authentication, catalog, favorites, cart, orders,
administration, OpenAPI documentation, tests, and deployment notes. No React frontend is included;
the backend is ready to serve one.

## Stack

| Area       | Choice                                                             |
| ---------- | ------------------------------------------------------------------ |
| Runtime    | Node.js >= 20.19, native ESM                                       |
| Language   | TypeScript (strict, `NodeNext`)                                    |
| HTTP       | Express 4                                                          |
| Validation | Zod                                                                |
| Database   | SQLite locally via `better-sqlite3`, behind an async D1-ready API  |
| Auth       | Opaque session tokens, SHA-256 hashes, bcrypt passwords            |
| Security   | Helmet, CORS allow-list, rate limiting, centralized error handling |
| Logging    | Pino + `pino-http` with redaction                                  |
| API docs   | OpenAPI 3 + Swagger UI                                             |
| Testing    | Vitest + Supertest, in-memory SQLite                               |
| Tooling    | ESLint 10, Prettier, npm workspaces, GitHub Actions                |

## Requirements

- Node.js >= 20.19 (CI uses Node 22)
- npm >= 10

## Quick start

```bash
npm install
```

Create the API environment file. Defaults work without it, but an explicit file is easier to
change:

```powershell
# Windows PowerShell
Copy-Item apps/api/.env.example apps/api/.env
```

```bash
# macOS / Linux
cp apps/api/.env.example apps/api/.env
```

Create and seed the local database:

```bash
npm run db:migrate
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

Open:

- API health: `http://localhost:3000/api/v1/health`
- Swagger UI: `http://localhost:3000/api/v1/docs`
- OpenAPI JSON: `http://localhost:3000/api/v1/openapi.json`

### Demo accounts

The seed is idempotent and only creates these accounts when they do not exist.

| Role     | Email             | Password    |
| -------- | ----------------- | ----------- |
| Admin    | `admin@loqta.dev` | `Admin123!` |
| Customer | `user@loqta.dev`  | `User123!`  |

The seed also creates 9 categories, 14 brands, 27 products, and 54 product images. Product images
use `placehold.co` placeholder URLs.

## Commands

| Command                | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `npm run dev`          | Start the API with hot reload (`tsx watch`)                |
| `npm run build`        | Clean and compile the API to `apps/api/dist`               |
| `npm start`            | Run the compiled API                                       |
| `npm run db:migrate`   | Apply pending SQL migrations                               |
| `npm run db:seed`      | Insert the idempotent demo catalog and accounts            |
| `npm test`             | Run unit and integration tests                             |
| `npm run test:watch`   | Run tests in watch mode                                    |
| `npm run typecheck`    | Typecheck the API, tests, and the seed CLI                 |
| `npm run lint`         | ESLint across the repository                               |
| `npm run format`       | Format with Prettier                                       |
| `npm run format:check` | Verify formatting without writing                          |
| `npm run clean`        | Remove build output                                        |
| `npm run verify`       | Lint, format check, typecheck, tests, and production build |

The API runs migrations automatically at startup, so `npm run db:migrate` is mainly useful in CI,
scripts, and before inspecting the database. Seeding is always explicit.

## Environment variables

Environment variables are validated with Zod at startup; the process fails fast on invalid values.
`.env` is loaded from the repository root and from `apps/api`, so the API can be started from either
directory.

| Variable                     | Default                 | Description                                                         |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------- |
| `NODE_ENV`                   | `development`           | `development`, `test`, or `production`                              |
| `PORT`                       | `3000`                  | HTTP port (1–65535)                                                 |
| `LOG_LEVEL`                  | `info`                  | Pino level (`fatal`…`trace`, or `silent`)                           |
| `CORS_ORIGINS`               | `http://localhost:5173` | Comma-separated browser origins; wildcard is rejected in production |
| `APP_URL`                    | `http://localhost:5173` | Frontend URL used in password-reset links                           |
| `DATABASE_PATH`              | `./data/loqta.db`       | SQLite file, resolved relative to `apps/api`                        |
| `SESSION_TTL_DAYS`           | `7`                     | Session lifetime in days (1–90)                                     |
| `PASSWORD_RESET_TTL_MINUTES` | `30`                    | Password-reset token lifetime in minutes (5–1440)                   |
| `BCRYPT_ROUNDS`              | `10`                    | bcrypt cost (4–15; lower only in tests)                             |
| `RATE_LIMIT_MAX`             | `20`                    | Failed sensitive requests per IP per 15-minute window               |
| `TRUST_PROXY`                | `false`                 | Set to `true` only behind one trusted reverse proxy                 |

Never commit `apps/api/.env` or real secrets. Only `.env.example` is tracked.

## API overview

All endpoints live under `/api/v1`. Success responses use `{ "data": ... }` (lists add `meta`).
Errors use `{ "error": { "code", "message", "details?", "requestId?" } }`.

| Area      | Endpoints                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------- |
| System    | `GET /health`, `GET /openapi.json`, `GET /docs`                                                          |
| Auth      | `/auth/register`, `/login`, `/logout`, `/me`, `/sessions`, `/forgot-password`, `/reset-password`         |
| Users     | `GET/PATCH /users/me`, `PUT /users/me/password`                                                          |
| Catalog   | `GET /categories`, `/categories/{slug}`, `/brands`, `/brands/{slug}`, `/products`, `/products/{slug}`    |
| Favorites | `GET /favorites`, `POST/DELETE /favorites/{productId}`                                                   |
| Cart      | `GET/DELETE /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/{itemId}`                              |
| Orders    | `POST/GET /orders`, `GET /orders/{id}`, `POST /orders/{id}/cancel`                                       |
| Admin     | `/admin/stats`, `/admin/users`, `/admin/categories`, `/admin/brands`, `/admin/products`, `/admin/orders` |

The source of truth for requests, responses, and authentication is the OpenAPI document served at
`/api/v1/openapi.json` or rendered at `/api/v1/docs`.

## Behavior worth knowing

- **Server-side money.** Prices and totals are stored as integer cents. Clients never send prices or
  order totals; the server computes them from current product data.
- **Atomic checkout.** Order creation validates stock and decrements it in one transaction, then
  clears the cart. Cancellation restores stock in a transaction.
- **Order status flow.** `pending → paid → processing → shipped → delivered`, with cancellation
  allowed before shipment. Invalid jumps return `409`.
- **Soft-deleted products.** Admin deletion deactivates a product instead of removing it so order
  history remains valid. Categories and brands cannot be deleted while products reference them.
- **Sessions.** Opaque random tokens are stored as SHA-256 hashes. The browser receives an HttpOnly,
  `SameSite=Lax` cookie; API clients can send the same token as `Authorization: Bearer`.
  Production cookies are `Secure`, so production must use HTTPS.
- **Password reset.** Tokens are hashed, single-use, and expire. Without an email provider, the
  development/test response includes `resetToken`; production never does.

## Security notes

- Passwords are hashed with bcrypt. Error messages never reveal whether an email exists.
- Authorization is enforced in middleware, not only in the UI. All `/admin` routes require the
  `Admin` role, checked against the database on every request.
- SQL is parameterized. Dynamic sort clauses come from a fixed allow-list.
- Helmet sets a strict CSP for API responses and a small, documented relaxation only for Swagger UI.
- Sensitive auth endpoints are rate-limited in memory. For multiple production instances, replace
  the store with a shared one (for example Redis) or enforce limits at the edge.
- The reset and session tokens are redacted from request logs.

See [docs/security.md](docs/security.md) for the full review and
[docs/deployment.md](docs/deployment.md) for production guidance.

## Project layout

```text
loqta/
├── apps/api/          Express + TypeScript backend
├── packages/shared/   Contracts reserved for the future React frontend
├── database/          SQL migrations, seed CLI, DB TypeScript config
├── docs/              Architecture, API, security, deployment, development docs
├── scripts/           Repository maintenance scripts
├── .github/workflows/ CI pipeline
└── package.json       npm workspaces root
```

Request flow: `Route → Middleware → Controller → Service → Repository → Database`. Controllers do
not contain business logic, services do not import Express, and repositories are the only layer
that knows SQL.

The full authoritative tree is in
[docs/architecture/folder-structure.md](docs/architecture/folder-structure.md).

## Documentation

- [System overview](docs/architecture/system-overview.md)
- [Folder structure](docs/architecture/folder-structure.md)
- [Architecture decisions](docs/architecture/decisions/)
- [API conventions and endpoints](docs/api/README.md)
- [Local setup and verification](docs/development/setup.md)
- [Security review](docs/security.md)
- [Deployment guide](docs/deployment.md)

## Verification

The project is considered healthy only when this passes:

```bash
npm run verify
```

It runs lint, formatting, API and seed typechecks, the full Vitest suite, and a clean production
build. The suite covers migrations and idempotent seeding, auth/session lifecycle, password reset,
profile updates, catalog filtering and pagination, favorites, cart totals, order creation and
cancellation, stock races, admin authorization, role changes, and OpenAPI/Swagger.

## Roadmap

- [x] 1. Project foundation
- [x] 2. Database (SQLite + SQL migrations)
- [x] 3. Authentication and users
- [x] 4. Product catalog and seed data
- [x] 5. Favorites, cart, orders
- [x] 6. Administration and OpenAPI/Swagger
- [x] 7. Security review, deployment notes, final verification
