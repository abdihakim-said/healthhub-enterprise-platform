# 🚀 HealthHub Deployment Guide

This comprehensive guide covers the deployment process for the HealthHub healthcare management platform across different environments.

## 📋 Prerequisites

### Required Tools
- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher
- **AWS CLI**: Version 2.x configured with appropriate credentials
- **Terraform**: Version 1.6.x or higher
- **Serverless Framework**: Version 3.x or higher
- **Git**: For version control

### AWS Account Setup
- AWS account with appropriate permissions
- IAM user with programmatic access
- AWS CLI configured with credentials
- Sufficient service limits for Lambda, DynamoDB, S3, etc.

### Environment Variables
```bash
# AWS Configuration
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"

# Application Configuration
export ENVIRONMENT="dev|staging|prod"
export PROJECT_NAME="healthhub"
```

## 🏗️ Infrastructure Deployment

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/healthhub-enterprise-platform.git
cd healthhub-enterprise-platform
```

### Step 2: Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd health-hub-frontend
npm install
cd ..
```

### Step 3: Setup Remote Backend
```bash
cd terraform
./setup-standard-remote-backend.sh
```

This script will:
- Create S3 bucket for Terraform state
- Create DynamoDB table for state locking
- Configure IAM policies for secure access
- Initialize Terraform with remote backend

### Step 4: Configure Environment Variables
```bash
# Copy example terraform variables
cp terraform/environments/dev/terraform.tfvars.example terraform/environments/dev/terraform.tfvars

# Edit the variables file
nano terraform/environments/dev/terraform.tfvars
```

Example `terraform.tfvars`:
```hcl
# Project Configuration
project_name = "healthhub"
environment  = "dev"
region      = "us-east-1"

# Frontend Configuration
frontend_domain = "dev.healthhub.example.com"
enable_cloudfront = true

# Database Configuration
dynamodb_billing_mode = "PAY_PER_REQUEST"
enable_point_in_time_recovery = true

# Security Configuration
enable_encryption = true
enable_versioning = true

# Monitoring Configuration
enable_cloudwatch_logs = true
log_retention_days = 30

# Tags
tags = {
  Project     = "HealthHub"
  Environment = "dev"
  Owner       = "DevOps Team"
  CostCenter  = "Engineering"
}
```

### Step 5: Deploy Infrastructure
```bash
# Initialize Terraform
terraform init

# Review planned changes
terraform plan -var-file="environments/dev/terraform.tfvars"

# Apply infrastructure changes
terraform apply -var-file="environments/dev/terraform.tfvars"
```

## ⚡ Backend Services Deployment

### Step 1: Configure Serverless Framework
```bash
# Install Serverless Framework globally
npm install -g serverless@3

# Verify installation
serverless --version
```

### Step 2: Configure Environment-Specific Settings
```bash
# Copy example serverless configuration
cp serverless.yml.example serverless.yml

# Edit configuration for your environment
nano serverless.yml
```

### Step 3: Deploy Backend Services
```bash
# Deploy to development environment
serverless deploy --stage dev --verbose

# Deploy to staging environment
serverless deploy --stage staging --verbose

# Deploy to production environment
serverless deploy --stage prod --verbose
```

### Step 4: Verify Deployment
```bash
# Test API endpoints
curl https://your-api-gateway-url/dev/health

# Check service logs
serverless logs -f userService --stage dev --tail
```

## 🎨 Frontend Deployment

### Step 1: Configure Frontend Environment
```bash
cd health-hub-frontend

# Create environment-specific configuration
cp .env.example .env.dev
```

Example `.env.dev`:
```bash
VITE_API_BASE_URL=https://your-api-gateway-url/dev
VITE_ENVIRONMENT=development
VITE_CLOUDFRONT_URL=https://your-cloudfront-domain
VITE_ENABLE_DEVTOOLS=true
```

### Step 2: Build Frontend Application
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Verify build
npm run preview
```

### Step 3: Deploy to S3 and CloudFront
```bash
# Get S3 bucket name from Terraform output
S3_BUCKET=$(terraform output -raw frontend_bucket_name)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)

# Sync files to S3
aws s3 sync dist/ s3://$S3_BUCKET/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths '/*'
```

## 🔄 CI/CD Pipeline Setup

### Step 1: Configure GitHub Secrets
Navigate to your GitHub repository settings and add the following secrets:

#### Development Environment
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
DEV_API_URL
DEV_FRONTEND_BUCKET
DEV_CLOUDFRONT_ID
```

#### Staging Environment
```
STAGING_API_URL
STAGING_FRONTEND_BUCKET
STAGING_CLOUDFRONT_ID
```

