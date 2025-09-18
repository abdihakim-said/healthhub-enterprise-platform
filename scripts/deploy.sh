#!/bin/bash

# HealthHub Automated Deployment Script
set -e

ENVIRONMENT=${1:-dev}
SKIP_TESTS=${2:-false}

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 HealthHub Deployment Pipeline${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo "=================================================="

# Function to run command with logging
run_command() {
    local cmd=$1
    local description=$2
    
    echo -e "\n${YELLOW}📋 $description${NC}"
    echo "Command: $cmd"
    echo "--------------------------------"
    
    if eval "$cmd"; then
        echo -e "${GREEN}✅ $description completed successfully${NC}"
    else
        echo -e "${RED}❌ $description failed${NC}"
        exit 1
    fi
}

# Pre-deployment checks
echo -e "\n${YELLOW}🔍 Pre-deployment Checks${NC}"
echo "--------------------------------"

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi
echo -e "${GREEN}✅ AWS credentials configured${NC}"

# Check required tools
for tool in terraform node npm; do
    if ! command -v $tool > /dev/null 2>&1; then
        echo -e "${RED}❌ $tool not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ $tool available${NC}"
done

# Navigate to project directory
cd "$(dirname "$0")/.."

# Install dependencies
run_command "cd health-hub-backend && npm ci" "Installing dependencies"

# Run tests (unless skipped)
if [ "$SKIP_TESTS" != "true" ]; then
    run_command "cd health-hub-backend && npm test" "Running tests"
    run_command "cd health-hub-backend && npm run lint" "Running linting"
fi

# Security audit
run_command "cd health-hub-backend && npm audit --audit-level=moderate" "Security audit"

# Deploy infrastructure with Terraform
echo -e "\n${YELLOW}🏗️ Infrastructure Deployment${NC}"
echo "--------------------------------"

cd health-hub-backend/terraform

# Initialize Terraform
run_command "terraform init" "Terraform initialization"

# Select or create workspace
run_command "terraform workspace select $ENVIRONMENT || terraform workspace new $ENVIRONMENT" "Terraform workspace setup"

# Plan infrastructure changes
run_command "terraform plan -out=tfplan" "Terraform planning"

# Apply infrastructure changes
run_command "terraform apply tfplan" "Terraform deployment"

# Deploy serverless services
echo -e "\n${YELLOW}⚡ Serverless Deployment${NC}"
echo "--------------------------------"

cd ..

# Deploy all services
run_command "npx @serverless/compose deploy --stage $ENVIRONMENT" "Serverless deployment"

# Run health checks
echo -e "\n${YELLOW}🏥 Health Checks${NC}"
echo "--------------------------------"

# Wait for services to be ready
echo "Waiting 30 seconds for services to initialize..."
sleep 30

# Run health check script
if [ -f "../scripts/health-check.sh" ]; then
    run_command "../scripts/health-check.sh $ENVIRONMENT" "Health checks"
else
    echo -e "${YELLOW}⚠️ Health check script not found, skipping...${NC}"
fi

# Deployment summary
echo -e "\n${GREEN}🎉 Deployment Summary${NC}"
echo "=================================================="
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Timestamp: ${YELLOW}$(date)${NC}"

# Get API endpoints
echo -e "\n${BLUE}📡 API Endpoints:${NC}"
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "Frontend: https://d3dxe0vf0g9rlg.cloudfront.net"
    echo "User API: https://eqd8yoyih2.execute-api.us-east-1.amazonaws.com"
    echo "AI API: https://j6doxodkt1.execute-api.us-east-1.amazonaws.com"
    echo "Medical API: https://2zk81heev4.execute-api.us-east-1.amazonaws.com"
else
    echo "Frontend: https://d3dxe0vf0g9rlg.cloudfront.net"
    echo "User API: https://eqd8yoyih2.execute-api.us-east-1.amazonaws.com"
    echo "AI API: https://j6doxodkt1.execute-api.us-east-1.amazonaws.com"
    echo "Medical API: https://2zk81heev4.execute-api.us-east-1.amazonaws.com"
fi

echo -e "\n${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}🔗 Access your application at: https://d3dxe0vf0g9rlg.cloudfront.net${NC}"
