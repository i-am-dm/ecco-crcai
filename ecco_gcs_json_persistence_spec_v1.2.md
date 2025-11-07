# Ecco Studio Platform – GCS JSON Persistence Spec
Version: 1.2  
Date: 2025‑11‑06  
Status: Adopted  
Owner: Ecco Studio Platform

> Phase 0 decisions (implementation defaults):
> - Runtime: TypeScript on Node.js 20; handlers on Cloud Run via Pub/Sub.
> - Manifests: per-id objects + periodic sharded ndjson compaction.
> - Indices: pointer objects with minimal metadata (`ptr`, `id`, `updated_at`, plus optional display fields).
> - Cap tables: snapshot keyed by distinct `capTableId`; index pointer by `ventureId` to resolve latest.
> - Encryption: start with Google-managed; optional CMEK toggle via Terraform.

## 🔄 Changelog
- **v1.2**: Added explicit **coverage mapping** for best‑of‑breed features; new entity prefixes (`playbooks/`, `rules/`, `benchmarks/`, `reports/`, `rounds/`, `cap_tables/`, `experiments/`, `talent/`, `dataroom/`, `indices/`, `models/`, `simulations/`). Added sample schemas for **cap tables** and **fundraising rounds**. Clarified **secondary index** patterns and **external tables** in BigQuery.
- v1.1: Environment layout, naming, manifests, snapshots; JSON Schema & validation; concurrency (preconditions); eventing; security (UBLA, PAP, IAM Conditions, CMEK); lifecycle/versioning; observability; perf/cost; runbooks; migration path.
- v1.0: Initial spec.

---

## 1) Purpose & Scope
Persist all venture‑studio data as **JSON objects in Google Cloud Storage (GCS)** to achieve **serverless, scale‑to‑zero** cost while bootstrapping. This spec defines **bucket layout, naming, schemas, security, concurrency, lifecycle, and operations** so the platform can safely read/write without a database.

**In scope:** entities (ideas, ventures, resources, budgets, KPIs, investors, partners, services, talent, experiments), history/events, manifests, snapshots, rules, reports, models, and indices.  
**Out of scope:** relational/transactional guarantees beyond optimistic concurrency; full‑text search (to be added via external index).

---

## 2) Environments & Buckets
**Default:** single bucket with env prefixes.
```
Bucket: gs://ecco-studio-platform-data
Prefixes:
  env/dev/...
  env/stg/...
  env/prod/...
```
**Alternative:** per‑environment buckets (dev/stg/prod).

- Location: multi‑region (US/EU).  
- Uniform bucket‑level access: **ON**.  
- Public Access Prevention: **ENFORCED**.  
- Versioning: **ON**.  
- Encryption: Google‑managed; optional **CMEK**.

---

## 3) Logical Layout & Naming Conventions
```
env/{env}/
  ideas/
  ventures/
  resources/
  budgets/
  kpis/
  investors/
  partners/
  services/
  talent/              # founders, co‑founders, staff, advisors
  experiments/         # validation runs (hypotheses & results)
  rounds/              # fundraising rounds per venture
  cap_tables/          # venture capitalization tables
  dataroom/            # VDR artifacts (links/metadata); large files optional
  playbooks/           # reusable templates & SOPs with effectiveness tags
  rules/               # alert/trigger engine rules
  benchmarks/          # KPI benchmarks (internal/external)
  reports/             # generated investor/LP reports
  models/              # what‑if/projection model definitions
  simulations/         # results of what‑if runs
  indices/             # secondary index pointers for fast lookup
  manifests/           # compact listings for discovery
  snapshots/           # latest materialized state
  schemas/             # JSON Schemas (versioned)
  logs/                # optional write‑ahead / audit event logs
  tmp/                 # ephemeral
```

### 3.1 Object naming
**History (append‑only):**
```
env/{env}/{entity}/{id}/history/{yyyy}/{mm}/{dd}/{tsZ}_{ulid}.json
```
**Snapshot (latest):**
```
env/{env}/snapshots/{entity}/{id}.json
```
**Manifest (ndjson):**
```
env/{env}/manifests/{entity}/_index.ndjson
```
**Secondary indices (pointer objects):**
```
env/{env}/indices/ventures/by-status/{status}/{id}.json           # contains {"ptr":"env/.../snapshots/ventures/{id}.json"}
env/{env}/indices/ventures/by-lead/{leadId}/{id}.json
env/{env}/indices/ventures/by-next-due/{yyyy-mm}/{id}.json
env/{env}/indices/rounds/by-venture/{ventureId}/{roundId}.json
env/{env}/indices/cap_tables/by-venture/{ventureId}.json
```

