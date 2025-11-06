# Snapshot Builder (Cloud Run)

Cloud Run service that receives Pub/Sub push events for GCS `OBJECT_FINALIZE` notifications and maintains entity snapshots under `env/{env}/snapshots/{entity}/{id}.json`.

Endpoints
- `POST /pubsub/push` — Pub/Sub push endpoint. Request body: `{ message: { data: base64(JSON_API_V1) }}`.

Behavior
- Filters for object names containing `/history/`.
- Reads the finalized history JSON and updates the corresponding snapshot path.
- Idempotency: skips update if incoming `updated_at` <= current snapshot `updated_at`.
- Concurrency: uses GCS preconditions (metageneration match for updates, generation match for creates).

Local run
- `npm i && npm run build && npm start`
- Send a test request (replace bucket/name):
  ```sh
  curl -s localhost:8080/pubsub/push -H 'content-type: application/json' -d '{
    "message": {"data": "'$(printf '{"bucket":"ecco-studio-platform-data","name":"env/dev/ideas/IDEA-001/history/2025/11/06/x.json"}' | base64)'"}
  }'
  ```

Deploy
- Build container and deploy to Cloud Run with a Pub/Sub push subscription targeting `/pubsub/push`.
- Provide service account with read/write to the data bucket.

