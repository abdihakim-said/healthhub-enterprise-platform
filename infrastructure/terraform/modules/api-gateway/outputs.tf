output "api_endpoints" {
  description = "API Gateway endpoints"
  value = {
    shared_api = aws_apigatewayv2_api.shared_api.api_endpoint
  }
}

output "api_id" {
  description = "Shared API Gateway ID"
  value = aws_apigatewayv2_api.shared_api.id
}

output "api_arn" {
  description = "Shared API Gateway ARN"
  value = aws_apigatewayv2_api.shared_api.arn
}
