# CityReach Innovation Labs UI - API Integration Guide

Version: 1.0
Date: 2025-11-06
Status: Active

---

## Table of Contents

1. [Overview](#overview)
2. [API Architecture](#api-architecture)
3. [Client Generation](#client-generation)
4. [Authentication](#authentication)
5. [Error Handling](#error-handling)
6. [Retry Logic & Resilience](#retry-logic--resilience)
7. [Type-Safe API Calls](#type-safe-api-calls)
8. [TanStack Query Integration](#tanstack-query-integration)
9. [Optimistic Updates](#optimistic-updates)
10. [Cache Invalidation](#cache-invalidation)
11. [Phase 1 API Endpoints](#phase-1-api-endpoints)
12. [Performance Considerations](#performance-considerations)
13. [Testing Strategies](#testing-strategies)
14. [Gap Analysis](#gap-analysis)

---

## Overview

The CityReach Innovation Labs UI integrates with a GCS-backed API edge service (`/services/api-edge`) that provides:

- **Read operations** via manifests and snapshots (GCS JSON Persistence Spec v1.2)
- **Write operations** via history records that trigger event-driven pipelines
- **JWT authentication** with role-based access control (RBAC)
- **Index queries** for fast lookups (by status, lead, date, etc.)
- **Aggregate endpoints** for portfolio summaries and KPIs

**Key Design Principles:**

- Type safety via OpenAPI-generated TypeScript client
- Separation of server state (TanStack Query) and client state (Zustand)
- Optimistic updates for instant UI feedback
- Automatic retry with exponential backoff
- Cache invalidation strategies aligned with event-driven architecture

---

## API Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React UI (Browser)                        │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              TanStack Query Cache                      │ │
│  │  - Ventures: 5 min TTL                                 │ │
│  │  - Venture Detail: 10 min TTL                          │ │
│  │  - Portfolio Summary: 2 min TTL                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         API Client (openapi-fetch)                     │ │
│  │  - Auth Interceptor (JWT Bearer)                       │ │
│  │  - Error Interceptor (retry logic)                     │ │
│  │  - Type-safe request/response                          │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────┬──────────────────────────────────────────┘
                     │ HTTPS + JWT
                     │
┌────────────────────┴──────────────────────────────────────────┐
│              API Edge (Cloud Run)                             │
│              services/api-edge/src/index.ts                   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Auth Middleware                                       │ │
│  │  - Verify JWT (Identity Platform)                      │ │
│  │  - Extract roles from claims                           │ │
│  │  - RBAC enforcement per route                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Route Handlers                                        │ │
│  │  - GET /v1/{entity}         → List via manifests       │ │
│  │  - GET /v1/{entity}/{id}    → Snapshot by id           │ │
│  │  - GET /v1/index/...        → Index queries            │ │
│  │  - POST /v1/internal/history → Write (202 Accepted)    │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────┬──────────────────────────────────────────┘
                     │ GCS SDK
                     │
┌────────────────────┴──────────────────────────────────────────┐
│         Google Cloud Storage (GCS)                            │
│         env/{dev|stg|prod}/...                                │
└───────────────────────────────────────────────────────────────┘
```

---

## Client Generation

### Install Dependencies

```bash
npm install --save-dev openapi-typescript openapi-fetch
```

### Generate TypeScript Types

From the project root:

```bash
npx openapi-typescript api/openapi.yaml -o ui/src/types/api.ts
```

This generates:

- **Type definitions** for all request/response schemas
- **Path definitions** with typed parameters
- **Type-safe client** compatible with `openapi-fetch`

**Add to package.json:**

```json
{
  "scripts": {
    "generate:api": "openapi-typescript ../api/openapi.yaml -o src/types/api.ts",
    "dev": "npm run generate:api && vite",
    "build": "npm run generate:api && vite build"
  }
}
```

### Generated Types Example

```typescript
// ui/src/types/api.ts (auto-generated)
export interface paths {
  '/v1/{entity}': {
    get: {
      parameters: {
        path: { entity: 'idea' | 'venture' | 'round' | ... };
        query?: { env?: 'dev' | 'stg' | 'prod' };
      };
      responses: {
        200: { content: { 'application/json': { items: any[] } } };
        403: { content: { 'application/json': { error: string } } };
      };
    };
  };
  '/v1/{entity}/{id}': {
    get: {
      parameters: {
        path: { entity: string; id: string };
        query?: { env?: 'dev' | 'stg' | 'prod' };
      };
      responses: {
        200: { content: { 'application/json': any } };
        404: { content: { 'application/json': { error: string } } };
      };
    };
  };
  // ... all other endpoints
}
```

---

## Authentication

### JWT Bearer Token Flow

1. User signs in via Firebase Auth SDK
2. Receive ID token (JWT) with role claims
3. Store token in auth store (Zustand) + localStorage
4. Attach token to all API requests via interceptor
5. API Edge validates JWT and extracts roles
6. RBAC enforcement per route + method

### Auth Store (Zustand)

```typescript
// ui/src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from '@/types/entities';

export interface AuthState {
  user: { email: string; uid: string } | null;
  token: string | null;
  roles: Role[];
  isAuthenticated: boolean;
  env: 'dev' | 'stg' | 'prod';

  setAuth: (user: AuthState['user'], token: string, roles: Role[]) => void;
  clearAuth: () => void;
  setEnv: (env: AuthState['env']) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      roles: [],
      isAuthenticated: false,
      env: 'dev',

      setAuth: (user, token, roles) => {
        set({ user, token, roles, isAuthenticated: true });
      },

      clearAuth: () => {
        set({ user: null, token: null, roles: [], isAuthenticated: false });
      },

      setEnv: (env) => set({ env }),
    }),
    {
      name: 'ecco-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        roles: state.roles,
        env: state.env
      }),
    }
  )
);
```

### API Client with Auth Interceptor

```typescript
// ui/src/lib/api.ts
import createClient from 'openapi-fetch';
import type { paths } from '@/types/api';
import { useAuthStore } from '@/stores/authStore';

// Base client
export const apiClient = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8085',
});

// Auth interceptor
apiClient.use({
  async onRequest({ request }) {
    const { token } = useAuthStore.getState();

    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }

    return request;
  },
});

// Error interceptor for 401 (redirect to login)
apiClient.use({
  async onResponse({ response }) {
    if (response.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }

    return response;
  },
});

export default apiClient;
```

### Demo Mode (Development)

For local development without Firebase Auth:

```typescript
// ui/src/lib/api.ts (demo mode)
apiClient.use({
  async onRequest({ request }) {
    const { token, roles } = useAuthStore.getState();

    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    } else if (import.meta.env.DEV) {
      // Demo mode: use x-roles header
      request.headers.set('x-roles', roles.join(',') || 'Admin');
    }

    return request;
  },
});
```

---

## Error Handling

### Error Types

```typescript
// ui/src/types/errors.ts
export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    public reason?: string,
    public details?: any
  ) {
    super(`API Error [${status}]: ${code}${reason ? ` - ${reason}` : ''}`);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    public field: string,
    public message: string
  ) {
    super(`Validation Error: ${field} - ${message}`);
    this.name = 'ValidationError';
  }
}
```

### Error Handler Utility

```typescript
// ui/src/lib/errorHandler.ts
import { APIError, NetworkError } from '@/types/errors';

export async function handleAPIResponse<T>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    let errorData: any = {};

    try {
      errorData = await response.json();
    } catch {
      errorData = { error: 'unknown', reason: response.statusText };
    }

    throw new APIError(
      response.status,
      errorData.error || 'unknown',
      errorData.reason,
      errorData.details
    );
  }

  return response.json();
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof APIError) {
    // Retry on 5xx server errors and 429 rate limit
    return error.status >= 500 || error.status === 429;
  }

  if (error instanceof NetworkError) {
    return true; // Retry network failures
  }

  return false;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.reason || error.code || 'API request failed';
  }

  if (error instanceof NetworkError) {
    return 'Network connection failed';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}
