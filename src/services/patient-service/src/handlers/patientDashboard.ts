import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";

/**
 * Patient Dashboard Handler
 * 
 * Simplified patient service that works with the frontend dashboard
 * Matches the original HealthHub design patterns
 */

// Types and Interfaces
interface Patient {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: "male" | "female" | "other";
  contactNumber?: string;
  email?: string;
  medicalHistory?: Array<{
    condition: string;
    diagnosisDate: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

// Constants
const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Demo patients for dashboard testing
const DEMO_PATIENTS: Patient[] = [
  {
    id: "patient-1",
    userId: "user-1",
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1990-01-15",
    gender: "male",
    contactNumber: "555-0123",
    email: "john.doe@example.com",
    medicalHistory: [
      {
        condition: "Hypertension",
        diagnosisDate: "2023-01-15",
        notes: "Well controlled with medication"
      },
      {
        condition: "Type 2 Diabetes",
        diagnosisDate: "2022-06-10",
        notes: "Managing with diet and exercise"
      }
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-08-25T00:00:00.000Z"
  },
  {
    id: "patient-2", 
    userId: "user-2",
    firstName: "Jane",
    lastName: "Smith",
    dateOfBirth: "1985-03-22",
    gender: "female",
    contactNumber: "555-0456",
    email: "jane.smith@example.com",
    medicalHistory: [
      {
        condition: "Asthma",
        diagnosisDate: "2020-09-12",
        notes: "Seasonal triggers, uses inhaler"
      }
    ],
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-08-25T00:00:00.000Z"
  },
  {
    id: "patient-3",
    userId: "user-3", 
    firstName: "Michael",
    lastName: "Johnson",
    dateOfBirth: "1978-11-08",
    gender: "male",
    contactNumber: "555-0789",
    email: "michael.johnson@example.com",
    medicalHistory: [],
    createdAt: "2024-01-03T00:00:00.000Z"
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
 * Find patient by ID
 */
function findPatientById(id: string): Patient | undefined {
  return DEMO_PATIENTS.find(patient => patient.id === id || patient.userId === id);
}

/**
 * Handler Functions
 */

/**
 * Create patient
 * POST /patients
 */
export const create: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('👤 Creating new patient');
    
    const patientData = validateRequestBody(event.body);
    
    // Validate required fields
    if (!patientData.firstName || !patientData.lastName || !patientData.dateOfBirth) {
      return createErrorResponse(400, 'Missing required fields: firstName, lastName, and dateOfBirth are required');
    }

    const newPatient: Patient = {
      id: uuidv4(),
      userId: patientData.userId || uuidv4(),
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      dateOfBirth: patientData.dateOfBirth,
      gender: patientData.gender,
      contactNumber: patientData.contactNumber,
      email: patientData.email,
      medicalHistory: patientData.medicalHistory || [],
      createdAt: new Date().toISOString()
    };

    // In production, would save to DynamoDB
    DEMO_PATIENTS.push(newPatient);

    console.log(`✅ Patient created: ${newPatient.firstName} ${newPatient.lastName}`);
    return createResponse(201, newPatient);

  } catch (error: any) {
    console.error('❌ Error creating patient:', error);
    return createErrorResponse(500, 'Failed to create patient', error.message);
  }
};

/**
 * Get patient by ID
 * GET /patients/{id}
 */
export const get: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const patientId = event.pathParameters?.id;
    
    if (!patientId) {
      return createErrorResponse(400, 'Patient ID is required in path parameters');
    }

    console.log(`👤 Getting patient: ${patientId}`);

    const patient = findPatientById(patientId);
    
    if (!patient) {
      console.log(`❌ Patient not found: ${patientId}`);
      return createErrorResponse(404, 'Patient not found');
    }

    console.log(`✅ Patient found: ${patient.firstName} ${patient.lastName}`);
    return createResponse(200, patient);

  } catch (error: any) {
    console.error('❌ Error getting patient:', error);
    return createErrorResponse(500, 'Failed to get patient', error.message);
  }
};

/**
 * List all patients
 * GET /patients
 */
export const list: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('👥 Listing all patients');

