# 🔧 HealthHub Backend Services

This directory contains the serverless backend microservices that power the HealthHub healthcare management platform.

## 📁 Service Architecture

```
src/
├── 📂 services/               # Microservice implementations
│   ├── 📂 userService/       # User management & authentication
│   ├── 📂 doctorService/     # Doctor profile management
│   ├── 📂 patientService/    # Patient record management
│   ├── 📂 appointmentService/ # Appointment scheduling
│   ├── 📂 transcriptionService/ # Audio transcription
│   ├── 📂 medicalImageService/ # Medical image analysis
│   └── 📂 aiInteractionService/ # AI-powered assistance
└── 📂 utils/                 # Shared utilities and helpers
    ├── 📄 database.js        # DynamoDB connection utilities
    ├── 📄 auth.js            # JWT authentication helpers
    ├── 📄 validation.js      # Input validation schemas
    └── 📄 response.js        # Standardized API responses
```

## 🚀 Microservices Overview

### 👤 User Service
**Endpoint**: `/users`
**Purpose**: User authentication and profile management

**Features**:
- User registration and login
- JWT token generation and validation
- Password hashing with bcrypt
- Profile management (CRUD operations)
- Role-based access control (RBAC)

**Key Functions**:
```javascript
// Authentication
POST /login          // User login
POST /register       // User registration
POST /refresh-token  // Token refresh

// Profile Management
GET /users/{id}      // Get user profile
PUT /users/{id}      // Update user profile
DELETE /users/{id}   // Delete user account
```

### 👨‍⚕️ Doctor Service
**Endpoint**: `/doctors`
**Purpose**: Healthcare provider management

**Features**:
- Doctor profile creation and management
- Specialization and qualification tracking
- Availability scheduling
- Performance metrics and ratings

**Key Functions**:
```javascript
// Doctor Management
GET /doctors         // List all doctors
GET /doctors/{id}    // Get doctor details
POST /doctors        // Create doctor profile
PUT /doctors/{id}    // Update doctor profile
DELETE /doctors/{id} // Remove doctor profile

// Specialization
GET /doctors/specializations    // List specializations
GET /doctors/by-specialty/{specialty} // Filter by specialty
```

### 🏥 Patient Service
**Endpoint**: `/patients`
**Purpose**: Patient record and medical history management

**Features**:
- Patient profile management
- Medical history tracking
- Insurance information handling
- Emergency contact management
- HIPAA-compliant data handling

**Key Functions**:
```javascript
// Patient Management
GET /patients        // List patients (authorized users only)
GET /patients/{id}   // Get patient details
POST /patients       // Create patient profile
PUT /patients/{id}   // Update patient information
DELETE /patients/{id} // Archive patient record

// Medical History
GET /patients/{id}/history     // Get medical history
POST /patients/{id}/history    // Add medical record
PUT /patients/{id}/history/{recordId} // Update medical record
```

### 📅 Appointment Service
**Endpoint**: `/appointments`
**Purpose**: Appointment scheduling and management

**Features**:
- Real-time appointment booking
- Calendar integration
- Automated reminders
- Conflict detection and resolution
- Waitlist management

**Key Functions**:
```javascript
// Appointment Management
GET /appointments              // List appointments
GET /appointments/{id}         // Get appointment details
POST /appointments             // Book new appointment
PUT /appointments/{id}         // Update appointment
DELETE /appointments/{id}      // Cancel appointment

// Scheduling
GET /appointments/available/{doctorId} // Check availability
GET /appointments/calendar/{userId}    // Get user calendar
POST /appointments/reschedule/{id}     // Reschedule appointment
```

### 🎤 Transcription Service
**Endpoint**: `/transcriptions`
**Purpose**: Audio transcription for medical consultations

**Features**:
- AWS Transcribe integration
- Real-time audio processing
- Medical terminology recognition
- Automated note generation
- HIPAA-compliant audio storage

**Key Functions**:
```javascript
// Transcription Management
POST /transcriptions/upload    // Upload audio file
GET /transcriptions/{id}       // Get transcription result
GET /transcriptions/status/{id} // Check processing status
DELETE /transcriptions/{id}    // Delete transcription
```

### 🖼️ Medical Image Service
**Endpoint**: `/medical-images`
**Purpose**: Medical image upload and AI-powered analysis

**Features**:
- Secure image upload to S3
- AWS Rekognition integration
- Medical image analysis
- DICOM format support
- Image metadata extraction

**Key Functions**:
```javascript
// Image Management
POST /medical-images/upload    // Upload medical image
GET /medical-images/{id}       // Get image details
GET /medical-images/analysis/{id} // Get AI analysis results
DELETE /medical-images/{id}    // Delete image
```

### 🤖 AI Interaction Service
**Endpoint**: `/ai-interactions`
**Purpose**: AI-powered medical assistance and chatbot

**Features**:
- OpenAI GPT-4 integration
- Medical knowledge base
- Symptom analysis
- Treatment recommendations
- Conversation history tracking

**Key Functions**:
```javascript
// AI Interactions
POST /ai-interactions/chat     // Send message to AI assistant
GET /ai-interactions/history/{userId} // Get conversation history
POST /ai-interactions/analyze  // Analyze symptoms
GET /ai-interactions/recommendations/{patientId} // Get treatment suggestions
```

