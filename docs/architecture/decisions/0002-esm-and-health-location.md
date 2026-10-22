# ADR 0002: Native ESM (NodeNext) and health endpoint placement

Status: Accepted

Decision 1: Use `"type": "module"` with `module: NodeNext`. Relative imports use `.js`
extensions. This aligns with modern tooling and Cloudflare-style runtimes.

Decision 2: The health route lives in `src/shared/http` (not a module) because the approved
structure has no health module and health is not business logic. Routes are aggregated in
`shared/http/router.ts` and mounted at `/api/v1`.

Consequences: Slightly more verbose imports; no new top-level folders were needed.
