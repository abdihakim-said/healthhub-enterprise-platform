environment = "production"
project_name = "healthhub"
aws_region = "us-east-1"
alert_email = "admin@healthhub.com"
enable_uk_compliance = true

# Production-specific settings
enable_dynamodb_autoscaling = true
enable_backup = true
enable_waf = true
enable_vpc = true
enable_multi_az = true
enable_encryption = true

# Performance settings
lambda_reserved_concurrency = 100
dynamodb_read_capacity = 10
dynamodb_write_capacity = 10

# Security settings
enable_cloudtrail = true
enable_guardduty = true
enable_config = true
enable_secrets_rotation = true

# Monitoring settings
enable_detailed_monitoring = true
enable_xray_tracing = true
log_retention_days = 90
