# Infra: Terraform

This folder provisions the core storage and eventing for JSON-in-GCS persistence.

What it creates
- GCS bucket with UBLA, PAP enforced, versioning on, lifecycle for snapshots
- Pub/Sub topics + DLQs and subscriptions for history and snapshots
- Cloud Run handlers (snapshot-builder, manifest-writer, index-writer, rules-engine) with per-service service accounts, Pub/Sub push subscriptions, and path-scoped bucket IAM (when images provided)
- Optional CMEK (toggle via `enable_cmek`)
- Optional path-scoped IAM condition for an investor read-only service account
- BigQuery datasets per env (`analytics_dev|stg|prod`), BigLake connection, external tables over snapshots, views, and optional scheduled loads
 - Cloud Run Jobs + Cloud Scheduler to run the manifest compactor (delta hourly, full nightly)

Prereqs
- Terraform >= 1.5
- GCP project with owner/editor to bootstrap

Usage
1) Initialize and set variables (recommend workspaces per env):
   - `terraform init`
   - `terraform workspace new dev || terraform workspace select dev`
   - `terraform apply -var project_id=YOUR_PROJECT -var region=us-central1`

2) Optional vars:
   - `-var bucket_name=ecco-studio-platform-data`
   - `-var enable_cmek=true` (will create a KMS key ring/key)
   - `-var investor_ro_service_account=investor-ro@YOUR_PROJECT.iam.gserviceaccount.com`
   - `-var manifest_compactor_image=us-central1-docker.pkg.dev/YOUR_PROJECT/containers/manifest-compactor:latest`
   - `-var scheduler_service_account_email=scheduler@YOUR_PROJECT.iam.gserviceaccount.com` (auto-created if omitted)
   - `-var job_service_account_email=compactor@YOUR_PROJECT.iam.gserviceaccount.com` (auto-created if omitted)
   - `-var compactor_delta_schedule="0 * * * *"` (hourly) | `-var compactor_full_schedule="0 3 * * *"`
   - `-var compactor_entities=["ventures","rounds","ideas","cap_tables"]`
   - `-var snapshot_builder_image=us-docker.pkg.dev/PROJECT/handlers/snapshot-builder:tag` (similarly for `manifest_writer_image`, `index_writer_image`, `rules_engine_image`). Leave blank to skip deploying that service.

Notes
- GCS notifications for `history/*` across all entities can’t be precisely expressed via a single prefix. We publish broad `env/` finalization events and filter in handlers or at subscriber-level if desired.
- Lifecycle transitions for `history/` to Nearline/Coldline are documented in runbooks and can be added once exact prefixes are finalized.
- BigQuery resources live in `bigquery.tf`. Validate with a test query in `analytics_dev` after apply.
 - For compactor jobs: ensure the container image exists and is accessible. If hosted in Artifact Registry, grant the job service account `roles/artifactregistry.reader`.
- Pub/Sub push subscriptions only render when the corresponding handler image var is non-empty; supply digests or tags produced by CI.
