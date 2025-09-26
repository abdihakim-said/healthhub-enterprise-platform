# Shared API Gateway for all services
resource "aws_apigatewayv2_api" "shared_api" {
  name          = "${var.environment}-healthhub-api"
  protocol_type = "HTTP"
  description   = "Shared API Gateway for all HealthHub services"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent", "x-amzn-trace-id"]
    allow_methods     = ["OPTIONS", "POST", "GET", "PUT", "DELETE"]
    allow_origins     = ["*"]
    expose_headers    = ["date", "keep-alive"]
    max_age          = 86400
  }

  tags = {
    Name        = "${var.environment}-healthhub-shared-api"
    Environment = var.environment
    Purpose     = "Shared-API-Gateway"
  }
}

# Custom domain (optional)
resource "aws_apigatewayv2_domain_name" "api_domain" {
  count       = var.custom_domain != "" ? 1 : 0
  domain_name = var.custom_domain

  domain_name_configuration {
    certificate_arn = var.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = {
    Name        = "${var.environment}-healthhub-api-domain"
    Environment = var.environment
  }
}

# Stage
resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.shared_api.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
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

  tags = {
    Name        = "${var.environment}-healthhub-api-stage"
    Environment = var.environment
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${var.environment}-healthhub-api"
  retention_in_days = 14

  tags = {
    Name        = "${var.environment}-healthhub-api-logs"
    Environment = var.environment
  }
}
