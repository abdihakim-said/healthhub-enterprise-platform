# HealthHub - CORRECTED Implementation Guide

## 🏗️ Actual Architecture Overview

Based on the project analysis, here's the **ACTUAL** deployment architecture:

### **Serverless Framework Deploys:**
- ✅ **7 Microservices** (Lambda functions)
- ✅ **HTTP API Gateway** (Backend APIs)
- ✅ **DynamoDB Tables** (Data storage)
- ✅ **Cognito User Pool** (Authentication)
- ✅ **CloudWatch Logs** (Application logging)
- ✅ **X-Ray Tracing** (Distributed tracing)

### **Terraform Deploys:**
- ✅ **Frontend Infrastructure** (S3 + CloudFront)
- ✅ **AWS Secrets Manager** (API key storage)
- ✅ **Security Services** (GuardDuty, CloudTrail)
- ✅ **Monitoring** (CloudWatch dashboards, alarms)

### **Current State:**
- ✅ **Frontend URL**: https://d1l7hv4cljacb9.cloudfront.net
- ✅ **Backend API**: https://m8vbgbh2hl.execute-api.us-east-1.amazonaws.com
- ⚠️ **Terraform State**: Local (not remote S3 backend)

## 🚀 Corrected Deployment Steps

### Phase 1: Setup Remote State Backend (RECOMMENDED)

```bash
# Create S3 bucket for Terraform state
aws s3 mb s3://healthhub-terraform-state-$(date +%s)
aws s3api put-bucket-versioning --bucket healthhub-terraform-state-$(date +%s) --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

# Update main.tf to use remote backend
cd health-hub-backend/terraform
```

**Update main.tf:**
```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
  
  backend "s3" {
    bucket         = "healthhub-terraform-state-YOUR_TIMESTAMP"
    key            = "backend/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

```bash
# Migrate to remote state
terraform init -migrate-state
```

### Phase 2: Deploy Infrastructure (Terraform)

```bash
cd health-hub-backend/terraform

# Initialize and validate
terraform init
terraform validate

# Deploy infrastructure modules
terraform apply -var="environment=dev" -var="alert_email=your-email@domain.com" -auto-approve
```

**What gets deployed:**
- AWS Secrets Manager (for API keys)
- S3 bucket for frontend hosting
- CloudFront distribution
- CloudWatch dashboards and alarms
- GuardDuty threat detection
- CloudTrail audit logging

### Phase 3: Configure Secrets

```bash
# Get secret setup commands from Terraform output
terraform output secrets_setup_commands

# Populate secrets with actual API keys
aws secretsmanager put-secret-value \
  --secret-id "healthhub/dev/openai-credentials" \
  --secret-string '{"api_key":"sk-your-openai-key","assistant_id":"your-assistant-id"}'

aws secretsmanager put-secret-value \
  --secret-id "healthhub/dev/azure-speech-credentials" \
  --secret-string '{"speech_key":"your-azure-key","speech_region":"centralus"}'

aws secretsmanager put-secret-value \
  --secret-id "healthhub/dev/google-vision-credentials" \
  --secret-string file://google-credentials.json
```

### Phase 4: Deploy Backend Services (Serverless)

```bash
cd ../  # Back to health-hub-backend root

# Install dependencies
npm install

