output "frontend_url" {
  description = "CloudFront distribution URL for the frontend"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "frontend_distribution_id" {
  description = "CloudFront distribution ID for the frontend"
  value       = aws_cloudfront_distribution.frontend.id
}

output "frontend_s3_bucket" {
  description = "S3 bucket name for frontend hosting"
  value       = aws_s3_bucket.frontend.bucket
}

output "api_gateway_url" {
  description = "API Gateway URL configured for the frontend"
  value       = var.api_gateway_url
}

output "deployment_commands" {
  description = "Commands to update frontend deployment"
  value = {
    build_frontend = "cd ../health-hub-frontend && npm run build"
    sync_to_s3     = "aws s3 sync ../health-hub-frontend/dist/ s3://${aws_s3_bucket.frontend.bucket}/ --delete"
    invalidate_cdn = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.frontend.id} --paths '/*'"
  }
}
