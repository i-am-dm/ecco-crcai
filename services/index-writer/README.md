# Index Writer (Cloud Run)

Maintains secondary index pointer files under `env/{env}/indices/...` when snapshots finalize.

Behavior
- Trigger: Pub/Sub push with GCS `OBJECT_FINALIZE` events for snapshot paths.
- Reads the snapshot, derives pointer records using configuration in `libs/ts/src/indices.ts`.
- Upserts pointer JSON with optimistic concurrency and updated_at guards.
- Cleans up stale pointer files (e.g., venture status changes) by listing and deleting outdated paths per entity.

Current indices
- Ventures: by status (`by-status/{statusSlug}/{id}.json`), by lead, by next-due month.
- Rounds: by venture (`by-venture/{ventureId}/{roundId}.json`).
- Cap tables: latest by venture (`by-venture/{ventureId}.json`).

Local run
- `npm i && npm run build && npm start`
- Send a test event by posting a base64-encoded GCS JSON API payload to `/pubsub/push`.

Deployment
- Deploy to Cloud Run with a Pub/Sub push subscription on the snapshots topic.
- Grant bucket read/write permissions (snapshots + indices paths) to the service account.

