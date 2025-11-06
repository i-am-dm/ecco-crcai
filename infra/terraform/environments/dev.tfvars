project_id = "crcai-477403"
region     = "us-central1"
location   = "US"
bucket_name = "ecco-studio-platform-data-dev"
# Image vars usually set by Cloud Build deploy trigger via -var overrides.
# Leave blank to skip service creation until images are supplied.
snapshot_builder_image = ""
manifest_writer_image  = ""
index_writer_image     = ""
rules_engine_image     = ""
