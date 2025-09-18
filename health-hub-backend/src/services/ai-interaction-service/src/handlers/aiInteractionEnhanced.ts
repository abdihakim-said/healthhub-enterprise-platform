/**
 * Enhanced AI Interaction Handler with DevOps Instrumentation
 * This wraps the existing functionality without breaking it
 */
import { APIGatewayProxyHandler } from "aws-lambda";
import { AIInteractionService } from "../services/aiInteractionService";

// Use require for JavaScript utilities to avoid TypeScript compilation issues
const { StructuredLogger } = require("../../../../utils/logger.js");
const { OperationalMetrics } = require("../../../../utils/operationalMetrics.js");
const { HealthChecker } = require("../../../../utils/healthCheck.js");

// Initialize DevOps utilities
const logger = new StructuredLogger('ai-interaction-service');
const metrics = new OperationalMetrics('ai-interaction-service');
const healthChecker = new HealthChecker('ai-interaction-service');

// Keep your existing service instance
const aiInteractionService = new AIInteractionService();

/**
 * Health check endpoint - NEW functionality
 */
export const health: APIGatewayProxyHandler = async (event) => {
  try {
    logger.info('Health check requested', {
      sourceIp: event.requestContext.identity.sourceIp,
      userAgent: event.headers['User-Agent']
    });
    
    const healthStatus = await healthChecker.checkHealth();
    
    return {
      statusCode: healthStatus.status === 'healthy' ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(healthStatus)
    };
  } catch (error) {
    logger.error('Health check failed', error);
    
    return {
      statusCode: 503,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        service: 'ai-interaction-service',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

/**
 * Enhanced create function - PRESERVES existing functionality
 */
export const create: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  // Enhanced logging - but preserve existing behavior
  logger.info('AI interaction request started', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
    userAgent: event.headers['User-Agent'],
    sourceIp: event.requestContext.identity.sourceIp
  });
  
  try {
    // Your existing validation logic - unchanged
    const data = JSON.parse(event.body!);
    
    // Add performance monitoring around your existing service call
    const interaction = await metrics.measureOperation('CreateAIInteraction', async () => {
      return await aiInteractionService.create(data);
    });
    
    // Record success metrics
    await metrics.recordBusinessMetric('AIInteractionCreated', 1);
    
    logger.performance('AI interaction completed successfully', Date.now() - startTime, {
      requestId,
      interactionId: interaction.id
    });
    
    // Return EXACTLY the same response format as your original
    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        // Add DevOps headers without breaking existing ones
        "X-Request-ID": requestId,
        "X-Response-Time": `${Date.now() - startTime}ms`
      },
      body: JSON.stringify(interaction), // Same response body as original
    };
    
  } catch (error) {
    // Enhanced error logging
    logger.error('AI interaction request failed', error, {
      requestId,
      body: event.body,
      duration: Date.now() - startTime
    });
    
    // Record error metrics
    await metrics.recordError('RequestError');
    
    // Return EXACTLY the same error response as your original
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        // Add DevOps headers
        "X-Request-ID": requestId,
        "X-Response-Time": `${Date.now() - startTime}ms`
      },
      body: JSON.stringify({ error: "Could not create AI interaction" }), // Same error message
    };
  }
};

/**
 * Enhanced get function - PRESERVES existing functionality
 */
export const get: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    logger.info('AI interaction fetch requested', {
      requestId,
      id: event.pathParameters?.id
    });
    
    const id = event.pathParameters!.id!;
    
    // Wrap existing service call with metrics
    const interaction = await metrics.measureOperation('GetAIInteraction', async () => {
      return await aiInteractionService.get(id);
    });
    
    if (!interaction) {
      await metrics.recordBusinessMetric('AIInteractionNotFound', 1);
      
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-Request-ID": requestId
        },
        body: JSON.stringify({ error: "AI interaction not found" }),
      };
    }
    
    await metrics.recordBusinessMetric('AIInteractionRetrieved', 1);
    
    logger.performance('AI interaction retrieved successfully', Date.now() - startTime, {
      requestId,
      interactionId: id
    });
    
    // Return same format as original
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Request-ID": requestId,
        "X-Response-Time": `${Date.now() - startTime}ms`
      },
      body: JSON.stringify(interaction),
    };
    
  } catch (error) {
    logger.error('AI interaction fetch failed', error, {
      requestId,
      id: event.pathParameters?.id,
      duration: Date.now() - startTime
    });
    
    await metrics.recordError('GetRequestError');
    
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Request-ID": requestId
      },
      body: JSON.stringify({ error: "Could not retrieve AI interaction" }),
    };
  }
};

// Export original functions for backward compatibility
export * from './aiInteraction';
