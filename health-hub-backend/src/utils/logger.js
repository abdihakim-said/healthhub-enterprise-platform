/**
 * Enhanced Structured Logger for HealthHub (JavaScript version)
 */
class StructuredLogger {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.environment = process.env.STAGE || 'dev';
  }
  
  info(message, metadata) {
    const logEntry = {
      level: 'INFO',
      service: this.serviceName,
      environment: this.environment,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      requestId: process.env.AWS_REQUEST_ID || 'local',
      traceId: process.env._X_AMZN_TRACE_ID
    };
    
    console.log(JSON.stringify(logEntry));
  }
  
  error(message, error, metadata) {
    const logEntry = {
      level: 'ERROR',
      service: this.serviceName,
      environment: this.environment,
      message,
      error: {
        name: error?.name || 'Unknown',
        message: error?.message || 'Unknown error',
        stack: error?.stack
      },
      metadata,
      timestamp: new Date().toISOString(),
      requestId: process.env.AWS_REQUEST_ID || 'local',
      traceId: process.env._X_AMZN_TRACE_ID
    };
    
    console.error(JSON.stringify(logEntry));
  }
  
  performance(operation, duration, metadata) {
    const logEntry = {
      level: 'PERFORMANCE',
      service: this.serviceName,
      environment: this.environment,
      operation,
      duration,
      metadata,
      timestamp: new Date().toISOString(),
      requestId: process.env.AWS_REQUEST_ID || 'local'
    };
    
    console.log(JSON.stringify(logEntry));
  }
}

module.exports = { StructuredLogger };
