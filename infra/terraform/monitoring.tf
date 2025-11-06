resource "google_project_service" "monitoring" {
  service                    = "monitoring.googleapis.com"
  disable_dependent_services = false
}

resource "google_monitoring_dashboard" "platform_ops" {
  dashboard_json = jsonencode({
    displayName = "Ecco Platform Ops"
    mosaicLayout = {
      columns = 48
      tiles = [
        {
          xPos = 0
          yPos = 0
          width = 24
          height = 8
          widget = {
            title = "Cloud Run requests by service"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"run.googleapis.com/request_count\""
                    }
                  }
                }
              ]
            }
          }
        },
        {
          xPos = 24
          yPos = 0
          width = 24
          height = 8
          widget = {
            title = "Cloud Run 5xx ratio"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilterRatio = {
                      numerator = { filter = "metric.type=\"run.googleapis.com/request_count\" AND metric.label.response_code_class=\"5xx\"" }
                      denominator = { filter = "metric.type=\"run.googleapis.com/request_count\"" }
                    }
                  }
                }
              ]
            }
          }
        },
        {
          xPos = 0
          yPos = 8
          width = 24
          height = 8
          widget = {
            title = "Pub/Sub backlog (num_undelivered_messages)"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"pubsub.googleapis.com/subscription/num_undelivered_messages\""
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    }
  })
}

resource "google_monitoring_alert_policy" "pubsub_backlog" {
  display_name = "Pub/Sub backlog high"
  combiner     = "OR"
  conditions {
    display_name = "Backlog over 100 for 15m"
    condition_threshold {
      filter          = "metric.type=\"pubsub.googleapis.com/subscription/num_undelivered_messages\""
      duration        = "900s"
      comparison      = "COMPARISON_GT"
      threshold_value = 100
      trigger { count = 1 }
    }
  }
}

resource "google_monitoring_alert_policy" "run_5xx" {
  display_name = "Cloud Run 5xx ratio high"
  combiner     = "OR"
  conditions {
    display_name = "5xx ratio > 5% for 10m"
    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_count\" AND metric.label.response_code_class=\"5xx\""
      duration        = "600s"
      comparison      = "COMPARISON_GT"
      threshold_value = 100
      trigger { count = 1 }
    }
  }
}
