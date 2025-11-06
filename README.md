# Ecco Studio Platform — JSON‑in‑GCS Data Platform

Serverless data platform that persists venture‑studio entities as JSON objects in Google Cloud Storage (GCS), with TypeScript libraries and Cloud Run handlers to maintain snapshots, manifests, indices, and rule‑driven alerts. Terraform provisions bucket, Pub/Sub, Cloud Run, and analytics wiring.

- Language/Runtime: TypeScript on Node.js 20 (ES Modules)
- Compute: Cloud Run (Pub/Sub push)
- Storage: GCS (UBLA, PAP enforced, versioning)
- Indexing: Per‑id manifests + sharded NDJSON for fast list queries
- Validation: JSON Schema (Ajv optional)
- IDs & Time: ULIDs and RFC3339 helpers

See the platform spec for rationale and detailed layouts: `ecco-crcai.md` and ADRs in `docs/adr/`.


## Repository Structure

- `libs/ts/` — Shared TypeScript library (envelope, ULID, RFC3339, JSON Schema validator, GCS client, write paths, manifests, indices, rules)
- `services/` — Cloud Run services (event‑driven):
  - `snapshot-builder/` — Builds/updates `snapshots/` from finalized `history/`
  - `manifest-writer/` — Writes per‑id manifest objects from snapshots
  - `index-writer/` — Maintains secondary index pointer files under `indices/`
  - `rules-engine/` — Evaluates rules on snapshots, writes `reports/alerts/`, optional webhook dispatch
  - `manifest-compactor/` — CLI/Job to compact per‑id manifests into sharded NDJSON
- `apps/write-cli/` — CLI to write history, update snapshots, seed data, rebuild manifests
- `schemas/` — JSON Schemas for entities (`idea`, `venture`, `round`, `cap_table`)
- `infra/terraform/` — Terraform for bucket, Pub/Sub, IAM, Cloud Run services, Cloud Run Jobs + Scheduler (compactor), BigQuery
- `analytics/ddl/` — Notes on external tables/views over snapshots
- `ui/` — Tailwind‑based static UI starter aligned with entities
- `docs/` — ADRs, secrets guidance, examples; `runbooks/` for cutover/DR


## Data Layout & Conventions (GCS)

- Environments: `env/dev|stg|prod/`
- Envelope (all entities): `{ id, entity, env, schema_version, created_at, updated_at }`
- History (append‑only): `env/{env}/{segment}/{id}/history/{yyyy}/{mm}/{dd}/{tsZ}_{ulid}.json`
- Snapshots (latest): `env/{env}/snapshots/{segment}/{id}.json`
- Manifests (per‑id): `env/{env}/manifests/{segment}/by-id/{id}.json`
- Manifest shards (ndjson): `env/{env}/manifests/{segment}/_index_shard=<hex>.ndjson`
- Secondary indices (pointers), examples:
  - Ventures by status: `env/{env}/indices/ventures/by-status/{statusSlug}/{id}.json`
  - Ventures by lead: `env/{env}/indices/ventures/by-lead/{leadSlug}/{id}.json`
  - Ventures by next‑due month: `env/{env}/indices/ventures/by-next-due/{yyyy-mm}/{id}.json`
  - Rounds by venture: `env/{env}/indices/rounds/by-venture/{ventureId}/{roundId}.json`
  - Cap table latest by venture: `env/{env}/indices/cap_tables/by-venture/{ventureId}.json`

Pointer shape (minimum): `{ "ptr": "env/.../snapshots/{entity}/{id}.json", "id": "{id}", "updated_at": "RFC3339", "entity": "{entity}" }` plus optional display fields (`title`, `status`, `lead`, `ventureId`, etc.).


## Quick Start

Prerequisites
- Node.js 20+, npm
- GCP project + ADC for local auth (or set `GOOGLE_APPLICATION_CREDENTIALS`)
- Terraform 1.5+ (for infra), Docker optional for local containers

Install & Build
- `npm install` (root)
- Build all workspaces: `npm run build --workspaces`
- Library tests: `cd libs/ts && npm run test`

Local Services (direct)
- Example: `cd services/snapshot-builder && npm run build && npm start`
- Each service exposes `POST /pubsub/push` for Pub/Sub push simulation (send base64 JSON API payload)

Local via Docker Compose
- Copy `.env.example` → `.env` and populate values
- `docker compose -f docker-compose.dev.yml up --build`
- Containers expose ports 8081..8084 for services


## Packages & Services