### 3.2 Required envelope fields (all entities)
```json
{
  "id": "string",
  "entity": "idea|venture|resource|budget|kpi|investor|partner|service|talent|experiment|round|cap_table|playbook|rule|benchmark|report|model|simulation",
  "env": "dev|stg|prod",
  "schema_version": "1.0.0",
  "created_at": "RFC3339",
  "updated_at": "RFC3339"
}
```

---

## 4) JSON Schema & Validation
- Schemas live under: `env/{env}/schemas/{entity}/v{MAJOR.MINOR.PATCH}.schema.json`
- Writers must validate payloads against the declared schema version.
- Breaking changes bump `schema_version`; snapshots migrate via compaction.

**Example (cap_table v1.0.0 excerpt):**
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CapTable",
  "type": "object",
  "required": ["id","entity","env","schema_version","created_at","updated_at","ventureId","asOf","holders"],
  "properties": {
    "id": {"type":"string"},
    "entity": {"const":"cap_table"},
    "ventureId": {"type":"string"},
    "asOf": {"type":"string","format":"date"},
    "holders": {
      "type":"array",
      "items":{"type":"object",
        "required":["holderId","name","security","quantity","pctFullyDiluted"],
        "properties":{
          "holderId":{"type":"string"},
          "name":{"type":"string"},
          "security":{"enum":["COMMON","PREF","SAFE","NOTE","OPTION"]},
          "quantity":{"type":"number","minimum":0},
          "pctFullyDiluted":{"type":"number","minimum":0,"maximum":1}
        }
      }
    }
  },
  "additionalProperties": true
}
```

**Example (round v1.0.0 excerpt):**
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "FundraisingRound",
  "type":"object",
  "required":["id","entity","env","schema_version","created_at","updated_at","ventureId","stage","targetUSD","committedUSD","closeDate"],
  "properties":{
    "id":{"type":"string"},
    "entity":{"const":"round"},
    "ventureId":{"type":"string"},
    "stage":{"enum":["PRESEED","SEED","SERIES_A","SERIES_B","OTHER"]},
    "targetUSD":{"type":"number","minimum":0},
    "committedUSD":{"type":"number","minimum":0},
    "closeDate":{"type":"string","format":"date"},
    "investors":{"type":"array","items":{"type":"string"}},
    "terms":{"type":"object"}
  },
  "additionalProperties": true
}
```

---

## 5) Write Semantics, Concurrency & Idempotency
Same as v1.1 (history → snapshot → manifest), plus **index maintenance**:
1) Write history object (ifGenerationMatch=0)  
2) Recompute/update snapshot (ifMetagenerationMatch=current)  
3) Upsert manifest line (preconditioned)  
4) Upsert pointer objects under `indices/...` relevant to the change (preconditioned)

Event handlers must be **idempotent** and ordered by `updated_at` when reconciling.

---

## 6) Eventing & Derived Artifacts
- GCS → Pub/Sub notifications for `OBJECT_FINALIZE` under `history/` and `snapshots/`.
- Cloud Functions/Run handlers:
  - `snapshot-builder`: recompute snapshot from latest history.
  - `manifest-writer`: update `_index.ndjson` line.
  - `index-writer`: maintain pointer files under `indices/` for hot queries.
  - `rules-engine`: evaluate `rules/` against fresh snapshots to emit alerts to Slack/Email (via webhook).

---

## 7) Security & IAM
- UBLA + PAP enforced; versioning enabled.
- IAM Conditions to restrict path scopes (e.g., investors → `snapshots/` read‑only).
- Optional CMEK via Cloud KMS; rotate keys.
- Secrets in Secret Manager; Cloud Audit Logs enabled (Admin + Data Access).

Sample conditional binding (paths abbreviated):
```yaml
bindings:
- role: roles/storage.objectViewer
  members: [serviceAccount:investor-ro@PROJECT_ID.iam.gserviceaccount.com]
  condition:
    title: SnapshotsOnly
    expression: resource.name.startsWith("projects/_/buckets/ecco-studio-platform-data/objects/env/prod/snapshots/")
```

---

