# CityReach Innovation Labs UI - Documentation

Comprehensive documentation for the CityReach Innovation Labs UI redesign.

---

## Quick Links

- [Getting Started](./GETTING_STARTED.md) - Setup guide for new developers
- [Architecture](./ARCHITECTURE.md) - System design and data flow
- [Redesign Plan](./REDESIGN_PLAN.md) - Implementation roadmap and phases
- [API Integration](./API_INTEGRATION.md) - Complete API integration guide
- [API Quick Reference](./API_QUICK_REFERENCE.md) - Cheat sheet for common patterns
- [API Summary](./API_INTEGRATION_SUMMARY.md) - Findings and recommendations

---

## Documentation Overview

### 1. Getting Started

**Audience:** New developers joining the project

**Contents:**
- Development environment setup
- Running the UI locally
- Project structure walkthrough
- First contribution guide

**Start here if:** You're new to the CityReach Innovation Labs codebase

---

### 2. Architecture

**Audience:** Developers, architects, technical leads

**Contents:**
- System architecture diagram
- Data flow patterns (read path, write path)
- Component hierarchy
- State management strategy (TanStack Query + Zustand)
- Authentication flow
- RBAC enforcement
- Performance optimization
- Error handling strategy

**Start here if:** You need to understand how the system works

---

### 3. Redesign Plan

**Audience:** Product managers, developers, stakeholders

**Contents:**
- Current state analysis
- Technology stack decisions
- Project structure
- Phase 1 implementation plan (4 weeks)
- Success criteria
- Migration strategy
- Out of scope items

**Start here if:** You're planning features or tracking progress

---

### 4. API Integration Guide

**Audience:** Frontend developers implementing API calls

**Contents:**
- Client generation from OpenAPI spec
- Auth interceptor pattern (JWT bearer token)
- Error handling patterns
- Retry logic and resilience
- Type-safe API calls with examples
- TanStack Query integration patterns
- Optimistic updates for writes
- Cache invalidation strategies
- Phase 1 API endpoint documentation
- Performance considerations
- Testing strategies
- Gap analysis and recommendations

**Start here if:** You're integrating with the API

---

### 5. API Quick Reference

**Audience:** Frontend developers (cheat sheet)

**Contents:**
- Setup instructions (1-2-3 steps)
- Common patterns with code snippets
- Query keys convention
- Error handling templates
- Auth store usage
- Testing with MSW
- Phase 1 endpoints table
- Pro tips

**Start here if:** You need a quick example to copy/paste

---

### 6. API Integration Summary

**Audience:** Tech leads, architects, decision makers

**Contents:**
- Executive summary
- Current state assessment
- Critical gaps for Phase 1
- Performance and reliability findings
- Security findings
- OpenAPI spec enhancements required
- Prioritized action items (HIGH/MEDIUM/LOW)
- Recommendations summary

**Start here if:** You need a high-level overview or action plan

---

## Document Relationships

```
README.md (you are here)
    ├── GETTING_STARTED.md
    │   └── First-time setup, local dev
    │
    ├── ARCHITECTURE.md
    │   ├── System design
    │   ├── Data flow
    │   └── State management
    │
    ├── REDESIGN_PLAN.md
    │   ├── Technology choices
    │   ├── Phase 1 features
    │   └── Timeline
    │
    ├── API_INTEGRATION.md
    │   ├── Client generation
    │   ├── Auth patterns
    │   ├── TanStack Query
    │   ├── Error handling
    │   ├── Endpoint docs
    │   └── Gap analysis
    │
    ├── API_QUICK_REFERENCE.md
    │   └── Code snippets, cheat sheet
    │
    └── API_INTEGRATION_SUMMARY.md
        ├── Findings
        ├── Gaps
        └── Action items
```

---

## Phase 1 Focus Areas

Based on the FRD and TODO, Phase 1 prioritizes:

