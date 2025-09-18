# 👨‍💻 Developer Onboarding Guide

## 🚀 Quick Start (5 minutes)

### Prerequisites
```bash
node --version  # v18+
npm --version   # v8+
aws --version   # v2+
```

### 1. Clone & Install
```bash
git clone <repo-url>
cd healthhub-module-7
make install  # Installs all dependencies
```

### 2. Environment Setup
```bash
# Copy environment template
cp health-hub-backend/.env.example health-hub-backend/.env
cp health-hub-frontend/.env.example health-hub-frontend/.env

# Configure AWS credentials
aws configure
```

### 3. Local Development
```bash
# Start backend services
cd health-hub-backend
npm run dev

# Start frontend (new terminal)
cd health-hub-frontend  
npm run dev
```

## 🏗️ Project Structure

```
healthhub-module-7/
├── health-hub-backend/          # Serverless backend
│   ├── src/services/           # Microservices
│   │   ├── user-service/       # Authentication & users
│   │   ├── ai-interaction-service/  # OpenAI integration
│   │   ├── medical-image-service/   # Google Vision AI
│   │   └── transcription-service/   # Azure Speech API
│   ├── terraform/              # Infrastructure as Code
│   └── serverless-compose.yml  # Multi-service orchestration
├── health-hub-frontend/        # React frontend
│   ├── src/components/         # UI components
│   └── src/services/          # API clients
└── docs/                      # Documentation
```

## 🔧 Development Workflow

### Adding New Feature
1. **Create branch**: `git checkout -b feature/new-feature`
2. **Write tests**: Add unit/integration tests
3. **Implement**: Write minimal code to pass tests
4. **Test locally**: `npm test && npm run lint`
5. **Deploy dev**: `npm run deploy`
6. **Create PR**: Include tests and documentation

### Service Development
```bash
# Create new service
cd src/services
mkdir new-service
cd new-service

# Copy template
cp ../user-service/package.json .
cp ../user-service/serverless.yml .
cp ../user-service/webpack.config.js .

# Update configurations
# Add to serverless-compose.yml
```

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Integration Tests
```bash
npm run test:integration   # API integration tests
npm run test:e2e          # End-to-end tests
```

### Local Testing with LocalStack
```bash
docker-compose up localstack
npm run test:local
```

## 🚀 Deployment

### Development
```bash
npm run deploy:dev
```

### Production
```bash
npm run deploy:prod  # Requires approval
```

### Infrastructure
```bash
cd terraform
terraform plan
terraform apply
```

## 🔍 Debugging

### Backend Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/ai-interaction-service --follow

# Local debugging
DEBUG=* npm run dev
```

### Frontend Debugging
```bash
# Development mode
npm run dev

# Production build testing
npm run build && npm run preview
```

## 📊 Monitoring

### Health Checks
- **Backend**: `GET /health`
- **Frontend**: Browser dev tools
- **Infrastructure**: CloudWatch dashboards

### Key Metrics
- Response time < 200ms
- Error rate < 1%
- Memory usage < 80%
- Cost per request

## 🔒 Security Guidelines

### API Security
- Always validate input
- Use parameterized queries
- Implement rate limiting
- Log security events

### Secrets Management
```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "healthhub/dev/openai-key" \
  --secret-string "sk-..."
```

## 🐛 Common Issues

### "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "AWS credentials not found"
```bash
aws configure
# or
export AWS_PROFILE=your-profile
```

### "Serverless deployment failed"
```bash
# Check service limits
aws service-quotas get-service-quota \
  --service-code lambda \
  --quota-code L-B99A9384
```

## 📚 Resources

- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Serverless Framework Docs](https://www.serverless.com/framework/docs/)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🆘 Getting Help

1. **Check logs**: CloudWatch or local console
2. **Search docs**: Use project search
3. **Ask team**: Create GitHub issue
4. **Debug locally**: Use breakpoints and logging
