import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";

// Define the User model
class User extends Document {
  id: string;
  cognitoId: string;
  email: string;
  role: "doctor" | "patient" | "admin";
  createdAt: Date;
  lastLogin?: Date;
}

// Create the Dynamoose schema
const UserSchema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true,
  },
  cognitoId: {
    type: String,
    index: {
      global: true,
      name: "CognitoIdIndex",
    },
  },
  email: {
    type: String,
    index: {
      global: true,
      name: "EmailIndex",
    },
  },
  role: {
    type: String,
    enum: ["doctor", "patient", "admin"],
  },
  createdAt: Date,
  lastLogin: {
    type: Date,
    required: false,
  },
});

// Create the Dynamoose model
const UserModel = dynamoose.model<User>(process.env.USER_TABLE!, UserSchema, {
  create: false,
});

export class UserService {
  private cognito: CognitoIdentityServiceProvider;

  constructor(private userPoolId: string, private clientId: string) {
    this.cognito = new CognitoIdentityServiceProvider();
  }

  async create(
    data: Omit<User, "id" | "createdAt" | "lastLogin">
  ): Promise<User> {
    try {
      // Register user in Cognito
      const cognitoUser = await this.cognito
        .adminCreateUser({
          UserPoolId: this.userPoolId,
          Username: data.email,
          UserAttributes: [
            { Name: "email", Value: data.email },
            { Name: "custom:role", Value: data.role },
          ],
          MessageAction: "SUPPRESS",
        })
        .promise();
      if (cognitoUser.User) {
        await this.cognito
          .adminSetUserPassword({
            //@ts-ignore
            Password: data.password,
            UserPoolId: this.userPoolId,
            Username: data.email,
            Permanent: true,
          })
          .promise();
      }
      // Create user in DynamoDB
      const newUser = new UserModel({
        id: cognitoUser.User!.Username!,
        cognitoId: cognitoUser.User!.Username!,
        email: data.email,
        role: data.role,
        createdAt: new Date(),
      });

      await newUser.save();
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async get(id: string): Promise<User | null> {
    try {
      const user = await UserModel.get(id);
      return user || null;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  async update(
    id: string,
    data: Partial<Omit<User, "id" | "cognitoId" | "createdAt">>
  ): Promise<User> {
    try {
      const user = await UserModel.update({ id }, data);

      // Update Cognito attributes if email or role is changed
      if (data.email || data.role) {
        await this.cognito
          .adminUpdateUserAttributes({
            UserPoolId: this.userPoolId,
            Username: user.cognitoId,
            UserAttributes: [
              ...(data.email ? [{ Name: "email", Value: data.email }] : []),
              ...(data.role ? [{ Name: "custom:role", Value: data.role }] : []),
            ],
          })
          .promise();
      }

      return user;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const user = await this.get(id);
      if (!user) {
        throw new Error("User not found");
      }

      // Delete user from Cognito
      await this.cognito
        .adminDeleteUser({
          UserPoolId: this.userPoolId,
          Username: user.cognitoId,
        })
        .promise();

      // Delete user from DynamoDB
      await UserModel.delete(id);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  async list(filter?: Partial<User>): Promise<User[]> {
    try {
      let scan = UserModel.scan();

      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          scan = scan.filter(key).eq(value);
        });
      }

      const users = await scan.exec();
      return users;
    } catch (error) {
      console.error("Error listing users:", error);
      throw error;
    }
  }

  async findByCognitoId(cognitoId: string): Promise<User | null> {
    try {
      const users = await UserModel.query("cognitoId").eq(cognitoId).exec();
      return users[0] || null;
    } catch (error) {
      console.error("Error finding user by Cognito ID:", error);
      throw error;
    }
  }
  async authenticate(email: string, password: string): Promise<any> {
    try {
      const response = await this.cognito
        .adminInitiateAuth({
          AuthFlow: "ADMIN_NO_SRP_AUTH",
          UserPoolId: this.userPoolId,
          ClientId: this.clientId!,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
          },
        })
        .promise();

      if (!response.AuthenticationResult) {
        throw new Error("Authentication failed");
      }

      return {
        token: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        user: {
          email: email,
        },
      };
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  }

  async getUserRole(email: string): Promise<string> {
    try {
      const params = {
        UserPoolId: this.userPoolId,
        Username: email,
      };
      const userData = await this.cognito.adminGetUser(params).promise();
      const roleAttribute = userData.UserAttributes?.find(
        (attr) => attr.Name === "custom:role"
      );
      return roleAttribute?.Value || "unknown";
    } catch (error) {
      console.error("Error getting user role:", error);
      throw error;
    }
  }
}
