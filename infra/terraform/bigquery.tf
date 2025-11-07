##############################################
# BigQuery integration: datasets, connections,
# external tables over GCS snapshots, views,
# and optional scheduled loads to native tables.
##############################################

resource "google_project_service" "bq_apis" {
  for_each = toset([
    "bigquery.googleapis.com",
    "bigqueryconnection.googleapis.com",
    "bigquerydatatransfer.googleapis.com",
  ])
  service                    = each.key
  disable_dependent_services = false
}

# Datasets per environment to simplify promotion and isolation
resource "google_bigquery_dataset" "analytics_dev" {
  dataset_id  = "analytics_dev"
  location    = var.location
  description = "Analytics (dev)"
  labels = {
    project     = "crc-ai"
    managed_by  = "terraform"
    environment = "dev"
  }
  depends_on  = [google_project_service.bq_apis]
}

resource "google_bigquery_dataset" "analytics_stg" {
  dataset_id  = "analytics_stg"
  location    = var.location
  description = "Analytics (stg)"
  labels = {
    project     = "crc-ai"
    managed_by  = "terraform"
    environment = "stg"
  }
  depends_on  = [google_project_service.bq_apis]
}

resource "google_bigquery_dataset" "analytics_prod" {
  dataset_id  = "analytics_prod"
  location    = var.location
  description = "Analytics (prod)"
  labels = {
    project     = "crc-ai"
    managed_by  = "terraform"
    environment = "prod"
  }
  depends_on  = [google_project_service.bq_apis]
}

# Connection for BigLake external tables to access GCS
resource "google_bigquery_connection" "gcs" {
  connection_id = "gcs_biglake"
  location      = var.region
  friendly_name = "GCS BigLake Connection"
  description   = "Access to Cloud Storage bucket for external tables"
  cloud_resource {}
  depends_on = [google_project_service.bq_apis]
}

locals {
  entities = {
    idea      = "ideas"
    venture   = "ventures"
    round     = "rounds"
    cap_table = "cap_tables"
  }
}

# Helper module-like repetition using for_each for each entity/env
resource "google_bigquery_table" "ext_snapshots_dev" {
  for_each            = local.entities
  dataset_id          = google_bigquery_dataset.analytics_dev.dataset_id
  table_id            = "ext_snapshots_${each.key}"
  deletion_protection = false

  external_data_configuration {
    autodetect    = true
    source_format = "NEWLINE_DELIMITED_JSON"
    source_uris   = ["gs://${google_storage_bucket.data.name}/env/dev/snapshots/${each.value}/*.json"]
    connection_id = google_bigquery_connection.gcs.name
  }
}

resource "google_bigquery_table" "ext_snapshots_stg" {
  for_each            = local.entities
  dataset_id          = google_bigquery_dataset.analytics_stg.dataset_id
  table_id            = "ext_snapshots_${each.key}"
  deletion_protection = false

  external_data_configuration {
    autodetect    = true
    source_format = "NEWLINE_DELIMITED_JSON"
    source_uris   = ["gs://${google_storage_bucket.data.name}/env/stg/snapshots/${each.value}/*.json"]
    connection_id = google_bigquery_connection.gcs.name
  }
}

resource "google_bigquery_table" "ext_snapshots_prod" {
  for_each            = local.entities
  dataset_id          = google_bigquery_dataset.analytics_prod.dataset_id
  table_id            = "ext_snapshots_${each.key}"
  deletion_protection = false

  external_data_configuration {
    autodetect    = true
    source_format = "NEWLINE_DELIMITED_JSON"
    source_uris   = ["gs://${google_storage_bucket.data.name}/env/prod/snapshots/${each.value}/*.json"]
    connection_id = google_bigquery_connection.gcs.name
  }
}

