
import Joi from 'joi';

export const addCompany = (body) => {
    const schema = Joi.object({
        session: Joi.string().required(),
        name: Joi.string().required(),
    });
    const result = schema.validate(body);
    return result;
}

export const fetchCompany = (body) => {
    const schema = Joi.object({
        session: Joi.string().required(),
        uuid: Joi.string().required(),
    });
    const result = schema.validate(body);
    return result;
}
