# ADR 0001: Runtime, Language, and Platform

Status: Accepted
Date: 2025-11-06

Context
- Handlers must process GCS → Pub/Sub notifications, perform JSON validation, and write back to GCS with preconditions.
- The team prefers strong typing and a large ecosystem for cloud/serverless tooling.

Decision
- Use TypeScript on Node.js 20 LTS for all services and libraries.
- Deploy handlers on Cloud Run (fully managed), triggered via Pub/Sub subscriptions.
- Package code as minimal Docker images; build via CI.

Consequences
- Shared libraries in TypeScript (`libs/`) for schema validation, ULID/time, and GCS access.
- Cloud Run provides better cold-start and concurrency control than Functions 1st gen; Pub/Sub trigger is standard.
- Local dev uses `pnpm`/`npm` + `docker`.

