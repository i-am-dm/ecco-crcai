import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from '@/types/api';
import { config } from '@/config';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

function absoluteBase(base: string): string {
  // Support relative bases like "/api" by prefixing with current origin
  if (typeof window !== 'undefined' && base.startsWith('/')) {
    const origin = window.location.origin.replace(/\/$/, '');
    return origin + base;
  }
  return base;
}

// Create the API client with an absolute base URL
const api = createClient<paths>({
  baseUrl: absoluteBase(config.apiUrl),
});

// Auth middleware - adds JWT token to requests
const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = useAuthStore.getState().token;
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },

  async onResponse({ response }) {
    // Handle 401 Unauthorized - logout user
    if (response.status === 401) {
      useAuthStore.getState().logout();
      // Redirect to login
      window.location.href = '/login';
    }
    return response;
  },
};

// Environment middleware - adds env query param
const envMiddleware: Middleware = {
  async onRequest({ request }) {
    const url = new URL(request.url);

    // Add env query param if not present
    if (!url.searchParams.has('env')) {
      const env = useUIStore.getState().env;
      url.searchParams.set('env', env);

      // Create new request with updated URL
      return new Request(url.toString(), request);
    }

    return request;
  },
};

// Register middleware
api.use(authMiddleware);
api.use(envMiddleware);

export default api;

// Helper functions for common API operations
const SCHEMA_VERSION_MAP: Record<string, string> = {
  idea: '1.0.0',
  venture: '1.0.0',
  round: '1.0.0',
  cap_table: '1.0.0',
  playbook: '1.0.0',
  playbook_run: '1.0.0',
  show_page: '1.0.0',
};

export const apiHelpers = {
  /**
   * List entities via manifests
   */
  async listEntities(entity: string) {
    const { data, error } = await api.GET('/v1/{entity}', {
      params: {
        path: { entity },
      },
    });

    if (error || !data) {
      const reason = error ? String(error) : 'not_found';
      throw new Error(`Failed to list ${entity}: ${reason}`);
    }

    return data;
  },

  /**
   * Get entity snapshot by ID
   */
  async getEntity(entity: string, id: string) {
    const { data, error } = await api.GET('/v1/{entity}/{id}', {
      params: {
        path: { entity, id },
      },
    });

    if (error || !data) {
      const reason = error ? String(error) : 'not_found';
      throw new Error(`Failed to get ${entity} ${id}: ${reason}`);
    }

    return data;
  },

  /**
   * Create or update entity via history write
   */
  async writeHistory(entity: string, data: any) {
    if (!data || typeof data !== 'object') {
      throw new Error(`writeHistory requires payload for entity ${entity}`);
    }
    const env = data.env || useUIStore.getState().env;
    const nowIso = new Date().toISOString();
    const schemaVersion = data.schema_version || SCHEMA_VERSION_MAP[entity] || '1.0.0';
    const resolvedId = data.id || `${entity}_${Date.now()}`;

    const payload: Record<string, any> = {
      ...data,
      entity,
      env,
      id: resolvedId,
    };

    payload.schema_version = schemaVersion;

    const resolvedUpdated = data.updated_at || data.updatedAt || nowIso;
    const resolvedCreated = data.created_at || data.createdAt || resolvedUpdated;
    payload.updated_at = resolvedUpdated;
    payload.updatedAt = resolvedUpdated;
    payload.created_at = resolvedCreated;
    payload.createdAt = resolvedCreated;

    const resolvedCreatedBy = data.created_by || data.createdBy;
    if (resolvedCreatedBy) {
      payload.created_by = resolvedCreatedBy;
      payload.createdBy = resolvedCreatedBy;
    }

    const token = useAuthStore.getState().token;
    const res = await fetch(`${config.apiUrl}/v1/internal/history`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to write ${entity}: ${res.status}`);
    }

    try {
      return await res.json();
    } catch {
      return null;
    }
  },
};

// Raw GET helper for ad-hoc endpoints not in the OpenAPI types
export async function rawGet(path: string): Promise<any> {
  const url = new URL(path, absoluteBase(config.apiUrl));
  // Add env if missing
  if (!url.searchParams.has('env')) {
    const env = useUIStore.getState().env;
    url.searchParams.set('env', env);
  }
  const token = useAuthStore.getState().token;
  const res = await fetch(url.toString(), { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  if (!res.ok) throw new Error(String(res.status));
  return await res.json();
}

export async function rawPost(path: string, body: Record<string, any>): Promise<any> {
  const url = new URL(path, absoluteBase(config.apiUrl));
  if (!url.searchParams.has('env')) {
    const env = useUIStore.getState().env;
    url.searchParams.set('env', env);
  }
  const token = useAuthStore.getState().token;
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(String(res.status));
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}
