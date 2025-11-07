##############################################
# Manifest Compactor: Cloud Run Job + Scheduler
##############################################

# Enable required APIs
resource "google_project_service" "scheduler_apis" {
  for_each = toset([
    "run.googleapis.com",
    "cloudscheduler.googleapis.com",
  ])
  service                    = each.key
  disable_dependent_services = false
}

locals {
  compactor_matrix = { for combo in setproduct(var.compactor_envs, var.compactor_entities) :
    join("_", combo) => { env = combo[0], entity = combo[1] }
  }
}

# Optional SA for Cloud Run Job runtime
resource "google_service_account" "manifest_compactor_job" {
  count        = var.job_service_account_email == "" ? 1 : 0
  account_id   = "manifest-compactor-job"
  display_name = "Manifest Compactor Job"
}

# Optional SA for Cloud Scheduler invocations
resource "google_service_account" "scheduler_invoker" {
  count        = var.scheduler_service_account_email == "" ? 1 : 0
  account_id   = "scheduler-invoker"
  display_name = "Scheduler Invoker"
}

# Allow scheduler to run Cloud Run Jobs
resource "google_project_iam_member" "scheduler_can_run_jobs" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${var.scheduler_service_account_email != "" ? var.scheduler_service_account_email : google_service_account.scheduler_invoker[0].email}"
}

# Job SA can read/write bucket manifests
resource "google_storage_bucket_iam_member" "job_bucket_rw" {
  bucket = google_storage_bucket.data.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.job_service_account_email != "" ? var.job_service_account_email : google_service_account.manifest_compactor_job[0].email}"
}

# Cloud Run Job (delta compaction) per env+entity
resource "google_cloud_run_v2_job" "compactor_delta" {
  provider = google-beta
  for_each = local.compactor_matrix
  name     = "manifest-compactor-delta-${each.value.env}-${each.value.entity}"
  location = var.region
  labels = {
    project     = "crc-ai"
    managed_by  = "terraform"
    environment = each.value.env
  }
  template {
    template {
      service_account = var.job_service_account_email != "" ? var.job_service_account_email : google_service_account.manifest_compactor_job[0].email
      containers {
        image = var.manifest_compactor_image
        args  = [
          "--bucket", var.bucket_name,
          "--env", each.value.env,
          "--entity", each.value.entity,
          "--shards", tostring(var.compactor_shards),
          "--since", var.compactor_delta_since,
        ]
      }
    }
  }
  depends_on = [google_project_service.scheduler_apis]
}

# Cloud Run Job (full compaction) per env+entity
resource "google_cloud_run_v2_job" "compactor_full" {
  provider = google-beta
  for_each = local.compactor_matrix
  name     = "manifest-compactor-full-${each.value.env}-${each.value.entity}"
  location = var.region
  labels = {
    project     = "crc-ai"
    managed_by  = "terraform"
    environment = each.value.env
  }
  template {
    template {
      service_account = var.job_service_account_email != "" ? var.job_service_account_email : google_service_account.manifest_compactor_job[0].email
      containers {
        image = var.manifest_compactor_image
        args  = [
          "--bucket", var.bucket_name,
          "--env", each.value.env,
          "--entity", each.value.entity,
          "--shards", tostring(var.compactor_shards)
        ]
      }
    }
  }
  depends_on = [google_project_service.scheduler_apis]
}

# Scheduler jobs to trigger Cloud Run Jobs
resource "google_cloud_scheduler_job" "schedule_delta" {
  for_each = local.compactor_matrix
  name     = "manifest-compactor-delta-${each.value.env}-${each.value.entity}"
  region   = var.region
  schedule = var.compactor_delta_schedule
  time_zone = "UTC"

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${google_cloud_run_v2_job.compactor_delta[each.key].name}:run"
    headers = { "Content-Type" = "application/json" }
    oidc_token {
      service_account_email = var.scheduler_service_account_email != "" ? var.scheduler_service_account_email : google_service_account.scheduler_invoker[0].email
      audience              = "https://${var.region}-run.googleapis.com/"
    }
    body = base64encode("{}")
  }
}

resource "google_cloud_scheduler_job" "schedule_full" {
  for_each = local.compactor_matrix
  name     = "manifest-compactor-full-${each.value.env}-${each.value.entity}"
  region   = var.region
  schedule = var.compactor_full_schedule
  time_zone = "UTC"

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${google_cloud_run_v2_job.compactor_full[each.key].name}:run"
    headers = { "Content-Type" = "application/json" }
    oidc_token {
      service_account_email = var.scheduler_service_account_email != "" ? var.scheduler_service_account_email : google_service_account.scheduler_invoker[0].email
      audience              = "https://${var.region}-run.googleapis.com/"
    }
    body = base64encode("{}")
  }
}

output "compactor_jobs" {
  value = {
    delta = { for k, v in google_cloud_run_v2_job.compactor_delta : k => v.name }
    full  = { for k, v in google_cloud_run_v2_job.compactor_full  : k => v.name }
  }
}

