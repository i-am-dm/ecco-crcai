# API Integration Strategy - Summary & Findings

Version: 1.0
Date: 2025-11-06
Author: Backend Architect

---

## Executive Summary

I've reviewed the current API implementation (`services/api-edge`) and OpenAPI specification (`api/openapi.yaml`) to assess readiness for the CityReach Innovation Labs UI redesign. This document summarizes findings, identifies gaps, and provides actionable recommendations.

**Status:** API Edge is functional and implements core read/write patterns, but the OpenAPI spec needs enhancement for full type safety and Phase 1 feature completeness.

---

## Current State Assessment

### What's Working Well

1. **Clean Architecture**
   - Event-driven write path (history → snapshot → manifest → indices)
   - RBAC enforcement with role-based access control
   - JWT authentication via Identity Platform
   - Demo mode for local development (x-roles header)

2. **Core Endpoints Implemented**
   - `GET /v1/{entity}` - List via manifests
   - `GET /v1/{entity}/{id}` - Snapshot by ID
   - `GET /v1/index/ventures/by-status/{status}` - Index queries
   - `GET /v1/index/ventures/by-lead/{lead}`
   - `GET /v1/index/ventures/by-next-due/{ym}`
   - `GET /v1/portfolio/summary` - Aggregates
   - `GET /v1/portfolio/heatmap` - Portfolio visualization
   - `GET /v1/kpis/{metric}/series` - Time series data
   - `GET /v1/ops/utilisation` - Resource utilisation
   - `POST /v1/internal/history` - Write path

3. **GCS Integration**
   - Reads from GCS snapshots and manifests
   - Writes history records with generation preconditions
   - Dev-mode pipeline for instant feedback (snapshot + manifest + index)

4. **CORS & Security**
   - CORS headers configured for local dev
   - Bearer token validation with JWKS
   - Role extraction from JWT claims

---

## Critical Gaps for Phase 1

### 1. Incomplete OpenAPI Specification

**Issue:** Response schemas are placeholders (`description: Items`)

**Impact:**
- No type safety when generating TypeScript client
- No autocomplete or IntelliSense in IDE
- Runtime errors not caught at compile time

**Example Current State:**
```yaml
responses:
  '200':
    description: Items  # No schema defined
```

**Recommendation:** Add full response schemas (see API_INTEGRATION.md section "Gap Analysis #1")

**Priority:** HIGH - Required for type-safe client generation

**Effort:** 2-3 hours to define schemas for all Phase 1 endpoints

---

### 2. Missing Entity-Specific Schemas

**Issue:** Generic `any` type for entity data

**Impact:**
- Can't validate venture-specific fields (title, status, mrr, etc.)
- No compile-time checks for required fields
- Schema drift between backend and frontend

**Recommendation:** Define entity-specific schemas in OpenAPI:

```yaml
components:
  schemas:
    VentureSnapshot:
      allOf:
        - $ref: '#/components/schemas/Envelope'
        - type: object
          required: [title, status, lead]
          properties:
            title: { type: string, minLength: 1 }
            status: { type: string, enum: [Idea, Validation, Build, Pilot, Scale, Spin-Out] }
            lead: { type: string, format: email }
            mrr: { type: number, minimum: 0 }
            users: { type: integer, minimum: 0 }
```

**Priority:** HIGH - Ensures data integrity

**Effort:** 4-6 hours to define all entity schemas based on GCS spec

---

### 3. Missing Phase 1 Endpoints

**Issue:** Some FRD Phase 1 requirements lack corresponding API endpoints

**Missing for FR-13 (Resource Allocation):**
- `GET /v1/resource` - List resources (people directory)
- `GET /v1/resource/{id}` - Get resource snapshot
- `GET /v1/resource/{personId}/allocations` - Allocations per person

**Missing for FR-15 (Budget & Spend):**
- `GET /v1/budget` - List budgets
- `GET /v1/budget/{id}` - Get budget snapshot
- `GET /v1/budget/{ventureId}/variance` - Budget variance report

**Missing for FR-20 (Portfolio Dashboard):**
- `GET /v1/exports/ventures?format=csv` - CSV export

**Recommendation:** Implement missing endpoints (pattern matches existing entity handlers)

**Priority:** HIGH - Required for Phase 1 feature completeness

**Effort:** 6-8 hours (reuse existing patterns)

---

### 4. No Pagination Support

**Issue:** `GET /v1/{entity}` returns all items

