project_id   = "crc-ai"
region       = "us-central1"
bucket_name  = "ecco-studio-platform-data-prod"

# Images to deploy for production (fill with promoted AR digests)
api_edge_image         = ""
snapshot_builder_image = ""
manifest_writer_image  = ""
index_writer_image     = ""
rules_engine_image     = ""
search_feed_image      = ""

# Optional secrets
# api_jwt_issuer_secret   = "idp-issuer"
# api_jwt_audience_secret = "idp-audience"

container_concurrency = 16
timeout_seconds       = 30
startup_cpu_boost     = true
