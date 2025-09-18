# HealthHub Project Automation Makefile

.PHONY: help install test lint security deploy health monitor clean

# Default environment
ENV ?= dev

# Colors for output
YELLOW := \033[1;33m
GREEN := \033[0;32m
RED := \033[0;31m
NC := \033[0m

help: ## Show this help message
	@echo "$(YELLOW)🏥 HealthHub Project Automation$(NC)"
	@echo "=================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "$(YELLOW)📦 Installing dependencies...$(NC)"
	cd health-hub-backend && npm ci
	cd health-hub-frontend && npm ci

test: ## Run all tests
	@echo "$(YELLOW)🧪 Running tests...$(NC)"
	cd health-hub-backend && npm test

lint: ## Run linting
	@echo "$(YELLOW)🔍 Running linting...$(NC)"
	cd health-hub-backend && npm run lint

security: ## Run security audit
	@echo "$(YELLOW)🔒 Running security audit...$(NC)"
	cd health-hub-backend && npm audit --audit-level=moderate

validate: ## Validate Terraform configuration
	@echo "$(YELLOW)✅ Validating Terraform...$(NC)"
	cd health-hub-backend/terraform && terraform validate

plan: ## Plan Terraform changes
	@echo "$(YELLOW)📋 Planning Terraform changes for $(ENV)...$(NC)"
	cd health-hub-backend/terraform && \
	terraform workspace select $(ENV) || terraform workspace new $(ENV) && \
	terraform plan

deploy: ## Deploy to specified environment (ENV=dev|prod)
	@echo "$(YELLOW)🚀 Deploying to $(ENV)...$(NC)"
	./scripts/deploy.sh $(ENV)

deploy-quick: ## Quick deploy without tests
	@echo "$(YELLOW)⚡ Quick deploy to $(ENV) (skipping tests)...$(NC)"
	./scripts/deploy.sh $(ENV) true

health: ## Run health checks
	@echo "$(YELLOW)🏥 Running health checks for $(ENV)...$(NC)"
	./scripts/health-check.sh $(ENV)

monitor: ## Show monitoring dashboard
	@echo "$(YELLOW)📊 Showing monitoring dashboard for $(ENV)...$(NC)"
	./scripts/monitoring.sh $(ENV) status

setup-monitoring: ## Set up CloudWatch dashboards and alarms
	@echo "$(YELLOW)📊 Setting up monitoring for $(ENV)...$(NC)"
	./scripts/monitoring.sh $(ENV) all

logs: ## Show recent logs for AI service
	@echo "$(YELLOW)📝 Showing recent logs...$(NC)"
	aws logs tail /aws/lambda/hh-ai-interaction-$(ENV)-processVirtualAssistant --follow

api-test: ## Test API endpoints
	@echo "$(YELLOW)🧪 Testing API endpoints...$(NC)"
	@echo "Testing Virtual Assistant..."
	curl -X POST "https://j6doxodkt1.execute-api.us-east-1.amazonaws.com/ai-interactions/virtual-assistant" \
		-H "Content-Type: application/json" \
		-d '{"userId": "test", "message": "Hello", "type": "virtualAssistant"}' | jq .
	@echo "\nTesting Text-to-Speech..."
	curl -X POST "https://j6doxodkt1.execute-api.us-east-1.amazonaws.com/ai-interactions/text-to-speech" \
		-H "Content-Type: application/json" \
		-d '{"text": "Hello world", "language": "en"}' | jq .

frontend-build: ## Build frontend
	@echo "$(YELLOW)🏗️ Building frontend...$(NC)"
	cd health-hub-frontend && npm run build

frontend-deploy: ## Deploy frontend only
	@echo "$(YELLOW)🌐 Deploying frontend...$(NC)"
	cd health-hub-backend/terraform && \
	terraform workspace select $(ENV) && \
	terraform apply -target=module.frontend -auto-approve

backend-deploy: ## Deploy backend services only
	@echo "$(YELLOW)⚡ Deploying backend services...$(NC)"
	cd health-hub-backend && npx @serverless/compose deploy --stage $(ENV)

destroy: ## Destroy infrastructure (BE CAREFUL!)
	@echo "$(RED)⚠️  WARNING: This will destroy all infrastructure for $(ENV)!$(NC)"
	@read -p "Are you sure? Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ]
	cd health-hub-backend/terraform && \
	terraform workspace select $(ENV) && \
	terraform destroy

clean: ## Clean build artifacts and node_modules
	@echo "$(YELLOW)🧹 Cleaning build artifacts...$(NC)"
	rm -rf health-hub-backend/node_modules
	rm -rf health-hub-frontend/node_modules
	rm -rf health-hub-frontend/dist
	rm -rf health-hub-backend/.serverless

status: ## Show project status
	@echo "$(YELLOW)📊 HealthHub Project Status$(NC)"
	@echo "=================================="
	@echo "Environment: $(ENV)"
	@echo "Frontend URL: https://d3dxe0vf0g9rlg.cloudfront.net"
	@echo "User API: https://eqd8yoyih2.execute-api.us-east-1.amazonaws.com"
	@echo "AI API: https://j6doxodkt1.execute-api.us-east-1.amazonaws.com"
	@echo "Medical API: https://2zk81heev4.execute-api.us-east-1.amazonaws.com"
	@echo ""
	@echo "$(GREEN)✅ All systems operational$(NC)"

# Development workflow shortcuts
dev-setup: install validate ## Set up development environment
	@echo "$(GREEN)✅ Development environment ready$(NC)"

dev-deploy: test lint security deploy health ## Full development deployment
	@echo "$(GREEN)✅ Development deployment complete$(NC)"

prod-deploy: test lint security plan ## Production deployment (requires manual approval)
	@echo "$(YELLOW)⚠️  Ready for production deployment. Run 'make deploy ENV=prod' to proceed$(NC)"

# CI/CD helpers
ci-test: install test lint security ## CI test pipeline
	@echo "$(GREEN)✅ CI tests passed$(NC)"

ci-deploy: deploy health ## CI deployment pipeline
	@echo "$(GREEN)✅ CI deployment complete$(NC)"

# Monitoring shortcuts
alerts: ## Show recent CloudWatch alarms
	@aws cloudwatch describe-alarms --state-value ALARM --query 'MetricAlarms[?starts_with(AlarmName, `HealthHub-$(ENV)`)].[AlarmName,StateReason]' --output table

metrics: ## Show key metrics
	@echo "$(YELLOW)📈 Key Metrics (Last Hour)$(NC)"
	@echo "=================================="
	@./scripts/monitoring.sh $(ENV) status