## 8) Lifecycle, Versioning, Retention
- Keep last **N=10** versions for snapshots/manifests.
- Transition history to cheaper storage classes over time.
- Delete noncurrent versions after 30 days (snapshots).
- Optional bucket‑level retention on `history/` for audit.

---

## 9) Observability & Cost
- Monitor 5xx rates, retries, object count growth, egress.
- Alert on handler DLQs (if using Pub/Sub subscriptions with dead‑letter).
- Use ndjson for manifests; compress large payloads (`.json.gz`).

---

## 10) Performance Notes
- Batch writes for high‑churn entities.
- Use ULIDs for temporal ordering and to reduce hot‑prefix concentration.
- Prefer small deltas in history + periodic compaction of snapshot.

---

## 11) BigQuery Integration (for KPIs & dashboards)
- Create **external tables** over `snapshots/{entity}/*.json` (and/or `history/*`) for analytics without copying.
- Or schedule loads into native tables for faster queries.
- Keep **entity schemas** stable; evolve via new `schema_version` and view unions.

Example external table DDL (pseudo‑SQL):
```sql
CREATE EXTERNAL TABLE analytics.snapshots_ventures
WITH CONNECTION `REGION.conn`
OPTIONS (
  format = 'JSON',
  uris = ['gs://ecco-studio-platform-data/env/prod/snapshots/ventures/*.json']
);
```

---

## 12) Example Entities
### 12.1 Idea (history record)
Path: `env/prod/ideas/IDEA-001/history/2025/11/06/2025-11-06T10:18:22Z_01HFB9...json`
```json
{
  "id":"IDEA-001","entity":"idea","env":"prod","schema_version":"v1.0.0",
  "created_at":"2025-11-05T14:32:00Z","updated_at":"2025-11-06T10:18:22Z",
  "theme":"Applied AI",
  "title":"Automated Venture Studio Platform",
  "problem":"Studios lack unified platforms for ideation, validation, and launch workflows.",
  "market":"Studios and venture builders spend >$10B annually stitching together point solutions.",
  "team":"Needs a PM, platform lead, and founding engineer with event-driven experience.",
  "tech":"TypeScript services on Cloud Run, Pub/Sub fan-out, and JSON-in-GCS storage.",
  "description":"Unified cockpit for intake, scoring, and resource planning across every studio venture.",
  "status":"Under Review",
  "stage":"Validation",
  "stage_owner":"founder@ecco.studio",
  "stage_due_date":"2025-11-20T00:00:00Z",
  "created_by":"founder@ecco.studio",
  "tags":["ai","ops"],
  "attachments":["https://example.com/docs/idea-brief"],
  "score":{
    "overall":8.1,
    "market":8.5,
    "team":7.5,
    "tech":7.8,
    "timing":8.7,
    "notes":"Need clearer GTM budget before approval."
  }
}
```

### 12.2 Venture (snapshot)
Path: `env/prod/snapshots/ventures/V001.json`
```json
{
  "id":"V001","entity":"venture","env":"prod","schema_version":"1.0.0",
  "created_at":"2025-11-01T00:00:00Z","updated_at":"2025-11-06T10:21:23Z",
  "lead":"Bob","status":"Pilot",
  "milestones":[{"milestoneId":"M1","title":"Build MVP","dueDate":"2026-02-01","status":"InProgress"}],
  "budget":{"plannedUSD":300000,"spentUSD":45000},
  "kpis":{"MRR":12000,"userCount":1200,"churnRate":0.02}
}
```

### 12.3 Cap table (snapshot)
Path: `env/prod/snapshots/cap_tables/CT-V001.json`
```json
{
  "id":"CT-V001","entity":"cap_table","env":"prod","schema_version":"1.0.0",
  "created_at":"2025-11-01T00:00:00Z","updated_at":"2025-11-06T10:35:00Z",
  "ventureId":"V001","asOf":"2025-11-01",
  "holders":[
    {"holderId":"H-FOUNDERS","name":"Founders","security":"COMMON","quantity":6000000,"pctFullyDiluted":0.60},
    {"holderId":"H-STUDIO","name":"Ecco Studio","security":"PREF","quantity":3000000,"pctFullyDiluted":0.30},
    {"holderId":"H-OPTION","name":"Option Pool","security":"OPTION","quantity":1000000,"pctFullyDiluted":0.10}
  ]
}
```

---

