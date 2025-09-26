# HealthHub Terraform Remote Backend Setup Guide

## 🎯 Overview

This guide provides step-by-step instructions for setting up Terraform remote backend for the HealthHub project using AWS S3 for state storage and DynamoDB for state locking.

## 📁 Module Architecture

### Parent-Child Module Structure
```
modules/remote-backend/
├── main.tf                    # Parent module orchestration
├── variables.tf               # Parent module variables
├── outputs.tf                 # Parent module outputs
├── s3-backend/               # Child module for S3 bucket
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── dynamodb-backend/         # Child module for DynamoDB table
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── iam-backend/              # Child module for IAM policies
    ├── main.tf
    ├── variables.tf
    └── outputs.tf
```

### Module Benefits
- **Separation of Concerns**: Each child module handles specific functionality
- **Reusability**: Modules can be used independently or together
- **Maintainability**: Changes to one component don't affect others
- **Testability**: Each module can be tested independently

## 🚀 Quick Setup Options

### Option 1: Automated Setup (Recommended)
```bash
cd health-hub-backend/terraform
./setup-standard-remote-backend.sh
```

### Option 2: Module-Based Setup
```bash
# Create a separate directory for backend setup
mkdir terraform-backend-setup
cd terraform-backend-setup

# Create main.tf using the remote-backend module
cat > main.tf << 'EOF'
module "remote_backend" {
  source = "../modules/remote-backend"
  
  project_name = "healthhub"
  environment  = "shared"
  aws_region   = "us-east-1"
  
  tags = {
    Project     = "HealthHub"
    Environment = "shared"
    Purpose     = "RemoteBackend"
    ManagedBy   = "Terraform"
  }
}

output "backend_config" {
  value = module.remote_backend.backend_config_hcl
}
EOF

# Initialize and apply
terraform init
terraform apply

# Get backend configuration
terraform output backend_config
```

## 🔧 Manual Setup Process

### Step 1: Create S3 Bucket
```bash
# Set variables
PROJECT_NAME="healthhub"
AWS_REGION="us-east-1"
TIMESTAMP=$(date +%s)
S3_BUCKET="${PROJECT_NAME}-terraform-state-${TIMESTAMP}"

# Create bucket
aws s3 mb "s3://$S3_BUCKET" --region "$AWS_REGION"

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket "$S3_BUCKET" \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket "$S3_BUCKET" \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket "$S3_BUCKET" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### Step 2: Create DynamoDB Table
```bash
DYNAMODB_TABLE="${PROJECT_NAME}-terraform-locks"

# Create table
aws dynamodb create-table \
  --table-name "$DYNAMODB_TABLE" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$AWS_REGION"

# Wait for table to be active
aws dynamodb wait table-exists --table-name "$DYNAMODB_TABLE"
```

### Step 3: Update main.tf
```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "healthhub-terraform-state-1234567890"
    key            = "environments/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "healthhub-terraform-locks"
    encrypt        = true
  }
}
```

### Step 4: Migrate State
```bash
# Initialize with new backend
terraform init -migrate-state

# Verify migration
terraform state list
```

## 🌍 Multi-Environment Configuration

### Environment-Specific State Keys
```bash
# Development
terraform init -backend-config="key=environments/dev/terraform.tfstate"

# Staging
terraform init -backend-config="key=environments/staging/terraform.tfstate"

# Production
terraform init -backend-config="key=environments/prod/terraform.tfstate"
```

### Environment Variables
```bash
# Set environment-specific variables
export TF_VAR_environment="dev"
export TF_VAR_alert_email="devops-dev@yourdomain.com"

# Apply with environment-specific config
terraform apply -var-file="environments/dev.tfvars"
```

## 🔒 Security Configuration

### IAM Policy for Backend Access
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketVersioning"
      ],
      "Resource": "arn:aws:s3:::healthhub-terraform-state-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::healthhub-terraform-state-*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/healthhub-terraform-locks"
    }
  ]
}
```

