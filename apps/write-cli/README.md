# Write CLI

CLI for writing history records (and optionally updating snapshots) to the JSON-in-GCS bucket.

Usage
- Build: `npm run build` (from `apps/write-cli`)
- Write a history record:
  ```sh
  node dist/index.js write-history --bucket ecco-studio-platform-data --env dev --entity idea --id IDEA-001 --file ./sample.json
  ```
- Write and immediately update snapshot (app-side flow):
  ```sh
  node dist/index.js write-and-snapshot --bucket ecco-studio-platform-data --env dev --entity venture --id V001 --file ./venture.json
  ```
- Seed from a directory structure (per entity subfolders):
  ```sh
  node dist/index.js seed-dir --bucket ecco-studio-platform-data --env dev --root ./seed --snapshots true
  ```
- Rebuild per-id manifests from snapshots (all entities):
  ```sh
  node dist/index.js rebuild-manifests --bucket ecco-studio-platform-data --env dev --entity all
  ```

Notes
- Validates payloads against repo JSON Schemas before writing.
- Uses optimistic concurrency for snapshots and idempotency via `updated_at` ordering.
- Requires `GOOGLE_APPLICATION_CREDENTIALS` or default ADC for GCS access.

