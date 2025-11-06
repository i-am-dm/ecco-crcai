# Manifest Compactor

Aggregates per-id manifest objects into sharded NDJSON files for fast listings.

Usage
- `npm i && npm run build`
- `node dist/index.js --bucket ecco-studio-platform-data --env prod --entity venture --shards 256`
 - Delta mode (last 1 hour): `node dist/index.js --bucket $BUCKET --env dev --entity ventures --since 1h`

Behavior
- Reads `env/{env}/manifests/{entity}/by-id/*.json`.
- Groups manifests into shards (default 256) using `manifestShardKey`.
- Writes `env/{env}/manifests/{entity}/_index_shard=<shard>.ndjson`.
- Uses GCS preconditions to avoid clobbering concurrent updates.

Notes
- Designed to run as a Cloud Run job (or cron-triggered Cloud Run service).
- In containerized builds within a monorepo, ensure workspace libs are vendored or pre-built into the image. The Terraform scheduler expects an image provided via `manifest_compactor_image`.
- For large datasets, consider streaming shards to temporary files to reduce memory footprint.
- Future enhancement: clean up shards with no entries (requires list of shard objects).
