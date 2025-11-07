project_id   = "crc-ai"
region       = "us-central1"
bucket_name  = "ecco-studio-platform-data-dev"

# Leave images blank to skip deploying specific services via this module
# (current UI+API unified service is deployed separately as ecco-studio)
api_edge_image        = ""
snapshot_builder_image = ""
manifest_writer_image  = ""
index_writer_image     = ""
rules_engine_image     = ""
search_feed_image      = ""

# Optional: Secret names for API JWT config (only used if api_edge_image is set)
# api_jwt_issuer_secret   = "idp-issuer"
# api_jwt_audience_secret = "idp-audience"

# Runtime tuning
container_concurrency = 16
timeout_seconds       = 30
startup_cpu_boost     = true
storage_backend       = "gcs"

# Unified ecco-studio service (UI+API) image
ecco_studio_image = "us-central1-docker.pkg.dev/crc-ai/services/ecco-studio:latest"
