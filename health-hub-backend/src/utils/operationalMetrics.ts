/**
 * Operational Metrics for HealthHub
 * DevOps-focused metrics collection for monitoring and alerting
 */
import { CloudWatch } from 'aws-sdk';

export class OperationalMetrics {
  private cloudwatch: CloudWatch;
  private serviceName: string;
  private environment: string;
  private isLocal: boolean;
  
  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.environment = process.env.STAGE || 'dev';
    this.isLocal = process.env.IS_OFFLINE === 'true' || !process.env.AWS_REGION;
    
    if (!this.isLocal) {
      this.cloudwatch = new CloudWatch();
    }
  }
  
  async recordBusinessMetric(metricName: string, value: number, unit = 'Count') {
    // Local development - just log
    if (this.isLocal) {
      console.log(`📊 METRIC: ${this.serviceName}/${metricName} = ${value} ${unit}`);
      return;
    }
    
    const params = {
      Namespace: `HealthHub/${this.environment}/${this.serviceName}`,
      MetricData: [{
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'Service', Value: this.serviceName },
          { Name: 'Environment', Value: this.environment }
        ]
      }]
    };
    
    try {
      await this.cloudwatch.putMetricData(params).promise();
    } catch (error) {
      console.error('Failed to record metric:', error);
      // Don't fail the request if metrics fail
    }
  }
  
  async recordLatency(operation: string, startTime: number) {
    const duration = Date.now() - startTime;
    
    if (this.isLocal) {
      console.log(`⏱️  LATENCY: ${operation} = ${duration}ms`);
      return;
    }
    
    await this.recordBusinessMetric(`${operation}Duration`, duration, 'Milliseconds');
  }
  
  async recordError(errorType: string) {
    await this.recordBusinessMetric(`${errorType}Error`, 1);
  }
  
  async recordExternalAPICall(apiName: string, success: boolean, duration: number) {
    await this.recordBusinessMetric(`${apiName}Calls`, 1);
    await this.recordBusinessMetric(`${apiName}Duration`, duration, 'Milliseconds');
    
    if (!success) {
      await this.recordBusinessMetric(`${apiName}Errors`, 1);
    }
  }
  
  // Helper method to wrap async operations with metrics
  async measureOperation<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      await this.recordLatency(operationName, startTime);
      return result;
    } catch (error) {
      await this.recordLatency(operationName, startTime);
      await this.recordError(operationName);
      throw error;
    }
  }
}
