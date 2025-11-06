variable "github_owner" {
  type        = string
  description = "GitHub owner/org for Cloud Build triggers"
  default     = "i-am-dm"
}

variable "github_repo" {
  type        = string
  description = "GitHub repository name for Cloud Build triggers"
  default     = "ecco-crcai"
}

variable "default_branch" {
  type        = string
  description = "Default branch to trigger builds on push"
  default     = "main"
}

variable "data_bucket_name" {
  type        = string
  description = "Primary data bucket (used for plan substitutions)"
  default     = "ecco-studio-platform-data"
}

variable "github_token_secret" {
  type        = string
  description = "Secret Manager resource name for GitHub token (projects/..../secrets/.../versions/latest)"
  default     = ""
}

resource "google_project_service" "cloudbuild" {
  service                    = "cloudbuild.googleapis.com"
  disable_dependent_services = false
}

resource "google_project_service" "pubsub" {
  service                    = "pubsub.googleapis.com"
  disable_dependent_services = false
}

data "google_project" "current" {}

# Grant Cloud Build SA permissions: artifact writer and editor for terraform apply
resource "google_project_iam_member" "cb_artifact_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${data.google_project.current.number}@cloudbuild.gserviceaccount.com"
}

resource "google_project_iam_member" "cb_editor" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${data.google_project.current.number}@cloudbuild.gserviceaccount.com"
}

# CI: Node build/test for libs and build images for services
resource "google_cloudbuild_trigger" "ci_push" {
  name = "ci-push"

  github {
    owner = var.github_owner
    name  = var.github_repo
    push {
      branch = var.default_branch
    }
  }

  build {
    step {
      name = "node:20"
      entrypoint = "bash"
      args = ["-lc", "npm ci && npm run build --workspaces && (cd libs/ts && npm test)"]
    }
    step {
      name = "gcr.io/cloud-builders/docker"
      entrypoint = "bash"
      args = ["-lc", "for s in services/*; do if [ -f \"$s/Dockerfile\" ]; then docker build -t us-docker.pkg.dev/$PROJECT_ID/ci/$(basename $s):$SHORT_SHA $s || true; fi; done"]
    }
    images = []
    options {
      logging = "CLOUD_LOGGING_ONLY"
    }
    timeout = "1200s"
  }
  depends_on = [google_project_service.cloudbuild]
}

# Terraform plan on infra changes
resource "google_cloudbuild_trigger" "tf_plan" {
  name = "terraform-plan"

  github {
    owner = var.github_owner
    name  = var.github_repo
    push {
      branch        = var.default_branch
      invert_regex  = false
    }
  }

  included_files = ["infra/terraform/**", ".terraform.lock.hcl"]

  build {
    step {
      name = "hashicorp/terraform:1.9.5"
      entrypoint = "sh"
      args = ["-lc", "cd infra/terraform && terraform init -input=false && terraform fmt -check && terraform validate && terraform plan -var project_id=$PROJECT_ID -var bucket_name=${var.data_bucket_name} -input=false -no-color"]
    }
    options { logging = "CLOUD_LOGGING_ONLY" }
    timeout = "900s"
  }
  depends_on = [google_project_service.cloudbuild]
}

# OpenAPI lint when spec changes
resource "google_cloudbuild_trigger" "openapi_lint" {
  name = "openapi-lint"

  github {
    owner = var.github_owner
    name  = var.github_repo
    push { branch = var.default_branch }
  }

  included_files = ["api/openapi.yaml"]

  build {
    step { name = "node:20" entrypoint = "bash" args = ["-lc", "npm i -g @redocly/cli && redocly lint api/openapi.yaml && redocly bundle api/openapi.yaml -o /workspace/openapi.bundle.yaml"] }
    artifacts { objects { location = "gs://$PROJECT_ID-build-artifacts/openapi/" paths = ["/workspace/openapi.bundle.yaml"] } }
    options { logging = "CLOUD_LOGGING_ONLY" }
  }
  depends_on = [google_project_service.cloudbuild]
}

