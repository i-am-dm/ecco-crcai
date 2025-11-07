# CityReach Innovation Labs UI — Phase 1 Sprint Plan

Version: 1.0
Date: 2025-11-06
Owner: Frontend Team
Timeline: 4 weeks (4 six-day sprints)
Phase: Phase 1 — Foundation + Core Features

---

## Executive Summary

This sprint plan breaks down Phase 1 of the CityReach Innovation Labs UI redesign into **4 six-day development cycles**. Each sprint delivers working, demo-able software with clear acceptance criteria aligned to FRD requirements.

**Phase 1 Scope (FRD):** FR-1..3 (Ideation), FR-9-10 (Venture Workspace), FR-13 (Resource Allocation), FR-15 (Budget & Spend), FR-19-20 (Portfolio Dashboard), FR-46 (RBAC)

**Timeline:** 24 working days total (4 sprints × 6 days)

**Strategy:**
- Front-load risk (auth, API integration in Sprint 1-2)
- Build incrementally (working features each sprint)
- Weekly demos (end of each sprint)
- Feedback loops (adjust Sprint N+1 based on Sprint N learnings)

---

## Sprint Overview

| Sprint | Dates | Focus | Demo Deliverable |
|--------|-------|-------|------------------|
| Sprint 1 | Days 1-6 | Foundation + Auth | Working login with role-based routing |
| Sprint 2 | Days 7-12 | API + Ventures | Live venture list + detail from real API |
| Sprint 3 | Days 13-18 | Ideas + Portfolio | Idea intake + portfolio dashboard |
| Sprint 4 | Days 19-24 | Resources + Polish | Complete Phase 1 feature set + tests |

---

## Critical Path Items

These must complete on schedule or will block downstream work:

1. **API client generation** (Sprint 1, Day 2) → blocks all data integration
2. **Auth implementation** (Sprint 1, Days 3-5) → blocks protected routes
3. **TanStack Query setup** (Sprint 2, Day 7) → blocks data fetching patterns
4. **Venture list view** (Sprint 2, Days 9-10) → reference pattern for other entities
5. **Form infrastructure** (Sprint 3, Day 13) → blocks all create/update flows

---

## Prototype vs Build Fully

### Prototype (Minimal Viable Implementation)
- Resource allocation views (static tables initially)
- Budget variance calculations (basic formulas)
- Charts/visualizations (simple bar charts, defer heatmaps)
- Advanced filtering (start with status/lead filters only)
- Mobile responsive (defer to Phase 2)

### Build Fully (Production-Ready)
- Authentication & RBAC (security-critical)
- API integration layer (foundation for all features)
- Venture workspace (core workflow)
- Idea intake form (critical path feature)
- Portfolio dashboard (leadership visibility)
- Error handling & loading states (UX quality)

---

# Sprint 1: Foundation + Authentication

**Dates:** Days 1-6
**Sprint Goal:** Establish development environment and implement secure authentication with role-based access control.

## Sprint Objectives
- Scaffold React + TypeScript + Vite project
- Integrate Firebase Auth with JWT + RBAC
- Set up state management (Zustand, TanStack Query)
- Create app shell layout (header, sidebar, routing)
- Demo working login with role-based navigation

---

## User Stories

### US-1.1: Developer Environment Setup
**As a** developer
**I want** a modern development environment with hot reload and type safety
**So that** I can build features efficiently

**Acceptance Criteria:**
- [ ] Vite dev server starts on `npm run dev`
- [ ] TypeScript compilation with zero errors
- [ ] Tailwind CSS purging unused styles
- [ ] ESLint + Prettier configured
- [ ] Hot module reload works (<500ms)

**Estimate:** 1 day
**Priority:** P0 (Critical Path)

---

### US-1.2: API Client Generation
**As a** developer
**I want** type-safe API client generated from OpenAPI spec
**So that** I get autocomplete and compile-time safety

**Acceptance Criteria:**
- [ ] `openapi-typescript` generates types from `api/openapi.yaml`
- [ ] API client configured with base URL (env-specific)
- [ ] Request/response types available in IDE
- [ ] Example API call compiles with TypeScript

**Estimate:** 0.5 day
**Priority:** P0 (Critical Path)
**Dependencies:** openapi.yaml spec must be current

---

### US-1.3: Authentication Implementation
**As a** user
**I want** to log in with my email and see role-appropriate navigation
**So that** I can access features relevant to my role

**Acceptance Criteria:**
- [ ] Firebase Auth SDK integrated
- [ ] Login page with email/password form
- [ ] JWT token stored in auth store (Zustand)
- [ ] Role claims extracted from token (custom claims)
- [ ] Protected routes redirect to login if not authenticated
- [ ] Role-based navigation (Admin sees all, Investor sees limited modules)
- [ ] Logout functionality clears token and redirects

**Estimate:** 2 days
**Priority:** P0 (Critical Path)
**Risk:** HIGH — JWT custom claims setup may require backend coordination

---

### US-1.4: App Shell Layout
**As a** user
**I want** consistent navigation and layout
**So that** I can easily find features

**Acceptance Criteria:**
- [ ] Header with logo, user menu, logout
- [ ] Sidebar with module navigation (ventures, ideas, portfolio, etc.)
- [ ] Content area with route rendering
- [ ] Footer with version and links
- [ ] Dark mode toggle preserved from legacy UI
- [ ] Responsive sidebar collapse (defer mobile to Phase 2)

**Estimate:** 1.5 days
**Priority:** P0

---

### US-1.5: Routing & Protected Routes
**As a** developer
**I want** type-safe routing with nested layouts
**So that** protected routes enforce authentication

**Acceptance Criteria:**
- [ ] React Router 6 configured
- [ ] Routes: `/login`, `/`, `/ventures`, `/ventures/:id`, `/ideas`, `/portfolio`
- [ ] Protected route wrapper checks auth before rendering
- [ ] 404 page for unknown routes
- [ ] Browser back/forward works correctly

**Estimate:** 1 day
**Priority:** P0

---

## Technical Tasks

### T-1.1: Scaffold Vite Project
- [ ] Run `npm create vite@latest ui -- --template react-ts`
- [ ] Install core dependencies (react-router-dom, zustand, @tanstack/react-query)
- [ ] Configure `vite.config.ts` with aliases (`@/components`, `@/lib`)
- [ ] Set up `tsconfig.json` with strict mode

**Owner:** Frontend Lead
**Estimate:** 2 hours

---

### T-1.2: Configure Tailwind CSS
- [ ] Install `tailwindcss`, `postcss`, `autoprefixer`
- [ ] Configure `tailwind.config.ts` with color palette from legacy UI
- [ ] Create `src/styles/globals.css` with base styles
- [ ] Verify purge works (production build < 50KB CSS)

