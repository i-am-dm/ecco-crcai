# Ideas Module - Visual Overview

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │   /ideas    │    │ /ideas/new  │    │ /ideas/:id  │       │
│  │  List View  │───▶│ Create Form │───▶│Detail View  │       │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘       │
│         │                  │                  │               │
└─────────┼──────────────────┼──────────────────┼───────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                          COMPONENTS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  IdeasList   │  │   IdeaCard   │  │  IdeaForm    │        │
│  │  (Table)     │  │   (Grid)     │  │  (Create)    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │ IdeaScoring  │  │ IdeaStage    │                          │
│  │  Display     │  │  Workflow    │                          │
│  └──────────────┘  └──────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                            HOOKS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  useIdeas   │  │   useIdea   │  │useCreateIdea│           │
│  │  (List)     │  │  (Detail)   │  │  (Mutate)   │           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│         │                │                │                    │
│  ┌──────┴────────────────┴────────────────┴──────┐            │
│  │         TanStack Query Client                  │            │
│  │  (Caching, Invalidation, Optimistic Updates)  │            │
│  └─────────────────────┬──────────────────────────┘            │
│                        │                                        │
└────────────────────────┼────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │          openapi-fetch client                   │           │
│  │  - Auth middleware (Bearer token)               │           │
│  │  - Environment middleware (env param)           │           │
│  └──────────────────────┬──────────────────────────┘           │
│                         │                                        │
│         ┌───────────────┼───────────────┐                      │
│         │               │               │                      │
│         ▼               ▼               ▼                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                │
│  │ GET      │    │ GET      │    │ POST     │                │
│  │/v1/idea  │    │/v1/idea/ │    │/v1/      │                │
│  │          │    │{id}      │    │internal/ │                │
│  │(List)    │    │(Detail)  │    │history   │                │
│  └──────────┘    └──────────┘    └──────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GCS STORAGE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ideas/                                                         │
│  ├── manifests/                                                 │
│  │   └── manifest-YYYYMMDD-HHMMSS.json    (List)              │
│  ├── snapshots/                                                 │
│  │   └── idea_123/                                             │
│  │       └── snapshot-YYYYMMDD-HHMMSS.json (Detail)           │
│  └── history/                                                   │
│      └── idea_123/                                             │
│          └── YYYYMMDD-HHMMSS.json          (Create/Update)    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Create Idea Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │ Fills form
     ▼
┌─────────────────┐
│   IdeaForm      │
│  (React Hook    │
│   Form + Zod)   │
└────┬────────────┘
     │ Validates
     ▼
┌─────────────────┐       ┌──────────────┐
│ useCreateIdea   │──────▶│ Query Client │
│   (mutation)    │       │ Invalidation │
└────┬────────────┘       └──────────────┘
     │ POST
     ▼
┌─────────────────┐
│  API Client     │
│  /v1/internal/  │
│   history       │
└────┬────────────┘
     │ Writes
     ▼
┌─────────────────┐       ┌──────────────┐
│  GCS Storage    │──────▶│  Handlers    │
│  ideas/history/ │       │  (async)     │
└─────────────────┘       └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │ Snapshots    │
                          │ Manifests    │
                          │ Indices      │
                          └──────────────┘
```

### List with Filters Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │ Opens /ideas
     ▼
┌─────────────────┐       ┌──────────────┐
│  IdeasList      │◀─────▶│  useIdeas    │
│  Component      │       │   (query)    │
└────┬────────────┘       └──────┬───────┘
     │                           │
     │ Applies filters           │ GET
     │ (client-side)             ▼
     │                    ┌──────────────┐
     │                    │  API Client  │
     │                    │  /v1/idea    │
     │                    └──────┬───────┘
     │                           │
     │                           ▼
     │                    ┌──────────────┐
     │                    │ GCS Storage  │
     │                    │  manifests/  │
     │                    └──────────────┘
     │
     ▼
┌─────────────────┐
│  Filtered &     │
│  Sorted Results │
└─────────────────┘
```

## Component Hierarchy