**Impact:**
- Slow response times with 50+ ventures
- Wasted bandwidth fetching unused data
- Poor mobile experience

**Current Behavior:**
```typescript
// Fetches ALL ventures every time
const { data } = await apiClient.GET('/v1/venture');
// data.items could be 1000+ objects
```

**Recommendation:** Add cursor-based pagination:

```yaml
paths:
  /v1/{entity}:
    get:
      parameters:
        - in: query
          name: cursor
          schema: { type: string }
        - in: query
          name: limit
          schema: { type: integer, default: 20, maximum: 100 }
      responses:
        '200':
          content:
            application/json:
              schema:
                properties:
                  items: { type: array }
                  next_cursor: { type: string, nullable: true }
                  total: { type: integer }
```

**Priority:** MEDIUM - Can defer until portfolio grows beyond 50 ventures

**Effort:** 4-6 hours (backend + frontend hooks)

---

### 5. No Server-Side Filtering

**Issue:** All filtering happens client-side

**Impact:**
- Fetching 100 ventures to filter by status="Build" (10 items) wastes bandwidth
- Increases latency on slow connections
- Redundant data transfer

**Current Workaround:** Use index endpoints (`/v1/index/ventures/by-status/{status}`)

**Recommendation:** Either:
- Document index endpoints as preferred filtering approach (FAST)
- Add filter parameters to main endpoints (FLEXIBLE)

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
```

**Priority:** MEDIUM - Index endpoints cover most Phase 1 needs

**Effort:** 2-3 hours if adding filter params; 0 hours if documenting index usage

---

### 6. Missing User Context Endpoint

**Issue:** No `/v1/auth/me` endpoint to get current user + permissions

**Impact:**
- UI must hardcode RBAC logic based on role strings
- Can't dynamically show/hide features based on server-provided permissions
- RBAC logic duplicated across frontend and backend

**Recommendation:** Add auth context endpoint:

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
                  user:
                    type: object
                    properties:
                      uid: { type: string }
                      email: { type: string }
                  roles:
                    type: array
                    items: { type: string }
                  permissions:
                    type: object
                    description: Entity-level permissions
                    additionalProperties:
                      type: object
                      properties:
                        read: { type: boolean }
                        write: { type: boolean }
                        delete: { type: boolean }
```

**Priority:** LOW - Can use role-based checks initially

**Effort:** 2-3 hours

---

### 7. Missing Bulk Operations

**Issue:** No batch write endpoint

**Impact:**
- Importing 20 ideas requires 20 sequential POST requests
- Slow onboarding for data migration
- Poor UX for bulk edits

**Recommendation:** Add batch write endpoint:

```yaml
paths:
  /v1/internal/history/batch:
    post:
      summary: Write multiple history records
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                records:
                  type: array
                  items:
                    $ref: '#/components/schemas/HistoryRecord'
      responses:
        '202':
          description: Batch accepted
```

**Priority:** LOW - Not required for Phase 1

**Effort:** 4-6 hours

---

### 8. No Real-Time Updates

**Issue:** UI relies on polling or manual refresh

**Impact:**
- Delayed updates in collaborative scenarios
- Wasted API calls with polling
- Stale data issues

**Recommendation:** Add Server-Sent Events (SSE) endpoint:

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
              schema: { type: string }
