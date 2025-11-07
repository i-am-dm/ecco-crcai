# CityReach Innovation Labs UI - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React Application                     │   │
│  │                                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   Routes     │  │  Components  │  │    Hooks     │  │   │
│  │  │              │  │              │  │              │  │   │
│  │  │ - Ventures   │  │ - EntityList │  │ - useAuth    │  │   │
│  │  │ - Ideas      │  │ - DataTable  │  │ - useVentures│  │   │
│  │  │ - KPIs       │  │ - FilterBar  │  │ - useIdeas   │  │   │
│  │  │ - Resources  │  │ - KPIChart   │  │ - useQuery   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                           │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │           State Management Layer                  │  │   │
│  │  │                                                    │  │   │
│  │  │  TanStack Query (Server State)                    │  │   │
│  │  │  - Caching, refetching, optimistic updates       │  │   │
│  │  │  - Query invalidation                             │  │   │
│  │  │                                                    │  │   │
│  │  │  Zustand (Client State)                           │  │   │
│  │  │  - Auth state (user, roles, token)               │  │   │
│  │  │  - UI preferences (theme, env, filters)          │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │              API Integration Layer                │  │   │
│  │  │                                                    │  │   │
│  │  │  - OpenAPI generated client (TypeScript)         │  │   │
│  │  │  - Auth interceptor (JWT bearer token)           │  │   │
│  │  │  - Error handling & retry logic                  │  │   │
│  │  │  - Request/response transformations              │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────┬───────────────────────────────────┘
                            │ HTTPS + JWT
                            │
┌───────────────────────────┴───────────────────────────────────┐
│                      API Gateway / Cloud Run                   │
│                  (services/api-edge)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                Authentication Middleware                  │  │
│  │  - JWT validation (Identity Platform)                    │  │
│  │  - Extract role claims                                    │  │
│  │  - RBAC enforcement                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     Route Handlers                        │  │
│  │                                                            │  │
│  │  GET  /v1/{entity}              → List via manifests     │  │
│  │  GET  /v1/{entity}/{id}         → Snapshot by id         │  │
│  │  GET  /v1/index/ventures/by-*   → Index queries          │  │
│  │  GET  /v1/portfolio/summary     → Aggregates             │  │
│  │  GET  /v1/kpis/{metric}/series  → Time series            │  │
│  │  POST /v1/internal/history      → Write history          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────┬───────────────────────────────────┘
                            │ GCS SDK
                            │
┌───────────────────────────┴───────────────────────────────────┐
│                  Google Cloud Storage (GCS)                    │
│                    (GCS JSON Persistence)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  env/{dev|stg|prod}/                                            │
│    ├── history/{entity}/{id}/{ulid}.json                        │
│    ├── snapshots/{entity}/{id}.json                             │
│    ├── manifests/{entity}/                                      │
│    │   ├── by-id/{id}.json                                      │
│    │   └── _index_shard=XX.ndjson                              │
│    └── indices/                                                 │
│        ├── ventures/by-status/{status}/{id}.json               │
│        ├── ventures/by-lead/{lead}/{id}.json                   │
│        └── ventures/by-next-due/{yyyy-mm}/{id}.json            │
│                                                                   │
└───────────────────────────┬───────────────────────────────────┘
                            │ Pub/Sub notifications
                            │
┌───────────────────────────┴───────────────────────────────────┐
│                    Event-Driven Handlers                       │
│                    (Cloud Run services)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  - snapshot-builder    (history → snapshot)                    │
│  - manifest-writer     (snapshot → manifest)                   │
│  - manifest-compactor  (manifests → shards)                    │
│  - index-writer        (snapshot → index pointers)             │
│  - rules-engine        (snapshot → alerts)                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Read Path (List View)

```
User clicks "Ventures" in sidebar
  ↓
Router navigates to /ventures
  ↓
VenturesListPage component mounts
  ↓
useVentures() hook called
  ↓
TanStack Query checks cache
  ├─ Cache hit → Return cached data (instant)
  └─ Cache miss → Fetch from API
      ↓
      API client: GET /v1/venture?env=dev
      ↓
      API Edge handler: Read manifest shards from GCS
      ↓
      Response: { items: [...] }
      ↓
      TanStack Query caches result (5 min TTL)
      ↓
      Component re-renders with data
```

### Read Path (Detail View)

```
User clicks venture row
  ↓
Router navigates to /ventures/V001
  ↓
VentureDetailPage component mounts
  ↓
useVenture("V001") hook called
  ↓
TanStack Query checks cache
  ├─ Cache hit → Return cached snapshot
  └─ Cache miss → Fetch from API
      ↓
      API client: GET /v1/venture/V001?env=dev
      ↓
      API Edge handler: Read snapshot from GCS
      ↓
      Response: { id, entity, data: {...} }
      ↓
      Component displays snapshot fields
```

