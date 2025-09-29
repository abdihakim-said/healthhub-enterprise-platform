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
    local = {
      source  = "hashicorp/local"
      version = "~> 2.1"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.1"
    }
  }
  
  # Remote S3 backend configuration with workspace support
  backend "s3" {
    bucket         = "healthhub-terraform-state-880385175593"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    workspace_key_prefix = "environments"
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
  default     = "said.sre.dev@gmail.com"
}

variable "enable_uk_compliance" {
  description = "Enable UK health compliance features"
  type        = bool
  default     = true
}

# Production essentials
variable "enable_backup" {
  description = "Enable DynamoDB backups"
  type        = bool
  default     = false
}

variable "enable_waf" {
  description = "Enable WAF protection"
  type        = bool
  default     = false
}

variable "enable_autoscaling" {
  description = "Enable DynamoDB auto-scaling"
  type        = bool
  default     = false
}

variable "enable_dynamodb_autoscaling" {
  description = "Enable DynamoDB auto-scaling"
  type        = bool
  default     = false
}

variable "enable_vpc" {
  description = "Enable VPC deployment"
  type        = bool
  default     = false
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed monitoring"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

# Production-specific variables
# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values
locals {
  # Support workspace environments (dev/production)
  environment = terraform.workspace == "default" ? var.environment : terraform.workspace
  is_production = local.environment == "production"
  
  common_tags = {
    Project     = var.project_name
    Environment = local.environment
    Workspace   = terraform.workspace
    ManagedBy   = "Terraform"
    Region      = data.aws_region.current.name
    AccountId   = data.aws_caller_identity.current.account_id
  }
}

# Secrets Module for secure API key management
module "secrets" {
  source = "./modules/secrets"
  
  project_name = var.project_name
  environment  = local.environment
  
  # Credential variables - can be provided via terraform.tfvars or environment variables
  openai_api_key           = var.openai_api_key
  openai_assistant_id      = var.openai_assistant_id
  azure_speech_key         = var.azure_speech_key
  azure_speech_region      = var.azure_speech_region
  google_vision_credentials = var.google_vision_credentials
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name = var.project_name
  environment  = local.environment
  aws_region   = var.aws_region
  alert_email  = var.alert_email
}

# Security Module
module "security" {
  source = "./modules/security"
  
  project_name = var.project_name
  environment  = local.environment
  aws_region   = var.aws_region
}

# Data sources to get API Gateway URLs from deployed services
data "aws_apigatewayv2_api" "shared_api" {
  api_id = "cnc7dkr1sb"  # production-hh-user (shared API Gateway)
}

# Frontend Module for React application deployment
module "frontend" {
  source = "./modules/frontend"
  
  project_name            = var.project_name
  environment             = local.environment
  aws_region              = var.aws_region
  api_gateway_url         = data.aws_apigatewayv2_api.shared_api.api_endpoint
  ai_api_gateway_url      = data.aws_apigatewayv2_api.shared_api.api_endpoint
  medical_api_gateway_url = data.aws_apigatewayv2_api.shared_api.api_endpoint
  waf_web_acl_arn         = var.enable_waf ? module.waf[0].web_acl_arn : null
}

# WAF Module for API protection
module "waf" {
  count  = var.enable_waf ? 1 : 0
  source = "./modules/waf"

  project_name = var.project_name
  environment  = local.environment
  rate_limit   = local.is_production ? 5000 : 1000
}

# CloudFront Module for UK Health Compliance (can be enabled per environment)
module "cloudfront" {
  source = "./modules/cloudfront"
  count  = var.enable_uk_compliance ? 1 : 0
  
  project_name         = var.project_name
  environment          = local.environment
  aws_region           = var.aws_region
  enable_uk_compliance = var.enable_uk_compliance
}

# DynamoDB Auto-scaling Module
module "dynamodb_autoscaling" {
  count  = var.enable_dynamodb_autoscaling ? 1 : 0
  source = "./modules/dynamodb-autoscaling"
  
  table_names = toset([
    "hh-user-${local.environment}-users",
    "hh-ai-interaction-${local.environment}-ai-interactions", 
    "hh-patient-${local.environment}-patients",
    "hh-doctor-${local.environment}-doctors",
    "hh-appointment-${local.environment}-appointments",
    "hh-medical-image-${local.environment}-medical-images",
    "hh-transcription-${local.environment}-transcriptions"
  ])
  
  # Capacity settings based on environment
  min_read_capacity  = local.is_production ? 10 : 5
  max_read_capacity  = local.is_production ? 1000 : 100
  min_write_capacity = local.is_production ? 10 : 5
  max_write_capacity = local.is_production ? 1000 : 100
  
  # Performance settings
  target_utilization = 70
  
  # Backup settings
  enable_backup = local.is_production
  
  environment = local.environment
  aws_region  = var.aws_region
}

# Enhanced Monitoring Module
module "enhanced_monitoring" {
  source = "./modules/enhanced-monitoring"
  
  environment = local.environment
  alert_emails = [var.alert_email]
  
  lambda_functions = {
    "ai-interaction" = "hh-ai-interaction-${local.environment}-processVirtualAssistant"
    "medical-image"  = "hh-medical-image-${local.environment}-analyzeImage"
    "transcription"  = "hh-transcription-${local.environment}-transcribeAudio"
    "user-service"   = "hh-user-${local.environment}-login"
  }
  
  ai_service_function = "hh-ai-interaction-${local.environment}-processVirtualAssistant"
  log_retention_days = 30
}

# Outputs
output "environment" {
  description = "Current environment"
  value       = local.environment
}

output "workspace" {
  description = "Current workspace"
  value       = terraform.workspace
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN (if enabled)"
  value       = var.enable_waf ? module.waf[0].web_acl_arn : null
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

output "dynamodb_autoscaling_status" {
  description = "DynamoDB auto-scaling configuration"
  value = var.enable_dynamodb_autoscaling ? {
    enabled = true
    tables  = module.dynamodb_autoscaling[0].table_names
    targets = length(module.dynamodb_autoscaling[0].autoscaling_targets.read_targets)
    policies = length(module.dynamodb_autoscaling[0].autoscaling_policies.read_policies)
  } : {
    enabled = false
    message = "Set enable_dynamodb_autoscaling = true to enable"
  }
}
