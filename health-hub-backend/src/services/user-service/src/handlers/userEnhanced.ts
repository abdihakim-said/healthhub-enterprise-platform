/**
 * Enhanced User Handler with DevOps Instrumentation
 */
import { APIGatewayProxyHandler } from "aws-lambda";
import { UserService } from "../services/userService";
const { StructuredLogger } = require("../../../../utils/logger.js");
const { OperationalMetrics } = require("../../../../utils/operationalMetrics.js");
const { HealthChecker } = require("../../../../utils/healthCheck.js");

const logger = new StructuredLogger('user-service');
const metrics = new OperationalMetrics('user-service');
const healthChecker = new HealthChecker('user-service');
const userService = new UserService();

export const health: APIGatewayProxyHandler = async (event) => {
  try {
    const healthStatus = await healthChecker.checkHealth();
    
    return {
      statusCode: healthStatus.status === 'healthy' ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(healthStatus)
    };
  } catch (error) {
    logger.error('Health check failed', error);
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ service: 'user-service', status: 'unhealthy', error: error.message })
    };
  }
};

export const create: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  logger.info('User creation request started', { requestId });
  
  try {
    const data = JSON.parse(event.body!);
    
    const user = await metrics.measureOperation('CreateUser', async () => {
      return await userService.create(data);
    });
    
    await metrics.recordBusinessMetric('UserCreated', 1);
    logger.performance('User created successfully', Date.now() - startTime, { requestId, userId: user.id });
    
    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Request-ID": requestId,
        "X-Response-Time": `${Date.now() - startTime}ms`
      },
      body: JSON.stringify(user),
    };
    
  } catch (error) {
    logger.error('User creation failed', error, { requestId, body: event.body });
    await metrics.recordError('RequestError');
    
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Request-ID": requestId
      },
      body: JSON.stringify({ error: "Could not create user" }),
    };
  }
};

export const get: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const id = event.pathParameters!.id!;
    
    const user = await metrics.measureOperation('GetUser', async () => {
      return await userService.get(id);
    });
    
    if (!user) {
      await metrics.recordBusinessMetric('UserNotFound', 1);
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-Request-ID": requestId
        },
        body: JSON.stringify({ error: "User not found" }),
      };
    }
    
    await metrics.recordBusinessMetric('UserRetrieved', 1);
    logger.performance('User retrieved successfully', Date.now() - startTime, { requestId, userId: id });
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Request-ID": requestId,
        "X-Response-Time": `${Date.now() - startTime}ms`
      },
      body: JSON.stringify(user),
    };
    
  } catch (error) {
    logger.error('User retrieval failed', error, { requestId });
    await metrics.recordError('GetRequestError');
    
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Request-ID": requestId
      },
      body: JSON.stringify({ error: "Could not retrieve user" }),
    };
  }
};
