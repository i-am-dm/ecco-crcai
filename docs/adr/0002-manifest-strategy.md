# ADR 0002: Manifest Strategy

Status: Accepted
Date: 2025-11-06

Context
- Single `_index.ndjson` creates a hot object and requires rewriting for upserts (GCS objects are immutable).
- We need low-latency discovery and cost-effective list queries.

Decision
- Write per-id manifest objects in realtime: `manifests/{entity}/by-id/{id}.json`.
- Build and maintain sharded ndjson files periodically for fast listings: `manifests/{entity}/_index_shard=00..FF.ndjson`.

Consequences
- Realtime path avoids hot single-file contention and supports idempotent updates.
- Readers list shards for efficient scans; a `manifest-compactor` job reconciles per-id to shards.
- Failure modes are recoverable by full rebuild from snapshots/history.

