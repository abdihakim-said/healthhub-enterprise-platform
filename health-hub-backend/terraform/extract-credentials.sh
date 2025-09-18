#!/bin/bash

# Extract current working credentials from AWS Secrets Manager
# and create terraform.tfvars file

echo "Extracting current working credentials..."

# Extract OpenAI credentials
OPENAI_KEY=$(aws secretsmanager get-secret-value --secret-id "healthhub/production/openai-credentials" --query 'SecretString' --output text | jq -r '.api_key')
OPENAI_ASSISTANT=$(aws secretsmanager get-secret-value --secret-id "healthhub/production/openai-credentials" --query 'SecretString' --output text | jq -r '.assistant_id')

# Extract Azure credentials
AZURE_KEY=$(aws secretsmanager get-secret-value --secret-id "healthhub/production/azure-speech-credentials" --query 'SecretString' --output text | jq -r '.speech_key')
AZURE_REGION=$(aws secretsmanager get-secret-value --secret-id "healthhub/production/azure-speech-credentials" --query 'SecretString' --output text | jq -r '.speech_region')

# Extract Google credentials (full JSON)
GOOGLE_CREDS=$(aws secretsmanager get-secret-value --secret-id "healthhub/production/google-vision-credentials" --query 'SecretString' --output text)

# Create terraform.tfvars file
cat > terraform.tfvars << EOF
# Extracted working credentials from production
openai_api_key      = "$OPENAI_KEY"
openai_assistant_id = "$OPENAI_ASSISTANT"

azure_speech_key    = "$AZURE_KEY"
azure_speech_region = "$AZURE_REGION"

google_vision_credentials = <<JSON
$GOOGLE_CREDS
JSON
EOF

echo "✅ Created terraform.tfvars with current working credentials"
echo "⚠️  Remember to add terraform.tfvars to .gitignore to keep credentials secure"
