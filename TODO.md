# Ecco Studio Platform — Implementation TODOs

## ⚡ Front-End Priority Backlog (missing FR screens)
1. **Venture Workspaces & Milestones (FR‑9/10)** — create venture detail pages with milestone timelines, owners, and overdue indicators.
2. **Portfolio/KPI Drilldowns (FR‑19/20/21)** — expand the admin dashboard with per-metric charts, benchmarking panels, and export actions.
3. **Resource/Budget Ops UIs (FR‑26/27/28/31)** — ship fully wired resources directory, utilization dashboard, budget roll-ups, and deviation alerts.
4. **Investor & Fundraising Modules (FR‑32/33/35/36)** — build CRM, fundraising pipeline, investor reporting, and dataroom views.
5. **Rules & Governance UI (FR‑39/41/43/44)** — surface rules editor, decision logs, spin-out readiness checklists, and post-exit monitoring pages.
6. **Shared-Services & Talent Add-ons (FR‑14/55/56)** — shared-services request board, SLA analytics, talent marketplace views.
7. **Integrations & Tasking (FR‑11/38/40 Add-ons)** — Jira/Asana linkage, playbook run dashboards, predictive early-warning cards beyond decision gates.

> Treat this list as the front of the queue for UI work; each item maps directly to FRD gaps called out in the latest review.

Status: Draft
Owner: Platform Eng
Scope: JSON-in-GCS persistence, handlers, infra, analytics

Note: This breaks work into phases with crisp, testable outcomes. Check items off as completed; keep acceptance notes up to date.

## Phase 0 — Decisions & Design
- [x] Decide primary language/runtime (TypeScript/Node 20) and baseline version.
- [x] Choose handler platform (Cloud Run) and container base.
- [x] Confirm manifest strategy: per-id manifest objects + periodic shard compaction.
- [x] Define index pointer shape and minimal metadata fields (e.g., `{ ptr, updated_at, title, status, lead }`).
- [x] Align cap table snapshot keying (distinct `capTableId` + index by `ventureId`).
- [x] Confirm CMEK now vs later (start with Google-managed; CMEK toggle available).
- [x] Fix doc errata: stray quote in cap table example; clarify path/id.

Acceptance
- Decisions recorded (ADRs) and referenced in spec; stakeholders sign-off.

## Phase 1 — Infra Foundation (Terraform)
- [x] Provision GCS bucket(s) + prefixes `env/{dev,stg,prod}` with UBLA, PAP, Versioning.
- [x] Lifecycle: history → Nearline/Coldline; snapshots keep last N=10 and delete noncurrent after 30 days.
- [x] Pub/Sub topics + subscriptions with DLQs for `history/` and `snapshots/` notifications.
- [x] Service accounts per service; IAM Conditions restricting path scopes.
- [x] Optional CMEK key (KMS) + bindings; rotation schedule.
- [x] CI job for `terraform validate/plan` and manual `apply` gates.

Acceptance
- Buckets, topics, SAs exist; object finalize events trigger messages; IAM scoped by path.

## Phase 2 — Schemas & SDKs
- [x] Author JSON Schemas: `idea`, `venture`, `round`, `cap_table` under `schemas/{entity}/vX.Y.Z.schema.json`.
- [x] Build lightweight SDK: envelope enforcement, ULID, RFC3339 timestamps, JSON Schema validation.
- [x] GCS client with preconditions (`ifGenerationMatch`, `ifMetagenerationMatch`).
- [x] Unit tests for validation and precondition behavior (mocks/local emulator where possible).

Acceptance
- All writes validated; tests pass; schemas published alongside code.

## Phase 3 — Authoritative Write Path
- [x] Implement library to write history (ifGenerationMatch=0) and update snapshot with metageneration precondition.
- [x] Provide CLI for seed/fixture generation and manual writes.
- [x] Idempotency: upserts guarded by `updated_at`; safe on retries.

Acceptance
- Concurrency tests show no lost updates; repeated runs are idempotent.

