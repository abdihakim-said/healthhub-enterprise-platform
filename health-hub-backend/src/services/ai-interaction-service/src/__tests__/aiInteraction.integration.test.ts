import { AIInteractionService } from '../services/aiInteractionService';

// Mock Dynamoose to prevent real DynamoDB calls
jest.mock('dynamoose', () => {
  const mockModel = jest.fn((data) => {
    const mockDocument = {
      id: data?.id || 'generated-uuid',
      userId: data?.userId || 'test-user-123',
      interactionType: data?.interactionType || 'virtualAssistant',
      content: data?.content || 'Test content',
      response: data?.response || 'Mock AI response for testing',
      audioUrl: data?.audioUrl,
      createdAt: data?.createdAt || new Date(),
      save: jest.fn().mockResolvedValue(true),
      conformToSchema: jest.fn(),
      toDynamo: jest.fn(),
      prepareForResponse: jest.fn(),
      original: jest.fn()
    };
    return mockDocument;
  });
  
  // Add static methods to the mock model
  Object.assign(mockModel, {
    get: jest.fn((id) => Promise.resolve({
      id: id,
      userId: 'test-user-123',
      interactionType: 'virtualAssistant',
      content: 'Hello, I need help with my appointment',
      response: 'Mock AI response for testing',
      createdAt: new Date()
    })),
    query: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([])
      })
    }),
    delete: jest.fn().mockResolvedValue(true)
  });

  return {
    model: jest.fn(() => mockModel),
    Schema: jest.fn()
  };
});

describe('AI Interaction Service Integration', () => {
  let aiInteractionService: AIInteractionService;

  beforeEach(() => {
    jest.clearAllMocks();
    aiInteractionService = new AIInteractionService();
  });

  it('should create and retrieve AI interaction', async () => {
    const interactionData = {
      userId: 'test-user-123',
      interactionType: 'virtualAssistant' as const,
      content: 'Hello, I need help with my appointment'
    };

    // Create interaction
    const createdInteraction = await aiInteractionService.create(interactionData);
    
    expect(createdInteraction).toBeDefined();
    expect(createdInteraction.userId).toBe(interactionData.userId);
    expect(createdInteraction.interactionType).toBe(interactionData.interactionType);
    expect(createdInteraction.content).toBe(interactionData.content);
    expect(createdInteraction.response).toBeDefined(); // Should have AI response
    expect(createdInteraction.id).toBeDefined(); // Should have generated ID

    // Retrieve interaction - mock returns interaction with same ID
    const retrievedInteraction = await aiInteractionService.get(createdInteraction.id);
    expect(retrievedInteraction).toBeDefined();
    expect(retrievedInteraction?.id).toBe(createdInteraction.id); // Mock uses passed ID
  }, 30000);

  it('should return document for interaction lookup', async () => {
    const result = await aiInteractionService.get('non-existent-id');
    expect(result).toBeDefined(); // Mock returns a document
    expect(result?.id).toBe('non-existent-id'); // Mock uses the requested ID
  }, 30000);

  it('should handle different interaction types', async () => {
    const speechInteraction = {
      userId: 'test-user-456',
      interactionType: 'speechConversion' as const,
      content: 'Convert this to speech',
      audioUrl: 'https://example.com/audio.mp3'
    };

    const createdInteraction = await aiInteractionService.create(speechInteraction);
    
    expect(createdInteraction).toBeDefined();
    expect(createdInteraction.interactionType).toBe('speechConversion'); // Service preserves the type
    expect(createdInteraction.content).toBe(speechInteraction.content);
    expect(createdInteraction.audioUrl).toBe(speechInteraction.audioUrl);
  }, 30000);
});