```

### User-Friendly Error Display

```typescript
// ui/src/components/ErrorState.tsx
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/errorHandler';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const message = getErrorMessage(error);

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="mt-2">
        {message}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

---

## Retry Logic & Resilience

### TanStack Query Retry Configuration

```typescript
// ui/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { isRetryableError } from '@/lib/errorHandler';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx client errors (except 429)
        if (!isRetryableError(error)) {
          return false;
        }

        // Retry up to 3 times for retryable errors
        return failureCount < 3;
      },

      // Exponential backoff: 1s, 2s, 4s
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Stale time: how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Garbage collection time: how long to keep unused data in cache
      gcTime: 10 * 60 * 1000, // 10 minutes

      // Refetch on window focus (disabled for stable data)
      refetchOnWindowFocus: false,

      // Refetch on reconnect (useful for network failures)
      refetchOnReconnect: true,
    },

    mutations: {
      // No retries for mutations by default (can override per-mutation)
      retry: false,
    },
  },
});
```

### Custom Retry Hook

```typescript
// ui/src/hooks/useRetryableQuery.ts
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useRetryableQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError>
) {
  return useQuery({
    ...options,

    retry: (failureCount, error) => {
      const retryable = isRetryableError(error);

      if (!retryable) {
        toast.error(getErrorMessage(error));
        return false;
      }

      if (failureCount < 3) {
        toast.info(`Retrying request... (${failureCount + 1}/3)`);
        return true;
      }

      toast.error('Request failed after 3 attempts');
      return false;
    },
  });
}
```

### Circuit Breaker Pattern (Optional)

For advanced resilience, implement a circuit breaker:

```typescript
// ui/src/lib/circuitBreaker.ts
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold = 5,
    private timeout = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

export const apiCircuitBreaker = new CircuitBreaker();
```

---

## Type-Safe API Calls

### Basic GET Request

```typescript
// ui/src/hooks/useVentures.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export function useVentures() {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: ['ventures', env],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/v1/{entity}', {
        params: {
          path: { entity: 'venture' },
          query: { env },
        },
      });

      if (error) {
        throw new APIError(
          error.status || 500,
          error.error || 'unknown'
        );
      }

      return data;
    },
  });
}
```

### GET with Path Parameters

```typescript
// ui/src/hooks/useVenture.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export function useVenture(id: string) {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: ['venture', id, env],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/v1/{entity}/{id}', {
        params: {
          path: { entity: 'venture', id },
          query: { env },
        },
      });

      if (error) {
        throw new APIError(
          error.status || 500,
          error.error || 'unknown'
        );
      }

      return data;
    },
    enabled: !!id, // Only run query if id is provided
  });
}
```

### POST Request (Write History)

```typescript
// ui/src/hooks/useSaveVenture.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

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
          ...venture,
        },
      });

      if (error) {
        throw new APIError(
          error.status || 500,
          error.error || 'unknown'
        );
      }

      return data;
    },

    onSuccess: (data, variables) => {
      toast.success('Venture saved successfully');

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['ventures'] });
      queryClient.invalidateQueries({ queryKey: ['venture', variables.id] });
    },

    onError: (error) => {
      toast.error(`Failed to save venture: ${getErrorMessage(error)}`);
    },
  });
}
```

