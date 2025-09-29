const { CloudWatch } = require('aws-sdk');

class RealTimeMetrics {
  constructor() {
    this.cloudwatch = new CloudWatch();
    this.isLocal = process.env.IS_OFFLINE === 'true';
  }

  async recordOpenAICall(tokens, responseTime, success, cost = 0) {
    if (this.isLocal) {
      console.log(`📊 OpenAI: ${tokens} tokens, ${responseTime}ms, $${cost}`);
      return;
    }

    const metrics = [
      {
        MetricName: 'OpenAI_RealTokens',
        Value: tokens,
        Unit: 'Count',
        Timestamp: new Date()
      },
      {
        MetricName: 'OpenAI_RealLatency',
        Value: responseTime,
        Unit: 'Milliseconds',
        Timestamp: new Date()
      },
      {
        MetricName: 'OpenAI_RealCost',
        Value: cost,
        Unit: 'None',
        Timestamp: new Date()
      }
    ];

    try {
      await this.cloudwatch.putMetricData({
        Namespace: 'HealthHub/AI/Production',
        MetricData: metrics
      }).promise();
    } catch (error) {
      console.error('Metrics error:', error);
    }
  }

  async recordPatientInteraction(patientId, interactionType, duration) {
    if (this.isLocal) {
      console.log(`👤 Patient ${patientId}: ${interactionType} (${duration}ms)`);
      return;
    }

    try {
      await this.cloudwatch.putMetricData({
        Namespace: 'HealthHub/Business/Production',
        MetricData: [{
          MetricName: 'RealPatientInteractions',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'InteractionType', Value: interactionType },
            { Name: 'PatientId', Value: patientId.substring(0, 8) }
          ],
          Timestamp: new Date()
        }]
      }).promise();
    } catch (error) {
      console.error('Business metrics error:', error);
    }
  }
}

module.exports = { RealTimeMetrics };
