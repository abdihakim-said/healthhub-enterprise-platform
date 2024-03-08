import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";
import { CognitoIdentityServiceProvider } from "aws-sdk";

// Define the Doctor model
class Doctor extends Document {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  specialization: string;
  licenseNumber: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Create the Dynamoose schema
const DoctorSchema = new dynamoose.Schema({
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
  specialization: {
    type: String,
    index: {
      global: true,
      name: "SpecializationIndex",
    },
  },
  licenseNumber: String,
  createdAt: Date,
  updatedAt: {
    type: Date,
    required: false,
  },
});

// Create the Dynamoose model
const DoctorModel = dynamoose.model<Doctor>(
  process.env.DOCTOR_TABLE!,
  DoctorSchema,
  {
    create: false,
  }
);

export class DoctorService {
  private cognito: CognitoIdentityServiceProvider;

  constructor(private userPoolId: string) {
    this.cognito = new CognitoIdentityServiceProvider();
  }

  async create(
    data: Omit<Doctor, "id" | "createdAt" | "updatedAt">
  ): Promise<Doctor> {
    try {
      // Verify that the user exists in Cognito and has the 'doctor' role
      const cognitoUser = await this.cognito
        .adminGetUser({
          UserPoolId: this.userPoolId,
          Username: data.userId,
        })
        .promise();

      const userRole = cognitoUser.UserAttributes?.find(
        (attr) => attr.Name === "custom:role"
      )?.Value;
      if (userRole !== "doctor") {
        throw new Error("User is not authorized to be a doctor");
      }

      // Create doctor in DynamoDB
      const newDoctor = new DoctorModel({
        ...data,
        id: data.userId,
        createdAt: new Date(),
      });

      await newDoctor.save();
      return newDoctor;
    } catch (error) {
      console.error("Error creating doctor:", error);
      throw error;
    }
  }

  async get(id: string): Promise<Doctor | null> {
    try {
      const doctor = await DoctorModel.get(id);
      return doctor || null;
    } catch (error) {
      console.error("Error getting doctor:", error);
      throw error;
    }
  }

  async update(
    id: string,
    data: Partial<Omit<Doctor, "id" | "userId" | "createdAt">>
  ): Promise<Doctor> {
    try {
      const updatedDoctor = await DoctorModel.update(
        { id },
        { ...data, updatedAt: new Date() }
      );
      return updatedDoctor;
    } catch (error) {
      console.error("Error updating doctor:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await DoctorModel.delete(id);
    } catch (error) {
      console.error("Error deleting doctor:", error);
      throw error;
    }
  }

  async list(filter?: Partial<Doctor>): Promise<Doctor[]> {
    try {
      let scan = DoctorModel.scan();

      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          scan = scan.filter(key).eq(value);
        });
      }

      const doctors = await scan.exec();
      return doctors;
    } catch (error) {
      console.error("Error listing doctors:", error);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<Doctor | null> {
    try {
      const doctors = await DoctorModel.query("userId").eq(userId).exec();
      return doctors[0] || null;
    } catch (error) {
      console.error("Error finding doctor by User ID:", error);
      throw error;
    }
  }

  async findBySpecialization(specialization: string): Promise<Doctor[]> {
    try {
      const doctors = await DoctorModel.query("specialization")
        .eq(specialization)
        .exec();
      return doctors;
    } catch (error) {
      console.error("Error finding doctors by specialization:", error);
      throw error;
    }
  }
}
