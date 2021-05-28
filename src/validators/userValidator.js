import Joi from 'joi';

export const selectCompany = (body) => {
    const schema = Joi.object({
        session: Joi.string().required(),
        uuid: Joi.string().required()
    });
    const result = schema.validate(body);
    return result;
}