variable "enable_api_gateway" {
  type        = bool
  description = "Enable API Gateway for API edge"
  default     = false
}

resource "google_project_service" "apigw" {
  count                      = var.enable_api_gateway ? 1 : 0
  service                    = "apigateway.googleapis.com"
  disable_dependent_services = false
}

resource "google_api_gateway_api" "api" {
  count       = var.enable_api_gateway ? 1 : 0
  api_id      = "ecco-api"
  display_name = "Ecco Studio API"
  depends_on  = [google_project_service.apigw]
}

resource "google_api_gateway_api_config" "api_cfg" {
  count     = var.enable_api_gateway ? 1 : 0
  api       = google_api_gateway_api.api[0].api_id
  api_config_id = "v1"
  openapi_documents {
    document {
      path = "${path.module}/../../api/openapi.yaml"
    }
  }
  depends_on = [google_api_gateway_api.api]
}

resource "google_api_gateway_gateway" "gw" {
  count      = var.enable_api_gateway ? 1 : 0
  gateway_id = "ecco-api-gw"
  api_config = google_api_gateway_api_config.api_cfg[0].id
  location   = var.region
}

output "api_gateway_url" {
  value       = var.enable_api_gateway ? google_api_gateway_gateway.gw[0].default_hostname : null
  description = "Default hostname for API Gateway"
}

