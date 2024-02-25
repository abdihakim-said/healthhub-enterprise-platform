variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

# AWS Secrets Manager for OpenAI credentials
resource "aws_secretsmanager_secret" "openai_credentials" {
  name        = "${var.project_name}/${var.environment}/openai-credentials"
  description = "OpenAI API credentials for HealthHub ${var.environment} environment"
  
  tags = {
    Name            = "${var.project_name}-${var.environment}-openai-credentials"
    Environment     = var.environment
    Service         = "ai-interaction-service"
    DataClass       = "sensitive"
    Compliance      = "UK-Health-GDPR"
  }
}

# OpenAI secret version (placeholder)
resource "aws_secretsmanager_secret_version" "openai_credentials" {
  secret_id = aws_secretsmanager_secret.openai_credentials.id
  secret_string = jsonencode({
    api_key      = "REPLACE_WITH_ACTUAL_OPENAI_KEY"
    assistant_id = "REPLACE_WITH_ACTUAL_ASSISTANT_ID"
    created_at   = timestamp()
    environment  = var.environment
  })
  
  lifecycle {
    ignore_changes = [secret_string]  # Don't overwrite manually updated values
  }
}

# AWS Secrets Manager for Azure Speech Service
resource "aws_secretsmanager_secret" "azure_speech_credentials" {
  name        = "${var.project_name}/${var.environment}/azure-speech-credentials"
  description = "Azure Speech Service credentials for HealthHub ${var.environment} environment"
  
  tags = {
    Name            = "${var.project_name}-${var.environment}-azure-speech-credentials"
    Environment     = var.environment
    Service         = "transcription-service"
    DataClass       = "sensitive"
    Compliance      = "UK-Health-GDPR"
  }
}

# Azure Speech secret version (placeholder)
resource "aws_secretsmanager_secret_version" "azure_speech_credentials" {
  secret_id = aws_secretsmanager_secret.azure_speech_credentials.id
  secret_string = jsonencode({
    speech_key    = "REPLACE_WITH_ACTUAL_AZURE_KEY"
    speech_region = "centralus"
    created_at    = timestamp()
    environment   = var.environment
  })
  
  lifecycle {
    ignore_changes = [secret_string]  # Don't overwrite manually updated values
  }
}

# AWS Secrets Manager for Google Cloud Vision credentials
resource "aws_secretsmanager_secret" "google_vision_credentials" {
  name        = "${var.project_name}/${var.environment}/google-vision-credentials"
  description = "Google Cloud Vision API credentials for HealthHub ${var.environment} environment"
  
  tags = {
    Name            = "${var.project_name}-${var.environment}-google-vision-credentials"
    Environment     = var.environment
    Service         = "medical-image-service"
    DataClass       = "sensitive"
    Compliance      = "UK-Health-GDPR"
  }
}

# Google Vision secret version (placeholder)
resource "aws_secretsmanager_secret_version" "google_vision_credentials" {
  secret_id = aws_secretsmanager_secret.google_vision_credentials.id
  secret_string = jsonencode({
    type                        = "service_account"
    project_id                  = "REPLACE_WITH_GOOGLE_PROJECT_ID"
    private_key_id              = "REPLACE_WITH_PRIVATE_KEY_ID"
    private_key                 = "REPLACE_WITH_PRIVATE_KEY"
    client_email                = "REPLACE_WITH_CLIENT_EMAIL"
    client_id                   = "REPLACE_WITH_CLIENT_ID"
    auth_uri                    = "https://accounts.google.com/o/oauth2/auth"
    token_uri                   = "https://oauth2.googleapis.com/token"
    auth_provider_x509_cert_url = "https://www.googleapis.com/oauth2/v1/certs"
    client_x509_cert_url        = "REPLACE_WITH_CERT_URL"
    created_at                  = timestamp()
    environment                 = var.environment
  })
  
  lifecycle {
    ignore_changes = [secret_string]  # Don't overwrite manually updated values
  }
}

# IAM policy for Lambda functions to access secrets
resource "aws_iam_policy" "secrets_access" {
  name        = "${var.project_name}-${var.environment}-secrets-access"
  description = "Allow HealthHub Lambda functions to access API credentials from Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSecretsManagerAccess"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.openai_credentials.arn,
          aws_secretsmanager_secret.azure_speech_credentials.arn,
          aws_secretsmanager_secret.google_vision_credentials.arn
        ]
      },
      {
        Sid    = "AllowKMSDecryption"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-secrets-policy"
    Environment = var.environment
    Purpose     = "Lambda-Secrets-Access"
  }
}

# Data source for current region
data "aws_region" "current" {}

# CloudWatch Log Group for secrets access auditing
resource "aws_cloudwatch_log_group" "secrets_audit" {
  name              = "/aws/secretsmanager/${var.project_name}/${var.environment}/audit"
  retention_in_days = 365  # 1 year retention

  tags = {
    Name        = "${var.project_name}-${var.environment}-secrets-audit"
    Environment = var.environment
    Purpose     = "Secrets-Access-Audit"
    Compliance  = "UK-Health-GDPR"
  }
}