# Version-tolerant views: project stable columns only
resource "google_bigquery_table" "view_dev" {
  for_each            = local.entities
  dataset_id          = google_bigquery_dataset.analytics_dev.dataset_id
  table_id            = "v_${each.key}"
  deletion_protection = false
  view {
    query          = <<-SQL
      SELECT
        id, entity, env, schema_version, updated_at,
        title, status, lead, ventureId, stage, asOf, ptr
      FROM `${google_bigquery_dataset.analytics_dev.dataset_id}.ext_snapshots_${each.key}`
    SQL
    use_legacy_sql = false
  }
  depends_on = [google_bigquery_table.ext_snapshots_dev]
}

resource "google_bigquery_table" "view_stg" {
  for_each            = local.entities
  dataset_id          = google_bigquery_dataset.analytics_stg.dataset_id
  table_id            = "v_${each.key}"
  deletion_protection = false
  view {
    query          = <<-SQL
      SELECT
        id, entity, env, schema_version, updated_at,
        title, status, lead, ventureId, stage, asOf, ptr
      FROM `${google_bigquery_dataset.analytics_stg.dataset_id}.ext_snapshots_${each.key}`
    SQL
    use_legacy_sql = false
  }
  depends_on = [google_bigquery_table.ext_snapshots_stg]
}

resource "google_bigquery_table" "view_prod" {
  for_each            = local.entities
  dataset_id          = google_bigquery_dataset.analytics_prod.dataset_id
  table_id            = "v_${each.key}"
  deletion_protection = false
  view {
    query          = <<-SQL
      SELECT
        id, entity, env, schema_version, updated_at,
        title, status, lead, ventureId, stage, asOf, ptr
      FROM `${google_bigquery_dataset.analytics_prod.dataset_id}.ext_snapshots_${each.key}`
    SQL
    use_legacy_sql = false
  }
  depends_on = [google_bigquery_table.ext_snapshots_prod]
}

# Optional: Scheduled loads to native tables for perf-sensitive dashboards
resource "google_bigquery_data_transfer_config" "scheduled_load_dev" {
  for_each               = local.entities
  display_name           = "Load ${each.key} (dev)"
  data_source_id         = "scheduled_query"
  schedule               = "every 6 hours"
  destination_dataset_id = google_bigquery_dataset.analytics_dev.dataset_id
  params = {
    query = "CREATE OR REPLACE TABLE `${google_bigquery_dataset.analytics_dev.dataset_id}.snapshots_${each.key}` AS SELECT * FROM `${google_bigquery_dataset.analytics_dev.dataset_id}.ext_snapshots_${each.key}`"
  }
  depends_on = [google_bigquery_table.ext_snapshots_dev, google_bigquery_dataset.analytics_dev]
}

resource "google_bigquery_data_transfer_config" "scheduled_load_stg" {
  for_each               = local.entities
  display_name           = "Load ${each.key} (stg)"
  data_source_id         = "scheduled_query"
  schedule               = "every 6 hours"
  destination_dataset_id = google_bigquery_dataset.analytics_stg.dataset_id
  params = {
    query = "CREATE OR REPLACE TABLE `${google_bigquery_dataset.analytics_stg.dataset_id}.snapshots_${each.key}` AS SELECT * FROM `${google_bigquery_dataset.analytics_stg.dataset_id}.ext_snapshots_${each.key}`"
  }
  depends_on = [google_bigquery_table.ext_snapshots_stg, google_bigquery_dataset.analytics_stg]
}

resource "google_bigquery_data_transfer_config" "scheduled_load_prod" {
  for_each               = local.entities
  display_name           = "Load ${each.key} (prod)"
  data_source_id         = "scheduled_query"
  schedule               = "every 6 hours"
  destination_dataset_id = google_bigquery_dataset.analytics_prod.dataset_id
  params = {
    query = "CREATE OR REPLACE TABLE `${google_bigquery_dataset.analytics_prod.dataset_id}.snapshots_${each.key}` AS SELECT * FROM `${google_bigquery_dataset.analytics_prod.dataset_id}.ext_snapshots_${each.key}`"
  }
  depends_on = [google_bigquery_table.ext_snapshots_prod, google_bigquery_dataset.analytics_prod]
}

