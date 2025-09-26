output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID for medical images"
  value       = aws_cloudfront_distribution.medical_images.id
}

output "cloudfront_domain_name" {
  description = "CloudFront Distribution domain name"
  value       = aws_cloudfront_distribution.medical_images.domain_name
}

output "cloudfront_distribution_arn" {
  description = "CloudFront Distribution ARN"
  value       = aws_cloudfront_distribution.medical_images.arn
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN for UK health compliance"
  value       = aws_wafv2_web_acl.medical_images_uk.arn
}

output "access_logs_bucket" {
  description = "S3 bucket for CloudFront access logs"
  value       = aws_s3_bucket.cloudfront_logs.bucket
}

output "uk_compliance_enabled" {
  description = "Whether UK health compliance features are enabled"
  value       = var.enable_uk_compliance
}
