import Joi from 'joi';

export const add = (body) => {
    const schema = Joi.object({
        session: Joi.string().required(),
        name: Joi.string().required(),
        unitPrice: Joi.number().required(),
        currency: Joi.string().required().uuid(),
        unitTaxes: Joi.array()
    });
    const result = schema.validate(body);
    return result;
}