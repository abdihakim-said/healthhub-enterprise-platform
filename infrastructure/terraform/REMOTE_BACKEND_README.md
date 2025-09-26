# HealthHub Terraform Remote Backend Setup

## 🎯 Overview

This directory contains a complete remote backend setup for the HealthHub project using AWS S3 for state storage and DynamoDB for state locking. The setup follows Terraform best practices and provides enterprise-grade state management.

## 📁 Directory Structure

```
terraform/
├── bootstrap/                    # Bootstrap module (run first)
│   ├── main.tf                  # Bootstrap infrastructure
│   ├── variables.tf             # Bootstrap variables
│   ├── outputs.tf               # Bootstrap outputs
│   └── terraform.tfvars.example # Example configuration
├── environments/                # Environment-specific configs
│   ├── dev.tfvars              # Development environment
│   ├── staging.tfvars          # Staging environment
│   └── prod.tfvars             # Production environment
├── modules/                     # Terraform modules
│   ├── secrets/                # Secrets management
│   ├── monitoring/             # CloudWatch monitoring
│   ├── security/               # Security services
│   ├── frontend/               # Frontend infrastructure
│   └── cloudfront/             # CDN distribution
├── main.tf                     # Main Terraform configuration
├── main-with-remote-backend.tf # Template for remote backend
├── setup-remote-backend.sh     # Automated setup script
└── REMOTE_BACKEND_README.md    # This file
```

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Navigate to terraform directory
cd health-hub-backend/terraform

# Run the automated setup script
./setup-remote-backend.sh
```

### Option 2: Manual Setup

```bash
# 1. Create bootstrap infrastructure
cd bootstrap
terraform init
terraform apply

# 2. Get backend configuration
terraform output backend_config_dev

# 3. Update main.tf with the backend configuration
cd ..
# Copy the backend block from bootstrap output to main.tf

# 4. Migrate state
terraform init -migrate-state

# 5. Verify migration
terraform state list
```

## 🏗️ Bootstrap Module

The bootstrap module creates the foundational infrastructure for remote state management:

### Resources Created

- **S3 Bucket**: Encrypted storage for Terraform state files
- **DynamoDB Table**: State locking to prevent concurrent modifications
- **IAM Policies**: Least-privilege access for Terraform operations
- **IAM Role**: CI/CD role for automated deployments
- **CloudWatch Log Group**: Logging for backend operations

### Security Features

- ✅ **S3 Encryption**: AES-256 encryption at rest
- ✅ **S3 Versioning**: State file versioning for rollback capability
- ✅ **S3 Public Access Block**: Prevents accidental public access
- ✅ **DynamoDB Encryption**: Server-side encryption enabled
- ✅ **DynamoDB Point-in-Time Recovery**: Data protection
- ✅ **IAM Least Privilege**: Minimal required permissions
- ✅ **Lifecycle Management**: Automatic cleanup of old versions

### Cost Optimization

- ✅ **S3 Lifecycle Policy**: Transitions old versions to IA storage
- ✅ **DynamoDB Pay-per-Request**: No fixed capacity costs
- ✅ **CloudWatch Log Retention**: Configurable retention periods
- ✅ **Resource Tagging**: Cost allocation and tracking

## 🔧 Configuration

### Bootstrap Configuration

Create `bootstrap/terraform.tfvars`:

```hcl
# AWS Configuration
aws_region   = "us-east-1"
project_name = "healthhub"

# Environments
environments = ["dev", "staging", "prod"]

# Retention Settings
state_retention_days = 90
log_retention_days   = 30

# Security Settings
enable_point_in_time_recovery = true
enable_mfa_delete            = false

# Additional tags
additional_tags = {
  Owner      = "DevOps Team"
  CostCenter = "Engineering"
  Compliance = "HIPAA"
}
```

### Environment-Specific Configuration

Each environment has its own `.tfvars` file:

```bash
# Development
terraform apply -var-file="environments/dev.tfvars"

# Staging
terraform apply -var-file="environments/staging.tfvars"

# Production
terraform apply -var-file="environments/prod.tfvars"
```

## 🔄 Multi-Environment State Management

The remote backend supports multiple environments with separate state files:

```
S3 Bucket Structure:
healthhub-terraform-state-xxxxxxxx/
├── environments/
│   ├── dev/terraform.tfstate
│   ├── staging/terraform.tfstate
│   └── prod/terraform.tfstate
└── bootstrap/terraform.tfstate
```

### Switching Between Environments

```bash
# Initialize for development
terraform init -backend-config="key=environments/dev/terraform.tfstate"

