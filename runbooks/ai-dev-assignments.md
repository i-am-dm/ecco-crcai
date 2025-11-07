# AI Dev Agent Assignments — Playbooks & Admin Landing

## Workstream 1 — Playbook Approvals & Governance
- **Owners**: Agent-SVC, Agent-UI, Agent-LIB
- **Scope**: augment playbook schema (`schemas/playbook/1.0.0.schema.json`) with `approvers[]`, `review_notes`, enforce Draft → Review → Published transitions, admin-only publish gate; surface approvals in UI.
- **Acceptance**: only approvers can approve; only Admin/Leadership can publish approved playbooks; versions tab shows review history; investors still limited to Published via api-edge.
- **Touchpoints**: `schemas/playbook/1.0.0.schema.json`, `libs/ts/src/manifest.ts`, `services/api-edge/src/index.ts`, `ui-new/src/components/playbooks/PlaybookForm.tsx`, `ui-new/src/routes/playbooks/[id].tsx`.

## Workstream 2 — Duplicate / Archive / Share
- **Owners**: Agent-UI, Agent-SVC
- **Scope**: POST `/v1/playbooks/duplicate`, `/v1/playbooks/:id/archive`, `/v1/share/playbooks/:id`; archive flag hides items unless filter toggled; share token provides read-only link.
- **Acceptance**: duplicate writes Draft copy with new id/version; archived items excluded by default; share link works w/out auth but is read-only; revoke share token handled server side.
- **Touchpoints**: `services/api-edge/src/index.ts`, `ui-new/src/routes/playbooks/[id].tsx`, `ui-new/src/routes/playbooks/index.tsx`.

## Workstream 3 — Import (Markdown) & Export (PDF)
- **Owner**: Agent-UI
- **Scope**: parse markdown imports (name/stage/checklist/tags) before POST history; export PDF via print CSS or headless print.
- **Acceptance**: MD import preview + validation; PDF export renders Overview + Checklist with branding.
- **Touchpoints**: `ui-new/src/routes/playbooks/index.tsx`, `ui-new/src/routes/playbooks/[id].tsx`, `ui-new/src/index.css` (print styles).

## Workstream 4 — Playbook Runs UX
- **Owners**: Agent-UI, Agent-SVC
- **Scope**: run list/detail views per playbook & venture, complete-run form (observed impacts), derive linked ventures via `indices/playbook_runs/*` and show outcomes.
- **Acceptance**: completing run updates effectiveness and appears in stats; Linked Ventures tab lists runs with ΔMRR/Δactivation.
- **Touchpoints**: `services/api-edge/src/index.ts`, `ui-new/src/routes/playbooks/[id].tsx`, `ui-new/src/routes/playbook-runs/*.tsx` (new), `ui-new/src/hooks/usePlaybookRuns.ts`.

## Workstream 5 — Server-Side Search / Facets
- **Owner**: Agent-SVC (UI consumes)
- **Scope**: add GET `/v1/search/playbooks` supporting filters: stage/function/owner/tag, updated date range, effectiveness min, sort + paging; UI switches from client-side intersection.
- **Acceptance**: p50 <300ms for typical filters in dev; limit/offset + sort stable; UI reflects server results.
- **Touchpoints**: `services/api-edge/src/index.ts`, `ui-new/src/hooks/usePlaybookIndices.ts` (replace), `ui-new/src/routes/playbooks/index.tsx`.

## Workstream 6 — Admin Landing KPIs & Gating
- **Owners**: Agent-UI, Agent-SVC
- **Scope**: add Ideas-in-pipeline KPI, Burn(30d) KPI, shared-services requests panel, admin-only rendering for Health/Alerts widgets.
- **Acceptance**: KPIs populated from manifests/budgets endpoints; Health/Alerts hidden for roles without Admin/Leadership.
- **Touchpoints**: `services/api-edge/src/index.ts` (aggregate endpoints), `ui-new/src/routes/Dashboard.tsx`.

## Workstream 7 — Rules Tab Editing
- **Owners**: Agent-RULES, Agent-UI
- **Scope**: inline rule editor in Playbook detail, persisting `rules` array through `/v1/internal/history`; optional test-rule endpoint.
- **Acceptance**: editing rules updates snapshot + manifest; “Test rule” returns evaluation result; “Edit rule” links to rules detail placeholder.
- **Touchpoints**: `ui-new/src/routes/playbooks/[id].tsx`, `services/api-edge/src/index.ts` (optional `/v1/rules/test`), existing rules schema.

## Workstream 8 — Jira/Asana Task Generation
- **Owner**: Agent-RULES
- **Scope**: extend playbook apply flow to call task adapters (Jira/Asana) when secrets configured; log failures, surface status in UI.
- **Acceptance**: tasks created per checklist step with run id context; UI shows “Tasks queued” with integration type; safe no-op when secrets absent.
- **Touchpoints**: `services/api-edge/src/index.ts`, `ui-new/src/routes/playbooks/[id].tsx`, integration config docs.

## Workstream 9 — Schema & Sample Data
- **Owners**: Agent-LIB, Agent-DX
- **Scope**: add `schemas/playbook_run/1.0.0.schema.json`; seed docs/examples with playbook indices and playbook_run snapshots for dev UI demos.
- **Acceptance**: local data supports filters/tests; schema validated by history writes and unit tests.
- **Touchpoints**: `schemas/playbook_run/1.0.0.schema.json`, `docs/examples/env/dev/*`, `libs/ts/test/*`.

## QA & Validation
- **Owner**: Agent-QA
- **Scope**: regression suite covering approvals, duplicate/archive/share, import/export, search, playbook runs, dashboard KPIs, RBAC gating.
- **Acceptance**: checklist executed per workstream; automated smoke tests added where feasible (Playwright for UI, integration tests for api-edge).

> Each workstream owner: branch off `main`, tag commits w/ `feat(playbooks): ...`, document validation (endpoints hit, screenshots) before PR.