```
routes/ideas/index.tsx (List View)
├── Filter Controls
│   ├── Status <select>
│   ├── Stage <select>
│   ├── Min Score <input>
│   └── Sort By <select>
├── View Mode Toggle
│   ├── Grid <button>
│   └── Table <button>
└── Results Display
    ├── Grid View
    │   └── IdeaCard (×N)
    │       ├── Title/Theme
    │       ├── Problem Snippet
    │       ├── Status Badge
    │       ├── Stage Badge
    │       ├── Score
    │       └── Metadata
    └── Table View
        └── IdeasList
            └── <table>
                ├── Header Row
                └── Data Rows (×N)

routes/ideas/new.tsx (Create View)
└── IdeaForm
    ├── Title <input>
    ├── Theme <input> *
    ├── Problem <textarea> *
    ├── Market <textarea> *
    ├── Team <textarea> *
    ├── Tech <textarea> *
    ├── Description <textarea>
    └── Actions
        ├── Submit <button>
        └── Cancel <button>

routes/ideas/[id].tsx (Detail View)
├── Header
│   ├── Title/Theme
│   ├── Status Badge
│   ├── Tags
│   └── Edit Button
├── Main Content (Left)
│   ├── Problem
│   ├── Market
│   ├── Team
│   ├── Tech
│   └── Description
└── Sidebar (Right)
    ├── IdeaStageWorkflow
    │   └── 6 Stage Stepper
    ├── IdeaScoringDisplay
    │   ├── Overall Score
    │   └── Criteria Breakdown
    └── Stage Info Card
        ├── Owner
        └── Due Date
```

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    TanStack Query State                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Query Keys:                                                    │
│  ┌─────────────────────────────────────────────────┐           │
│  │ ['ideas', filters]          - Idea list         │           │
│  │ ['idea', id]                - Single idea       │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  Cache Settings:                                                │
│  ┌─────────────────────────────────────────────────┐           │
│  │ List:   staleTime 30s, cacheTime 5m             │           │
│  │ Detail: staleTime 60s, cacheTime 10m            │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  Invalidation:                                                  │
│  ┌─────────────────────────────────────────────────┐           │
│  │ onCreate  → invalidate ['ideas']                │           │
│  │ onUpdate  → invalidate ['ideas'], ['idea', id]  │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Local Component State                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Filter State (useState):                                       │
│  ┌─────────────────────────────────────────────────┐           │
│  │ status: 'all' | IdeaStatus                      │           │
│  │ stage: 'all' | IdeaStage                        │           │
│  │ minScore: number | undefined                    │           │
│  │ sortBy: 'date' | 'score' | 'status'             │           │
│  │ sortOrder: 'asc' | 'desc'                       │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  View State (useState):                                         │
│  ┌─────────────────────────────────────────────────┐           │
│  │ viewMode: 'grid' | 'table'                      │           │
│  │ showFilters: boolean                            │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  Form State (React Hook Form):                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │ register(), handleSubmit(), formState           │           │
│  │ errors, isDirty, isValid                        │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Styling System

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tailwind CSS Classes                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layout:                                                        │
│  ┌─────────────────────────────────────────────────┐           │
│  │ Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8│          │
│  │ Grid:      grid grid-cols-1 md:grid-cols-2      │           │
│  │                  lg:grid-cols-3 gap-4           │           │
│  │ Flex:      flex items-center justify-between    │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  Cards:                                                         │
│  ┌─────────────────────────────────────────────────┐           │
│  │ rounded-xl bg-white dark:bg-slate-900           │           │
│  │ border border-slate-200/70 dark:border-slate-700│           │
│  │ shadow-subtle p-6                               │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  Buttons:                                                       │
│  ┌─────────────────────────────────────────────────┐           │
│  │ Primary: bg-gradient-to-r from-brand-600        │           │
│  │          to-cyan-600 text-white                 │           │
│  │ Ghost:   hover:bg-slate-100                     │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  Badges:                                                        │
│  ┌─────────────────────────────────────────────────┐           │
│  │ px-2.5 py-1 text-xs font-medium rounded-md      │           │
│  │ bg-{color}-50 dark:bg-{color}-900/40            │           │
│  │ text-{color}-700 dark:text-{color}-300          │           │
│  │ ring-1 ring-inset ring-{color}-200              │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  Typography:                                                    │
│  ┌─────────────────────────────────────────────────┐           │
│  │ H1: text-3xl font-bold tracking-tight           │           │
│  │ H2: text-2xl font-semibold                      │           │
│  │ H3: text-xl font-semibold                       │           │
│  │ Body: text-base text-slate-600                  │           │
│  │ Small: text-sm text-slate-500                   │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Type System

```typescript
// Core Types
interface Idea {
  id: string;
  theme: string;          // Required
  problem: string;        // Required
  market: string;         // Required
  team: string;           // Required
  tech: string;           // Required
  title?: string;
  description?: string;
  score?: IdeaScoring;
  status?: IdeaStatus;
  stage?: IdeaStage;
  stageOwner?: string;
  stageDueDate?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  attachments?: string[];
  tags?: string[];
}

// Enums
type IdeaStatus =
  | 'New'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'On Hold';

type IdeaStage =
  | 'Idea'
  | 'Validation'
  | 'Build'
  | 'Launch'
  | 'Scale'
  | 'Spin-Out';

// Scoring
interface IdeaScoring {
  overall?: number;    // 0-10
  market?: number;     // 0-10
  team?: number;       // 0-10
  tech?: number;       // 0-10
  timing?: number;     // 0-10
  notes?: string;
}

// Filters
interface IdeaListFilters {
  status?: IdeaStatus | 'all';
  stage?: IdeaStage | 'all';
  minScore?: number;
  sortBy?: 'score' | 'date' | 'status';
  sortOrder?: 'asc' | 'desc';
}
```

## File Dependencies

