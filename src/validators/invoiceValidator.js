import Joi from 'joi';

export const login = (body) => {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
        client: Joi.string().required()
    });
    const result = schema.validate(body);
    return result;
}

export const register = (body) => {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        client: Joi.string().required()
    });
    const result = schema.validate(body);
    return result;
}

export const ping = (body) => {
    const schema = Joi.object({
        session: Joi.string().required(),
    });
    const result = schema.validate(body);
    return result;
}