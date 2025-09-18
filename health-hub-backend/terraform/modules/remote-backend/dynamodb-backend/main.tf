# DynamoDB Backend Child Module
# Creates and configures DynamoDB table for Terraform state locking

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name           = "${var.project_name}-terraform-locks"
  billing_mode   = var.billing_mode
  hash_key       = "LockID"

  # Provisioned throughput (only used if billing_mode is PROVISIONED)
  read_capacity  = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.write_capacity : null

  attribute {
    name = "LockID"
    type = "S"
  }

  # Server-side encryption
  server_side_encryption {
    enabled = var.enable_encryption
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Deletion protection
  deletion_protection_enabled = var.enable_deletion_protection

  tags = merge(var.tags, {
    Name        = "${var.project_name}-terraform-locks"
    Environment = var.environment
    Purpose     = "TerraformStateLocking"
  })

  lifecycle {
    prevent_destroy = true
  }
}

# CloudWatch alarms for DynamoDB monitoring
resource "aws_cloudwatch_metric_alarm" "dynamodb_read_throttle" {
  count = var.enable_monitoring ? 1 : 0
  
  alarm_name          = "${var.project_name}-dynamodb-read-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReadThrottledEvents"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DynamoDB read throttling"
  alarm_actions       = var.alarm_actions

  dimensions = {
    TableName = aws_dynamodb_table.terraform_locks.name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_write_throttle" {
  count = var.enable_monitoring ? 1 : 0
  
  alarm_name          = "${var.project_name}-dynamodb-write-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "WriteThrottledEvents"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DynamoDB write throttling"
  alarm_actions       = var.alarm_actions

  dimensions = {
    TableName = aws_dynamodb_table.terraform_locks.name
  }

  tags = var.tags
}
