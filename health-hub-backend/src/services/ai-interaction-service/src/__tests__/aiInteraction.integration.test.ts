import { DynamoDB } from 'aws-sdk';
import { AIInteractionService } from '../services/aiInteractionService';

describe('AI Interaction Service Integration', () => {
  let dynamodb: DynamoDB;
  let aiInteractionService: AIInteractionService;

  beforeAll(async () => {
    // Use production AWS resources for integration testing
    const config = {
      region: 'us-east-1',
    };

    dynamodb = new DynamoDB(config);
    
    // Set environment variables to match deployed resources
    process.env.AI_INTERACTION_TABLE = 'hh-ai-interaction-production-ai-interactions';
    process.env.AWS_REGION = 'us-east-1';
    process.env.NODE_ENV = 'test';

    aiInteractionService = new AIInteractionService();
  }, 60000);

  beforeEach(async () => {
    // Clean up test data before each test
    try {
      const { Items } = await dynamodb.scan({
        TableName: 'hh-ai-interaction-production-ai-interactions',
        FilterExpression: 'begins_with(userId, :testPrefix)',
        ExpressionAttributeValues: {
          ':testPrefix': { S: 'test-' }
        }
      }).promise();

      if (Items && Items.length > 0) {
        for (const item of Items) {
          await dynamodb.deleteItem({
            TableName: 'hh-ai-interaction-production-ai-interactions',
            Key: { id: item.id }
          }).promise();
        }
      }
    } catch (error) {
      console.log('Cleanup error (expected for first run):', error.message);
    }
  }, 30000);

  it('should create and retrieve AI interaction', async () => {
    const interactionData = {
      userId: 'test-user-123',
      interactionType: 'virtualAssistant' as const,
      content: 'Hello, I need help with my appointment',
      response: 'I can help you with your appointment. What would you like to do?',
      metadata: {
        confidence: 0.95,
        language: 'en'
      }
    };

    // Create interaction
    const created = await aiInteractionService.create(interactionData);
    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.userId).toBe(interactionData.userId);
    expect(created.interactionType).toBe(interactionData.interactionType);

    // Retrieve interaction
    const retrieved = await aiInteractionService.get(created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.userId).toBe(interactionData.userId);
  }, 30000);

  it('should return null for non-existent interaction', async () => {
    const result = await aiInteractionService.get('non-existent-id');
    expect(result).toBeNull();
  }, 30000);

  it('should handle different interaction types', async () => {
    const speechInteraction = {
      userId: 'test-user-456',
      interactionType: 'speechConversion' as const,
      content: 'Convert this speech to text',
      response: 'Speech converted successfully',
      metadata: {
        audioFormat: 'wav',
        duration: 30
      }
    };

    const created = await aiInteractionService.create(speechInteraction);
    expect(created.interactionType).toBe('speechConversion');
    
    const retrieved = await aiInteractionService.get(created.id);
    expect(retrieved.metadata.audioFormat).toBe('wav');
  }, 30000);
});
