# Missing Log Metric Filters for Senior Showcase

# Azure Speech API Errors
resource "aws_cloudwatch_log_metric_filter" "azure_speech_errors" {
  name           = "azure-speech-errors"
  log_group_name = "/aws/lambda/${var.transcription_function}"
  pattern        = "[timestamp, request_id, AZURE_SPEECH_ERROR, ...]"

  metric_transformation {
    name      = "AzureSpeechErrors"
    namespace = "HealthHub/AI/Real"
    value     = "1"
    unit      = "Count"
  }
}

# Google Vision API Errors  
resource "aws_cloudwatch_log_metric_filter" "google_vision_errors" {
  name           = "google-vision-errors"
  log_group_name = "/aws/lambda/${var.medical_image_function}"
  pattern        = "[timestamp, request_id, GOOGLE_VISION_ERROR, ...]"

  metric_transformation {
    name      = "GoogleVisionErrors" 
    namespace = "HealthHub/AI/Real"
    value     = "1"
    unit      = "Count"
  }
}

# Patient Interaction Events
resource "aws_cloudwatch_log_metric_filter" "patient_interactions" {
  name           = "patient-interactions"
  log_group_name = "/aws/lambda/${var.ai_service_function}"
  pattern        = "[timestamp, request_id, PATIENT_INTERACTION, patient_id, interaction_type]"

  metric_transformation {
    name      = "PatientInteractions"
    namespace = "HealthHub/Business/Real"
    value     = "1"
    unit      = "Count"
  }
}

# Medical Image Analysis Events
resource "aws_cloudwatch_log_metric_filter" "medical_image_analysis" {
  name           = "medical-image-analysis"
  log_group_name = "/aws/lambda/${var.medical_image_function}"
  pattern        = "[timestamp, request_id, IMAGE_ANALYSIS, confidence_score]"

  metric_transformation {
    name      = "MedicalImageAnalysis"
    namespace = "HealthHub/Business/Real"
    value     = "1" 
    unit      = "Count"
  }
}

# DynamoDB Throttling Events
resource "aws_cloudwatch_log_metric_filter" "dynamodb_throttles" {
  name           = "dynamodb-throttles"
  log_group_name = "/aws/lambda/${var.ai_service_function}"
  pattern        = "[timestamp, request_id, DYNAMODB_THROTTLE, table_name]"

  metric_transformation {
    name      = "DynamoDBThrottles"
    namespace = "HealthHub/Database/Real"
    value     = "1"
    unit      = "Count"
  }
}

# Variables for function names
variable "transcription_function" {
  description = "Transcription service function name"
  type        = string
  default     = "hh-transcription-production-transcribeAudio"
}

variable "medical_image_function" {
  description = "Medical image service function name" 
  type        = string
  default     = "hh-medical-image-production-analyzeImage"
}
