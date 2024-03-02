import { APIGatewayProxyHandler } from "aws-lambda";
import { UserService } from "../services/userService";
import { PatientService } from "../../../patient-service/src/services/patientService";
import { DoctorService } from "../../../doctor-service/src/services/doctorService";

const userService = new UserService(
  process.env.USER_POOL_ID!,
  process.env.CLIENT_ID!
);

const patientService = new PatientService(process.env.USER_POOL_ID!);
const doctorService = new DoctorService(process.env.USER_POOL_ID!);

export const register: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing request body" }),
      };
    }

    const userData = JSON.parse(event.body);

    // Validar os campos necessários
    if (
      !userData.email ||
      !userData.password ||
      !userData.role ||
      !userData.firstName ||
      !userData.lastName
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Criar o usuário no Cognito
    const user = await userService.create({
      email: userData.email,
      //@ts-ignore
      password: userData.password,
      role: userData.role,
    });

    // Criar o perfil específico com base na role
    let profile;
    if (userData.role === "patient") {
      //@ts-ignore
      profile = await patientService.create({
        userId: user.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        dateOfBirth: new Date(userData.dateOfBirth),
        gender: userData.gender,
        contactNumber: userData.contactNumber,
      });
    } else if (userData.role === "doctor") {
      //@ts-ignore
      profile = await doctorService.create({
        userId: user.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        specialization: userData.specialization,
        licenseNumber: userData.licenseNumber,
      });
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid role" }),
      };
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "User registered successfully",
        userId: user.id,
        profileId: profile.id,
      }),
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to register user" }),
    };
  }
};
export const login: APIGatewayProxyHandler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body!);

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email and password are required" }),
      };
    }

    const authResult = await userService.authenticate(email, password);

    // Obter o papel do usuário
    const role = await userService.getUserRole(email);

    return {
      statusCode: 200,
      body: JSON.stringify({
        token: authResult.token,
        refreshToken: authResult.refreshToken,
        user: {
          email: email,
          role: role,
        },
      }),
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Authentication failed" }),
    };
  }
};