**Owner:** Frontend Dev
**Estimate:** 2 hours

---

### T-1.3: Install shadcn/ui Components
- [ ] Run `npx shadcn-ui@latest init`
- [ ] Install initial components: button, card, input, label, table
- [ ] Verify components render with Tailwind classes

**Owner:** Frontend Dev
**Estimate:** 1 hour

---

### T-1.4: Generate API Client
- [ ] Install `openapi-typescript` and `openapi-fetch`
- [ ] Add npm script: `"generate:api": "openapi-typescript ../api/openapi.yaml -o src/types/api.ts"`
- [ ] Run generation and commit generated types
- [ ] Create `src/lib/api.ts` client wrapper with base URL from env

**Owner:** Frontend Dev
**Estimate:** 3 hours
**Dependency:** Requires `api/openapi.yaml`

---

### T-1.5: Firebase Auth Setup
- [ ] Install `firebase` SDK
- [ ] Create `src/lib/firebase.ts` with config (env vars)
- [ ] Create `src/stores/authStore.ts` (Zustand) with login/logout/state
- [ ] Create `src/hooks/useAuth.ts` with auth helpers
- [ ] Implement login page UI (email/password form)
- [ ] Add JWT token refresh logic
- [ ] Test role extraction from custom claims

**Owner:** Frontend Lead
**Estimate:** 1 day
**Risk:** Requires Identity Platform custom claims configured

---

### T-1.6: Layout Components
- [ ] Create `src/components/layout/AppShell.tsx` (outer wrapper)
- [ ] Create `src/components/layout/Header.tsx` (logo, user menu, dark mode toggle)
- [ ] Create `src/components/layout/Sidebar.tsx` (navigation with role filtering)
- [ ] Create `src/components/layout/Footer.tsx` (version, links)
- [ ] Implement dark mode toggle with localStorage persistence

**Owner:** Frontend Dev
**Estimate:** 6 hours

---

### T-1.7: Routing Setup
- [ ] Create route structure in `src/routes/`
- [ ] Implement `ProtectedRoute` wrapper component
- [ ] Configure routes in `App.tsx` with nested layouts
- [ ] Add loading spinner during route transitions
- [ ] Test navigation and back button

**Owner:** Frontend Dev
**Estimate:** 4 hours

---

### T-1.8: Environment Configuration
- [ ] Create `.env.development`, `.env.staging`, `.env.production`
- [ ] Add `VITE_API_BASE_URL`, `VITE_FIREBASE_CONFIG`
- [ ] Document environment variables in README
- [ ] Add `.env.example` to repo

**Owner:** Frontend Dev
**Estimate:** 1 hour

---

## Dependencies

### External
- **Firebase/Identity Platform:** Custom claims must be configured for roles
- **API Backend:** Must be running locally or in dev environment
- **OpenAPI Spec:** Must be current with implemented endpoints

### Internal
- T-1.4 (API client) blocks all Sprint 2 work
- T-1.5 (Auth) blocks protected route implementation
- T-1.1 (Scaffold) blocks all other tasks

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Firebase custom claims not configured | HIGH | Medium | Coordinate with backend team on Day 1; use mock claims if needed |
| OpenAPI spec incomplete | HIGH | Low | Review spec on Day 1; flag missing endpoints early |
| Team unfamiliar with TanStack Query | Medium | Medium | Pair programming on first implementation; share docs |
| Tailwind CSS purge too aggressive | Low | Low | Test production build early (Day 3) |
| Auth token refresh fails silently | Medium | Low | Add error logging and Sentry integration |

---

## Demo Script (End of Sprint 1)

**Duration:** 15 minutes
**Audience:** Product Owner, Backend Team, Stakeholders

**Demo Flow:**
1. Show login page and enter credentials
2. Demonstrate JWT token in DevTools (redacted secret)
3. Show role-based navigation (Admin vs Investor view)
4. Navigate between routes (fast, no page reload)
5. Toggle dark mode
6. Logout and show redirect to login
7. Show code: generated API types, auth store, protected routes

**Success Criteria:**
- Authentication works end-to-end
- Role-based UI hiding functional
- No console errors
- Stakeholders approve to proceed to Sprint 2

---

## Sprint Retrospective Questions

1. Was Firebase Auth setup easier/harder than expected?
2. Did we hit any TypeScript compilation issues?
3. Is the API client generation workflow smooth?
4. Do we need to adjust Sprint 2 scope based on velocity?
5. Are there any performance concerns with the base setup?

---

## Sprint Metrics

- **Planned Story Points:** 13 (based on estimates)
- **Velocity Target:** Complete all P0 stories
- **Code Coverage Target:** N/A (infrastructure sprint)
- **Test Count Target:** 5 unit tests (auth helpers, routing logic)

---

# Sprint 2: API Integration + Ventures Module

**Dates:** Days 7-12
**Sprint Goal:** Connect UI to GCS-backed API and implement ventures list + detail views with real data.

## Sprint Objectives
- Set up TanStack Query for server state management
- Implement ventures list view (from indices)
- Implement venture detail view (from snapshots)
- Create reusable data components (tables, cards, filters)
- Demo live venture data from API

---

## User Stories

### US-2.1: API Integration Layer
**As a** developer
**I want** a robust data fetching layer with caching and error handling
**So that** I can build features without worrying about API mechanics

**Acceptance Criteria:**
- [ ] TanStack Query configured with defaults (staleTime, retry logic)
- [ ] API client wrapper adds auth headers (JWT bearer token)
- [ ] Error handling for 401 (redirect to login), 403, 404, 500
- [ ] Loading states shown during fetches
- [ ] Query cache invalidation on mutations
- [ ] DevTools shows query status

**Estimate:** 1 day
**Priority:** P0 (Critical Path)

---

### US-2.2: Ventures List View
**As a** venture lead
**I want** to see all ventures with status, lead, and next milestone
**So that** I can get an overview of portfolio activity

**Acceptance Criteria:**
- [ ] Fetch ventures from `/v1/venture?env=dev`
- [ ] Display table with columns: Name, Status, Lead, Next Milestone, MRR
- [ ] Status badge color-coded (Idea=gray, Validation=yellow, Build=blue, Scale=green)
- [ ] Filter by status dropdown (All, Idea, Validation, Build, Launch, Scale, Spin-Out)
- [ ] Sort by: Name, Status, MRR (ascending/descending)
- [ ] Click row navigates to detail view
- [ ] Loading skeleton while fetching
- [ ] Empty state if no ventures
- [ ] Error message if API fails

**Estimate:** 1.5 days
**Priority:** P0

---

