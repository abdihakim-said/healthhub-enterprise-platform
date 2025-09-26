# Bootstrap module to create remote backend infrastructure
# This should be run FIRST before the main Terraform configuration

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
  
  # Bootstrap uses local backend initially
  # After creation, main.tf will use the S3 backend created here
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "HealthHub"
      Environment = "bootstrap"
      ManagedBy   = "Terraform"
      Purpose     = "RemoteStateBackend"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for backend resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "healthhub"
}

variable "environments" {
  description = "List of environments that will use this backend"
  type        = list(string)
  default     = ["dev", "staging", "prod"]
}

# Random suffix for unique bucket naming
resource "random_string" "backend_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 bucket for Terraform state
resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.project_name}-terraform-state-${random_string.backend_suffix.result}"
  
  lifecycle {
    prevent_destroy = true
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    id     = "terraform_state_lifecycle"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }
  }
}

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name           = "${var.project_name}-terraform-locks"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name        = "${var.project_name}-terraform-locks"
    Purpose     = "TerraformStateLocking"
    Environment = "all"
  }
}

# IAM policy for Terraform backend access
resource "aws_iam_policy" "terraform_backend" {
  name        = "${var.project_name}-terraform-backend-policy"
  description = "IAM policy for Terraform remote backend access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketVersioning"
        ]
        Resource = aws_s3_bucket.terraform_state.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.terraform_state.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = aws_dynamodb_table.terraform_locks.arn
      }
    ]
  })
}

# IAM role for CI/CD (GitHub Actions, etc.)
resource "aws_iam_role" "terraform_cicd" {
  name = "${var.project_name}-terraform-cicd-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${var.project_name}-cicd"
          }
        }
      }
    ]
  })
}

# Attach backend policy to CI/CD role
resource "aws_iam_role_policy_attachment" "terraform_cicd_backend" {
  role       = aws_iam_role.terraform_cicd.name
  policy_arn = aws_iam_policy.terraform_backend.arn
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# CloudWatch Log Group for backend operations
resource "aws_cloudwatch_log_group" "terraform_backend" {
  name              = "/aws/terraform/${var.project_name}/backend"
  retention_in_days = 30

  tags = {
    Environment = "all"
    Purpose     = "TerraformBackendLogs"
  }
}

# Outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_locks.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_locks.arn
}

output "backend_config" {
  description = "Backend configuration for main Terraform files"
  value = {
    bucket         = aws_s3_bucket.terraform_state.bucket
    key            = "environments/{environment}/terraform.tfstate"
    region         = var.aws_region
    dynamodb_table = aws_dynamodb_table.terraform_locks.name
    encrypt        = true
  }
}

output "backend_config_hcl" {
  description = "HCL backend configuration to copy into main.tf"
  value = <<-EOT
    backend "s3" {
      bucket         = "${aws_s3_bucket.terraform_state.bucket}"
      key            = "environments/dev/terraform.tfstate"
      region         = "${var.aws_region}"
      dynamodb_table = "${aws_dynamodb_table.terraform_locks.name}"
      encrypt        = true
    }
  EOT
}

output "terraform_backend_policy_arn" {
  description = "ARN of the IAM policy for Terraform backend access"
  value       = aws_iam_policy.terraform_backend.arn
}

output "cicd_role_arn" {
  description = "ARN of the CI/CD role for Terraform operations"
  value       = aws_iam_role.terraform_cicd.arn
}

output "setup_instructions" {
  description = "Instructions for setting up the remote backend"
  value = <<-EOT
    1. Run this bootstrap configuration first:
       cd bootstrap && terraform init && terraform apply
    
    2. Copy the backend configuration to your main.tf:
       ${local.backend_config_hcl}
    
    3. Initialize the main configuration with the new backend:
       cd .. && terraform init -migrate-state
    
    4. Verify the state is now stored remotely:
       terraform state list
  EOT
}

# Local values for complex expressions
locals {
  backend_config_hcl = <<-EOT
    backend "s3" {
      bucket         = "${aws_s3_bucket.terraform_state.bucket}"
      key            = "environments/dev/terraform.tfstate"
      region         = "${var.aws_region}"
      dynamodb_table = "${aws_dynamodb_table.terraform_locks.name}"
      encrypt        = true
    }
  EOT
}
