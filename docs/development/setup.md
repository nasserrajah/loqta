# Local Setup and Verification

This guide covers the complete backend: SQLite, seed data, authentication, catalog, cart, orders,
administration, and API documentation.

## Prerequisites

- Node.js >= 20.19 (Node 22 is recommended and used in CI)
- npm >= 10
- Git
- A C++ build toolchain is **not** normally required: `better-sqlite3` installs a prebuilt binary.
  If your platform has no prebuild, npm falls back to compiling it.

## 1. Install dependencies

From the repository root:

```bash
npm install
```

npm workspaces installs the root tooling, `@loqta/api`, and `@loqta/shared` together. Use `npm ci`
in CI or when you need an exact install from `package-lock.json`.

## 2. Create the environment file

```powershell
# Windows PowerShell
Copy-Item apps/api/.env.example apps/api/.env
```

```bash
# macOS / Linux
cp apps/api/.env.example apps/api/.env
```

The API loads `.env` from both the repository root and `apps/api`. Environment variables are
validated by Zod on startup. Defaults are sufficient for local work.

## 3. Create and seed the database

```bash
npm run db:migrate
npm run db:seed
```

- Migrations live in `database/migrations` and are applied once each; the runner records versions in
  `schema_migrations`.
- The database file defaults to `apps/api/data/loqta.db` (relative to the API package, even if you
  start the process from the repository root).
- The seed is idempotent: re-running it does not duplicate users, categories, brands, products, or
  images. It also does not overwrite edited products; it only inserts rows that are missing.
- The server also applies pending migrations automatically at startup.

Seeded demo accounts:

| Role     | Email             | Password    |
| -------- | ----------------- | ----------- |
| Admin    | `admin@loqta.dev` | `Admin123!` |
| Customer | `user@loqta.dev`  | `User123!`  |

Seeded catalog: 9 categories, 14 brands, 27 products, 54 placeholder images.

## 4. Run the API

```bash
npm run dev
```

The server logs a startup message and listens on `http://localhost:3000` by default. Stop it with
`Ctrl+C`; the shutdown handler closes the HTTP server and the database.

If port 3000 is already in use, the server logs a clear `EADDRINUSE` message and exits non-zero.
Only run one instance at a time with the same port. To find and stop the process holding it:

```powershell
$connection = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
$connection | Select-Object LocalAddress, LocalPort, OwningProcess
$connection.OwningProcess | ForEach-Object { Stop-Process -Id $_ }
```

Alternatively, change `PORT` in `apps/api/.env`.

## 5. Verify the API

Health:

```bash
curl.exe http://localhost:3000/api/v1/health
```

```json
{
  "data": {
    "status": "ok",
    "uptimeSeconds": 2,
    "timestamp": "2026-01-01T00:00:00.000Z"
  }
}
```

Catalog:

```bash
curl.exe "http://localhost:3000/api/v1/products?pageSize=3"
curl.exe http://localhost:3000/api/v1/products/iphone-15-pro
```

Swagger UI: <http://localhost:3000/api/v1/docs>

Log in and call an authenticated route with a cookie jar:

```bash
curl.exe -c cookies.txt -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@loqta.dev\",\"password\":\"Admin123!\"}" \
  http://localhost:3000/api/v1/auth/login

curl.exe -b cookies.txt http://localhost:3000/api/v1/admin/stats
```

Unknown routes return a consistent error envelope:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Route GET /api/v1/unknown not found",
    "requestId": "..."
  }
}
```

## 6. Run all checks

```bash
npm run verify
```

`verify` runs, in order: ESLint, Prettier check, API/typechecks (including the seed CLI), Vitest, and
a clean production build. Individual commands are listed in the root `README.md`.

Tests use an in-memory SQLite database and a temporary bcrypt cost of 4, so they do not touch the
development database. The suite covers migrations, idempotent seeding, auth and sessions, password
reset, profile updates, catalog filtering, favorites, cart totals, orders, stock conflicts, admin
authorization, role changes, rate limiting, and OpenAPI/Swagger.

## 7. Run the compiled server

```bash
npm run build
npm start
```

The build uses `apps/api/tsconfig.build.json`, so tests and `vitest.config.ts` are not emitted into
`apps/api/dist`. The compiled entry point is `apps/api/dist/src/server.js`.

## Resetting local data

Stop the server first, then remove the SQLite files and recreate them:

```powershell
Remove-Item apps/api/data/loqta.db* -Force
npm run db:migrate
npm run db:seed
```

The `-wal` and `-shm` files belong to SQLite's write-ahead log; delete them together with the main
file.

## Troubleshooting

| Symptom                                         | Fix                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| `Invalid environment configuration`             | Check the variable named in the error and its allowed values.           |
| `EADDRINUSE`                                    | Change `PORT` or stop the process using the port.                       |
| `SQLITE_CANTOPEN` or permission error           | Ensure `apps/api/data` is writable, or set an absolute `DATABASE_PATH`. |
| Empty catalog after startup                     | Run `npm run db:seed`; migrations alone do not insert products.         |
| Login succeeds but cookie is not sent over HTTP | Production cookies are `Secure`; use HTTPS or `NODE_ENV=development`.   |
| CORS blocked in a browser                       | Add the frontend origin to `CORS_ORIGINS` (comma-separated).            |
| No colored logs                                 | `pino-pretty` is used only when `NODE_ENV=development`.                 |
| Tests hang or log to the console                | Vitest sets `NODE_ENV=test` and `LOG_LEVEL=silent` in its config.       |
| `npm install` emits engine warnings             | Use Node 20.19+ or 22; older versions are unsupported.                  |

## Tooling notes

- ESLint 10 and Vite 7 require Node 20.19+ or 22.12+.
- `vitest@4` can resolve Vite 7 or 8. The root `overrides` field pins `vite@7.3.7`, the combination
  tested here; this also avoids optional Rolldown binding issues seen with Vite 8.
- `better-sqlite3` is pinned to `11.10.0` because 12.x did not provide a working prebuilt binary for
  every local Node version at implementation time.
- `bcryptjs` is pure JavaScript, so password hashing needs no native toolchain.
- The seed CLI is typechecked by `database/tsconfig.json` and is not part of the production build.
