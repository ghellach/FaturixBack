import Joi from 'joi';

export const addInvoice = (body) => {
    const schema = Joi.object({
        session: Joi.string().required(),
        products: Joi.array().required(),
        currency: Joi.string().uuid().required(),
        taxes: Joi.array().required(),
        customerDetails: Joi.object().required(),
        reduction: Joi.object(),
        invoice: Joi.string().uuid()
    });
    const result = schema.validate(body);
    return result;
}