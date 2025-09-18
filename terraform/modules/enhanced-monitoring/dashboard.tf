# Advanced CloudWatch Dashboard for Senior SRE Monitoring
resource "aws_cloudwatch_dashboard" "healthhub_sre_dashboard" {
  dashboard_name = "${var.environment}-healthhub-sre-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # System Health Overview
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "healthhub-user-service-${var.environment}"],
            [".", "Errors", ".", "."],
            ["AWS/ApiGateway", "Count", "ApiName", var.api_gateway_name],
            [".", "4XXError", ".", "."],
            [".", "5XXError", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "System Health Overview"
          period  = 300
          stat    = "Sum"
        }
      },
      
      # Lambda Performance Matrix
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", "healthhub-user-service-${var.environment}"],
            [".", ".", ".", "healthhub-ai-interaction-${var.environment}"],
            [".", ".", ".", "healthhub-medical-image-service-${var.environment}"],
            [".", ".", ".", "healthhub-transcription-service-${var.environment}"]
          ]
          view   = "timeSeries"
          region = data.aws_region.current.name
          title  = "Lambda Duration (ms)"
          period = 300
          stat   = "Average"
          yAxis = {
            left = {
              min = 0
              max = 30000
            }
          }
        }
      },

      # Error Rate Analysis
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["HealthHub/Logging", "CriticalErrors"],
            [".", "TimeoutErrors"],
            [".", "MemoryErrors"],
            ["HealthHub/Security", "AuthenticationFailures"]
          ]
          view   = "timeSeries"
          region = data.aws_region.current.name
          title  = "SRE Logging - Error Pattern Analysis"
          period = 300
          stat   = "Sum"
        }
      },

      # AI Services Performance
      {
        type   = "metric"
        x      = 8
        y      = 6
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["HealthHub/AI", "OpenAITokenUsage"],
            [".", "OpenAIResponseTime"],
            [".", "TranscriptionAccuracy"],
            [".", "VisionConfidenceScores"]
          ]
          view   = "timeSeries"
          region = data.aws_region.current.name
          title  = "Multi-Cloud AI Services Performance"
          period = 300
        }
      },

      # DynamoDB Performance
      {
        type   = "metric"
        x      = 16
        y      = 6
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "healthhub-users-${var.environment}"],
            [".", "ConsumedWriteCapacityUnits", ".", "."]
          ]
          view   = "timeSeries"
          region = data.aws_region.current.name
          title  = "DynamoDB Performance"
          period = 300
          stat   = "Sum"
        }
      },

      # Business KPIs
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["HealthHub/Business", "AppointmentsBooked"],
            [".", "TranscriptionsCompleted"],
            [".", "PatientRegistrations"],
            [".", "AIInteractions"]
          ]
          view   = "timeSeries"
          region = data.aws_region.current.name
          title  = "Healthcare Business KPIs"
          period = 300
          stat   = "Sum"
        }
      },

      # Cost & Quality Analysis
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["HealthHub/AI", "OpenAITokenUsage"],
            [".", "AzureSpeechFailures"],
            [".", "AIConfidenceScores"],
            [".", "TranscriptionAccuracy"]
          ]
          view   = "timeSeries"
          region = data.aws_region.current.name
          title  = "AI Cost vs Quality Analysis"
          period = 300
          annotations = {
            horizontal = [
              {
                label = "Quality Threshold"
                value = 95
              }
            ]
          }
        }
      }
    ]
  })
}

# Data source for current region
data "aws_region" "current" {}