---

## TanStack Query Integration

### Query Keys Strategy

Organize query keys by entity and filter parameters:

```typescript
// ui/src/lib/queryKeys.ts
export const queryKeys = {
  // Ventures
  ventures: (env: string, filters?: any) =>
    ['ventures', env, filters].filter(Boolean),
  venture: (id: string, env: string) =>
    ['venture', id, env],
  venturesByStatus: (status: string, env: string) =>
    ['ventures', 'by-status', status, env],
  venturesByLead: (lead: string, env: string) =>
    ['ventures', 'by-lead', lead, env],

  // Ideas
  ideas: (env: string, filters?: any) =>
    ['ideas', env, filters].filter(Boolean),
  idea: (id: string, env: string) =>
    ['idea', id, env],

  // Portfolio
  portfolioSummary: (env: string) =>
    ['portfolio', 'summary', env],
  portfolioHeatmap: (env: string) =>
    ['portfolio', 'heatmap', env],

  // KPIs
  kpiSeries: (metric: string, env: string) =>
    ['kpi', 'series', metric, env],

  // Resources
  resources: (env: string) =>
    ['resources', env],
  utilisation: (env: string) =>
    ['utilisation', env],
};
```

### Custom Hook Examples

**Ventures List:**

```typescript
// ui/src/hooks/useVentures.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/lib/queryKeys';

export function useVentures(filters?: { status?: string; lead?: string }) {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: queryKeys.ventures(env, filters),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/v1/{entity}', {
        params: {
          path: { entity: 'venture' },
          query: { env },
        },
      });

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');

      // Client-side filtering if needed
      let items = data.items || [];

      if (filters?.status) {
        items = items.filter((v: any) => v.status === filters.status);
      }

      if (filters?.lead) {
        items = items.filter((v: any) => v.lead === filters.lead);
      }

      return { items };
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
```

**Portfolio Summary:**

```typescript
// ui/src/hooks/usePortfolioSummary.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/lib/queryKeys';

export function usePortfolioSummary() {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: queryKeys.portfolioSummary(env),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/v1/portfolio/summary', {
        params: { query: { env } },
      });

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');

      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 min (aggregates change less frequently)
  });
}
```

**KPI Time Series:**

```typescript
// ui/src/hooks/useKPISeries.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/lib/queryKeys';

export function useKPISeries(metric: string) {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: queryKeys.kpiSeries(metric, env),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/v1/kpis/{metric}/series', {
        params: {
          path: { metric },
          query: { env },
        },
      });

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');

      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 min (historical data changes slowly)
  });
}
```

---

## Optimistic Updates

Provide instant UI feedback before server confirmation.

### Pattern 1: Optimistic Add (Create)

```typescript
// ui/src/hooks/useCreateVenture.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export function useCreateVenture() {
  const queryClient = useQueryClient();
  const env = useAuthStore((state) => state.env);

  return useMutation({
    mutationFn: async (newVenture: any) => {
      const { data, error } = await apiClient.POST('/v1/internal/history', {
        body: {
          entity: 'venture',
          id: newVenture.id,
          env,
          schema_version: '1.0.0',
          ...newVenture,
        },
      });

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');

      return data;
    },

    // Optimistic update
    onMutate: async (newVenture) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.ventures(env) });

      // Snapshot previous value
      const previousVentures = queryClient.getQueryData(queryKeys.ventures(env));

      // Optimistically update cache
      queryClient.setQueryData(queryKeys.ventures(env), (old: any) => ({
        items: [...(old?.items || []), newVenture],
      }));

      // Return context for rollback
      return { previousVentures };
    },

    // Rollback on error
    onError: (error, newVenture, context) => {
      queryClient.setQueryData(
        queryKeys.ventures(env),
        context?.previousVentures
      );
      toast.error(`Failed to create venture: ${getErrorMessage(error)}`);
    },

    // Always refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ventures(env) });
    },

    onSuccess: () => {
      toast.success('Venture created successfully');
    },
  });
}
```

### Pattern 2: Optimistic Update (Edit)

```typescript
// ui/src/hooks/useUpdateVenture.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export function useUpdateVenture(id: string) {
  const queryClient = useQueryClient();
  const env = useAuthStore((state) => state.env);

  return useMutation({
    mutationFn: async (updates: any) => {
      // Fetch current snapshot first
      const current = queryClient.getQueryData(queryKeys.venture(id, env)) as any;

      const { data, error } = await apiClient.POST('/v1/internal/history', {
        body: {
          ...current,
          ...updates,
          entity: 'venture',
          id,
          env,
          updated_at: new Date().toISOString(),
        },
      });

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');

      return data;
    },

    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.venture(id, env) });

      // Snapshot previous value
      const previousVenture = queryClient.getQueryData(queryKeys.venture(id, env));

      // Optimistically update detail cache
      queryClient.setQueryData(queryKeys.venture(id, env), (old: any) => ({
        ...old,
        ...updates,
      }));

      // Also update in list cache
      queryClient.setQueryData(queryKeys.ventures(env), (old: any) => ({
        items: (old?.items || []).map((v: any) =>
          v.id === id ? { ...v, ...updates } : v
        ),
      }));

      return { previousVenture };
    },

    onError: (error, updates, context) => {
      queryClient.setQueryData(
        queryKeys.venture(id, env),
        context?.previousVenture
      );
      toast.error(`Failed to update venture: ${getErrorMessage(error)}`);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.venture(id, env) });
      queryClient.invalidateQueries({ queryKey: queryKeys.ventures(env) });
    },

    onSuccess: () => {
      toast.success('Venture updated successfully');
    },
  });
}
```

