/**
 * Operational Metrics for HealthHub (JavaScript version)
 */
class OperationalMetrics {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.environment = process.env.STAGE || 'dev';
    this.isLocal = process.env.IS_OFFLINE === 'true' || !process.env.AWS_REGION;
    
    if (!this.isLocal) {
      const AWS = require('aws-sdk');
      this.cloudwatch = new AWS.CloudWatch();
    }
  }
  
  async recordBusinessMetric(metricName, value = 1, unit = 'Count') {
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
    }
  }
  
  async recordLatency(operation, startTime) {
    const duration = Date.now() - startTime;
    
    if (this.isLocal) {
      console.log(`⏱️  LATENCY: ${operation} = ${duration}ms`);
      return;
    }
    
    await this.recordBusinessMetric(`${operation}Duration`, duration, 'Milliseconds');
  }
  
  async recordError(errorType) {
    await this.recordBusinessMetric(`${errorType}Error`, 1);
  }
}

module.exports = { OperationalMetrics };
