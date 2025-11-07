# Seed Dev Data (Ideas, Ventures, Indices)

Use this runbook when you need a realistic data slice for local development or QA. It pushes the curated fixtures under `apps/write-cli/samples/seed/` into your GCS bucket, rebuilds snapshots, and lets you smoke-test the new `/v1/index/ideas/*` endpoints.

## Prerequisites

- `gcloud auth application-default login` against the target project.
- A writable bucket (e.g. `ecco-studio-platform-data-dev`) that mirrors the production layout (`env/<env>/...`).
- Node 20+ installed locally.

## Steps

1. **Build the write CLI (only needed the first time):**
   ```bash
   npm run build -w apps/write-cli
   ```

2. **Seed the bucket using the helper script:**
   ```bash
   ./tools/local-harness/seed-bucket.sh ecco-studio-platform-data-dev dev
   ```
   - The script validates each payload against the JSON Schemas, writes history records, and forces snapshot rebuilds so manifests/indices stay in sync.

3. **(Optional) Start the local harness against the same bucket:**
   ```bash
   DATA_BUCKET=ecco-studio-platform-data-dev ./tools/local-harness/start.sh --rebuild --detached
   ```

4. **Smoke-test the new idea indexes:**
   ```bash
   curl "http://localhost:8085/v1/index/ideas/by-status/under-review?env=dev" | jq '.items | length'
   curl "http://localhost:8085/v1/index/ideas/by-stage/validation?env=dev" | jq '.items[0]'
   curl "http://localhost:8085/v1/index/ideas/by-score/08?env=dev" | jq '.items[].score.overall'
   ```
   You should see the seeded ideas show up with their scoring breakdowns and proper ranking (highest score first).

5. **Verify decision-gate alerts (low score + stale ideas):**
   ```bash
   curl "http://localhost:8085/v1/ideas/decision-gates?env=dev" | jq '.items'
   ```
   At least one low-score alert should be returned from the fixtures.

## Tips

- To reseed, re-run step 2; objects are idempotent because the write path enforces `updated_at`.
- If you need to tweak sample data, edit the JSON files under `apps/write-cli/samples/seed/` and re-run the command.
- For fully offline work, the local harness copies `docs/examples/` into `tools/local-harness/bucket/` automatically; delete that directory if you want it to re-sync with the latest fixtures.