---

## Cache Invalidation

### Strategy 1: Invalidate on Mutation Success

```typescript
// After successful write, invalidate related queries
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['ventures'] });
  queryClient.invalidateQueries({ queryKey: ['portfolio'] });
}
```

### Strategy 2: Invalidate on Window Focus

Useful for collaborative scenarios where data may change:

```typescript
// ui/src/lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Enable for collaborative data
      staleTime: 1 * 60 * 1000, // 1 min (shorter for real-time data)
    },
  },
});
```

### Strategy 3: Manual Invalidation

```typescript
// ui/src/components/RefreshButton.tsx
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function RefreshButton({ queryKey }: { queryKey: any[] }) {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleRefresh}>
      <RefreshCw className="h-4 w-4" />
    </Button>
  );
}
```

### Strategy 4: Time-Based Invalidation

Set different stale times based on data volatility:

```typescript
// Fast-changing data (ventures list with active updates)
staleTime: 2 * 60 * 1000, // 2 min

// Moderate-changing data (venture detail)
staleTime: 5 * 60 * 1000, // 5 min

// Slow-changing data (KPI historical series)
staleTime: 10 * 60 * 1000, // 10 min

// Static data (schemas, config)
staleTime: Infinity, // Never refetch automatically
```

### Strategy 5: Event-Driven Invalidation

If using WebSockets or Server-Sent Events:

```typescript
// ui/src/lib/eventSubscriptions.ts
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useRealtimeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to Pub/Sub notifications (via WebSocket proxy)
    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('snapshot-updated', (event) => {
      const { entity, id } = JSON.parse(event.data);

      // Invalidate specific entity
      queryClient.invalidateQueries({
        queryKey: [entity, id]
      });

      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: [entity + 's']
      });
    });

    return () => eventSource.close();
  }, [queryClient]);
}
```

---

## Phase 1 API Endpoints

### Core Entity Endpoints

#### 1. List Ventures

**Endpoint:** `GET /v1/venture?env={env}`

**Purpose:** Fetch all ventures from manifests (compacted ndjson shards)

**Request:**
```typescript
const { data, error } = await apiClient.GET('/v1/{entity}', {
  params: {
    path: { entity: 'venture' },
    query: { env: 'dev' },
  },
});
```

**Response:**
```json
{
  "items": [
    {
      "id": "V001",
      "entity": "venture",
      "schema_version": "1.0.0",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-20T14:30:00Z",
      "title": "AI-Powered Analytics",
      "status": "Build",
      "lead": "jane@ecco.studio",
      "mrr": 12500,
      "next_milestone": "Beta Launch",
      "next_due": "2025-02-01"
    }
  ]
}
```

**Error Scenarios:**
- `403 Forbidden` - User lacks `venture:GET` permission for env
- `500 Internal` - GCS read failure

**Expected Response Time:** p50 < 500ms (assumes warmed Cloud Run)

**React Hook:**
```typescript
// ui/src/hooks/useVentures.ts
export function useVentures() {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: queryKeys.ventures(env),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/v1/{entity}', {
        params: { path: { entity: 'venture' }, query: { env } },
      });

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');

      return data;
    },
  });
}

// Usage in component
function VenturesPage() {
  const { data, isLoading, error } = useVentures();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return <VenturesList ventures={data.items} />;
}
```

---

#### 2. Get Venture by ID

**Endpoint:** `GET /v1/venture/{id}?env={env}`

**Purpose:** Fetch single venture snapshot from GCS

**Request:**
```typescript
const { data, error } = await apiClient.GET('/v1/{entity}/{id}', {
  params: {
    path: { entity: 'venture', id: 'V001' },
    query: { env: 'dev' },
  },
});
```

**Response:**
```json
{
  "id": "V001",
  "entity": "venture",
  "env": "dev",
  "schema_version": "1.0.0",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-20T14:30:00Z",
  "title": "AI-Powered Analytics",
  "description": "Enterprise analytics platform",
  "status": "Build",
  "stage": "MVP",
  "lead": "jane@ecco.studio",
  "co_founders": ["john@ecco.studio"],
  "mrr": 12500,
  "users": 45,
  "burn_rate": 25000,
  "runway_months": 18,
  "next_milestone": "Beta Launch",
  "next_due": "2025-02-01",
  "links": {
    "github": "https://github.com/ecco/ai-analytics",
    "notion": "https://notion.so/ecco/ai-analytics"
  }
}
```

**Error Scenarios:**
- `404 Not Found` - Venture ID does not exist
- `403 Forbidden` - User lacks permission
- `500 Internal` - GCS read failure

**Expected Response Time:** p50 < 300ms

**React Hook:**
```typescript
// ui/src/hooks/useVenture.ts
export function useVenture(id: string) {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: queryKeys.venture(id, env),
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

// Usage in component
function VentureDetailPage({ ventureId }: { ventureId: string }) {
  const { data: venture, isLoading, error } = useVenture(ventureId);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      <h1>{venture.title}</h1>
      <p>{venture.description}</p>
      <Badge>{venture.status}</Badge>
      <MetricsGrid mrr={venture.mrr} users={venture.users} />
    </div>
  );
}
```

---

#### 3. List Ideas

**Endpoint:** `GET /v1/idea?env={env}`

**Purpose:** Fetch all ideas for intake funnel

**Request:**
```typescript
const { data, error } = await apiClient.GET('/v1/{entity}', {
  params: {
    path: { entity: 'idea' },
    query: { env: 'dev' },
  },
});
```

