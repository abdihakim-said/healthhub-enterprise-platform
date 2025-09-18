#!/bin/bash

# Quick Metrics Check Commands
REGION=$(aws configure get region || echo "us-east-1")
ENVIRONMENT="production"

echo "🔍 Quick Metrics Check for HealthHub"
echo "===================================="

# Check current alarms
echo ""
echo "🚨 CURRENT ALARMS:"
aws cloudwatch describe-alarms --state-value ALARM --query 'MetricAlarms[*].[AlarmName,StateReason]' --output table --region $REGION

# Check AI service metrics
echo ""
echo "🤖 AI SERVICE METRICS (Last Hour):"
echo "OpenAI Token Usage:"
aws cloudwatch get-metric-statistics \
  --namespace HealthHub/AI \
  --metric-name OpenAITokenUsage \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --query 'Datapoints[*].[Timestamp,Sum]' \
  --output table \
  --region $REGION

# Check error rates
echo ""
echo "❌ ERROR RATES:"
aws cloudwatch get-metric-statistics \
  --namespace HealthHub/Logging \
  --metric-name CriticalErrors \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --query 'Datapoints[*].[Timestamp,Sum]' \
  --output table \
  --region $REGION

# Check business metrics
echo ""
echo "📊 BUSINESS METRICS:"
aws cloudwatch get-metric-statistics \
  --namespace HealthHub/Business \
  --metric-name AppointmentsBooked \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --query 'Datapoints[*].[Timestamp,Sum]' \
  --output table \
  --region $REGION

# Recent error logs
echo ""
echo "📋 RECENT ERROR LOGS:"
aws logs filter-log-events \
  --log-group-name "/aws/lambda/healthhub-ai-interaction-$ENVIRONMENT" \
  --filter-pattern "ERROR" \
  --start-time $(date -d '30 minutes ago' +%s)000 \
  --query 'events[*].[eventTimestamp,message]' \
  --output table \
  --region $REGION | head -10

echo ""
echo "✅ Metrics check complete!"
echo "For detailed analysis, run: ./scripts/view-monitoring.sh"
