# ADR 0003: Index Pointer Object Shape

Status: Accepted
Date: 2025-11-06

Context
- Secondary indices are implemented as small pointer files under `indices/...` to speed up hot queries.
- Lists should be renderable without fetching full snapshots when possible.

Decision
- Pointer JSON schema (minimum):
  ```json
  {"ptr":"env/.../snapshots/{entity}/{id}.json","id":"{id}","updated_at":"RFC3339","entity":"{entity}"}
  ```
- Optional lightweight display fields may be included to power list views, depending on entity:
  - Common fields: `title`, `status`, `lead`, `ventureId` (when applicable)

Consequences
- Writers/handlers can evolve pointer shape additively; readers should tolerate extra fields.
- Index writer computes pointer paths deterministically; deletes stale pointers on key changes.

