import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";

/**
 * AI Interaction Dashboard Handler
 * 
 * Compatible with the original HealthHub doctor dashboard
 * Provides AI interaction statistics and data
 */

// Types and Interfaces
interface AIInteraction {
  id: string;
  userId: string;
  interactionType: "virtualAssistant" | "textToSpeech" | "imageAnalysis" | "transcription";
  content: string;
  response: string;
  timestamp: string;
  createdAt: string;
}

// Constants
const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Demo AI interactions for dashboard testing
const DEMO_AI_INTERACTIONS: AIInteraction[] = [
  {
    id: "ai-1",
    userId: "user-1",
    interactionType: "virtualAssistant",
    content: "What are the symptoms of hypertension?",
    response: "Common symptoms of hypertension include headaches, shortness of breath, and chest pain...",
    timestamp: "2024-08-25T01:00:00.000Z",
    createdAt: "2024-08-25T01:00:00.000Z"
  },
  {
    id: "ai-2",
    userId: "user-2",
    interactionType: "imageAnalysis",
    content: "Analyze chest X-ray for patient-1",
    response: "Normal chest X-ray findings with clear lung fields...",
    timestamp: "2024-08-25T01:15:00.000Z",
    createdAt: "2024-08-25T01:15:00.000Z"
  },
  {
    id: "ai-3",
    userId: "user-1",
    interactionType: "transcription",
    content: "Transcribe doctor-patient conversation",
    response: "Doctor: How are you feeling today? Patient: I've been having chest pain...",
    timestamp: "2024-08-25T01:30:00.000Z",
    createdAt: "2024-08-25T01:30:00.000Z"
  },
  {
    id: "ai-4",
    userId: "user-3",
    interactionType: "textToSpeech",
    content: "Convert medical report to speech",
    response: "Audio file generated successfully",
    timestamp: "2024-08-25T01:45:00.000Z",
    createdAt: "2024-08-25T01:45:00.000Z"
  },
  {
    id: "ai-5",
    userId: "user-2",
    interactionType: "virtualAssistant",
    content: "Explain diabetes management",
    response: "Diabetes management involves monitoring blood sugar, proper diet, exercise...",
    timestamp: "2024-08-25T02:00:00.000Z",
    createdAt: "2024-08-25T02:00:00.000Z"
  }
];

/**
 * Utility Functions
 */

/**
 * Create standardized API response
 */
function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

/**
 * Create error response
 */
function createErrorResponse(statusCode: number, error: string, details?: string): APIGatewayProxyResult {
  return createResponse(statusCode, {
    error,
    details,
    timestamp: new Date().toISOString()
  });
}

/**
 * Validate request body
 */
function validateRequestBody(body: string | null): any {
  if (!body) {
    throw new Error('Request body is required');
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Handler Functions
 */

/**
 * List AI interactions (Dashboard compatible)
 * GET /ai-interactions
 */
export const list: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('🤖 Listing AI interactions for dashboard');

    const userId = event.queryStringParameters?.userId;
    
    let interactions = DEMO_AI_INTERACTIONS;
    
    // Filter by userId if provided
    if (userId) {
      interactions = DEMO_AI_INTERACTIONS.filter(interaction => interaction.userId === userId);
      console.log(`🔍 Filtered by userId: ${userId}, found ${interactions.length} interactions`);
    }

    // Return format compatible with dashboard
    const interactionList = interactions.map(interaction => ({
      id: interaction.id,
      userId: interaction.userId,
      interactionType: interaction.interactionType,
      content: interaction.content.substring(0, 100) + (interaction.content.length > 100 ? '...' : ''),
      timestamp: interaction.timestamp,
      createdAt: interaction.createdAt
    }));

    console.log(`✅ Retrieved ${interactionList.length} AI interactions for dashboard`);
    return createResponse(200, interactionList);

  } catch (error: any) {
    console.error('❌ Error listing AI interactions:', error);
    return createErrorResponse(500, 'Failed to list AI interactions', error.message);
  }
};

/**
 * Get AI interaction by ID
 * GET /ai-interactions/{id}
 */
export const get: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const interactionId = event.pathParameters?.id;
    
    if (!interactionId) {
      return createErrorResponse(400, 'AI interaction ID is required in path parameters');
    }

    console.log(`🤖 Getting AI interaction: ${interactionId}`);

    const interaction = DEMO_AI_INTERACTIONS.find(ai => ai.id === interactionId);
    
    if (!interaction) {
      console.log(`❌ AI interaction not found: ${interactionId}`);
      return createErrorResponse(404, 'AI interaction not found');
    }

    console.log(`✅ AI interaction found: ${interaction.interactionType}`);
    return createResponse(200, interaction);

  } catch (error: any) {
    console.error('❌ Error getting AI interaction:', error);
    return createErrorResponse(500, 'Failed to get AI interaction', error.message);
  }
};

/**
 * Create AI interaction
 * POST /ai-interactions
 */
