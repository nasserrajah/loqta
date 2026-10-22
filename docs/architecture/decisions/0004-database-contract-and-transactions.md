# ADR 0004: Async D1-ready database contract and SQLite adapter

Status: Accepted

## Context

The project needs a local database now and a path to Cloudflare D1 later. Native SQLite drivers are
synchronous, while D1 is asynchronous. If services or repositories depended on `better-sqlite3`
directly, a future migration would touch every module. Order placement also needs multi-statement
atomicity.

## Decision

1. Define `DatabaseClient` with async `all`, `get`, `run`, `exec`, `transaction`, and `close`.
2. Implement a local `SqliteDatabaseClient` using `better-sqlite3`. It serializes operations through
   a promise queue so a transaction owns the connection until its callback settles.
3. Use `BEGIN IMMEDIATE` / `COMMIT` / `ROLLBACK`; nested transaction calls join the open transaction.
4. Keep every SQL statement in repositories or the migration/seed runner.
5. Store money as integer cents and expose decimal strings only in DTOs.

## Consequences

- Services and repositories are unchanged when a D1 adapter is added.
- Transactions are deterministic for this single-process SQLite deployment.
- The queue means all database work is serialized; that is acceptable at demo scale and documented
  as a scaling limit.
- SQLite syntax stays within the D1-supported subset (`ON CONFLICT`, checks, foreign keys, indexes).
