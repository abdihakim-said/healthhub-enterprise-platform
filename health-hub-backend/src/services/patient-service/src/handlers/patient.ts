import { APIGatewayProxyHandler } from "aws-lambda";
import { PatientService } from "../services/patientService";

const patientService = new PatientService(process.env.USER_POOL_ID || "");

export const create: APIGatewayProxyHandler = async (event) => {
  try {
    const data = JSON.parse(event.body!);
    const patient = await patientService.create(data);
    return {
      statusCode: 201,
      body: JSON.stringify(patient),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not create patient" }),
    };
  }
};

export const get: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    const patient = await patientService.get(id);
    if (!patient) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Patient not found" }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(patient),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not retrieve patient" }),
    };
  }
};

export const update: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    const data = JSON.parse(event.body!);
    const patient = await patientService.update(id, data);
    return {
      statusCode: 200,
      body: JSON.stringify(patient),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not update patient" }),
    };
  }
};

export const del: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    await patientService.delete(id);
    return {
      statusCode: 204,
      body: "",
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not delete patient" }),
    };
  }
};

export const list: APIGatewayProxyHandler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
  };

  try {
    const patients = await patientService.list();
    
    // If no patients exist, return demo patients
    if (!patients || patients.length === 0) {
      const demoPatients = [
        {
          id: "patient-1",
          userId: "demo@healthhub.com",
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: "1985-03-15",
          gender: "male",
          contactNumber: "+1-555-0123",
          medicalHistory: [
            {
              condition: "Hypertension",
              diagnosisDate: "2023-01-15",
              notes: "Well controlled with medication"
            }
          ],
          createdAt: new Date().toISOString()
        }
      ];
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(demoPatients),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(patients),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Could not list patients" }),
    };
  }
};

export const addMedicalHistory: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    const entry = JSON.parse(event.body!);
    const patient = await patientService.addMedicalHistoryEntry(id, entry);
    return {
      statusCode: 200,
      body: JSON.stringify(patient),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not add medical history entry" }),
    };
  }
};