### US-2.3: Venture Detail View
**As a** venture lead
**I want** to see full details of a specific venture
**So that** I can track progress and access related data

**Acceptance Criteria:**
- [ ] Fetch venture snapshot from `/v1/venture/{id}?env=dev`
- [ ] Display overview section: name, status, lead, description, owners, links
- [ ] Show milestones tab with timeline and overdue flags
- [ ] Show KPIs tab with placeholder for charts (defer actual charts)
- [ ] Show related rounds (fetch from `/v1/index/rounds/by-venture/{id}`)
- [ ] Breadcrumb navigation: Home > Ventures > {Venture Name}
- [ ] Edit button (non-functional, defer to Phase 2)
- [ ] Back to list button

**Estimate:** 2 days
**Priority:** P0

---

### US-2.4: Reusable Data Components
**As a** developer
**I want** reusable table and card components
**So that** I can quickly build list views for other entities

**Acceptance Criteria:**
- [ ] `<DataTable>` component with sort, filter, pagination props
- [ ] `<EntityCard>` component with configurable fields
- [ ] `<StatusBadge>` component with color mapping
- [ ] `<FilterBar>` component with dropdown filters
- [ ] `<LoadingSkeleton>` component for tables
- [ ] `<EmptyState>` component with icon and message

**Estimate:** 1.5 days
**Priority:** P1

---

## Technical Tasks

### T-2.1: TanStack Query Setup
- [ ] Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- [ ] Create `src/lib/queryClient.ts` with default config
- [ ] Wrap app in `<QueryClientProvider>` in `main.tsx`
- [ ] Add React Query DevTools in development mode
- [ ] Configure staleTime: 5 minutes, retry: 2 attempts

**Owner:** Frontend Lead
**Estimate:** 2 hours

---

### T-2.2: API Client with Auth
- [ ] Update `src/lib/api.ts` to add `Authorization: Bearer {token}` header
- [ ] Read token from auth store on each request
- [ ] Add response interceptor for 401 (logout and redirect)
- [ ] Add error handling for network failures

**Owner:** Frontend Dev
**Estimate:** 3 hours

---

### T-2.3: Ventures Query Hooks
- [ ] Create `src/hooks/useVentures.ts` with `useQuery` for list
- [ ] Create `src/hooks/useVenture.ts` with `useQuery` for detail
- [ ] Add query keys: `['ventures']`, `['venture', id]`
- [ ] Handle loading, error, and success states
- [ ] Test with mock API responses

**Owner:** Frontend Dev
**Estimate:** 4 hours

---

### T-2.4: Ventures List UI
- [ ] Create `src/routes/ventures/index.tsx`
- [ ] Build table with shadcn/ui `<Table>` component
- [ ] Implement status filter dropdown
- [ ] Implement sort by column headers
- [ ] Add click handler to navigate to detail
- [ ] Style status badges with Tailwind classes

**Owner:** Frontend Dev
**Estimate:** 8 hours

---

### T-2.5: Venture Detail UI
- [ ] Create `src/routes/ventures/[id].tsx`
- [ ] Fetch snapshot data with `useVenture(id)` hook
- [ ] Build overview section with shadcn/ui `<Card>`
- [ ] Build milestones tab (static data initially)
- [ ] Build KPIs tab (placeholder charts)
- [ ] Add breadcrumb navigation

**Owner:** Frontend Dev
**Estimate:** 1 day

---

### T-2.6: Reusable Components
- [ ] Create `src/components/data/DataTable.tsx` with generic types
- [ ] Create `src/components/data/EntityCard.tsx`
- [ ] Create `src/components/data/StatusBadge.tsx` with color map
- [ ] Create `src/components/data/FilterBar.tsx`
- [ ] Create `src/components/data/LoadingSkeleton.tsx`
- [ ] Create `src/components/data/EmptyState.tsx`
- [ ] Write unit tests for `<StatusBadge>` color logic

**Owner:** Frontend Dev
**Estimate:** 1 day

---

### T-2.7: Error Handling
- [ ] Create `src/components/ErrorBoundary.tsx`
- [ ] Add error boundary around route content
- [ ] Create `src/components/ApiError.tsx` for API error display
- [ ] Add retry button for failed queries
- [ ] Log errors to console (Sentry in Phase 2)

**Owner:** Frontend Dev
**Estimate:** 3 hours

---

## Dependencies

### External
- **API Backend:** Must have `/v1/venture` endpoint working
- **Test Data:** Need at least 5 ventures seeded in dev environment

### Internal
- Sprint 1 auth must be complete (JWT headers)
- Sprint 1 routing must be complete (detail navigation)

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| API endpoint not ready | HIGH | Medium | Use mock data with MSW (Mock Service Worker) |
| API response shape differs from spec | HIGH | Medium | Validate against OpenAPI types on Day 7 |
| TanStack Query learning curve | Medium | Medium | Team member demos pattern on Day 7 |
| Slow API response (>1s) | Medium | Low | Add loading skeletons; investigate backend |
| CORS issues in local dev | Low | Medium | Configure Vite proxy in `vite.config.ts` |

---

## Demo Script (End of Sprint 2)

**Duration:** 20 minutes
**Audience:** Product Owner, Backend Team, Venture Leads

**Demo Flow:**
1. Show ventures list with real data from API
2. Demonstrate filtering by status (watch data update)
3. Sort by different columns
4. Click a venture to show detail view
5. Show snapshot data in overview section
6. Navigate to milestones tab
7. Show loading state by throttling network
8. Show error state by killing API
9. Demonstrate retry on error
10. Show React Query DevTools with cache state

**Success Criteria:**
- Real data flowing from API to UI
- Filtering and sorting works
- Navigation smooth (no flicker)
- Error handling graceful
- Stakeholders approve UX patterns

---

## Sprint Retrospective Questions

1. Was TanStack Query setup straightforward?
2. Did API response shapes match expectations?
3. Are reusable components generic enough?
4. What data components are needed for Sprint 3?
5. Performance concerns with list view?

---

## Sprint Metrics

- **Planned Story Points:** 14
- **Velocity Target:** All P0 stories + 1 P1
- **Code Coverage Target:** 60% (hooks and components)
- **Test Count Target:** 10 unit tests

---

# Sprint 3: Ideas Module + Portfolio Dashboard

**Dates:** Days 13-18
**Sprint Goal:** Implement idea intake form with validation and build portfolio dashboard with KPIs.

## Sprint Objectives
- Implement ideas list view (from manifests)
- Build idea intake form with schema validation
- Create portfolio dashboard with KPI cards
- Implement basic charts for time-series data
- Demo full idea-to-venture workflow

---

## User Stories

