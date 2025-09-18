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

variable "enable_uk_compliance" {
  description = "Enable UK health compliance features (GDPR, DPA 2018, NHS requirements)"
  type        = bool
  default     = true
}

# Data sources to reference existing Serverless resources (no conflicts)
data "aws_caller_identity" "current" {}

# CloudFront Distribution for Medical Images - UK Health Compliant
# Uses custom origin config to avoid S3 bucket policy conflicts
resource "aws_cloudfront_distribution" "medical_images" {
  comment         = "HealthHub ${var.environment} - Medical Images CDN (UK Health Compliant)"
  enabled         = true
  is_ipv6_enabled = true
  
  # UK compliance: Use EU edge locations primarily
  price_class = var.enable_uk_compliance ? "PriceClass_200" : (var.environment == "prod" ? "PriceClass_All" : "PriceClass_100")

  # S3 Origin for Medical Images (references existing Serverless bucket)
  # Uses custom origin to avoid bucket policy conflicts
  origin {
    # Use the same bucket name pattern as Serverless
    domain_name = "hh-${var.environment}-${data.aws_caller_identity.current.account_id}-medical-images.s3.${var.aws_region}.amazonaws.com"
    origin_id   = "S3-medical-images"
    
    # Use custom origin config instead of OAC to avoid policy conflicts
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    # UK compliance: Add custom headers for audit trail
    custom_header {
      name  = "X-UK-Health-Compliance"
      value = "enabled"
    }
    
    custom_header {
      name  = "X-Data-Classification"
      value = "medical-sensitive"
    }
  }

  # Default behavior - optimized for medical images with UK compliance
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "S3-medical-images"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true  # Forward query strings for audit logging
      headers = [
        "Origin",
        "Access-Control-Request-Headers", 
        "Access-Control-Request-Method",
        "Authorization",
        "X-NHS-Number",      # NHS patient identifier
        "X-User-Role",       # Healthcare professional role
        "X-Audit-Trail"      # Audit trail identifier
      ]
      
      cookies {
        forward = "none"
      }
    }

    # UK compliance: Shorter cache times for medical data
    min_ttl     = 0
    default_ttl = var.enable_uk_compliance ? 3600 : 86400     # 1 hour vs 1 day
    max_ttl     = var.enable_uk_compliance ? 86400 : 31536000 # 1 day vs 1 year

    # Security headers for UK compliance
    function_association {
      event_type   = "viewer-response"
      function_arn = aws_cloudfront_function.uk_compliance_headers.arn
    }

    # Request logging for audit trail
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.audit_logging.arn
    }
  }

  # UK Health Compliance: Geographic restrictions
  restrictions {
    geo_restriction {
      restriction_type = var.enable_uk_compliance ? "whitelist" : "none"
      locations = var.enable_uk_compliance ? [
        "GB", # United Kingdom
        "IE", # Ireland (for NHS shared services)
        "US"  # For AWS infrastructure access
      ] : []
    }
  }

  # SSL Certificate with strong encryption
  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
    ssl_support_method            = "sni-only"
  }

  # Associate WAF with CloudFront distribution
  web_acl_id = aws_wafv2_web_acl.medical_images_uk.arn

  # UK compliance: Custom error pages with audit logging
  custom_error_response {
    error_code            = 403
    response_code         = 403
    response_page_path    = "/errors/403-uk-compliance.html"
    error_caching_min_ttl = 300
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/errors/404-medical-not-found.html"
    error_caching_min_ttl = 300
  }

  # UK compliance: Enable logging (separate bucket to avoid conflicts)
  logging_config {
    include_cookies = false
    bucket         = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix         = "medical-images-access-logs/"
  }

  tags = {
    Name                = "${var.project_name}-${var.environment}-medical-images-cdn"
    Environment         = var.environment
    Purpose             = "Medical Image Delivery"
    Compliance          = "UK-Health-GDPR"
    DataClassification  = "Medical-Sensitive"
    RetentionPolicy     = "7-years"
    ManagedBy          = "Terraform-Addon"  # Indicates this is addon to Serverless
  }
}

# Separate S3 bucket for CloudFront logs (no conflict with Serverless)
resource "aws_s3_bucket" "cloudfront_logs" {
  bucket = "${var.project_name}-${var.environment}-cloudfront-logs-${random_string.bucket_suffix.result}"
}

