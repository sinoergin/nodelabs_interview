import Joi from 'joi';

const registerSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
    username: Joi.string().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
    name: Joi.string().min(1).max(50).optional(),
    surname: Joi.string().min(1).max(50).optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    birthdate: Joi.date().optional(),
});

export { registerSchema, loginSchema, refreshTokenSchema, updateProfileSchema };
