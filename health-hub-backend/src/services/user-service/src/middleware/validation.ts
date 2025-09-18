import { APIGatewayProxyEvent } from 'aws-lambda';
import Joi from 'joi';

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (event: APIGatewayProxyEvent) => {
    if (!event.body) {
      throw new Error('Request body is required');
    }

    const data = JSON.parse(event.body);
    const { error, value } = schema.validate(data, { stripUnknown: true });
    
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }
    
    return value;
  };
};

export const validatePathParam = (schema: Joi.Schema) => {
  return (event: APIGatewayProxyEvent, paramName: string) => {
    const value = event.pathParameters?.[paramName];
    const { error } = schema.validate(value);
    
    if (error) {
      throw new Error(`Invalid ${paramName}: ${error.details[0].message}`);
    }
    
    return value;
  };
};
