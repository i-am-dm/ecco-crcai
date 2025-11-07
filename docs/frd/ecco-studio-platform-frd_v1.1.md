# Ecco Studio Platform — Feature Requirements Document (FRD)
Version: 1.1  
Date: 2025-11-06  
Owner: Ecco Studio (Daniel)

## 🔄 Changelog
- v1.1 — Integrates best-of-breed features; embeds serverless (GCP) & GCS JSON constraints; adds common acceptance criteria; updates roadmap.  
- v1.0 — Initial FRD draft.

---

## 1) Purpose & Scope
Purpose  
Deliver a unified platform for Ecco Studio to manage the full venture lifecycle — ideation → validation → build → launch → scale → spin-out — while giving leadership portfolio visibility, resource efficiency, and governance.

Scope  
- Functional areas: Ideation funnel, venture workspaces, portfolio/KPIs, resources/budgets, investor/funding, analytics/alerts, exit/spin-out, governance.  
- Scale: start with 5–10 active ventures, scalable to 50+.  
- Serverless mandate: All services run on GCP scale-to-zero components; all data persistence is JSON in GCS (see GCS JSON Persistence Spec v1.2).  
- Integrations: Slack, Google Workspace, Jira/Asana, accounting (CSV or API).  
- Multi-entity support: each venture has its own workspace; studio sees aggregated portfolio.

Out of scope (for now)  
- Heavy relational transactions; full-text search (handled later by external index); complex fund accounting (handled by finance tools; we store summaries/exports).

---

## 2) Stakeholders
- Studio Leadership — strategic decisions, portfolio view, approvals.  
- Venture Leads / Founders — venture workspace, milestones, KPIs, resources.  
- Studio Operations / Resource Mgmt — staffing, utilisation, budgets, shared services.  
- Finance / Legal / Compliance — budgets, spend, entities, cap tables, audit.  
- Investors / LPs — read-only reporting and updates.  
- External Advisors / Partners — scoped access to specific ventures/modules.

---

## 3) Architecture & Constraints (GCP, serverless, scale-to-zero)
- Compute: Cloud Run (scale-to-zero) and/or Cloud Functions (2nd gen) for handlers & APIs.  
- API Edge: API Gateway / Cloud Endpoints; optional Cloud Load Balancing for custom domains.  
- Auth: Identity Platform (or Firebase Auth) with SSO/MFA; RBAC enforced in app + IAM.  
- Events: GCS → Pub/Sub → handlers for snapshots/manifests/indices/alerts.  
- Persistence: All state in GCS JSON per GCS JSON Persistence Spec v1.2.  
- Analytics: BigQuery external tables over `snapshots/*` + scheduled loads for heavier queries.  
- Observability: Cloud Logging + Monitoring; error budgets and alerts.  
- Security: Uniform Bucket-Level Access (UBLA), Public Access Prevention (PAP), IAM Conditions, optional CMEK in KMS.

Spec reference: ecco_gcs_json_persistence_spec_v1.2.md — bucket layout, schemas, indices, concurrency, lifecycle, IAM.

---

## 4) Common Acceptance Criteria (AC-GEN) for all FRs
- Schema validation: payloads validated against JSON Schema (`schema_version` required).  
- RBAC: access limited by role + venture scope; investor read-only enforced.  
- Auditability: write paths produce history records; snapshots updated; manifests/indices maintained.  
- Concurrency safety: writers use GCS generation/metageneration preconditions; handlers are idempotent.  
- Perf: snapshot GET p50 < 500 ms; portfolio summary p50 < 1 s (assuming warmed Cloud Run).  
- Reliability: event handlers retry with DLQ; no data loss on retriable errors.  
- Observability: logs + metrics + alerts on 5xx spikes, handler retries, storage growth.  
- Testability: unit tests for schemas and write-paths; integration tests for history→snapshot flow.

---

## 5) Functional Requirements

