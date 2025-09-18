# Infrastructure as Code Implementation

## 🏗️ **Terraform Infrastructure**

### **Main Infrastructure Configuration**

```hcl
# infrastructure/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
  
  backend "s3" {
    bucket         = "healthhub-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

# Multi-cloud provider configuration
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "HealthHub"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "DevOps-Team"
      CostCenter  = "Healthcare-IT"
    }
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Local values for resource naming
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    CreatedBy   = "DevOps-Team"
  }
  
  # Multi-cloud service mapping
  services = {
    aws = [
      "lambda",
      "api-gateway", 
      "dynamodb",
      "s3",
      "cloudwatch",
      "sns",
      "cloudtrail"
    ]
    azure = [
      "speech-services",
      "cognitive-services",
      "key-vault"
    ]
    gcp = [
      "vision-api",
      "healthcare-api",
      "bigquery"
    ]
  }
}

# AWS Infrastructure
module "aws_infrastructure" {
  source = "./modules/aws"
  
  name_prefix = local.name_prefix
  environment = var.environment
  
  # VPC Configuration
  vpc_cidr = var.vpc_cidr
  availability_zones = var.availability_zones
  
  # Lambda Configuration
  lambda_functions = var.lambda_functions
  
  # DynamoDB Configuration
  dynamodb_tables = var.dynamodb_tables
  
  # S3 Configuration
  s3_buckets = var.s3_buckets
  
  # Monitoring Configuration
  enable_detailed_monitoring = var.enable_detailed_monitoring
  alert_email = var.alert_email
  
  tags = local.common_tags
}

# Azure Infrastructure
module "azure_infrastructure" {
  source = "./modules/azure"
  
  name_prefix = local.name_prefix
  environment = var.environment
  location    = var.azure_location
  
  # Cognitive Services Configuration
  cognitive_services = var.cognitive_services
  
  # Key Vault Configuration
  key_vault_config = var.key_vault_config
  
  tags = local.common_tags
}

# Google Cloud Infrastructure
module "gcp_infrastructure" {
  source = "./modules/gcp"
  
  project_id  = var.gcp_project_id
  region      = var.gcp_region
  name_prefix = local.name_prefix
  environment = var.environment
  
  # Vision API Configuration
  vision_api_config = var.vision_api_config
  
  # Healthcare API Configuration
  healthcare_api_config = var.healthcare_api_config
  
  labels = {
    project     = var.project_name
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Cross-cloud networking and security
module "security" {
  source = "./modules/security"
  
  name_prefix = local.name_prefix
  environment = var.environment
  
  # AWS Security Configuration
  aws_account_id = data.aws_caller_identity.current.account_id
  aws_region     = var.aws_region
  
  # Azure Security Configuration
  azure_tenant_id = var.azure_tenant_id
  
  # GCP Security Configuration
  gcp_project_id = var.gcp_project_id
  
  # Shared security settings
  enable_encryption = true
  enable_audit_logs = true
  
  tags = local.common_tags
}

# Monitoring and observability
module "monitoring" {
  source = "./modules/monitoring"
  
  name_prefix = local.name_prefix
  environment = var.environment
  
  # AWS Monitoring
  aws_region = var.aws_region
  lambda_functions = module.aws_infrastructure.lambda_function_names
  
  # Multi-cloud alerting
  alert_endpoints = var.alert_endpoints
  
  # Dashboards
  create_dashboards = var.create_dashboards
  
  tags = local.common_tags
}
```

### **AWS Module Implementation**

