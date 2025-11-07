# CityReach Innovation Labs UI - Frontend Redesign Plan

Version: 1.0
Date: 2025-11-06
Status: Planning

## Executive Summary

The current UI is a 1411-line monolithic HTML file serving as a visual shell. To accomplish the FRD requirements and Phase 1 goals (FR-1..3, 9-10, 13, 15, 19-20, 46), we need a complete architectural redesign focused on:

1. **Modular architecture** - Component-based structure
2. **API integration** - Connect to GCS-backed API endpoints
3. **State management** - Proper data flow and caching
4. **Authentication** - Real RBAC with Identity Platform
5. **Phase 1 features** - Implement priority requirements first

## Current State Analysis

### What Exists
- Single-page HTML file (1411 lines)
- Tailwind CSS via CDN (Play mode)
- Basic hash-based routing
- Sidebar navigation with 20+ module links
- Placeholder views for all entities
- Hardcoded demo data
- Mock login with role selection
- Dark mode toggle
- Basic filter UI (ventures by status/lead/next-due)

### Critical Issues
1. **No API integration** - All data is hardcoded
2. **Monolithic structure** - All code in one file
3. **No state management** - Can't track data across views
4. **No real auth** - Mock login only
5. **No data fetching** - No loading/error states
6. **No component reuse** - Duplicated markup patterns
7. **No build process** - Using Tailwind Play CDN (not production-ready)
8. **No TypeScript** - No type safety
9. **Scalability** - Can't scale to 50+ ventures and complex features

## Proposed Architecture

### Technology Stack

**Core Framework:**
- **React 18** with TypeScript
  - Why: Component reusability, large ecosystem, team familiarity
  - Alternatives considered: Vue 3, Svelte (React chosen for maturity)

**Build Tool:**
- **Vite 5**
  - Why: Fast HMR, native ESM, excellent DX
  - Alternative: Next.js (Vite chosen to avoid SSR complexity for now)

**Styling:**
- **Tailwind CSS 3** (proper PostCSS build)
- **shadcn/ui** - Pre-built accessible components
  - Why: Accessible, customizable, not a heavy dependency

**State Management:**
- **TanStack Query (React Query)** for server state
  - Handles caching, refetching, optimistic updates
- **Zustand** for client state (auth, UI preferences)
  - Why: Lightweight, simple API, no boilerplate

**Routing:**
- **TanStack Router** or **React Router 6**
  - Type-safe routes, nested layouts, data loading

**API Client:**
- **OpenAPI TypeScript** generator
  - Generate types and client from openapi.yaml
  - Type-safe API calls

**Authentication:**
- **Firebase Auth SDK** (Identity Platform)
  - JWT tokens, RBAC claims
  - SSO/MFA support

**Forms:**
- **React Hook Form** + **Zod** validation
  - Why: Performance, DX, type-safe schemas

**Charts/Viz:**
- **Recharts** or **Chart.js**
  - KPI time series, portfolio heatmaps

**Testing:**
- **Vitest** - Unit tests
- **Playwright** - E2E tests

### Project Structure

