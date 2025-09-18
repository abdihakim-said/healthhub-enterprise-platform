# 🔐 HealthHub Credential Management

## Overview

This Terraform configuration uses a **secure, variable-based approach** for managing API credentials. No credentials are hardcoded in the Terraform files.

## 🏗️ Architecture

### **Variable-Based Credentials**
```hcl
# All credentials are provided via variables
variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
  default     = null
}
```

### **Fallback Logic**
```hcl
# Uses provided credentials or falls back to placeholders
secret_string = jsonencode({
  api_key = var.openai_api_key != null ? var.openai_api_key : "REPLACE_WITH_ACTUAL_OPENAI_KEY"
})
```

## 🚀 Usage

### **1. Extract Current Working Credentials**
```bash
cd terraform
./extract-credentials.sh
```
This creates `terraform.tfvars` with your current working credentials.

### **2. Manual Credential Setup**
```bash
# Copy the example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your real credentials
nano terraform.tfvars
```

### **3. Apply Changes**
```bash
terraform apply
```

## 📁 File Structure

```
terraform/
├── terraform.tfvars.example     # Template for credentials
├── terraform.tfvars            # Your actual credentials (gitignored)
├── extract-credentials.sh      # Script to extract current credentials
├── variables.tf               # Credential variable definitions
└── modules/secrets/
    ├── main.tf               # Secret resources with variable logic
    └── variables.tf          # Module-level variables
```

## 🔒 Security Best Practices

### **✅ What This Approach Does:**
- ✅ **No hardcoded credentials** in Terraform files
- ✅ **Sensitive variables** marked as sensitive
- ✅ **Fallback placeholders** prevent accidental API calls
- ✅ **Version control safe** (terraform.tfvars is gitignored)
- ✅ **Environment isolation** (different tfvars per environment)

### **⚠️ Security Guidelines:**
- 🔐 **Never commit** `terraform.tfvars` to version control
- 🔐 **Use environment variables** in CI/CD pipelines
- 🔐 **Rotate credentials** regularly
- 🔐 **Limit credential scope** to minimum required permissions

## 🌍 Environment Management

### **Development**
```bash
# Use dev-specific credentials
cp terraform.tfvars.dev terraform.tfvars
terraform workspace select dev
terraform apply
```

### **Production**
```bash
# Use production credentials
cp terraform.tfvars.prod terraform.tfvars
terraform workspace select production
terraform apply
```

## 🔧 CI/CD Integration

### **GitHub Actions Example**
```yaml
- name: Apply Terraform
  env:
    TF_VAR_openai_api_key: ${{ secrets.OPENAI_API_KEY }}
    TF_VAR_azure_speech_key: ${{ secrets.AZURE_SPEECH_KEY }}
    TF_VAR_google_vision_credentials: ${{ secrets.GOOGLE_VISION_CREDS }}
  run: terraform apply -auto-approve
```

## 🚨 Troubleshooting

### **Placeholder Credentials Error**
If you see errors like "REPLACE_WITH_ACTUAL_...", it means:
1. No credentials provided via variables
2. System falls back to placeholders
3. Lambda functions detect placeholders and refuse to make API calls

**Solution:** Provide real credentials via `terraform.tfvars` or environment variables.

### **Missing terraform.tfvars**
```bash
# Extract from current working system
./extract-credentials.sh

# Or copy from example
cp terraform.tfvars.example terraform.tfvars
```

## 📋 Credential Requirements

### **OpenAI**
```hcl
openai_api_key      = "sk-proj-..."
openai_assistant_id = "asst_..."
```

### **Azure Speech Service**
```hcl
azure_speech_key    = "your-32-char-key"
azure_speech_region = "eastus"
```

### **Google Cloud Vision**
```hcl
google_vision_credentials = jsonencode({
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-account@project.iam.gserviceaccount.com"
  # ... other fields
})
```

## ✅ Benefits

1. **🔒 Security**: No credentials in version control
2. **🔄 Flexibility**: Easy credential rotation
3. **🌍 Multi-Environment**: Different credentials per environment
4. **🚫 Fail-Safe**: Prevents accidental API calls with fake credentials
5. **📝 Auditable**: Clear credential management process
6. **🤖 CI/CD Ready**: Works with automated deployments

---

**This approach ensures your production credentials are secure while maintaining infrastructure as code best practices!**
