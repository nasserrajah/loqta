# ADR 0001: npm workspaces monorepo with a fixed structure

Status: Accepted

Context: The backend must support a future React frontend without redesign, and the layout must
stay stable across all phases.

Decision: Use npm workspaces (`apps/*`, `packages/*`) with `tsconfig.base.json`. The directory
tree in `folder-structure.md` is authoritative. Structural changes require a new ADR.

Consequences: Predictable locations for code; `apps/web` can be added later cleanly.
