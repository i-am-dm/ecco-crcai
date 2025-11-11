# Ecco Studio Platform — Venture Studio Platform

Serverless venture studio platform for ideation → validation → build → launch → scale → spin-out. Services maintain snapshots, manifests, indices, and rule‑driven alerts. Terraform provisions core resources and analytics wiring.

Authoritative docs
- Feature Requirements Document (FRD): `docs/frd/ecco-studio-platform-frd_v1.1.md`
- GCS JSON Persistence Spec v1.2: `ecco_gcs_json_persistence_spec_v1.2.md`

## Best-of-Breed Modules

- Idea Intake & Screening — structured submissions, scoring, stage workflow.
- Venture Workspace — milestones, roadmap, dependencies, risks.
- Resource Allocation — people, utilisation, shared-services requests and SLAs.
- Budget & Spend — plan vs actuals, burn and runway.
- KPIs & Portfolio — per-venture KPIs, portfolio summaries, benchmarking.
- Fundraising & Equity — pipeline, rounds, cap tables, investor updates.
- Talent Marketplace — founder/advisor pool and matching.
- Experiments & What‑If — hypotheses and simulations with persisted results.
- Playbooks & Rules — SOPs, triggers, alerts, and exports.
- Dataroom & Governance — VDR metadata, RBAC, audit, compliance.

## Personas & Value

- Leadership — portfolio health, allocation signals, risk heatmaps, exports.
- Venture Leads — single workspace for roadmap, experiments, KPIs, and funding.
- Ops & Finance — utilisation, SLAs, budgets, and compliance packs.
- Investors/LPs — curated dashboards and scheduled updates.

- Language/Runtime: TypeScript on Node.js 20 (ES Modules)
 - Language/Runtime: TypeScript on Node.js 20 (ES Modules)
 - Compute: Event-driven handlers (Pub/Sub push)
 - Storage: Object storage (versioning, access controls)
- Indexing: Per‑id manifests + sharded NDJSON for fast list queries
- Validation: JSON Schema (Ajv optional)
- IDs & Time: ULIDs and RFC3339 helpers

See the platform spec and FRD for rationale and detailed layouts: `ecco_gcs_json_persistence_spec_v1.2.md` and `docs/frd/ecco-studio-platform-frd_v1.1.md`, plus ADRs in `docs/adr/`.


## Repository Structure

- `libs/ts/` — Shared TypeScript library (envelope, ULID, RFC3339, JSON Schema validator, storage client, write paths, manifests, indices, rules)
- `services/` — Event‑driven services:
  - `snapshot-builder/` — Builds/updates `snapshots/` from finalized `history/`
  - `manifest-writer/` — Writes per‑id manifest objects from snapshots
  - `index-writer/` — Maintains secondary index pointer files under `indices/`
  - `rules-engine/` — Evaluates rules on snapshots, writes `reports/alerts/`, optional webhook dispatch
  - `manifest-compactor/` — CLI/Job to compact per‑id manifests into sharded NDJSON
- `apps/write-cli/` — CLI to write history, update snapshots, seed data, rebuild manifests
- `schemas/` — JSON Schemas for entities (`idea`, `venture`, `round`, `cap_table`)
- `infra/terraform/` — Terraform for storage, Pub/Sub, IAM, services, jobs + scheduler (compactor), analytics datasets
- `analytics/ddl/` — Notes on external tables/views over snapshots
- `ui/` — Tailwind‑based static UI starter aligned with entities
- `docs/` — ADRs, secrets guidance, examples; `runbooks/` for cutover/DR (`runbooks/seed-dev-data.md` covers seeding fixtures into a bucket for local smoke tests)


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
- Standard: `docker compose -f docker-compose.dev.yml up --build`
- Hot‑reload: `docker compose -f docker-compose.dev.yml --profile watch up --build`
  - Starts `*-watch` variants and `ui-watch` (live reload on port 8080)
  - Standard `ui` (nginx) is under profile `dev` to avoid port conflicts
  - API edge on 8085; UI expects it at `http://localhost:8085`


## Packages & Services

Libraries: `@ecco/platform-libs` (`libs/ts`)
- Envelope helpers: `newEnvelope()`, `touch()`
- ULID and RFC3339 utilities
- JSON Schema validator: uses Ajv if available, minimal fallback otherwise
- Storage client with optimistic preconditions (`ifGenerationMatch`, `ifMetagenerationMatch`)
- Write path helpers: `makeHistoryPath`, `makeSnapshotPath`, `writeHistory`, `updateSnapshot`
- Manifests & shards: `manifestFromSnapshot`, `makeManifestPerIdPath`, `manifestShardKey`
- Indices: `buildIndexPointers()` (venture/round/cap table), slug helper
- Rules: `evaluateRule`, `buildAlert`

CLI: `apps/write-cli`
- Write history: `write-history`
- Write + snapshot: `write-and-snapshot`
- Seed a directory tree: `seed-dir`
- Rebuild per‑id manifests from snapshots: `rebuild-manifests`

