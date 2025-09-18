/**
 * Enhanced Appointment Service Handler with Operational Metrics and Health Checks
 */
import { APIGatewayProxyHandler, APIGatewayProxyEvent } from "aws-lambda";
import { AppointmentService } from "../services/appointmentService";
import { createResponse, createErrorResponse, createHealthResponse } from "../../../../utils/responseHelper";
const { StructuredLogger } = require("../../../../utils/logger.js");
const { OperationalMetrics } = require("../../../../utils/operationalMetrics.js");
const { HealthChecker } = require("../../../../utils/healthCheck.js");

const logger = new StructuredLogger('appointment-service');
const metrics = new OperationalMetrics('appointment-service');
const healthChecker = new HealthChecker('appointment-service');
const appointmentService = new AppointmentService();

export const health: APIGatewayProxyHandler = async (event) => {
  try {
    const requestId = event.requestContext.requestId;
    const healthStatus = await healthChecker.checkHealth();
    return createHealthResponse(healthStatus.healthy, 'appointment-service', requestId);
  } catch (error) {
    const requestId = event.requestContext?.requestId || 'unknown';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createHealthResponse(false, 'appointment-service', requestId, { message: errorMessage });
  }
};

export const create: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    logger.info('Creating appointment', { requestId });
    
    const data = JSON.parse(event.body || '{}');
    const appointment = await metrics.measureOperation('CreateAppointment', async () => {
      return await appointmentService.create(data);
    });
    
    await metrics.recordAPICall('CreateAppointment', true, Date.now() - startTime);
    
    const responseTime = `${Date.now() - startTime}ms`;
    return createResponse(201, appointment, requestId, responseTime);
  } catch (error) {
    await metrics.recordAPICall('CreateAppointment', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create appointment', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'appointment-service');
  }
};

export const get: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return createErrorResponse(400, 'Appointment ID is required', requestId, 'appointment-service');
    }

    logger.info('Getting appointment', { requestId, appointmentId: id });
    
    const appointment = await metrics.measureOperation('GetAppointment', async () => {
      return await appointmentService.get(id);
    });
    
    if (!appointment) {
      return createErrorResponse(404, 'Appointment not found', requestId, 'appointment-service');
    }
    
    await metrics.recordAPICall('GetAppointment', true, Date.now() - startTime);
    return createResponse(200, appointment, requestId);
  } catch (error) {
    await metrics.recordAPICall('GetAppointment', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get appointment', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'appointment-service');
  }
};

export const update: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return createErrorResponse(400, 'Appointment ID is required', requestId, 'appointment-service');
    }

    logger.info('Updating appointment', { requestId, appointmentId: id });
    
    const data = JSON.parse(event.body || '{}');
    const appointment = await metrics.measureOperation('UpdateAppointment', async () => {
      return await appointmentService.update(id, data);
    });
    
    if (!appointment) {
      return createErrorResponse(404, 'Appointment not found', requestId, 'appointment-service');
    }
    
    await metrics.recordAPICall('UpdateAppointment', true, Date.now() - startTime);
    return createResponse(200, appointment, requestId);
  } catch (error) {
    await metrics.recordAPICall('UpdateAppointment', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to update appointment', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'appointment-service');
  }
};

export const remove: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return createErrorResponse(400, 'Appointment ID is required', requestId, 'appointment-service');
    }

    logger.info('Deleting appointment', { requestId, appointmentId: id });
    
    const deleted = await metrics.measureOperation('DeleteAppointment', async () => {
      return await appointmentService.delete(id);
    });
    
    if (!deleted) {
      return createErrorResponse(404, 'Appointment not found', requestId, 'appointment-service');
    }
    
    await metrics.recordAPICall('DeleteAppointment', true, Date.now() - startTime);
    return createResponse(204, null, requestId);
  } catch (error) {
    await metrics.recordAPICall('DeleteAppointment', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete appointment', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'appointment-service');
  }
};

export const list: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    logger.info('Listing appointments', { requestId });
    
    const appointments = await metrics.measureOperation('ListAppointments', async () => {
      return await appointmentService.list();
    });
    
    await metrics.recordAPICall('ListAppointments', true, Date.now() - startTime);
    return createResponse(200, appointments, requestId);
  } catch (error) {
    await metrics.recordAPICall('ListAppointments', false, Date.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to list appointments', { requestId, error: errorMessage });
    return createErrorResponse(500, errorMessage, requestId, 'appointment-service');
  }
};