### 5.1 Ideation & Validation
- FR-1 — Idea Intake: Structured idea submission (theme, problem, market, team, tech). AC: saved under `ideas/*/history` + snapshot.  
- FR-2 — Screening & Scoring: Configurable criteria, rank & filter. AC: scorings stored; ranking view.  
- FR-3 — Stage Workflow: Idea → Validation → Build → Launch → Scale → Spin-Out; owners & due dates. AC: status transitions tracked in history; visible in snapshot.  
- FR-4 — Collaboration: Comments/attachments; Slack notifications. AC: comment records linked to idea id.  
- FR-5 — Research Docs: Links/metadata in GCS; versioning. AC: attached artifacts referenced in snapshot.  
- FR-6 — Decision Gates: Alerts when score<threshold or stale> X days. AC: rules under `rules/`; alert fired.  
- FR-7 — Talent Match: Founders/co-founders pool & matching. AC: talent profiles in `talent/`; match list generated.  
- FR-8 — Experiments: Hypotheses, metrics, results; go/no-go. AC: experiment runs in `experiments/`; linked to idea.

### 5.2 Venture Build & Launch
- FR-9 — Venture Workspace: Metadata, owners, links. AC: `ventures/*` snapshot path exists.  
- FR-10 — Milestones/Timeline: Phases (MVP/Pilot/Scale), dependencies. AC: milestone CRUD; overdue flags.  
- FR-11 — Tasks Integration: Jira/Asana linkage; status roll-up. AC: task pointers; status summarised in snapshot.  
- FR-12 — Product Roadmap/Backlog: Releases & sprints. AC: roadmap entries visible & exportable.  
- FR-13 — Resource Allocation: Shared pool, % allocation, availability. AC: utilisation view by person & venture.  
- FR-14 — Shared Services Marketplace: Requests to design/legal/marketing; SLA & cost. AC: request lifecycle tracked.  
- FR-15 — Budget & Spend: Planned vs actual; burn & runway. AC: variance report; alerts on overruns.  
- FR-16 — Risks & Assumptions: Log with status & mitigation. AC: risk list per venture; audit trail.  
- FR-17 — Pivot/Stop Workflow: Triggered on miss/lag. AC: decision record; resource changes logged.  
- FR-18 — Deal/Equity Modeller: Equity splits, dilution scenarios. AC: model configs in `models/`; results in `simulations/`.

### 5.3 Portfolio & Performance
- FR-19 — Portfolio Dashboard: All ventures, status (G/Y/R), next milestone, recency. AC: loads <1 s p50.  
- FR-20 — Venture KPIs: MRR, users, churn, CAC/LTV, burn, runway. AC: time-series chart; CSV export.  
- FR-21 — Benchmarking: Compare ventures & benchmarks. AC: per-KPI comparators; “top/bottom” list.  
- FR-22 — What-If Modelling: Budget/marketing/revenue scenarios. AC: model inputs/outputs persisted.  
- FR-23 — Heatmaps: Risk vs reward; resource intensity vs progress. AC: interactive view.  
- FR-24 — Reporting & Export: PDF/CSV/JSON exports for boards & LPs. AC: branded PDFs; scheduled exports.  
- FR-25 — Predictive Early-Warning: Pattern detection (burn, slip, idle). AC: rules triggered; suggested actions logged.

### 5.4 Resources & Operations
- FR-26 — Resource Directory: People, roles, cost rates, availability. AC: search & filter; CSV import.  
- FR-27 — Utilisation Dashboard: % by person/venture/week. AC: over/under-utilisation alerts.  
- FR-28 — Budget Roll-ups: Venture → Studio aggregation. AC: roll-up view matches per-venture sums.  
- FR-29 — Time/Accounting Integration: CSV/API import to actuals. AC: import jobs with error report.  
- FR-30 — Legal/Entity Mgmt: Venture entities & studio stake. AC: entity records; audit changes.  
- FR-31 — Deviation Alerts: Budget or milestone exceptions. AC: rules configured; alerts sent.

