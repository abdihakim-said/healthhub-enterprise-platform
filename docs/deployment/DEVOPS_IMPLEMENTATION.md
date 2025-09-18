# DevOps & Deployment Implementation

## 🚀 **CI/CD Pipeline Implementation**

### **GitHub Actions Workflow**

```yaml
# .github/workflows/ci-cd-production.yml
name: HealthHub Production CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  AWS_REGION: 'us-east-1'
  TERRAFORM_VERSION: '1.5.0'

jobs:
  # Security and Quality Gates
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'HealthHub'
          path: '.'
          format: 'ALL'

  # Backend Services Testing
  test-backend-services:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: 
          - user-service
          - ai-interaction-service
          - appointment-service
          - doctor-service
          - medical-image-service
          - patient-service
          - transcription-service
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: health-hub-backend/src/services/${{ matrix.service }}/package-lock.json

      - name: Install dependencies
        run: |
          cd health-hub-backend/src/services/${{ matrix.service }}
          npm ci

      - name: Run unit tests
        run: |
          cd health-hub-backend/src/services/${{ matrix.service }}
          npm test -- --coverage --watchAll=false
        env:
          NODE_ENV: test

      - name: Run integration tests
        run: |
          cd health-hub-backend/src/services/${{ matrix.service }}
          npm run test:integration
        env:
          NODE_ENV: test
          AWS_REGION: ${{ env.AWS_REGION }}

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: health-hub-backend/src/services/${{ matrix.service }}/coverage/lcov.info
          flags: ${{ matrix.service }}

      - name: Security audit
        run: |
          cd health-hub-backend/src/services/${{ matrix.service }}
          npm audit --audit-level high

  # Frontend Testing
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: health-hub-frontend/package-lock.json

      - name: Install dependencies
        run: |
          cd health-hub-frontend
          npm ci

      - name: Run linting
        run: |
          cd health-hub-frontend
          npm run lint

      - name: Run unit tests
        run: |
          cd health-hub-frontend
          npm test -- --coverage --watchAll=false

      - name: Run E2E tests
        run: |
          cd health-hub-frontend
          npm run test:e2e
        env:
          CYPRESS_baseUrl: http://localhost:3000

      - name: Build application
        run: |
          cd health-hub-frontend
          npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: health-hub-frontend/dist

  # Infrastructure Validation
  validate-infrastructure:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TERRAFORM_VERSION }}

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Terraform Format Check
        run: |
          cd infrastructure
          terraform fmt -check -recursive

      - name: Terraform Init
        run: |
          cd infrastructure
          terraform init

      - name: Terraform Validate
        run: |
          cd infrastructure
          terraform validate

      - name: Terraform Plan
        run: |
          cd infrastructure
          terraform plan -var="environment=staging" -out=tfplan

      - name: Terraform Security Scan
        uses: aquasecurity/tfsec-action@v1.0.3
        with:
          working_directory: infrastructure

  # Staging Deployment
  deploy-staging:
    needs: [security-scan, test-backend-services, test-frontend, validate-infrastructure]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TERRAFORM_VERSION }}

      - name: Deploy Infrastructure
        run: |
          cd infrastructure
          terraform init
          terraform apply -var="environment=staging" -auto-approve

      - name: Deploy Backend Services
        run: |
          cd health-hub-backend
          npm ci
          npm run deploy -- --stage staging

      - name: Deploy Frontend
        run: |
          cd health-hub-frontend
          npm ci
          npm run build
          aws s3 sync dist/ s3://healthhub-frontend-staging --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID_STAGING }} --paths "/*"

      - name: Run Smoke Tests
        run: |
          ./scripts/smoke-tests.sh staging

      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  # Production Deployment
  deploy-production:
    needs: [security-scan, test-backend-services, test-frontend, validate-infrastructure]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TERRAFORM_VERSION }}

      - name: Blue-Green Infrastructure Deployment
        run: |
          cd infrastructure
          terraform init
          ./scripts/blue-green-deploy.sh production

      - name: Deploy Backend Services with Canary
        run: |
          cd health-hub-backend
          npm ci
          ./scripts/canary-deploy.sh production

      - name: Deploy Frontend with Progressive Rollout
        run: |
          cd health-hub-frontend
          npm ci
          npm run build
          ./scripts/progressive-frontend-deploy.sh production

      - name: Run Production Health Checks
        run: |
          ./scripts/health-checks.sh production

      - name: Update Monitoring Dashboards
        run: |
          ./scripts/update-dashboards.sh production

      - name: Notify Teams
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#production-deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### **Blue-Green Deployment Script**

```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

