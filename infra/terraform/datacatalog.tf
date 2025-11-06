resource "google_project_service" "datacatalog" {
  service                    = "datacatalog.googleapis.com"
  disable_dependent_services = false
}

resource "google_data_catalog_entry_group" "analytics" {
  entry_group_id = "analytics"
  location       = "us"
  display_name   = "Analytics Catalog"
  description    = "External tables and views for Ecco Platform"
  depends_on     = [google_project_service.datacatalog]
}

resource "google_data_catalog_entry" "ext_tables" {
  for_each      = {
    dev  = google_bigquery_dataset.analytics_dev.dataset_id
    stg  = google_bigquery_dataset.analytics_stg.dataset_id
    prod = google_bigquery_dataset.analytics_prod.dataset_id
  }
  entry_group = google_data_catalog_entry_group.analytics.name
  entry_id    = "ext_snapshots_${each.key}"
  user_specified_system = "BigQuery"
  user_specified_type   = "ExternalTableGroup"
  display_name = "External Snapshots (${each.key})"
  linked_resource = "//bigquery.googleapis.com/projects/${var.project_id}/datasets/${each.value}"
}

