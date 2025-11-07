# API Quick Reference - CityReach Innovation Labs UI

Cheat sheet for common API patterns in the CityReach Innovation Labs UI.

---

## Setup

### 1. Generate TypeScript Client

```bash
npx openapi-typescript ../api/openapi.yaml -o src/types/api.ts
```

### 2. Create API Client

```typescript
// src/lib/api.ts
import createClient from 'openapi-fetch';
import type { paths } from '@/types/api';

export const apiClient = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8085',
});

// Auth interceptor
apiClient.use({
  async onRequest({ request }) {
    const token = useAuthStore.getState().token;
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
});
```

---

## Common Patterns

### List Entities

```typescript
// hooks/useVentures.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';

export function useVentures() {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: ['ventures', env],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/v1/{entity}', {
        params: { path: { entity: 'venture' }, query: { env } },
      });

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');
      return data;
    },
  });
}

// Component usage
function VenturesList() {
  const { data, isLoading, error } = useVentures();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <ul>
      {data.items.map((v) => (
        <li key={v.id}>{v.title}</li>
      ))}
    </ul>
  );
}
```

---

### Get Single Entity

```typescript
// hooks/useVenture.ts
export function useVenture(id: string) {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: ['venture', id, env],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/v1/{entity}/{id}', {
        params: { path: { entity: 'venture', id }, query: { env } },
      });

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');
      return data;
    },
    enabled: !!id,
  });
}

// Component usage
function VentureDetail({ id }: { id: string }) {
  const { data: venture } = useVenture(id);
  return <h1>{venture?.title}</h1>;
}
```

---

### Create/Update Entity (Mutation)

```typescript
// hooks/useSaveVenture.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useSaveVenture() {
  const queryClient = useQueryClient();
  const env = useAuthStore((state) => state.env);

  return useMutation({
    mutationFn: async (venture: any) => {
      const { data, error } = await apiClient.POST('/v1/internal/history', {
        body: {
          entity: 'venture',
          id: venture.id,
          env,
          schema_version: '1.0.0',
          updated_at: new Date().toISOString(),
          ...venture,
        },
      });

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');
      return data;
    },

    onSuccess: (_, variables) => {
      toast.success('Saved successfully');

      // Invalidate after pipeline completes (~1.5s)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['ventures'] });
        queryClient.invalidateQueries({ queryKey: ['venture', variables.id] });
      }, 1500);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Component usage
function VentureForm({ venture }: { venture?: any }) {
  const saveMutation = useSaveVenture();

  const handleSubmit = (data: any) => {
    saveMutation.mutate({ id: venture?.id || ulid(), ...data });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Button disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
```

---

### Optimistic Update

```typescript
// hooks/useUpdateVenture.ts
export function useUpdateVenture(id: string) {
  const queryClient = useQueryClient();
  const env = useAuthStore((state) => state.env);

  return useMutation({
    mutationFn: async (updates: any) => {
      const current = queryClient.getQueryData(['venture', id, env]) as any;

      const { data, error } = await apiClient.POST('/v1/internal/history', {
        body: { ...current, ...updates, updated_at: new Date().toISOString() },
      });

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');
      return data;
    },

    // Optimistic update
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['venture', id, env] });

      const previous = queryClient.getQueryData(['venture', id, env]);

      queryClient.setQueryData(['venture', id, env], (old: any) => ({
        ...old,
        ...updates,
      }));

      return { previous };
    },

    // Rollback on error
    onError: (error, updates, context) => {
      queryClient.setQueryData(['venture', id, env], context?.previous);
      toast.error(getErrorMessage(error));
    },

    // Always refetch after settled
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['venture', id, env] });
    },
  });
}
```

---

### Index Query (Fast Lookup)

```typescript
// hooks/useVenturesByStatus.ts
export function useVenturesByStatus(status: string) {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: ['ventures', 'by-status', status, env],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/v1/index/ventures/by-status/{status}',
        {
          params: { path: { status }, query: { env } },
        }
      );

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');
      return data;
    },
    enabled: !!status,
  });
}
```

---

### Aggregate Endpoint

```typescript
// hooks/usePortfolioSummary.ts
export function usePortfolioSummary() {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: ['portfolio', 'summary', env],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/v1/portfolio/summary', {
        params: { query: { env } },
      });

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 min
  });
}
```

---

### Prefetch on Hover

```typescript
// components/VentureCard.tsx
function VentureCard({ venture }: { venture: any }) {
  const queryClient = useQueryClient();
  const env = useAuthStore((state) => state.env);

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['venture', venture.id, env],
      queryFn: () => fetchVenture(venture.id, env),
    });
  };

  return (
    <Link to={`/ventures/${venture.id}`} onMouseEnter={handleMouseEnter}>
      {venture.title}
    </Link>
  );
}
```

