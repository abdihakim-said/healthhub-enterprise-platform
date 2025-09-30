import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { create, get } from '../handlers/aiInteraction';
import { AIInteractionService } from '../services/aiInteractionService';

// Mock the service
jest.mock('../services/aiInteractionService');
const mockAIInteractionService = AIInteractionService as jest.MockedClass<typeof AIInteractionService>;

describe('AI Interaction Handler', () => {
  let mockEvent: Partial<APIGatewayProxyEvent>;
  let mockContext: Partial<Context>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEvent = {
      body: JSON.stringify({
        userId: 'test-user-id',
        interactionType: 'virtualAssistant',
        content: 'Hello, I need help with my appointment'
      }),
      pathParameters: { id: 'test-id' },
      headers: { 'Content-Type': 'application/json' }
    };

    mockContext = {
      awsRequestId: 'test-request-id',
      functionName: 'test-function'
    };
  });

  describe('create', () => {
    it('should create AI interaction successfully', async () => {
      const mockInteraction = {
        id: 'test-id',
        userId: 'test-user-id',
        interactionType: 'virtualAssistant',
        content: 'Hello, I need help with my appointment',
        response: 'How can I help you today?',
        createdAt: new Date(),
        conformToSchema: jest.fn(),
        toDynamo: jest.fn(),
        prepareForResponse: jest.fn(),
        original: jest.fn(),
        save: jest.fn()
      } as any;

      mockAIInteractionService.prototype.create.mockResolvedValue(mockInteraction);

      const result = await create(mockEvent as APIGatewayProxyEvent, mockContext as Context, () => {}) as any;

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        id: 'test-id',
        userId: 'test-user-id',
        interactionType: 'virtualAssistant'
      }));
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
    });

    it('should handle creation errors', async () => {
      mockAIInteractionService.prototype.create.mockRejectedValue(new Error('Database error'));

      const result = await create(mockEvent as APIGatewayProxyEvent, mockContext as Context, () => {}) as any;

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({ error: 'Could not create AI interaction' });
    });

    it('should handle invalid JSON in request body', async () => {
      mockEvent.body = 'invalid-json';

      const result = await create(mockEvent as APIGatewayProxyEvent, mockContext as Context, () => {}) as any;

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({ error: 'Invalid JSON in request body' });
    });
  });

  describe('get', () => {
    it('should retrieve AI interaction successfully', async () => {
      const mockInteraction = {
        id: 'test-id',
        userId: 'test-user-id',
        interactionType: 'virtualAssistant',
        content: 'Hello',
        response: 'Hi there!',
        createdAt: new Date(),
        conformToSchema: jest.fn(),
        toDynamo: jest.fn(),
        prepareForResponse: jest.fn(),
        original: jest.fn(),
        save: jest.fn()
      } as any;

      mockAIInteractionService.prototype.get.mockResolvedValue(mockInteraction);

      const result = await get(mockEvent as APIGatewayProxyEvent, mockContext as Context, () => {}) as any;

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        id: 'test-id',
        userId: 'test-user-id'
      }));
    });

    it('should return 404 when interaction not found', async () => {
      mockAIInteractionService.prototype.get.mockResolvedValue(null);

      const result = await get(mockEvent as APIGatewayProxyEvent, mockContext as Context, () => {}) as any;

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({ error: 'AI interaction not found' });
    });
  });
});
