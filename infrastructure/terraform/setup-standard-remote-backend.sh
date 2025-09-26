#!/bin/bash

# Standard Remote Backend Setup for HealthHub
# This creates S3 bucket and DynamoDB table using AWS CLI, then migrates Terraform state

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Configuration
PROJECT_NAME="healthhub"
AWS_REGION="us-east-1"
TIMESTAMP=$(date +%s)
S3_BUCKET="${PROJECT_NAME}-terraform-state-${TIMESTAMP}"
DYNAMODB_TABLE="${PROJECT_NAME}-terraform-locks"

echo "🚀 HealthHub Standard Remote Backend Setup"
echo "=========================================="
echo

print_status "Configuration:"
echo "  Project: $PROJECT_NAME"
echo "  Region: $AWS_REGION"
echo "  S3 Bucket: $S3_BUCKET"
echo "  DynamoDB Table: $DYNAMODB_TABLE"
echo

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure'"
    exit 1
fi

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
print_status "AWS Account: $AWS_ACCOUNT"

# Step 1: Create S3 bucket
print_status "Creating S3 bucket for Terraform state..."
aws s3 mb "s3://$S3_BUCKET" --region "$AWS_REGION"

# Enable versioning
print_status "Enabling S3 bucket versioning..."
aws s3api put-bucket-versioning \
  --bucket "$S3_BUCKET" \
  --versioning-configuration Status=Enabled

# Enable encryption
print_status "Enabling S3 bucket encryption..."
aws s3api put-bucket-encryption \
  --bucket "$S3_BUCKET" \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        },
        "BucketKeyEnabled": true
      }
    ]
  }'

# Block public access
print_status "Blocking public access to S3 bucket..."
aws s3api put-public-access-block \
  --bucket "$S3_BUCKET" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

print_success "S3 bucket created and configured!"

# Step 2: Create DynamoDB table
print_status "Creating DynamoDB table for state locking..."
aws dynamodb create-table \
  --table-name "$DYNAMODB_TABLE" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$AWS_REGION" \
  --tags Key=Project,Value="$PROJECT_NAME" Key=Purpose,Value=TerraformStateLocking

# Wait for table to be active
print_status "Waiting for DynamoDB table to be active..."
aws dynamodb wait table-exists --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION"

print_success "DynamoDB table created!"

# Step 3: Create backend configuration
print_status "Creating backend configuration..."

# Backup existing main.tf
if [ -f "main.tf" ]; then
    cp main.tf "main.tf.backup.$(date +%Y%m%d_%H%M%S)"
    print_warning "Existing main.tf backed up"
fi

# Update main.tf with backend configuration
cat > backend-config.hcl << EOF
# Add this backend block to your main.tf terraform block:

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
    bucket         = "$S3_BUCKET"
    key            = "environments/dev/terraform.tfstate"
    region         = "$AWS_REGION"
    dynamodb_table = "$DYNAMODB_TABLE"
    encrypt        = true
  }
}
EOF

# Update main.tf automatically
if [ -f "main.tf" ]; then
    print_status "Updating main.tf with backend configuration..."
    
    # Create new main.tf with backend
    awk '
    /^terraform {/ { 
        print $0
        print "  required_version = \">= 1.0\""
        print "  required_providers {"
        print "    aws = {"
        print "      source  = \"hashicorp/aws\""
        print "      version = \"~> 5.0\""
        print "    }"
        print "    random = {"
        print "      source  = \"hashicorp/random\""
        print "      version = \"~> 3.1\""
        print "    }"
        print "  }"
        print ""
        print "  backend \"s3\" {"
        print "    bucket         = \"'$S3_BUCKET'\""
        print "    key            = \"environments/dev/terraform.tfstate\""
        print "    region         = \"'$AWS_REGION'\""
        print "    dynamodb_table = \"'$DYNAMODB_TABLE'\""
        print "    encrypt        = true"
        print "  }"
        
        # Skip until closing brace
        brace_count = 1
        while ((getline line) > 0) {
            if (line ~ /{/) brace_count++
            if (line ~ /}/) brace_count--
            if (brace_count == 0) {
                print "}"
                break
            }
        }
        next
    }
    { print }
    ' main.tf > main.tf.new && mv main.tf.new main.tf
    
    print_success "main.tf updated with backend configuration"
else
    print_warning "main.tf not found. Please add the backend configuration manually."
fi

# Step 4: Initialize and migrate state
print_status "Initializing Terraform with remote backend..."

# Backup local state if it exists
if [ -f "terraform.tfstate" ]; then
    cp terraform.tfstate "terraform.tfstate.backup.$(date +%Y%m%d_%H%M%S)"
    print_warning "Local state backed up"
fi

# Initialize with new backend
terraform init -migrate-state

print_success "State migrated to remote backend!"

# Step 5: Verify setup
print_status "Verifying remote backend setup..."

# Test state operations
terraform state list > /dev/null 2>&1 && print_success "State operations working correctly"

# Check if state is in S3
if aws s3 ls "s3://$S3_BUCKET/environments/dev/terraform.tfstate" &> /dev/null; then
    print_success "Remote state file confirmed in S3!"
else
    print_warning "Remote state file not yet in S3 (this is normal if no resources exist)"
fi

# Create summary
cat > remote-backend-info.txt << EOF
HealthHub Remote Backend Configuration
=====================================

S3 Bucket: $S3_BUCKET
DynamoDB Table: $DYNAMODB_TABLE
Region: $AWS_REGION
State Key: environments/dev/terraform.tfstate

Backend Configuration (already added to main.tf):
backend "s3" {
  bucket         = "$S3_BUCKET"
  key            = "environments/dev/terraform.tfstate"
  region         = "$AWS_REGION"
  dynamodb_table = "$DYNAMODB_TABLE"
  encrypt        = true
}

For other environments, use different keys:
- Staging: environments/staging/terraform.tfstate
- Production: environments/prod/terraform.tfstate

To switch environments:
terraform init -backend-config="key=environments/staging/terraform.tfstate"
terraform init -backend-config="key=environments/prod/terraform.tfstate"
EOF

echo
print_success "🎉 Remote backend setup completed!"
echo
print_status "Summary saved to: remote-backend-info.txt"
echo
print_status "Next steps:"
echo "1. Commit the updated main.tf to version control"
echo "2. Share the backend configuration with your team"
echo "3. Set up environment-specific state keys for staging/prod"
echo
print_status "Your Terraform state is now:"
echo "✅ Stored remotely in S3"
echo "✅ Locked with DynamoDB"
echo "✅ Encrypted at rest"
echo "✅ Versioned for rollback"
echo "✅ Shared with your team"