**Response:**
```json
{
  "items": [
    {
      "id": "IDEA-001",
      "entity": "idea",
      "schema_version": "1.0.0",
      "created_at": "2025-01-10T08:00:00Z",
      "updated_at": "2025-01-15T12:00:00Z",
      "theme": "AI/ML",
      "title": "Predictive Maintenance SaaS",
      "problem": "Manufacturers lack predictive tools",
      "market_size": "500M TAM",
      "score": 78,
      "stage": "Screening",
      "owner": "alice@ecco.studio"
    }
  ]
}
```

**Error Scenarios:**
- `403 Forbidden` - User lacks `idea:GET` permission

**Expected Response Time:** p50 < 500ms

**React Hook:**
```typescript
// ui/src/hooks/useIdeas.ts
export function useIdeas(filters?: { stage?: string; theme?: string }) {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: queryKeys.ideas(env, filters),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/v1/{entity}', {
        params: { path: { entity: 'idea' }, query: { env } },
      });

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');

      // Client-side filtering
      let items = data.items || [];

      if (filters?.stage) {
        items = items.filter((idea: any) => idea.stage === filters.stage);
      }

      if (filters?.theme) {
        items = items.filter((idea: any) => idea.theme === filters.theme);
      }

      return { items };
    },
  });
}
```

---

### Index Query Endpoints

#### 4. Ventures by Status

**Endpoint:** `GET /v1/index/ventures/by-status/{status}?env={env}`

**Purpose:** Fast lookup of ventures by status (via index pointers)

**Request:**
```typescript
const { data, error } = await apiClient.GET('/v1/index/ventures/by-status/{status}', {
  params: {
    path: { status: 'Build' },
    query: { env: 'dev' },
  },
});
```

**Response:**
```json
{
  "items": [
    {
      "ptr": "env/dev/snapshots/ventures/V001.json",
      "id": "V001",
      "updated_at": "2025-01-20T14:30:00Z",
      "title": "AI-Powered Analytics",
      "lead": "jane@ecco.studio"
    }
  ]
}
```

**Expected Response Time:** p50 < 200ms (index pointers are lightweight)

**React Hook:**
```typescript
// ui/src/hooks/useVenturesByStatus.ts
export function useVenturesByStatus(status: string) {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: queryKeys.venturesByStatus(status, env),
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

#### 5. Ventures by Lead

**Endpoint:** `GET /v1/index/ventures/by-lead/{lead}?env={env}`

**Purpose:** Find all ventures led by a specific person

**Request:**
```typescript
const { data, error } = await apiClient.GET('/v1/index/ventures/by-lead/{lead}', {
  params: {
    path: { lead: 'jane@ecco.studio' },
    query: { env: 'dev' },
  },
});
```

**Response:** Same structure as ventures by status

**React Hook:**
```typescript
// ui/src/hooks/useVenturesByLead.ts
export function useVenturesByLead(lead: string) {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: queryKeys.venturesByLead(lead, env),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/v1/index/ventures/by-lead/{lead}',
        {
          params: { path: { lead: encodeURIComponent(lead) }, query: { env } },
        }
      );

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');

      return data;
    },
    enabled: !!lead,
  });
}
```

---

### Aggregate Endpoints

#### 6. Portfolio Summary

**Endpoint:** `GET /v1/portfolio/summary?env={env}`

**Purpose:** High-level portfolio metrics (total ventures, by status, etc.)

**Request:**
```typescript
const { data, error } = await apiClient.GET('/v1/portfolio/summary', {
  params: { query: { env: 'dev' } },
});
```

**Response:**
```json
{
  "total": 12,
  "byStatus": {
    "Idea": 3,
    "Validation": 2,
    "Build": 4,
    "Pilot": 2,
    "Scale": 1
  }
}
```

**Expected Response Time:** p50 < 1s (per AC-GEN)

**React Hook:**
```typescript
// ui/src/hooks/usePortfolioSummary.ts
export function usePortfolioSummary() {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: queryKeys.portfolioSummary(env),
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

// Usage in component
function PortfolioDashboard() {
  const { data, isLoading } = usePortfolioSummary();

  if (isLoading) return <Skeleton />;

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard label="Total Ventures" value={data.total} />
      <MetricCard label="In Build" value={data.byStatus.Build} />
      <MetricCard label="In Pilot" value={data.byStatus.Pilot} />
      <MetricCard label="At Scale" value={data.byStatus.Scale} />
    </div>
  );
}
```

---

#### 7. KPI Time Series

**Endpoint:** `GET /v1/kpis/{metric}/series?env={env}`

**Purpose:** Historical KPI data for charting

**Request:**
```typescript
const { data, error } = await apiClient.GET('/v1/kpis/{metric}/series', {
  params: {
    path: { metric: 'mrr' },
    query: { env: 'dev' },
  },
});
```

**Response:**
```json
{
  "metric": "mrr",
  "series": [
    { "t": "2024-01-01", "value": 10000 },
    { "t": "2024-02-01", "value": 12500 },
    { "t": "2024-03-01", "value": 15200 }
  ]
}
```

**Expected Response Time:** p50 < 500ms

**React Hook:**
```typescript
// ui/src/hooks/useKPISeries.ts
export function useKPISeries(metric: string) {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: queryKeys.kpiSeries(metric, env),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/v1/kpis/{metric}/series', {
        params: { path: { metric }, query: { env } },
      });

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');

      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

// Usage in component
import { LineChart, Line, XAxis, YAxis } from 'recharts';

