# 🏗️ HealthHub Infrastructure - Terraform Modules

This directory contains the Infrastructure as Code (IaC) implementation for the HealthHub platform using Terraform with a modular, scalable architecture.

## 📁 Directory Structure

```
terraform/
├── 📂 modules/                 # Reusable Terraform modules
│   ├── 📂 remote-backend/     # S3 + DynamoDB remote state
│   ├── 📂 s3/                 # S3 bucket configurations
│   ├── 📂 dynamodb/           # DynamoDB table setups
│   └── 📂 iam/                # IAM roles and policies
├── 📂 environments/           # Environment-specific configs
│   ├── 📂 dev/                # Development environment
│   ├── 📂 staging/            # Staging environment
│   └── 📂 prod/               # Production environment
├── 📂 bootstrap/              # Initial setup scripts
├── 📄 main.tf                 # Root configuration
├── 📄 variables.tf            # Input variables
├── 📄 outputs.tf              # Output values
└── 📄 terraform.tfvars.example # Example variables
```

## 🚀 Quick Start

### 1. Setup Remote Backend
```bash
# Run the bootstrap script to create remote state infrastructure
./setup-standard-remote-backend.sh

# Initialize Terraform with remote backend
terraform init
```

### 2. Plan Infrastructure
```bash
# Review planned changes
terraform plan -var-file="environments/dev/terraform.tfvars"
```

### 3. Deploy Infrastructure
```bash
# Apply infrastructure changes
terraform apply -var-file="environments/dev/terraform.tfvars"
```

## 🏗️ Module Architecture

### Remote Backend Module
**Purpose**: Manages Terraform state with S3 + DynamoDB locking

**Features**:
- S3 bucket with versioning and encryption
- DynamoDB table for state locking
- IAM policies for secure access
- Cross-region replication support

**Usage**:
```hcl
module "remote_backend" {
  source = "./modules/remote-backend"
  
  project_name = "healthhub"
  environment  = "dev"
  region      = "us-east-1"
}
```

### S3 Module
**Purpose**: Creates and configures S3 buckets for various use cases

**Features**:
- Encryption at rest (AES-256)
- Versioning and lifecycle policies
- Public access blocking
- CORS configuration for frontend

**Usage**:
```hcl
module "frontend_bucket" {
  source = "./modules/s3"
  
  bucket_name = "healthhub-frontend"
  environment = var.environment
  enable_versioning = true
  enable_encryption = true
}
```

### DynamoDB Module
**Purpose**: Manages DynamoDB tables for application data

**Features**:
- Pay-per-request billing
- Encryption at rest
- Point-in-time recovery
- Global secondary indexes

**Usage**:
```hcl
module "users_table" {
  source = "./modules/dynamodb"
  
  table_name = "healthhub-users"
  hash_key   = "userId"
  environment = var.environment
}
```

### IAM Module
**Purpose**: Creates IAM roles and policies for secure access

**Features**:
- Least privilege principle
- Service-specific roles
- Cross-service permissions
- CI/CD integration roles

**Usage**:
```hcl
module "lambda_iam" {
  source = "./modules/iam"
  
  role_name = "healthhub-lambda-role"
  service   = "lambda"
  policies  = ["dynamodb-access", "s3-access"]
}
```

## 🌍 Environment Management

### Development Environment
- **Purpose**: Feature development and testing
- **Resources**: Minimal configuration for cost optimization
- **Data**: Sample/test data only

### Staging Environment
- **Purpose**: Pre-production testing and validation
- **Resources**: Production-like configuration
- **Data**: Sanitized production data

### Production Environment
- **Purpose**: Live application serving real users
- **Resources**: High availability and performance
- **Data**: Real healthcare data with compliance

## 🔒 Security Best Practices

### State Management
- **Remote State**: Stored in encrypted S3 bucket
- **State Locking**: DynamoDB prevents concurrent modifications
- **Access Control**: IAM policies restrict state access
- **Versioning**: State history for rollback capability

### Resource Security
- **Encryption**: All data encrypted at rest and in transit
- **Network Security**: VPC isolation and security groups
- **Access Logging**: CloudTrail for audit compliance
- **Secrets Management**: AWS Secrets Manager integration

### Compliance Features
- **HIPAA Compliance**: Healthcare data protection
- **Audit Logging**: Comprehensive activity tracking
- **Data Retention**: Configurable retention policies
- **Backup Strategy**: Automated backup and recovery

## 📊 Cost Optimization

### Resource Optimization
- **Right-sizing**: Appropriate instance types and sizes
- **Auto-scaling**: Dynamic resource allocation
- **Reserved Instances**: Cost savings for predictable workloads
- **Lifecycle Policies**: Automated data archival

### Monitoring and Alerts
- **Cost Budgets**: AWS Budget alerts for spending
- **Resource Tagging**: Cost allocation and tracking
- **Usage Reports**: Regular cost analysis
- **Optimization Recommendations**: AWS Trusted Advisor

## 🔧 Maintenance and Operations

### State Management Commands
```bash
# View current state
terraform show

# Import existing resources
terraform import aws_s3_bucket.example bucket-name

# Refresh state from real infrastructure
terraform refresh

# Validate configuration
terraform validate
```

### Troubleshooting
```bash
# Enable detailed logging
export TF_LOG=DEBUG

# Force unlock state (use with caution)
terraform force-unlock LOCK_ID

# Destroy specific resource
terraform destroy -target=aws_s3_bucket.example
```

## 📈 Monitoring and Observability

### CloudWatch Integration
- **Metrics**: Custom metrics for infrastructure health
- **Alarms**: Automated alerting for issues
- **Dashboards**: Visual monitoring interfaces
- **Logs**: Centralized log aggregation

### Performance Monitoring
- **Resource Utilization**: CPU, memory, storage metrics
- **Network Performance**: Bandwidth and latency tracking
- **Application Metrics**: Custom business metrics
- **Cost Tracking**: Real-time cost monitoring

## 🚀 Deployment Pipeline

### CI/CD Integration
```yaml
# GitHub Actions workflow example
name: Infrastructure Deployment
on:
  push:
    branches: [main]
    paths: ['terraform/**']

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: hashicorp/setup-terraform@v2
      - run: terraform init
      - run: terraform plan
      - run: terraform apply -auto-approve
```

### Environment Promotion
1. **Development**: Automatic deployment on feature branch merge
2. **Staging**: Manual approval after development validation
3. **Production**: Manual approval with change management

## 📚 Additional Resources

- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Infrastructure as Code Patterns](https://docs.aws.amazon.com/whitepapers/latest/introduction-devops-aws/infrastructure-as-code.html)

## 🤝 Contributing

1. Follow Terraform style guide
2. Add appropriate variable descriptions
3. Include output documentation
4. Test in development environment first
5. Update documentation for changes

---

**Note**: Always review and test infrastructure changes in non-production environments before applying to production.