# Sync TODOs to GitHub Issues on changes to TODO.md
resource "google_cloudbuild_trigger" "sync_todos" {
  name = "sync-todos"

  github { owner = var.github_owner name = var.github_repo push { branch = var.default_branch } }
  included_files = ["TODO.md", "tools/sync-todos/**"]

  build {
    step { name = "node:20" entrypoint = "bash" args = ["-lc", "npm ci && npm run build --workspaces && node tools/sync-todos/dist/index.js"] env = var.github_token_secret == "" ? [] : ["GH_TOKEN_SECRET=projects/$PROJECT_ID/secrets/${split(\"/\", var.github_token_secret)[3]}/versions/latest"] }
    available_secrets {
      secret_manager { env = "GH_TOKEN" version_name = var.github_token_secret }
    }
    secret_env = var.github_token_secret == "" ? [] : ["GH_TOKEN"]
    options { logging = "CLOUD_LOGGING_ONLY" }
  }
  depends_on = [google_project_service.cloudbuild]
}

# Deploy triggers per environment (build, push, apply images via Terraform)
resource "google_cloudbuild_trigger" "deploy_dev" {
  name = "deploy-dev"
  github { owner = var.github_owner name = var.github_repo push { branch = var.default_branch } }
  substitutions = { _AR_REGION = var.region, _AR_REPO = var.artifact_repository }
  build {
    step { name = "gcr.io/google.com/cloudsdktool/cloud-sdk" entrypoint = "bash" args = ["-lc", "gcloud auth configure-docker ${_AR_REGION}-docker.pkg.dev -q"] }
    step { name = "node:20" entrypoint = "bash" args = ["-lc", "npm ci && npm run build --workspaces"] }
    step {
      name = "gcr.io/google.com/cloudsdktool/cloud-sdk"
      entrypoint = "bash"
      args = ["-lc", <<-EOS
        set -euo pipefail
        HOST=${_AR_REGION}-docker.pkg.dev/$PROJECT_ID/${_AR_REPO}
        SERVICES="api-edge snapshot-builder manifest-writer index-writer rules-engine search-feed manifest-compactor"
        TFVARS=""
        for S in $SERVICES; do
          DIR="services/$S"
          if [ "$S" = "manifest-compactor" ]; then DIR="services/manifest-compactor"; fi
          if [ -d "$DIR" ]; then
            IMG="$HOST/$S:$SHORT_SHA"
            docker build -t "$IMG" "$DIR"
            docker push "$IMG"
            DIGEST=$(gcloud artifacts docker images describe "$IMG" --format='value(image_summary.digest)')
            case "$S" in
              api-edge) TFVARS="$TFVARS -var api_edge_image=$HOST/$S@$DIGEST";;
              snapshot-builder) TFVARS="$TFVARS -var snapshot_builder_image=$HOST/$S@$DIGEST";;
              manifest-writer) TFVARS="$TFVARS -var manifest_writer_image=$HOST/$S@$DIGEST";;
              index-writer) TFVARS="$TFVARS -var index_writer_image=$HOST/$S@$DIGEST";;
              rules-engine) TFVARS="$TFVARS -var rules_engine_image=$HOST/$S@$DIGEST";;
              search-feed) TFVARS="$TFVARS -var search_feed_image=$HOST/$S@$DIGEST";;
              manifest-compactor) TFVARS="$TFVARS -var manifest_compactor_image=$HOST/$S@$DIGEST";;
            esac
          fi
        done
        echo "$TFVARS" > /workspace/tfvars.txt
      EOS ]
    }
    step {
      name = "hashicorp/terraform:1.9.5"
      entrypoint = "sh"
      args = ["-lc", "cd infra/terraform && terraform init -input=false && terraform apply -auto-approve -var project_id=$PROJECT_ID $(cat /workspace/tfvars.txt)"]
    }
    options { logging = "CLOUD_LOGGING_ONLY" }
    timeout = "1800s"
  }
  depends_on = [google_project_service.cloudbuild, google_project_iam_member.cb_editor, google_project_iam_member.cb_artifact_writer]
}

resource "google_cloudbuild_trigger" "deploy_stg" {
  name = "deploy-stg"
  github { owner = var.github_owner name = var.github_repo push { branch = var.default_branch } }
  substitutions = { _AR_REGION = var.region, _AR_REPO = var.artifact_repository }
  approval_config { approval_required = true }
  build = google_cloudbuild_trigger.deploy_dev.build
  depends_on = [google_cloudbuild_trigger.deploy_dev]
}

resource "google_cloudbuild_trigger" "deploy_prod" {
  name = "deploy-prod"
  github { owner = var.github_owner name = var.github_repo push { branch = var.default_branch } }
  substitutions = { _AR_REGION = var.region, _AR_REPO = var.artifact_repository }
  approval_config { approval_required = true }
  build = google_cloudbuild_trigger.deploy_dev.build
  depends_on = [google_cloudbuild_trigger.deploy_dev]
}
