# HealthHub User Service API Documentation

## 📖 Overview

This directory contains the OpenAPI 3.0 specification and documentation for the HealthHub User Service API.

## 🚀 Quick Start

### View Documentation Locally
```bash
# Option 1: Open in browser
open index.html

# Option 2: Serve with HTTP server
npx http-server .
# Then visit: http://localhost:8080
```

### API Endpoints

| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| POST   | `/users` | Create user | 201, 400, 500 |
| GET    | `/users` | List users  | 200, 500 |
| GET    | `/users/{id}` | Get user | 200, 400, 404, 500 |
| PUT    | `/users/{id}` | Update user | 200, 400, 404, 500 |
| DELETE | `/users/{id}` | Delete user | 204, 400, 404, 500 |

## 🔧 SRE Operations

### Incident Response
- **API Contract**: All endpoints documented with expected payloads
- **Error Codes**: Clear mapping of HTTP status codes to error conditions
- **Examples**: Request/response examples for troubleshooting

### Monitoring & Alerting
- **SLI Metrics**: Response time, error rate, availability
- **SLO Targets**: 99.9% availability, <200ms p95 latency
- **Error Budget**: Track 400/500 error rates against documentation

### Validation Rules
```yaml
Email: Valid email format required
Name: 2-50 characters, required
Phone: Optional, must match pattern: ^\+?[\d\s-()]+$
UUID: Valid UUID v4 format for user IDs
```

## 🧪 Testing

### Valid Request Examples
```bash
# Create user
curl -X POST /users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"John Doe"}'

# Get user
curl -X GET /users/123e4567-e89b-12d3-a456-426614174000
```

### Error Scenarios
```bash
# Invalid email (400)
curl -X POST /users \
  -d '{"email":"invalid","name":"John"}'

# Invalid UUID (400)
curl -X GET /users/not-a-uuid

# Missing required field (400)
curl -X POST /users \
  -d '{"email":"test@example.com"}'
```

## 📊 Metrics & SLOs

### Service Level Indicators (SLIs)
- **Availability**: Percentage of successful requests
- **Latency**: 95th percentile response time
- **Error Rate**: Percentage of 4xx/5xx responses

### Service Level Objectives (SLOs)
- **Availability**: 99.9% (43.2 minutes downtime/month)
- **Latency**: 95% of requests < 200ms
- **Error Rate**: < 1% of requests result in 5xx errors

### Error Budget
- **Monthly Budget**: 0.1% (43.2 minutes)
- **Burn Rate Alert**: > 2x normal rate
- **Exhaustion Alert**: < 10% budget remaining

## 🔍 Troubleshooting

### Common Issues
1. **400 Validation Errors**: Check request payload against schema
2. **404 User Not Found**: Verify UUID exists in database
3. **500 Internal Errors**: Check service logs and dependencies

### Debug Commands
```bash
# Check service health
curl -X GET /users/health

# Validate request payload
curl -X POST /users --data-raw '{}' -v

# Test with valid UUID
curl -X GET /users/$(uuidgen | tr '[:upper:]' '[:lower:]')
```

## 📝 Files

- `api-spec.yaml`: OpenAPI 3.0 specification
- `index.html`: Swagger UI documentation
- `generate-docs.js`: Documentation generator script
- `README.md`: This file
