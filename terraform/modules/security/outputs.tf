output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = aws_cloudtrail.healthhub.arn
}

output "config_recorder_name" {
  description = "AWS Config recorder name"
  value       = aws_config_configuration_recorder.healthhub.name
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = aws_guardduty_detector.healthhub.id
}

output "config_bucket_name" {
  description = "AWS Config S3 bucket name"
  value       = aws_s3_bucket.config.bucket
}

output "cloudtrail_bucket_name" {
  description = "CloudTrail S3 bucket name"
  value       = aws_s3_bucket.cloudtrail.bucket
}
