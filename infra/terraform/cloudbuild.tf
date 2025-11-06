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

