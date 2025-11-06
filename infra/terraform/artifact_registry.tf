resource "google_project_service" "artifact" {
  service                    = "artifactregistry.googleapis.com"
  disable_dependent_services = false
}

variable "artifact_repository" {
  type        = string
  description = "Artifact Registry repository name for service images"
  default     = "services"
}

resource "google_artifact_registry_repository" "services" {
  repository_id = var.artifact_repository
  format        = "DOCKER"
  location      = var.region
  description   = "Service container images"
  depends_on    = [google_project_service.artifact]
}

