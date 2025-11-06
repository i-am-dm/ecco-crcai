# ADR 0004: Cap Table Snapshot Keying

Status: Accepted
Date: 2025-11-06

Context
- Cap tables are denormalized snapshots of the latest capitalization state.
- We frequently need to fetch the latest cap table for a given venture.

Decision
- Keep a distinct `cap_table` id (e.g., `CT-...`) as the snapshot key: `snapshots/cap_tables/{capTableId}.json`.
- Maintain a secondary index pointer by venture: `indices/cap_tables/by-venture/{ventureId}.json` → `{ ptr, id, updated_at }`.

Consequences
- Allows flexibility if multiple cap table instances or workflows emerge (e.g., drafts), while current pointer resolves the latest published snapshot for a venture.
- Clients resolve by venture via the index, then fetch the snapshot by id.