### US-3.1: Ideas List View
**As a** studio team member
**I want** to see all submitted ideas with scores and status
**So that** I can prioritize which to pursue

**Acceptance Criteria:**
- [ ] Fetch ideas from `/v1/idea?env=dev`
- [ ] Display table: Theme, Problem Statement, Score, Status, Submitted Date
- [ ] Filter by status: All, Submitted, Screening, Validated, Rejected
- [ ] Filter by score range: 0-3 (Low), 4-6 (Medium), 7-10 (High)
- [ ] Sort by: Score, Date (newest first)
- [ ] Click row navigates to idea detail
- [ ] "New Idea" button opens intake form
- [ ] Loading and error states

**Estimate:** 1 day
**Priority:** P0

---

### US-3.2: Idea Intake Form
**As a** team member
**I want** to submit a new idea with structured fields
**So that** ideas are consistently captured for evaluation

**Acceptance Criteria:**
- [ ] Form fields: Theme, Problem Statement, Target Market, Team Proposal, Tech Stack, Stage
- [ ] Zod schema validation (required fields, max lengths)
- [ ] Client-side validation errors shown inline
- [ ] Submit button disabled until valid
- [ ] POST to `/v1/idea` (write endpoint) with JWT auth
- [ ] Success: show toast notification and redirect to ideas list
- [ ] Error: show error message, allow retry
- [ ] Cancel button returns to ideas list

**Estimate:** 2 days
**Priority:** P0
**Risk:** HIGH — First write path implementation

---

### US-3.3: Idea Detail View
**As a** studio team member
**I want** to see full details of an idea
**So that** I can evaluate it for progression

**Acceptance Criteria:**
- [ ] Fetch idea snapshot from `/v1/idea/{id}?env=dev`
- [ ] Display all fields: theme, problem, market, team, tech, score breakdown
- [ ] Show stage workflow progress indicator
- [ ] Show comments section (read-only, defer write to Phase 2)
- [ ] Show attached research docs (links only)
- [ ] Edit button (non-functional, defer to Phase 2)
- [ ] Delete button (confirm modal, defer to Phase 2)

**Estimate:** 1.5 days
**Priority:** P1

---

### US-3.4: Portfolio Dashboard
**As a** leadership
**I want** a high-level view of all ventures and key metrics
**So that** I can make strategic decisions

**Acceptance Criteria:**
- [ ] KPI cards: Total Ventures, Active Ventures, Total MRR, Avg Runway (months)
- [ ] Ventures summary table: Top 10 by MRR
- [ ] Recent changes feed (from history events, simplified)
- [ ] Status distribution chart (pie or bar: how many in each stage)
- [ ] MRR trend chart (last 12 months, placeholder data initially)
- [ ] Load time p50 < 1 second (test with 20+ ventures)
- [ ] CSV export button (downloads ventures summary)
- [ ] Refresh button to reload data

**Estimate:** 2 days
**Priority:** P0

---

### US-3.5: Basic Charts
**As a** user
**I want** to see KPIs visualized
**So that** I can quickly understand trends

**Acceptance Criteria:**
- [ ] Install Recharts library
- [ ] Create `<KPIChart>` component for time-series (line chart)
- [ ] Create `<StatusDistribution>` component (bar chart)
- [ ] Charts responsive (adjust to container width)
- [ ] Tooltip shows exact values on hover
- [ ] Colors match design system
- [ ] Loading state for chart data

**Estimate:** 1 day
**Priority:** P1

---

## Technical Tasks

### T-3.1: Ideas Query Hooks
- [ ] Create `src/hooks/useIdeas.ts` with `useQuery` for list
- [ ] Create `src/hooks/useIdea.ts` with `useQuery` for detail
- [ ] Create `src/hooks/useCreateIdea.ts` with `useMutation` for create
- [ ] Add optimistic updates for create (add to cache immediately)
- [ ] Invalidate queries on success

**Owner:** Frontend Dev
**Estimate:** 4 hours

---

### T-3.2: Ideas List UI
- [ ] Create `src/routes/ideas/index.tsx`
- [ ] Reuse `<DataTable>` component from Sprint 2
- [ ] Add status and score filters
- [ ] Style score badge with color gradient
- [ ] Add "New Idea" button

**Owner:** Frontend Dev
**Estimate:** 6 hours

---

### T-3.3: Idea Intake Form UI
- [ ] Install `react-hook-form` and `zod`
- [ ] Create `src/lib/schemas/idea.ts` with Zod schema
- [ ] Create `src/routes/ideas/new.tsx` form page
- [ ] Build form with shadcn/ui `<Input>`, `<Textarea>`, `<Select>`
- [ ] Integrate react-hook-form with Zod resolver
- [ ] Add submit handler with `useCreateIdea` mutation
- [ ] Add toast notifications (shadcn/ui `<Toaster>`)
- [ ] Test validation edge cases

**Owner:** Frontend Lead
**Estimate:** 1.5 days
**Risk:** First mutation implementation

---

### T-3.4: Idea Detail UI
- [ ] Create `src/routes/ideas/[id].tsx`
- [ ] Fetch snapshot with `useIdea(id)` hook
- [ ] Build detail layout with shadcn/ui cards
- [ ] Add stage workflow progress bar
- [ ] Add placeholder sections for comments and docs

**Owner:** Frontend Dev
**Estimate:** 1 day

---

### T-3.5: Portfolio Dashboard UI
- [ ] Create `src/routes/portfolio/index.tsx`
- [ ] Create `src/components/dashboard/KPICard.tsx`
- [ ] Fetch ventures and calculate KPIs (total, active, MRR sum, avg runway)
- [ ] Build summary table with top 10 ventures
- [ ] Add CSV export function (use `papaparse` library)
- [ ] Optimize query to load fast (<1s)

**Owner:** Frontend Dev
**Estimate:** 1.5 days

---

### T-3.6: Charts Implementation
- [ ] Install `recharts`
- [ ] Create `src/components/charts/KPIChart.tsx` (line chart)
- [ ] Create `src/components/charts/StatusDistribution.tsx` (bar chart)
- [ ] Add chart to portfolio dashboard
- [ ] Test with real data
- [ ] Add loading state while chart data loads

**Owner:** Frontend Dev
**Estimate:** 1 day

---

### T-3.7: Toast Notifications
- [ ] Install shadcn/ui `toast` component
- [ ] Add `<Toaster>` to `App.tsx`
- [ ] Create `src/lib/toast.ts` helper functions
- [ ] Show success toast on idea submission
- [ ] Show error toast on API failures

**Owner:** Frontend Dev
**Estimate:** 2 hours

---

## Dependencies

### External
- **API Backend:** Must support POST `/v1/idea` (write endpoint)
- **Test Data:** Need 10+ ideas with varied scores/statuses
- **History Events:** Need event stream for recent changes feed (or mock)

