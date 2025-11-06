# Manifest Writer (Cloud Run)

Maintains per-id manifest objects (`env/{env}/manifests/{entity}/by-id/{id}.json`) whenever a snapshot finalizes.

Flow
- Pub/Sub (push) sends GCS `OBJECT_FINALIZE` events for snapshot paths.
- Service reads the snapshot JSON, derives manifest pointer fields, and upserts the manifest object.
- Skips updates when the incoming `updated_at` is not newer than the existing manifest.
- Uses GCS precondition checks to avoid lost updates.

Local run
- `npm i && npm run build && npm start`
- POST a fake event: `curl -X POST localhost:8080/pubsub/push -H 'content-type: application/json' -d '{"message":{"data":"<base64>"}}'`

Deploy
- Build container and deploy to Cloud Run (or Cloud Functions).
- Create Pub/Sub push subscription on the snapshots topic targeting `/pubsub/push`.
- Grant service account read/write access to manifests and snapshots in the bucket.