1. **Ideation (FR-1..3)** - Ideas module with intake, screening, workflow
2. **Venture Workspace (FR-9-10)** - Ventures list and detail views
3. **Resource Allocation (FR-13)** - Resource directory and utilisation
4. **Budget Tracking (FR-15)** - Budget vs actual, variance reports
5. **Portfolio Dashboard (FR-19-20)** - Summary KPIs and exports
6. **RBAC (FR-46)** - Role-based access control

See [REDESIGN_PLAN.md](./REDESIGN_PLAN.md) for detailed Stage 1-5 breakdown.

---

## Technology Stack

### Core
- **React 18** - Component framework
- **TypeScript** - Type safety
- **Vite 5** - Build tool
- **Tailwind CSS 3** - Styling

### State Management
- **TanStack Query** - Server state (API data)
- **Zustand** - Client state (auth, UI preferences)

### API & Auth
- **openapi-fetch** - Type-safe API client
- **Firebase Auth SDK** - JWT authentication

### UI Components
- **shadcn/ui** - Accessible components
- **Recharts** - Charts and visualizations

### Forms & Validation
- **React Hook Form** - Form state
- **Zod** - Schema validation

### Testing
- **Vitest** - Unit tests
- **Playwright** - E2E tests
- **MSW** - API mocking

---

## Development Workflow

### 1. Make Changes to API Spec

```bash
# Edit OpenAPI spec
vim api/openapi.yaml

# Regenerate TypeScript types
cd ui/
npm run generate:api
```

### 2. Create Custom Hook

```bash
# Create new hook for entity
touch src/hooks/useVentures.ts

# Follow pattern from API_QUICK_REFERENCE.md
```

### 3. Build Component

```bash
# Create component
touch src/components/VenturesList.tsx

# Import hook and render data
```

### 4. Test Integration

```bash
# Unit test with MSW
npm test src/hooks/useVentures.test.ts

# E2E test with Playwright
npm run test:e2e
```

---

## Common Tasks

### Generate API Client

```bash
cd ui/
npm run generate:api
```

### Run Dev Server

```bash
cd ui/
npm run dev
# Open http://localhost:5173
```

### Test with Local API Edge

```bash
# Terminal 1: Start API Edge
cd services/api-edge
npm run dev

# Terminal 2: Start UI
cd ui/
VITE_API_URL=http://localhost:8085 npm run dev
```

### Run Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Type check
npm run type-check
```

---

## File Structure

```
ui/
├── _docs/                     # Documentation (you are here)
│   ├── README.md
│   ├── GETTING_STARTED.md
│   ├── ARCHITECTURE.md
│   ├── REDESIGN_PLAN.md
│   ├── API_INTEGRATION.md
│   ├── API_QUICK_REFERENCE.md
│   └── API_INTEGRATION_SUMMARY.md
│
├── src/
│   ├── main.tsx               # Entry point
│   ├── App.tsx                # Root component
│   │
│   ├── routes/                # Route components
│   │   ├── index.tsx          # Home/splash
│   │   ├── login.tsx
│   │   ├── ventures/
│   │   ├── ideas/
│   │   └── ...
│   │
│   ├── components/            # Reusable components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # AppShell, Header, Sidebar
│   │   ├── data/              # EntityList, DataTable
│   │   └── forms/             # VentureForm, IdeaForm
│   │
│   ├── hooks/                 # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useVentures.ts
│   │   └── ...
│   │
│   ├── stores/                # Zustand stores
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   │
│   ├── lib/                   # Utilities
│   │   ├── api.ts             # API client
│   │   ├── queryClient.ts     # TanStack Query config
│   │   ├── queryKeys.ts       # Query key factory
│   │   └── errorHandler.ts
│   │
│   ├── types/                 # TypeScript types
│   │   ├── api.ts             # Generated from OpenAPI
│   │   └── entities.ts
│   │
│   └── styles/
│       └── globals.css
│
├── tests/
│   ├── unit/
│   ├── e2e/
│   └── mocks/                 # MSW handlers
│
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Key Decisions