### Internal
- Sprint 2 data patterns (reuse `<DataTable>`)
- Sprint 2 API client (mutations extend existing setup)

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Write endpoint not implemented | HIGH | Medium | Coordinate with backend on Day 13; use mock POST if needed |
| Form validation complex | Medium | Low | Use react-hook-form examples; pair program |
| CSV export slow for large data | Medium | Low | Limit export to 1000 rows; add pagination |
| Chart library too heavy | Low | Low | Recharts is 300KB; acceptable for Phase 1 |
| Recent changes feed format unclear | Medium | Medium | Mock data initially; finalize with backend |

---

## Demo Script (End of Sprint 3)

**Duration:** 25 minutes
**Audience:** Product Owner, Studio Leadership, Team Members

**Demo Flow:**
1. Show portfolio dashboard with KPI cards
2. Demonstrate status distribution chart
3. Show MRR trend chart (even if placeholder data)
4. Export ventures to CSV and open in Excel
5. Navigate to ideas list
6. Show filtering by status and score
7. Click "New Idea" button
8. Fill out idea intake form
9. Trigger validation error (leave required field blank)
10. Submit valid form
11. Show success toast notification
12. Verify new idea appears in list
13. Click to view idea detail

**Success Criteria:**
- Portfolio dashboard loads in <1s
- Form validation works smoothly
- Idea submission succeeds end-to-end
- Charts render without performance issues
- Stakeholders approve to proceed to Sprint 4

---

## Sprint Retrospective Questions

1. Was react-hook-form integration smooth?
2. Did write endpoint work as expected?
3. Are charts performant with real data?
4. What additional KPIs should be on dashboard?
5. Any performance issues to address in Sprint 4?

---

## Sprint Metrics

- **Planned Story Points:** 15
- **Velocity Target:** All P0 stories + 1 P1
- **Code Coverage Target:** 70%
- **Test Count Target:** 15 unit tests (form validation, hooks)

---

# Sprint 4: Resources + Budgets + Polish

**Dates:** Days 19-24
**Sprint Goal:** Complete Phase 1 feature set (resources, budgets) and polish UX with tests and refinements.

## Sprint Objectives
- Implement resource allocation views (FR-13)
- Implement budget & spend views (FR-15)
- Add comprehensive error handling and loading states
- Write unit and E2E tests for critical flows
- Performance optimization (Lighthouse audit)
- Final demo and handoff

---

## User Stories

### US-4.1: Resource Directory
**As a** operations lead
**I want** to see all people, their roles, and availability
**So that** I can allocate them to ventures

**Acceptance Criteria:**
- [ ] Fetch resources from `/v1/resource?env=dev`
- [ ] Display table: Name, Role, Cost Rate, Availability %
- [ ] Filter by role: All, Engineer, Designer, PM, Legal, Marketing
- [ ] Search by name
- [ ] Click row shows allocation details (modal or detail page)
- [ ] CSV export

**Estimate:** 1 day
**Priority:** P0

---

### US-4.2: Utilization View
**As a** operations lead
**I want** to see resource utilization by person and venture
**So that** I can identify over/under-allocation

**Acceptance Criteria:**
- [ ] Fetch allocation data (from index or computed view)
- [ ] Display matrix: Person × Venture with % allocation
- [ ] Highlight over-allocated (>100%) in red
- [ ] Highlight under-allocated (<50%) in yellow
- [ ] Show total allocation per person (sum row)
- [ ] Show total allocation per venture (sum column)
- [ ] Filter by date range (current month by default)

**Estimate:** 1.5 days
**Priority:** P1

---

### US-4.3: Budget List View
**As a** finance lead
**I want** to see budgets for all ventures
**So that** I can track planned vs actual spend

**Acceptance Criteria:**
- [ ] Fetch budgets from `/v1/budget?env=dev`
- [ ] Display table: Venture, Planned, Actual, Variance, % Used
- [ ] Color-code variance: green (under budget), red (over budget)
- [ ] Filter by venture
- [ ] Sort by variance
- [ ] CSV export

**Estimate:** 1 day
**Priority:** P0

---

### US-4.4: Budget Detail View
**As a** finance lead
**I want** to see burn rate and runway for a venture
**So that** I can forecast when funding is needed

**Acceptance Criteria:**
- [ ] Fetch budget snapshot from `/v1/budget/{id}?env=dev`
- [ ] Display: Planned, Actual, Variance, % Used
- [ ] Show burn rate chart (monthly spend over time)
- [ ] Calculate runway: Remaining Budget / Avg Monthly Burn
- [ ] Alert badge if runway < 3 months
- [ ] Link to related venture

**Estimate:** 1.5 days
**Priority:** P1

---

### US-4.5: Comprehensive Error Handling
**As a** user
**I want** clear error messages and recovery options
**So that** I know what went wrong and how to fix it

**Acceptance Criteria:**
- [ ] 401 errors redirect to login with message
- [ ] 403 errors show "Access Denied" with support contact
- [ ] 404 errors show "Not Found" with back link
- [ ] 500 errors show "Server Error" with retry button
- [ ] Network errors show "Connection Lost" with retry
- [ ] Form submission errors show inline field errors
- [ ] Toast notifications for non-blocking errors
- [ ] Error boundary catches React errors and shows fallback UI

**Estimate:** 1 day
**Priority:** P0

---

### US-4.6: Loading States & Skeletons
**As a** user
**I want** visual feedback during data loading
**So that** I know the app is working

**Acceptance Criteria:**
- [ ] All list views show skeleton loaders
- [ ] All detail views show loading spinner
- [ ] Form submissions disable submit button and show spinner
- [ ] Chart placeholders during data load
- [ ] No layout shift when data loads (reserve space)

**Estimate:** 0.5 day
**Priority:** P1

---

### US-4.7: Empty States
**As a** user
**I want** helpful messages when data is empty
**So that** I know what action to take

**Acceptance Criteria:**
- [ ] Ideas list: "No ideas yet. Submit your first idea!"
- [ ] Ventures list: "No ventures yet."
- [ ] Resources list: "No resources configured."
- [ ] Budgets list: "No budgets set."
- [ ] Empty states have icon and call-to-action button

**Estimate:** 0.5 day
**Priority:** P1

---

### US-4.8: Testing & Quality
**As a** developer
**I want** automated tests covering critical flows
**So that** regressions are caught early

