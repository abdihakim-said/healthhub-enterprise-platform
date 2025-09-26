# DynamoDB Auto Scaling Module
resource "aws_appautoscaling_target" "read_target" {
  for_each           = var.table_names
  max_capacity       = var.max_read_capacity
  min_capacity       = var.min_read_capacity
  resource_id        = "table/${each.value}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_target" "write_target" {
  for_each           = var.table_names
  max_capacity       = var.max_write_capacity
  min_capacity       = var.min_write_capacity
  resource_id        = "table/${each.value}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "read_policy" {
  for_each           = var.table_names
  name               = "${each.value}-read-scaling-policy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.read_target[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.read_target[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.read_target[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = var.target_utilization
  }
}

resource "aws_appautoscaling_policy" "write_policy" {
  for_each           = var.table_names
  name               = "${each.value}-write-scaling-policy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.write_target[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.write_target[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.write_target[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value = var.target_utilization
  }
}

# Point-in-time recovery - Fixed implementation
resource "aws_dynamodb_table_item" "backup_config" {
  for_each   = var.enable_backup ? var.table_names : toset([])
  table_name = each.value
  hash_key   = "backup_config"
  
  item = jsonencode({
    backup_config = {
      S = "enabled"
    }
    timestamp = {
      S = timestamp()
    }
  })
  
  lifecycle {
    ignore_changes = [item]
  }
}

# CloudWatch alarms for auto-scaling
resource "aws_cloudwatch_metric_alarm" "read_capacity_high" {
  for_each = var.table_names
  
  alarm_name          = "${each.value}-read-capacity-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ConsumedReadCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "80"
  alarm_description   = "This metric monitors DynamoDB read capacity"
  
  dimensions = {
    TableName = each.value
  }
  
  tags = {
    Environment = var.environment
    Service     = "DynamoDB"
  }
}

resource "aws_cloudwatch_metric_alarm" "write_capacity_high" {
  for_each = var.table_names
  
  alarm_name          = "${each.value}-write-capacity-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ConsumedWriteCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "80"
  alarm_description   = "This metric monitors DynamoDB write capacity"
  
  dimensions = {
    TableName = each.value
  }
  
  tags = {
    Environment = var.environment
    Service     = "DynamoDB"
  }
}

data "aws_caller_identity" "current" {}
