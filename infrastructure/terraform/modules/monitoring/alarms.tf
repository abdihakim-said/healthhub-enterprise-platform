# CloudWatch Alarms for HealthHub Services

# Lambda Error Rate Alarms
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = toset([
    "hh-ai-interaction-${var.environment}-processVirtualAssistant",
    "hh-medical-image-${var.environment}-analyzeImage", 
    "hh-transcription-${var.environment}-transcribeAudio",
    "hh-user-${var.environment}-login"
  ])

  alarm_name          = "HealthHub-${var.environment}-${each.key}-Errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Lambda function ${each.key} error rate too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = each.key
  }

  tags = {
    Environment = var.environment
    Service     = "monitoring"
    AlertType   = "lambda-errors"
  }
}

# API Gateway Latency Alarm
resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "HealthHub-${var.environment}-API-Latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000"
  alarm_description   = "API Gateway latency too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Environment = var.environment
    Service     = "monitoring"
    AlertType   = "api-latency"
  }
}

# DynamoDB Throttling Alarms
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  for_each = toset([
    "hh-users-${var.environment}",
    "hh-medical-images-${var.environment}",
    "hh-ai-interactions-${var.environment}"
  ])

  alarm_name          = "HealthHub-${var.environment}-${each.key}-Throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ReadThrottles"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "DynamoDB table ${each.key} is being throttled"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TableName = each.key
  }

  tags = {
    Environment = var.environment
    Service     = "monitoring"
    AlertType   = "dynamodb-throttles"
  }
}

# AI Service Custom Metrics Alarms
resource "aws_cloudwatch_metric_alarm" "ai_service_failures" {
  alarm_name          = "HealthHub-${var.environment}-AI-Service-Failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "AI_Service_Failures"
  namespace           = "HealthHub/AI"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "AI services experiencing high failure rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Environment = var.environment
    Service     = "monitoring"
    AlertType   = "ai-failures"
  }
}

# Cost Monitoring Alarm
resource "aws_cloudwatch_metric_alarm" "high_costs" {
  alarm_name          = "HealthHub-${var.environment}-High-Costs"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  period              = "86400"  # Daily
  statistic           = "Maximum"
  threshold           = "100"    # $100/day
  alarm_description   = "Daily AWS costs exceeding budget"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    Currency = "USD"
  }

  tags = {
    Environment = var.environment
    Service     = "monitoring"
    AlertType   = "cost-control"
  }
}