function KPIChart({ metric }: { metric: string }) {
  const { data, isLoading } = useKPISeries(metric);

  if (isLoading) return <Skeleton />;

  return (
    <LineChart width={600} height={300} data={data.series}>
      <XAxis dataKey="t" />
      <YAxis />
      <Line type="monotone" dataKey="value" stroke="#8884d8" />
    </LineChart>
  );
}
```

---

#### 8. Resource Utilisation

**Endpoint:** `GET /v1/ops/utilisation?env={env}`

**Purpose:** Person-level utilisation across ventures

**Request:**
```typescript
const { data, error } = await apiClient.GET('/v1/ops/utilisation', {
  params: { query: { env: 'dev' } },
});
```

**Response:**
```json
{
  "items": [
    { "person": "A. Engineer", "venture": "V-101", "pct": 80 },
    { "person": "B. Designer", "venture": "V-102", "pct": 60 }
  ]
}
```

**Expected Response Time:** p50 < 500ms

**React Hook:**
```typescript
// ui/src/hooks/useUtilisation.ts
export function useUtilisation() {
  const env = useAuthStore((state) => state.env);

  return useQuery({
    queryKey: queryKeys.utilisation(env),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/v1/ops/utilisation', {
        params: { query: { env } },
      });

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');

      return data;
    },
  });
}
```

---

### Write Endpoint

#### 9. Write History Record

**Endpoint:** `POST /v1/internal/history`

**Purpose:** Create or update any entity via event-driven pipeline

**Request:**
```typescript
const { data, error } = await apiClient.POST('/v1/internal/history', {
  body: {
    entity: 'venture',
    id: 'V001',
    env: 'dev',
    schema_version: '1.0.0',
    title: 'Updated Venture Title',
    status: 'Build',
    updated_at: new Date().toISOString(),
    // ... other fields
  },
});
```

**Response:**
```json
{
  "accepted": true
}
```

**Status:** `202 Accepted` (async processing)

**Flow:**
1. API Edge writes history record to GCS with `generation=0` precondition
2. GCS triggers OBJECT_FINALIZE → Pub/Sub
3. `snapshot-builder` handler rebuilds snapshot
4. `manifest-writer` updates manifest
5. `index-writer` updates index pointers
6. Client refetches after ~1-2 seconds

**Error Scenarios:**
- `400 Bad Request` - Schema validation failed
- `403 Forbidden` - User lacks write permission
- `409 Conflict` - History record already exists (ULID collision)
- `500 Internal` - GCS write failure

**Expected Response Time:** p50 < 200ms (API response, not full pipeline)

**React Hook:**
```typescript
// ui/src/hooks/useSaveVenture.ts
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

    onSuccess: (data, variables) => {
      toast.success('Venture saved successfully');

      // Wait 1.5s for pipeline, then invalidate
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['ventures'] });
        queryClient.invalidateQueries({ queryKey: ['venture', variables.id] });
      }, 1500);
    },

    onError: (error) => {
      toast.error(`Failed to save: ${getErrorMessage(error)}`);
    },
  });
}

// Usage in component
function VentureForm({ venture }: { venture?: any }) {
  const saveVenture = useSaveVenture();
  const { register, handleSubmit } = useForm({
    defaultValues: venture,
  });

  const onSubmit = (data: any) => {
    saveVenture.mutate({
      id: venture?.id || ulid(),
      ...data,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('title')} />
      <Button type="submit" disabled={saveVenture.isPending}>
        {saveVenture.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
```

---

## Performance Considerations

### 1. Bundle Size Optimization

- Use dynamic imports for heavy libraries (charts, forms)
- Tree-shake unused components
- Lazy load routes

```typescript
// ui/src/routes/index.tsx
import { lazy } from 'react';

const VenturesPage = lazy(() => import('./ventures'));
const KPIsPage = lazy(() => import('./kpis'));
```

### 2. Request Deduplication

TanStack Query automatically deduplicates identical requests:

```typescript
// Both components trigger the same query key
function ComponentA() {
  const { data } = useVentures(); // First request
}

function ComponentB() {
  const { data } = useVentures(); // Reuses same request
}
```

### 3. Prefetching

Prefetch data on hover for instant navigation:

```typescript
// ui/src/components/VentureCard.tsx
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

function VentureCard({ venture }: { venture: any }) {
  const queryClient = useQueryClient();
  const env = useAuthStore((state) => state.env);

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.venture(venture.id, env),
      queryFn: () => fetchVenture(venture.id, env),
    });
  };

  return (
    <Link
      to={`/ventures/${venture.id}`}
      onMouseEnter={handleMouseEnter}
    >
      {venture.title}
    </Link>
  );
}
```

### 4. Pagination

For large lists, implement cursor-based pagination:

```typescript
// ui/src/hooks/useVenturesPaginated.ts
export function useVenturesPaginated(pageSize = 20) {
  const env = useAuthStore((state) => state.env);

  return useInfiniteQuery({
    queryKey: queryKeys.ventures(env, { paginated: true }),
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await apiClient.GET('/v1/{entity}', {
        params: {
          path: { entity: 'venture' },
          query: { env, offset: pageParam, limit: pageSize },
        },
      });

      if (error) throw new APIError(error.status || 500, error.error || 'unknown');

      return data;
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.items.length === pageSize ? pages.length * pageSize : undefined;
    },
  });
}
```

### 5. Selective Invalidation

Don't invalidate everything on every mutation:

```typescript
// BAD: Invalidates too much
queryClient.invalidateQueries();

