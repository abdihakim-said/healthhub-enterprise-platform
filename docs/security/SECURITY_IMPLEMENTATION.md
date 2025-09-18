# Security & Compliance Implementation

## 🔐 **Zero-Trust Security Architecture**

### **Authentication & Authorization Service**

```typescript
// src/utils/auth/authService.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { DynamoDB } from 'aws-sdk';
import { SecretsManager } from 'aws-sdk';

interface User {
  id: string;
  email: string;
  role: 'doctor' | 'nurse' | 'admin' | 'patient';
  permissions: string[];
  mfaEnabled: boolean;
  lastLogin?: string;
  failedAttempts: number;
  lockedUntil?: string;
}

interface AuthToken {
  userId: string;
  role: string;
  permissions: string[];
  sessionId: string;
  iat: number;
  exp: number;
}

class AuthService {
  private dynamodb: DynamoDB.DocumentClient;
  private secretsManager: SecretsManager;
  private jwtSecret: string;
  
  constructor() {
    this.dynamodb = new DynamoDB.DocumentClient();
    this.secretsManager = new SecretsManager();
  }

  async initialize(): Promise<void> {
    // Retrieve JWT secret from AWS Secrets Manager
    const secret = await this.secretsManager.getSecretValue({
      SecretId: process.env.JWT_SECRET_ARN
    }).promise();
    
    this.jwtSecret = JSON.parse(secret.SecretString!).jwt_secret;
  }

  async authenticateUser(email: string, password: string, ipAddress: string): Promise<{
    success: boolean;
    token?: string;
    user?: Partial<User>;
    requiresMFA?: boolean;
    error?: string;
  }> {
    try {
      // Rate limiting check
      const rateLimitCheck = await this.checkRateLimit(email, ipAddress);
      if (!rateLimitCheck.allowed) {
        await this.auditLog('AUTH_RATE_LIMITED', { email, ipAddress });
        return { success: false, error: 'Too many attempts. Please try again later.' };
      }

      // Retrieve user from database
      const user = await this.getUserByEmail(email);
      if (!user) {
        await this.auditLog('AUTH_USER_NOT_FOUND', { email, ipAddress });
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if account is locked
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        await this.auditLog('AUTH_ACCOUNT_LOCKED', { userId: user.id, ipAddress });
        return { success: false, error: 'Account is temporarily locked' };
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        await this.handleFailedLogin(user.id, ipAddress);
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if MFA is required
      if (user.mfaEnabled) {
        const mfaToken = await this.generateMFAToken(user.id);
        await this.auditLog('AUTH_MFA_REQUIRED', { userId: user.id, ipAddress });
        return { 
          success: false, 
          requiresMFA: true, 
          error: 'MFA verification required',
          mfaToken 
        };
      }

      // Generate JWT token
      const token = await this.generateJWTToken(user);
      
      // Update last login
      await this.updateLastLogin(user.id, ipAddress);
      
      // Reset failed attempts
      await this.resetFailedAttempts(user.id);
      
      await this.auditLog('AUTH_SUCCESS', { userId: user.id, ipAddress });
      
      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions
        }
      };
      
    } catch (error) {
      await this.auditLog('AUTH_ERROR', { email, ipAddress, error: error.message });
      return { success: false, error: 'Authentication failed' };
    }
  }

  async verifyToken(token: string): Promise<{
    valid: boolean;
    user?: AuthToken;
    error?: string;
  }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as AuthToken;
      
      // Check if session is still valid
      const sessionValid = await this.validateSession(decoded.sessionId);
      if (!sessionValid) {
        return { valid: false, error: 'Session expired' };
      }
      
      return { valid: true, user: decoded };
      
    } catch (error) {
      return { valid: false, error: 'Invalid token' };
    }
  }

  async authorizeAction(user: AuthToken, resource: string, action: string): Promise<boolean> {
    try {
      // Check role-based permissions
      const rolePermissions = await this.getRolePermissions(user.role);
      const requiredPermission = `${resource}:${action}`;
      
      // Check if user has specific permission
      const hasPermission = user.permissions.includes(requiredPermission) ||
                           rolePermissions.includes(requiredPermission) ||
                           user.permissions.includes(`${resource}:*`) ||
                           user.permissions.includes('*:*');
      
      await this.auditLog('AUTHORIZATION_CHECK', {
        userId: user.userId,
        resource,
        action,
        granted: hasPermission
      });
      
      return hasPermission;
      
    } catch (error) {
      await this.auditLog('AUTHORIZATION_ERROR', {
        userId: user.userId,
        resource,
        action,
        error: error.message
      });
      return false;
    }
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.dynamodb.query({
      TableName: process.env.USERS_TABLE,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    }).promise();
    
    return result.Items?.[0] as User || null;
  }

  private async checkRateLimit(email: string, ipAddress: string): Promise<{ allowed: boolean }> {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;
    
    // Check attempts by email
    const emailKey = `rate_limit:email:${email}`;
    const emailAttempts = await this.getAttemptCount(emailKey, windowMs);
    
    // Check attempts by IP
    const ipKey = `rate_limit:ip:${ipAddress}`;
    const ipAttempts = await this.getAttemptCount(ipKey, windowMs);
    
    if (emailAttempts >= maxAttempts || ipAttempts >= maxAttempts * 3) {
      return { allowed: false };
    }
    
    // Increment counters
    await this.incrementAttemptCount(emailKey, windowMs);
    await this.incrementAttemptCount(ipKey, windowMs);
    
    return { allowed: true };
  }

  private async handleFailedLogin(userId: string, ipAddress: string): Promise<void> {
    const user = await this.dynamodb.get({
      TableName: process.env.USERS_TABLE,
      Key: { id: userId }
    }).promise();
    
    if (!user.Item) return;
    
    const failedAttempts = (user.Item.failedAttempts || 0) + 1;
    const maxAttempts = 5;
    
    let updateExpression = 'SET failedAttempts = :attempts';
    let expressionAttributeValues: any = { ':attempts': failedAttempts };
    
    // Lock account after max attempts
    if (failedAttempts >= maxAttempts) {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      updateExpression += ', lockedUntil = :lockUntil';
      expressionAttributeValues[':lockUntil'] = lockUntil.toISOString();
    }
    
    await this.dynamodb.update({
      TableName: process.env.USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues
    }).promise();
    
    await this.auditLog('AUTH_FAILED_LOGIN', { 
      userId, 
      ipAddress, 
      failedAttempts,
      locked: failedAttempts >= maxAttempts
    });
  }

  private async generateJWTToken(user: User): Promise<string> {
    const sessionId = this.generateSessionId();
    
    // Store session in database
    await this.storeSession(sessionId, user.id);
    
    const payload: AuthToken = {
      userId: user.id,
      role: user.role,
      permissions: user.permissions,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hours
    };
    
    return jwt.sign(payload, this.jwtSecret, { algorithm: 'HS256' });
  }

  private async auditLog(action: string, details: any): Promise<void> {
    await this.dynamodb.put({
      TableName: process.env.AUDIT_LOGS_TABLE,
      Item: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        details,
        timestamp: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + (7 * 365 * 24 * 60 * 60) // 7 years retention
      }
    }).promise();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private async storeSession(sessionId: string, userId: string): Promise<void> {
    await this.dynamodb.put({
      TableName: process.env.SESSIONS_TABLE,
      Item: {
        sessionId,
        userId,
        createdAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hours
      }
    }).promise();
  }

  private async validateSession(sessionId: string): Promise<boolean> {
    const result = await this.dynamodb.get({
      TableName: process.env.SESSIONS_TABLE,
      Key: { sessionId }
    }).promise();
    
    return !!result.Item;
  }
}

export { AuthService };
```

