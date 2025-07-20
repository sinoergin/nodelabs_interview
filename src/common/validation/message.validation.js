import Joi from 'joi';

export const messageSchema = Joi.object({
    content: Joi.string().required(),
});
