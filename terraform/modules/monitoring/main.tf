variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "alert_email" {
  description = "Email for alerts"
  type        = string
  default     = ""
}

# SNS Topic for alerts (can be created independently)
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-alerts"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_sns_topic_subscription" "email_alerts" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Dashboard (basic setup, will be enhanced after Serverless deployment)
resource "aws_cloudwatch_dashboard" "healthhub" {
  dashboard_name = "HealthHub-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 6
        properties = {
          markdown = "# HealthHub Monitoring Dashboard\n\n**Environment**: ${var.environment}\n**Status**: Infrastructure Ready\n\nThis dashboard will be populated with metrics after Serverless deployment.\n\n## Next Steps:\n1. Deploy Serverless application: `npm run deploy:${var.environment}`\n2. Update monitoring: `terraform apply -var-file=environments/${var.environment}.tfvars`\n\n## Resources Created:\n- ✅ SNS Topic for alerts\n- ✅ CloudWatch Dashboard\n- ⏳ Lambda function monitoring (pending Serverless deployment)\n- ⏳ DynamoDB monitoring (pending Serverless deployment)"
        }
      }
    ]
  })
}

# X-Ray tracing configuration
resource "aws_xray_sampling_rule" "healthhub" {
  rule_name      = "HealthHub-${var.environment}"
  priority       = 9000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.1
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"
}
