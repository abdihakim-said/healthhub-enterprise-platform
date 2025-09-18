import { APIGatewayProxyHandler } from "aws-lambda";
import { UserService } from "../services/userService";
import { validateBody, validatePathParam } from "../middleware/validation";
import { createUserSchema, updateUserSchema, userIdSchema } from "../validation/schemas";

const userService = new UserService(
  process.env.USER_POOL_ID!,
  process.env.CLIENT_ID!
);

export const create: APIGatewayProxyHandler = async (event) => {
  try {
    const data = validateBody(createUserSchema)(event);
    const user = await userService.create(data);
    return {
      statusCode: 201,
      body: JSON.stringify(user),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create user";
    const statusCode = message.includes('Validation error') ? 400 : 500;
    return {
      statusCode,
      body: JSON.stringify({ error: message }),
    };
  }
};

export const get: APIGatewayProxyHandler = async (event) => {
  try {
    const id = validatePathParam(userIdSchema)(event, 'id');
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
    const message = error instanceof Error ? error.message : "Could not retrieve user";
    const statusCode = message.includes('Invalid id') ? 400 : 500;
    return {
      statusCode,
      body: JSON.stringify({ error: message }),
    };
  }
};

export const update: APIGatewayProxyHandler = async (event) => {
  try {
    const id = validatePathParam(userIdSchema)(event, 'id');
    const data = validateBody(updateUserSchema)(event);
    const user = await userService.update(id, data);
    return {
      statusCode: 200,
      body: JSON.stringify(user),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update user";
    const statusCode = message.includes('Validation error') || message.includes('Invalid id') ? 400 : 500;
    return {
      statusCode,
      body: JSON.stringify({ error: message }),
    };
  }
};

export const del: APIGatewayProxyHandler = async (event) => {
  try {
    const id = validatePathParam(userIdSchema)(event, 'id');
    await userService.delete(id);
    return {
      statusCode: 204,
      body: "",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete user";
    const statusCode = message.includes('Invalid id') ? 400 : 500;
    return {
      statusCode,
      body: JSON.stringify({ error: message }),
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
