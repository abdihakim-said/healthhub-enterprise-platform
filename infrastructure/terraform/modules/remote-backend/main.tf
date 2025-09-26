# Remote Backend Module - Parent Module
# This module creates S3 bucket and DynamoDB table for Terraform remote state

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
}

# Random suffix for unique bucket naming
resource "random_string" "backend_suffix" {
  length  = 10
  special = false
  upper   = false
}

# S3 bucket for Terraform state storage
module "s3_backend" {
  source = "./s3-backend"
  
  project_name    = var.project_name
  environment     = var.environment
  bucket_suffix   = random_string.backend_suffix.result
  aws_region      = var.aws_region
  
  tags = var.tags
}

# DynamoDB table for state locking
module "dynamodb_backend" {
  source = "./dynamodb-backend"
  
  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  
  tags = var.tags
}

# IAM policies for backend access
module "iam_backend" {
  source = "./iam-backend"
  
  project_name      = var.project_name
  environment       = var.environment
  s3_bucket_arn     = module.s3_backend.bucket_arn
  dynamodb_table_arn = module.dynamodb_backend.table_arn
  
  tags = var.tags
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
