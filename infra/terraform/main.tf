locals {
  bucket_name = var.bucket_name
}

resource "google_project_service" "apis" {
  for_each = toset([
    "storage.googleapis.com",
    "pubsub.googleapis.com",
    "cloudkms.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
  ])
  service                    = each.key
  disable_dependent_services = false
}

resource "google_kms_key_ring" "data" {
  count    = var.enable_cmek ? 1 : 0
  name     = "data-keyring"
  location = var.location
}

resource "google_kms_crypto_key" "data" {
  count           = var.enable_cmek ? 1 : 0
  name            = "storage-cmek"
  key_ring        = google_kms_key_ring.data[0].id
  rotation_period = var.kms_key_rotation_period
  lifecycle {
    prevent_destroy = true
  }
}

resource "google_storage_bucket" "data" {
  name          = local.bucket_name
  location      = var.location
  storage_class = "STANDARD"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  dynamic "encryption" {
    for_each = var.enable_cmek ? [1] : []
    content {
      default_kms_key_name = google_kms_crypto_key.data[0].id
    }
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      with_state         = "ARCHIVED" # non-current versions
      num_newer_versions = 10         # keep last N versions
      matches_prefix = [
        "env/prod/snapshots/",
        "env/stg/snapshots/",
        "env/dev/snapshots/",
      ]
    }
  }

  # Delete non-current snapshot versions older than 30 days
  lifecycle_rule {
    action { type = "Delete" }
    condition {
      is_live       = false
      age           = 30
      matches_prefix = [
        "env/prod/snapshots/",
        "env/stg/snapshots/",
        "env/dev/snapshots/",
      ]
    }
  }

  # Transition history objects to Nearline after 30 days, Coldline after 180 days
  dynamic "lifecycle_rule" {
    for_each = [
      {
        class           = "NEARLINE"
        age             = 30
      },
      {
        class           = "COLDLINE"
        age             = 180
      }
    ]
    content {
      action {
        type          = "SetStorageClass"
        storage_class = lifecycle_rule.value.class
      }
      condition {
        age = lifecycle_rule.value.age
        matches_prefix = local.history_prefixes
      }
    }
  }

  # Optionally set storage class for history after some time (documented in runbooks; refine later)
}

# Seed env prefixes (placeholders)
resource "google_storage_bucket_object" "prefix_placeholders" {
  for_each = toset([
    "env/dev/.keep",
    "env/stg/.keep",
    "env/prod/.keep",
  ])
  name    = each.key
  bucket  = google_storage_bucket.data.name
  content = ""
}

# Pub/Sub topics
resource "google_pubsub_topic" "history_events" {
  name = "gcs-history-events"
}

resource "google_pubsub_topic" "snapshot_events" {
  name = "gcs-snapshot-events"
}

resource "google_pubsub_topic" "history_dlq" {
  name = "gcs-history-events-dlq"
}

resource "google_pubsub_topic" "snapshot_dlq" {
  name = "gcs-snapshot-events-dlq"
}

# Subscriptions with DLQ
resource "google_pubsub_subscription" "history_sub" {
  name  = "history-events-sub"
  topic = google_pubsub_topic.history_events.name

  ack_deadline_seconds       = 20
  message_retention_duration = "604800s" # 7 days

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.history_dlq.id
    max_delivery_attempts = 5
  }
}

resource "google_pubsub_subscription" "snapshots_sub" {
  name  = "snapshot-events-sub"
  topic = google_pubsub_topic.snapshot_events.name

  ack_deadline_seconds       = 20
  message_retention_duration = "604800s"

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.snapshot_dlq.id
    max_delivery_attempts = 5
  }
}

# GCS → Pub/Sub notifications
resource "google_storage_notification" "history_notification" {
  bucket             = google_storage_bucket.data.name
  topic              = google_pubsub_topic.history_events.id
  payload_format     = "JSON_API_V1"
  event_types        = ["OBJECT_FINALIZE"]
  object_name_prefix = "env/" # Broad; handlers filter for history/* paths
  depends_on         = [google_project_service.apis]
}

resource "google_storage_notification" "snapshot_notification" {
  bucket             = google_storage_bucket.data.name
  topic              = google_pubsub_topic.snapshot_events.id
  payload_format     = "JSON_API_V1"
  event_types        = ["OBJECT_FINALIZE"]
  object_name_prefix = "env/" # Broad; ideally set to env/*/snapshots/, but multiple envs
  depends_on         = [google_project_service.apis]
}

