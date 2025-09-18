import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";

/**
 * Doctor Dashboard Handler
 * 
 * Compatible with the original HealthHub doctor dashboard
 * Provides all data needed for dashboard statistics and functionality
 */

// Types and Interfaces
interface Doctor {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  specialization: string;
  email?: string;
  phoneNumber?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
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

// Demo doctors for dashboard testing
const DEMO_DOCTORS: Doctor[] = [
  {
    id: "doctor-1",
    userId: "user-doc-1",
    firstName: "Dr. Sarah",
    lastName: "Johnson",
    specialization: "Cardiology",
    email: "sarah.johnson@healthhub.com",
    phoneNumber: "555-0101",
    licenseNumber: "MD12345",
    yearsOfExperience: 15,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-08-25T00:00:00.000Z"
  },
  {
    id: "doctor-2",
    userId: "user-doc-2", 
    firstName: "Dr. Michael",
    lastName: "Chen",
    specialization: "Neurology",
    email: "michael.chen@healthhub.com",
    phoneNumber: "555-0102",
    licenseNumber: "MD12346",
    yearsOfExperience: 12,
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-08-25T00:00:00.000Z"
  },
  {
    id: "doctor-3",
    userId: "user-doc-3",
    firstName: "Dr. Emily",
    lastName: "Rodriguez",
    specialization: "Pediatrics",
    email: "emily.rodriguez@healthhub.com",
    phoneNumber: "555-0103",
    licenseNumber: "MD12347",
    yearsOfExperience: 8,
    createdAt: "2024-01-03T00:00:00.000Z"
  },
  {
    id: "doctor-4",
    userId: "user-doc-4",
    firstName: "Dr. James",
    lastName: "Wilson",
    specialization: "Orthopedics",
    email: "james.wilson@healthhub.com",
    phoneNumber: "555-0104",
    licenseNumber: "MD12348",
    yearsOfExperience: 20,
    createdAt: "2024-01-04T00:00:00.000Z"
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
 * Find doctor by ID
 */
function findDoctorById(id: string): Doctor | undefined {
  return DEMO_DOCTORS.find(doctor => doctor.id === id || doctor.userId === id);
}

/**
 * Handler Functions
 */

/**
 * Create doctor
 * POST /doctors
 */
export const create: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('👨‍⚕️ Creating new doctor');
    
    const doctorData = validateRequestBody(event.body);
    
    // Validate required fields
    if (!doctorData.firstName || !doctorData.lastName || !doctorData.specialization) {
      return createErrorResponse(400, 'Missing required fields: firstName, lastName, and specialization are required');
    }

    const newDoctor: Doctor = {
      id: uuidv4(),
      userId: doctorData.userId || uuidv4(),
      firstName: doctorData.firstName,
      lastName: doctorData.lastName,
      specialization: doctorData.specialization,
      email: doctorData.email,
      phoneNumber: doctorData.phoneNumber,
      licenseNumber: doctorData.licenseNumber,
      yearsOfExperience: doctorData.yearsOfExperience,
      createdAt: new Date().toISOString()
    };

    // In production, would save to DynamoDB
    DEMO_DOCTORS.push(newDoctor);

    console.log(`✅ Doctor created: ${newDoctor.firstName} ${newDoctor.lastName}`);
    return createResponse(201, newDoctor);

  } catch (error: any) {
    console.error('❌ Error creating doctor:', error);
    return createErrorResponse(500, 'Failed to create doctor', error.message);
  }
};

/**
 * Get doctor by ID
 * GET /doctors/{id}
 */
export const get: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const doctorId = event.pathParameters?.id;
    
    if (!doctorId) {
      return createErrorResponse(400, 'Doctor ID is required in path parameters');
    }

    console.log(`👨‍⚕️ Getting doctor: ${doctorId}`);

    const doctor = findDoctorById(doctorId);
    
    if (!doctor) {
      console.log(`❌ Doctor not found: ${doctorId}`);
      return createErrorResponse(404, 'Doctor not found');
    }

    console.log(`✅ Doctor found: ${doctor.firstName} ${doctor.lastName}`);
    return createResponse(200, doctor);

  } catch (error: any) {
    console.error('❌ Error getting doctor:', error);
    return createErrorResponse(500, 'Failed to get doctor', error.message);
  }
};

