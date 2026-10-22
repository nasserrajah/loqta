# Folder Structure

This is the official structure. Do not rename or relocate directories without an ADR.

| Path                          | Purpose                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `apps/api/src/config`         | Environment parsing and logger setup                                                        |
| `apps/api/src/shared`         | Cross-cutting errors, HTTP helpers, types, utils, constants                                 |
| `apps/api/src/infrastructure` | Database, security, storage, email implementations                                          |
| `apps/api/src/middleware`     | Auth, validation, not-found, centralized error handling                                     |
| `apps/api/src/modules`        | Feature modules (auth, users, categories, brands, products, favorites, cart, orders, admin) |
| `apps/api/src/docs`           | OpenAPI document and schemas (Phase 6)                                                      |
| `apps/api/tests`              | Unit, integration, and helpers                                                              |
| `packages/shared`             | Types/schemas shared with the future frontend                                               |
| `database`                    | Migrations, seeds, DB documentation                                                         |
| `docs`                        | Architecture, API, and development documentation                                            |
| `scripts`                     | Repository maintenance scripts                                                              |
| `.github/workflows`           | CI                                                                                          |

Build tooling:

- `apps/api/tsconfig.json` — typechecks `src`, `tests`, and the Vitest config.
- `apps/api/tsconfig.build.json` — production build of `src` only (see ADR 0003).
- `scripts/clean.mjs` — removes `apps/api/dist` before a production build.

Empty directories contain a `.gitkeep` so Git preserves them; remove it once real files exist.
The health endpoint lives in `apps/api/src/shared/http` because it is infrastructure-level and
belongs to no business module (see ADR 0002).