Libraries: `@ecco/platform-libs` (`libs/ts`)
- Envelope helpers: `newEnvelope()`, `touch()`
- ULID and RFC3339 utilities
- JSON Schema validator: uses Ajv if available, minimal fallback otherwise
- GCS client with optimistic preconditions (`ifGenerationMatch`, `ifMetagenerationMatch`)
- Write path helpers: `makeHistoryPath`, `makeSnapshotPath`, `writeHistory`, `updateSnapshot`
- Manifests & shards: `manifestFromSnapshot`, `makeManifestPerIdPath`, `manifestShardKey`
- Indices: `buildIndexPointers()` (venture/round/cap table), slug helper
- Rules: `evaluateRule`, `buildAlert`

CLI: `apps/write-cli`
- Write history: `write-history`
- Write + snapshot: `write-and-snapshot`
- Seed a directory tree: `seed-dir`
- Rebuild per‑id manifests from snapshots: `rebuild-manifests`

Services (Cloud Run)
- `snapshot-builder` — On history finalize, reads JSON and updates snapshot with idempotency and preconditions
- `manifest-writer` — On snapshot finalize, derives and upserts `manifests/.../by-id/{id}.json`
- `index-writer` — On snapshot finalize, derives/cleans secondary pointer files under `indices/...`
- `rules-engine` — On snapshot finalize, loads rules (`env/{env}/rules/*.json`), evaluates, writes `reports/alerts/...`, optional webhook dispatch via Secret Manager or env targets
- `manifest-compactor` (CLI/Job) — Builds/updates `_index_shard=<hex>.ndjson` from per‑id manifests (full or delta window)

UI
- `ui/index.html` — Tailwind 3 static starter for lists/dashboards aligned to entities and indices

Analytics
- BigQuery external tables over `snapshots/` and views per env; see `analytics/ddl/` and `infra/terraform/bigquery.tf`


## Configuration & Secrets

- Environment variables: see `.env.example` and `docs/SECRETS.md`
- Secret Manager: rules engine supports `sm://SECRET_NAME` targets; grant `roles/secretmanager.secretAccessor` to service account
- Local secret helper: `tools/secret-pull` writes secrets to `.env.local` from Secret Manager


## Infrastructure (Terraform)

What it provisions
- GCS data bucket (UBLA, PAP, versioning, optional CMEK)
- Pub/Sub topics + DLQs; notifications for `OBJECT_FINALIZE` under `env/`
- Cloud Run services (when images provided): snapshot‑builder, manifest‑writer, index‑writer, rules‑engine, with path‑scoped IAM conditions
- BigQuery datasets (`analytics_dev|stg|prod`), BigLake external tables, views
- Cloud Run Jobs + Scheduler for `manifest-compactor` (delta hourly, full nightly)

Usage
- `cd infra/terraform && terraform init`
- Plan/apply: `terraform apply -var project_id=YOUR_PROJECT -var region=us-central1`
- Optional vars: `bucket_name`, `enable_cmek`, `manifest_compactor_image`, per‑service handler images, IAM subjects for scoped access


## Testing

- Library unit tests: `cd libs/ts && npm run test` (Node’s built‑in test runner)
- Services: prefer integration tests via HTTP mocks or emulator scripts; post sample Pub/Sub payloads to `/pubsub/push`
- Idempotency: tests cover write‑path guards (`updated_at`, GCS preconditions) and index cleanup logic


## Coding Style

- TypeScript (ES2022 modules, strict)
- Prefer named exports and async/await
- 2‑space indentation; JSON snake_case; code camelCase; dash‑case for file/dirs (e.g., `index-writer`)
- Manifests end with `.json`; shards use `_index_shard=<hex>.ndjson`


## Docs & Runbooks

- Platform spec: `ecco-crcai.md`
- ADRs: `docs/adr/0001-runtime-platform.md` … `0005-cmek-encryption.md`
- Secrets: `docs/SECRETS.md`
- Examples: `docs/examples/*`
- Cutover & DR: `runbooks/cutover.md`, `runbooks/dr.md`


## CI/CD

- GitHub Actions: `.github/workflows/sync-todos.yml` parses `TODO.md` to open/update GitHub issues
- Provide container images for handlers/jobs to enable Terraform deployment of Cloud Run resources


## Common Commands

- Build all workspaces: `npm run build --workspaces`
- Run library tests: `cd libs/ts && npm run test`
- Start a service locally (example):
  - `cd services/index-writer && npm run build && npm start`
  - Post event: `curl -s localhost:8080/pubsub/push -H 'content-type: application/json' -d '{"message":{"data":"<base64 JSON_API_V1>"}}'`
- Compact manifests (full): `node services/manifest-compactor/dist/index.js --bucket $BUCKET --env prod --entity ventures --shards 256`
- Compact manifests (delta 1h): `... --since 1h`


## License

Proprietary — see project terms. Do not commit real secrets or raw data exports.