### Write Path (Create/Update)

```
User fills form and clicks "Save"
  ↓
VentureForm validates with Zod schema
  ↓
useMutation() hook called
  ↓
Optimistic update: UI shows "Saving..."
  ↓
API client: POST /v1/internal/history
  ↓
API Edge: Write history record to GCS with generation=0
  ↓
GCS triggers OBJECT_FINALIZE notification → Pub/Sub
  ↓
snapshot-builder handler: Rebuild snapshot
  ↓
snapshot updated → triggers manifest-writer & index-writer
  ↓
API responds: 202 Accepted
  ↓
TanStack Query invalidates related queries
  ↓
UI refetches list (shows new/updated item)
```

## Component Hierarchy

```
App
├── AuthProvider (auth context)
├── QueryClientProvider (TanStack Query)
└── Router
    ├── Layout (AppShell)
    │   ├── Header
    │   │   ├── Logo
    │   │   ├── EnvSwitch (dev/prod)
    │   │   ├── ThemeToggle
    │   │   └── UserMenu (logout, role badge)
    │   ├── Sidebar
    │   │   ├── NavSection (Main, Operations, Finance, etc.)
    │   │   └── NavLink (with active state)
    │   └── Footer
    └── Routes
        ├── / (SplashPage)
        ├── /login (LoginPage)
        ├── /ventures (VenturesListPage)
        │   └── /ventures/:id (VentureDetailPage)
        ├── /ideas (IdeasListPage)
        │   └── /ideas/:id (IdeaDetailPage)
        ├── /experiments (ExperimentsListPage)
        ├── /kpis (KPIsPage)
        ├── /resources (ResourcesListPage)
        ├── /budgets (BudgetsListPage)
        └── ... (other entity pages)
```

## State Management Strategy

### Server State (TanStack Query)

**Why:** Data that lives on the server (API responses)

**What:**
- Entity lists (ventures, ideas, experiments, etc.)
- Entity snapshots (venture details, idea details)
- Aggregates (portfolio summary, heatmap data)
- Time series (KPI charts)

**Benefits:**
- Automatic caching (avoid redundant fetches)
- Background refetching (keep data fresh)
- Optimistic updates (instant UI feedback)
- Automatic retry on errors
- Deduplicated requests

**Example:**
```typescript
// Custom hook
export function useVentures(filters?: VentureFilters) {
  return useQuery({
    queryKey: ['ventures', filters],
    queryFn: () => api.listVentures(filters),
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000,   // 10 min garbage collection
  });
}

// In component
function VenturesListPage() {
  const { data, isLoading, error } = useVentures({ env: 'dev' });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return <VenturesList ventures={data.items} />;
}
```

### Client State (Zustand)

**Why:** Data that lives only in the browser (UI state)

**What:**
- Auth state: `{ user, roles, token, isAuthenticated }`
- UI preferences: `{ theme, env, sidebarCollapsed }`
- Form state (transient)
- Modal/drawer state

**Benefits:**
- Simple API (no boilerplate)
- TypeScript-friendly
- Devtools integration
- Minimal bundle size (~1KB)

**Example:**
```typescript
// Auth store
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  roles: [],
  token: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const { user, token } = await signIn(email, password);
    const roles = extractRoles(token);
    set({ user, token, roles, isAuthenticated: true });
  },

  logout: () => {
    set({ user: null, token: null, roles: [], isAuthenticated: false });
  },
}));

// In component
function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header>
      <span>{user?.email}</span>
      <button onClick={logout}>Sign out</button>
    </header>
  );
}
```

## API Integration Pattern

### Generated Client (OpenAPI)

Run codegen to generate TypeScript types and client:

```bash
npx openapi-typescript api/openapi.yaml -o src/types/api.ts
```

Creates type-safe API client:

```typescript
// src/lib/api.ts
import { paths } from '@/types/api';
import createClient from 'openapi-fetch';

const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL
});

// Add auth interceptor
api.use({
  async onRequest({ request }) {
    const token = useAuthStore.getState().token;
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
  }
});

export default api;
```

Usage in hooks:

```typescript
// src/hooks/useVentures.ts
export function useVentures() {
  return useQuery({
    queryKey: ['ventures'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/{entity}', {
        params: { path: { entity: 'venture' } }
      });
      if (error) throw new Error(error.message);
      return data;
    }
  });
}
```

## Authentication Flow