```

**Priority:** LOW - Phase 2+ feature

**Effort:** 8-12 hours (Pub/Sub integration + client hooks)

---

## Performance & Reliability Findings

### Response Times (Observed in Code)

The current implementation has no explicit performance logging, but based on code analysis:

**Estimated Response Times:**

| Endpoint                          | Est. p50 | Est. p95 | AC-GEN Target |
|-----------------------------------|----------|----------|---------------|
| `GET /v1/{entity}`                | 300-500ms| 800ms-1s | < 500ms       |
| `GET /v1/{entity}/{id}`           | 100-200ms| 400ms    | < 500ms       |
| `GET /v1/index/ventures/by-*`     | 50-150ms | 300ms    | < 500ms       |
| `GET /v1/portfolio/summary`       | 500ms-1s | 2s       | < 1s          |
| `POST /v1/internal/history`       | 50-100ms | 200ms    | N/A (async)   |

**Concerns:**

1. **Portfolio summary** iterates all ventures in-memory (line 208)
   - Scales linearly with venture count
   - May exceed 1s target with 50+ ventures

2. **Manifest listing** reads multiple GCS objects sequentially
   - No connection pooling visible
   - Could benefit from parallel reads

**Recommendation:** Add performance monitoring and set SLOs

**Priority:** MEDIUM - Required for production readiness

**Effort:** 2-3 hours (add logging + Cloud Monitoring dashboards)

---

### Error Handling

**What's Good:**
- Proper error responses with `{ error, reason }` structure
- 403 Forbidden on RBAC violations
- 404 Not Found on missing entities
- 500 Internal on exceptions

**Gaps:**
- No structured error codes (e.g., `ERR_VENTURE_NOT_FOUND`)
- No error rate monitoring
- No DLQ for failed history writes

**Recommendation:** Enhance error responses:

```json
{
  "error": "not_found",
  "code": "ERR_VENTURE_NOT_FOUND",
  "message": "Venture V001 does not exist in env dev",
  "details": { "entity": "venture", "id": "V001", "env": "dev" }
}
```

**Priority:** LOW - Current errors are sufficient for Phase 1

**Effort:** 3-4 hours

---

### Concurrency & Race Conditions

**What's Good:**
- History writes use `ifGenerationMatch: 0` precondition (line 120)
- ULID-based history filenames prevent collisions

**Gaps:**
- Dev-mode pipeline (lines 104-138) runs async without error handling
- Multiple concurrent writes to same entity could cause index drift

**Recommendation:** Add error handling to dev pipeline:

```typescript
.catch((e) => {
  logJSON({
    message: 'dev pipeline error',
    severity: 'ERROR',  // Changed from WARNING
    error: String(e),
    entity,
    id
  });

  // Optionally: publish to DLQ for manual intervention
});
```

**Priority:** MEDIUM - Important for data integrity

**Effort:** 1-2 hours

---

## Security Findings

### Authentication

**What's Good:**
- JWT validation via JWKS (services/api-edge/src/auth.ts)
- Role extraction from multiple claim formats (roles, x-roles, role)
- Demo mode for local dev (configurable via DEMO_AUTH env var)

**Concerns:**
- Demo mode defaults to Admin role (line 43) - could be security risk in prod
- No token refresh mechanism documented
- No session expiration handling

**Recommendation:**
1. Ensure `DEMO_AUTH=0` in production
2. Document token refresh flow in API_INTEGRATION.md
3. Add middleware to reject expired tokens

**Priority:** HIGH - Security critical

**Effort:** 2-3 hours

---

### RBAC Enforcement

**What's Good:**
- RBAC enforced on every route (lines 48-52, 158-166, etc.)
- Per-entity, per-method, per-env checks
- Consistent error responses (403 Forbidden)

**Gaps:**
- No ownership checks (can any Lead edit any venture?)
- No audit log of permission denials
- No rate limiting per role

**Recommendation:**
1. Add ownership validation for Lead role:
   ```typescript
   if (hasRole('Lead') && entity.lead !== user.email) {
     return { allowed: false, reason: 'not_owner' };
   }
   ```

2. Log all 403s to audit trail

**Priority:** MEDIUM - Phase 1 can use broad permissions

**Effort:** 4-6 hours

---

## OpenAPI Spec Enhancements Required

### Before TypeScript Client Generation

1. **Add response schemas** for all endpoints
2. **Add request body schemas** for POST /v1/internal/history
3. **Add error response schemas** (400, 403, 404, 500)
4. **Add entity-specific schemas** (Venture, Idea, Budget, Resource)
5. **Add pagination parameters** (optional, if implementing)
6. **Add filter parameters** (optional, if implementing)
7. **Document security schemes** (Bearer JWT)
8. **Add example responses** for each endpoint

### Estimated Effort: 6-8 hours

### Template for Enhanced Endpoint

```yaml
/v1/venture/{id}:
  get:
    summary: Get venture snapshot by ID
    operationId: getVenture
    tags: [ventures]
    security:
      - firebase: []
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string }
        example: V001
      - name: env
        in: query
        schema: { type: string, enum: [dev, stg, prod], default: prod }
    responses:
      '200':
        description: Venture snapshot
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VentureSnapshot'
            example:
              id: V001
              entity: venture
              env: dev
              schema_version: '1.0.0'
              title: AI-Powered Analytics
              status: Build
              lead: jane@ecco.studio
              mrr: 12500
      '403':
        description: Forbidden
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      '404':
        description: Not found
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
```

---

## Action Items (Prioritized)

### Must-Have for Phase 1 (HIGH Priority)

1. **Enhance OpenAPI spec with response schemas** (6-8 hours)
   - Define Envelope, Manifest, Snapshot base schemas
   - Define VentureSnapshot, IdeaSnapshot entity schemas
   - Add error response schemas
   - Add examples

2. **Implement missing Phase 1 endpoints** (6-8 hours)
   - `GET /v1/resource` - List resources
   - `GET /v1/budget` - List budgets
   - `GET /v1/exports/ventures?format=csv` - CSV export

3. **Secure production deployment** (2-3 hours)
   - Ensure `DEMO_AUTH=0` in production
   - Add token expiration checks
   - Document refresh token flow

4. **Generate TypeScript client** (1 hour)
   - Run `npx openapi-typescript api/openapi.yaml -o ui/src/types/api.ts`
   - Create API client wrapper with auth interceptor
   - Test with existing endpoints

**Total Effort: 15-20 hours**

---

### Nice-to-Have for Phase 1 (MEDIUM Priority)

5. **Add performance monitoring** (2-3 hours)
   - Log response times per endpoint
   - Create Cloud Monitoring dashboard
   - Set up alerting on p95 > 1s

6. **Improve dev-mode pipeline error handling** (1-2 hours)
   - Add try/catch to async pipeline
   - Log errors with severity ERROR
   - Consider DLQ for failures

7. **Add pagination support** (4-6 hours)
   - Backend: implement cursor-based pagination
   - Frontend: create `useInfiniteQuery` hooks
   - Update OpenAPI spec

8. **Add ownership checks for RBAC** (4-6 hours)
   - Validate Lead can only edit own ventures
   - Add audit logging for permission denials

**Total Effort: 11-17 hours**

---

### Future Enhancements (LOW Priority)

9. **Add `/v1/auth/me` endpoint** (2-3 hours)
10. **Add bulk write endpoint** (4-6 hours)
11. **Add real-time event stream (SSE)** (8-12 hours)
12. **Enhance error codes and messages** (3-4 hours)

**Total Effort: 17-25 hours**

---

## Recommendations Summary

### Immediate Actions (This Week)

1. **Review and approve** the API_INTEGRATION.md guide
2. **Enhance OpenAPI spec** with response schemas
3. **Implement missing endpoints** (resource, budget, export)
4. **Generate TypeScript client** and test integration

### Phase 1 Completion Criteria

- [ ] All Phase 1 endpoints implemented and documented
- [ ] OpenAPI spec complete with schemas and examples
- [ ] TypeScript client generated and tested
- [ ] Auth interceptor configured with JWT bearer tokens
- [ ] Error handling patterns established
- [ ] Performance monitoring in place
- [ ] Security hardened for production

### Success Metrics

- **Type Safety:** 100% of API calls are type-checked at compile time
- **Performance:** p50 < 500ms for snapshot reads, p50 < 1s for aggregates
- **Reliability:** < 1% error rate on API calls
- **Developer Experience:** Autocomplete works in IDE for all API methods

---

## Conclusion

The current API Edge implementation is solid and follows best practices for serverless, event-driven architecture. The main gaps are:

1. **OpenAPI spec needs enhancement** for full type safety
2. **Missing endpoints** for resource, budget, export
3. **Performance monitoring** needed for production readiness

With 15-20 hours of focused work, the API will be fully ready for Phase 1 UI integration.

---

## Next Steps

1. **Review this summary** with the team
2. **Prioritize action items** based on timeline
3. **Assign ownership** for each enhancement
4. **Create tickets** in project management tool
5. **Schedule API review** after enhancements complete

---

**Files Created:**

- `/ui/_docs/API_INTEGRATION.md` - Comprehensive integration guide
- `/ui/_docs/API_INTEGRATION_SUMMARY.md` - This summary document

**Files to Update:**

- `/api/openapi.yaml` - Add response schemas and entity definitions

**Questions for Follow-Up:**

1. Should we prioritize pagination now, or defer until portfolio grows?
2. Do we need real-time updates in Phase 1, or can we use polling/manual refresh?
3. What's the timeline for implementing missing endpoints (resource, budget, export)?
4. Should RBAC include ownership checks (Lead can only edit own ventures) in Phase 1?
5. Do we want structured error codes (ERR_*) or are generic errors sufficient?

---

**Contact:** Backend Architect (Claude Code)
**Last Updated:** 2025-11-06