# Example IAM Condition: investor read-only over prod snapshots (optional)
resource "google_storage_bucket_iam_member" "investor_ro_snapshots" {
  count  = var.investor_ro_service_account == "" ? 0 : 1
  bucket = google_storage_bucket.data.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${var.investor_ro_service_account}"

  condition {
    title       = "ProdSnapshotsOnly"
    description = "Restrict to env/prod/snapshots path"
    expression  = "resource.name.startsWith(\"projects/_/buckets/${google_storage_bucket.data.name}/objects/env/prod/snapshots/\")"
  }
}

locals {
  handler_configs = {
    snapshot_builder = {
      image           = var.snapshot_builder_image
      topic_type      = "history"
      subscription_id = "snapshot-builder-sub"
      service_name    = "snapshot-builder"
      env = [
        {
          name  = "DATA_BUCKET"
          value = google_storage_bucket.data.name
        }
      ]
      bucket_role = "roles/storage.objectAdmin"
      bucket_condition = {
        title       = "SnapshotsWrite"
        description = "Allow writes under env/*/snapshots/"
        # Matches projects/_/buckets/<bucket>/objects/env/(dev|stg|prod)/snapshots/...
        expression = "resource.name.matches(\"projects/_/buckets/${bucket}/objects/env/(dev|stg|prod)/snapshots/.*\")"
      }
      needs_secret_access = false
    }

    manifest_writer = {
      image           = var.manifest_writer_image
      topic_type      = "snapshot"
      subscription_id = "manifest-writer-sub"
      service_name    = "manifest-writer"
      env = [
        {
          name  = "DATA_BUCKET"
          value = google_storage_bucket.data.name
        }
      ]
      bucket_role = "roles/storage.objectAdmin"
      bucket_condition = {
        title       = "ManifestsWrite"
        description = "Allow writes under env/*/manifests/"
        expression  = "resource.name.matches(\"projects/_/buckets/${bucket}/objects/env/(dev|stg|prod)/manifests/.*\")"
      }
      needs_secret_access = false
    }

    index_writer = {
      image           = var.index_writer_image
      topic_type      = "snapshot"
      subscription_id = "index-writer-sub"
      service_name    = "index-writer"
      env = [
        {
          name  = "DATA_BUCKET"
          value = google_storage_bucket.data.name
        }
      ]
      bucket_role = "roles/storage.objectAdmin"
      bucket_condition = {
        title       = "IndicesWrite"
        description = "Allow writes under env/*/indices/"
        expression  = "resource.name.matches(\"projects/_/buckets/${bucket}/objects/env/(dev|stg|prod)/indices/.*\")"
      }
      needs_secret_access = false
    }

    rules_engine = {
      image           = var.rules_engine_image
      topic_type      = "snapshot"
      subscription_id = "rules-engine-sub"
      service_name    = "rules-engine"
      env = [
        {
          name  = "DATA_BUCKET"
          value = google_storage_bucket.data.name
        }
      ]
      bucket_role = "roles/storage.objectAdmin"
      bucket_condition = {
        title       = "RulesAccess"
        description = "Allow reads of rules/ and writes to reports/alerts plus rule state."
        expression = join(" || ", [
          "resource.name.matches(\"projects/_/buckets/${bucket}/objects/env/(dev|stg|prod)/rules/.*\")",
          "resource.name.matches(\"projects/_/buckets/${bucket}/objects/env/(dev|stg|prod)/reports/alerts/.*\")",
          "resource.name.matches(\"projects/_/buckets/${bucket}/objects/env/(dev|stg|prod)/rules/_state/.*\")"
        ])
      }
      needs_secret_access = true
    }
  }

  active_handlers = {
    for key, cfg in local.handler_configs : key => cfg
    if length(trim(cfg.image)) > 0
  }
}

# History object prefixes across envs/entities for lifecycle transitions
locals {
  history_entities = [
    "ideas",
    "ventures",
    "resources",
    "budgets",
    "kpis",
    "investors",
    "partners",
    "services",
    "talent",
    "experiments",
    "rounds",
    "cap_tables",
    "playbooks",
    "benchmarks",
    "reports",
    "models",
    "simulations",
  ]
  history_prefixes = flatten([
    for e in ["dev", "stg", "prod"] : [
      for seg in local.history_entities : "env/${e}/${seg}/"
    ]
  ])
}

