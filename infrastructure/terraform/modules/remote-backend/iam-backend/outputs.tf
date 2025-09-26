# Outputs for IAM Backend Child Module

output "policy_arn" {
  description = "ARN of the IAM policy for backend access"
  value       = aws_iam_policy.terraform_backend.arn
}

output "policy_name" {
  description = "Name of the IAM policy for backend access"
  value       = aws_iam_policy.terraform_backend.name
}

output "cicd_role_arn" {
  description = "ARN of the CI/CD role (if created)"
  value       = var.create_cicd_role ? aws_iam_role.terraform_cicd[0].arn : null
}

output "cicd_role_name" {
  description = "Name of the CI/CD role (if created)"
  value       = var.create_cicd_role ? aws_iam_role.terraform_cicd[0].name : null
}

output "developer_group_name" {
  description = "Name of the developer group (if created)"
  value       = var.create_developer_group ? aws_iam_group.terraform_developers[0].name : null
}

output "developer_group_arn" {
  description = "ARN of the developer group (if created)"
  value       = var.create_developer_group ? aws_iam_group.terraform_developers[0].arn : null
}