**Acceptance Criteria:**
- [ ] Unit tests: 70% code coverage
- [ ] Unit tests for all hooks (useVentures, useIdeas, useAuth)
- [ ] Unit tests for form validation (Zod schemas)
- [ ] Unit tests for utility functions (date formatting, calculations)
- [ ] E2E test: Login → View Ventures → View Detail
- [ ] E2E test: Login → Submit Idea → Verify in List
- [ ] E2E test: Login → View Portfolio Dashboard → Export CSV
- [ ] All tests pass in CI

**Estimate:** 1.5 days
**Priority:** P0

---

### US-4.9: Performance Optimization
**As a** user
**I want** fast page loads and smooth interactions
**So that** the app feels responsive

**Acceptance Criteria:**
- [ ] Lighthouse score ≥ 90 (Performance, Accessibility, Best Practices)
- [ ] Portfolio dashboard loads in < 1s (p50)
- [ ] Venture detail loads in < 500ms (p50)
- [ ] Bundle size < 500KB (gzipped)
- [ ] Code splitting by route (lazy load)
- [ ] Images optimized (if any)
- [ ] No unnecessary re-renders (React DevTools Profiler)

**Estimate:** 1 day
**Priority:** P1

---

## Technical Tasks

### T-4.1: Resource Query Hooks
- [ ] Create `src/hooks/useResources.ts` with `useQuery`
- [ ] Create `src/hooks/useResource.ts` for detail
- [ ] Add query keys: `['resources']`, `['resource', id]`

**Owner:** Frontend Dev
**Estimate:** 2 hours

---

### T-4.2: Resource Views UI
- [ ] Create `src/routes/resources/index.tsx`
- [ ] Build table with filters and search
- [ ] Create utilization matrix component
- [ ] Add CSV export

**Owner:** Frontend Dev
**Estimate:** 1 day

---

### T-4.3: Budget Query Hooks
- [ ] Create `src/hooks/useBudgets.ts` with `useQuery`
- [ ] Create `src/hooks/useBudget.ts` for detail
- [ ] Add query keys: `['budgets']`, `['budget', id]`

**Owner:** Frontend Dev
**Estimate:** 2 hours

---

### T-4.4: Budget Views UI
- [ ] Create `src/routes/budgets/index.tsx`
- [ ] Build table with variance color-coding
- [ ] Create `src/routes/budgets/[id].tsx` detail page
- [ ] Add burn rate chart (reuse `<KPIChart>`)
- [ ] Calculate runway (Remaining / Avg Burn)
- [ ] Add alert badge for low runway

**Owner:** Frontend Dev
**Estimate:** 1.5 days

---

### T-4.5: Error Handling Components
- [ ] Update `src/components/ErrorBoundary.tsx` with better UI
- [ ] Create `src/components/errors/ApiError.tsx`
- [ ] Create `src/components/errors/NetworkError.tsx`
- [ ] Create `src/components/errors/NotFoundError.tsx`
- [ ] Add error handling in all query hooks
- [ ] Add error handling in all mutation hooks

**Owner:** Frontend Dev
**Estimate:** 1 day

---

### T-4.6: Loading & Empty States
- [ ] Update `<LoadingSkeleton>` for all views
- [ ] Create `src/components/EmptyState.tsx` with variants
- [ ] Add empty states to all list views
- [ ] Add loading states to all detail views
- [ ] Test loading states with network throttling

**Owner:** Frontend Dev
**Estimate:** 4 hours

---

### T-4.7: Unit Tests
- [ ] Write tests for `useAuth` hook
- [ ] Write tests for `useVentures` hook
- [ ] Write tests for `useIdeas` hook
- [ ] Write tests for form validation (idea schema)
- [ ] Write tests for utility functions (formatDate, calculateVariance)
- [ ] Achieve 70% code coverage
- [ ] Run tests in CI (GitHub Actions or Cloud Build)

**Owner:** Frontend Lead
**Estimate:** 1 day

---

### T-4.8: E2E Tests
- [ ] Install Playwright
- [ ] Configure Playwright for UI project
- [ ] Write E2E test: Login flow
- [ ] Write E2E test: View ventures list and detail
- [ ] Write E2E test: Submit idea form
- [ ] Write E2E test: View portfolio dashboard
- [ ] Run E2E tests in CI

**Owner:** Frontend Lead
**Estimate:** 1 day

---

### T-4.9: Performance Optimization
- [ ] Run Lighthouse audit on all pages
- [ ] Implement code splitting (React.lazy + Suspense)
- [ ] Optimize Tailwind CSS (purge unused classes)
- [ ] Add memoization where needed (React.memo, useMemo)
- [ ] Profile with React DevTools
- [ ] Test bundle size with `vite build --analyze`
- [ ] Add performance monitoring (Web Vitals)

**Owner:** Frontend Dev
**Estimate:** 1 day

---

### T-4.10: Documentation
- [ ] Update `ui/README.md` with setup instructions
- [ ] Document environment variables
- [ ] Document API client usage
- [ ] Document component patterns
- [ ] Add JSDoc comments to hooks and utilities
- [ ] Create troubleshooting guide

**Owner:** Frontend Lead
**Estimate:** 4 hours

---

### T-4.11: Final Polish
- [ ] Review all UIs for consistency
- [ ] Fix any alignment or spacing issues
- [ ] Ensure dark mode works on all pages
- [ ] Test keyboard navigation
- [ ] Test screen reader accessibility (basic)
- [ ] Fix any console warnings
- [ ] Test on Chrome, Firefox, Safari

**Owner:** Frontend Team
**Estimate:** 4 hours

---

## Dependencies

### External
- **API Backend:** Must have `/v1/resource` and `/v1/budget` endpoints
- **Test Data:** Need sample resources and budgets in dev

### Internal
- Sprint 3 patterns (reuse components and hooks)
- All previous sprints must be complete and stable

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Resource/budget endpoints not ready | HIGH | Medium | Use mock data; implement UI fully |
| E2E tests flaky | Medium | Medium | Add retries and wait conditions |
| Lighthouse score below target | Medium | Low | Code splitting and tree shaking |
| Too many bugs found in testing | HIGH | Medium | Extend sprint by 1-2 days if needed |
| Performance regression | Medium | Low | Monitor bundle size in CI |

---

## Demo Script (End of Sprint 4 / Phase 1 Complete)

**Duration:** 45 minutes
**Audience:** All Stakeholders, Leadership, Team

**Demo Flow:**

**Part 1: Authentication & Navigation (5 min)**
1. Show login with role-based access
2. Navigate through all modules in sidebar
3. Toggle dark mode

**Part 2: Ventures Module (8 min)**
4. Show ventures list with filters and sorting
5. Navigate to venture detail
6. Show milestones, KPIs, and related rounds
7. Demonstrate breadcrumb navigation

**Part 3: Ideas Module (8 min)**
8. Show ideas list with filters
9. Submit new idea via intake form
10. Trigger validation error and fix
11. Show success toast and verify in list
12. View idea detail