### CI/CD Role Configuration
```bash
# Create role for GitHub Actions
aws iam create-role \
  --role-name healthhub-terraform-cicd \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
        },
        "Action": "sts:AssumeRoleWithWebIdentity",
        "Condition": {
          "StringEquals": {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
            "token.actions.githubusercontent.com:sub": "repo:your-org/healthhub:ref:refs/heads/main"
          }
        }
      }
    ]
  }'

# Attach backend policy
aws iam attach-role-policy \
  --role-name healthhub-terraform-cicd \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/healthhub-terraform-backend-policy
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Terraform Infrastructure

on:
  push:
    branches: [main, develop]
    paths: ['terraform/**']

env:
  AWS_REGION: us-east-1

jobs:
  terraform:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/healthhub-terraform-cicd
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0
      
      - name: Terraform Init
        working-directory: ./terraform
        run: |
          terraform init \
            -backend-config="key=environments/${{ github.ref_name }}/terraform.tfstate"
      
      - name: Terraform Plan
        working-directory: ./terraform
        run: |
          terraform plan \
            -var-file="environments/${{ github.ref_name }}.tfvars" \
            -out=tfplan
      
      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        working-directory: ./terraform
        run: terraform apply tfplan
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### State Lock Stuck
```bash
# Check lock status
aws dynamodb get-item \
  --table-name healthhub-terraform-locks \
  --key '{"LockID":{"S":"healthhub-terraform-state-bucket/environments/dev/terraform.tfstate"}}'

# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

#### Backend Configuration Errors
```bash
# Reconfigure backend
terraform init -reconfigure

# Migrate from different backend
terraform init -migrate-state -force-copy
```

#### Permission Issues
```bash
# Test S3 access
aws s3 ls s3://healthhub-terraform-state-bucket/

# Test DynamoDB access
aws dynamodb describe-table --table-name healthhub-terraform-locks

# Verify IAM permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT_ID:user/terraform-user \
  --action-names s3:GetObject \
  --resource-arns arn:aws:s3:::healthhub-terraform-state-bucket/*
```

## 📊 Monitoring and Maintenance

### CloudWatch Metrics
```bash
# Monitor S3 bucket size
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name BucketSizeBytes \
  --dimensions Name=BucketName,Value=healthhub-terraform-state-bucket Name=StorageType,Value=StandardStorage \
  --start-time $(date -d '1 day ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Average

# Monitor DynamoDB operations
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=healthhub-terraform-locks \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### Backup Verification
```bash
# List state file versions
aws s3api list-object-versions \
  --bucket healthhub-terraform-state-bucket \
  --prefix environments/prod/terraform.tfstate

# Download specific version for recovery
aws s3api get-object \
  --bucket healthhub-terraform-state-bucket \
  --key environments/prod/terraform.tfstate \
  --version-id <VERSION_ID> \
  terraform.tfstate.backup
```

## 💰 Cost Optimization

### S3 Lifecycle Policy
```json
{
  "Rules": [
    {
      "ID": "TerraformStateLifecycle",
      "Status": "Enabled",
      "NoncurrentVersionTransitions": [
        {
          "NoncurrentDays": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "NoncurrentDays": 60,
          "StorageClass": "GLACIER"
        }
      ],
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 90
      }
    }
  ]
}
```

### Cost Monitoring
```bash
# Set up billing alerts
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget '{
    "BudgetName": "TerraformBackendCosts",
    "BudgetLimit": {
      "Amount": "50",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST",
    "CostFilters": {
      "Service": ["Amazon Simple Storage Service", "Amazon DynamoDB"]
    }
  }'
```

## ✅ Verification Checklist

### Post-Setup Verification
- [ ] S3 bucket created with encryption enabled
- [ ] S3 versioning enabled
- [ ] S3 public access blocked
- [ ] DynamoDB table created with encryption
- [ ] IAM policies created with least privilege
- [ ] State successfully migrated to remote backend
- [ ] State locking working correctly
- [ ] Environment isolation configured
- [ ] CI/CD integration tested
- [ ] Backup and recovery procedures documented
- [ ] Monitoring and alerting configured
- [ ] Cost optimization implemented

### Security Checklist
- [ ] All data encrypted at rest and in transit
- [ ] IAM policies follow least privilege principle
- [ ] Cross-account access properly configured
- [ ] Audit logging enabled (CloudTrail)
- [ ] Access patterns monitored
- [ ] Compliance requirements met (HIPAA)

---

This comprehensive setup guide ensures your Terraform remote backend is secure, scalable, and production-ready for the HealthHub healthcare platform.
