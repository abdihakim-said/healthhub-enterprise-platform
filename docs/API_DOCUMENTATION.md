# 🔌 HealthHub API Documentation

## Base URLs
- **Production**: `https://cnc7dkr1sb.execute-api.us-east-1.amazonaws.com`
- **Frontend**: `https://d3dxe0vf0g9rlg.cloudfront.net`

## Authentication
All API endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Core Services

### 1. User Service
**Base Path**: `/user`

#### POST /user/register
Register new user account
```json
{
  "email": "doctor@hospital.com",
  "password": "SecurePass123!",
  "role": "doctor|patient|admin",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### POST /user/login
Authenticate user
```json
{
  "email": "doctor@hospital.com", 
  "password": "SecurePass123!"
}
```

### 2. AI Interaction Service
**Base Path**: `/ai`

#### POST /ai/chat
Chat with AI assistant
```json
{
  "message": "Patient has chest pain, what should I check?",
  "context": "emergency_room",
  "patientId": "patient-123"
}
```

#### POST /ai/polly/synthesize
Convert text to speech
```json
{
  "text": "Your appointment is scheduled for tomorrow",
  "voiceId": "Joanna",
  "languageCode": "en-US"
}
```

### 3. Medical Image Service
**Base Path**: `/medical-image`

#### POST /medical-image/analyze
Analyze medical images with Google Vision AI
```json
{
  "imageUrl": "https://s3.amazonaws.com/bucket/xray.jpg",
  "imageType": "xray|mri|ct_scan",
  "patientId": "patient-123"
}
```

### 4. Transcription Service
**Base Path**: `/transcription`

#### POST /transcription/azure
Transcribe audio using Azure Speech Services
```json
{
  "audioUrl": "https://s3.amazonaws.com/bucket/consultation.wav",
  "language": "en-US",
  "patientId": "patient-123"
}
```

## Response Format
All APIs return standardized responses:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-123-456"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": { /* error details */ }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-123-456"
}
```

## Rate Limits
- **Standard**: 100 requests/minute
- **AI Services**: 20 requests/minute
- **File Upload**: 10 requests/minute

## Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error
