variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "region" {
  type        = string
  description = "Default region for resources"
  default     = "us-central1"
}

variable "location" {
  type        = string
  description = "GCS bucket location (multi-region like US or region)"
  default     = "US"
}

variable "bucket_name" {
  type        = string
  description = "Primary data bucket name"
  default     = "ecco-studio-platform-data"
}

variable "enable_cmek" {
  type        = bool
  description = "Enable CMEK for bucket encryption"
  default     = false
}

variable "kms_key_rotation_period" {
  type        = string
  description = "CMEK rotation period (e.g., 7776000s = 90 days)"
  default     = "7776000s"
}

variable "investor_ro_service_account" {
  type        = string
  description = "Optional SA email to grant read-only access to prod snapshots via IAM condition"
  default     = ""
}

variable "manifest_compactor_image" {
  type        = string
  description = "Container image for manifest-compactor (Cloud Run Job)"
  default     = ""
}

variable "compactor_envs" {
  type        = list(string)
  description = "Environments to schedule compaction for"
  default     = ["dev", "stg", "prod"]
}

variable "compactor_entities" {
  type        = list(string)
  description = "Entity path segments to compact (e.g., ventures, ideas, rounds, cap_tables)"
  default     = ["ventures", "ideas", "rounds", "cap_tables"]
}

variable "compactor_shards" {
  type        = number
  description = "Number of shards to generate for manifest indices"
  default     = 256
}

variable "compactor_delta_schedule" {
  type        = string
  description = "Cron schedule for delta (since-window) compaction"
  default     = "0 * * * *" # hourly
}

variable "compactor_full_schedule" {
  type        = string
  description = "Cron schedule for full compaction"
  default     = "0 3 * * *" # daily @ 03:00 UTC
}

variable "compactor_delta_since" {
  type        = string
  description = "Since window for delta compaction (e.g., 1h, 30m)"
  default     = "1h"
}

variable "job_service_account_email" {
  type        = string
  description = "Service account email for Cloud Run Job (leave empty to create one)"
  default     = ""
}

variable "scheduler_service_account_email" {
  type        = string
  description = "Service account email for Cloud Scheduler to invoke jobs (leave empty to create one)"
  default     = ""
}

variable "snapshot_builder_image" {
  type        = string
  description = "Container image (fully qualified) for the snapshot-builder Cloud Run service. Leave blank to skip creation."
  default     = ""
}

variable "manifest_writer_image" {
  type        = string
  description = "Container image for the manifest-writer Cloud Run service. Leave blank to skip creation."
  default     = ""
}

variable "index_writer_image" {
  type        = string
  description = "Container image for the index-writer Cloud Run service. Leave blank to skip creation."
  default     = ""
}

variable "rules_engine_image" {
  type        = string
  description = "Container image for the rules-engine Cloud Run service. Leave blank to skip creation."
  default     = ""
}