/**
 * List all doctors (Dashboard compatible)
 * GET /doctors
 */
export const list: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('👨‍⚕️ Listing all doctors for dashboard');

    const specialization = event.queryStringParameters?.specialization;
    
    let doctors = DEMO_DOCTORS;
    
    // Filter by specialization if provided
    if (specialization) {
      doctors = DEMO_DOCTORS.filter(doctor => 
        doctor.specialization.toLowerCase().includes(specialization.toLowerCase())
      );
      console.log(`🔍 Filtered by specialization: ${specialization}, found ${doctors.length} doctors`);
    }

    // Return format compatible with dashboard
    const doctorList = doctors.map(doctor => ({
      id: doctor.id,
      userId: doctor.userId,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specialization: doctor.specialization,
      email: doctor.email,
      phoneNumber: doctor.phoneNumber,
      yearsOfExperience: doctor.yearsOfExperience,
      createdAt: doctor.createdAt
    }));

    console.log(`✅ Retrieved ${doctorList.length} doctors for dashboard`);
    return createResponse(200, doctorList);

  } catch (error: any) {
    console.error('❌ Error listing doctors:', error);
    return createErrorResponse(500, 'Failed to list doctors', error.message);
  }
};

/**
 * Update doctor
 * PUT /doctors/{id}
 */
export const update: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const doctorId = event.pathParameters?.id;
    
    if (!doctorId) {
      return createErrorResponse(400, 'Doctor ID is required in path parameters');
    }

    const updateData = validateRequestBody(event.body);
    
    console.log(`👨‍⚕️ Updating doctor: ${doctorId}`);

    const doctorIndex = DEMO_DOCTORS.findIndex(d => d.id === doctorId || d.userId === doctorId);
    
    if (doctorIndex === -1) {
      return createErrorResponse(404, 'Doctor not found');
    }

    // Update doctor data
    const updatedDoctor = {
      ...DEMO_DOCTORS[doctorIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    DEMO_DOCTORS[doctorIndex] = updatedDoctor;

    console.log(`✅ Doctor updated: ${updatedDoctor.firstName} ${updatedDoctor.lastName}`);
    return createResponse(200, updatedDoctor);

  } catch (error: any) {
    console.error('❌ Error updating doctor:', error);
    return createErrorResponse(500, 'Failed to update doctor', error.message);
  }
};

/**
 * Delete doctor
 * DELETE /doctors/{id}
 */
export const remove: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const doctorId = event.pathParameters?.id;
    
    if (!doctorId) {
      return createErrorResponse(400, 'Doctor ID is required in path parameters');
    }

    console.log(`👨‍⚕️ Deleting doctor: ${doctorId}`);

    const doctorIndex = DEMO_DOCTORS.findIndex(d => d.id === doctorId || d.userId === doctorId);
    
    if (doctorIndex === -1) {
      return createErrorResponse(404, 'Doctor not found');
    }

    const deletedDoctor = DEMO_DOCTORS[doctorIndex];
    DEMO_DOCTORS.splice(doctorIndex, 1);

    console.log(`✅ Doctor deleted: ${deletedDoctor.firstName} ${deletedDoctor.lastName}`);
    
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: "",
    };

  } catch (error: any) {
    console.error('❌ Error deleting doctor:', error);
    return createErrorResponse(500, 'Failed to delete doctor', error.message);
  }
};

/**
 * Find doctors by specialization
 * GET /doctors?specialization={specialization}
 */
export const findBySpecialization: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const specialization = event.queryStringParameters?.specialization;
    
    if (!specialization) {
      return createErrorResponse(400, 'Specialization query parameter is required');
    }

    console.log(`🔍 Finding doctors by specialization: ${specialization}`);

    const doctors = DEMO_DOCTORS.filter(doctor => 
      doctor.specialization.toLowerCase().includes(specialization.toLowerCase())
    );

    console.log(`✅ Found ${doctors.length} doctors with specialization: ${specialization}`);
    return createResponse(200, doctors);

  } catch (error: any) {
    console.error('❌ Error finding doctors by specialization:', error);
    return createErrorResponse(500, 'Failed to find doctors by specialization', error.message);
  }
};