Services
- `snapshot-builder` — On history finalize, reads JSON and updates snapshot with idempotency and preconditions
- `manifest-writer` — On snapshot finalize, derives and upserts `manifests/.../by-id/{id}.json`
- `index-writer` — On snapshot finalize, derives/cleans secondary pointer files under `indices/...`
- `rules-engine` — On snapshot finalize, loads rules (`env/{env}/rules/*.json`), evaluates, writes `reports/alerts/...`, optional webhook dispatch via Secret Manager or env targets
- `manifest-compactor` (CLI/Job) — Builds/updates `_index_shard=<hex>.ndjson` from per‑id manifests (full or delta window)

UI
- `ui/index.html` — Tailwind 3 static starter for lists/dashboards aligned to entities and indices
  - Pages: Ideas, Ventures, Talent, Experiments, Rounds, Cap Tables, Reports,
    Resources, Budgets, KPIs, Investors, Partners, Services, Playbooks, Rules,
    Benchmarks, Models, Simulations, Dataroom, Utilisation, Heatmaps, Audit,
    Entities, Exports

Analytics
- External tables over `snapshots/` and views per env; see `analytics/ddl/` and `infra/terraform/bigquery.tf`


## Configuration & Secrets

- Environment variables: see `.env.example` and `docs/SECRETS.md`
- Secret Manager: rules engine supports `sm://SECRET_NAME` targets; grant `roles/secretmanager.secretAccessor` to service account
- Local secret helper: `tools/secret-pull` writes secrets to `.env.local` from Secret Manager


## Infrastructure (Terraform)

What it provisions
- Storage with versioning and lifecycle
- Pub/Sub topics + DLQs; notifications for object finalize under `env/`
- Services for snapshot, manifest, index, and rules processing with path‑scoped IAM conditions
- Analytics datasets (dev|stg|prod), external tables, and views
- Jobs + Scheduler for `manifest-compactor` (delta hourly, full nightly)

Usage
- `cd infra/terraform && terraform init`
- Plan/apply: `terraform apply -var project_id=YOUR_PROJECT -var region=us-central1`
- Optional vars: `bucket_name`, `enable_cmek`, `manifest_compactor_image`, per‑service handler images, IAM subjects for scoped access


## Testing

- Library unit tests: `cd libs/ts && npm run test` (Node’s built‑in test runner)
- Services: prefer integration tests via HTTP mocks or emulator scripts; post sample Pub/Sub payloads to `/pubsub/push`
- Idempotency: tests cover write‑path guards (`updated_at`, storage preconditions) and index cleanup logic


## Coding Style

- TypeScript (ES2022 modules, strict)
- Prefer named exports and async/await
- 2‑space indentation; JSON snake_case; code camelCase; dash‑case for file/dirs (e.g., `index-writer`)
- Manifests end with `.json`; shards use `_index_shard=<hex>.ndjson`


## Docs & Runbooks

- Platform spec: `ecco_gcs_json_persistence_spec_v1.2.md`
- FRD: `docs/frd/ecco-studio-platform-frd_v1.1.md`
- ADRs: `docs/adr/0001-runtime-platform.md` … `0005-cmek-encryption.md`
- Secrets: `docs/SECRETS.md`
- Examples: `docs/examples/*`
- Cutover & DR: `runbooks/cutover.md`, `runbooks/dr.md`


## CI/CD

- GitHub Actions: see `docs/ci-cd.md` for the full pipeline (CI, Terraform plan, Cloud Run deploy, ChatOps `/deploy`).
- Images are built from `services/*` and pushed to Artifact Registry; Terraform wires Cloud Run + Pub/Sub + IAM using the image digests.


## Common Commands

- Build all workspaces: `npm run build --workspaces`
- Run library tests: `cd libs/ts && npm run test`
- Start a service locally (example):
  - `cd services/index-writer && npm run build && npm start`
  - Post event: `curl -s localhost:8080/pubsub/push -H 'content-type: application/json' -d '{"message":{"data":"<base64 JSON_API_V1>"}}'`
- Compact manifests (full): `node services/manifest-compactor/dist/index.js --bucket $BUCKET --env prod --entity ventures --shards 256`
- Compact manifests (delta 1h): `... --since 1h`

## API Endpoints (dev)

- Generic list/get
  - `GET /v1/{entity}?env=dev|stg|prod`
  - `GET /v1/{entity}/{id}?env=...`
- Venture indices (filters)
  - `GET /v1/index/ventures/by-status/{status}`
  - `GET /v1/index/ventures/by-lead/{lead}`
  - `GET /v1/index/ventures/by-next-due/{yyyy-mm}`
- Cross-entity indices
  - `GET /v1/index/rounds/by-venture/{ventureId}`
  - `GET /v1/index/cap_tables/by-venture/{ventureId}`
- Aggregates and stubs
  - `GET /v1/portfolio/summary`
  - `GET /v1/portfolio/heatmap`
  - `GET /v1/kpis/{metric}/series`
  - `GET /v1/ops/utilisation`
  - `GET /v1/exports`
  - `GET /v1/audit/logs`

Auth (dev)
- Demo RBAC via header: `-H "x-roles: Admin"`
- In production, use bearer JWT verified against Identity Platform; see `services/api-edge/src/auth.ts`.


## License

Proprietary — see project terms. Do not commit real secrets or raw data exports.