## Phase 4 — Snapshot Builder (Handler v1)
- [x] Subscribe to `history/* OBJECT_FINALIZE` notifications. (HTTP push endpoint scaffolded)
- [x] Rebuild `{snapshots/{entity}/{id}.json}` from latest history; preserve `schema_version`.
- [x] Handle schema migrations (minor additive) and compact high-churn entities. (later)

Acceptance
- Writing history triggers correct snapshot rebuild in dev.

## Phase 5 — Manifests
- [x] Realtime per-id manifest writer on snapshot events: `manifests/{entity}/by-id/{id}.json`.
- [x] Periodic compactor builds `_index.ndjson` shards (e.g., `_index_shard=00..FF.ndjson`).
- [x] Reader utilities to list via shards; fall back to per-id when needed.

Acceptance
- Listing uses shards; compactor idempotent; hot update path avoids single-file contention.

## Phase 6 — Index Writer
- [x] Maintain pointer files under `indices/...` with minimal metadata for list views.
- [x] Handle moves (e.g., status changes) by deleting stale pointers and writing new.
- [x] Coverage: ventures by status/lead/next-due; rounds by venture; cap_tables by venture.

Acceptance
- Index queries reflect latest state; no orphaned pointers in common transitions.

## Phase 7 — Rules Engine
- [x] Evaluate `rules/` against fresh snapshots; simple JSON-based conditions (thresholds, date windows).
- [x] Emit alerts to Slack/Email via webhooks; persist to `reports/alerts/{id}.json`. (webhook + storage alerts wired; extend for email later)
- [x] Secrets from Secret Manager; structured logs for audits. (secret access wired; add structured logging/trace)

Acceptance
- E2E: snapshot change → rule trigger → alert recorded (webhook dispatch active).

## Phase 8 — Security Hardening
- [x] Enforce IAM Conditions for path-scoped access (e.g., investor read-only to `snapshots/`).
- [x] Enable CMEK if chosen; rotate keys; verify access paths.
- [x] Cloud Audit Logs (Admin + Data Access) enabled and reviewed.

Acceptance
- Access tests pass; audit trails complete; mis-scoped access blocked.

## Phase 9 — Observability & Cost
- [x] Dashboards: handler success/latency, DLQ depth, snapshot lag vs history, storage class distribution.
- [x] Alerts: DLQ non-empty, 5xx spikes, lag thresholds, excessive egress.
- [x] Structured logging; trace correlation across handlers.

Acceptance
- Synthetic checks green; alerts fire in test and resolve cleanly.

## Phase 10 — BigQuery Integration
- [x] External tables over `snapshots/{entity}/*.json` (dev→stg→prod) with connection resources.
  - Implemented via Terraform in `infra/terraform/bigquery.tf`:
    - Datasets: `analytics_dev`, `analytics_stg`, `analytics_prod`
    - BigLake connection `gcs_biglake` and external tables `ext_snapshots_{idea|venture|round|cap_table}` per env
  - APIs enabled: `bigquery.googleapis.com`, `bigqueryconnection.googleapis.com`, `bigquerydatatransfer.googleapis.com`
- [x] Version-tolerant views to mask schema evolution.
  - Views `v_{entity}` per dataset project a stable set of columns: `id, entity, env, schema_version, updated_at, title, status, lead, ventureId, stage, asOf, ptr`
  - DDL reference: `analytics/ddl/README.md`
- [x] Optional scheduled loads to native tables for perf-sensitive dashboards.
  - Scheduled queries provisioned (every 6 hours) to materialize `snapshots_{entity}` per env

Acceptance
- Representative analytics queries meet latency targets.
  - Example queries in `analytics/ddl/README.md`
  - Validate in dev/stg prior to prod enablement

## Phase 11 — Lifecycle & Compaction
- [x] Confirm lifecycle rules active (simulate age transitions in test bucket).
  - Terraform lifecycle for noncurrent versions is configured in `infra/terraform/main.tf`
  - Simulate and document with `gsutil` (see runbooks)
- [x] Snapshot compactor cadence defined; batch/partial rebuild for hot entities.
  - `manifest-compactor` supports `--since <RFC3339|1h|24h|30m>` for partial shard rebuilds
  - Cadence: hourly delta and nightly full implemented via Cloud Run Jobs + Cloud Scheduler in `infra/terraform/compactor_schedule.tf`. Parametrize via `compactor_*` vars.

