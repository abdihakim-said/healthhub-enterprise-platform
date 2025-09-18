output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "alarm_names" {
  description = "List of created CloudWatch alarms"
  value = concat(
    [for alarm in aws_cloudwatch_metric_alarm.lambda_errors : alarm.alarm_name],
    [for alarm in aws_cloudwatch_metric_alarm.lambda_duration : alarm.alarm_name],
    [aws_cloudwatch_metric_alarm.api_gateway_4xx.alarm_name],
    [aws_cloudwatch_metric_alarm.api_gateway_5xx.alarm_name],
    [for alarm in aws_cloudwatch_metric_alarm.dynamodb_throttles : alarm.alarm_name],
    [aws_cloudwatch_metric_alarm.openai_error_rate.alarm_name],
    [aws_cloudwatch_metric_alarm.log_ingestion_rate.alarm_name]
  )
}

output "dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.healthhub_sre_dashboard.dashboard_name}"
}

output "log_insights_queries" {
  description = "CloudWatch Logs Insights query definitions"
  value = {
    error_analysis       = aws_cloudwatch_query_definition.error_analysis.name
    performance_analysis = aws_cloudwatch_query_definition.performance_analysis.name
    business_metrics     = aws_cloudwatch_query_definition.business_metrics.name
  }
}
