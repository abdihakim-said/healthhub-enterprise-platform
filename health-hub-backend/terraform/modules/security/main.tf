variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

# AWS Config for compliance monitoring (disabled due to account limits)
# resource "aws_config_configuration_recorder" "healthhub" {
#   name     = "${var.project_name}-${var.environment}-config-recorder"
#   role_arn = aws_iam_role.config.arn

#   recording_group {
#     all_supported                 = true
#     include_global_resource_types = true
#   }
# }

# resource "aws_config_delivery_channel" "healthhub" {
#   name           = "${var.project_name}-${var.environment}-config-delivery-channel"
#   s3_bucket_name = aws_s3_bucket.config.bucket
  
#   depends_on = [aws_config_configuration_recorder.healthhub]
# }

resource "aws_s3_bucket" "config" {
  bucket        = "${var.project_name}-${var.environment}-aws-config-${random_string.bucket_suffix.result}"
  force_destroy = true
}

resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id
  policy = data.aws_iam_policy_document.config_bucket_policy.json
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "config_bucket_policy" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.config.arn]
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }

  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.config.arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

resource "aws_iam_role" "config" {
  name = "${var.project_name}-${var.environment}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# AWS Config Rules for security compliance (disabled due to account limits)
# resource "aws_config_config_rule" "s3_bucket_public_access_prohibited" {
#   name = "${var.project_name}-${var.environment}-s3-bucket-public-access-prohibited"

#   source {
#     owner             = "AWS"
#     source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
#   }

#   depends_on = [aws_config_configuration_recorder.healthhub]
# }

# resource "aws_config_config_rule" "encrypted_volumes" {
#   name = "${var.project_name}-${var.environment}-encrypted-volumes"

#   source {
#     owner             = "AWS"
#     source_identifier = "ENCRYPTED_VOLUMES"
#   }

#   depends_on = [aws_config_configuration_recorder.healthhub]
# }

# resource "aws_config_config_rule" "lambda_function_public_access_prohibited" {
#   name = "${var.project_name}-${var.environment}-lambda-function-public-access-prohibited"

#   source {
#     owner             = "AWS"
#     source_identifier = "LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED"
#   }

#   depends_on = [aws_config_configuration_recorder.healthhub]
# }

# CloudTrail for audit logging
resource "aws_cloudtrail" "healthhub" {
  name           = "${var.project_name}-${var.environment}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail.bucket

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::hh-${var.environment}-*/*"]
    }
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

resource "aws_s3_bucket" "cloudtrail" {
  bucket        = "${var.project_name}-${var.environment}-cloudtrail-${random_string.bucket_suffix.result}"
  force_destroy = true
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = data.aws_iam_policy_document.cloudtrail_bucket_policy.json
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.cloudtrail.arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }

  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.cloudtrail.arn]
  }
}

# GuardDuty for threat detection
resource "aws_guardduty_detector" "healthhub" {
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = false
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-guardduty"
    Environment = var.environment
  }
}
