#!/bin/bash

# HealthHub DynamoDB Auto-scaling Deployment Script

set -e

echo "🚀 Deploying DynamoDB Auto-scaling for HealthHub..."

# Navigate to terraform directory
cd health-hub-backend/terraform

# Initialize Terraform
echo "📦 Initializing Terraform..."
terraform init

# Select production workspace
echo "🏗️ Selecting production workspace..."
terraform workspace select production || terraform workspace new production

# Plan the deployment
echo "📋 Planning auto-scaling deployment..."
terraform plan -var="enable_dynamodb_autoscaling=true" -out=autoscaling.tfplan

# Apply the changes
echo "🔧 Applying auto-scaling configuration..."
terraform apply autoscaling.tfplan

# Show outputs
echo "📊 Auto-scaling Status:"
terraform output dynamodb_autoscaling_status

echo "✅ DynamoDB Auto-scaling deployed successfully!"
echo ""
echo "📈 What was deployed:"
echo "  • 7 DynamoDB tables with auto-scaling"
echo "  • 14 scaling policies (read + write)"
echo "  • 14 CloudWatch alarms for monitoring"
echo "  • Production-ready capacity settings"
echo ""
echo "🎯 Next steps:"
echo "  • Monitor CloudWatch dashboards"
echo "  • Check auto-scaling metrics"
echo "  • Verify cost optimization"

# Clean up plan file
rm -f autoscaling.tfplan
