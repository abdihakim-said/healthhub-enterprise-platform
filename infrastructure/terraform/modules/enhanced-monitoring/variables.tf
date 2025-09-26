variable "environment" {
  description = "Environment name"
  type        = string
}

variable "alert_emails" {
  description = "List of email addresses for alerts"
  type        = list(string)
}

variable "lambda_functions" {
  description = "Map of Lambda functions to monitor"
  type        = map(string)
  default = {
    "user-service"           = "healthhub-user-service-production"
    "ai-interaction"         = "healthhub-ai-interaction-production"
    "medical-image"          = "healthhub-medical-image-service-production"
    "transcription"          = "healthhub-transcription-service-production"
    "appointment"            = "healthhub-appointment-service-production"
    "doctor-service"         = "healthhub-doctor-service-production"
    "patient-service"        = "healthhub-patient-service-production"
  }
}

variable "api_gateway_name" {
  description = "API Gateway name"
  type        = string
  default     = "healthhub-api"
}

variable "dynamodb_tables" {
  description = "Map of DynamoDB tables to monitor"
  type        = map(string)
  default = {
    "users"          = "healthhub-users"
    "appointments"   = "healthhub-appointments"
    "transcriptions" = "healthhub-transcriptions"
    "medical-images" = "healthhub-medical-images"
  }
}

variable "ai_service_function" {
  description = "AI service Lambda function name"
  type        = string
  default     = "healthhub-ai-interaction-production"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}
