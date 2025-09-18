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

variable "api_gateway_url" {
  description = "API Gateway URL for the backend"
  type        = string
  default     = "https://eqd8yoyih2.execute-api.us-east-1.amazonaws.com"
}

variable "ai_api_gateway_url" {
  description = "AI API Gateway URL for AI services"
  type        = string
  default     = "https://j6doxodkt1.execute-api.us-east-1.amazonaws.com"
}

variable "medical_api_gateway_url" {
  description = "Medical API Gateway URL for medical image services"
  type        = string
  default     = "https://2zk81heev4.execute-api.us-east-1.amazonaws.com"
}

variable "waf_web_acl_arn" {
  description = "WAF Web ACL ARN for CloudFront protection"
  type        = string
  default     = null
}

# Data sources
data "aws_caller_identity" "current" {}

# S3 bucket for hosting the React frontend
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-${var.environment}-frontend-${random_string.bucket_suffix.result}"
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket public access block (we'll use CloudFront for public access)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket website configuration
resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"  # For SPA routing
  }
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.project_name}-${var.environment}-frontend-oac"
  description                       = "OAC for HealthHub frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront distribution for the frontend
resource "aws_cloudfront_distribution" "frontend" {
  comment         = "HealthHub ${var.environment} - Frontend Distribution"
  enabled         = true
  is_ipv6_enabled = true
  price_class     = var.environment == "prod" ? "PriceClass_All" : "PriceClass_100"
  default_root_object = "index.html"

  # S3 Origin
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-frontend"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600   # 1 hour
    max_ttl     = 86400  # 24 hours

    # Security headers
    function_association {
      event_type   = "viewer-response"
      function_arn = aws_cloudfront_function.security_headers.arn
    }
  }

  # Cache behavior for static assets (CSS, JS, images)
  ordered_cache_behavior {
    path_pattern           = "/assets/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "S3-frontend"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 31536000  # 1 year
    max_ttl     = 31536000  # 1 year
  }

  # Geographic restrictions (none for now, but ready for UK compliance)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL Certificate
  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  # WAF Association (if enabled)
  web_acl_id = var.waf_web_acl_arn

  # Custom error pages for SPA routing
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
    error_caching_min_ttl = 0
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-frontend-cdn"
    Environment = var.environment
    Purpose     = "Frontend-Distribution"
  }
}

# CloudFront function for security headers
resource "aws_cloudfront_function" "security_headers" {
  name    = "${var.project_name}-${var.environment}-frontend-security-headers"
  runtime = "cloudfront-js-1.0"
  comment = "Add security headers to frontend responses"
  publish = true
  code    = <<-EOT
function handler(event) {
    var response = event.response;
    var headers = response.headers;
    
    // Basic security headers only - no CSP to avoid blocking React
    headers['x-content-type-options'] = { value: 'nosniff' };
    headers['referrer-policy'] = { value: 'strict-origin-when-cross-origin' };
    
    return response;
}
EOT
}

# S3 bucket policy to allow CloudFront access
resource "aws_s3_bucket_policy" "frontend_cloudfront" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.frontend_cloudfront.json
}

data "aws_iam_policy_document" "frontend_cloudfront" {
  statement {
    sid    = "AllowCloudFrontServicePrincipal"
    effect = "Allow"
    
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    
    actions = [
      "s3:GetObject"
    ]
    
    resources = [
      "${aws_s3_bucket.frontend.arn}/*"
    ]
    
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend.arn]
    }
  }
}

# Upload frontend files to S3 (after build completes)
resource "aws_s3_object" "frontend_files" {
  depends_on = [null_resource.frontend_build]
  
  for_each = fileset("${path.root}/../../health-hub-frontend/dist", "**/*")
  
  bucket       = aws_s3_bucket.frontend.id
  key          = each.value
  source       = "${path.root}/../../health-hub-frontend/dist/${each.value}"
  content_type = lookup({
    "html" = "text/html"
    "css"  = "text/css"
    "js"   = "application/javascript"
    "json" = "application/json"
    "png"  = "image/png"
    "jpg"  = "image/jpeg"
    "jpeg" = "image/jpeg"
    "gif"  = "image/gif"
    "svg"  = "image/svg+xml"
    "ico"  = "image/x-icon"
  }, split(".", each.value)[length(split(".", each.value)) - 1], "application/octet-stream")
  
  etag = filemd5("${path.root}/../../health-hub-frontend/dist/${each.value}")
}

# Create environment configuration file for the frontend BEFORE building
resource "local_file" "frontend_env" {
  content = <<-EOT
VITE_API_BASE_URL=${var.api_gateway_url}
VITE_AI_API_BASE_URL=${var.ai_api_gateway_url}
VITE_MEDICAL_API_BASE_URL=${var.medical_api_gateway_url}
VITE_ENVIRONMENT=${var.environment}
VITE_CLOUDFRONT_URL=https://${aws_cloudfront_distribution.frontend.domain_name}
EOT
  
  filename = "${path.root}/../../health-hub-frontend/.env"
}

# Build the frontend with correct environment variables
resource "null_resource" "frontend_build" {
  depends_on = [local_file.frontend_env]
  
  triggers = {
    # Rebuild when API URLs change
    api_url = var.api_gateway_url
    ai_api_url = var.ai_api_gateway_url
    # Rebuild when environment changes
    environment = var.environment
  }
  
  provisioner "local-exec" {
    command = "cd ${path.root}/../../health-hub-frontend && npm run build"
    working_dir = path.root
  }
}