```
1. User visits app → Check for token in localStorage
   ├─ Token exists → Validate with Firebase Auth
   │  ├─ Valid → Extract roles, set auth state
   │  └─ Invalid → Clear token, redirect to /login
   └─ No token → Redirect to /login

2. User submits login form
   ↓
   Call Firebase Auth: signInWithEmailAndPassword()
   ↓
   Receive JWT with role claims (e.g., { roles: ["Admin"] })
   ↓
   Store token in authStore + localStorage
   ↓
   Redirect to /ventures

3. User makes API request
   ↓
   API client intercepts request
   ↓
   Add header: Authorization: Bearer <token>
   ↓
   API Edge validates JWT
   ↓
   Extract roles, enforce RBAC
   ↓
   Return data or 403 Forbidden
```

## RBAC Enforcement

### Role Matrix (from FRD)

| Role        | Ventures | Ideas | Experiments | KPIs | Resources | Budgets | Cap Tables | Investors | Exports |
|-------------|----------|-------|-------------|------|-----------|---------|------------|-----------|---------|
| Admin       | RW       | RW    | RW          | RW   | RW        | RW      | RW         | RW        | RW      |
| Leadership  | RW       | RW    | RW          | R    | R         | R       | R          | R         | RW      |
| Lead        | RW (own) | RW    | RW (own)    | R    | R         | R (own) | R (own)    | -         | R       |
| Contributor | RW (own) | R     | RW (own)    | R    | -         | -       | -          | -         | -       |
| Investor    | R        | -     | -           | R    | -         | -       | R          | R         | R       |
| Advisor     | R (scope)| R     | R (scope)   | R    | -         | -       | -          | -         | -       |

### Implementation

**Backend (API Edge):**
- Validate JWT
- Extract role claims
- Check permission for route + method
- Return 403 if unauthorized

**Frontend:**
- Hide UI elements based on role
- Disable buttons/links
- Show "access denied" message if user navigates directly

**Example:**
```typescript
// src/hooks/useAuth.ts
export function useAuth() {
  const { roles } = useAuthStore();

  const hasRole = (role: Role) => roles.includes(role);

  const canEdit = (entity: string, ownerId?: string) => {
    if (hasRole('Admin')) return true;
    if (hasRole('Leadership')) return true;
    if (hasRole('Lead') && ownerId === user?.id) return true;
    return false;
  };

  return { hasRole, canEdit };
}

// In component
function VentureDetailPage({ ventureId }) {
  const { data: venture } = useVenture(ventureId);
  const { canEdit } = useAuth();

  return (
    <div>
      <h1>{venture.data.title}</h1>
      {canEdit('venture', venture.data.lead) && (
        <button>Edit</button>
      )}
    </div>
  );
}
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy load routes
const VenturesListPage = lazy(() => import('./routes/ventures'));
const IdeaDetailPage = lazy(() => import('./routes/ideas/[id]'));

// Router with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/ventures" element={<VenturesListPage />} />
    <Route path="/ideas/:id" element={<IdeaDetailPage />} />
  </Routes>
</Suspense>
```

### Data Caching

- TanStack Query caches server responses (5 min default)
- Background refetching keeps data fresh
- Prefetch on hover (link hover → prefetch detail page)

### Bundle Optimization

- Tree-shaking (Vite does this automatically)
- Lazy load charts library (only load on KPIs page)
- Use dynamic imports for heavy components

### Image Optimization

- Use WebP format
- Lazy load images below the fold
- Serve different sizes for mobile/desktop

## Error Handling Strategy

### API Errors

```typescript
// Global error handler in TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      onError: (error) => {
        toast.error(`Failed to fetch data: ${error.message}`);
      },
    },
  },
});
```

### React Error Boundaries

```typescript
// Catch rendering errors
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <App />
</ErrorBoundary>
```

### Validation Errors

```typescript
// Zod schema validation in forms
const ventureSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  lead: z.string().email('Invalid email'),
  status: z.enum(['Idea', 'Validation', 'Build', 'Pilot', 'Scale']),
});

// React Hook Form integration
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(ventureSchema),
});
```

## Testing Strategy

### Unit Tests (Vitest)

- Test custom hooks (useAuth, useVentures)
- Test utility functions (formatDate, calculateBurn)
- Test Zod schemas

### Integration Tests

- Test API client with MSW (Mock Service Worker)
- Test TanStack Query hooks with mock responses

### E2E Tests (Playwright)

- Login flow
- Create venture
- List ventures with filters
- View venture detail
- Update KPIs

## Next Steps

See `REDESIGN_PLAN.md` for implementation timeline.