set -e

ENVIRONMENT=$1
CURRENT_COLOR=$(terraform output -raw current_color 2>/dev/null || echo "blue")
NEW_COLOR=$([ "$CURRENT_COLOR" = "blue" ] && echo "green" || echo "blue")

echo "🚀 Starting Blue-Green Deployment"
echo "Current environment: $CURRENT_COLOR"
echo "Deploying to: $NEW_COLOR"

# Deploy to new environment
echo "📦 Deploying infrastructure to $NEW_COLOR environment..."
terraform apply \
  -var="environment=$ENVIRONMENT" \
  -var="deployment_color=$NEW_COLOR" \
  -auto-approve

# Wait for infrastructure to be ready
echo "⏳ Waiting for infrastructure to be ready..."
sleep 60

# Deploy applications to new environment
echo "🔧 Deploying applications to $NEW_COLOR environment..."
cd ../health-hub-backend
npm run deploy -- --stage "$ENVIRONMENT-$NEW_COLOR"

# Run health checks on new environment
echo "🏥 Running health checks on $NEW_COLOR environment..."
NEW_ENDPOINT=$(terraform output -raw "${NEW_COLOR}_endpoint")
./scripts/health-checks.sh "$NEW_ENDPOINT"

if [ $? -eq 0 ]; then
    echo "✅ Health checks passed. Switching traffic to $NEW_COLOR..."
    
    # Switch traffic to new environment
    cd ../infrastructure
    terraform apply \
      -var="environment=$ENVIRONMENT" \
      -var="active_color=$NEW_COLOR" \
      -auto-approve
    
    echo "🔄 Traffic switched to $NEW_COLOR environment"
    
    # Wait and verify
    sleep 30
    ./scripts/verify-deployment.sh "$NEW_ENDPOINT"
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful! Cleaning up old environment..."
        
        # Clean up old environment (keep for rollback window)
        # terraform destroy -target="module.${CURRENT_COLOR}_environment" -auto-approve
        
        echo "🎉 Blue-Green deployment completed successfully!"
    else
        echo "❌ Verification failed. Rolling back..."
        terraform apply \
          -var="environment=$ENVIRONMENT" \
          -var="active_color=$CURRENT_COLOR" \
          -auto-approve
        exit 1
    fi
else
    echo "❌ Health checks failed. Deployment aborted."
    exit 1
fi
```

### **Canary Deployment for Lambda Functions**

```bash
#!/bin/bash
# scripts/canary-deploy.sh

set -e

ENVIRONMENT=$1
CANARY_PERCENTAGE=10

echo "🐤 Starting Canary Deployment for Lambda functions"

# Deploy new version with alias
for service in user-service ai-interaction-service appointment-service doctor-service medical-image-service patient-service transcription-service; do
    echo "📦 Deploying $service with canary configuration..."
    
    cd "src/services/$service"
    
    # Deploy new version
    sls deploy --stage "$ENVIRONMENT"
    
    # Get new version number
    NEW_VERSION=$(aws lambda list-versions-by-function \
        --function-name "healthhub-$ENVIRONMENT-$service" \
        --query 'Versions[-1].Version' \
        --output text)
    
    echo "🔄 Setting up canary routing for $service (Version: $NEW_VERSION)"
    
    # Update alias with weighted routing
    aws lambda update-alias \
        --function-name "healthhub-$ENVIRONMENT-$service" \
        --name "live" \
        --routing-config "AdditionalVersionWeights={\"$NEW_VERSION\":$CANARY_PERCENTAGE}"
    
    cd ../../..
done

