import { APIGatewayProxyHandler } from "aws-lambda";
import { DoctorService } from "../services/doctorService";

const doctorService = new DoctorService(process.env.USER_POOL_ID!);

export const create: APIGatewayProxyHandler = async (event) => {
  try {
    const data = JSON.parse(event.body!);
    const doctor = await doctorService.create(data);
    return {
      statusCode: 201,
      body: JSON.stringify(doctor),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not create doctor" }),
    };
  }
};

export const get: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    const doctor = await doctorService.get(id);
    if (!doctor) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Doctor not found" }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(doctor),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not retrieve doctor" }),
    };
  }
};

export const update: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    const data = JSON.parse(event.body!);
    const doctor = await doctorService.update(id, data);
    return {
      statusCode: 200,
      body: JSON.stringify(doctor),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not update doctor" }),
    };
  }
};

export const del: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    await doctorService.delete(id);
    return {
      statusCode: 204,
      body: "",
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not delete doctor" }),
    };
  }
};

export const list: APIGatewayProxyHandler = async (event) => {
  try {
    const specialization = event.queryStringParameters?.specialization;
    let doctors;
    if (specialization) {
      doctors = await doctorService.findBySpecialization(specialization);
    } else {
      doctors = await doctorService.list();
    }
    return {
      statusCode: 200,
      body: JSON.stringify(doctors),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not list doctors" }),
    };
  }
};