Acceptance
- Storage costs trend to plan; compactions complete within SLOs.
  - Verify delta/full durations and shard sizes over a week

## Phase 12 — DR & Runbooks
- [x] Runbooks: restore from noncurrent versions; rebuild manifests/indices; rotate CMEK; recover access.
  - See `runbooks/dr.md` (includes restore, rebuild, CMEK, access)
- [x] Quarterly fire drills in dev/stg.

Acceptance
- Time-to-restore and rebuild targets met during drills.

## Phase 13 — Migration & Cutover
- [x] Seed initial data via CLI; reconcile snapshots and indices.
  - CLI `seed-dir` and `rebuild-manifests` added: `apps/write-cli` (see `--help`)
- [x] Blue/green cutover by env prefixes; toggle app config.
  - Runbook `runbooks/cutover.md` outlines env toggle and validation
- [x] Post-cutover validation and monitoring.

Acceptance
- Error budgets healthy; sign-off from stakeholders.

## Open Decisions & Spec Errata (Track Until Closed)
- [x] Manifest strategy finalized and documented (per-id + shards recommended).
- [x] Cap table snapshot keying aligned (id vs ventureId); spec updated.
- [x] Pointer object schema frozen and versioned.
- [x] Fix cap table JSON example (remove stray quote in `quantity`).

## Code Structure (Target)
- `infra/terraform/*` — buckets, IAM, Pub/Sub, CMEK, lifecycle.
- `services/` — `snapshot-builder`, `manifest-writer`, `manifest-compactor`, `index-writer`, `rules-engine`.
- `libs/{ts|py}/` — schema validation, GCS client, ULID/time utils.
- `analytics/ddl/` — BQ external tables and views.
- `runbooks/` — ops procedures.

## CI/CD
- [x] Lint/test/build pipeline for services; image scan.
- [x] Promote dev→stg→prod via approvals.
- [x] Canary deploy and rollback playbooks.

## Acceptance Gates Summary
- Each phase lists its own acceptance. Do not start next phase without meeting prior gates or explicitly deferring via ADR.

## Phase 14 — API Edge & Integration Layer (FR‑42)
- [x] Define API surface (v1):
  - GET list via indices/manifests (ventures, ideas, rounds, cap_tables).
  - GET snapshot by id (all entities supported by spec).
  - POST history write (internal, service‑to‑service) with schema validation.
  - Webhook endpoints for alerts/notifications (rules‑engine output fan‑out).
- [x] OpenAPI spec authored and published; CI lints spec and bundles docs.
- [x] API Gateway or Cloud Endpoints configured with custom domain (optional), quotas, and logging.
- [x] AuthN/AuthZ: JWT validation (Identity Platform) and RBAC enforcement per route.

Acceptance
- Endpoints deployed behind API Gateway/Endpoints; OpenAPI docs published; requests require auth; basic list/read flows work against GCS‑backed services.

## Phase 15 — Auth, SSO/MFA & App‑Level RBAC (FR‑46, FR‑49)
- [x] Identity Platform configured (Google OIDC; Okta/SAML optional); MFA enforced in prod.
- [x] Role mapping strategy defined (claims → roles: Admin, Leadership, Lead, Contributor, Investor RO, Advisor).
- [x] App‑layer RBAC middleware enforces venture‑scoped access and investor read‑only to permitted `snapshots/` subsets.
- [x] Access tests for all roles, including negative tests (e.g., Investor/LP cannot access non‑permitted paths).

Acceptance
- Role matrix passes automated tests; SSO + MFA works in stg/prod; investor read‑only verified end‑to‑end.

## Phase 16 — SLOs, SLA & Error Budgets (FR‑64, AC‑GEN perf)
- [x] Define SLOs: snapshot GET p50 < 500 ms; portfolio summary p50 < 1 s; handler retry/error targets.
- [x] Instrument API and handlers with latency/availability metrics; dashboards with SLO burn‑rate.
- [x] Alerts on SLO violations and 5xx spikes; runbook to mitigate (scale, cache, pre‑warm).

Acceptance
- SLO dashboards in place; alerts verified to fire and resolve; monthly error‑budget report generated.