### **Data Encryption Service**

```typescript
// src/utils/encryption/encryptionService.ts
import { KMS } from 'aws-sdk';
import crypto from 'crypto';

interface EncryptionResult {
  encryptedData: string;
  keyId: string;
  algorithm: string;
}

interface DecryptionResult {
  decryptedData: string;
}

class EncryptionService {
  private kms: KMS;
  private defaultKeyId: string;
  
  constructor() {
    this.kms = new KMS();
    this.defaultKeyId = process.env.KMS_KEY_ID!;
  }

  async encryptSensitiveData(data: string, keyId?: string): Promise<EncryptionResult> {
    try {
      const keyToUse = keyId || this.defaultKeyId;
      
      // Generate data key
      const dataKeyResult = await this.kms.generateDataKey({
        KeyId: keyToUse,
        KeySpec: 'AES_256'
      }).promise();
      
      const plainTextKey = dataKeyResult.Plaintext as Buffer;
      const encryptedKey = dataKeyResult.CiphertextBlob as Buffer;
      
      // Encrypt data with data key
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, plainTextKey);
      
      let encryptedData = cipher.update(data, 'utf8', 'hex');
      encryptedData += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine encrypted key, IV, auth tag, and encrypted data
      const combinedData = Buffer.concat([
        encryptedKey,
        iv,
        authTag,
        Buffer.from(encryptedData, 'hex')
      ]).toString('base64');
      
      return {
        encryptedData: combinedData,
        keyId: keyToUse,
        algorithm
      };
      
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  async decryptSensitiveData(encryptedData: string): Promise<DecryptionResult> {
    try {
      const combinedBuffer = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const encryptedKey = combinedBuffer.slice(0, 256); // KMS encrypted key size
      const iv = combinedBuffer.slice(256, 272); // 16 bytes IV
      const authTag = combinedBuffer.slice(272, 288); // 16 bytes auth tag
      const cipherText = combinedBuffer.slice(288);
      
      // Decrypt data key with KMS
      const dataKeyResult = await this.kms.decrypt({
        CiphertextBlob: encryptedKey
      }).promise();
      
      const plainTextKey = dataKeyResult.Plaintext as Buffer;
      
      // Decrypt data
      const algorithm = 'aes-256-gcm';
      const decipher = crypto.createDecipher(algorithm, plainTextKey);
      decipher.setAuthTag(authTag);
      
      let decryptedData = decipher.update(cipherText, undefined, 'utf8');
      decryptedData += decipher.final('utf8');
      
      return { decryptedData };
      
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  async encryptPHI(phi: any): Promise<string> {
    // Encrypt Protected Health Information with additional safeguards
    const phiString = JSON.stringify(phi);
    const result = await this.encryptSensitiveData(phiString);
    
    // Log PHI access for audit
    await this.auditPHIAccess('ENCRYPT', { 
      dataSize: phiString.length,
      keyId: result.keyId 
    });
    
    return result.encryptedData;
  }

  async decryptPHI(encryptedPHI: string): Promise<any> {
    const result = await this.decryptSensitiveData(encryptedPHI);
    
    // Log PHI access for audit
    await this.auditPHIAccess('DECRYPT', { 
      dataSize: result.decryptedData.length 
    });
    
    return JSON.parse(result.decryptedData);
  }

  private async auditPHIAccess(action: string, details: any): Promise<void> {
    // Implementation would log to audit system
    console.log(`PHI ${action}:`, details);
  }
}

export { EncryptionService };
```

