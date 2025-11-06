terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }
}

provider "google" {}

resource "google_project" "new" {
  project_id      = var.project_id
  name            = var.project_name
  auto_create_network = false
  labels          = var.labels
  org_id          = var.org_id != "" ? var.org_id : null
  folder_id       = var.folder_id != "" ? var.folder_id : null
}

resource "google_project_service" "core" {
  for_each = toset([
    "cloudresourcemanager.googleapis.com",
    "serviceusage.googleapis.com",
    "iam.googleapis.com",
    "cloudbilling.googleapis.com",
  ])
  project                    = google_project.new.project_id
  service                    = each.key
  disable_dependent_services = false
}

resource "google_billing_project_info" "billing" {
  project         = google_project.new.project_id
  billing_account = var.billing_account
  depends_on      = [google_project_service.core]
}

output "project_id" { value = google_project.new.project_id }
output "project_number" { value = google_project.new.number }