## Phase 17 — External Search Index Feeds (optional, FR‑63)
- [x] Feed job emits changed ids and lightweight pointers from `snapshots/*` to external index.
- [x] Idempotent updates; backfill mode for initial load.

Acceptance
- External index receives updates on snapshot changes; sampled queries return expected results.

## Phase 18 — Data Catalog & Compliance Exports (FR‑65, FR‑50)
- [x] Register entities and external tables in Data Catalog with tags/classifications.
- [x] Compliance export pack generator (on demand): logs, financial summaries, change history bundles.
- [x] Access logs retention reviewed; quarterly export drill documented.

Acceptance
- Catalog entries discoverable; compliance pack generates and passes spot audits.

## Product Backlog — FRD‑Mapped Phases (Application Features)

Note: Product work maps to FRD sections and uses AC‑GEN in addition to FR‑specific acceptance. Persistence follows the GCS JSON spec (`ecco_gcs_json_persistence_spec_v1.2.md`).

### P1 (0–3 mo)
- [x] FR‑1..3: Ideation intake, screening/scoring, stage workflow; history + snapshots under `ideas/*`; scoring view; transitions tracked.
- [ ] FR‑9–10: Venture workspace + milestones/timeline; overdue flags; `ventures/*` snapshots.
- [ ] FR‑13: Resource allocation basics; utilisation by person/venture (initial views from manifests/indices).
- [ ] FR‑15: Budget & spend (planned vs actual) minimal; variance calc + basic alerts.
- [ ] FR‑19–20: Portfolio dashboard + venture KPIs; CSV export.
- [ ] FR‑46: RBAC role matrix implemented (ties to Phase 15); investor RO enforced.
- [ ] FR‑51: Basic secondary indices (status/lead/next‑due) live.

Acceptance
- Screens/pages exist for ideas, ventures, portfolio; data persisted per spec; indices power list views; AC‑GEN tests pass.

### P2 (3–6 mo)
- [ ] FR‑5–8: Collaboration follow-ons (attachments, research docs, decision gates/alerts, talent match, experiments store).
- [ ] FR‑11–12: Tasks integration (Jira/Asana pointers), product roadmap/backlog views.
- [ ] FR‑14: Shared services marketplace; request lifecycle tracked.
- [ ] FR‑26,28,30: Resource directory; budget roll‑ups; legal/entity management.
- [ ] FR‑31: Deviation alerts (budget/milestone exceptions) via rules.
- [ ] FR‑32–33: Investor/LP CRM + fundraising pipeline.
- [ ] FR‑38–39: Integrations & ingestion; rules/triggers engine in use.
- [ ] FR‑41–42: Audit trail browsing/restore; API/integration endpoints documented and secure.

Acceptance
- Feature UIs wired to GCS via API; scheduled syncs idempotent; rules fire alerts; restore workflow validated.

### P3 (6–9 mo)
- [ ] FR‑16–18: Risks/assumptions log; pivot/stop workflow; deal/equity modeller (persist `models/` + `simulations/`).
- [ ] FR‑21–25: Benchmarking; what‑if modelling; heatmaps; reporting/export; predictive early‑warning.
- [ ] FR‑27,29: Utilisation dashboard; time/accounting integration.
- [ ] FR‑34–37: Cap tables, investor reporting, data room (VDR), partner/corporate module.
- [ ] FR‑52–55,57–59: Benchmarks store; what‑if models/simulations; validation experiments; talent marketplace; rules as data versioning; investor updates autogen.

Acceptance
- Models/simulations persisted; exports scheduled; VDR metadata with access logs; alerts + predictions logged.

### P4 (9–12+ mo)
- [ ] FR‑22–23 enhancements; FR‑40 playbook library; FR‑43–45 exit & lifecycle; FR‑47 multi‑entity/currency roll‑ups; FR‑56 shared‑services analytics; FR‑60–65 equity/rounds schemas, heatmap config, snapshot compaction jobs, search feeds hardening, SLA/error budgets, data catalog entries.

Acceptance
- Portfolio features mature; compaction and feeds hardened; governance and catalog complete; FRD acceptance met.
