import Joi from 'joi';

export const login = (body) => {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
    });
    const result = schema.validate(body);
    return result;
}