    // In production, would query DynamoDB with pagination
    const patients = DEMO_PATIENTS.map(patient => ({
      id: patient.id,
      userId: patient.userId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      contactNumber: patient.contactNumber,
      email: patient.email,
      createdAt: patient.createdAt
    }));

    console.log(`✅ Retrieved ${patients.length} patients`);
    return createResponse(200, patients);

  } catch (error: any) {
    console.error('❌ Error listing patients:', error);
    return createErrorResponse(500, 'Failed to list patients', error.message);
  }
};

/**
 * Update patient
 * PUT /patients/{id}
 */
export const update: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const patientId = event.pathParameters?.id;
    
    if (!patientId) {
      return createErrorResponse(400, 'Patient ID is required in path parameters');
    }

    const updateData = validateRequestBody(event.body);
    
    console.log(`👤 Updating patient: ${patientId}`);

    const patientIndex = DEMO_PATIENTS.findIndex(p => p.id === patientId || p.userId === patientId);
    
    if (patientIndex === -1) {
      return createErrorResponse(404, 'Patient not found');
    }

    // Update patient data
    const updatedPatient = {
      ...DEMO_PATIENTS[patientIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    DEMO_PATIENTS[patientIndex] = updatedPatient;

    console.log(`✅ Patient updated: ${updatedPatient.firstName} ${updatedPatient.lastName}`);
    return createResponse(200, updatedPatient);

  } catch (error: any) {
    console.error('❌ Error updating patient:', error);
    return createErrorResponse(500, 'Failed to update patient', error.message);
  }
};

/**
 * Delete patient
 * DELETE /patients/{id}
 */
export const remove: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const patientId = event.pathParameters?.id;
    
    if (!patientId) {
      return createErrorResponse(400, 'Patient ID is required in path parameters');
    }

    console.log(`👤 Deleting patient: ${patientId}`);

    const patientIndex = DEMO_PATIENTS.findIndex(p => p.id === patientId || p.userId === patientId);
    
    if (patientIndex === -1) {
      return createErrorResponse(404, 'Patient not found');
    }

    const deletedPatient = DEMO_PATIENTS[patientIndex];
    DEMO_PATIENTS.splice(patientIndex, 1);

    console.log(`✅ Patient deleted: ${deletedPatient.firstName} ${deletedPatient.lastName}`);
    
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: "",
    };

  } catch (error: any) {
    console.error('❌ Error deleting patient:', error);
    return createErrorResponse(500, 'Failed to delete patient', error.message);
  }
};

/**
 * Add medical history entry
 * POST /patients/{id}/medical-history
 */
export const addMedicalHistory: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const patientId = event.pathParameters?.id;
    
    if (!patientId) {
      return createErrorResponse(400, 'Patient ID is required in path parameters');
    }

    const historyEntry = validateRequestBody(event.body);
    
    console.log(`📋 Adding medical history for patient: ${patientId}`);

    const patientIndex = DEMO_PATIENTS.findIndex(p => p.id === patientId || p.userId === patientId);
    
    if (patientIndex === -1) {
      return createErrorResponse(404, 'Patient not found');
    }

    // Add medical history entry
    const patient = DEMO_PATIENTS[patientIndex];
    if (!patient.medicalHistory) {
      patient.medicalHistory = [];
    }

    const newEntry = {
      condition: historyEntry.condition,
      diagnosisDate: historyEntry.diagnosisDate || new Date().toISOString(),
      notes: historyEntry.notes
    };

    patient.medicalHistory.push(newEntry);
    patient.updatedAt = new Date().toISOString();

    console.log(`✅ Medical history added for: ${patient.firstName} ${patient.lastName}`);
    return createResponse(200, patient);

  } catch (error: any) {
    console.error('❌ Error adding medical history:', error);
    return createErrorResponse(500, 'Failed to add medical history', error.message);
  }
};
