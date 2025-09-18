/**
 * Enhanced Doctor Service Handler with Operational Metrics and Health Checks
 */
import { APIGatewayProxyHandler, APIGatewayProxyEvent } from "aws-lambda";
import { DoctorService } from "../services/doctorService";
import { createResponse, createErrorResponse, createHealthResponse } from "../../../../utils/responseHelper";
const { StructuredLogger } = require("../../../../utils/logger.js");
const { OperationalMetrics } = require("../../../../utils/operationalMetrics.js");
const { HealthChecker } = require("../../../../utils/healthCheck.js");

const logger = new StructuredLogger('doctor-service');
const metrics = new OperationalMetrics('doctor-service');
const healthChecker = new HealthChecker('doctor-service');
const doctorService = new DoctorService(process.env.USER_POOL_ID || '');

export const health: APIGatewayProxyHandler = async (event) => {
  try {
    const requestId = event.requestContext.requestId;
    const healthStatus = await healthChecker.checkHealth();
    return createHealthResponse(healthStatus.healthy, 'doctor-service', requestId);
  } catch (error) {
    const requestId = event.requestContext?.requestId || 'unknown';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createHealthResponse(false, 'doctor-service', requestId, { message: errorMessage });
  }
};

export const create: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    logger.info('Creating doctor', { requestId });
    
    const data = JSON.parse(event.body || '{}');
    const doctor = await metrics.measureOperation('CreateDoctor', async () => {
      return await doctorService.create(data);
    });
    
    await metrics.recordAPICall('CreateDoctor', true, Date.now() - startTime);
    
    const responseTime = `${Date.now() - startTime}ms`;
    return createResponse(201, doctor, requestId, responseTime);
  } catch (error) {
    await metrics.recordAPICall('CreateDoctor', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create doctor', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'doctor-service');
  }
};

export const get: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return createErrorResponse(400, 'Doctor ID is required', requestId, 'doctor-service');
    }

    logger.info('Getting doctor', { requestId, doctorId: id });
    
    const doctor = await metrics.measureOperation('GetDoctor', async () => {
      return await doctorService.get(id);
    });
    
    if (!doctor) {
      return createErrorResponse(404, 'Doctor not found', requestId, 'doctor-service');
    }
    
    await metrics.recordAPICall('GetDoctor', true, Date.now() - startTime);
    return createResponse(200, doctor, requestId);
  } catch (error) {
    await metrics.recordAPICall('GetDoctor', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get doctor', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'doctor-service');
  }
};

export const update: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return createErrorResponse(400, 'Doctor ID is required', requestId, 'doctor-service');
    }

    logger.info('Updating doctor', { requestId, doctorId: id });
    
    const data = JSON.parse(event.body || '{}');
    const doctor = await metrics.measureOperation('UpdateDoctor', async () => {
      return await doctorService.update(id, data);
    });
    
    if (!doctor) {
      return createErrorResponse(404, 'Doctor not found', requestId, 'doctor-service');
    }
    
    await metrics.recordAPICall('UpdateDoctor', true, Date.now() - startTime);
    return createResponse(200, doctor, requestId);
  } catch (error) {
    await metrics.recordAPICall('UpdateDoctor', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to update doctor', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'doctor-service');
  }
};

export const remove: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return createErrorResponse(400, 'Doctor ID is required', requestId, 'doctor-service');
    }

    logger.info('Deleting doctor', { requestId, doctorId: id });
    
    const deleted = await metrics.measureOperation('DeleteDoctor', async () => {
      return await doctorService.delete(id);
    });
    
    if (!deleted) {
      return createErrorResponse(404, 'Doctor not found', requestId, 'doctor-service');
    }
    
    await metrics.recordAPICall('DeleteDoctor', true, Date.now() - startTime);
    return createResponse(204, null, requestId);
  } catch (error) {
    await metrics.recordAPICall('DeleteDoctor', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete doctor', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'doctor-service');
  }
};

export const list: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    logger.info('Listing doctors', { requestId });
    
    const doctors = await metrics.measureOperation('ListDoctors', async () => {
      return await doctorService.list();
    });
    
    await metrics.recordAPICall('ListDoctors', true, Date.now() - startTime);
    return createResponse(200, doctors, requestId);
  } catch (error) {
    await metrics.recordAPICall('ListDoctors', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to list doctors', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'doctor-service');
  }
};
