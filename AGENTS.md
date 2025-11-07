# Repository Guidelines

## Project Structure & Module Organization
- `libs/ts/` — Shared TypeScript packages (GCS client, schemas, write path, manifests, indices, rules). Tests live under `libs/ts/test/` using Node’s built-in runner.
- `services/` — Event-driven Cloud Run services: `snapshot-builder`, `manifest-writer`, `manifest-compactor`, `index-writer`, `rules-engine`. Each has its own `package.json`, `tsconfig.json`, and Dockerfile.
- `apps/write-cli/` — CLI for authoring history/snapshot records during development and seeding.
- `schemas/` — JSON Schema definitions referenced by writers and validators.
- `infra/terraform/` — Terraform modules for buckets, Pub/Sub, IAM, lifecycle, and environment-specific tfvars.
- `ui/` — Tailwind-based static reference UI aligned with platform entities.

## Build, Test, and Development Commands
- Install workspaces: `npm install` (root) then `npm run build --workspaces` to compile TypeScript outputs.
- Library tests: `cd libs/ts && npm run test` (runs Node’s `test` runner over `libs/ts/test/*.spec.ts`).
- Service build (example): `cd services/index-writer && npm run build` (produces `dist/`). Use `npm start` for local HTTP simulation.
- Terraform plan/apply: `cd infra/terraform && terraform init && terraform plan -var project_id=...`.
 - Docker Compose (dev):
   - Standard: `docker compose -f docker-compose.dev.yml up --build` (UI on :8080, API edge :8085, services :8081..8084)
   - Hot‑reload: `docker compose -f docker-compose.dev.yml --profile watch up --build` (starts `*-watch` and `ui-watch`)

## Coding Style & Naming Conventions
- TypeScript (ES2022 modules, strict mode). Prefer named exports and async/await.
- Follow 2-space indentation, snake_case for JSON properties, camelCase for code, dash-case for file names (`index-writer`).
- JSON manifests/indices end with `.json`; NDJSON shards use `_index_shard=<hex>.ndjson`.
- Use ULIDs for time-ordered IDs and RFC3339 timestamps (helpers in `libs/ts`).

## Testing Guidelines
- Add unit tests alongside libraries (`libs/ts/test/...`). Name files `<feature>.spec.ts` and cover envelope validation, pointer generation, rule evaluation, etc.
- For services, prefer integration tests via HTTP mocks or emulator scripts before deploying.
- Maintain idempotency tests for write path and index cleanup logic.

## Commit & Pull Request Guidelines
- Adopt Conventional Commit style (e.g., `feat: add index writer cleanup`, `fix: ensure snapshot builder detects plural segments`).
- Each PR should outline the affected phase, validation steps (tests/terraform plan), and deployment notes. Include links to relevant ADRs or TODO items.
- Provide sample payloads or commands in the PR description when touching GCS writers or rules to aid reviewers.

## Security & Configuration Tips
- Store webhook URLs and credentials in Secret Manager; reference them as `sm://SECRET_NAME` (rules-engine resolves at runtime).
- Service accounts interacting with GCS must have path-scoped IAM conditions (see `infra/terraform/main.tf`).
- Avoid committing raw data exports or secrets; keep sample fixtures under `apps/write-cli/samples/` if needed.
