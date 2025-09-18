output "autoscaling_targets" {
  description = "DynamoDB autoscaling targets"
  value = {
    read_targets  = aws_appautoscaling_target.read_target
    write_targets = aws_appautoscaling_target.write_target
  }
}

output "autoscaling_policies" {
  description = "DynamoDB autoscaling policies"
  value = {
    read_policies  = aws_appautoscaling_policy.read_policy
    write_policies = aws_appautoscaling_policy.write_policy
  }
}

output "table_names" {
  description = "DynamoDB table names with autoscaling enabled"
  value = var.table_names
}

output "cloudwatch_alarms" {
  description = "CloudWatch alarms for DynamoDB monitoring"
  value = {
    read_alarms  = aws_cloudwatch_metric_alarm.read_capacity_high
    write_alarms = aws_cloudwatch_metric_alarm.write_capacity_high
  }
}

output "autoscaling_summary" {
  description = "Summary of auto-scaling configuration"
  value = {
    tables_count = length(var.table_names)
    min_read     = var.min_read_capacity
    max_read     = var.max_read_capacity
    min_write    = var.min_write_capacity
    max_write    = var.max_write_capacity
    target_util  = var.target_utilization
  }
}
