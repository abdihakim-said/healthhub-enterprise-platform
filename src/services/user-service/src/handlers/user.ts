import { APIGatewayProxyHandler } from "aws-lambda";
import { UserService } from "../services/userService";

const userService = new UserService(
  process.env.USER_POOL_ID!,
  process.env.CLIENT_ID!
);

export const create: APIGatewayProxyHandler = async (event) => {
  try {
    const data = JSON.parse(event.body!);
    const user = await userService.create(data);
    return {
      statusCode: 201,
      body: JSON.stringify(user),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not create user" }),
    };
  }
};

export const get: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    const user = await userService.get(id);
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(user),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not retrieve user" }),
    };
  }
};

export const update: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    const data = JSON.parse(event.body!);
    const user = await userService.update(id, data);
    return {
      statusCode: 200,
      body: JSON.stringify(user),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not update user" }),
    };
  }
};

export const del: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters!.id!;
    await userService.delete(id);
    return {
      statusCode: 204,
      body: "",
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not delete user" }),
    };
  }
};

export const list: APIGatewayProxyHandler = async (event) => {
  try {
    const users = await userService.list();
    return {
      statusCode: 200,
      body: JSON.stringify(users),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not list users" }),
    };
  }
};