### Why TanStack Query?
- Automatic caching and background refetching
- Optimistic updates out of the box
- Devtools for debugging
- Battle-tested in production

### Why Zustand?
- Minimal boilerplate vs Redux
- TypeScript-friendly
- Small bundle size (1KB)
- Simple API

### Why openapi-fetch?
- Type-safe API calls
- Generated from OpenAPI spec
- Lightweight (fetch-based)
- Tree-shakeable

### Why shadcn/ui?
- Copy/paste, not installed as dependency
- Accessible by default (ARIA)
- Customizable via Tailwind
- No lock-in

---

## Performance Targets (AC-GEN)

From the FRD:

- **Snapshot reads:** p50 < 500ms
- **Portfolio summary:** p50 < 1s
- **List queries:** p50 < 500ms
- **Write operations:** 202 Accepted in < 200ms (async pipeline ~1-2s)

Optimization strategies:
- TanStack Query caching (5-10 min TTL)
- Prefetch on hover
- Code splitting (lazy load routes)
- Dynamic imports for heavy libraries
- Use index endpoints for fast lookups

---

## Security Considerations

- JWT validation on every API request
- RBAC enforcement (backend + frontend)
- No sensitive data in localStorage (except token)
- CORS headers configured for allowed origins
- Demo mode disabled in production (`DEMO_AUTH=0`)

See [ARCHITECTURE.md](./ARCHITECTURE.md#authentication-flow) for detailed auth flow.

---

## Testing Strategy

- **Unit tests (Vitest):** Custom hooks, utilities, schemas
- **Integration tests:** API client with MSW mocks
- **E2E tests (Playwright):** Critical user flows (login, create venture, etc.)
- **Coverage target:** 70%+

See [API_INTEGRATION.md](./API_INTEGRATION.md#testing-strategies) for examples.

---

## Deployment

Phase 1 deployment options:

1. **Cloud Run** - Containerized React app (SSR optional)
2. **Cloud Storage + Load Balancer** - Static site hosting
3. **Firebase Hosting** - Easy deploy with CDN

See [REDESIGN_PLAN.md](./REDESIGN_PLAN.md#questions--decisions) for deployment decisions.

---

## Contributing

1. Read [GETTING_STARTED.md](./GETTING_STARTED.md) for setup
2. Follow patterns in [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)
3. Write tests for new features
4. Update docs if adding new patterns
5. Run `npm run lint` and `npm run type-check` before commit

---

## Roadmap

**Phase 1 (0-3 months):**
- FR-1..3: Ideation module
- FR-9-10: Venture workspace
- FR-13: Resource allocation
- FR-15: Budget tracking
- FR-19-20: Portfolio dashboard
- FR-46: RBAC

**Phase 2 (3-6 months):**
- FR-4-6: Collaboration, decision gates
- FR-11-12: Tasks, roadmap
- FR-26-28: Operations features

**Phase 3+ (6-12 months):**
- FR-21-25: Advanced analytics
- FR-32-37: Investor/LP features
- FR-38-45: Integrations, audit trail

See [TODO.md](../../TODO.md) for detailed task breakdown.

---

## Questions & Support

- **Architecture questions:** See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **API questions:** See [API_INTEGRATION.md](./API_INTEGRATION.md)
- **Quick examples:** See [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)
- **Action items:** See [API_INTEGRATION_SUMMARY.md](./API_INTEGRATION_SUMMARY.md)

---

## Changelog

**2025-11-06:**
- Added API Integration Guide
- Added API Quick Reference
- Added API Integration Summary
- Enhanced README with document relationships

**2025-11-05:**
- Initial documentation structure
- Architecture overview
- Redesign plan
- Getting started guide

---

**Last Updated:** 2025-11-06
**Version:** 1.1
**Status:** Active
