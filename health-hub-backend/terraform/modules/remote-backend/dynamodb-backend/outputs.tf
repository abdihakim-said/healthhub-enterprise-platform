# Outputs for DynamoDB Backend Child Module

output "table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.terraform_locks.name
}

output "table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.terraform_locks.arn
}

output "table_id" {
  description = "ID of the DynamoDB table"
  value       = aws_dynamodb_table.terraform_locks.id
}

output "billing_mode" {
  description = "Billing mode of the DynamoDB table"
  value       = aws_dynamodb_table.terraform_locks.billing_mode
}

output "encryption_enabled" {
  description = "Whether encryption is enabled"
  value       = var.enable_encryption
}

output "point_in_time_recovery_enabled" {
  description = "Whether point-in-time recovery is enabled"
  value       = var.enable_point_in_time_recovery
}

output "deletion_protection_enabled" {
  description = "Whether deletion protection is enabled"
  value       = var.enable_deletion_protection
}

output "cloudwatch_alarms" {
  description = "CloudWatch alarm names created for monitoring"
  value = var.enable_monitoring ? [
    aws_cloudwatch_metric_alarm.dynamodb_read_throttle[0].alarm_name,
    aws_cloudwatch_metric_alarm.dynamodb_write_throttle[0].alarm_name
  ] : []
}
