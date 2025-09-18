# Core Working Monitoring (No Log Filters)

# Log Groups for retention management
resource "aws_cloudwatch_log_group" "centralized_logging" {
  for_each = var.lambda_functions

  name              = "/aws/lambda/${each.value}"
  retention_in_days = var.log_retention_days
  
  tags = {
    Environment = var.environment
    Service     = each.key
    LogType     = "application"
  }
}

# Basic Log Ingestion Monitoring
resource "aws_cloudwatch_metric_alarm" "log_ingestion_rate" {
  alarm_name          = "${var.environment}-log-ingestion-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "IncomingLogEvents"
  namespace           = "AWS/Logs"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10000"
  alarm_description   = "High log ingestion rate - potential cost impact"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LogGroupName = "/aws/lambda/healthhub-ai-interaction-${var.environment}"
  }
}

# Advanced Log Insights Queries (These work fine)
resource "aws_cloudwatch_query_definition" "error_analysis" {
  name = "${var.environment}-error-analysis"

  log_group_names = [
    for func_name in values(var.lambda_functions) : "/aws/lambda/${func_name}"
  ]

  query_string = <<EOF
fields @timestamp, @message, @requestId, @type
| filter @message like /ERROR/
| stats count() by bin(5m), @requestId
| sort @timestamp desc
| limit 100
EOF
}

resource "aws_cloudwatch_query_definition" "performance_analysis" {
  name = "${var.environment}-performance-analysis"

  log_group_names = [
    for func_name in values(var.lambda_functions) : "/aws/lambda/${func_name}"
  ]

  query_string = <<EOF
fields @timestamp, @duration, @billedDuration, @maxMemoryUsed, @requestId
| filter @type = "REPORT"
| stats avg(@duration), max(@duration), min(@duration), avg(@maxMemoryUsed) by bin(5m)
| sort @timestamp desc
EOF
}

resource "aws_cloudwatch_query_definition" "business_metrics" {
  name = "${var.environment}-business-metrics"

  log_group_names = [
    "/aws/lambda/healthhub-ai-interaction-${var.environment}",
    "/aws/lambda/healthhub-user-service-${var.environment}"
  ]

  query_string = <<EOF
fields @timestamp, @message, @requestId
| filter @message like /Patient/ or @message like /AI/
| stats count() by bin(1h)
| sort @timestamp desc
EOF
}