#### Production Environment
```
PROD_AWS_ACCESS_KEY_ID
PROD_AWS_SECRET_ACCESS_KEY
PROD_API_URL
PROD_FRONTEND_BUCKET
PROD_CLOUDFRONT_ID
```

### Step 2: Configure Branch Protection Rules
1. Go to repository Settings → Branches
2. Add protection rule for `main` branch:
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date
   - Include administrators

### Step 3: Test CI/CD Pipeline
```bash
# Create feature branch
git checkout -b feature/test-deployment

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "feat: test CI/CD pipeline"
git push origin feature/test-deployment

# Create pull request and merge to trigger deployment
```

## 🌍 Environment-Specific Deployments

### Development Environment
**Purpose**: Feature development and testing
**URL**: https://dev.healthhub.example.com
**Characteristics**:
- Automatic deployment on `develop` branch changes
- Minimal resources for cost optimization
- Debug logging enabled
- Test data only

```bash
# Deploy development environment
./deploy-dev.sh
```

### Staging Environment
**Purpose**: Pre-production testing and validation
**URL**: https://staging.healthhub.example.com
**Characteristics**:
- Manual deployment approval required
- Production-like configuration
- Performance testing enabled
- Sanitized production data

```bash
# Deploy staging environment
./deploy-staging.sh
```

### Production Environment
**Purpose**: Live application serving real users
**URL**: https://healthhub.example.com
**Characteristics**:
- Manual deployment with change management
- High availability configuration
- Comprehensive monitoring
- Real healthcare data with compliance

```bash
# Deploy production environment (requires approval)
./deploy-production.sh
```

## 🔧 Configuration Management

### Environment Variables by Service

#### User Service
```bash
JWT_SECRET_KEY=your-jwt-secret
BCRYPT_SALT_ROUNDS=12
TOKEN_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d
```

#### AI Interaction Service
```bash
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4
MAX_TOKENS=1000
TEMPERATURE=0.7
```

#### Medical Image Service
```bash
S3_BUCKET_NAME=healthhub-medical-images
MAX_FILE_SIZE=10MB
ALLOWED_FORMATS=jpg,png,dicom
```

#### Transcription Service
```bash
AWS_TRANSCRIBE_REGION=us-east-1
LANGUAGE_CODE=en-US
SAMPLE_RATE=16000
```

### Secrets Management
All sensitive configuration is stored in AWS Secrets Manager:

```bash
# Create secrets for each environment
aws secretsmanager create-secret \
  --name "healthhub/dev/database" \
  --description "Database configuration for dev environment" \
  --secret-string '{"host":"localhost","port":5432,"username":"admin","password":"secure-password"}'

# Retrieve secrets in application
aws secretsmanager get-secret-value \
  --secret-id "healthhub/dev/database" \
  --query SecretString --output text
```

## 📊 Monitoring and Logging

### CloudWatch Setup
```bash
# Create log groups for each service
aws logs create-log-group --log-group-name /aws/lambda/healthhub-dev-userService
aws logs create-log-group --log-group-name /aws/lambda/healthhub-dev-doctorService
aws logs create-log-group --log-group-name /aws/lambda/healthhub-dev-patientService

# Set retention policy
aws logs put-retention-policy \
  --log-group-name /aws/lambda/healthhub-dev-userService \
  --retention-in-days 30
```

### Custom Metrics
```javascript
// Example: Custom metric in Lambda function
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

const putMetric = async (metricName, value, unit = 'Count') => {
  const params = {
    Namespace: 'HealthHub/Application',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date()
    }]
  };
  
  await cloudwatch.putMetricData(params).promise();
};

// Usage in service
await putMetric('UserRegistrations', 1);
await putMetric('APIResponseTime', responseTime, 'Milliseconds');
```

### Alarms Configuration
```bash
# Create alarm for high error rate
aws cloudwatch put-metric-alarm \
  --alarm-name "HealthHub-HighErrorRate" \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name "Errors" \
  --namespace "AWS/Lambda" \
  --statistic "Sum" \
  --period 300 \
  --threshold 5 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 2
```

## 🔒 Security Deployment Checklist

### Pre-Deployment Security
- [ ] All secrets stored in AWS Secrets Manager
- [ ] IAM roles follow least privilege principle
- [ ] Security groups restrict access appropriately
- [ ] SSL/TLS certificates configured
- [ ] WAF rules configured for API Gateway

### Post-Deployment Security
- [ ] Vulnerability scanning completed
- [ ] Penetration testing performed
- [ ] Security headers verified
- [ ] CORS configuration validated
- [ ] Audit logging enabled

### Compliance Checklist (HIPAA)
- [ ] Data encryption at rest enabled
- [ ] Data encryption in transit enabled
- [ ] Access logging configured
- [ ] User access controls implemented
- [ ] Data retention policies configured
- [ ] Backup and recovery procedures tested

