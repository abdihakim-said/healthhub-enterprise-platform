# Variables for the bootstrap module

variable "aws_region" {
  description = "AWS region for backend resources"
  type        = string
  default     = "us-east-1"
  
  validation {
    condition = can(regex("^[a-z0-9-]+$", var.aws_region))
    error_message = "AWS region must be a valid region identifier."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "healthhub"
  
  validation {
    condition = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environments" {
  description = "List of environments that will use this backend"
  type        = list(string)
  default     = ["dev", "staging", "prod"]
  
  validation {
    condition = length(var.environments) > 0
    error_message = "At least one environment must be specified."
  }
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for DynamoDB table"
  type        = bool
  default     = true
}

variable "state_retention_days" {
  description = "Number of days to retain old state versions"
  type        = number
  default     = 90
  
  validation {
    condition = var.state_retention_days >= 1 && var.state_retention_days <= 365
    error_message = "State retention days must be between 1 and 365."
  }
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
  
  validation {
    condition = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch retention period."
  }
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "enable_mfa_delete" {
  description = "Enable MFA delete for S3 bucket (requires MFA to be configured)"
  type        = bool
  default     = false
}

variable "kms_key_id" {
  description = "KMS key ID for S3 bucket encryption (optional, uses AES256 if not provided)"
  type        = string
  default     = null
}