echo "⏳ Monitoring canary deployment for 10 minutes..."
sleep 600

# Check metrics and error rates
echo "📊 Checking canary metrics..."
python3 scripts/check-canary-metrics.py --environment "$ENVIRONMENT" --duration 10

if [ $? -eq 0 ]; then
    echo "✅ Canary metrics look good. Promoting to 100%..."
    
    # Promote canary to 100%
    for service in user-service ai-interaction-service appointment-service doctor-service medical-image-service patient-service transcription-service; do
        NEW_VERSION=$(aws lambda list-versions-by-function \
            --function-name "healthhub-$ENVIRONMENT-$service" \
            --query 'Versions[-1].Version' \
            --output text)
        
        aws lambda update-alias \
            --function-name "healthhub-$ENVIRONMENT-$service" \
            --name "live" \
            --function-version "$NEW_VERSION"
        
        echo "✅ $service promoted to 100%"
    done
    
    echo "🎉 Canary deployment completed successfully!"
else
    echo "❌ Canary metrics show issues. Rolling back..."
    
    # Rollback canary
    for service in user-service ai-interaction-service appointment-service doctor-service medical-image-service patient-service transcription-service; do
        aws lambda update-alias \
            --function-name "healthhub-$ENVIRONMENT-$service" \
            --name "live" \
            --routing-config "{}"
        
        echo "🔄 $service rolled back"
    done
    
    exit 1
fi
```

### **Health Check Script**

```bash
#!/bin/bash
# scripts/health-checks.sh

set -e

ENDPOINT=$1
MAX_RETRIES=30
RETRY_DELAY=10

echo "🏥 Running comprehensive health checks against $ENDPOINT"

# Function to check endpoint
check_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    echo "🔍 Checking $description..."
    
    for i in $(seq 1 $MAX_RETRIES); do
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
        
        if [ "$response" = "$expected_status" ]; then
            echo "✅ $description - OK (HTTP $response)"
            return 0
        fi
        
        echo "⏳ Attempt $i/$MAX_RETRIES failed (HTTP $response). Retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
    done
    
    echo "❌ $description - FAILED after $MAX_RETRIES attempts"
    return 1
}

# Function to check API endpoint with authentication
check_api_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo "🔍 Checking $description..."
    
    # Get auth token (using test credentials)
    AUTH_TOKEN=$(curl -s -X POST "$ENDPOINT/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"healthcheck@example.com","password":"HealthCheck123!"}' \
        | jq -r '.token' 2>/dev/null || echo "")
    
    if [ -z "$AUTH_TOKEN" ] || [ "$AUTH_TOKEN" = "null" ]; then
        echo "❌ Failed to get authentication token"
        return 1
    fi
    
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$ENDPOINT$endpoint")
    
    if [ "$response" = "200" ]; then
        echo "✅ $description - OK (HTTP $response)"
        return 0
    else
        echo "❌ $description - FAILED (HTTP $response)"
        return 1
    fi
}

# Basic connectivity checks
check_endpoint "$ENDPOINT/health" "200" "Basic health check"
check_endpoint "$ENDPOINT/health/ready" "200" "Readiness check"
check_endpoint "$ENDPOINT/health/live" "200" "Liveness check"

# API endpoint checks
check_api_endpoint "/api/users/profile" "User service API"
check_api_endpoint "/api/appointments" "Appointment service API"
check_api_endpoint "/api/doctors" "Doctor service API"
check_api_endpoint "/api/patients" "Patient service API"