# Enable Cloud Audit Logs (Admin + Data Access)
resource "google_project_iam_audit_config" "all_services" {
  project = var.project_id
  service = "allServices"

  audit_log_config { log_type = "ADMIN_READ" }
  audit_log_config { log_type = "DATA_READ" }
  audit_log_config { log_type = "DATA_WRITE" }
}

resource "google_service_account" "handler" {
  for_each     = local.active_handlers
  account_id   = replace("${each.value.service_name}-sa", "_", "-")
  display_name = "Cloud Run ${replace(each.value.service_name, "-", " ")}"
}

resource "google_project_iam_member" "handler_logging" {
  for_each = local.active_handlers
  project  = var.project_id
  role     = "roles/logging.logWriter"
  member   = "serviceAccount:${google_service_account.handler[each.key].email}"
}

resource "google_project_iam_member" "handler_metrics" {
  for_each = local.active_handlers
  project  = var.project_id
  role     = "roles/monitoring.metricWriter"
  member   = "serviceAccount:${google_service_account.handler[each.key].email}"
}

resource "google_project_iam_member" "handler_secret_access" {
  for_each = {
    for key, cfg in local.active_handlers : key => cfg
    if try(cfg.needs_secret_access, false)
  }
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.handler[each.key].email}"
}

resource "google_storage_bucket_iam_member" "handler_bucket_access" {
  for_each = local.active_handlers
  bucket   = google_storage_bucket.data.name
  role     = each.value.bucket_role
  member   = "serviceAccount:${google_service_account.handler[each.key].email}"

  condition {
    title       = each.value.bucket_condition.title
    description = each.value.bucket_condition.description
    expression  = replace(each.value.bucket_condition.expression, "${bucket}", google_storage_bucket.data.name)
  }
}

resource "google_cloud_run_service" "handler" {
  for_each = local.active_handlers
  name     = each.value.service_name
  project  = var.project_id
  location = var.region

  template {
    metadata {
      annotations = {
        "run.googleapis.com/ingress"       = "all"
        "autoscaling.knative.dev/minScale" = "0"
        "run.googleapis.com/client-name"   = "terraform"
      }
    }
    spec {
      service_account_name = google_service_account.handler[each.key].email
      containers {
        image = each.value.image
        dynamic "env" {
          for_each = concat(each.value.env, [{ name = "PORT", value = "8080" }])
          content {
            name  = env.value.name
            value = env.value.value
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.apis]
}

resource "google_cloud_run_service_iam_member" "invoker" {
  for_each = local.active_handlers
  location = google_cloud_run_service.handler[each.key].location
  project  = var.project_id
  service  = google_cloud_run_service.handler[each.key].name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.handler[each.key].email}"
}

resource "google_pubsub_subscription" "handler" {
  for_each = local.active_handlers

  name  = each.value.subscription_id
  topic = each.value.topic_type == "history" ? google_pubsub_topic.history_events.name : google_pubsub_topic.snapshot_events.name

  ack_deadline_seconds       = 20
  message_retention_duration = "604800s"

  push_config {
    push_endpoint = google_cloud_run_service.handler[each.key].status[0].url
    oidc_token {
      service_account_email = google_service_account.handler[each.key].email
      audience              = google_cloud_run_service.handler[each.key].status[0].url
    }
  }

  dead_letter_policy {
    dead_letter_topic     = each.value.topic_type == "history" ? google_pubsub_topic.history_dlq.id : google_pubsub_topic.snapshot_dlq.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

output "bucket_name" {
  value = google_storage_bucket.data.name
}

output "topics" {
  value = {
    history  = google_pubsub_topic.history_events.name
    snapshot = google_pubsub_topic.snapshot_events.name
    dlqs     = [google_pubsub_topic.history_dlq.name, google_pubsub_topic.snapshot_dlq.name]
  }
}

output "handler_services" {
  value = {
    for key, svc in google_cloud_run_service.handler : key => {
      url             = svc.status[0].url
      subscription    = google_pubsub_subscription.handler[key].name
      service_account = google_service_account.handler[key].email
    }
  }
  description = "Cloud Run service endpoints, Pub/Sub subscriptions, and service accounts per handler (only for configured images)."
}
