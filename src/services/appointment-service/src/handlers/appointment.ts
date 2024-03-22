import { APIGatewayProxyHandler } from "aws-lambda";
import { AppointmentService } from "../services/appointmentService";

const appointmentService = new AppointmentService();

export const create: APIGatewayProxyHandler = async (event) => {
  try {
    const data = JSON.parse(event.body!);
    const appointment = await appointmentService.create(data);
    return {
      statusCode: 201,
      body: JSON.stringify(appointment),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not create appointment" }),
    };
  }
};

export const get: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    const appointment = await appointmentService.get(id);
    if (!appointment) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Appointment not found" }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(appointment),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not retrieve appointment" }),
    };
  }
};

export const update: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    const data = JSON.parse(event.body!);
    const appointment = await appointmentService.update(id, data);
    return {
      statusCode: 200,
      body: JSON.stringify(appointment),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not update appointment" }),
    };
  }
};

export const del: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    await appointmentService.delete(id);
    return {
      statusCode: 204,
      body: "",
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not delete appointment" }),
    };
  }
};

export const list: APIGatewayProxyHandler = async (event) => {
  try {
    const { patientId, doctorId, startDate, endDate } =
      event.queryStringParameters || {};
    let appointments;

    if (patientId) {
      appointments = await appointmentService.findByPatientId(
        patientId,
        startDate,
        endDate
      );
    } else if (doctorId) {
      appointments = await appointmentService.findByDoctorId(
        doctorId,
        startDate,
        endDate
      );
    } else {
      appointments = await appointmentService.list();
    }

    return {
      statusCode: 200,
      body: JSON.stringify(appointments),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not list appointments" }),
    };
  }
};
