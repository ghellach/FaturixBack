import Joi from 'joi';

export const add = body => {
    const schema = Joi.object({
        session: Joi.string().required(),
        name: Joi.string().required(),
        unitPrice: Joi.number().required(),
        currency: Joi.string().required().uuid(),
        unitTaxes: Joi.array(),
        previousBlock: Joi.string().uuid()
    });
    const result = schema.validate(body);
    return result;
}

export const onlyUUID = body => {
    const schema = Joi.object({
        session: Joi.string().required(),
        uuid: Joi.string().required(),
    });
    const result = schema.validate(body);
    return result;
}

export const updateQuantity = body => {
    const schema = Joi.object({
        session: Joi.string().required(),
        uuid: Joi.string().required(),
        quantity: Joi.number().required(),
        status: Joi.number().required()
    });
    const result = schema.validate(body);
    return result;
}

export const search = body => {
    const schema = Joi.object({
        session: Joi.string().required(),
        search: Joi.string().required(),
        currency: Joi.string().required()
    });
    const result = schema.validate(body);
    return result;
}