#!/bin/bash

echo "🏥 HealthHub Platform Health Check"
echo "=================================="

# Frontend Check
echo "🌐 Frontend Status:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://d1aylx7zsl7bap.cloudfront.net

# API Gateway Check
echo "🔗 API Gateway Status:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/users

# User Count Check
echo "👥 Active Users:"
curl -s https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/users | jq '. | length' 2>/dev/null || echo "API response received"

# Lambda Function Check
echo "⚡ Lambda Functions:"
aws lambda list-functions --region us-east-1 --query 'Functions[?contains(FunctionName, `hh-`) && contains(FunctionName, `production`)].FunctionName' --output table

echo "✅ Health check complete!"
