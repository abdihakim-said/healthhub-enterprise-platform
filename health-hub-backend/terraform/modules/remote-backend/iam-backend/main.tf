# IAM Backend Child Module
# Creates IAM policies and roles for Terraform remote backend access

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# IAM policy for Terraform backend access
resource "aws_iam_policy" "terraform_backend" {
  name        = "${var.project_name}-terraform-backend-policy"
  description = "IAM policy for Terraform remote backend access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3BucketAccess"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketVersioning",
          "s3:GetBucketLocation"
        ]
        Resource = var.s3_bucket_arn
      },
      {
        Sid    = "S3ObjectAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${var.s3_bucket_arn}/*"
      },
      {
        Sid    = "DynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:DescribeTable"
        ]
        Resource = var.dynamodb_table_arn
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${var.project_name}-terraform-backend-policy"
    Environment = var.environment
    Purpose     = "TerraformBackendAccess"
  })
}

# IAM role for CI/CD systems
resource "aws_iam_role" "terraform_cicd" {
  count = var.create_cicd_role ? 1 : 0
  
  name = "${var.project_name}-terraform-cicd-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = var.trusted_role_arns
        }
        Condition = var.external_id != null ? {
          StringEquals = {
            "sts:ExternalId" = var.external_id
          }
        } : {}
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${var.project_name}-terraform-cicd-role"
    Environment = var.environment
    Purpose     = "TerraformCICD"
  })
}

# Attach backend policy to CI/CD role
resource "aws_iam_role_policy_attachment" "terraform_cicd_backend" {
  count = var.create_cicd_role ? 1 : 0
  
  role       = aws_iam_role.terraform_cicd[0].name
  policy_arn = aws_iam_policy.terraform_backend.arn
}

# IAM group for developers who need backend access
resource "aws_iam_group" "terraform_developers" {
  count = var.create_developer_group ? 1 : 0
  
  name = "${var.project_name}-terraform-developers"
}

# Attach backend policy to developer group
resource "aws_iam_group_policy_attachment" "terraform_developers_backend" {
  count = var.create_developer_group ? 1 : 0
  
  group      = aws_iam_group.terraform_developers[0].name
  policy_arn = aws_iam_policy.terraform_backend.arn
}

# IAM policy document for cross-account access (if needed)
data "aws_iam_policy_document" "cross_account_backend" {
  count = length(var.cross_account_role_arns) > 0 ? 1 : 0

  statement {
    sid    = "CrossAccountBackendAccess"
    effect = "Allow"
    
    principals {
      type        = "AWS"
      identifiers = var.cross_account_role_arns
    }
    
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]
    
    resources = [
      var.s3_bucket_arn,
      "${var.s3_bucket_arn}/*"
    ]
  }
}

# S3 bucket policy for cross-account access
resource "aws_s3_bucket_policy" "cross_account_backend" {
  count = length(var.cross_account_role_arns) > 0 ? 1 : 0
  
  bucket = split(":", var.s3_bucket_arn)[5]  # Extract bucket name from ARN
  policy = data.aws_iam_policy_document.cross_account_backend[0].json
}
