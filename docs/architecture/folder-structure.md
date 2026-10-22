# Folder Structure

This is the official structure. Do not rename or relocate directories without an ADR.

| Path                          | Purpose                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `apps/api/src/config`         | Environment parsing, path resolution, logger setup                                          |
| `apps/api/src/shared`         | Cross-cutting errors, HTTP helpers, types, utils, constants                                 |
| `apps/api/src/infrastructure` | Database adapters/repositories/migrations/seed, security, email                             |
| `apps/api/src/middleware`     | Auth, validation, rate limiting, not-found, centralized error handling                      |
| `apps/api/src/modules`        | Feature modules (auth, users, categories, brands, products, favorites, cart, orders, admin) |
| `apps/api/src/docs`           | OpenAPI document, paths, and component schemas                                              |
| `apps/api/tests`              | Unit, integration, and helpers                                                              |
| `packages/shared`             | Types/schemas reserved for the future frontend                                              |
| `database`                    | SQL migrations, seed CLI, database TypeScript config                                        |
| `docs`                        | Architecture, API, security, deployment, and development documentation                      |
| `scripts`                     | Repository maintenance scripts                                                              |
| `.github/workflows`           | CI                                                                                          |

```text
loqta/
├── apps/api/
│   ├── src/
│   │   ├── app.ts                 Express app factory
│   │   ├── server.ts              Process entry point, migrations, graceful shutdown
│   │   ├── config/                env.ts, logger.ts, paths.ts
│   │   ├── docs/                  openapi.ts, paths.ts, schemas.ts
│   │   ├── infrastructure/
│   │   │   ├── container.ts       Composition root
│   │   │   ├── database/
│   │   │   │   ├── connection/    DatabaseClient contract + SQLite adapter
│   │   │   │   ├── migrations/    Runner and CLI
│   │   │   │   ├── repositories/  SQL + row-to-domain mapping
│   │   │   │   └── seed.ts        Idempotent demo data
│   │   │   ├── email/             EmailSender contract + console sender
│   │   │   └── security/          PasswordHasher contract + bcryptjs adapter
│   │   ├── middleware/            auth, validate, rate-limit, 404, errors
│   │   ├── modules/
│   │   │   ├── auth/              schemas, DTOs, service, cookies, controller, routes
│   │   │   ├── users/
│   │   │   ├── categories/
│   │   │   ├── brands/
│   │   │   ├── products/
│   │   │   ├── favorites/
│   │   │   ├── cart/
│   │   │   ├── orders/
│   │   │   └── admin/
│   │   └── shared/                constants, errors, http, types, utils
│   ├── tests/
│   │   ├── helpers/               test app/context and auth helpers
│   │   ├── integration/           HTTP, database, docs tests
│   │   └── unit/                  env tests
│   └── data/                      Local SQLite files (gitignored)
├── database/
│   ├── migrations/                Versioned SQL (D1-compatible)
│   ├── seeds/seed.ts              CLI that calls the demo seed
│   └── tsconfig.json              Typechecks the seed CLI
├── docs/
│   ├── api/
│   ├── architecture/
│   ├── development/
│   ├── security.md
│   └── deployment.md
├── packages/shared/
├── scripts/
└── .github/workflows/
```

## Layer rules

- A module may import its own schemas/DTOs/entities and shared utilities. Controllers may call
  services, never repositories directly.
- Services depend on repository interfaces, hashers, and senders; they never import Express.
- Repositories may be imported by the composition root only, plus their feature service through the
  exported interface.
- Only repositories and the migration/seed runner execute SQL.
- Admin routes reuse the category, brand, product, and order services. Administration is an access
  boundary, not a duplicate business implementation.

## Build tooling

- `apps/api/tsconfig.json` typechecks `src`, `tests`, and the Vitest config.
- `apps/api/tsconfig.build.json` builds `src` only (ADR 0003).
- `database/tsconfig.json` typechecks the seed CLI, which lives outside the API build.
- `scripts/clean.mjs` removes `apps/api/dist` before a production build.

Empty directories contain a `.gitkeep` so Git preserves them; remove it once real files exist. The
health endpoint stays in `apps/api/src/shared/http` because it is infrastructure-level and belongs to
no business module (ADR 0002).
