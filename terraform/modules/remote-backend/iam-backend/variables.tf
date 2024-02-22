# Variables for IAM Backend Child Module

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket for Terraform state"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table for state locking"
  type        = string
}

variable "create_cicd_role" {
  description = "Create IAM role for CI/CD systems"
  type        = bool
  default     = true
}

variable "create_developer_group" {
  description = "Create IAM group for developers"
  type        = bool
  default     = true
}

variable "trusted_role_arns" {
  description = "List of ARNs that can assume the CI/CD role"
  type        = list(string)
  default     = []
}

variable "external_id" {
  description = "External ID for additional security when assuming roles"
  type        = string
  default     = null
}

variable "cross_account_role_arns" {
  description = "List of cross-account role ARNs that need backend access"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