# Install dependencies for each service
for service in src/services/*; do
  echo "Installing dependencies for $service"
  (cd "$service" && npm install)
done

# Deploy all services using serverless-compose
serverless deploy --stage dev --region us-east-1
```

**What gets deployed by Serverless:**
- 7 Lambda-based microservices
- HTTP API Gateway with routes
- DynamoDB tables with GSI indexes
- Cognito User Pool and Client
- CloudWatch Log Groups
- X-Ray tracing configuration

### Phase 5: Build and Deploy Frontend

```bash
# Build React frontend
cd ../health-hub-frontend
npm install
npm run build

# Get deployment commands from Terraform
cd ../health-hub-backend/terraform
terraform output deployment_commands

# Deploy frontend to S3 and invalidate CloudFront
aws s3 sync ../health-hub-frontend/dist/ s3://healthhub-dev-frontend-zk3kv17r/ --delete
aws cloudfront create-invalidation --distribution-id E3266EAF87XUR6 --paths '/*'
```

## 📊 Current Deployed Architecture

### **Backend Services (Serverless)**
```
API Gateway: https://m8vbgbh2hl.execute-api.us-east-1.amazonaws.com
├── /users          (user-service)
├── /appointments   (appointment-service)
├── /doctors        (doctor-service)
├── /patients       (patient-service)
├── /ai-interaction (ai-interaction-service)
├── /transcription  (transcription-service)
└── /medical-images (medical-image-service)
```

### **Frontend (Terraform + Manual Deploy)**
```
CloudFront: https://d1l7hv4cljacb9.cloudfront.net
└── S3 Bucket: healthhub-dev-frontend-zk3kv17r
```

### **Infrastructure Services (Terraform)**
```
AWS Secrets Manager:
├── healthhub/dev/openai-credentials
├── healthhub/dev/azure-speech-credentials
└── healthhub/dev/google-vision-credentials

Security:
├── GuardDuty (threat detection)
├── CloudTrail (audit logging)
└── CloudWatch (monitoring & alarms)
```

## 🔧 Actual Service Deployment Details

### **User Service (Serverless)**
```yaml
# Creates:
- Lambda Functions: createUser, getUser, updateUser, deleteUser, listUsers, login, register
- DynamoDB Table: hh-user-dev-users (with GSI indexes)
- Cognito User Pool: hh-user-pool-dev
- HTTP API Routes: POST/GET/PUT/DELETE /users, POST /login, POST /register
```

### **AI Interaction Service (Serverless)**
```yaml
# Creates:
- Lambda Functions: chat, textToSpeech, getConversations
- DynamoDB Table: hh-ai-interaction-dev-conversations
- HTTP API Routes: POST /ai-interaction/chat, POST /ai-interaction/text-to-speech
- Integrates with: OpenAI GPT, Amazon Polly
```

### **Medical Image Service (Serverless)**
```yaml
# Creates:
- Lambda Functions: uploadImage, analyzeImage, getAnalysis
- DynamoDB Table: hh-medical-image-dev-images
- S3 Bucket: Medical image storage
- HTTP API Routes: POST /medical-images/upload, POST /medical-images/analyze
- Integrates with: Google Cloud Vision API
```

### **Transcription Service (Serverless)**
```yaml
# Creates:
- Lambda Functions: transcribeAudio, getTranscription
- DynamoDB Table: hh-transcription-dev-transcriptions
- HTTP API Routes: POST /transcription/transcribe
- Integrates with: Azure Speech Services
```

## 🔄 Deployment Commands Summary

### **Complete Fresh Deployment:**
```bash
# 1. Deploy infrastructure
cd health-hub-backend/terraform
terraform apply -var="environment=dev" -var="alert_email=your-email@domain.com"

# 2. Configure secrets
aws secretsmanager put-secret-value --secret-id "healthhub/dev/openai-credentials" --secret-string '{"api_key":"your-key","assistant_id":"your-id"}'
aws secretsmanager put-secret-value --secret-id "healthhub/dev/azure-speech-credentials" --secret-string '{"speech_key":"your-key","speech_region":"centralus"}'
aws secretsmanager put-secret-value --secret-id "healthhub/dev/google-vision-credentials" --secret-string file://google-credentials.json

# 3. Deploy backend services
cd ../
serverless deploy --stage dev

# 4. Build and deploy frontend
cd ../health-hub-frontend
npm run build
aws s3 sync dist/ s3://healthhub-dev-frontend-zk3kv17r/ --delete
aws cloudfront create-invalidation --distribution-id E3266EAF87XUR6 --paths '/*'
```

### **Update Deployments:**
```bash
# Update backend services only
cd health-hub-backend
serverless deploy --stage dev

# Update frontend only
cd health-hub-frontend
npm run build
aws s3 sync dist/ s3://healthhub-dev-frontend-zk3kv17r/ --delete
aws cloudfront create-invalidation --distribution-id E3266EAF87XUR6 --paths '/*'

# Update infrastructure only
cd health-hub-backend/terraform
terraform apply -var="environment=dev" -var="alert_email=your-email@domain.com"
```

## 🧪 Validation Commands

### **Test Backend APIs:**
```bash
# Test user service
curl -X GET "https://m8vbgbh2hl.execute-api.us-east-1.amazonaws.com/users"

# Test AI interaction
curl -X POST "https://m8vbgbh2hl.execute-api.us-east-1.amazonaws.com/ai-interaction/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, how can you help me?"}'

# Test transcription service
curl -X POST "https://m8vbgbh2hl.execute-api.us-east-1.amazonaws.com/transcription/transcribe" \
  -H "Content-Type: application/json" \
  -d '{"audioUrl":"https://example.com/audio.wav"}'
```

### **Verify Infrastructure:**
```bash
# Check Terraform outputs
cd health-hub-backend/terraform
terraform output

# Verify secrets
aws secretsmanager list-secrets --query 'SecretList[?contains(Name, `healthhub`)].Name'

# Check CloudWatch dashboards
aws cloudwatch list-dashboards --query 'DashboardEntries[?contains(DashboardName, `healthhub`)]'
```

### **Frontend Validation:**
```bash
# Test frontend URL
curl -I https://d1l7hv4cljacb9.cloudfront.net

# Check S3 bucket contents
aws s3 ls s3://healthhub-dev-frontend-zk3kv17r/

# Verify CloudFront distribution
aws cloudfront get-distribution --id E3266EAF87XUR6
```

## 📋 Deployment Checklist

### **Pre-Deployment:**
- [ ] AWS CLI configured with appropriate permissions
- [ ] Node.js 18+ and npm installed
- [ ] Serverless Framework v3 installed
- [ ] Terraform 1.0+ installed
- [ ] API keys obtained (OpenAI, Azure, Google Cloud)

### **Infrastructure (Terraform):**
- [ ] Remote state backend configured (recommended)
- [ ] Terraform modules deployed successfully
- [ ] AWS Secrets Manager secrets populated
- [ ] CloudWatch dashboards created
- [ ] Security services enabled

### **Backend (Serverless):**
- [ ] All 7 microservices deployed
- [ ] HTTP API Gateway responding
- [ ] DynamoDB tables created with indexes
- [ ] Lambda functions have correct permissions
- [ ] Cognito User Pool configured

### **Frontend:**
- [ ] React app built successfully
- [ ] Files uploaded to S3 bucket
- [ ] CloudFront distribution active
- [ ] Frontend accessible via CloudFront URL

### **Validation:**
- [ ] All API endpoints responding
- [ ] Frontend loads correctly
- [ ] AI services integration working
- [ ] Monitoring and logging functional
- [ ] Security services active

## 🔧 Troubleshooting

### **Serverless Issues:**
```bash
# Check deployment status
serverless info --stage dev

# View logs
serverless logs --function createUser --stage dev --tail

# Remove and redeploy
serverless remove --stage dev
serverless deploy --stage dev
```

### **Terraform Issues:**
```bash
# Check state
terraform show

# Refresh state
terraform refresh -var="environment=dev"

# Import existing resources if needed
terraform import aws_s3_bucket.frontend healthhub-dev-frontend-zk3kv17r
```

### **Frontend Issues:**
```bash
# Check build
npm run build

# Verify S3 sync
aws s3 sync dist/ s3://healthhub-dev-frontend-zk3kv17r/ --dryrun

# Check CloudFront cache
aws cloudfront get-invalidation --distribution-id E3266EAF87XUR6 --id YOUR_INVALIDATION_ID
```

---

This corrected guide reflects the actual deployment architecture where Serverless handles the backend APIs and Terraform handles the frontend infrastructure and supporting services.
