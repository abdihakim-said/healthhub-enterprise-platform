# 🔧 HealthHub Troubleshooting Runbook

## 🚨 Emergency Response

### System Down (P0)
1. **Check status**: `curl https://cnc7dkr1sb.execute-api.us-east-1.amazonaws.com/health`
2. **View dashboards**: CloudWatch HealthHub dashboard
3. **Check logs**: `aws logs tail /aws/lambda/user-service --follow`
4. **Rollback if needed**: `git revert <commit> && npm run deploy:prod`

### High Error Rate (P1)
1. **Identify service**: Check CloudWatch metrics
2. **Scale up**: Increase Lambda concurrency
3. **Check dependencies**: Verify external APIs (OpenAI, Azure, Google)

## 🔍 Common Issues

### 1. Authentication Failures
**Symptoms**: 401 errors, login failures
```bash
# Check Cognito status
aws cognito-idp describe-user-pool --user-pool-id us-east-1_WcEpxc9pE

# Verify JWT tokens
jwt-cli decode <token>
```

**Solutions**:
- Refresh Cognito configuration
- Check token expiration
- Verify user permissions

### 2. AI Service Timeouts
**Symptoms**: 504 errors, slow responses
```bash
# Check Lambda timeout settings
aws lambda get-function-configuration --function-name ai-interaction-service

# Monitor external API status
curl -I https://api.openai.com/v1/models
```

**Solutions**:
- Increase Lambda timeout (max 15min)
- Implement retry logic
- Add circuit breaker pattern

### 3. Database Connection Issues
**Symptoms**: DynamoDB errors, data not saving
```bash
# Check DynamoDB status
aws dynamodb describe-table --table-name HealthHub-Users-Production

# Test connection
aws dynamodb scan --table-name HealthHub-Users-Production --max-items 1
```

**Solutions**:
- Check IAM permissions
- Verify table exists
- Check region configuration

### 4. Frontend Not Loading
**Symptoms**: White screen, 404 errors
```bash
# Check CloudFront distribution
aws cloudfront get-distribution --id E1234567890

# Test S3 bucket
aws s3 ls s3://healthhub-frontend-bucket/
```

**Solutions**:
- Clear CloudFront cache
- Redeploy frontend
- Check S3 bucket permissions

## 📊 Monitoring & Alerts

### Key Metrics to Watch
```bash
# Lambda errors
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=ai-interaction-service \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum

# API Gateway latency
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Latency \
  --dimensions Name=ApiName,Value=healthhub-api \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

### Alert Thresholds
- **Error Rate**: > 5%
- **Response Time**: > 5 seconds
- **Memory Usage**: > 80%
- **Cost**: > $100/day unexpected

## 🔧 Performance Issues

### Slow API Responses
1. **Check Lambda cold starts**
2. **Optimize bundle size**
3. **Add caching layer**
4. **Use provisioned concurrency**

### High Memory Usage
1. **Profile memory usage**
2. **Check for memory leaks**
3. **Optimize data structures**
4. **Increase Lambda memory**

### Database Performance
1. **Check DynamoDB throttling**
2. **Optimize query patterns**
3. **Add GSI if needed**
4. **Use DynamoDB Accelerator (DAX)**

## 🔒 Security Incidents

### Suspicious Activity
1. **Check CloudTrail logs**
2. **Review access patterns**
3. **Rotate compromised keys**
4. **Update security groups**

### Data Breach Response
1. **Isolate affected systems**
2. **Notify security team**
3. **Document incident**
4. **Implement fixes**

## 🚀 Deployment Issues

### Failed Deployment
```bash
# Check deployment status
serverless info --stage production

# View deployment logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/

# Rollback deployment
git revert HEAD
npm run deploy:prod
```

### Configuration Drift
```bash
# Check Terraform state
terraform plan

# Detect drift
aws config get-compliance-details-by-config-rule \
  --config-rule-name required-tags
```

## 📞 Escalation Procedures

### Level 1: Self-Service (0-15 min)
- Check this runbook
- Review CloudWatch dashboards
- Restart services if safe

### Level 2: Team Lead (15-30 min)
- Complex configuration issues
- Multi-service failures
- Security concerns

### Level 3: Architecture Team (30+ min)
- Infrastructure changes needed
- Major security incidents
- Data recovery required

## 🔍 Diagnostic Commands

### Health Checks
```bash
# Backend health
curl https://cnc7dkr1sb.execute-api.us-east-1.amazonaws.com/health

# Database connectivity
aws dynamodb describe-table --table-name HealthHub-Users-Production

# External API status
curl -s https://api.openai.com/v1/models | jq '.data[0].id'
```

### Log Analysis
```bash
# Recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/ai-interaction-service \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000

# Performance metrics
aws logs insights start-query \
  --log-group-name /aws/lambda/ai-interaction-service \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @duration | filter @duration > 1000'
```

## 📚 Additional Resources

- [AWS Lambda Troubleshooting](https://docs.aws.amazon.com/lambda/latest/dg/troubleshooting.html)
- [API Gateway Troubleshooting](https://docs.aws.amazon.com/apigateway/latest/developerguide/troubleshooting.html)
- [DynamoDB Troubleshooting](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Troubleshooting.html)
- [CloudWatch Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html)
