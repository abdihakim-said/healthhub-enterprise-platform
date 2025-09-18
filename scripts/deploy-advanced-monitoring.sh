#!/bin/bash

# Deploy Advanced SRE Monitoring with Logging
echo "🚀 Deploying Advanced SRE Monitoring + Logging for HealthHub..."

cd terraform

# Deploy monitoring infrastructure
terraform init
terraform plan -target=module.enhanced_monitoring
terraform apply -target=module.enhanced_monitoring -auto-approve

# Get outputs
DASHBOARD_URL=$(terraform output -raw monitoring_dashboard_url 2>/dev/null || echo "Dashboard URL not available yet")
SNS_TOPIC=$(terraform output -raw monitoring_sns_topic)

echo "✅ Advanced SRE Monitoring + Logging Deployed!"
echo ""
echo "📊 ACCESS YOUR METRICS & LOGS:"
echo "1. CloudWatch Dashboard: $DASHBOARD_URL"
echo "2. CloudWatch Alarms: https://console.aws.amazon.com/cloudwatch/home#alarmsV2:"
echo "3. Log Insights: https://console.aws.amazon.com/cloudwatch/home#logsV2:logs-insights"
echo ""
echo "🔔 ALERT CONFIGURATION:"
echo "SNS Topic: $SNS_TOPIC"
echo "Email subscriptions will need confirmation"
echo ""
echo "📈 ADVANCED LOGGING FEATURES:"
echo "• Error Pattern Detection (Critical, Timeout, Memory)"
echo "• Security Event Monitoring (Auth failures, Unauthorized access)"
echo "• Business Intelligence (AI failures, DB connection issues)"
echo "• Performance Bottleneck Analysis (Slow queries, Duration)"
echo "• Cost Optimization (Log ingestion rate, Storage costs)"
echo ""
echo "🔍 LOG INSIGHTS QUERIES:"
echo "• Error Correlation Analysis: Cross-service error patterns"
echo "• Performance Bottlenecks: Duration and memory analysis"
echo "• Business Metrics: Patient registrations, AI interactions"
echo ""
echo "🚨 SRE LOGGING ALARMS:"
echo "• Critical Error Rate: >5 errors in 5 minutes"
echo "• Timeout Errors: >3 Lambda timeouts"
echo "• Security Events: Any unauthorized access"
echo "• Log Cost Control: >10GB daily ingestion"
echo ""
echo "💡 SENIOR SRE LOGGING CAPABILITIES:"
echo "• Real-time log pattern matching"
echo "• Business impact correlation"
echo "• Security threat detection"
echo "• Cost anomaly prevention"
echo "• Root cause analysis automation"
echo "• Compliance audit trails"
echo ""
echo "🎯 LOG-BASED BUSINESS INTELLIGENCE:"
echo "• AI Service Reliability: OpenAI/Azure/Google failures"
echo "• Healthcare Operations: Patient flow, appointment patterns"
echo "• Multi-Cloud Performance: Cross-platform error correlation"
echo "• HIPAA Compliance: Authentication and access logging"
