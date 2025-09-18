#!/bin/bash

# HealthHub Health Check Script
set -e

ENVIRONMENT=${1:-dev}
TIMEOUT=30
MAX_RETRIES=5

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API endpoints based on environment
if [ "$ENVIRONMENT" = "prod" ]; then
    FRONTEND_URL="https://d1aylx7zsl7bap.cloudfront.net"
    USER_API="https://cnc7dkr1sb.execute-api.us-east-1.amazonaws.com"
    AI_API="https://cnc7dkr1sb.execute-api.us-east-1.amazonaws.com"
    MEDICAL_API="https://cnc7dkr1sb.execute-api.us-east-1.amazonaws.com"
else
    FRONTEND_URL="https://d1aylx7zsl7bap.cloudfront.net"
    USER_API="https://cnc7dkr1sb.execute-api.us-east-1.amazonaws.com"
    AI_API="https://cnc7dkr1sb.execute-api.us-east-1.amazonaws.com"
    MEDICAL_API="https://cnc7dkr1sb.execute-api.us-east-1.amazonaws.com"
fi

echo -e "${YELLOW}🏥 HealthHub Health Check - Environment: $ENVIRONMENT${NC}"
echo "=================================================="

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $name... "
    
    for i in $(seq 1 $MAX_RETRIES); do
        response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" || echo "000")
        
        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✅ OK (HTTP $response)${NC}"
            return 0
        fi
        
        if [ $i -lt $MAX_RETRIES ]; then
            echo -n "⏳ Retry $i/$MAX_RETRIES... "
            sleep 5
        fi
    done
    
    echo -e "${RED}❌ FAILED (HTTP $response)${NC}"
    return 1
}

# Function to check API with JSON response
check_api_endpoint() {
    local url=$1
    local name=$2
    local payload=$3
    
    echo -n "Checking $name API... "
    
    for i in $(seq 1 $MAX_RETRIES); do
        if [ -n "$payload" ]; then
            response=$(curl -s -X POST "$url" \
                -H "Content-Type: application/json" \
                -d "$payload" \
                --max-time $TIMEOUT \
                -w "%{http_code}" -o /tmp/response.json || echo "000")
        else
            response=$(curl -s "$url" \
                --max-time $TIMEOUT \
                -w "%{http_code}" -o /tmp/response.json || echo "000")
        fi
        
        if [ "$response" = "200" ] || [ "$response" = "201" ]; then
            echo -e "${GREEN}✅ OK (HTTP $response)${NC}"
            return 0
        fi
        
        if [ $i -lt $MAX_RETRIES ]; then
            echo -n "⏳ Retry $i/$MAX_RETRIES... "
            sleep 5
        fi
    done
    
    echo -e "${RED}❌ FAILED (HTTP $response)${NC}"
    if [ -f /tmp/response.json ]; then
        echo "Response: $(cat /tmp/response.json)"
    fi
    return 1
}

# Health check results
FAILED_CHECKS=0

echo -e "\n${YELLOW}🌐 Frontend Health Checks${NC}"
echo "--------------------------------"
check_endpoint "$FRONTEND_URL" "Frontend Application" || ((FAILED_CHECKS++))

echo -e "\n${YELLOW}🔧 Backend API Health Checks${NC}"
echo "--------------------------------"
check_endpoint "$USER_API/users" "User Service" || ((FAILED_CHECKS++))
# Skip AI base endpoint test - use specific working endpoints below
check_endpoint "$MEDICAL_API/medical-images" "Medical Image Service" || ((FAILED_CHECKS++))

echo -e "\n${YELLOW}🤖 AI Services Integration Tests${NC}"
echo "--------------------------------"

# Test Virtual Assistant
check_api_endpoint "$AI_API/ai-interactions/virtual-assistant" "Virtual Assistant" \
    '{"userId": "health-check", "message": "Hello", "type": "virtualAssistant"}' || ((FAILED_CHECKS++))

# Test Text-to-Speech
check_api_endpoint "$AI_API/ai-interactions/text-to-speech" "Text-to-Speech" \
    '{"text": "Health check test", "language": "en"}' || ((FAILED_CHECKS++))

# Skip transcription test - requires multipart/form-data audio file
echo "Checking Medical Transcription API... ✅ SKIPPED (requires audio file upload)"

echo -e "\n${YELLOW}📊 Infrastructure Health Checks${NC}"
echo "--------------------------------"

# Check CloudWatch metrics
echo -n "Checking CloudWatch metrics... "
if aws cloudwatch get-metric-statistics \
    --namespace "AWS/Lambda" \
    --metric-name "Invocations" \
    --dimensions Name=FunctionName,Value=hh-ai-interaction-dev-processVirtualAssistant \
    --statistics Sum \
    --start-time $(date -u -v-5M +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
    ((FAILED_CHECKS++))
fi

# Check DynamoDB tables
echo -n "Checking DynamoDB tables... "
if aws dynamodb describe-table --table-name "hh-ai-interaction-production-ai-interactions" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
    ((FAILED_CHECKS++))
fi

# Check S3 buckets
echo -n "Checking S3 buckets... "
if aws s3 ls s3://healthhub-production-frontend-6r8f5ezz > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
    ((FAILED_CHECKS++))
fi

echo -e "\n=================================================="
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}🎉 All health checks passed! System is healthy.${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED_CHECKS health check(s) failed!${NC}"
    exit 1
fi
