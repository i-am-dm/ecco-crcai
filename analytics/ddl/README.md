Analytics DDL

Overview
- BigQuery external tables are created via Terraform in `infra/terraform/bigquery.tf` for `dev`, `stg`, and `prod` datasets.
- Version-tolerant views expose a consistent set of columns for each entity.
- Optional scheduled queries materialize native tables for dashboard performance.

Datasets
- `analytics_dev`, `analytics_stg`, `analytics_prod`

External Tables (per dataset)
- `ext_snapshots_idea` → `gs://<bucket>/env/<env>/snapshots/ideas/*.json`
- `ext_snapshots_venture` → `.../snapshots/ventures/*.json`
- `ext_snapshots_round` → `.../snapshots/rounds/*.json`
- `ext_snapshots_cap_table` → `.../snapshots/cap_tables/*.json`

Views (per dataset)
- `v_idea`, `v_venture`, `v_round`, `v_cap_table` — selects stable columns.

Example Queries
- Recent ventures by status:
  SELECT id, title, status, lead, updated_at
  FROM `analytics_dev.v_venture`
  WHERE updated_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  ORDER BY updated_at DESC
  LIMIT 100;

- Rounds by venture:
  SELECT ventureId, COUNT(*) AS rounds
  FROM `analytics_dev.v_round`
  GROUP BY ventureId
  ORDER BY rounds DESC;

Notes
- External tables expect JSON objects per file under the snapshots path.
- Views project a fixed set of columns to tolerate additive schema evolution.
