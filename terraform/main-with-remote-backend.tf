# Updated main.tf with remote backend configuration
# Replace your existing main.tf with this after running the bootstrap module

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
  
  # Remote S3 backend configuration
  # Replace these values with outputs from the bootstrap module
  backend "s3" {
    bucket         = "healthhub-terraform-state-XXXXXXXX"  # From bootstrap output
    key            = "environments/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "healthhub-terraform-locks"          # From bootstrap output
    encrypt        = true
  }
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
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
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

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Region      = data.aws_region.current.name
    AccountId   = data.aws_caller_identity.current.account_id
  }
}

# Secrets Module for secure API key management
module "secrets" {
  source = "./modules/secrets"
  
  project_name = var.project_name
  environment  = var.environment
  
  tags = local.common_tags
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  alert_email  = var.alert_email
  
  tags = local.common_tags
}

# Security Module
module "security" {
  source = "./modules/security"
  
  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  
  tags = local.common_tags
}

# Frontend Module for React application deployment
module "frontend" {
  source = "./modules/frontend"
  
  project_name     = var.project_name
  environment      = var.environment
  aws_region       = var.aws_region
  api_gateway_url  = "https://m8vbgbh2hl.execute-api.us-east-1.amazonaws.com"
  
  tags = local.common_tags
}

# CloudFront Module for UK Health Compliance (can be enabled per environment)
module "cloudfront" {
  source = "./modules/cloudfront"
  count  = var.enable_uk_compliance ? 1 : 0
  
  project_name         = var.project_name
  environment          = var.environment
  aws_region           = var.aws_region
  enable_uk_compliance = var.enable_uk_compliance
  s3_bucket_id         = module.frontend.s3_bucket_id
  
  tags = local.common_tags
}

# Outputs
output "environment" {
  description = "Current environment"
  value       = var.environment
}

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

output "cloudfront_domain_name" {
  description = "CloudFront domain for medical images"
  value       = var.enable_uk_compliance ? module.cloudfront[0].cloudfront_domain_name : null
}

output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID"
  value       = var.enable_uk_compliance ? module.cloudfront[0].cloudfront_distribution_id : null
}

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

output "backend_info" {
  description = "Information about the Terraform backend"
  value = {
    backend_type = "s3"
    state_bucket = "Check bootstrap module output"
    lock_table   = "Check bootstrap module output"
    environment  = var.environment
    state_key    = "environments/${var.environment}/terraform.tfstate"
  }
}