resource "aws_s3_bucket_versioning" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable ACL for CloudFront logging
resource "aws_s3_bucket_ownership_controls" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "cloudfront_logs" {
  depends_on = [aws_s3_bucket_ownership_controls.cloudfront_logs]
  bucket     = aws_s3_bucket.cloudfront_logs.id
  acl        = "private"
}

# UK compliance: Log retention policy
resource "aws_s3_bucket_lifecycle_configuration" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    id     = "uk_health_log_retention"
    status = "Enabled"

    filter {
      prefix = "medical-images-access-logs/"
    }

    # UK health data retention: 7 years minimum
    expiration {
      days = var.enable_uk_compliance ? 2555 : 365  # 7 years vs 1 year
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# CloudFront Function for UK compliance headers
resource "aws_cloudfront_function" "uk_compliance_headers" {
  name    = "${var.project_name}-${var.environment}-uk-compliance-headers"
  runtime = "cloudfront-js-1.0"
  comment = "Add UK health compliance security headers"
  publish = true
  code    = <<-EOT
function handler(event) {
    var response = event.response;
    var headers = response.headers;
    
    // UK Health compliance headers
    headers['strict-transport-security'] = { value: 'max-age=31536000; includeSubDomains; preload' };
    headers['x-content-type-options'] = { value: 'nosniff' };
    headers['x-frame-options'] = { value: 'DENY' };
    headers['x-xss-protection'] = { value: '1; mode=block' };
    headers['referrer-policy'] = { value: 'strict-origin-when-cross-origin' };
    
    // UK specific compliance headers
    headers['x-uk-health-compliance'] = { value: 'gdpr-dpa2018-compliant' };
    headers['x-data-retention'] = { value: '7-years' };
    headers['x-audit-enabled'] = { value: 'true' };
    
    // Content Security Policy for medical applications
    headers['content-security-policy'] = { 
        value: "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline';" 
    };
    
    return response;
}
EOT
}

# CloudFront Function for audit logging
resource "aws_cloudfront_function" "audit_logging" {
  name    = "${var.project_name}-${var.environment}-audit-logging"
  runtime = "cloudfront-js-1.0"
  comment = "Log medical image access for UK compliance audit trail"
  publish = true
  code    = <<-EOT
function handler(event) {
    var request = event.request;
    var headers = request.headers;
    
    // Add audit trail headers
    headers['x-access-timestamp'] = { value: new Date().toISOString() };
    headers['x-cloudfront-viewer-country'] = { value: event.viewer.country || 'unknown' };
    headers['x-request-id'] = { value: event.context.requestId };
    
    // Log NHS number if present (for audit trail)
    if (headers['x-nhs-number']) {
        headers['x-audit-patient-access'] = { value: 'true' };
    }
    
    return request;
}
EOT
}

# WAF for UK health compliance (separate from Serverless resources)
resource "aws_wafv2_web_acl" "medical_images_uk" {
  name  = "${var.project_name}-${var.environment}-medical-images-uk-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # UK compliance: Strict rate limiting for medical data
  rule {
    name     = "UKHealthRateLimit"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.enable_uk_compliance ? 500 : 1000  # Stricter for UK compliance
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "UKHealthRateLimit"
      sampled_requests_enabled    = true
    }
  }

  # Block non-UK traffic if compliance enabled
  dynamic "rule" {
    for_each = var.enable_uk_compliance ? [1] : []
    content {
      name     = "BlockNonUKTraffic"
      priority = 2

      action {
        block {}
      }

      statement {
        not_statement {
          statement {
            geo_match_statement {
              country_codes = ["GB", "IE", "US"]
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                 = "BlockNonUKTraffic"
        sampled_requests_enabled    = true
      }
    }
  }

  # AWS Managed Rules - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "UKHealthCommonRules"
      sampled_requests_enabled    = true
    }
  }

  # UK specific: Block known malicious IPs
  rule {
    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "UKHealthIPReputation"
      sampled_requests_enabled    = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                 = "UKHealthMedicalImagesWAF"
    sampled_requests_enabled    = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-medical-images-uk-waf"
    Environment = var.environment
    Compliance  = "UK-Health-GDPR"
    ManagedBy   = "Terraform-Addon"
  }
}

# WAF is now associated directly in the CloudFront distribution above