**Part 4: Portfolio Dashboard (8 min)**
13. Show KPI cards (total ventures, MRR, runway)
14. Show status distribution chart
15. Show MRR trend chart
16. Show ventures summary table
17. Export to CSV and open

**Part 5: Resources & Budgets (8 min)**
18. Show resource directory
19. Show utilization matrix (over/under-allocation)
20. Show budgets list with variance color-coding
21. Show budget detail with burn rate chart
22. Demonstrate low runway alert

**Part 6: Quality & Performance (5 min)**
23. Show error handling (kill API, trigger 404)
24. Show loading states (throttle network)
25. Show empty states
26. Run Lighthouse audit live (≥90 score)

**Part 7: Testing & Code Quality (3 min)**
27. Show test coverage report (70%+)
28. Run unit tests (all pass)
29. Run E2E test (login → submit idea)

**Success Criteria:**
- All Phase 1 FRs demonstrated (FR-1..3, 9-10, 13, 15, 19-20, 46)
- Performance targets met (<1s portfolio, <500ms detail)
- Error handling graceful
- Tests passing
- Stakeholders approve for production deployment

---

## Sprint Retrospective Questions

1. Did we achieve 70% code coverage?
2. Were E2E tests valuable or too flaky?
3. What performance bottlenecks did we find?
4. What should be prioritized for Phase 2?
5. What went well across all 4 sprints?
6. What should we improve for Phase 2 planning?

---

## Sprint Metrics

- **Planned Story Points:** 16
- **Velocity Target:** All P0 stories + P1 if time allows
- **Code Coverage Target:** 70%
- **Test Count Target:** 30 unit tests, 5 E2E tests
- **Lighthouse Score Target:** ≥90

---

# Phase 1 Summary

## Completed Features (FRD Mapping)

| FRD Requirement | Feature | Status |
|-----------------|---------|--------|
| FR-1..3 | Idea intake, screening, stage workflow | ✅ Complete |
| FR-9 | Venture workspace (list, detail) | ✅ Complete |
| FR-10 | Milestones/timeline | ✅ Complete |
| FR-13 | Resource allocation (directory, utilization) | ✅ Complete |
| FR-15 | Budget & spend (planned vs actual, burn rate) | ✅ Complete |
| FR-19 | Portfolio dashboard | ✅ Complete |
| FR-20 | Venture KPIs (CSV export) | ✅ Complete |
| FR-46 | RBAC (role-based auth and navigation) | ✅ Complete |

---

## Sprint Velocity Analysis

| Sprint | Planned SP | Actual SP | Notes |
|--------|------------|-----------|-------|
| Sprint 1 | 13 | TBD | Foundation + Auth |
| Sprint 2 | 14 | TBD | API + Ventures |
| Sprint 3 | 15 | TBD | Ideas + Portfolio |
| Sprint 4 | 16 | TBD | Resources + Polish |
| **Total** | **58** | **TBD** | Track actual vs planned |

**Velocity Notes:**
- Track actual story points completed each sprint
- Adjust Sprint N+1 scope based on Sprint N velocity
- If behind, cut P1 stories and defer to Phase 2
- If ahead, pull in Phase 2 stories (FR-4: Comments)

---

## Key Metrics (Target vs Actual)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Portfolio load time (p50) | <1s | TBD | Measure in Sprint 4 |
| Detail view load time (p50) | <500ms | TBD | Measure in Sprint 4 |
| Bundle size (gzipped) | <500KB | TBD | Measure in Sprint 4 |
| Lighthouse score | ≥90 | TBD | Audit in Sprint 4 |
| Code coverage | ≥70% | TBD | Measure in Sprint 4 |
| Test count | 30 unit + 5 E2E | TBD | Count in Sprint 4 |

---

## Risk Register (Final)

| Risk | Severity | Status | Mitigation |
|------|----------|--------|------------|
| Auth custom claims not configured | HIGH | Open | Coordinate with backend team |
| Write endpoints not implemented | HIGH | Open | Use mock POST endpoints |
| API response shape differs from spec | MEDIUM | Open | Validate early in Sprint 2 |
| Team learning curve (TanStack Query) | MEDIUM | Open | Pair programming and demos |
| Performance below targets | MEDIUM | Open | Optimize in Sprint 4 |
| E2E tests flaky | LOW | Open | Add retries and stabilization |

**Risk Mitigation Strategy:**
- Review risks at start of each sprint
- Escalate HIGH risks to stakeholders immediately
- Pivot to mock data if backend delayed
- Add buffer days if needed (extend Sprint 4 by 1-2 days)

---

## Technical Debt Identified

Items to address in Phase 2 or technical sprints:

1. **Mobile responsiveness** — Sidebar collapse and mobile layout
2. **Advanced filtering** — Multi-select, date ranges, search across fields
3. **Optimistic updates** — Faster perceived performance on mutations
4. **Chart library evaluation** — Consider lighter alternative to Recharts
5. **Sentry integration** — Error tracking and monitoring
6. **Accessibility audit** — Full WCAG 2.1 AA compliance
7. **Internationalization** — i18n for multi-language support
8. **Offline support** — Service worker and cache strategies
9. **Advanced testing** — Visual regression tests, performance tests
10. **Documentation** — Storybook for component library

---

## Phase 2 Preview

**Scope (Tentative):**
- FR-4–8: Collaboration (comments), research docs, decision gates, talent match, experiments
- FR-11-12: Tasks integration, product roadmap
- FR-14: Shared services marketplace
- FR-26,28,30: Resource enhancements, budget roll-ups, legal/entity management
- FR-32-33: Investor CRM, fundraising pipeline

**Timing:** 6 weeks (6 six-day sprints)
**Start Date:** TBD after Phase 1 deployment

---

## Handoff Checklist

Before declaring Phase 1 complete:

- [ ] All P0 user stories complete and accepted
- [ ] Demo successful with stakeholder approval
- [ ] Code merged to `main` branch
- [ ] Tests passing in CI (70% coverage)
- [ ] Documentation updated (README, API docs, component docs)
- [ ] Deployment plan reviewed (staging then production)
- [ ] Performance benchmarks documented
- [ ] Known issues logged in backlog
- [ ] Retrospective completed and actions captured
- [ ] Phase 2 planning scheduled

---

## Success Criteria (Final Checklist)

### Technical Excellence
- [ ] All API endpoints integrated
- [ ] Authentication works with real JWT
- [ ] Role-based access enforced
- [ ] Phase 1 features implemented per FRD
- [ ] Test coverage ≥ 70%
- [ ] Lighthouse score ≥ 90
- [ ] Bundle size < 500KB (gzipped)
- [ ] No console errors in production
- [ ] Error boundaries catch all crashes