```
ui/
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root component
│   ├── routes/                  # Route components
│   │   ├── index.tsx            # Home/splash
│   │   ├── login.tsx            # Auth flow
│   │   ├── ventures/
│   │   │   ├── index.tsx        # List view
│   │   │   └── [id].tsx         # Detail view
│   │   ├── ideas/
│   │   ├── experiments/
│   │   ├── kpis/
│   │   ├── resources/
│   │   ├── budgets/
│   │   └── ...
│   ├── components/              # Reusable components
│   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── AppShell.tsx     # Main layout wrapper
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── data/
│   │   │   ├── EntityList.tsx   # Generic list component
│   │   │   ├── EntityCard.tsx
│   │   │   ├── DataTable.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── charts/
│   │   │   ├── KPIChart.tsx
│   │   │   ├── Heatmap.tsx
│   │   │   └── ...
│   │   └── forms/
│   │       ├── VentureForm.tsx
│   │       ├── IdeaForm.tsx
│   │       └── ...
│   ├── lib/                     # Utilities
│   │   ├── api.ts               # API client (generated)
│   │   ├── auth.ts              # Auth helpers
│   │   ├── schema.ts            # Zod schemas
│   │   └── utils.ts
│   ├── hooks/                   # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useVentures.ts       # TanStack Query hooks
│   │   ├── useIdeas.ts
│   │   └── ...
│   ├── stores/                  # Zustand stores
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   ├── types/                   # TypeScript types
│   │   ├── api.ts               # Generated from OpenAPI
│   │   ├── entities.ts
│   │   └── index.ts
│   └── styles/
│       ├── globals.css
│       └── tailwind.css
├── public/
│   ├── favicon.svg
│   └── ...
├── tests/
│   ├── unit/
│   └── e2e/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

## Phase 1 Implementation Plan

Phase 1 maps to FRD requirements: FR-1..3, 9-10, 13, 15, 19-20, 46

### Stage 1: Foundation (Week 1)
**Goal:** Set up development environment and core architecture

- [ ] Scaffold Vite + React + TypeScript project
- [ ] Configure Tailwind CSS (PostCSS build)
- [ ] Install and configure shadcn/ui
- [ ] Set up TanStack Query + Zustand
- [ ] Generate API client from openapi.yaml
- [ ] Create AppShell layout (Header, Sidebar, Footer)
- [ ] Implement routing structure
- [ ] Set up environment config (dev/stg/prod)
- [ ] Configure ESLint + Prettier

**Deliverable:** Empty app shell with routing

### Stage 2: Authentication (Week 1)
**Goal:** Implement real auth with RBAC (FR-46)

- [ ] Integrate Firebase Auth SDK
- [ ] Create login flow (email/password + SSO)
- [ ] Implement JWT token handling
- [ ] Extract role claims from token
- [ ] Create auth context + hooks
- [ ] Implement protected routes
- [ ] Add role-based UI hiding
- [ ] Create auth store (Zustand)

**Deliverable:** Working auth with role-based access

### Stage 3: API Integration (Week 2)
**Goal:** Connect to GCS-backed API

- [ ] Configure API client with base URL
- [ ] Add auth headers (JWT bearer token)
- [ ] Create TanStack Query hooks for each entity:
  - `useVentures()` - List via manifests
  - `useVenture(id)` - Get snapshot
  - `useIdeas()`
  - `useExperiments()`
  - etc.
- [ ] Implement loading states
- [ ] Implement error handling + retry logic
- [ ] Add optimistic updates for writes
- [ ] Create query cache invalidation strategies

**Deliverable:** Data flowing from API to UI

### Stage 4: Core Features (Weeks 2-3)
**Goal:** Implement Phase 1 priority features

#### FR-1..3: Ideation (Ideas Module)
- [ ] Ideas list view (from manifests)
  - Filter by status, score
  - Sort by date, score
- [ ] Idea detail view (snapshot)
  - Display all fields: theme, problem, market, team, tech
  - Show scoring data
  - Display stage workflow progress
- [ ] Idea intake form (create new)
  - Structured fields
  - Schema validation
  - Submit to history write endpoint

#### FR-9-10: Venture Workspace
- [ ] Ventures list view (from index by status/lead)
  - Status badges (Idea → Spin-Out)
  - Lead, next milestone, MRR display
  - Filter/search UI
- [ ] Venture detail view
  - Overview tab: metadata, owners, links
  - Milestones tab: timeline, overdue flags
  - KPIs tab: embedded charts
  - Rounds tab: related funding rounds
  - Cap Table tab: ownership snapshot
- [ ] Venture creation form

#### FR-13: Resource Allocation
- [ ] Resources list view
  - Directory of people, roles, cost rates
  - Availability indicator
- [ ] Utilisation view
  - Table: person × venture × % allocation
  - Over/under-utilisation alerts

#### FR-15: Budget & Spend
- [ ] Budgets list view
  - Per-venture budgets
  - Planned vs actual
  - Variance calculation
- [ ] Budget detail view
  - Burn rate chart
  - Runway projection
  - Alerts on overruns

#### FR-19-20: Portfolio Dashboard
- [ ] Portfolio overview page
  - KPI cards: active ventures, MRR, rounds, runway
  - Ventures summary table
  - Recent changes feed (from history events)
  - Load in <1s p50 (per AC-GEN)
- [ ] CSV export for portfolio summary

### Stage 5: Polish & Testing (Week 4)
- [ ] Responsive design (mobile, tablet)
- [ ] Loading skeletons
- [ ] Empty states
- [ ] Error boundaries
- [ ] Toast notifications
- [ ] Unit tests for hooks
- [ ] E2E tests for critical flows (login, list ventures, view detail)
- [ ] Performance audit (Lighthouse)
- [ ] Accessibility audit (WCAG 2.1 AA)

## Success Criteria

### Technical
- [ ] All API endpoints integrated
- [ ] Authentication works with real JWT
- [ ] Role-based access enforced
- [ ] Phase 1 features implemented
- [ ] Test coverage ≥ 70%
- [ ] Lighthouse score ≥ 90
- [ ] Bundle size < 500KB (gzipped)

### User Experience
- [ ] Portfolio page loads in < 1s (p50)
- [ ] Snapshot reads < 500ms (p50)
- [ ] No flash of unstyled content
- [ ] Smooth transitions
- [ ] Clear loading/error states

### FRD Compliance (Phase 1)
- [ ] FR-1..3: Idea intake, screening, stage workflow ✅
- [ ] FR-9-10: Venture workspace, milestones ✅
- [ ] FR-13: Resource allocation basics ✅
- [ ] FR-15: Budget & spend tracking ✅
- [ ] FR-19-20: Portfolio dashboard + KPIs ✅
- [ ] FR-46: RBAC implemented ✅

## Migration Strategy

### Parallel Development
- Keep existing `index.html` in `ui/` directory
- Build new app in `ui/src/`
- Run side-by-side during development

### Cutover Plan
1. Deploy new app to `/new` route
2. Test with small group (Leadership role)
3. Validate all Phase 1 features
4. Redirect `/` → `/new` for all users
5. Archive old `index.html` to `ui/legacy/`

## Out of Scope (Phase 1)

Defer to Phase 2+ (P2-P4 in TODO):
- FR-4–8: Collaboration, research docs, decision gates, talent match, experiments store
- FR-11-12: Tasks integration, product roadmap
- FR-14: Shared services marketplace
- FR-21-25: Benchmarking, what-if modeling, heatmaps (advanced), predictive alerts
- FR-26-31: Advanced ops features (utilization dashboard, budget roll-ups, deviation alerts)
- FR-32-37: Investor/LP CRM, fundraising pipeline, cap tables (advanced), investor reporting, VDR, partner module
- FR-38-45: Advanced analytics, integrations, audit trail UI, exit workflows

## Next Steps

1. **Review & Approve:** Stakeholders review this plan
2. **Scaffold Project:** Run Stage 1 setup
3. **Dev Environment:** Configure API access to local backend
4. **Weekly Demos:** Show progress every Friday
5. **Feedback Loop:** Adjust priorities based on user testing

## Questions & Decisions

- [ ] Framework choice: React approved? (vs Vue/Svelte)
- [ ] UI library: shadcn/ui approved? (vs Material-UI, Ant Design)
- [ ] State management: TanStack Query + Zustand approved?
- [ ] Timeline: 4-week Phase 1 realistic?
- [ ] Design system: Use CityReach brand colors from current UI?
- [ ] Deployment: Where will new app be hosted? (Cloud Run? Cloud Storage static site?)
- [ ] Domain: What URL will it live at?

## References
- FRD: `docs/FRD.md`
- TODO/Roadmap: `TODO.md`
- API Spec: `api/openapi.yaml`
- GCS Persistence Spec: `ecco_gcs_json_persistence_spec_v1.2.md`
- Current UI: `ui/index.html`
