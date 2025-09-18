/**
 * Enhanced Structured Logger for HealthHub
 * DevOps-focused logging with request tracing and structured output
 */
export class StructuredLogger {
  private serviceName: string;
  private environment: string;
  
  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.environment = process.env.STAGE || 'dev';
  }
  
  info(message: string, metadata?: any) {
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
  
  error(message: string, error: any, metadata?: any) {
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
  
  performance(operation: string, duration: number, metadata?: any) {
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
  
  // Backward compatibility - keeps existing console.log/error working
  static enhanceConsole() {
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('INFO')) {
        originalLog(...args);
      } else {
        originalLog(...args);
      }
    };
    
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('ERROR')) {
        originalError(...args);
      } else {
        originalError(...args);
      }
    };
  }
}