### User Experience
- [ ] Portfolio page loads in < 1s (p50)
- [ ] Snapshot reads < 500ms (p50)
- [ ] No flash of unstyled content
- [ ] Smooth transitions between routes
- [ ] Clear loading/error states
- [ ] Helpful empty states
- [ ] Toast notifications for actions
- [ ] Dark mode works on all pages

### FRD Compliance (Phase 1)
- [ ] FR-1..3: Idea intake, screening, stage workflow ✅
- [ ] FR-9-10: Venture workspace, milestones ✅
- [ ] FR-13: Resource allocation basics ✅
- [ ] FR-15: Budget & spend tracking ✅
- [ ] FR-19-20: Portfolio dashboard + KPIs ✅
- [ ] FR-46: RBAC implemented ✅

### Business Value
- [ ] Stakeholders can log in and view real data
- [ ] Team can submit ideas via UI
- [ ] Leadership has portfolio visibility
- [ ] Resource allocation transparent
- [ ] Budget tracking operational
- [ ] CSV exports for external analysis
- [ ] Reduces manual reporting time by 50%+

---

## Appendix A: Sprint Board Structure

### Backlog
- All user stories not yet started
- Prioritized by P0 > P1 > P2
- Estimated with story points
- Acceptance criteria defined

### Sprint 1 (Days 1-6)
- US-1.1 through US-1.5
- Technical tasks T-1.1 through T-1.8
- Demo: Working auth and routing

### Sprint 2 (Days 7-12)
- US-2.1 through US-2.4
- Technical tasks T-2.1 through T-2.7
- Demo: Live venture data from API

### Sprint 3 (Days 13-18)
- US-3.1 through US-3.5
- Technical tasks T-3.1 through T-3.7
- Demo: Idea submission and portfolio dashboard

### Sprint 4 (Days 19-24)
- US-4.1 through US-4.9
- Technical tasks T-4.1 through T-4.11
- Demo: Complete Phase 1 feature set

---

## Appendix B: Definition of Done (DoD)

A user story is "Done" when:

1. **Code Complete**
   - [ ] Code written and passes TypeScript compilation
   - [ ] Code follows project style guide (ESLint/Prettier)
   - [ ] No console errors or warnings
   - [ ] Code reviewed by at least one other developer

2. **Testing Complete**
   - [ ] Unit tests written and passing (where applicable)
   - [ ] E2E tests written and passing (for critical flows)
   - [ ] Manual testing completed (happy path and edge cases)
   - [ ] Tested in Chrome, Firefox, Safari

3. **Documentation Complete**
   - [ ] JSDoc comments added to functions/hooks
   - [ ] README updated if needed
   - [ ] Acceptance criteria verified

4. **Deployment Ready**
   - [ ] Code merged to `main` branch
   - [ ] CI pipeline passes (lint, test, build)
   - [ ] No regressions in existing features
   - [ ] Stakeholder demo and approval

---

## Appendix C: Sprint Ceremonies

### Daily Standup (10 minutes, asynchronous OK)
- What did I complete yesterday?
- What will I work on today?
- Any blockers?

**Format:** Slack thread or quick video call

---

### Sprint Planning (2 hours, start of sprint)
- Review sprint goal
- Walk through user stories
- Estimate tasks
- Identify dependencies and risks
- Assign owners
- Commit to sprint scope

**Attendees:** Frontend team, Product Owner, Backend liaison

---

### Mid-Sprint Check-In (30 minutes, Day 3)
- Are we on track for sprint goal?
- Any risks or blockers?
- Do we need to adjust scope?
- Any help needed from other teams?

**Attendees:** Frontend team, Product Owner

---

### Sprint Review / Demo (45-60 minutes, last day)
- Demonstrate completed user stories
- Show working software (not slides)
- Gather feedback from stakeholders
- Accept/reject completed work

**Attendees:** All stakeholders, team

---

### Sprint Retrospective (1 hour, last day after demo)
- What went well?
- What could be improved?
- What will we commit to changing next sprint?
- Celebrate wins

**Attendees:** Frontend team only (safe space)

**Output:** 2-3 action items for next sprint

---

## Appendix D: Tools & Resources

### Development Tools
- **IDE:** VS Code with recommended extensions
- **Browser:** Chrome DevTools, React DevTools, React Query DevTools
- **API Testing:** Postman or Insomnia
- **Git:** GitHub with branch protection on `main`

### Project Management
- **Sprint Board:** GitHub Projects or Jira
- **Docs:** Confluence or GitHub Wiki
- **Communication:** Slack (#ecco-frontend channel)

### CI/CD
- **Pipeline:** GitHub Actions or Cloud Build
- **Deployment:** Cloud Run or Firebase Hosting
- **Monitoring:** Cloud Monitoring, Lighthouse CI

### Testing
- **Unit Tests:** Vitest
- **E2E Tests:** Playwright
- **Coverage:** c8 (built into Vitest)
- **Performance:** Lighthouse, WebPageTest

---

## Appendix E: Contact & Escalation

### Team Contacts
- **Frontend Lead:** [Name] — Slack: @frontend-lead
- **Product Owner:** [Name] — Slack: @product-owner
- **Backend Liaison:** [Name] — Slack: @backend-lead
- **DevOps:** [Name] — Slack: @devops

### Escalation Path
1. **Blocker identified:** Raise in daily standup or Slack immediately
2. **HIGH risk:** Notify Product Owner and stakeholders within 1 hour
3. **Sprint goal at risk:** Mid-sprint check-in to adjust scope
4. **External dependency delayed:** Escalate to management

---

## Conclusion

This sprint plan provides a structured, actionable roadmap for delivering Phase 1 of the CityReach Innovation Labs UI redesign in **4 weeks (24 days)**. Each sprint delivers working software aligned to FRD requirements, with clear acceptance criteria and demo deliverables.

**Key Success Factors:**
- Front-loaded risk (auth, API in Sprint 1-2)
- Incremental delivery (demo every 6 days)
- Feedback loops (adjust each sprint based on learnings)
- Focus on core value (portfolio visibility, idea intake, venture management)
- Quality built-in (tests, performance, error handling)

By following this plan, we will have a production-ready UI that replaces the legacy monolithic HTML file with a modern, scalable, and maintainable React application.

**Next Actions:**
1. Review and approve this sprint plan with stakeholders
2. Confirm backend API readiness for Sprint 1-2
3. Set up development environment (Day 1)
4. Begin Sprint 1 planning session
5. Start building! 🚀

---

**Document History:**
- v1.0 — 2025-11-06 — Initial sprint plan created
