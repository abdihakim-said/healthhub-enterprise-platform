# HealthHub Testing Guide

## Overview
This guide covers testing your 7 Lambda microservices using containerized AWS services.

## Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed
- AWS CLI installed

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local AWS Services
```bash
npm run docker:up
```

### 3. Initialize LocalStack
```bash
npm run docker:init
```

### 4. Run Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Watch mode for development
npm run test:watch
```

## Testing Architecture

### Unit Tests
- Test individual Lambda handlers
- Mock external dependencies
- Fast execution (< 1 second per test)
- Located: `src/**/__tests__/*.test.ts`

### Integration Tests
- Test with real LocalStack services
- Test DynamoDB, S3, Secrets Manager
- Slower execution (2-5 seconds per test)
- Located: `src/**/__tests__/*.integration.test.ts`

## Local Development Environment

### Services Available
- **LocalStack**: http://localhost:4566 (AWS services)
- **DynamoDB Admin**: http://localhost:8001 (Database UI)

### AWS Services Simulated
- DynamoDB (all your tables)
- S3 (medical images, audio files)
- Secrets Manager (API keys)
- Lambda (function execution)
- API Gateway (HTTP endpoints)

### Environment Variables
```bash
AWS_REGION=us-east-1
LOCALSTACK_ENDPOINT=http://localhost:4566
NODE_ENV=test
```

## Testing Each Microservice

### 1. AI Interaction Service
```bash
cd src/services/ai-interaction-service
npm test
```

### 2. Medical Image Service
```bash
cd src/services/medical-image-service
npm test
```

### 3. Transcription Service
```bash
cd src/services/transcription-service
npm test
```

### 4. Patient Service
```bash
cd src/services/patient-service
npm test
```

### 5. Doctor Service
```bash
cd src/services/doctor-service
npm test
```

### 6. User Service
```bash
cd src/services/user-service
npm test
```

### 7. Appointment Service
```bash
cd src/services/appointment-service
npm test
```

## Coverage Requirements
- **Minimum**: 80% coverage for all services
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Debugging Tests

### View LocalStack Logs
```bash
docker logs healthhub-localstack
```

### Check DynamoDB Tables
Visit: http://localhost:8001

### Test Individual Lambda Functions
```bash
# Test specific function
npm test -- --testNamePattern="should create AI interaction"
```

## Cleanup
```bash
# Stop all containers
npm run docker:down

# Remove all data
rm -rf localstack-data/
```

## Troubleshooting

### LocalStack Not Starting
```bash
# Check Docker is running
docker ps

# Restart LocalStack
npm run docker:down && npm run docker:up
```

### Tests Failing
```bash
# Check LocalStack health
curl http://localhost:4566/health

# Reinitialize services
npm run docker:init
```

### Port Conflicts
```bash
# Check what's using port 4566
lsof -i :4566

# Kill process if needed
kill -9 <PID>
```

## Next Steps
1. Run all tests: `npm run test:coverage`
2. Ensure 80%+ coverage
3. Fix any failing tests
4. Proceed with DevOps setup
