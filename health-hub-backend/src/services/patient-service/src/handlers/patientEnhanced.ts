/**
 * Enhanced Patient Service Handler with Operational Metrics and Health Checks
 */
import { APIGatewayProxyHandler, APIGatewayProxyEvent } from "aws-lambda";
import { PatientService } from "../services/patientService";
import { createResponse, createErrorResponse, createHealthResponse } from "../../../../utils/responseHelper";
const { StructuredLogger } = require("../../../../utils/logger.js");
const { OperationalMetrics } = require("../../../../utils/operationalMetrics.js");
const { HealthChecker } = require("../../../../utils/healthCheck.js");

const logger = new StructuredLogger('patient-service');
const metrics = new OperationalMetrics('patient-service');
const healthChecker = new HealthChecker('patient-service');
const patientService = new PatientService(process.env.USER_POOL_ID || '');

export const health: APIGatewayProxyHandler = async (event) => {
  try {
    const requestId = event.requestContext.requestId;
    const healthStatus = await healthChecker.checkHealth();
    return createHealthResponse(healthStatus.healthy, 'patient-service', requestId);
  } catch (error) {
    const requestId = event.requestContext?.requestId || 'unknown';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createHealthResponse(false, 'patient-service', requestId, { message: errorMessage });
  }
};

export const create: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    logger.info('Creating patient', { requestId });
    
    const data = JSON.parse(event.body || '{}');
    const patient = await metrics.measureOperation('CreatePatient', async () => {
      return await patientService.create(data);
    });
    
    await metrics.recordAPICall('CreatePatient', true, Date.now() - startTime);
    
    const responseTime = `${Date.now() - startTime}ms`;
    return createResponse(201, patient, requestId, responseTime);
  } catch (error) {
    await metrics.recordAPICall('CreatePatient', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create patient', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'patient-service');
  }
};

export const get: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return createErrorResponse(400, 'Patient ID is required', requestId, 'patient-service');
    }

    logger.info('Getting patient', { requestId, patientId: id });
    
    const patient = await metrics.measureOperation('GetPatient', async () => {
      return await patientService.get(id);
    });
    
    if (!patient) {
      return createErrorResponse(404, 'Patient not found', requestId, 'patient-service');
    }
    
    await metrics.recordAPICall('GetPatient', true, Date.now() - startTime);
    return createResponse(200, patient, requestId);
  } catch (error) {
    await metrics.recordAPICall('GetPatient', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get patient', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'patient-service');
  }
};

export const update: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return createErrorResponse(400, 'Patient ID is required', requestId, 'patient-service');
    }

    logger.info('Updating patient', { requestId, patientId: id });
    
    const data = JSON.parse(event.body || '{}');
    const patient = await metrics.measureOperation('UpdatePatient', async () => {
      return await patientService.update(id, data);
    });
    
    if (!patient) {
      return createErrorResponse(404, 'Patient not found', requestId, 'patient-service');
    }
    
    await metrics.recordAPICall('UpdatePatient', true, Date.now() - startTime);
    return createResponse(200, patient, requestId);
  } catch (error) {
    await metrics.recordAPICall('UpdatePatient', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to update patient', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'patient-service');
  }
};

export const remove: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return createErrorResponse(400, 'Patient ID is required', requestId, 'patient-service');
    }

    logger.info('Deleting patient', { requestId, patientId: id });
    
    const deleted = await metrics.measureOperation('DeletePatient', async () => {
      return await patientService.delete(id);
    });
    
    if (!deleted) {
      return createErrorResponse(404, 'Patient not found', requestId, 'patient-service');
    }
    
    await metrics.recordAPICall('DeletePatient', true, Date.now() - startTime);
    return createResponse(204, null, requestId);
  } catch (error) {
    await metrics.recordAPICall('DeletePatient', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete patient', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'patient-service');
  }
};

export const list: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    logger.info('Listing patients', { requestId });
    
    const patients = await metrics.measureOperation('ListPatients', async () => {
      return await patientService.list();
    });
    
    await metrics.recordAPICall('ListPatients', true, Date.now() - startTime);
    return createResponse(200, patients, requestId);
  } catch (error) {
    await metrics.recordAPICall('ListPatients', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to list patients', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'patient-service');
  }
};