# AI service checks (may take longer)
echo "🤖 Checking AI services..."
AI_RESPONSE=$(curl -s -X POST "$ENDPOINT/api/ai/health-check" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{"message":"Health check test"}')

if echo "$AI_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ AI Interaction service - OK"
else
    echo "❌ AI Interaction service - FAILED"
    exit 1
fi

# Database connectivity checks
echo "🗄️ Checking database connectivity..."
DB_RESPONSE=$(curl -s -X GET "$ENDPOINT/api/health/database" \
    -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$DB_RESPONSE" | jq -e '.databases.dynamodb.status == "healthy"' > /dev/null 2>&1; then
    echo "✅ DynamoDB connectivity - OK"
else
    echo "❌ DynamoDB connectivity - FAILED"
    exit 1
fi

# External service checks
echo "🌐 Checking external service integrations..."

# OpenAI API check
OPENAI_RESPONSE=$(curl -s -X POST "$ENDPOINT/api/health/openai" \
    -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$OPENAI_RESPONSE" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
    echo "✅ OpenAI integration - OK"
else
    echo "⚠️ OpenAI integration - WARNING (may be rate limited)"
fi

# Google Vision API check
VISION_RESPONSE=$(curl -s -X POST "$ENDPOINT/api/health/vision" \
    -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$VISION_RESPONSE" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
    echo "✅ Google Vision API integration - OK"
else
    echo "⚠️ Google Vision API integration - WARNING"
fi

# Azure Speech API check
SPEECH_RESPONSE=$(curl -s -X POST "$ENDPOINT/api/health/speech" \
    -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$SPEECH_RESPONSE" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
    echo "✅ Azure Speech API integration - OK"
else
    echo "⚠️ Azure Speech API integration - WARNING"
fi

# Performance checks
echo "⚡ Running performance checks..."

# Measure API response times
for endpoint in "/api/users/profile" "/api/appointments" "/api/doctors"; do
    response_time=$(curl -s -o /dev/null -w "%{time_total}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$ENDPOINT$endpoint")
    
    # Convert to milliseconds
    response_time_ms=$(echo "$response_time * 1000" | bc)
    
    if (( $(echo "$response_time_ms < 500" | bc -l) )); then
        echo "✅ $endpoint response time: ${response_time_ms}ms (Good)"
    elif (( $(echo "$response_time_ms < 1000" | bc -l) )); then
        echo "⚠️ $endpoint response time: ${response_time_ms}ms (Acceptable)"
    else
        echo "❌ $endpoint response time: ${response_time_ms}ms (Too slow)"
        exit 1
    fi
done

echo "🎉 All health checks passed successfully!"
```

### **Monitoring and Alerting Setup**

```python
# scripts/setup-monitoring.py
import boto3
import json
from typing import List, Dict

class MonitoringSetup:
    def __init__(self, environment: str):
        self.environment = environment
        self.cloudwatch = boto3.client('cloudwatch')
        self.sns = boto3.client('sns')
        self.logs = boto3.client('logs')
        
    def create_custom_metrics(self):
        """Create custom CloudWatch metrics for application monitoring"""
        
        # API Response Time Metric
        self.cloudwatch.put_metric_data(
            Namespace='HealthHub/API',
            MetricData=[
                {
                    'MetricName': 'ResponseTime',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': self.environment},
                        {'Name': 'Service', 'Value': 'API-Gateway'}
                    ],
                    'Unit': 'Milliseconds',
                    'Value': 0
                }
            ]
        )
        
        # Business Metrics
        business_metrics = [
            'PatientRegistrations',
            'AppointmentsScheduled',
            'AIInteractions',
            'MedicalImagesProcessed',
            'ComplianceViolations'
        ]
        
        for metric in business_metrics:
            self.cloudwatch.put_metric_data(
                Namespace='HealthHub/Business',
                MetricData=[
                    {
                        'MetricName': metric,
                        'Dimensions': [
                            {'Name': 'Environment', 'Value': self.environment}
                        ],
                        'Unit': 'Count',
                        'Value': 0
                    }
                ]
            )
    
    def create_alarms(self):
        """Create CloudWatch alarms for critical metrics"""
        
        alarms = [
            {
                'AlarmName': f'HealthHub-{self.environment}-HighErrorRate',
                'ComparisonOperator': 'GreaterThanThreshold',
                'EvaluationPeriods': 2,
                'MetricName': 'Errors',
                'Namespace': 'AWS/Lambda',
                'Period': 300,
                'Statistic': 'Sum',
                'Threshold': 10.0,
                'ActionsEnabled': True,
                'AlarmActions': [self.get_sns_topic_arn()],
                'AlarmDescription': 'High error rate detected',
                'Unit': 'Count'
            },
            {
                'AlarmName': f'HealthHub-{self.environment}-HighLatency',
                'ComparisonOperator': 'GreaterThanThreshold',
                'EvaluationPeriods': 3,
                'MetricName': 'Duration',
                'Namespace': 'AWS/Lambda',
                'Period': 300,
                'Statistic': 'Average',
                'Threshold': 5000.0,
                'ActionsEnabled': True,
                'AlarmActions': [self.get_sns_topic_arn()],
                'AlarmDescription': 'High latency detected',
                'Unit': 'Milliseconds'
            },
            {
                'AlarmName': f'HealthHub-{self.environment}-ComplianceViolations',
                'ComparisonOperator': 'GreaterThanThreshold',
                'EvaluationPeriods': 1,
                'MetricName': 'ComplianceViolations',
                'Namespace': 'HealthHub/Business',
                'Period': 300,
                'Statistic': 'Sum',
                'Threshold': 0.0,
                'ActionsEnabled': True,
                'AlarmActions': [self.get_sns_topic_arn()],
                'AlarmDescription': 'HIPAA compliance violation detected',
                'Unit': 'Count'
            }
        ]
        
        for alarm in alarms:
            self.cloudwatch.put_metric_alarm(**alarm)
            print(f"Created alarm: {alarm['AlarmName']}")
    
    def create_dashboard(self):
        """Create CloudWatch dashboard for monitoring"""
        
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "x": 0, "y": 0, "width": 12, "height": 6,
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Duration", "FunctionName", f"healthhub-{self.environment}-user-service"],
                            [".", ".", ".", f"healthhub-{self.environment}-ai-interaction-service"],
                            [".", ".", ".", f"healthhub-{self.environment}-appointment-service"],
                            [".", ".", ".", f"healthhub-{self.environment}-doctor-service"],
                            [".", ".", ".", f"healthhub-{self.environment}-medical-image-service"],
                            [".", ".", ".", f"healthhub-{self.environment}-patient-service"],
                            [".", ".", ".", f"healthhub-{self.environment}-transcription-service"]
                        ],
                        "view": "timeSeries",
                        "stacked": False,
                        "region": "us-east-1",
                        "title": "Lambda Function Duration",
                        "period": 300
                    }
                },
                {
                    "type": "metric",
                    "x": 0, "y": 6, "width": 12, "height": 6,
                    "properties": {
                        "metrics": [
                            ["HealthHub/Business", "PatientRegistrations"],
                            [".", "AppointmentsScheduled"],
                            [".", "AIInteractions"],
                            [".", "MedicalImagesProcessed"]
                        ],
                        "view": "timeSeries",
                        "stacked": False,
                        "region": "us-east-1",
                        "title": "Business Metrics",
                        "period": 300
                    }
                },
                {
                    "type": "log",
                    "x": 0, "y": 12, "width": 24, "height": 6,
                    "properties": {
                        "query": f"SOURCE '/aws/lambda/healthhub-{self.environment}-ai-interaction-service'\n| fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 100",
                        "region": "us-east-1",
                        "title": "Recent Errors",
                        "view": "table"
                    }
                }
            ]
        }
        
        self.cloudwatch.put_dashboard(
            DashboardName=f'HealthHub-{self.environment}-Overview',
            DashboardBody=json.dumps(dashboard_body)
        )
        
        print(f"Created dashboard: HealthHub-{self.environment}-Overview")
    
    def get_sns_topic_arn(self) -> str:
        """Get or create SNS topic for alerts"""
        topic_name = f'healthhub-{self.environment}-alerts'
        
        try:
            response = self.sns.create_topic(Name=topic_name)
            return response['TopicArn']
        except Exception as e:
            print(f"Error creating SNS topic: {e}")
            return ""

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python setup-monitoring.py <environment>")
        sys.exit(1)
    
    environment = sys.argv[1]
    monitoring = MonitoringSetup(environment)
    
    print(f"Setting up monitoring for environment: {environment}")
    monitoring.create_custom_metrics()
    monitoring.create_alarms()
    monitoring.create_dashboard()
    print("Monitoring setup completed!")
```