### 5.5 Funding, Investors & Partners
- FR-32 — Investor/LP CRM: Contacts, interactions. AC: contact CRUD; timeline view.  
- FR-33 — Fundraising Pipeline: Stage, target, committed, close date. AC: funnel view; stage velocity.  
- FR-34 — Cap Tables: Fully diluted ownership; as-of dates. AC: `cap_tables/*` snapshot; % sums to 1.0.  
- FR-35 — Investor Reporting: Periodic updates with KPIs. AC: templated report generator.  
- FR-36 — Virtual Data Room: Document list/links, permissions. AC: access logs present.  
- FR-37 — Partner/Corporate Module: Co-dev/JV milestones & rev share. AC: partner records; link to ventures.

### 5.6 Analytics, Insights & Automation
- FR-38 — Integrations & Ingestion: Jira, Sheets, accounting. AC: scheduled sync; idempotent.  
- FR-39 — Rules/Triggers Engine: Declarative rules → alerts/actions. AC: `rules/*` + handler outcomes.  
- FR-40 — Playbook Library: SOPs/templates with effectiveness tags. AC: usage analytics; linking to ventures.  
- FR-41 — Audit Trail: Who/what/when on critical changes. AC: history present; restore from prior snapshot.  
- FR-42 — API / Integration Layer: External apps access to read/report. AC: documented endpoints; auth enforced.

### 5.7 Exit & Lifecycle
- FR-43 — Spin-Out Readiness: Checklist & evidence. AC: readiness score; approval record.  
- FR-44 — Post-Exit Monitoring: Track performance & studio stake. AC: KPI snapshots post-exit.  
- FR-45 — Archival & Learnings: Full history & retro write-up. AC: archived flag; search returns learnings.

### 5.8 Governance, Security & Compliance
- FR-46 — RBAC: Roles & permissions (Admin, Leadership, Lead, Contributor, Investor RO, Advisor). AC: access matrix passes tests.  
- FR-47 — Multi-Entity/Currency: Geos & FX. AC: currency fields; roll-up in base currency.  
- FR-48 — Data Security: Encryption, backups, DR. AC: restore drill quarterly.  
- FR-49 — SSO/MFA: Identity Platform/Okta/Google. AC: enforced on prod.  
- FR-50 — Compliance Exports: Logs/financials for audits. AC: export pack generated on demand.

### 5.9 Best-of-Breed Add-Ons (explicit)
- FR-51 — Secondary Indices for hot queries (by status/owner/next-due). AC: `indices/*` pointers maintained.  
- FR-52 — Benchmarks Store (internal/external KPI targets). AC: `benchmarks/*` and views in BQ.  
- FR-53 — What-If Models & Simulations persisted. AC: `models/*`, `simulations/*`.  
- FR-54 — Validation Experiments Store (hypothesis → result). AC: `experiments/*` linked to idea/venture.  
- FR-55 — Talent Marketplace (skills, rates, availability). AC: `talent/*` + match scores.  
- FR-56 — Shared-Services Analytics (SLA, cost, CSAT). AC: service metrics dashboard.  
- FR-57 — Rules as Data (YAML/JSON) with versioning. AC: `rules/*` + change log.  
- FR-58 — Dataroom Metadata (VDR). AC: `dataroom/*` + access logs.  
- FR-59 — Investor Updates Autogen from KPIs. AC: scheduled reports in `reports/*`.  
- FR-60 — Equity & Rounds Schemas (cap tables, rounds). AC: schema validation in CI.  
- FR-61 — Portfolio Heatmap Config (axes, thresholds). AC: config-driven rendering.  
- FR-62 — Snapshot Compaction Jobs. AC: weekly job; size/cost trend down.  
- FR-63 — External Search Index Feeds (optional). AC: feed job emits changed ids.  
- FR-64 — SLA & Error Budgets for handlers/APIs. AC: SLO dashboard; alerts wired.  
- FR-65 — Data Catalog Entries for governance. AC: entities registered & discoverable.

---

