# Local Setup and Verification

This guide covers the Phase 1 backend. Database setup is added in Phase 2.

## Prerequisites

- Node.js >= 20.19
- npm >= 10
- Git

## 1. Install dependencies

From the repository root:

```bash
npm install
```

npm workspaces installs the root tooling, `@loqta/api`, and `@loqta/shared` together. Use
`npm ci` instead of `npm install` in CI or when you need an exact install from `package-lock.json`.

## 2. Create the environment file

```powershell
# Windows PowerShell
Copy-Item apps/api/.env.example apps/api/.env
```

```bash
# macOS / Linux
cp apps/api/.env.example apps/api/.env
```

The API reads `.env` from its own workspace directory, which is the working directory used by the
root npm scripts. Environment variables are validated by Zod on startup.

## 3. Run the API

```bash
npm run dev
```

The server logs a startup message and listens on `http://localhost:3000` by default. Stop it with
`Ctrl+C`. The shutdown handler closes the HTTP server gracefully.

If port 3000 is already in use, the server now logs a clear `EADDRINUSE` message and exits with a
non-zero code instead of crashing with an unhandled error. Only run one instance at a time:
`npm run dev` and `npm start` both bind the same port. To find and stop the process holding it:

```powershell
$connection = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
$connection | Select-Object LocalAddress, LocalPort, OwningProcess
$connection.OwningProcess | ForEach-Object { Stop-Process -Id $_ }
```

Alternatively, change `PORT` in `apps/api/.env` for the second instance.

## 4. Verify the health endpoint

```bash
curl.exe http://localhost:3000/api/v1/health
```

Expected response (`timestamp` and `uptimeSeconds` vary):

```json
{
  "data": {
    "status": "ok",
    "uptimeSeconds": 2,
    "timestamp": "2026-01-01T00:00:00.000Z"
  }
}
```

Unknown routes return a consistent error envelope:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Route GET /api/v1/unknown not found"
  }
}
```

## 5. Run all checks

```bash
npm run verify
```

`verify` runs, in order: ESLint, Prettier check, TypeScript typecheck, Vitest, and a clean
production build. Individual commands are listed in the root `README.md`.

## 6. Run the compiled server

```bash
npm run build
npm start
```

The build uses `apps/api/tsconfig.build.json`, so tests and `vitest.config.ts` are not emitted into
`apps/api/dist`. The compiled entry point is `apps/api/dist/src/server.js`.

## Troubleshooting

| Symptom                             | Fix                                                               |
| ----------------------------------- | ----------------------------------------------------------------- |
| `Invalid environment configuration` | Check the variable named in the error and its allowed values.     |
| `EADDRINUSE`                        | Change `PORT` or stop the process using the port.                 |
| CORS blocked in a browser           | Add the frontend origin to `CORS_ORIGINS` (comma-separated).      |
| No colored logs                     | `pino-pretty` is used only when `NODE_ENV=development`.           |
| Tests hang or log to the console    | Vitest sets `NODE_ENV=test` and `LOG_LEVEL=silent` in its config. |

## Phase 1 scope

Implemented and verified:

- npm workspaces and the fixed folder structure
- Strict TypeScript with native ESM
- Express app factory, JSON parsing, Helmet, CORS, Pino request logging
- Environment validation and fail-fast startup
- `GET /api/v1/health`
- Centralized 404 and error handling
- Unit and integration tests, including a real HTTP server startup test
- CI workflow and architecture documentation

Not implemented yet: SQLite, migrations, authentication, business modules, OpenAPI/Swagger UI.

## Tooling notes

- Node.js 20.19+ (or 22.12+) is required by ESLint 10 and Vite 7. Running an older Node version
  produces engine warnings and is not supported.
- `vitest@4` can resolve Vite 7 or 8. The root `overrides` field pins `vite@7.3.7`, the combination
  tested here; this also avoids the optional native Rolldown binding issues seen with Vite 8.
- `npm audit` reports zero vulnerabilities with the committed lockfile. Re-run it after dependency
  changes.
