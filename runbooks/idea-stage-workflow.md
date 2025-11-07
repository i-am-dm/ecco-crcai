# Idea Stage Workflow (FR-3) Validation

This runbook exercises the FR‑1 → FR‑3 path end-to-end: history write, snapshot rebuild, manifest/index updates, and UI verification.

## Prerequisites

- Local Docker runtime (for `docker compose` harness)
- GCloud creds with access to the configured bucket (or rely on FsStorage via `STORAGE_BACKEND=fs`)
- Node 20+ (workspace root)

## 1. Seed dev data (optional but recommended)

```bash
./tools/local-harness/seed-bucket.sh ecco-studio-platform-data dev
```

Seeds `env/dev/ideas/*` with the four FR‑3 sample ideas (Idea → Validation → Build → Launch) so the UI shows live stage workflow states.

## 2. Start the local stack

```bash
STORAGE_BACKEND=fs DATA_BUCKET=ecco-studio-platform-data \
  ./tools/local-harness/start.sh --watch --rebuild
```

This mounts `docs/examples` into the API edge service, enabling read/write against the sample filesystem bucket.

## 3. Create a new idea via CLI

```bash
node apps/write-cli/dist/index.js write-history \
  --bucket ecco-studio-platform-data \
  --env dev \
  --entity idea \
  --id IDEA-TEST-001 \
  --file apps/write-cli/samples/seed/idea/IDEA-001.json
```

Update the JSON before running (theme/problem/team/tech/stage owner/due date).

## 4. Advance the stage & confirm history

```bash
node apps/write-cli/dist/index.js write-history \
  --bucket ecco-studio-platform-data \
  --env dev \
  --entity idea \
  --id IDEA-TEST-001 \
  --file tmp/idea-test-stage-update.json
```

`tmp/idea-test-stage-update.json` should contain only the fields being updated:

```jsonc
{
  "id": "IDEA-TEST-001",
  "entity": "idea",
  "env": "dev",
  "schema_version": "1.0.0",
  "stage": "Validation",
  "stage_owner": "pm@ecco.studio",
  "stage_due_date": "2025-12-01T00:00:00Z",
  "updated_at": "2025-11-07T10:00:00Z"
}
```

The API edge service automatically appends to `stage_history` when the stage changes.

Verify:

```bash
cat docs/examples/env/dev/ideas/IDEA-TEST-001/history/*/*.json | jq '.stage_history'
```

You should see entries for both the original stage and the transition to Validation with timestamps.

## 5. Confirm manifests and indices

```bash
cat docs/examples/env/dev/manifests/ideas/by-id/IDEA-TEST-001.json | jq '.stage,.stageOwner'
ls docs/examples/env/dev/indices/ideas/by-stage
ls docs/examples/env/dev/indices/ideas/by-owner
```

Each idea now appears under:

- `indices/ideas/by-stage/<stage>/<id>.json`
- `indices/ideas/by-status/<status>/<id>.json`
- `indices/ideas/by-owner/<owner>/<id>.json`
- `indices/ideas/by-score/<bucket>/<id>.json`

These pointers power list filters plus analytics queries.

## 6. UI smoke test

1. Run `npm run dev -w apps/ui` (or the compose `ui` service).
2. Open http://localhost:5173/ideas.
3. Filter by stage/owner to confirm the indices surface as expected.
4. Open `/ideas/IDEA-TEST-001` and ensure the Stage Workflow component shows the correct current stage and history.

## 7. Cleanup

- Stop compose: `./tools/local-harness/start.sh --down`
- Remove temporary history files if you wrote directly into `docs/examples`.

---

## Appendix — Running Against Real GCS (no FsStorage)

Once you’re ready to graduate from the FsStorage harness, point every component at the actual bucket:

1. **Authenticate**
   ```bash
   gcloud auth application-default login
   export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/gcloud/application_default_credentials.json"
   ```

2. **Set bucket + storage backend**
   ```bash
   export DATA_BUCKET="ecco-studio-platform-data"
   export STORAGE_BACKEND="gcs"
   ```

3. **Start the stack normally**
   ```bash
   ./tools/local-harness/start.sh --rebuild
   ```
   With `STORAGE_BACKEND=gcs` the api-edge service now reads/writes directly to GCS; make sure the service account tied to your creds has RW access to `env/dev/*`.

4. **CLI writes hit GCS**
   ```bash
   node apps/write-cli/dist/index.js write-and-snapshot \
     --bucket "$DATA_BUCKET" \
     --env dev \
     --entity idea \
     --id IDEA-GCS-001 \
     --file apps/write-cli/samples/seed/idea/IDEA-001.json
   ```

5. **UI points at live API**
   - Set `VITE_API_URL` in `apps/ui/.env.local` to the running api-edge endpoint (local or remote).
   - Restart `npm run dev -w apps/ui`.

6. **Verify indices in GCS**
   ```bash
   gsutil ls gs://$DATA_BUCKET/env/dev/indices/ideas/by-stage/*
   gsutil cat gs://$DATA_BUCKET/env/dev/indices/ideas/by-owner/maya-ecco-studio/IDEA-GCS-001.json
   ```

This mirrors the production deployment path, so any FR‑3 regressions caught here reflect the real pipeline.