// GOOD: Surgical invalidation
queryClient.invalidateQueries({ queryKey: ['venture', ventureId] });
queryClient.invalidateQueries({ queryKey: ['ventures'] });
```

---

## Testing Strategies

### Unit Tests (Vitest)

Test custom hooks with Mock Service Worker (MSW):

```typescript
// ui/tests/hooks/useVentures.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useVentures } from '@/hooks/useVentures';

const server = setupServer(
  rest.get('http://localhost:8085/v1/venture', (req, res, ctx) => {
    return res(
      ctx.json({
        items: [
          { id: 'V001', title: 'Test Venture', status: 'Build' },
        ],
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('useVentures fetches ventures', async () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(() => useVentures(), { wrapper });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data.items).toHaveLength(1);
  expect(result.current.data.items[0].title).toBe('Test Venture');
});
```

### Integration Tests

Test complete flows with MSW:

```typescript
// ui/tests/integration/venture-crud.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import VentureForm from '@/components/VentureForm';

const server = setupServer(
  rest.post('http://localhost:8085/v1/internal/history', (req, res, ctx) => {
    return res(ctx.json({ accepted: true }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('VentureForm submits successfully', async () => {
  render(<VentureForm />);

  fireEvent.change(screen.getByLabelText('Title'), {
    target: { value: 'New Venture' },
  });

  fireEvent.click(screen.getByText('Save'));

  await waitFor(() => {
    expect(screen.getByText('Venture saved successfully')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

Test critical user flows:

```typescript
// ui/tests/e2e/ventures.spec.ts
import { test, expect } from '@playwright/test';

test('user can view ventures list', async ({ page }) => {
  await page.goto('/ventures');

  await expect(page.getByRole('heading', { name: 'Ventures' })).toBeVisible();

  const ventureCards = page.getByTestId('venture-card');
  await expect(ventureCards).toHaveCount(12);
});

test('user can create a venture', async ({ page }) => {
  await page.goto('/ventures/new');

  await page.fill('input[name="title"]', 'E2E Test Venture');
  await page.selectOption('select[name="status"]', 'Build');

  await page.click('button[type="submit"]');

  await expect(page.getByText('Venture created successfully')).toBeVisible();
});
```

---

## Gap Analysis

### Current API Gaps for Phase 1

Based on the FRD Phase 1 requirements (FR-1..3, 9-10, 13, 15, 19-20, 46), the following gaps exist:

#### 1. Missing Response Schemas in OpenAPI Spec

**Issue:** OpenAPI spec has minimal response definitions (just `description: Items`)

**Impact:** No type safety for response bodies

**Recommendation:**

```yaml
# api/openapi.yaml (enhanced)
paths:
  /v1/{entity}:
    get:
      responses:
        '200':
          description: List of entities
          content:
            application/json:
              schema:
                type: object
                properties:
                  items:
                    type: array
                    items:
                      $ref: '#/components/schemas/Manifest'

  /v1/{entity}/{id}:
    get:
      responses:
        '200':
          description: Entity snapshot
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Snapshot'

components:
  schemas:
    Manifest:
      type: object
      required: [id, entity, updated_at]
      properties:
        id: { type: string }
        entity: { type: string }
        updated_at: { type: string, format: date-time }
        # ... display fields

    Snapshot:
      type: object
      required: [id, entity, env, schema_version, created_at, updated_at]
      properties:
        id: { type: string }
        entity: { type: string }
        env: { type: string, enum: [dev, stg, prod] }
        schema_version: { type: string }
        created_at: { type: string, format: date-time }
        updated_at: { type: string, format: date-time }
```

#### 2. Missing Entity-Specific Fields

**Issue:** Current OpenAPI spec uses generic `any` for entity data

**Impact:** No validation for venture-specific fields (title, status, mrr, etc.)

**Recommendation:** Add entity-specific schemas:

```yaml
components:
  schemas:
    VentureSnapshot:
      allOf:
        - $ref: '#/components/schemas/Snapshot'
        - type: object
          properties:
            title: { type: string }
            description: { type: string }
            status: { type: string, enum: [Idea, Validation, Build, Pilot, Scale, Spin-Out] }
            lead: { type: string, format: email }
            mrr: { type: number }
            users: { type: integer }
            burn_rate: { type: number }
            runway_months: { type: number }

    IdeaSnapshot:
      allOf:
        - $ref: '#/components/schemas/Snapshot'
        - type: object
          properties:
            theme: { type: string }
            problem: { type: string }
            market_size: { type: string }
            score: { type: number }
            stage: { type: string }
```

#### 3. Missing Pagination Support

**Issue:** No pagination for large lists (will be slow with 50+ ventures)

**Impact:** Performance degradation as portfolio grows

**Recommendation:** Add cursor-based pagination:

```yaml
paths:
  /v1/{entity}:
    get:
      parameters:
        - in: query
          name: cursor
          schema: { type: string }
          description: Pagination cursor
        - in: query
          name: limit
          schema: { type: integer, default: 20, maximum: 100 }
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  items: { type: array }
                  next_cursor: { type: string, nullable: true }
```

#### 4. Missing Filtering Parameters

**Issue:** Client-side filtering is inefficient

**Impact:** Fetching all ventures then filtering wastes bandwidth

**Recommendation:** Add server-side filters:

```yaml
paths:
  /v1/{entity}:
    get:
      parameters:
        - in: query
          name: filter_status
          schema: { type: string }
        - in: query
          name: filter_lead
          schema: { type: string }
        - in: query
          name: filter_updated_since
          schema: { type: string, format: date-time }
```

Alternatively, rely on existing index endpoints (`/v1/index/ventures/by-status/{status}`).

#### 5. Missing Bulk Operations

**Issue:** No batch write endpoint

**Impact:** Creating multiple entities requires N sequential requests

**Recommendation:** Add bulk write endpoint:

```yaml
paths:
  /v1/internal/history/batch:
    post:
      summary: Write multiple history records
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                records:
                  type: array
                  items:
                    type: object
      responses:
        '202':
          description: Batch accepted
```

#### 6. Missing Real-Time Updates

**Issue:** UI relies on polling or manual refresh

**Impact:** Delayed updates in collaborative scenarios

**Recommendation:** Add Server-Sent Events (SSE) or WebSocket endpoint:

```yaml
paths:
  /v1/events/subscribe:
    get:
      summary: Subscribe to entity updates (SSE)
      parameters:
        - in: query
          name: entities
          schema: { type: string }
          description: Comma-separated entity types
      responses:
        '200':
          description: Event stream
          content:
            text/event-stream:
              schema:
                type: string
```

**Implementation:**

```typescript
// services/api-edge/src/index.ts (new handler)
async function handleEventStream(req, res, entities) {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  });

  // Subscribe to Pub/Sub topic
  const subscription = pubsub.subscription('snapshot-updates');

  subscription.on('message', (message) => {
    const { entity, id } = JSON.parse(message.data.toString());

    if (entities.includes(entity)) {
      res.write(`event: snapshot-updated\n`);
      res.write(`data: ${JSON.stringify({ entity, id })}\n\n`);
    }
  });

  req.on('close', () => subscription.close());
}
```

#### 7. Missing Export Endpoints

**Issue:** FR-20 requires CSV export, but no download endpoint exists

**Impact:** Cannot fulfill export requirement

**Recommendation:** Add export endpoints:

```yaml
paths:
  /v1/exports/ventures:
    get:
      summary: Export ventures as CSV
      parameters:
        - in: query
          name: format
          schema: { type: string, enum: [csv, json, xlsx] }
      responses:
        '200':
          description: Export file
          content:
            text/csv:
              schema: { type: string }
```

#### 8. Missing Budget Endpoints

**Issue:** FR-15 requires budget tracking, but no budget endpoints exist

**Impact:** Cannot implement budget module

**Recommendation:** Add budget endpoints:

```yaml
paths:
  /v1/budget:
    get:
      summary: List budgets
  /v1/budget/{id}:
    get:
      summary: Get budget snapshot
  /v1/budget/{ventureId}/variance:
    get:
      summary: Budget vs actual variance report
```

#### 9. Missing Resource Endpoints

**Issue:** FR-13 requires resource allocation, but only utilisation endpoint exists

**Impact:** Cannot create/update resource records

**Recommendation:** Add resource CRUD:

```yaml
paths:
  /v1/resource:
    get:
      summary: List resources (people directory)
  /v1/resource/{id}:
    get:
      summary: Get resource snapshot
  /v1/resource/{personId}/allocations:
    get:
      summary: Get all allocations for a person
```

#### 10. Missing RBAC Metadata

**Issue:** API doesn't return user permissions per entity

**Impact:** UI must hardcode role logic instead of using server-provided permissions

**Recommendation:** Add permissions in auth context:

```yaml
paths:
  /v1/auth/me:
    get:
      summary: Get current user context
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  user: { type: object }
                  roles: { type: array, items: { type: string } }
                  permissions:
                    type: object
                    additionalProperties:
                      type: object
                      properties:
                        read: { type: boolean }
                        write: { type: boolean }
                        delete: { type: boolean }
```

---

## Recommendations Summary

### High Priority (Required for Phase 1)

1. **Add response schemas to OpenAPI spec** - Enables full type safety
2. **Add entity-specific schemas** - Validates venture/idea fields
3. **Add budget and resource endpoints** - Required for FR-13, FR-15
4. **Add CSV export endpoint** - Required for FR-20
5. **Document actual response times** - Set realistic SLOs

### Medium Priority (Nice to Have)

6. **Add pagination support** - Improves scalability
7. **Add server-side filtering** - Reduces client-side overhead
8. **Add bulk write endpoint** - Improves DX for imports
9. **Add `/v1/auth/me` endpoint** - Simplifies RBAC in UI

### Low Priority (Future)

10. **Add real-time event stream** - Enables collaborative features
11. **Add circuit breaker** - Advanced resilience pattern
12. **Add request batching** - Reduces HTTP overhead

---

## Conclusion

This guide provides a complete API integration strategy for the CityReach Innovation Labs UI redesign. Key takeaways:

1. **Use openapi-fetch** for type-safe API calls
2. **TanStack Query** handles server state, caching, and optimistic updates
3. **Zustand** manages client state (auth, UI preferences)
4. **Retry logic** with exponential backoff improves resilience
5. **Cache invalidation** strategies aligned with event-driven architecture

### Next Steps

1. Generate TypeScript client from OpenAPI spec
2. Enhance OpenAPI spec with response schemas
3. Implement missing endpoints (budget, resource, export)
4. Create custom hooks for each Phase 1 endpoint
5. Build reusable error handling components
6. Write integration tests with MSW
7. Document SLOs and monitor in production

---

**References:**

- OpenAPI Spec: `/api/openapi.yaml`
- API Edge Implementation: `/services/api-edge/src/index.ts`
- Auth Module: `/services/api-edge/src/auth.ts`
- GCS Persistence Spec: `/ecco_gcs_json_persistence_spec_v1.2.md`
- FRD: `/docs/FRD.md`
- Architecture Doc: `/ui/_docs/ARCHITECTURE.md`
