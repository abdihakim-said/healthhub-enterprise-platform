const { CloudWatch } = require('aws-sdk');

class RealAIMetrics {
  constructor() {
    this.cloudwatch = new CloudWatch();
  }

  async recordOpenAICall(tokens, responseTime, success) {
    const metrics = [
      {
        MetricName: 'OpenAI_TokensUsed',
        Value: tokens,
        Unit: 'Count',
        Dimensions: [{ Name: 'Service', Value: 'HealthHub' }]
      },
      {
        MetricName: 'OpenAI_ResponseTime', 
        Value: responseTime,
        Unit: 'Milliseconds'
      },
      {
        MetricName: 'OpenAI_Success',
        Value: success ? 1 : 0,
        Unit: 'Count'
      }
    ];

    await this.cloudwatch.putMetricData({
      Namespace: 'HealthHub/AI/Real',
      MetricData: metrics
    }).promise();
  }

  async recordPatientInteraction(patientId, interactionType) {
    await this.cloudwatch.putMetricData({
      Namespace: 'HealthHub/Business/Real',
      MetricData: [{
        MetricName: 'PatientInteraction',
        Value: 1,
        Unit: 'Count',
        Dimensions: [
          { Name: 'InteractionType', Value: interactionType },
          { Name: 'Service', Value: 'AI-Assistant' }
        ]
      }]
    }).promise();
  }
}

module.exports = { RealAIMetrics };
