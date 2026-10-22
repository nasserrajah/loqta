# Database

SQLite is used locally through `apps/api/src/infrastructure/database/connection`. Migrations are
versioned SQL files in `migrations/`; the runner records applied files in `schema_migrations`.
`seeds/seed.ts` is the CLI wrapper around the idempotent demo seed.

From the repository root:

```bash
npm run db:migrate
npm run db:seed
```

- The database path defaults to `apps/api/data/loqta.db` (gitignored).
- Relative `DATABASE_PATH` values are resolved from the `apps/api` package root, so the CLI and the
  server use the same file regardless of the shell's working directory.
- The server applies pending migrations on startup; seeding is always explicit.
- Migrations are forward-only and use SQLite syntax supported by Cloudflare D1.
- The seed is safe to re-run: it inserts missing users, categories, brands, products, and images
  without overwriting edited rows.

See `apps/api/src/infrastructure/database/repositories/` for SQL and `docs/deployment.md` for
production backup and migration guidance.