---

### Manual Refresh

```typescript
// components/RefreshButton.tsx
function RefreshButton({ queryKey }: { queryKey: any[] }) {
  const queryClient = useQueryClient();

  return (
    <Button onClick={() => queryClient.invalidateQueries({ queryKey })}>
      <RefreshCw className="h-4 w-4" />
    </Button>
  );
}

// Usage
<RefreshButton queryKey={['ventures']} />
```

---

## Query Keys Convention

```typescript
// lib/queryKeys.ts
export const queryKeys = {
  ventures: (env: string, filters?: any) => ['ventures', env, filters].filter(Boolean),
  venture: (id: string, env: string) => ['venture', id, env],
  venturesByStatus: (status: string, env: string) => ['ventures', 'by-status', status, env],

  ideas: (env: string) => ['ideas', env],
  idea: (id: string, env: string) => ['idea', id, env],

  portfolioSummary: (env: string) => ['portfolio', 'summary', env],
  kpiSeries: (metric: string, env: string) => ['kpi', 'series', metric, env],
};
```

---

## Error Handling

```typescript
// lib/errorHandler.ts
export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    public reason?: string
  ) {
    super(`API Error [${status}]: ${code}`);
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.reason || error.code || 'API request failed';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Usage in component
if (error) return <ErrorState error={error} />;
```

---

## Loading States

```typescript
function VenturesPage() {
  const { data, isLoading, isError, error } = useVentures();

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState error={error} />;
  if (!data?.items?.length) return <EmptyState />;

  return <VenturesList ventures={data.items} />;
}
```

---

## Auth Store

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      roles: [],
      env: 'dev',

      setAuth: (user, token, roles) => {
        set({ user, token, roles, isAuthenticated: true });
      },

      clearAuth: () => {
        set({ user: null, token: null, roles: [], isAuthenticated: false });
      },

      setEnv: (env) => set({ env }),
    }),
    { name: 'ecco-auth' }
  )
);

// Usage
const token = useAuthStore((state) => state.token);
const env = useAuthStore((state) => state.env);
```

---

## TanStack Query Config

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (!isRetryableError(error)) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 10 * 60 * 1000, // 10 min
    },
  },
});
```

---

## Testing with MSW

```typescript
// tests/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('http://localhost:8085/v1/venture', (req, res, ctx) => {
    return res(
      ctx.json({
        items: [
          { id: 'V001', title: 'Test Venture', status: 'Build' },
        ],
      })
    );
  }),

  rest.post('http://localhost:8085/v1/internal/history', (req, res, ctx) => {
    return res(ctx.json({ accepted: true }));
  }),
];

// tests/setup.ts
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## Environment Variables

```bash
# .env.local
VITE_API_URL=http://localhost:8085
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
```

---

## Useful Commands

```bash
# Generate API types
npm run generate:api

# Run dev server
npm run dev

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Phase 1 Endpoints Summary

| Endpoint                                 | Method | Purpose                    |
|------------------------------------------|--------|----------------------------|
| `/v1/venture`                            | GET    | List all ventures          |
| `/v1/venture/{id}`                       | GET    | Get venture snapshot       |
| `/v1/idea`                               | GET    | List all ideas             |
| `/v1/idea/{id}`                          | GET    | Get idea snapshot          |
| `/v1/index/ventures/by-status/{status}`  | GET    | Ventures by status         |
| `/v1/index/ventures/by-lead/{lead}`      | GET    | Ventures by lead           |
| `/v1/portfolio/summary`                  | GET    | Portfolio aggregates       |
| `/v1/kpis/{metric}/series`               | GET    | KPI time series            |
| `/v1/ops/utilisation`                    | GET    | Resource utilisation       |
| `/v1/internal/history`                   | POST   | Create/update any entity   |

---

**Pro Tips:**

1. Always use query keys from `queryKeys.ts` for consistency
2. Invalidate queries after mutations (with 1.5s delay for pipeline)
3. Use optimistic updates for instant UI feedback
4. Prefetch on hover for faster navigation
5. Handle loading/error states in every component
6. Use `enabled: !!id` to prevent queries with missing params
7. Set appropriate `staleTime` based on data volatility
8. Use `useInfiniteQuery` for pagination (when implemented)

---

**See Also:**

- Full guide: `API_INTEGRATION.md`
- Architecture: `ARCHITECTURE.md`
- Getting started: `GETTING_STARTED.md`
