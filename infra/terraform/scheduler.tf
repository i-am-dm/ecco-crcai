variable "dr_schedule_cron" {
  type        = string
  description = "Cron for quarterly DR reminder"
  default     = "0 13 1 1,4,7,10 *"
}

resource "google_pubsub_topic" "dr_reminder" {
  name = "dr-reminder"
}

resource "google_cloudbuild_trigger" "dr_issue" {
  name = "dr-issue"
  pubsub_config { topic = google_pubsub_topic.dr_reminder.id }
  build {
    step {
      name       = "gcr.io/google.com/cloudsdktool/cloud-sdk"
      entrypoint = "bash"
      args       = ["-lc", <<-EOF
        set -euo pipefail
        TITLE="DR Fire Drill - $(date -u +%F)"
        BODY='{"title":"'"${TITLE}"'","body":"Quarterly DR drill: restore, rebuild, CMEK, access. Envs: dev, stg.", "labels":["type: todo","drill"]}'
        curl -s -X POST -H "Authorization: token $GH_TOKEN" -H "Accept: application/vnd.github+json" \
          https://api.github.com/repos/${var.github_owner}/${var.github_repo}/issues -d "$BODY"
      EOF
      ]
      env = var.github_token_secret == "" ? [] : ["GH_TOKEN_SECRET=${var.github_token_secret}"]
    }
    available_secrets { secret_manager { env = "GH_TOKEN" version_name = var.github_token_secret } }
    secret_env = var.github_token_secret == "" ? [] : ["GH_TOKEN"]
    options { logging = "CLOUD_LOGGING_ONLY" }
  }
}

resource "google_cloud_scheduler_job" "dr_quarterly" {
  name        = "dr-quarterly"
  description = "Create DR drill issue quarterly"
  schedule    = var.dr_schedule_cron
  time_zone   = "Etc/UTC"
  pubsub_target {
    topic_name = google_pubsub_topic.dr_reminder.id
    data       = base64encode("trigger")
  }
  depends_on = [google_pubsub_topic.dr_reminder]
}

