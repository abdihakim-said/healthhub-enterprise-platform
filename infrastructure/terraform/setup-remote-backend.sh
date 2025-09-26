#!/bin/bash

# HealthHub Remote Backend Setup Script
# This script sets up the remote S3 backend for Terraform state management

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists terraform; then
        print_error "Terraform is not installed. Please install Terraform >= 1.0"
        exit 1
    fi
    
    if ! command_exists aws; then
        print_error "AWS CLI is not installed. Please install AWS CLI"
        exit 1
    fi
    
    # Check Terraform version
    TERRAFORM_VERSION=$(terraform version -json | jq -r '.terraform_version')
    print_status "Terraform version: $TERRAFORM_VERSION"
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        print_error "AWS credentials not configured. Please run 'aws configure'"
        exit 1
    fi
    
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    AWS_REGION=$(aws configure get region)
    print_status "AWS Account: $AWS_ACCOUNT"
    print_status "AWS Region: $AWS_REGION"
    
    print_success "Prerequisites check passed!"
}

# Backup existing state
backup_existing_state() {
    if [ -f "terraform.tfstate" ]; then
        print_warning "Existing local state found. Creating backup..."
        cp terraform.tfstate "terraform.tfstate.backup.$(date +%Y%m%d_%H%M%S)"
        print_success "Local state backed up"
    fi
}

# Setup bootstrap
setup_bootstrap() {
    print_status "Setting up remote backend infrastructure..."
    
    cd bootstrap
    
    # Initialize bootstrap
    print_status "Initializing bootstrap configuration..."
    terraform init
    
    # Plan bootstrap
    print_status "Planning bootstrap deployment..."
    terraform plan -out=bootstrap.tfplan
    
    # Apply bootstrap
    print_status "Deploying bootstrap infrastructure..."
    terraform apply bootstrap.tfplan
    
    # Get outputs
    S3_BUCKET=$(terraform output -raw s3_bucket_name)
    DYNAMODB_TABLE=$(terraform output -raw dynamodb_table_name)
    
    print_success "Bootstrap infrastructure created!"
    print_status "S3 Bucket: $S3_BUCKET"
    print_status "DynamoDB Table: $DYNAMODB_TABLE"
    
    # Save outputs for main configuration
    cat > ../backend-config.txt << EOF
Backend Configuration:
bucket         = "$S3_BUCKET"
key            = "environments/dev/terraform.tfstate"
region         = "$AWS_REGION"
dynamodb_table = "$DYNAMODB_TABLE"
encrypt        = true
EOF
    
    cd ..
}

# Update main configuration
update_main_config() {
    print_status "Updating main Terraform configuration..."
    
    # Read bootstrap outputs
    cd bootstrap
    S3_BUCKET=$(terraform output -raw s3_bucket_name)
    DYNAMODB_TABLE=$(terraform output -raw dynamodb_table_name)
    cd ..
    
    # Create updated main.tf
    sed "s/healthhub-terraform-state-XXXXXXXX/$S3_BUCKET/g" main-with-remote-backend.tf > main.tf.new
    sed -i "s/healthhub-terraform-locks/$DYNAMODB_TABLE/g" main.tf.new
    
    # Backup original main.tf
    if [ -f "main.tf" ]; then
        cp main.tf "main.tf.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Replace main.tf
    mv main.tf.new main.tf
    
    print_success "Main configuration updated with remote backend"
}

# Migrate state
migrate_state() {
    print_status "Migrating state to remote backend..."
    
    # Initialize with new backend
    terraform init -migrate-state -force-copy
    
    # Verify migration
    print_status "Verifying state migration..."
    terraform state list > /dev/null
    
    print_success "State successfully migrated to remote backend!"
}

# Cleanup local state files
cleanup_local_state() {
    print_warning "Cleaning up local state files..."
    
    read -p "Remove local state files? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f terraform.tfstate*
        rm -f .terraform.lock.hcl.backup*
        print_success "Local state files removed"
    else
        print_status "Local state files preserved"
    fi
}

# Verify setup
verify_setup() {
    print_status "Verifying remote backend setup..."
    
    # Check if state is in S3
    cd bootstrap
    S3_BUCKET=$(terraform output -raw s3_bucket_name)
    cd ..
    
    if aws s3 ls "s3://$S3_BUCKET/environments/dev/terraform.tfstate" >/dev/null 2>&1; then
        print_success "Remote state file found in S3!"
    else
        print_warning "Remote state file not found in S3"
    fi
    
    # Test state operations
    terraform state list >/dev/null 2>&1 && print_success "State operations working correctly"
    
    # Show final status
    print_success "Remote backend setup completed successfully!"
    echo
    print_status "Backend Configuration:"
    cat backend-config.txt
}

# Main execution
main() {
    echo "🚀 HealthHub Remote Backend Setup"
    echo "=================================="
    echo
    
    check_prerequisites
    echo
    
    backup_existing_state
    echo
    
    setup_bootstrap
    echo
    
    update_main_config
    echo
    
    migrate_state
    echo
    
    cleanup_local_state
    echo
    
    verify_setup
    echo
    
    print_success "🎉 Remote backend setup completed!"
    echo
    print_status "Next steps:"
    echo "1. Commit the updated main.tf to version control"
    echo "2. Update your CI/CD pipelines to use the remote backend"
    echo "3. Share the backend configuration with your team"
    echo "4. Consider setting up workspace-specific configurations for different environments"
    echo
    print_status "For different environments, use:"
    echo "  terraform init -backend-config=\"key=environments/staging/terraform.tfstate\""
    echo "  terraform init -backend-config=\"key=environments/prod/terraform.tfstate\""
}

# Run main function
main "$@"