# Initialize for staging
terraform init -backend-config="key=environments/staging/terraform.tfstate"

# Initialize for production
terraform init -backend-config="key=environments/prod/terraform.tfstate"
```

## 🔒 Security Best Practices

### IAM Permissions

The bootstrap creates minimal IAM policies:

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

### State Locking

DynamoDB provides distributed locking:

- **Lock ID**: Unique identifier for each Terraform operation
- **Automatic Cleanup**: Locks are automatically released
- **Conflict Prevention**: Prevents concurrent state modifications
- **Timeout Handling**: Configurable lock timeout

## 🚨 Troubleshooting

### Common Issues

#### State Lock Stuck

```bash
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>

# Check lock status
aws dynamodb get-item \
  --table-name healthhub-terraform-locks \
  --key '{"LockID":{"S":"healthhub-terraform-state-bucket/environments/dev/terraform.tfstate"}}'
```

#### Backend Configuration Errors

```bash
# Reconfigure backend
terraform init -reconfigure

# Migrate from different backend
terraform init -migrate-state
```

#### Permission Issues

```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify S3 access
aws s3 ls s3://healthhub-terraform-state-xxxxxxxx/

# Check DynamoDB access
aws dynamodb describe-table --table-name healthhub-terraform-locks
```

### State Recovery

If state becomes corrupted:

1. **Check S3 Versions**: List all state file versions
2. **Restore Previous Version**: Download and restore working state
3. **Verify Resources**: Compare state with actual AWS resources
4. **Import Missing Resources**: Use `terraform import` if needed

```bash
# List state versions
aws s3api list-object-versions \
  --bucket healthhub-terraform-state-xxxxxxxx \
  --prefix environments/dev/terraform.tfstate

# Download specific version
aws s3api get-object \
  --bucket healthhub-terraform-state-xxxxxxxx \
  --key environments/dev/terraform.tfstate \
  --version-id <VERSION_ID> \
  terraform.tfstate.recovered
```

## 📊 Monitoring and Maintenance

### CloudWatch Metrics

Monitor backend health:

- **S3 Bucket Size**: Track state file growth
- **DynamoDB Operations**: Monitor lock operations
- **API Calls**: Track Terraform operations

### Maintenance Tasks

#### Weekly
- [ ] Review state file sizes
- [ ] Check for stuck locks
- [ ] Verify backup retention

#### Monthly
- [ ] Review access logs
- [ ] Update IAM policies if needed
- [ ] Check cost optimization opportunities

#### Quarterly
- [ ] Review and update retention policies
- [ ] Audit access permissions
- [ ] Test disaster recovery procedures

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Terraform
on:
  push:
    branches: [main]

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0
      
      - name: Terraform Init
        run: |
          cd health-hub-backend/terraform
          terraform init \
            -backend-config="key=environments/${{ github.ref_name }}/terraform.tfstate"
      
      - name: Terraform Plan
        run: |
          cd health-hub-backend/terraform
          terraform plan -var-file="environments/${{ github.ref_name }}.tfvars"
      
      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        run: |
          cd health-hub-backend/terraform
          terraform apply -auto-approve -var-file="environments/prod.tfvars"
```

### GitLab CI

```yaml
stages:
  - validate
  - plan
  - apply

variables:
  TF_ROOT: health-hub-backend/terraform
  TF_STATE_NAME: environments/${CI_COMMIT_REF_NAME}

before_script:
  - cd $TF_ROOT
  - terraform init -backend-config="key=${TF_STATE_NAME}/terraform.tfstate"

validate:
  stage: validate
  script:
    - terraform validate
    - terraform fmt -check

plan:
  stage: plan
  script:
    - terraform plan -var-file="environments/${CI_COMMIT_REF_NAME}.tfvars"
  artifacts:
    paths:
      - $TF_ROOT/plan.tfplan

apply:
  stage: apply
  script:
    - terraform apply -auto-approve plan.tfplan
  only:
    - main
  when: manual
```

## 📚 Additional Resources

- [Terraform S3 Backend Documentation](https://www.terraform.io/docs/language/settings/backends/s3.html)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/s3/latest/userguide/security-best-practices.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Terraform State Management](https://www.terraform.io/docs/language/state/index.html)

---

**Note**: Always test the remote backend setup in a development environment before applying to production. Keep the bootstrap state file secure as it contains the configuration for your entire remote backend infrastructure.
