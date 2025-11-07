locals {
  create_ecco_studio = length(trimspace(var.ecco_studio_image)) > 0
}

resource "google_service_account" "ecco_studio" {
  count        = local.create_ecco_studio ? 1 : 0
  account_id   = "ecco-studio-sa"
  display_name = "Cloud Run ecco-studio (UI+API)"
}

resource "google_project_iam_member" "ecco_studio_logging" {
  count   = local.create_ecco_studio ? 1 : 0
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.ecco_studio[0].email}"
}

resource "google_project_iam_member" "ecco_studio_metrics" {
  count   = local.create_ecco_studio ? 1 : 0
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.ecco_studio[0].email}"
}

# Allow read access to bucket paths required by api-edge (proxied behind nginx)
resource "google_storage_bucket_iam_member" "ecco_studio_bucket_view" {
  count  = local.create_ecco_studio ? 1 : 0
  bucket = google_storage_bucket.data.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.ecco_studio[0].email}"

  condition {
    title       = "EccoStudioApiReadOnly"
    description = "Allow API to read snapshots/manifests/indices"
    expression  = join(" || ", [
      format("resource.name.startsWith(\"projects/_/buckets/%s/objects/env/dev/snapshots/\")", google_storage_bucket.data.name),
      format("resource.name.startsWith(\"projects/_/buckets/%s/objects/env/stg/snapshots/\")", google_storage_bucket.data.name),
      format("resource.name.startsWith(\"projects/_/buckets/%s/objects/env/prod/snapshots/\")", google_storage_bucket.data.name),
      format("resource.name.startsWith(\"projects/_/buckets/%s/objects/env/dev/manifests/\")", google_storage_bucket.data.name),
      format("resource.name.startsWith(\"projects/_/buckets/%s/objects/env/stg/manifests/\")", google_storage_bucket.data.name),
      format("resource.name.startsWith(\"projects/_/buckets/%s/objects/env/prod/manifests/\")", google_storage_bucket.data.name),
      format("resource.name.startsWith(\"projects/_/buckets/%s/objects/env/dev/indices/\")", google_storage_bucket.data.name),
      format("resource.name.startsWith(\"projects/_/buckets/%s/objects/env/stg/indices/\")", google_storage_bucket.data.name),
      format("resource.name.startsWith(\"projects/_/buckets/%s/objects/env/prod/indices/\")", google_storage_bucket.data.name)
    ])
  }
}

# Unconditional viewer to allow listing with prefix
resource "google_storage_bucket_iam_member" "ecco_studio_bucket_list" {
  count  = local.create_ecco_studio ? 1 : 0
  bucket = google_storage_bucket.data.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.ecco_studio[0].email}"
}

resource "google_cloud_run_v2_service" "ecco_studio" {
  count    = local.create_ecco_studio ? 1 : 0
  name     = "ecco-studio"
  project  = var.project_id
  location = var.region

  ingress = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.ecco_studio[0].email
    timeout         = "${var.timeout_seconds}s"
    max_instance_request_concurrency = var.container_concurrency

    scaling {
      min_instance_count = 0
    }

    containers {
      image = var.ecco_studio_image

      ports {
        container_port = 8080
      }

      env {
        name  = "DATA_BUCKET"
        value = google_storage_bucket.data.name
      }
      env {
        name  = "STORAGE_BACKEND"
        value = var.storage_backend
      }

      # Optional JWT config via Secret Manager
      dynamic "env" {
        for_each = length(trimspace(var.api_jwt_issuer_secret)) > 0 ? [1] : []
        content {
          name = "API_JWT_ISSUER"
          value_source {
            secret_key_ref {
              secret  = var.api_jwt_issuer_secret
              version = "latest"
            }
          }
        }
      }
      dynamic "env" {
        for_each = length(trimspace(var.api_jwt_audience_secret)) > 0 ? [1] : []
        content {
          name = "API_JWT_AUDIENCE"
          value_source {
            secret_key_ref {
              secret  = var.api_jwt_audience_secret
              version = "latest"
            }
          }
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
        startup_cpu_boost = var.startup_cpu_boost
      }

      # Readiness: nginx up (static health)
      startup_probe {
        http_get { path = "/health" }
        initial_delay_seconds = 5
        period_seconds        = 2
        failure_threshold     = 60
      }

      liveness_probe {
        http_get { path = "/health" }
        period_seconds    = 10
        failure_threshold = 3
      }
    }
  }
  depends_on = [
    google_project_service.apis,
    google_project_iam_member.ecco_studio_logging,
    google_project_iam_member.ecco_studio_metrics,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "ecco_studio_invoker" {
  count    = local.create_ecco_studio ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.ecco_studio[0].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