```hcl
# infrastructure/modules/aws/main.tf
# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpc"
  })
}

resource "aws_subnet" "private" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

resource "aws_subnet" "public" {
  count = length(var.availability_zones)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-igw"
  })
}

# NAT Gateways for private subnets
resource "aws_eip" "nat" {
  count = length(var.availability_zones)
  
  domain = "vpc"
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-nat-eip-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-nat-gateway-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count = length(var.availability_zones)
  
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.availability_zones)
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# DynamoDB Tables
resource "aws_dynamodb_table" "tables" {
  for_each = var.dynamodb_tables
  
  name           = "${var.name_prefix}-${each.key}"
  billing_mode   = each.value.billing_mode
  hash_key       = each.value.hash_key
  range_key      = each.value.range_key
  
  dynamic "attribute" {
    for_each = each.value.attributes
    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }
  
  # Global Secondary Indexes
  dynamic "global_secondary_index" {
    for_each = each.value.global_secondary_indexes
    content {
      name            = global_secondary_index.value.name
      hash_key        = global_secondary_index.value.hash_key
      range_key       = global_secondary_index.value.range_key
      projection_type = global_secondary_index.value.projection_type
    }
  }
  
  # Point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }
  
  # Server-side encryption
  server_side_encryption {
    enabled     = true
    kms_key_id  = aws_kms_key.dynamodb.arn
  }
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-${each.key}"
    Type = "DynamoDB"
  })
}

# KMS Key for DynamoDB encryption
resource "aws_kms_key" "dynamodb" {
  description             = "KMS key for DynamoDB encryption"
  deletion_window_in_days = 7
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-dynamodb-kms"
  })
}

resource "aws_kms_alias" "dynamodb" {
  name          = "alias/${var.name_prefix}-dynamodb"
  target_key_id = aws_kms_key.dynamodb.key_id
}

# S3 Buckets
resource "aws_s3_bucket" "buckets" {
  for_each = var.s3_buckets
  
  bucket = "${var.name_prefix}-${each.key}"
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-${each.key}"
    Type = "S3"
  })
}

resource "aws_s3_bucket_versioning" "buckets" {
  for_each = var.s3_buckets
  
  bucket = aws_s3_bucket.buckets[each.key].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "buckets" {
  for_each = var.s3_buckets
  
  bucket = aws_s3_bucket.buckets[each.key].id
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.s3.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "buckets" {
  for_each = var.s3_buckets
  
  bucket = aws_s3_bucket.buckets[each.key].id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# KMS Key for S3 encryption
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 encryption"
  deletion_window_in_days = 7
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-s3-kms"
  })
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${var.name_prefix}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

# Lambda Functions
resource "aws_lambda_function" "functions" {
  for_each = var.lambda_functions
  
  filename         = each.value.filename
  function_name    = "${var.name_prefix}-${each.key}"
  role            = aws_iam_role.lambda_role[each.key].arn
  handler         = each.value.handler
  runtime         = each.value.runtime
  timeout         = each.value.timeout
  memory_size     = each.value.memory_size
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  environment {
    variables = merge(each.value.environment_variables, {
      ENVIRONMENT = var.environment
      AWS_REGION  = var.aws_region
    })
  }
  
  # Dead letter queue
  dead_letter_config {
    target_arn = aws_sqs_queue.dlq[each.key].arn
  }
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-${each.key}"
    Type = "Lambda"
  })
  
  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_vpc,
    aws_cloudwatch_log_group.lambda_logs
  ]
}

# Lambda IAM Roles
resource "aws_iam_role" "lambda_role" {
  for_each = var.lambda_functions
  
  name = "${var.name_prefix}-${each.key}-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = var.tags
}

# Lambda basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  for_each = var.lambda_functions
  
  role       = aws_iam_role.lambda_role[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda VPC execution policy
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  for_each = var.lambda_functions
  
  role       = aws_iam_role.lambda_role[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda custom policies
resource "aws_iam_role_policy" "lambda_custom" {
  for_each = var.lambda_functions
  
  name = "${var.name_prefix}-${each.key}-lambda-policy"
  role = aws_iam_role.lambda_role[each.key].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          for table in aws_dynamodb_table.tables : table.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          for bucket in aws_s3_bucket.buckets : "${bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.dynamodb.arn,
          aws_kms_key.s3.arn
        ]
      }
    ]
  })
}

# Security Groups
resource "aws_security_group" "lambda" {
  name_prefix = "${var.name_prefix}-lambda-"
  vpc_id      = aws_vpc.main.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-lambda-sg"
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = var.lambda_functions
  
  name              = "/aws/lambda/${var.name_prefix}-${each.key}"
  retention_in_days = 30
  
  tags = var.tags
}

# SQS Dead Letter Queues
resource "aws_sqs_queue" "dlq" {
  for_each = var.lambda_functions
  
  name                      = "${var.name_prefix}-${each.key}-dlq"
  message_retention_seconds = 1209600 # 14 days
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-${each.key}-dlq"
    Type = "SQS-DLQ"
  })
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.name_prefix}-alerts"
  
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-alerts"
    Type = "SNS"
  })
}

# API Gateway
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.name_prefix}-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "x-amz-date", "authorization", "x-api-key"]
    allow_methods     = ["*"]
    allow_origins     = ["*"]
    expose_headers    = ["date", "keep-alive"]
    max_age          = 86400
  }
  
  tags = var.tags
}

resource "aws_apigatewayv2_stage" "main" {
  api_id = aws_apigatewayv2_api.main.id
  name   = var.environment
  
  auto_deploy = true
  
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip            = "$context.identity.sourceIp"
      requestTime   = "$context.requestTime"
      httpMethod    = "$context.httpMethod"
      routeKey      = "$context.routeKey"
      status        = "$context.status"
      protocol      = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }
  
  tags = var.tags
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.name_prefix}"
  retention_in_days = 30
  
  tags = var.tags
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
```

### **Monitoring Module**

```hcl
# infrastructure/modules/monitoring/main.tf
# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name_prefix}-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            for func_name in var.lambda_functions : [
              "AWS/Lambda",
              "Duration",
              "FunctionName",
              func_name
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Function Duration"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            for func_name in var.lambda_functions : [
              "AWS/Lambda",
              "Errors",
              "FunctionName",
              func_name
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Function Errors"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${var.name_prefix}-patients"],
            [".", "ConsumedWriteCapacityUnits", ".", "."],
            [".", "ConsumedReadCapacityUnits", "TableName", "${var.name_prefix}-appointments"],
            [".", "ConsumedWriteCapacityUnits", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB Capacity Consumption"
          period  = 300
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = toset(var.lambda_functions)
  
  alarm_name          = "${var.name_prefix}-${each.key}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors lambda errors for ${each.key}"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    FunctionName = "${var.name_prefix}-${each.key}"
  }
  
  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each = toset(var.lambda_functions)
  
  alarm_name          = "${var.name_prefix}-${each.key}-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000" # 10 seconds
  alarm_description   = "This metric monitors lambda duration for ${each.key}"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    FunctionName = "${var.name_prefix}-${each.key}"
  }
  
  tags = var.tags
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.name_prefix}-monitoring-alerts"
  
  tags = var.tags
}

resource "aws_sns_topic_subscription" "email_alerts" {
  count = length(var.alert_endpoints.email)
  
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_endpoints.email[count.index]
}

# Custom CloudWatch Metrics
resource "aws_cloudwatch_log_metric_filter" "api_errors" {
  name           = "${var.name_prefix}-api-errors"
  log_group_name = "/aws/apigateway/${var.name_prefix}"
  pattern        = "[timestamp, request_id, ip, request_time, http_method, route_key, status_code=5*, protocol, response_length]"
  
  metric_transformation {
    name      = "APIErrors"
    namespace = "HealthHub/API"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "${var.name_prefix}-api-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "APIErrors"
  namespace           = "HealthHub/API"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API 5xx errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  tags = var.tags
}
```
