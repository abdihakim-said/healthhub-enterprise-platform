# Outputs for the bootstrap module

output "s3_bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.arn
}

output "s3_bucket_region" {
  description = "Region of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.region
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
  description = "Backend configuration object for programmatic use"
  value = {
    bucket         = aws_s3_bucket.terraform_state.bucket
    region         = var.aws_region
    dynamodb_table = aws_dynamodb_table.terraform_locks.name
    encrypt        = true
    # Key will be environment-specific
    key_template   = "environments/{environment}/terraform.tfstate"
  }
}

output "backend_config_dev" {
  description = "Backend configuration for development environment"
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

output "backend_config_staging" {
  description = "Backend configuration for staging environment"
  value = <<-EOT
    backend "s3" {
      bucket         = "${aws_s3_bucket.terraform_state.bucket}"
      key            = "environments/staging/terraform.tfstate"
      region         = "${var.aws_region}"
      dynamodb_table = "${aws_dynamodb_table.terraform_locks.name}"
      encrypt        = true
    }
  EOT
}

output "backend_config_prod" {
  description = "Backend configuration for production environment"
  value = <<-EOT
    backend "s3" {
      bucket         = "${aws_s3_bucket.terraform_state.bucket}"
      key            = "environments/prod/terraform.tfstate"
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

output "cicd_role_name" {
  description = "Name of the CI/CD role for Terraform operations"
  value       = aws_iam_role.terraform_cicd.name
}

output "setup_commands" {
  description = "Commands to set up the remote backend"
  value = {
    bootstrap_init   = "cd bootstrap && terraform init"
    bootstrap_apply  = "cd bootstrap && terraform apply"
    main_init        = "cd .. && terraform init -migrate-state"
    verify_state     = "terraform state list"
  }
}

output "migration_instructions" {
  description = "Step-by-step instructions for migrating to remote backend"
  value = <<-EOT
    🚀 HealthHub Remote Backend Setup Instructions:
    
    1. 📋 Prerequisites:
       - AWS CLI configured with appropriate permissions
       - Terraform >= 1.0 installed
       - Current directory: health-hub-backend/terraform/
    
    2. 🏗️ Create Remote Backend Infrastructure:
       cd bootstrap
       terraform init
       terraform apply
    
    3. 📝 Update Main Configuration:
       Copy the backend configuration from the output above
       Paste it into ../main.tf (replace the commented backend block)
    
    4. 🔄 Migrate State:
       cd ..
       terraform init -migrate-state
       # Answer 'yes' when prompted to migrate state
    
    5. ✅ Verify Migration:
       terraform state list
       # Should show all your existing resources
    
    6. 🧹 Cleanup (Optional):
       # Remove local state files after successful migration
       rm -f terraform.tfstate*
    
    7. 🔒 Security:
       # The backend is now secured with:
       - S3 bucket encryption
       - DynamoDB state locking
       - IAM policies for access control
       - Versioning and lifecycle management
    
    Environment-specific state files will be stored as:
    - Dev: environments/dev/terraform.tfstate
    - Staging: environments/staging/terraform.tfstate
    - Prod: environments/prod/terraform.tfstate
  EOT
}

output "backend_security_features" {
  description = "Security features enabled for the remote backend"
  value = {
    s3_encryption           = "AES256"
    s3_versioning          = "Enabled"
    s3_public_access_block = "Enabled"
    dynamodb_encryption    = "Enabled"
    dynamodb_pitr          = var.enable_point_in_time_recovery
    iam_policies           = "Least privilege access"
    state_locking          = "DynamoDB-based"
    lifecycle_management   = "${var.state_retention_days} days retention"
  }
}

output "cost_optimization" {
  description = "Cost optimization features"
  value = {
    s3_lifecycle_policy    = "Transitions to IA after 30 days"
    s3_version_expiration  = "${var.state_retention_days} days"
    dynamodb_billing       = "Pay-per-request"
    cloudwatch_retention   = "${var.log_retention_days} days"
  }
}