### **HIPAA Compliance Monitoring**

```typescript
// src/utils/compliance/hipaaMonitor.ts
import { DynamoDB, CloudWatch } from 'aws-sdk';

interface ComplianceEvent {
  eventType: 'DATA_ACCESS' | 'DATA_MODIFICATION' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'SYSTEM_ACCESS';
  userId: string;
  resourceId?: string;
  resourceType?: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: any;
}

interface ComplianceViolation {
  violationType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  userId?: string;
  resourceId?: string;
  timestamp: string;
  remediation: string;
}

class HIPAAComplianceMonitor {
  private dynamodb: DynamoDB.DocumentClient;
  private cloudwatch: CloudWatch;
  
  constructor() {
    this.dynamodb = new DynamoDB.DocumentClient();
    this.cloudwatch = new CloudWatch();
  }

  async logComplianceEvent(event: ComplianceEvent): Promise<void> {
    try {
      // Store in audit log
      await this.dynamodb.put({
        TableName: process.env.COMPLIANCE_AUDIT_TABLE,
        Item: {
          id: `compliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...event,
          ttl: Math.floor(Date.now() / 1000) + (7 * 365 * 24 * 60 * 60) // 7 years retention
        }
      }).promise();

      // Send metrics to CloudWatch
      await this.cloudwatch.putMetricData({
        Namespace: 'HealthHub/Compliance',
        MetricData: [
          {
            MetricName: 'ComplianceEvents',
            Dimensions: [
              { Name: 'EventType', Value: event.eventType },
              { Name: 'RiskLevel', Value: event.riskLevel },
              { Name: 'Success', Value: event.success.toString() }
            ],
            Value: 1,
            Unit: 'Count',
            Timestamp: new Date()
          }
        ]
      }).promise();

      // Check for compliance violations
      await this.checkComplianceViolations(event);
      
    } catch (error) {
      console.error('Failed to log compliance event:', error);
    }
  }

  async checkComplianceViolations(event: ComplianceEvent): Promise<void> {
    const violations: ComplianceViolation[] = [];

    // Check for suspicious access patterns
    if (await this.detectSuspiciousAccess(event)) {
      violations.push({
        violationType: 'SUSPICIOUS_ACCESS_PATTERN',
        severity: 'HIGH',
        description: 'Unusual access pattern detected',
        userId: event.userId,
        resourceId: event.resourceId,
        timestamp: event.timestamp,
        remediation: 'Review user access logs and verify legitimate business need'
      });
    }

    // Check for unauthorized access attempts
    if (!event.success && event.eventType === 'AUTHENTICATION') {
      const failedAttempts = await this.getRecentFailedAttempts(event.userId);
      if (failedAttempts >= 5) {
        violations.push({
          violationType: 'EXCESSIVE_FAILED_LOGINS',
          severity: 'MEDIUM',
          description: `${failedAttempts} failed login attempts in the last hour`,
          userId: event.userId,
          timestamp: event.timestamp,
          remediation: 'Account may be under attack. Consider temporary lockout.'
        });
      }
    }

    // Check for after-hours access
    if (await this.isAfterHoursAccess(event)) {
      violations.push({
        violationType: 'AFTER_HOURS_ACCESS',
        severity: 'MEDIUM',
        description: 'Access outside normal business hours',
        userId: event.userId,
        resourceId: event.resourceId,
        timestamp: event.timestamp,
        remediation: 'Verify legitimate business need for after-hours access'
      });
    }

    // Check for bulk data access
    if (await this.isBulkDataAccess(event)) {
      violations.push({
        violationType: 'BULK_DATA_ACCESS',
        severity: 'HIGH',
        description: 'Large volume of patient records accessed',
        userId: event.userId,
        timestamp: event.timestamp,
        remediation: 'Review business justification for bulk data access'
      });
    }

    // Process violations
    for (const violation of violations) {
      await this.processViolation(violation);
    }
  }

  private async detectSuspiciousAccess(event: ComplianceEvent): Promise<boolean> {
    // Check for access from unusual locations
    const userHistory = await this.getUserAccessHistory(event.userId, 30); // Last 30 days
    const usualIPs = userHistory.map(h => h.ipAddress);
    
    if (!usualIPs.includes(event.ipAddress) && usualIPs.length > 0) {
      return true;
    }

    // Check for rapid sequential access
    const recentAccess = await this.getUserAccessHistory(event.userId, 0.25); // Last 15 minutes
    if (recentAccess.length > 50) { // More than 50 accesses in 15 minutes
      return true;
    }

    return false;
  }

  private async getRecentFailedAttempts(userId: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const result = await this.dynamodb.query({
      TableName: process.env.COMPLIANCE_AUDIT_TABLE,
      IndexName: 'UserIdTimestampIndex',
      KeyConditionExpression: 'userId = :userId AND #timestamp > :timestamp',
      FilterExpression: 'eventType = :eventType AND success = :success',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':timestamp': oneHourAgo,
        ':eventType': 'AUTHENTICATION',
        ':success': false
      }
    }).promise();

    return result.Count || 0;
  }

  private async isAfterHoursAccess(event: ComplianceEvent): Promise<boolean> {
    const eventTime = new Date(event.timestamp);
    const hour = eventTime.getHours();
    const day = eventTime.getDay();
    
    // Consider after hours: before 7 AM, after 7 PM, or weekends
    return hour < 7 || hour > 19 || day === 0 || day === 6;
  }

  private async isBulkDataAccess(event: ComplianceEvent): Promise<boolean> {
    if (event.eventType !== 'DATA_ACCESS') return false;
    
    const last15Minutes = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const result = await this.dynamodb.query({
      TableName: process.env.COMPLIANCE_AUDIT_TABLE,
      IndexName: 'UserIdTimestampIndex',
      KeyConditionExpression: 'userId = :userId AND #timestamp > :timestamp',
      FilterExpression: 'eventType = :eventType',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':userId': event.userId,
        ':timestamp': last15Minutes,
        ':eventType': 'DATA_ACCESS'
      }
    }).promise();

    return (result.Count || 0) > 100; // More than 100 records accessed in 15 minutes
  }

  private async getUserAccessHistory(userId: string, daysBack: number): Promise<ComplianceEvent[]> {
    const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
    
    const result = await this.dynamodb.query({
      TableName: process.env.COMPLIANCE_AUDIT_TABLE,
      IndexName: 'UserIdTimestampIndex',
      KeyConditionExpression: 'userId = :userId AND #timestamp > :timestamp',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':timestamp': cutoffDate
      }
    }).promise();

    return result.Items as ComplianceEvent[] || [];
  }

  private async processViolation(violation: ComplianceViolation): Promise<void> {
    // Store violation
    await this.dynamodb.put({
      TableName: process.env.COMPLIANCE_VIOLATIONS_TABLE,
      Item: {
        id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...violation,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + (7 * 365 * 24 * 60 * 60) // 7 years retention
      }
    }).promise();

    // Send alert for high/critical violations
    if (violation.severity === 'HIGH' || violation.severity === 'CRITICAL') {
      await this.sendComplianceAlert(violation);
    }

    // Send metrics
    await this.cloudwatch.putMetricData({
      Namespace: 'HealthHub/Compliance',
      MetricData: [
        {
          MetricName: 'ComplianceViolations',
          Dimensions: [
            { Name: 'ViolationType', Value: violation.violationType },
            { Name: 'Severity', Value: violation.severity }
          ],
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date()
        }
      ]
    }).promise();
  }

  private async sendComplianceAlert(violation: ComplianceViolation): Promise<void> {
    const sns = new AWS.SNS();
    
    const message = {
      violationType: violation.violationType,
      severity: violation.severity,
      description: violation.description,
      userId: violation.userId,
      resourceId: violation.resourceId,
      timestamp: violation.timestamp,
      remediation: violation.remediation
    };

    await sns.publish({
      TopicArn: process.env.COMPLIANCE_ALERTS_TOPIC,
      Message: JSON.stringify(message),
      Subject: `COMPLIANCE VIOLATION: ${violation.violationType} - ${violation.severity}`
    }).promise();
  }

  async generateComplianceReport(startDate: string, endDate: string): Promise<any> {
    // Generate comprehensive compliance report
    const events = await this.getComplianceEvents(startDate, endDate);
    const violations = await this.getComplianceViolations(startDate, endDate);
    
    return {
      reportPeriod: { startDate, endDate },
      summary: {
        totalEvents: events.length,
        totalViolations: violations.length,
        violationsByType: this.groupViolationsByType(violations),
        violationsBySeverity: this.groupViolationsBySeverity(violations)
      },
      events,
      violations,
      generatedAt: new Date().toISOString()
    };
  }

  private async getComplianceEvents(startDate: string, endDate: string): Promise<ComplianceEvent[]> {
    // Implementation to retrieve events within date range
    const result = await this.dynamodb.scan({
      TableName: process.env.COMPLIANCE_AUDIT_TABLE,
      FilterExpression: '#timestamp BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':startDate': startDate,
        ':endDate': endDate
      }
    }).promise();

    return result.Items as ComplianceEvent[] || [];
  }

  private async getComplianceViolations(startDate: string, endDate: string): Promise<ComplianceViolation[]> {
    const result = await this.dynamodb.scan({
      TableName: process.env.COMPLIANCE_VIOLATIONS_TABLE,
      FilterExpression: '#timestamp BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':startDate': startDate,
        ':endDate': endDate
      }
    }).promise();

    return result.Items as ComplianceViolation[] || [];
  }

  private groupViolationsByType(violations: ComplianceViolation[]): Record<string, number> {
    return violations.reduce((acc, violation) => {
      acc[violation.violationType] = (acc[violation.violationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupViolationsBySeverity(violations: ComplianceViolation[]): Record<string, number> {
    return violations.reduce((acc, violation) => {
      acc[violation.severity] = (acc[violation.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

export { HIPAAComplianceMonitor };
```
