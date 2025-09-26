# Outputs for Remote Backend Module

output "s3_bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  value       = module.s3_backend.bucket_name
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for Terraform state"
  value       = module.s3_backend.bucket_arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for state locking"
  value       = module.dynamodb_backend.table_name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table for state locking"
  value       = module.dynamodb_backend.table_arn
}

output "backend_config" {
  description = "Backend configuration for Terraform"
  value = {
    bucket         = module.s3_backend.bucket_name
    region         = var.aws_region
    dynamodb_table = module.dynamodb_backend.table_name
    encrypt        = true
  }
}

output "backend_config_hcl" {
  description = "HCL backend configuration to add to main.tf"
  value = <<-EOT
    backend "s3" {
      bucket         = "${module.s3_backend.bucket_name}"
      key            = "environments/${var.environment}/terraform.tfstate"
      region         = "${var.aws_region}"
      dynamodb_table = "${module.dynamodb_backend.table_name}"
      encrypt        = true
    }
  EOT
}

output "iam_policy_arn" {
  description = "ARN of the IAM policy for backend access"
  value       = module.iam_backend.policy_arn
}

output "setup_commands" {
  description = "Commands to set up the remote backend"
  value = {
    init_command     = "terraform init"
    migrate_command  = "terraform init -migrate-state"
    verify_command   = "terraform state list"
  }
}

output "environment_configs" {
  description = "Backend configurations for different environments"
  value = {
    dev = {
      key = "environments/dev/terraform.tfstate"
      init_command = "terraform init -backend-config=\"key=environments/dev/terraform.tfstate\""
    }
    staging = {
      key = "environments/staging/terraform.tfstate"
      init_command = "terraform init -backend-config=\"key=environments/staging/terraform.tfstate\""
    }
    prod = {
      key = "environments/prod/terraform.tfstate"
      init_command = "terraform init -backend-config=\"key=environments/prod/terraform.tfstate\""
    }
  }
}
