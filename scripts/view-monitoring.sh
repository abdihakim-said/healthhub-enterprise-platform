#!/bin/bash

# View All Metrics and Logs - HealthHub Advanced Monitoring
echo "🔍 HealthHub Advanced Monitoring Access Guide"
echo "=============================================="

# Get AWS region
REGION=$(aws configure get region || echo "us-east-1")
ENVIRONMENT="production"

echo ""
echo "📊 1. CLOUDWATCH DASHBOARD"
echo "Direct URL: https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=${ENVIRONMENT}-healthhub-sre-dashboard"
echo ""

echo "🚨 2. CLOUDWATCH ALARMS"
echo "All Alarms: https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#alarmsV2:"
echo ""
echo "Key Alarms to Check:"
echo "• ${ENVIRONMENT}-service-health-composite"
echo "• ${ENVIRONMENT}-sre-error-budget-fast-burn"
echo "• ${ENVIRONMENT}-sre-availability-slo"
echo "• ${ENVIRONMENT}-multi-cloud-ai-health"
echo ""

echo "📈 3. CUSTOM METRICS NAMESPACES"
echo "View in CloudWatch Metrics:"
echo "• HealthHub/AI - OpenAI, Azure, Google Vision metrics"
echo "• HealthHub/Application - Performance and user journey"
echo "• HealthHub/Business - Patient appointments, transcriptions"
echo "• HealthHub/Security - Authentication failures, threats"
echo "• HealthHub/Logging - Error patterns, performance issues"
echo ""

echo "🔍 4. LOG INSIGHTS QUERIES"
echo "Access: https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:logs-insights"
echo ""
echo "Pre-built Queries:"
echo "• ${ENVIRONMENT}-error-correlation"
echo "• ${ENVIRONMENT}-performance-bottlenecks"
echo "• ${ENVIRONMENT}-business-metrics"
echo "• ${ENVIRONMENT}-ai-service-performance"
echo "• ${ENVIRONMENT}-user-experience"
echo ""

echo "📋 5. LOG GROUPS TO MONITOR"
echo "Lambda Function Logs:"
for service in "user-service" "ai-interaction" "medical-image-service" "transcription-service" "appointment-service" "doctor-service" "patient-service"; do
    echo "• /aws/lambda/healthhub-${service}-${ENVIRONMENT}"
done
echo ""

echo "💰 6. COST MONITORING"
echo "Cost Explorer: https://console.aws.amazon.com/cost-management/home#/anomaly-detection"
echo "• DynamoDB Cost Anomalies"
echo "• Lambda Cost Anomalies"
echo ""

echo "🎯 7. QUICK ACCESS COMMANDS"
echo ""
echo "View Recent Alarms:"
echo "aws cloudwatch describe-alarms --state-value ALARM --region ${REGION}"
echo ""
echo "Check AI Service Metrics:"
echo "aws cloudwatch get-metric-statistics --namespace HealthHub/AI --metric-name OpenAITokenUsage --start-time \$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) --end-time \$(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Sum --region ${REGION}"
echo ""
echo "View Error Logs:"
echo "aws logs filter-log-events --log-group-name '/aws/lambda/healthhub-ai-interaction-${ENVIRONMENT}' --filter-pattern 'ERROR' --start-time \$(date -d '1 hour ago' +%s)000 --region ${REGION}"
echo ""

echo "📱 8. MOBILE ACCESS"
echo "AWS Console Mobile App:"
echo "• Download AWS Console app"
echo "• View alarms and metrics on mobile"
echo "• Get push notifications for critical alerts"
echo ""

echo "🔔 9. SNS ALERT SETUP"
echo "Subscribe to alerts:"
echo "aws sns subscribe --topic-arn \$(terraform output -raw monitoring_sns_topic) --protocol email --notification-endpoint your-email@company.com --region ${REGION}"
echo ""

echo "🚀 10. TERRAFORM OUTPUTS"
echo "Get all monitoring URLs:"
echo "cd terraform && terraform output"
echo ""

echo "✅ READY TO VIEW YOUR MONITORING!"
echo "Start with the CloudWatch Dashboard for overview, then drill down into specific metrics and logs."
