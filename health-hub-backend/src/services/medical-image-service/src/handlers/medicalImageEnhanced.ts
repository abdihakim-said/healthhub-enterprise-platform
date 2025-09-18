/**
 * Enhanced Medical Image Service Handler with Operational Metrics and Health Checks
 */
import { APIGatewayProxyHandler, APIGatewayProxyEvent } from "aws-lambda";
import { MedicalImageService } from "../services/medicalImageService";
import { createResponse, createErrorResponse, createHealthResponse } from "../../../../utils/responseHelper";
const { StructuredLogger } = require("../../../../utils/logger.js");
const { OperationalMetrics } = require("../../../../utils/operationalMetrics.js");
const { HealthChecker } = require("../../../../utils/healthCheck.js");

const logger = new StructuredLogger('medical-image-service');
const metrics = new OperationalMetrics('medical-image-service');
const healthChecker = new HealthChecker('medical-image-service');
const medicalImageService = new MedicalImageService();

export const health: APIGatewayProxyHandler = async (event) => {
  try {
    const requestId = event.requestContext.requestId;
    const healthStatus = await healthChecker.checkHealth();
    return createHealthResponse(healthStatus.healthy, 'medical-image-service', requestId);
  } catch (error) {
    const requestId = event.requestContext?.requestId || 'unknown';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createHealthResponse(false, 'medical-image-service', requestId, { message: errorMessage });
  }
};

export const analyze: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    logger.info('Analyzing medical image', { requestId });
    
    const data = JSON.parse(event.body || '{}');
    const googleVisionStart = Date.now();
    const analysis = await metrics.measureOperation('AnalyzeMedicalImage', async () => {
      return await medicalImageService.analyzeImage(data);
    });
    
    await metrics.recordExternalAPICall('GoogleVision', true, Date.now() - googleVisionStart);
    await metrics.recordAPICall('AnalyzeMedicalImage', true, Date.now() - startTime);
    
    const responseTime = `${Date.now() - startTime}ms`;
    return createResponse(201, analysis, requestId, responseTime);
  } catch (error) {
    await metrics.recordAPICall('AnalyzeMedicalImage', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to analyze medical image', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'medical-image-service');
  }
};

export const get: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return createErrorResponse(400, 'Analysis ID is required', requestId, 'medical-image-service');
    }

    logger.info('Getting medical image analysis', { requestId, analysisId: id });
    
    const analysis = await metrics.measureOperation('GetMedicalImageAnalysis', async () => {
      return await medicalImageService.getAnalysis(id);
    });
    
    if (!analysis) {
      return createErrorResponse(404, 'Analysis not found', requestId, 'medical-image-service');
    }
    
    await metrics.recordAPICall('GetMedicalImageAnalysis', true, Date.now() - startTime);
    return createResponse(200, analysis, requestId);
  } catch (error) {
    await metrics.recordAPICall('GetMedicalImageAnalysis', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get medical image analysis', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'medical-image-service');
  }
};

export const update: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return createErrorResponse(400, 'Analysis ID is required', requestId, 'medical-image-service');
    }

    logger.info('Updating medical image analysis', { requestId, analysisId: id });
    
    const data = JSON.parse(event.body || '{}');
    const analysis = await metrics.measureOperation('UpdateMedicalImageAnalysis', async () => {
      return await medicalImageService.update(id, data);
    });
    
    if (!analysis) {
      return createErrorResponse(404, 'Analysis not found', requestId, 'medical-image-service');
    }
    
    await metrics.recordAPICall('UpdateMedicalImageAnalysis', true, Date.now() - startTime);
    return createResponse(200, analysis, requestId);
  } catch (error) {
    await metrics.recordAPICall('UpdateMedicalImageAnalysis', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to update medical image analysis', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'medical-image-service');
  }
};

export const remove: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return createErrorResponse(400, 'Analysis ID is required', requestId, 'medical-image-service');
    }

    logger.info('Deleting medical image analysis', { requestId, analysisId: id });
    
    const deleted = await metrics.measureOperation('DeleteMedicalImageAnalysis', async () => {
      return await medicalImageService.delete(id);
    });
    
    if (!deleted) {
      return createErrorResponse(404, 'Analysis not found', requestId, 'medical-image-service');
    }
    
    await metrics.recordAPICall('DeleteMedicalImageAnalysis', true, Date.now() - startTime);
    return createResponse(204, null, requestId);
  } catch (error) {
    await metrics.recordAPICall('DeleteMedicalImageAnalysis', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete medical image analysis', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'medical-image-service');
  }
};

export const list: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    const patientId = event.queryStringParameters?.patientId;
    logger.info('Listing medical image analyses', { requestId, patientId });
    
    const analyses = await metrics.measureOperation('ListMedicalImageAnalyses', async () => {
      return await medicalImageService.list(patientId || '');
    });
    
    await metrics.recordAPICall('ListMedicalImageAnalyses', true, Date.now() - startTime);
    return createResponse(200, analyses, requestId);
  } catch (error) {
    await metrics.recordAPICall('ListMedicalImageAnalyses', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to list medical image analyses', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'medical-image-service');
  }
};
