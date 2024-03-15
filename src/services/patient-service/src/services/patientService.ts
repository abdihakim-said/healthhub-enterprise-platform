import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";
import { CognitoIdentityServiceProvider } from "aws-sdk";

// Define the Patient model
class Patient extends Document {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender?: "male" | "female" | "other";
  contactNumber?: string;
  medicalHistory?: Array<{
    condition: string;
    diagnosisDate: Date;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt?: Date;
}

// Create the Dynamoose schema
const PatientSchema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true,
  },
  userId: {
    type: String,
    index: {
      global: true,
      name: "UserIdIndex",
    },
  },
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: false,
  },
  contactNumber: {
    type: String,
    required: false,
  },
  medicalHistory: {
    type: Array,
    schema: [
      {
        type: Object,
        schema: {
          condition: String,
          diagnosisDate: Date,
          notes: {
            type: String,
            required: false,
          },
        },
      },
    ],
    required: false,
  },
  createdAt: Date,
  updatedAt: {
    type: Date,
    required: false,
  },
});

// Create the Dynamoose model
const PatientModel = dynamoose.model<Patient>(
  process.env.PATIENT_TABLE!,
  PatientSchema,
  {
    create: false,
  }
);

export class PatientService {
  private cognito: CognitoIdentityServiceProvider;

  constructor(private userPoolId: string) {
    this.cognito = new CognitoIdentityServiceProvider();
  }

  async create(
    data: Omit<Patient, "id" | "createdAt" | "updatedAt">
  ): Promise<Patient> {
    try {
      // Verify that the user exists in Cognito and has the 'patient' role
      const cognitoUser = await this.cognito
        .adminGetUser({
          UserPoolId: this.userPoolId,
          Username: data.userId,
        })
        .promise();

      const userRole = cognitoUser.UserAttributes?.find(
        (attr) => attr.Name === "custom:role"
      )?.Value;
      if (userRole !== "patient") {
        throw new Error("User is not authorized to be a patient");
      }

      // Create patient in DynamoDB
      const newPatient = new PatientModel({
        ...data,
        id: data.userId,
        createdAt: new Date(),
      });

      await newPatient.save();
      return newPatient;
    } catch (error) {
      console.error("Error creating patient:", error);
      throw error;
    }
  }

  async get(id: string): Promise<Patient | null> {
    try {
      const patient = await PatientModel.get(id);
      return patient || null;
    } catch (error) {
      console.error("Error getting patient:", error);
      throw error;
    }
  }

  async update(
    id: string,
    data: Partial<Omit<Patient, "id" | "userId" | "createdAt">>
  ): Promise<Patient> {
    try {
      const updatedPatient = await PatientModel.update(
        { id },
        { ...data, updatedAt: new Date() }
      );
      return updatedPatient;
    } catch (error) {
      console.error("Error updating patient:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await PatientModel.delete(id);
    } catch (error) {
      console.error("Error deleting patient:", error);
      throw error;
    }
  }

  async list(filter?: Partial<Patient>): Promise<Patient[]> {
    try {
      let scan = PatientModel.scan();

      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          scan = scan.filter(key).eq(value);
        });
      }

      const patients = await scan.exec();
      return patients;
    } catch (error) {
      console.error("Error listing patients:", error);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<Patient | null> {
    try {
      const patients = await PatientModel.query("userId").eq(userId).exec();
      return patients[0] || null;
    } catch (error) {
      console.error("Error finding patient by User ID:", error);
      throw error;
    }
  }

  async addMedicalHistoryEntry(
    id: string,
    entry: { condition: string; diagnosisDate: Date; notes?: string }
  ): Promise<Patient> {
    try {
      const patient = await this.get(id);
      if (!patient) {
        throw new Error("Patient not found");
      }
      let medicalHistory;
      if (patient.medicalHistory) {
        medicalHistory = [...patient.medicalHistory, entry];
      } else {
        medicalHistory = [entry];
      }
      const updatedPatient = await PatientModel.update(
        { id },
        {
          medicalHistory,
          updatedAt: new Date(),
        }
      );

      return updatedPatient;
    } catch (error) {
      console.error("Error adding medical history entry:", error);
      throw error;
    }
  }
}
