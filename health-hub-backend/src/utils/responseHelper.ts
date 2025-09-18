import { APIGatewayProxyResult } from 'aws-lambda';

export function createResponse(
  statusCode: number,
  body: any,
  requestId: string,
  responseTime?: string
): APIGatewayProxyResult {
  const headers: { [header: string]: string } = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'X-Request-ID': requestId
  };

  if (responseTime) {
    headers['X-Response-Time'] = responseTime;
  }

  return {
    statusCode,
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
}

export function createErrorResponse(
  statusCode: number,
  message: string,
  requestId: string,
  serviceName?: string
): APIGatewayProxyResult {
  const errorBody = serviceName 
    ? { service: serviceName, status: 'error', message }
    : { status: 'error', message };

  return createResponse(statusCode, errorBody, requestId);
}

export function createHealthResponse(
  isHealthy: boolean,
  serviceName: string,
  requestId: string,
  error?: any
): APIGatewayProxyResult {
  if (isHealthy) {
    return createResponse(200, {
      service: serviceName,
      status: 'healthy',
      timestamp: new Date().toISOString()
    }, requestId);
  } else {
    const errorMessage = error instanceof Error ? error.message : (error?.message || 'Unknown error');
    return createResponse(503, {
      service: serviceName,
      status: 'unhealthy',
      error: errorMessage
    }, requestId);
  }
}