## 6) Non-Functional Requirements
- Scalability: 50 ventures, thousands of objects/day; handlers keep up with p95 < 1 min lag.  
- Performance: p50 < 500 ms for snapshot reads; portfolio summary p50 < 1 s.  
- Availability: 99.9% (excl. maintenance).  
- Security: UBLA, PAP, IAM Conditions; optional CMEK.  
- Maintainability: modular services; infra as code; CI/CD; schema versioning.  
- Cost: idle cost near zero; monthly storage growth monitored with alerting.  
- Localization: time-zones, date formats, currencies handled in UI; UTC in storage.  
- Data integrity: idempotent writes; recoverable from history; versioning on snapshots.

---

## 7) Metrics & KPIs (tracked in product)
- Pipeline: ideas per month; conversion to validation/build.  
- Velocity: idea→MVP, MVP→pilot, pilot→scale (days).  
- Growth: MRR, active users, churn, CAC, LTV, CAC:LTV.  
- Finance: burn, runway, budget variance.  
- Ops: utilisation %, SLA hit-rate, request-to-start lead time.  
- Outcomes: survival @ 12/36 months; time-to-spin-out; portfolio value of studio stake.  

---

## 8) Roles & Permissions (RBAC)
- Admin — full control.  
- Leadership — portfolio views, approvals, reports.  
- Venture Lead — own venture(s), requests, KPIs.  
- Contributor — tasks/updates on assigned venture(s).  
- Investor/LP (RO) — selected dashboards/reports only.  
- Advisor/Partner — scoped per venture/module.

Access tests must validate that Investor/LP cannot read beyond `snapshots/` subsets permitted.

---

## 9) End-to-End Workflow (high-level)
1. Idea submitted → Screening (score) → Validation (experiments) → Approval.  
2. Venture Workspace spun up; milestones, resource allocations, budget set.  
3. Build → Launch → Scale; KPIs flow; rules trigger alerts.  
4. Portfolio dashboard guides allocation; what-if & benchmarks inform strategy.  
5. Funding & investor updates generated; cap tables maintained.  
6. Spin-out when ready; post-exit KPIs tracked; archive learnings.

---

## 10) Roadmap (phased)
- Phase 1 (0–3 mo): FR-1..3, 9–10, 13, 15, 19–20, 46, AC-GEN; basic indices (FR-51).  
- Phase 2 (3–6 mo): FR-4–6, 11–12, 14, 26, 28, 30, 32–33, 38–39, 41–42.  
- Phase 3 (6–9 mo): FR-16–18, 21–25, 27, 29, 34–37, 52–55, 57–59.  
- Phase 4 (9–12+ mo): FR-22–23 enhancements, 40, 43–45, 56, 60–65; search feeds & compaction hardening.

---

## 11) Success Criteria
- ≥ 90% venture leads update weekly; ≥ 95% ventures have current KPIs/milestones.  
- Portfolio snapshot generated in < 5 min end-to-end (including data pulls).  
- 50%+ reduction in manual investor reporting time via exports.  
- Resource under-utilisation < 10% sustained; alerting prevents > 20% over-allocations.  
- Zero data-loss incidents; successful quarterly restore test.

---

## 12) Assumptions & Dependencies
- Team commits to consistent data entry or integrations to automate it.  
- Access to tools (Slack, Jira/Asana, accounting) for integrations.  
- App layer handles auth/SSO + UI; storage follows the GCS spec.

---

## 13) Risks & Mitigations
- Cold starts/latency → keep handlers lean; pre-warm critical paths.  
- Schema drift → strict versioning + CI validation.  
- Lost updates → GCS preconditions + idempotent handlers.  
- Listing costs → manifests/indices; avoid wildcards.  
- Lock-in → portable JSON + BigQuery externals; migration plan in GCS spec.

---

## 14) References
- GCS JSON Persistence Spec v1.2 (paths, schemas, IAM, lifecycle): `ecco_gcs_json_persistence_spec_v1.2.md`