## 13) Operational Runbooks (abridged)
- Bucket creation, versioning, lifecycle rules, Pub/Sub notifications (see v1.1).
- Handlers: `snapshot-builder`, `manifest-writer`, `index-writer`, `rules-engine` (Cloud Functions/Run).
- DR: enable object versioning; test restore from noncurrent versions quarterly.

---

## 14) Risks & Mitigations
- Lost updates → preconditions + idempotent handlers.  
- Expensive listings → manifests + indices.  
- Analytics needs → BigQuery external tables or scheduled loads.  
- Complex joins (e.g., cap tables vs rounds) → denormalize into snapshots or query in BigQuery.  

---

## 15) Migration Path
- Search/full‑text → external index (e.g., OpenSearch or Vertex AI Search), fed from `snapshots/` via eventing.  
- Document DB → Firestore if richer queries/transactions are needed.  
- RDBMS for modeller → Serverless SQL (Cloud SQL AlloyDB/pgvector serverless when needed).

---

## 16) Best‑of‑Breed Feature Coverage Map
| Best‑of‑breed Feature (from FRD) | Data Representation in GCS | Notes / Gaps |
|---|---|---|
| Idea intake, screening, validation | `ideas/`, `experiments/`, `snapshots/ideas/`, manifests | Covered; validation runs stored under `experiments/`. |
| Talent/co‑founder matching | `talent/` + indices by skill/location | Matching logic lives in app; indices enable fast lookups. |
| Venture workspace, milestones | `ventures/` + snapshots + `indices/ventures/by-status` | Covered. |
| Task/issue integration | Store task pointers/metadata in `ventures/`; full tasks stay in Jira/Asana | Covered as references; not a task DB. |
| Resource pool & capacity | `resources/` + indices + KPI snapshots | Covered. |
| Shared services marketplace | `services/` + requests under `ventures/{id}` history | Covered. |
| Budget & spend; roll‑up | `budgets/` + venture snapshot fields | Covered; accounting actuals can be imported artifacts. |
| Risk/assumption log | In venture snapshot/history | Covered. |
| Pivot/stop workflow | Write events to `ventures/.../history/`; rules under `rules/` | Covered. |
| Deal modeller | `models/` (definitions) + `simulations/` (results) | Modelling compute is app‑side; persisted here. |
| Portfolio dashboard, KPIs | `kpis/` + venture snapshots; BigQuery external tables | Covered; analytics via BQ. |
| Benchmarking/comparators | `benchmarks/` + BQ | Covered. |
| What‑if scenarios | `models/` + `simulations/` | Covered. |
| Heatmaps & reports | `reports/` (exports) + BQ views | Covered. |
| Predictive early warning | `rules/` + handler outputs to `reports/`/alerts | Compute in handlers; configs persisted. |
| Investor/LP CRM | `investors/` (+ `indices/`), interactions as history | Covered as lightweight CRM; heavy CRM can link out. |
| Fundraising pipeline | `rounds/` + indices by venture/stage | Covered. |
| Cap table & equity tracking | `cap_tables/` + schema | Covered (denormalized snapshot). |
| Virtual data room | `dataroom/` (metadata/links) | Large docs can live in same bucket or external storage. |
| Partner/corporate engagement | `partners/` with ventures linkage | Covered. |
| Playbook library | `playbooks/` with tags and effectiveness | Covered. |
| Exit/spin‑out lifecycle | `ventures.status` + `reports/` + archive under history | Covered. |
| Governance/security/compliance | IAM, UBLA, PAP, CMEK, audit logs | Covered at storage layer; SSO/MFA at app layer. |

**Conclusion:** All FRD “best‑of‑breed” features have a clear **persistence representation** in this spec. Features that require compute (matching, modelling, prediction, SSO/MFA) are implemented in the **application/compute layer**, with their **state, configs, and outputs** persisted here.

---

## 17) Developer Checklist
- [ ] Create bucket & prefixes, enable UBLA, PAP, versioning, lifecycle.  
- [ ] Implement schemas & validation; add `schema_version` to all writes.  
- [ ] Implement write path (history → snapshot → manifest → indices) with preconditions.  
- [ ] Deploy event handlers (snapshot/manifest/index/rules).  
- [ ] Set IAM (least privilege + path‑scoped conditions).  
- [ ] Stand up BigQuery external tables for `snapshots/*`.  
- [ ] Add monitoring/alerts; test DLQ flows.  
- [ ] Document compaction and rollback procedures.  
