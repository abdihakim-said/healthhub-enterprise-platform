/**
 * Health Check Utility for HealthHub Services (JavaScript version)
 */
class HealthChecker {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.isLocal = process.env.IS_OFFLINE === 'true' || !process.env.AWS_REGION;
  }
  
  async checkHealth() {
    const startTime = Date.now();
    
    const checks = {
      service: this.serviceName,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.STAGE || 'dev',
      version: process.env.SERVICE_VERSION || '1.0.0',
      checks: {
        database: await this.checkDatabase(),
        externalAPIs: await this.checkExternalAPIs(),
        memory: this.checkMemory(),
        uptime: Math.floor(process.uptime()),
        environment: this.checkEnvironment()
      },
      responseTime: Date.now() - startTime
    };
    
    return checks;
  }
  
  async checkDatabase() {
    if (this.isLocal) {
      return { status: 'healthy', message: 'Local development mode' };
    }
    
    try {
      const AWS = require('aws-sdk');
      const dynamodb = new AWS.DynamoDB();
      await dynamodb.listTables({ Limit: 1 }).promise();
      
      return { status: 'healthy', message: 'Database accessible' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: error.message,
        error: 'Database connectivity failed'
      };
    }
  }
  
  async checkExternalAPIs() {
    const checks = {};
    
    if (process.env.OPENAI_SECRET_NAME || process.env.OPEN_AI_KEY) {
      checks['openai'] = { 
        status: 'configured',
        source: process.env.OPENAI_SECRET_NAME ? 'secrets-manager' : 'environment'
      };
    } else {
      checks['openai'] = { status: 'not-configured' };
    }
    
    if (process.env.AZURE_SPEECH_KEY) {
      checks['azure-speech'] = { status: 'configured' };
    }
    
    return checks;
  }
  
  checkMemory() {
    const used = process.memoryUsage();
    const memoryMB = {
      rss: Math.round(used.rss / 1024 / 1024),
      heapTotal: Math.round(used.heapTotal / 1024 / 1024),
      heapUsed: Math.round(used.heapUsed / 1024 / 1024),
      external: Math.round(used.external / 1024 / 1024)
    };
    
    const heapUsagePercent = (memoryMB.heapUsed / memoryMB.heapTotal) * 100;
    
    return {
      ...memoryMB,
      heapUsagePercent: Math.round(heapUsagePercent),
      status: heapUsagePercent > 90 ? 'high' : 'normal'
    };
  }
  
  checkEnvironment() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      stage: process.env.STAGE || 'dev',
      region: process.env.AWS_REGION || 'local',
      isLocal: this.isLocal
    };
  }
}

module.exports = { HealthChecker };
