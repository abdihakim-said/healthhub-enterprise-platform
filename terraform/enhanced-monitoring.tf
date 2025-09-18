# Enhanced Monitoring Configuration
module "enhanced_monitoring" {
  source = "./modules/enhanced-monitoring"

  environment = var.environment
  alert_emails = [
    "admin@healthhub.com",
    "devops@healthhub.com"
  ]

  # Lambda functions from your existing deployment
  lambda_functions = {
    "user-service"           = "healthhub-user-service-${var.environment}"
    "ai-interaction"         = "healthhub-ai-interaction-${var.environment}"
    "medical-image"          = "healthhub-medical-image-service-${var.environment}"
    "transcription"          = "healthhub-transcription-service-${var.environment}"
    "appointment"            = "healthhub-appointment-service-${var.environment}"
    "doctor-service"         = "healthhub-doctor-service-${var.environment}"
    "patient-service"        = "healthhub-patient-service-${var.environment}"
  }

  api_gateway_name = "healthhub-api-${var.environment}"
  
  dynamodb_tables = {
    "users"          = "healthhub-users-${var.environment}"
    "appointments"   = "healthhub-appointments-${var.environment}"
    "transcriptions" = "healthhub-transcriptions-${var.environment}"
    "medical-images" = "healthhub-medical-images-${var.environment}"
  }
}

# Output monitoring information
output "monitoring_sns_topic" {
  description = "SNS topic for monitoring alerts"
  value       = module.enhanced_monitoring.sns_topic_arn
}

output "monitoring_dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = module.enhanced_monitoring.dashboard_url
}

output "created_alarms" {
  description = "List of created CloudWatch alarms"
  value       = module.enhanced_monitoring.alarm_names
}