## 🧪 Testing Deployment

### Health Checks
```bash
# Backend health check
curl -f https://your-api-gateway-url/dev/health || echo "Backend health check failed"

# Frontend health check
curl -f https://your-cloudfront-domain || echo "Frontend health check failed"

# Database connectivity check
aws dynamodb describe-table --table-name healthhub-dev-users
```

### Integration Tests
```bash
# Run integration tests against deployed environment
npm run test:integration -- --env=dev

# Run load tests
npm run test:load -- --target=https://your-api-gateway-url/dev
```

### Smoke Tests
```bash
# Test critical user journeys
npm run test:smoke -- --env=dev

# Test API endpoints
npm run test:api -- --env=dev
```

## 🔄 Rollback Procedures

### Backend Rollback
```bash
# Rollback to previous version
serverless deploy --stage prod --package .serverless-previous

# Rollback specific function
serverless deploy function --function userService --stage prod --package .serverless-previous
```

### Frontend Rollback
```bash
# Restore previous S3 version
aws s3api list-object-versions --bucket your-frontend-bucket --prefix index.html
aws s3api copy-object --copy-source "your-frontend-bucket/index.html?versionId=previous-version-id" --bucket your-frontend-bucket --key index.html

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id your-distribution-id --paths '/*'
```

### Infrastructure Rollback
```bash
# Rollback Terraform changes
terraform plan -destroy -var-file="environments/prod/terraform.tfvars"
terraform apply -var-file="environments/prod/terraform.tfvars.backup"
```

## 📈 Performance Optimization

### Lambda Optimization
```yaml
# Optimize Lambda configuration in serverless.yml
functions:
  userService:
    handler: src/services/userService/handler.main
    memorySize: 512  # Optimize based on profiling
    timeout: 30      # Set appropriate timeout
    reservedConcurrency: 100  # Prevent cold starts
    environment:
      NODE_OPTIONS: '--enable-source-maps'
```

### DynamoDB Optimization
```bash
# Enable auto-scaling for DynamoDB
aws application-autoscaling register-scalable-target \
  --service-namespace dynamodb \
  --resource-id "table/healthhub-prod-users" \
  --scalable-dimension "dynamodb:table:ReadCapacityUnits" \
  --min-capacity 5 \
  --max-capacity 1000
```

### CloudFront Optimization
```javascript
// Optimize CloudFront caching in Terraform
resource "aws_cloudfront_distribution" "frontend" {
  default_cache_behavior {
    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"  # Managed-CachingOptimized
    compress        = true
    
    # Cache static assets for 1 year
    cached_methods = ["GET", "HEAD", "OPTIONS"]
    
    # Cache HTML files for 1 hour
    default_ttl = 3600
    max_ttl     = 31536000
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Lambda Cold Starts
**Problem**: High latency on first request
**Solution**:
```bash
# Enable provisioned concurrency
serverless plugin install -n serverless-plugin-warmup
```

#### 2. DynamoDB Throttling
**Problem**: ReadProvisionedThroughputExceededException
**Solution**:
```bash
# Enable auto-scaling or switch to on-demand
aws dynamodb modify-table --table-name your-table --billing-mode PAY_PER_REQUEST
```

#### 3. CloudFront Cache Issues
**Problem**: Stale content served to users
**Solution**:
```bash
# Create cache invalidation
aws cloudfront create-invalidation --distribution-id your-id --paths '/*'
```

#### 4. API Gateway CORS Errors
**Problem**: CORS policy blocks frontend requests
**Solution**:
```yaml
# Update serverless.yml
functions:
  userService:
    events:
      - http:
          path: users
          method: post
          cors:
            origin: 'https://your-frontend-domain'
            headers:
              - Content-Type
              - Authorization
```

### Debugging Commands
```bash
# View Lambda logs
serverless logs -f userService --stage prod --tail

# Check API Gateway logs
aws logs filter-log-events --log-group-name API-Gateway-Execution-Logs_your-api-id/prod

# Monitor DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=healthhub-prod-users \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

## 📞 Support and Maintenance

### Regular Maintenance Tasks
- **Weekly**: Review CloudWatch metrics and alarms
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and optimize costs
- **Annually**: Disaster recovery testing

### Support Contacts
- **DevOps Team**: devops@healthhub.example.com
- **Security Team**: security@healthhub.example.com
- **On-Call**: +1-555-0123 (24/7 support)

### Documentation Updates
Keep this deployment guide updated with:
- New environment configurations
- Updated procedures and scripts
- Lessons learned from deployments
- Performance optimization discoveries

---

This deployment guide provides comprehensive instructions for deploying the HealthHub platform across all environments. Follow the procedures carefully and maintain proper documentation for all changes.