export const create: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('🤖 Creating new AI interaction');
    
    const interactionData = validateRequestBody(event.body);
    
    // Validate required fields
    if (!interactionData.userId || !interactionData.interactionType || !interactionData.content) {
      return createErrorResponse(400, 'Missing required fields: userId, interactionType, and content are required');
    }

    const newInteraction: AIInteraction = {
      id: uuidv4(),
      userId: interactionData.userId,
      interactionType: interactionData.interactionType,
      content: interactionData.content,
      response: interactionData.response || "Processing...",
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // In production, would save to DynamoDB
    DEMO_AI_INTERACTIONS.push(newInteraction);

    console.log(`✅ AI interaction created: ${newInteraction.interactionType} for user ${newInteraction.userId}`);
    return createResponse(201, newInteraction);

  } catch (error: any) {
    console.error('❌ Error creating AI interaction:', error);
    return createErrorResponse(500, 'Failed to create AI interaction', error.message);
  }
};

/**
 * Virtual Assistant endpoint (Dashboard compatible)
 * POST /ai-interactions/virtual-assistant
 */
export const virtualAssistant: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('🤖 Processing virtual assistant request');
    
    const { userId, query } = validateRequestBody(event.body);
    
    if (!userId || !query) {
      return createErrorResponse(400, 'userId and query are required');
    }

    // Simulate AI processing
    const responses = [
      "Based on your symptoms, I recommend consulting with a healthcare professional for proper diagnosis.",
      "Here are some general health tips that might help with your condition...",
      "I understand your concern. Let me provide some information about this medical topic...",
      "For your safety, please consult with a qualified medical professional for personalized advice.",
      "This is a common medical question. Here's what you should know..."
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    // Create interaction record
    const interaction: AIInteraction = {
      id: uuidv4(),
      userId,
      interactionType: "virtualAssistant",
      content: query,
      response,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    DEMO_AI_INTERACTIONS.push(interaction);

    console.log(`✅ Virtual assistant response generated for user: ${userId}`);
    return createResponse(200, {
      response: response,
      interactionId: interaction.id,
      status: "success"
    });

  } catch (error: any) {
    console.error('❌ Error processing virtual assistant request:', error);
    return createErrorResponse(500, 'Failed to process virtual assistant request', error.message);
  }
};

/**
 * Text to Speech endpoint (Dashboard compatible)
 * POST /ai-interactions/text-to-speech
 */
export const textToSpeech: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('🔊 Processing text to speech request');
    
    const { text, language = 'en' } = validateRequestBody(event.body);
    
    if (!text) {
      return createErrorResponse(400, 'text is required');
    }

    // Simulate audio generation
    const audioUrl = `https://healthhub-audio.s3.amazonaws.com/tts/${uuidv4()}.mp3`;

    console.log(`✅ Text to speech audio generated: ${audioUrl}`);
    return createResponse(200, { audioUrl });

  } catch (error: any) {
    console.error('❌ Error converting text to speech:', error);
    return createErrorResponse(500, 'Failed to convert text to speech', error.message);
  }
};

/**
 * Update AI interaction
 * PUT /ai-interactions/{id}
 */
export const update: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const interactionId = event.pathParameters?.id;
    
    if (!interactionId) {
      return createErrorResponse(400, 'AI interaction ID is required in path parameters');
    }

    const updateData = validateRequestBody(event.body);
    
    console.log(`🤖 Updating AI interaction: ${interactionId}`);

    const interactionIndex = DEMO_AI_INTERACTIONS.findIndex(ai => ai.id === interactionId);
    
    if (interactionIndex === -1) {
      return createErrorResponse(404, 'AI interaction not found');
    }

    // Update interaction data
    const updatedInteraction = {
      ...DEMO_AI_INTERACTIONS[interactionIndex],
      ...updateData,
      timestamp: new Date().toISOString()
    };

    DEMO_AI_INTERACTIONS[interactionIndex] = updatedInteraction;

    console.log(`✅ AI interaction updated: ${updatedInteraction.interactionType}`);
    return createResponse(200, updatedInteraction);

  } catch (error: any) {
    console.error('❌ Error updating AI interaction:', error);
    return createErrorResponse(500, 'Failed to update AI interaction', error.message);
  }
};

/**
 * Delete AI interaction
 * DELETE /ai-interactions/{id}
 */
export const remove: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const interactionId = event.pathParameters?.id;
    
    if (!interactionId) {
      return createErrorResponse(400, 'AI interaction ID is required in path parameters');
    }

    console.log(`🤖 Deleting AI interaction: ${interactionId}`);

    const interactionIndex = DEMO_AI_INTERACTIONS.findIndex(ai => ai.id === interactionId);
    
    if (interactionIndex === -1) {
      return createErrorResponse(404, 'AI interaction not found');
    }

    const deletedInteraction = DEMO_AI_INTERACTIONS[interactionIndex];
    DEMO_AI_INTERACTIONS.splice(interactionIndex, 1);

    console.log(`✅ AI interaction deleted: ${deletedInteraction.interactionType}`);
    
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: "",
    };

  } catch (error: any) {
    console.error('❌ Error deleting AI interaction:', error);
    return createErrorResponse(500, 'Failed to delete AI interaction', error.message);
  }
};
