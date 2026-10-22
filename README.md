# Loqta | لُقطة

Demo e-commerce backend for electronics and technology products. Built for learning and
portfolio presentation.

**Current status: Phase 1 — project foundation is complete and verified.** Business modules
(database, authentication, catalog, cart, orders, administration) are implemented in later
phases, in the order documented in the roadmap below.

## Stack

| Area         | Choice                                                     |
| ------------ | ---------------------------------------------------------- |
| Runtime      | Node.js >= 20.11, native ESM                               |
| Language     | TypeScript (strict, `NodeNext`)                            |
| HTTP         | Express 4                                                  |
| Validation   | Zod                                                        |
| Logging      | Pino + `pino-http`                                         |
| Security     | Helmet, CORS allow-list, centralized error handling        |
| Testing      | Vitest + Supertest                                         |
| Tooling      | ESLint 9, Prettier, npm workspaces, GitHub Actions         |
| Planned data | SQLite locally behind a D1-compatible data-access contract |

## Requirements

- Node.js >= 20.11 (CI uses Node 22)
- npm >= 10

## Quick start

```bash
npm install
```

Create the local environment file. Defaults work without it, but copying it keeps local settings
explicit:

```powershell
# Windows PowerShell
Copy-Item apps/api/.env.example apps/api/.env
```

```bash
# macOS / Linux
cp apps/api/.env.example apps/api/.env
```

Start the development server:

```bash
npm run dev
```

Verify the API:

```bash
curl.exe http://localhost:3000/api/v1/health
```

```json
{
  "data": {
    "status": "ok",
    "uptimeSeconds": 3,
    "timestamp": "2026-01-01T00:00:00.000Z"
  }
}
```

## Commands

| Command                | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `npm run dev`          | Start the API with hot reload (`tsx watch`)                |
| `npm run build`        | Clean and compile the API to `apps/api/dist`               |
| `npm start`            | Run the compiled API                                       |
| `npm test`             | Run unit and integration tests (Vitest)                    |
| `npm run test:watch`   | Run tests in watch mode (inside `apps/api`)                |
| `npm run typecheck`    | TypeScript check without emitting files                    |
| `npm run lint`         | ESLint across the repository                               |
| `npm run format`       | Format with Prettier                                       |
| `npm run format:check` | Verify formatting without writing                          |
| `npm run clean`        | Remove build output                                        |
| `npm run verify`       | Lint, format check, typecheck, tests, and production build |

## Environment variables

Environment variables are validated with Zod at startup; the process fails fast on invalid values.

| Variable       | Default                 | Description                                     |
| -------------- | ----------------------- | ----------------------------------------------- |
| `NODE_ENV`     | `development`           | `development`, `test`, or `production`          |
| `PORT`         | `3000`                  | HTTP port (1–65535)                             |
| `LOG_LEVEL`    | `info`                  | Pino level (`fatal`…`trace`, or `silent`)       |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated browser origins allowed by CORS |

Never commit `apps/api/.env` or real secrets. Only `.env.example` is tracked.

## API conventions

- All endpoints live under `/api/v1`.
- Success responses use `{ "data": ... }`.
- Errors use `{ "error": { "code", "message", "details?" } }`.
- Unknown routes return `404 NOT_FOUND`; malformed JSON returns `400 INVALID_JSON`; unexpected
  failures return `500 INTERNAL_ERROR` without internal details.
- Currently implemented: `GET /api/v1/health` (public).

See [docs/api/README.md](docs/api/README.md) for details. OpenAPI and Swagger UI are added in
Phase 6, when the business endpoints exist.

## Project layout

```text
loqta/
├── apps/api/          Express + TypeScript backend (routes, controllers, services, ...)
├── packages/shared/   Contracts shared with the future React frontend
├── database/          SQL migrations, seeds, database documentation
├── docs/              Architecture, API, and development documentation
├── scripts/           Repository maintenance scripts
├── .github/workflows/ CI pipeline
└── package.json       npm workspaces root
```

The full, authoritative tree is documented in
[docs/architecture/folder-structure.md](docs/architecture/folder-structure.md).

## Documentation

- [System overview](docs/architecture/system-overview.md)
- [Folder structure](docs/architecture/folder-structure.md)
- [Architecture decisions](docs/architecture/decisions/)
- [API conventions](docs/api/README.md)
- [Local setup and verification](docs/development/setup.md)

## Roadmap

- [x] 1. Project foundation
- [ ] 2. Database (SQLite + migrations)
- [ ] 3. Authentication and users
- [ ] 4. Product catalog and seeds
- [ ] 5. Favorites, cart, orders
- [ ] 6. Administration and OpenAPI/Swagger
- [ ] 7. Final review
