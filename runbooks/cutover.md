Migration & Cutover Runbook

Goals
- Seed initial data, reconcile snapshots and indices
- Blue/green cutover using `env/stg` → `env/prod`
- Post-cutover validation

Seed Initial Data
- Prepare a directory `seed/` with per-entity subfolders and JSON files:
  seed/
    idea/*.json
    venture/*.json
    round/*.json
    cap_table/*.json
- Seed history and snapshots (dev/stg first):
  node apps/write-cli/dist/index.js seed-dir --bucket $BUCKET --env $ENV --root seed --snapshots true

Reconcile Snapshots → Manifests
- If needed, rebuild per-id manifests from snapshots:
  node apps/write-cli/dist/index.js rebuild-manifests --bucket $BUCKET --env $ENV --entity all
- Compact shards for list/read performance:
  node services/manifest-compactor/dist/index.js --bucket $BUCKET --env $ENV --entity ventures --shards 256

Blue/Green Toggle
- Deploy readers/UI configured to target `env/stg` for verification.
- Flip config to `env/prod` during the cutover window.
- Strategy:
  - Freeze writes (short window) on the legacy system.
  - Run final seed into `env/prod`.
  - Validate readers/queries in `analytics_prod` dataset.
  - Switch client config and monitor.

Post-Cutover Validation
- BigQuery queries on `analytics_prod.v_*` return expected counts.
- No errors in handlers; DLQs empty.
- UI list views read via shard indices without regressions.