## 🛠️ Shared Utilities

### Database Utilities (`utils/database.js`)
```javascript
// DynamoDB connection and query helpers
const { connectDB, queryTable, scanTable, putItem, updateItem, deleteItem } = require('./utils/database');

// Usage examples
const users = await queryTable('Users', { userId: 'user123' });
await putItem('Patients', patientData);
await updateItem('Appointments', appointmentId, updateData);
```

### Authentication Utilities (`utils/auth.js`)
```javascript
// JWT token management and validation
const { generateToken, verifyToken, hashPassword, comparePassword } = require('./utils/auth');

// Usage examples
const token = generateToken({ userId: 'user123', role: 'doctor' });
const decoded = verifyToken(token);
const hashedPassword = await hashPassword('plainPassword');
const isValid = await comparePassword('plainPassword', hashedPassword);
```

### Validation Utilities (`utils/validation.js`)
```javascript
// Input validation schemas using Joi
const { validateUser, validatePatient, validateAppointment } = require('./utils/validation');

// Usage examples
const { error, value } = validateUser(userData);
if (error) throw new Error(error.details[0].message);
```

### Response Utilities (`utils/response.js`)
```javascript
// Standardized API response formatting
const { successResponse, errorResponse, notFoundResponse } = require('./utils/response');

// Usage examples
return successResponse(data, 'Operation successful');
return errorResponse('Invalid input', 400);
return notFoundResponse('User not found');
```

## 🔒 Security Implementation

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access**: Different permissions for patients, doctors, admins
- **Token Expiry**: Automatic token refresh mechanism
- **Password Security**: bcrypt hashing with salt rounds

### Data Protection
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Output encoding and sanitization
- **Rate Limiting**: API throttling to prevent abuse

### HIPAA Compliance
- **Data Encryption**: AES-256 encryption for sensitive data
- **Audit Logging**: Comprehensive access and modification logs
- **Access Controls**: Strict data access permissions
- **Data Retention**: Configurable data retention policies

## 📊 Performance Optimization

### Lambda Optimization
- **Cold Start Reduction**: Connection pooling and initialization optimization
- **Memory Allocation**: Right-sized memory for each function
- **Timeout Configuration**: Appropriate timeout settings
- **Dead Letter Queues**: Error handling and retry mechanisms

### Database Optimization
- **Query Optimization**: Efficient DynamoDB query patterns
- **Indexing Strategy**: Global Secondary Indexes for common queries
- **Batch Operations**: Bulk operations for better performance
- **Connection Pooling**: Reuse database connections

### Caching Strategy
- **API Gateway Caching**: Response caching for frequently accessed data
- **Lambda Layer Caching**: Shared dependencies and utilities
- **Client-Side Caching**: Frontend caching strategies
- **CDN Integration**: CloudFront for static content delivery

## 🧪 Testing Strategy

### Unit Testing
```bash
# Run unit tests for all services
npm test

# Run tests for specific service
npm test -- --grep "userService"

# Run tests with coverage
npm run test:coverage
```

### Integration Testing
```bash
# Run integration tests
npm run test:integration

# Test specific endpoints
npm run test:api -- --service=userService
```

### Load Testing
```bash
# Performance testing with Artillery
npm run test:load

# Stress testing
npm run test:stress
```

## 🚀 Deployment

### Local Development
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run serverless offline
serverless offline start
```

### Staging Deployment
```bash
# Deploy to staging environment
serverless deploy --stage staging

# Deploy specific service
serverless deploy function --function userService --stage staging
```

### Production Deployment
```bash
# Deploy to production
serverless deploy --stage prod

# Deploy with approval workflow
npm run deploy:prod
```

## 📈 Monitoring & Observability

### CloudWatch Integration
- **Custom Metrics**: Business and technical metrics
- **Alarms**: Automated alerting for issues
- **Dashboards**: Real-time monitoring interfaces
- **Log Aggregation**: Centralized logging

### X-Ray Tracing
- **Distributed Tracing**: End-to-end request tracking
- **Performance Analysis**: Identify bottlenecks
- **Error Analysis**: Root cause analysis
- **Service Map**: Visual service dependencies

### Health Checks
```javascript
// Health check endpoint for each service
GET /health

// Response format
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.2.3",
  "dependencies": {
    "database": "connected",
    "external_apis": "operational"
  }
}
```

## 🤝 Development Guidelines

### Code Standards
- **ESLint**: JavaScript linting and formatting
- **Prettier**: Code formatting consistency
- **JSDoc**: Comprehensive code documentation
- **Error Handling**: Consistent error handling patterns

### API Design
- **RESTful Principles**: Standard HTTP methods and status codes
- **Versioning**: API versioning strategy
- **Documentation**: OpenAPI/Swagger specifications
- **Backward Compatibility**: Maintain API compatibility

### Git Workflow
- **Feature Branches**: Isolated feature development
- **Pull Requests**: Code review process
- **Conventional Commits**: Standardized commit messages
- **Automated Testing**: CI/CD pipeline integration

---

**Note**: Each service is designed to be independently deployable and scalable, following microservices best practices.
# Backend Services Complete
