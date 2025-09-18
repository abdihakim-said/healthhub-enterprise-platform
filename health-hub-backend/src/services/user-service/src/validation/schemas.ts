import Joi from 'joi';

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
  dateOfBirth: Joi.date().max('now').optional()
});

export const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  name: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
  dateOfBirth: Joi.date().max('now').optional()
}).min(1);

export const userIdSchema = Joi.string().uuid().required();