```
idea.ts (types)
    ↓
    ├──→ idea.ts (schemas)
    │       ↓
    │       └──→ IdeaForm.tsx
    │
    ├──→ useIdeas.ts
    │       ↓
    │       └──→ routes/ideas/index.tsx
    │               ↓
    │               ├──→ IdeasList.tsx
    │               └──→ IdeaCard.tsx
    │
    ├──→ useIdea.ts
    │       ↓
    │       └──→ routes/ideas/[id].tsx
    │               ↓
    │               ├──→ IdeaScoringDisplay.tsx
    │               └──→ IdeaStageWorkflow.tsx
    │
    └──→ useCreateIdea.ts
            ↓
            └──→ routes/ideas/new.tsx
                    ↓
                    └──→ IdeaForm.tsx
```

## Performance Metrics

```
┌─────────────────────────────────────────────────────────────────┐
│                      Performance Profile                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Initial Load:                                                  │
│  ┌─────────────────────────────────────────────────┐           │
│  │ FCP (First Contentful Paint)    < 1.0s          │           │
│  │ LCP (Largest Contentful Paint)  < 2.0s          │           │
│  │ TTI (Time to Interactive)       < 3.0s          │           │
│  │ CLS (Cumulative Layout Shift)   < 0.1           │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  Query Performance:                                             │
│  ┌─────────────────────────────────────────────────┐           │
│  │ List query (cached)             < 50ms          │           │
│  │ List query (network)            < 500ms         │           │
│  │ Detail query (cached)           < 50ms          │           │
│  │ Detail query (network)          < 300ms         │           │
│  │ Create mutation                 < 1000ms        │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  Client-Side Operations:                                        │
│  ┌─────────────────────────────────────────────────┐           │
│  │ Filter 100 ideas                < 10ms          │           │
│  │ Sort 100 ideas                  < 20ms          │           │
│  │ Form validation                 < 5ms           │           │
│  │ View mode toggle                < 100ms         │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  Bundle Size:                                                   │
│  ┌─────────────────────────────────────────────────┐           │
│  │ Ideas module (gzipped)          ~50KB           │           │
│  │ Total app (gzipped)             ~200KB          │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Accessibility Tree

```
Ideas List Page
└── <main role="main">
    ├── <h1>Ideas</h1>
    ├── <button aria-label="Submit new idea">
    ├── <section aria-label="Filters">
    │   ├── <select aria-label="Filter by status">
    │   ├── <select aria-label="Filter by stage">
    │   ├── <input aria-label="Minimum score">
    │   └── <select aria-label="Sort by">
    ├── <div role="group" aria-label="View mode">
    │   ├── <button aria-label="Grid view" aria-pressed="true">
    │   └── <button aria-label="Table view" aria-pressed="false">
    └── <section aria-label="Ideas list">
        └── <table> or <div role="list">
            └── Items with proper heading hierarchy

Idea Detail Page
└── <main role="main">
    ├── <nav aria-label="Breadcrumb">
    │   └── <a href="/ideas">Back to Ideas</a>
    ├── <article>
    │   ├── <h1>{title}</h1>
    │   ├── <span role="status" aria-label="Status: {status}">
    │   ├── <section aria-label="Problem">
    │   ├── <section aria-label="Market">
    │   ├── <section aria-label="Team">
    │   └── <section aria-label="Technology">
    └── <aside>
        ├── <section aria-label="Stage progression">
        └── <section aria-label="Scoring">
```

## Test Coverage

```
Unit Tests (Component Level)
├── IdeaCard.test.tsx
│   ├── ✓ Renders with required props
│   ├── ✓ Displays title or theme
│   ├── ✓ Shows correct badge colors
│   └── ✓ Handles click navigation
├── IdeaForm.test.tsx
│   ├── ✓ Validates required fields
│   ├── ✓ Shows error messages
│   ├── ✓ Submits valid data
│   └── ✓ Handles submission errors
└── IdeaStageWorkflow.test.tsx
    ├── ✓ Highlights current stage
    ├── ✓ Marks completed stages
    └── ✓ Responsive layout works

Integration Tests (Hook Level)
├── useIdeas.test.ts
│   ├── ✓ Fetches ideas list
│   ├── ✓ Applies filters correctly
│   └── ✓ Handles API errors
├── useIdea.test.ts
│   ├── ✓ Fetches single idea
│   └── ✓ Handles missing idea
└── useCreateIdea.test.ts
    ├── ✓ Creates new idea
    ├── ✓ Invalidates queries
    └── ✓ Handles creation errors

E2E Tests (Flow Level)
├── ideas-list.e2e.ts
│   ├── ✓ Loads and displays ideas
│   ├── ✓ Filter flow works
│   └── ✓ Navigation works
├── ideas-create.e2e.ts
│   ├── ✓ Form validation flow
│   ├── ✓ Successful creation flow
│   └── ✓ Redirects to detail
└── ideas-detail.e2e.ts
    ├── ✓ Displays all fields
    ├── ✓ Stage workflow renders
    └── ✓ Back navigation works
```

---

**END OF VISUAL OVERVIEW**
