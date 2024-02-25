terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
  
  # Using local backend for initial setup
  # backend "s3" {
  #   bucket = "healthhub-terraform-state"
  #   key    = "backend/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "HealthHub"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "healthhub"
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  default     = ""
}

variable "enable_uk_compliance" {
  description = "Enable UK health compliance features"
  type        = bool
  default     = true
}

# Secrets Module for secure API key management
module "secrets" {
  source = "./modules/secrets"
  
  project_name = var.project_name
  environment  = var.environment
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  alert_email  = var.alert_email
}

# Security Module
module "security" {
  source = "./modules/security"
  
  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
}

# Frontend Module for React application deployment
module "frontend" {
  source = "./modules/frontend"
  
  project_name     = var.project_name
  environment      = var.environment
  aws_region       = var.aws_region
  api_gateway_url  = "https://m8vbgbh2hl.execute-api.us-east-1.amazonaws.com"
}

# CloudFront Module for UK Health Compliance (temporarily disabled for Phase 1)
# module "cloudfront" {
#   source = "./modules/cloudfront"
#   
#   project_name         = var.project_name
#   environment          = var.environment
#   aws_region           = var.aws_region
#   enable_uk_compliance = var.enable_uk_compliance
# }

# Outputs
output "monitoring_dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = module.monitoring.dashboard_url
}

output "sns_topic_arn" {
  description = "SNS Topic ARN for alerts"
  value       = module.monitoring.sns_topic_arn
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN for audit logging"
  value       = module.security.cloudtrail_arn
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = module.security.guardduty_detector_id
}

output "alarm_names" {
  description = "List of created CloudWatch alarms"
  value       = module.monitoring.alarm_names
}

# CloudFront outputs (temporarily disabled for Phase 1)
# output "cloudfront_domain_name" {
#   description = "CloudFront domain for medical images"
#   value       = module.cloudfront.cloudfront_domain_name
# }

# output "cloudfront_distribution_id" {
#   description = "CloudFront Distribution ID"
#   value       = module.cloudfront.cloudfront_distribution_id
# }

output "uk_compliance_enabled" {
  description = "UK health compliance status"
  value       = var.enable_uk_compliance
}

output "secrets_setup_commands" {
  description = "Commands to populate secrets with actual API keys"
  value       = module.secrets.secrets_setup_commands
  sensitive   = true
}

output "openai_secret_name" {
  description = "AWS Secrets Manager secret name for OpenAI credentials"
  value       = module.secrets.openai_secret_name
}

output "azure_speech_secret_name" {
  description = "AWS Secrets Manager secret name for Azure Speech credentials"
  value       = module.secrets.azure_speech_secret_name
}

output "google_vision_secret_name" {
  description = "AWS Secrets Manager secret name for Google Vision credentials"
  value       = module.secrets.google_vision_secret_name
}

output "frontend_url" {
  description = "Frontend application URL"
  value       = module.frontend.frontend_url
}

output "api_gateway_url" {
  description = "Backend API Gateway URL"
  value       = module.frontend.api_gateway_url
}

output "deployment_commands" {
  description = "Commands for frontend deployment updates"
  value       = module.frontend.deployment_commands
}
