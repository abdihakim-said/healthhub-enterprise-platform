#!/bin/bash

# HealthHub Monitoring and Alerting Script
set -e

ENVIRONMENT=${1:-dev}
ACTION=${2:-status}

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 HealthHub Monitoring Dashboard${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT | Action: $ACTION${NC}"
echo "=================================================="

# Function to get CloudWatch metrics
get_metric() {
    local namespace=$1
    local metric_name=$2
    local dimension_name=$3
    local dimension_value=$4
    local statistic=${5:-Average}
    
    aws cloudwatch get-metric-statistics \
        --namespace "$namespace" \
        --metric-name "$metric_name" \
        --dimensions Name="$dimension_name",Value="$dimension_value" \
        --statistics "$statistic" \
        --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 300 \
        --query 'Datapoints[0].'"$statistic" \
        --output text 2>/dev/null || echo "N/A"
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local function_name=$2
    
    echo -e "\n${YELLOW}🔧 $service_name Service${NC}"
    echo "--------------------------------"
    
    # Get Lambda metrics
    local invocations=$(get_metric "AWS/Lambda" "Invocations" "FunctionName" "$function_name" "Sum")
    local errors=$(get_metric "AWS/Lambda" "Errors" "FunctionName" "$function_name" "Sum")
    local duration=$(get_metric "AWS/Lambda" "Duration" "FunctionName" "$function_name" "Average")
    
    echo "📈 Invocations (last hour): $invocations"
    echo "❌ Errors (last hour): $errors"
    echo "⏱️  Average Duration: ${duration}ms"
    
    # Calculate error rate
    if [ "$invocations" != "N/A" ] && [ "$errors" != "N/A" ] && [ "$invocations" != "0" ]; then
        error_rate=$(echo "scale=2; $errors * 100 / $invocations" | bc -l 2>/dev/null || echo "N/A")
        echo "📊 Error Rate: ${error_rate}%"
        
        # Alert if error rate > 1%
        if [ "$error_rate" != "N/A" ] && (( $(echo "$error_rate > 1" | bc -l) )); then
            echo -e "${RED}🚨 HIGH ERROR RATE ALERT: ${error_rate}%${NC}"
        fi
    fi
}

# Function to check API Gateway metrics
check_api_gateway() {
    local api_name=$1
    local api_id=$2
    
    echo -e "\n${YELLOW}🌐 $api_name API Gateway${NC}"
    echo "--------------------------------"
    
    local count=$(get_metric "AWS/ApiGateway" "Count" "ApiName" "$api_name" "Sum")
    local latency=$(get_metric "AWS/ApiGateway" "Latency" "ApiName" "$api_name" "Average")
    local errors_4xx=$(get_metric "AWS/ApiGateway" "4XXError" "ApiName" "$api_name" "Sum")
    local errors_5xx=$(get_metric "AWS/ApiGateway" "5XXError" "ApiName" "$api_name" "Sum")
    
    echo "📈 Requests (last hour): $count"
    echo "⏱️  Average Latency: ${latency}ms"
    echo "⚠️  4XX Errors: $errors_4xx"
    echo "❌ 5XX Errors: $errors_5xx"
    
    # Alert if latency > 1000ms
    if [ "$latency" != "N/A" ] && (( $(echo "$latency > 1000" | bc -l) )); then
        echo -e "${RED}🚨 HIGH LATENCY ALERT: ${latency}ms${NC}"
    fi
}

# Function to check DynamoDB metrics
check_dynamodb() {
    local table_name=$1
    
    echo -e "\n${YELLOW}🗄️  DynamoDB Table: $table_name${NC}"
    echo "--------------------------------"
    
    local read_capacity=$(get_metric "AWS/DynamoDB" "ConsumedReadCapacityUnits" "TableName" "$table_name" "Sum")
    local write_capacity=$(get_metric "AWS/DynamoDB" "ConsumedWriteCapacityUnits" "TableName" "$table_name" "Sum")
    local throttles=$(get_metric "AWS/DynamoDB" "ReadThrottles" "TableName" "$table_name" "Sum")
    
    echo "📖 Read Capacity Used: $read_capacity"
    echo "✍️  Write Capacity Used: $write_capacity"
    echo "🚫 Throttles: $throttles"
    
    # Alert if throttles > 0
    if [ "$throttles" != "N/A" ] && [ "$throttles" != "0" ]; then
        echo -e "${RED}🚨 THROTTLING ALERT: $throttles throttles detected${NC}"
    fi
}

# Function to show system overview
show_system_overview() {
    echo -e "\n${BLUE}🏥 HealthHub System Overview${NC}"
    echo "=================================================="
    
    # Check Lambda functions
    check_service_health "AI Interaction" "hh-ai-interaction-$ENVIRONMENT-processVirtualAssistant"
    check_service_health "Medical Transcription" "hh-transcription-$ENVIRONMENT-transcribeAudio"
    check_service_health "Medical Image" "hh-medical-image-$ENVIRONMENT-analyzeImage"
    check_service_health "User Management" "hh-user-$ENVIRONMENT-createUser"
    
    # Check API Gateways
    check_api_gateway "User API" "eqd8yoyih2"
    check_api_gateway "AI API" "j6doxodkt1"
    check_api_gateway "Medical API" "2zk81heev4"
    
    # Check DynamoDB tables
    check_dynamodb "hh-ai-interactions-$ENVIRONMENT"
    check_dynamodb "hh-users-$ENVIRONMENT"
    check_dynamodb "hh-medical-images-$ENVIRONMENT"
    
    # Check S3 bucket
    echo -e "\n${YELLOW}🪣 S3 Frontend Bucket${NC}"
    echo "--------------------------------"
    local bucket_size=$(aws s3 ls s3://healthhub-production-frontend-6r8f5ezz --recursive --summarize | grep "Total Size" | awk '{print $3}' || echo "N/A")
    local object_count=$(aws s3 ls s3://healthhub-production-frontend-6r8f5ezz --recursive --summarize | grep "Total Objects" | awk '{print $3}' || echo "N/A")
    echo "📦 Objects: $object_count"
    echo "💾 Size: $bucket_size bytes"
}

# Function to create CloudWatch dashboard
create_dashboard() {
    echo -e "\n${YELLOW}📊 Creating CloudWatch Dashboard${NC}"
    echo "--------------------------------"
    
    cat > /tmp/dashboard.json << EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/Lambda", "Invocations", "FunctionName", "hh-ai-interaction-$ENVIRONMENT-processVirtualAssistant" ],
                    [ ".", "Errors", ".", "." ],
                    [ ".", "Duration", ".", "." ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "AI Interaction Service"
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ApiGateway", "Count", "ApiName", "hh-ai-interaction" ],
                    [ ".", "Latency", ".", "." ],
                    [ ".", "5XXError", ".", "." ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "API Gateway Metrics"
            }
        }
    ]
}
EOF

    aws cloudwatch put-dashboard \
        --dashboard-name "HealthHub-$ENVIRONMENT-Monitoring" \
        --dashboard-body file:///tmp/dashboard.json
    
    echo -e "${GREEN}✅ Dashboard created: HealthHub-$ENVIRONMENT-Monitoring${NC}"
}

# Function to set up alarms
setup_alarms() {
    echo -e "\n${YELLOW}🚨 Setting up CloudWatch Alarms${NC}"
    echo "--------------------------------"
    
    # High error rate alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "HealthHub-$ENVIRONMENT-HighErrorRate" \
        --alarm-description "High error rate in Lambda functions" \
        --metric-name "Errors" \
        --namespace "AWS/Lambda" \
        --statistic "Sum" \
        --period 300 \
        --threshold 10 \
        --comparison-operator "GreaterThanThreshold" \
        --evaluation-periods 2 \
        --alarm-actions "arn:aws:sns:us-east-1:880385175593:healthhub-production-alerts"
    
    # High latency alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "HealthHub-$ENVIRONMENT-HighLatency" \
        --alarm-description "High API latency" \
        --metric-name "Latency" \
        --namespace "AWS/ApiGateway" \
        --statistic "Average" \
        --period 300 \
        --threshold 2000 \
        --comparison-operator "GreaterThanThreshold" \
        --evaluation-periods 2 \
        --alarm-actions "arn:aws:sns:us-east-1:880385175593:healthhub-production-alerts"
    
    echo -e "${GREEN}✅ Alarms configured${NC}"
}

# Main execution
case $ACTION in
    "status")
        show_system_overview
        ;;
    "dashboard")
        create_dashboard
        ;;
    "alarms")
        setup_alarms
        ;;
    "all")
        show_system_overview
        create_dashboard
        setup_alarms
        ;;
    *)
        echo "Usage: $0 [environment] [status|dashboard|alarms|all]"
        echo "  status    - Show system metrics and health"
        echo "  dashboard - Create CloudWatch dashboard"
        echo "  alarms    - Set up CloudWatch alarms"
        echo "  all       - Do everything"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✅ Monitoring operations completed${NC}"
